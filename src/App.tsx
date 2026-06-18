import { useTranslation } from 'react-i18next';
import { useState, useMemo, useEffect, useRef } from 'react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import RegionSwitcher from '@/components/RegionSwitcher';
import ColorPalette from '@/components/ColorPalette';
import FilterPanel from '@/components/FilterPanel';
import { AuthModal } from '@/components/AuthModal';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider, ThemeSwitcher } from '@/contexts/ThemeContext';
import { useHotUpdateSync } from '@/hooks/useHotUpdateSync';
import { updateTranslations } from '@/i18n';
import {
  Palette,
  PALETTE_LIBRARY,
  REGION_PROFILES,
} from '@/data/colors';
import { detectRegion, RegionCode } from '@/utils/regionDetector';
import { generatePaletteWithAI, GeneratePaletteParams } from '@/services/aiPaletteService';

type TabKey = 'home' | 'generator' | 'favorites';

const HOTUPDATE_BASE_URL = import.meta.env.VITE_BACKEND_API || import.meta.env.VITE_HOTUPDATE_URL || 'http://localhost:3001';

function AppContent() {
  const { t } = useTranslation('common');
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { user, isLoggedIn, logout, addToCloudFavorites, removeFromCloudFavorites, cloudFavorites } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedRoom, setSelectedRoom] = useState<Palette['room'] | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<Palette['style'] | undefined>(undefined);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | undefined>(undefined);
  const [detectedCountry, setDetectedCountry] = useState<string>('');
  const [regionLoading, setRegionLoading] = useState<boolean>(true);
  const [generatedPalette, setGeneratedPalette] = useState<Palette | null>(null);

  // AI生成相关状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiStatus, setAiStatus] = useState<{
    type: 'success' | 'fallback' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // 认证弹窗状态
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { content, loading: hotUpdateLoading, version } = useHotUpdateSync({
    baseUrl: HOTUPDATE_BASE_URL,
    enabled: import.meta.env.PROD,
  });

  const prevLocalesRef = useRef<Record<string, Record<string, string>> | null>(null);

  useEffect(() => {
    if (content?.locales && content.locales !== prevLocalesRef.current) {
      updateTranslations(content.locales);
      prevLocalesRef.current = content.locales;
    }
  }, [content?.locales]);

  useEffect(() => {
    let cancelled = false;
    setRegionLoading(true);
    detectRegion()
      .then((info) => {
        if (!cancelled) {
          setSelectedRegion(info.region);
          setDetectedCountry(info.country);
          setRegionLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSelectedRegion('west');
          setRegionLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mergedPalettes = useMemo(() => {
    const remotePalettes = content?.palettes || [];
    if (remotePalettes.length > 0) {
      return remotePalettes;
    }
    return PALETTE_LIBRARY;
  }, [content?.palettes]);

  const mergedRegionParams = useMemo(() => {
    return content?.regionParams || REGION_PROFILES;
  }, [content?.regionParams]);

  const filteredPalettes = useMemo(
    () => {
      const palettes = mergedPalettes;
      return palettes.filter((p) => {
        const roomMatch = !selectedRoom || p.room === selectedRoom;
        const styleMatch = !selectedStyle || p.style === selectedStyle;
        const regionMatch = !selectedRegion || !p.region || p.region === selectedRegion;
        return roomMatch && styleMatch && regionMatch;
      });
    },
    [selectedRoom, selectedStyle, selectedRegion, mergedPalettes]
  );

  /**
   * 处理配色生成
   * 优先调用AI接口，失败时使用本地算法
   */
  const handleGenerate = async () => {
    const room = selectedRoom || 'living';
    const style = selectedStyle || 'modern';
    const region = selectedRegion || 'west';

    setIsGenerating(true);
    setAiStatus({ type: null, message: '' });

    // 清除之前的状态
    setTimeout(() => {
      setAiStatus({ type: null, message: '' });
    }, 3000);

    try {
      // 调用AI接口生成配色
      const params: GeneratePaletteParams = {
        region: region as GeneratePaletteParams['region'],
        room: room as GeneratePaletteParams['room'],
        style: style as GeneratePaletteParams['style'],
      };

      const response = await generatePaletteWithAI(params);

      if (response.success && response.data.length > 0) {
        // AI成功返回配色
        const newPalette: Palette = {
          id: `ai-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: `AI Generated ${Math.round(Math.random() * 360)}°`,
          room: room as Palette['room'],
          style: style as Palette['style'],
          region: region as Palette['region'],
          colors: response.data.map((color, index) => ({
            hex: color.hex,
            name: color.name,
            role: ['background', 'primary', 'secondary', 'neutral', 'accent'][index] || 'accent',
          })),
        };

        setGeneratedPalette(newPalette);
        setActiveTab('generator');

        // 显示成功提示
        if (response.fallback) {
          setAiStatus({
            type: 'fallback',
            message: t('ai_fallback', { defaultValue: 'Using preset palette (AI service unavailable)' })
          });
        } else {
          setAiStatus({
            type: 'success',
            message: t('ai_success', { defaultValue: 'Palette generated successfully' })
          });
        }
      } else {
        // AI返回失败，使用本地算法
        await generateLocalPalette(room, style, region);
      }
    } catch (err) {
      // 网络错误或其他异常，使用本地算法
      console.error('AI generation failed, using local algorithm:', err);
      setAiStatus({
        type: 'error',
        message: t('ai_error_network', { defaultValue: 'Network error, using local algorithm' })
      });
      await generateLocalPalette(room, style, region);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * 使用本地算法生成配色（备用方案）
   */
  const generateLocalPalette = async (room: string, style: string, region: string) => {
    const profile = mergedRegionParams[region as keyof typeof mergedRegionParams] || mergedRegionParams.west;

    const baseHue = pickHue(profile.hueRanges);
    const baseSat = rand(profile.saturation[0], profile.saturation[1]);
    const baseLight = rand(profile.lightness[0], profile.lightness[1]);

    const bg = hslToRgb(baseHue, baseSat * 0.25, baseLight + 0.05);
    const primary = hslToRgb(baseHue, baseSat * 1.1, Math.max(0.25, baseLight - 0.35));
    const secondary = hslToRgb(
      (baseHue + rand(15, 35)) % 360,
      baseSat * 0.9,
      Math.max(0.35, baseLight - 0.20)
    );
    const neutralLight = rand(profile.neutralLightness?.[0] || 0.7, profile.neutralLightness?.[1] || 0.9);
    const neutral = hslToRgb(baseHue, baseSat * 0.15, neutralLight);

    const accentHue = pickHue(profile.accentHueRanges || [[15, 35], [195, 215]]);
    const accent = hslToRgb(accentHue, baseSat * 1.3, Math.max(0.3, baseLight - 0.30));

    const newPalette: Palette = {
      id: `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${profile.name || 'Generated'} ${Math.round(baseHue)}°`,
      room: room as Palette['room'],
      style: style as Palette['style'],
      region: region as Palette['region'],
      colors: [
        { hex: bg, name: 'Background', role: 'background' },
        { hex: primary, name: 'Primary', role: 'primary' },
        { hex: secondary, name: 'Secondary', role: 'secondary' },
        { hex: neutral, name: 'Neutral', role: 'neutral' },
        { hex: accent, name: 'Accent', role: 'accent' },
      ],
    };

    setGeneratedPalette(newPalette);
    setActiveTab('generator');
  };

  const tabClass = (tab: TabKey, active: boolean) =>
    `px-4 py-2 rounded-lg font-medium transition-all ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const regionTitle = selectedRegion
    ? t(`region_${selectedRegion}`)
    : t('region_all');

  if (hotUpdateLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-bg dark:to-dark-card flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-dark-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-dark-bg dark:to-dark-card transition-colors duration-300">
      {version && (
        <div className="bg-gray-800 text-gray-300 text-xs py-1 text-center">
          v{version}
        </div>
      )}

      <header className="bg-white dark:bg-dark-card shadow-sm sticky top-0 z-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 {t('welcome_title', { defaultValue: 'Decor Color Palette' })}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <RegionSwitcher
              currentRegion={selectedRegion || 'west'}
              onRegionChange={setSelectedRegion}
              country={detectedCountry}
              loading={regionLoading}
            />
            <LanguageSwitcher />
            <ThemeSwitcher />
            {/* 用户登录/菜单 */}
            {isLoggedIn ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg hover:shadow-md transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                    {user?.username}
                  </span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-2 min-w-[150px] z-30">
                    <div className="px-4 py-2 text-sm text-gray-500 border-b">
                      {user?.email || user?.username}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      {t('auth_logout', { defaultValue: 'Logout' })}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthModalMode('login');
                  setShowAuthModal(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:shadow-md transition-all"
              >
                {t('auth_login_title', { defaultValue: 'Login' })}
              </button>
            )}
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 py-3 border-t flex gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className={tabClass('home', activeTab === 'home')}
          >
            🏠 {t('nav_home', { defaultValue: 'Home' })}
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={tabClass('generator', activeTab === 'generator')}
          >
            🎨 {t('nav_generator', { defaultValue: 'Generator' })}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={tabClass('favorites', activeTab === 'favorites')}
          >
            ❤️ {t('nav_favorite', { defaultValue: 'Favorites' })} ({favorites.length})
          </button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'home' && (
          <section className="mb-8">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                {t('welcome_title', { defaultValue: 'Discover Perfect Colors' })}
              </h2>
              <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                {t('welcome_desc', { defaultValue: 'Discover perfect color palettes for your home decoration' })}
              </p>
              <p className="text-sm text-purple-600 font-medium mb-4">
                🌐 {t('currently_showing', { region: regionTitle, defaultValue: `Currently showing: {{region}}` })}
              </p>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    {t('ai_loading', { defaultValue: 'Generating...' })}
                  </>
                ) : (
                  <>🚀 {t('btn_generate', { defaultValue: 'Generate Palette' })}</>
                )}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
              {(['living', 'bedroom', 'kitchen', 'bathroom'] as Palette['room'][]).map(
                (roomKey) => (
                  <button
                    key={roomKey}
                    onClick={() => {
                      setSelectedRoom(roomKey);
                      setActiveTab('generator');
                    }}
                    className="bg-white rounded-2xl shadow-md p-6 text-center hover:shadow-xl hover:scale-105 transition-all"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-3" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t(`room_${roomKey}`, { defaultValue: roomKey })}
                    </h3>
                  </button>
                )
              )}
            </div>
          </section>
        )}

        {activeTab === 'generator' && (
          <>
            <FilterPanel
              selectedRoom={selectedRoom}
              selectedStyle={selectedStyle}
              selectedRegion={selectedRegion}
              onRoomChange={setSelectedRoom}
              onStyleChange={setSelectedStyle}
              onRegionChange={setSelectedRegion}
              onGenerate={handleGenerate}
              isGenerating={isGenerating}
            />

            {/* AI状态提示 */}
            {aiStatus.type && (
              <div className={`mb-6 p-4 rounded-xl text-center ${
                aiStatus.type === 'success' ? 'bg-green-100 text-green-800' :
                aiStatus.type === 'fallback' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {aiStatus.type === 'fallback' && '⚠️ '}
                {aiStatus.type === 'success' && '✅ '}
                {aiStatus.type === 'error' && '❌ '}
                {aiStatus.message}
              </div>
            )}

            {generatedPalette && (
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  ✨ {t('generated_result', { defaultValue: 'Generated Result' })}
                </h3>
                <ColorPalette
                  palette={generatedPalette}
                  isFavorite={isFavorite(generatedPalette.id)}
                  onToggleFavorite={toggleFavorite}
                />
              </div>
            )}

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {t('recommended_palettes', { defaultValue: 'Recommended Palettes' })} ({filteredPalettes.length})
              </h3>
              {filteredPalettes.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                  <div className="text-5xl mb-4">🫥</div>
                  <p className="text-gray-500 text-lg">{t('no_palettes', { defaultValue: 'No palettes found' })}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPalettes.map((palette) => (
                    <ColorPalette
                      key={palette.id}
                      palette={palette}
                      isFavorite={isFavorite(palette.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              ❤️ {t('nav_favorite', { defaultValue: 'Favorites' })} ({favorites.length})
            </h3>
            {favorites.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md">
                <div className="text-6xl mb-4">💔</div>
                <p className="text-gray-500 text-lg">{t('no_favorites', { defaultValue: 'No favorite palettes yet' })}</p>
                <button
                  onClick={() => setActiveTab('generator')}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all"
                >
                  {t('nav_generator', { defaultValue: 'Generate Palette' })}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {favorites.map((palette) => (
                  <ColorPalette
                    key={palette.id}
                    palette={palette}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-16 py-8 text-center text-gray-500 dark:text-gray-400 text-sm border-t bg-white dark:bg-dark-card transition-colors duration-300">
        <p>
          🎨 {mergedPalettes.length} {t('footer_count', { defaultValue: 'curated palettes available' })}
        </p>
      </footer>

      {/* 认证弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickRange<T>(ranges: T[]): T {
  return ranges[Math.floor(Math.random() * ranges.length)];
}

function pickHue(ranges: [number, number][]): number {
  const [lo, hi] = pickRange(ranges);
  return rand(lo, hi);
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c)).toString(16).padStart(2, '0')))
      .join('')
  ).toUpperCase();
}

function hslToRgb(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

export default App;
