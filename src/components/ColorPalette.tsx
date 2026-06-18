import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Palette } from '@/data/colors';
import { getRegionEmoji } from '@/utils/regionDetector';
import ColorCard from './ColorCard';
import { downloadPaletteImage, generateShareLink } from '@/services/exportService';
import { getDecorAdvice, getFallbackDecorAdvice } from '@/services/decorAdviceService';

interface ColorPaletteProps {
  palette: Palette;
  isFavorite: boolean;
  onToggleFavorite: (palette: Palette) => void;
}

export default function ColorPalette({
  palette,
  isFavorite,
  onToggleFavorite,
}: ColorPaletteProps) {
  const { t, i18n } = useTranslation('common');
  const [showAdvice, setShowAdvice] = useState(false);
  const [advice, setAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  // 导出图片
  const handleExportImage = async () => {
    try {
      await downloadPaletteImage(palette);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // 获取AI装修建议
  const handleGetAdvice = async () => {
    setShowAdvice(true);
    setLoadingAdvice(true);
    setAdvice('');

    try {
      const lang = i18n.language === 'zh-CN' ? 'zh-CN' : (i18n.language === 'it' ? 'it' : 'en');
      const response = await getDecorAdvice({
        paletteName: palette.name,
        colors: palette.colors,
        room: palette.room,
        style: palette.style,
        language: lang,
      });

      if (response.success && response.advice) {
        setAdvice(response.advice);
      } else {
        // 使用本地备用建议
        setAdvice(getFallbackDecorAdvice(palette.room, palette.style, lang));
      }
    } catch (err) {
      // 使用本地备用建议
      const lang = i18n.language === 'zh-CN' ? 'zh-CN' : (i18n.language === 'it' ? 'it' : 'en');
      setAdvice(getFallbackDecorAdvice(palette.room, palette.style, lang));
    } finally {
      setLoadingAdvice(false);
    }
  };

  // 分享功能
  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleCopyLink = async () => {
    const shareLink = generateShareLink(palette);
    try {
      await navigator.clipboard.writeText(shareLink);
      setShowShareMenu(false);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShareToTwitter = () => {
    const shareLink = generateShareLink(palette);
    const text = `${palette.name} - ${t('welcome_title', { defaultValue: 'Decor Color Palette' })}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareLink)}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareToFacebook = () => {
    const shareLink = generateShareLink(palette);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`, '_blank');
    setShowShareMenu(false);
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl border border-gray-100 dark:border-dark-border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-dark-text">{palette.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {palette.style} · {palette.room}
            {palette.region && (
              <span className="ml-2 inline-flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                {getRegionEmoji(palette.region)} {palette.region.toUpperCase()}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => onToggleFavorite(palette)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
            isFavorite
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isFavorite ? `♥ ${t('delete_favorite')}` : `♡ ${t('save_favorite')}`}
        </button>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {palette.colors.map((color) => (
          <ColorCard key={color.hex + color.role} color={color} size="sm" />
        ))}
      </div>

      {/* 功能按钮 */}
      <div className="flex gap-2 mt-4 justify-center">
        <button
          onClick={handleExportImage}
          className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-all flex items-center gap-1"
        >
          📥 {t('export_image', { defaultValue: 'Export' })}
        </button>
        <button
          onClick={handleGetAdvice}
          className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all flex items-center gap-1"
        >
          💡 {t('get_advice', { defaultValue: 'Advice' })}
        </button>
        <button
          onClick={handleShare}
          className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200 transition-all flex items-center gap-1 relative"
        >
          🔗 {t('share', { defaultValue: 'Share' })}
          {/* 分享菜单 */}
          {showShareMenu && (
            <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border py-2 min-w-[120px] z-10">
              <button
                onClick={handleCopyLink}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                📋 {t('copy_link', { defaultValue: 'Copy Link' })}
              </button>
              <button
                onClick={handleShareToTwitter}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                🐦 Twitter
              </button>
              <button
                onClick={handleShareToFacebook}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
              >
                📘 Facebook
              </button>
            </div>
          )}
        </button>
      </div>

      {/* AI装修建议 */}
      {showAdvice && (
        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-purple-800">
              💡 {t('decor_advice_title', { defaultValue: 'Decor Advice' })}
            </h4>
            <button
              onClick={() => setShowAdvice(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          {loadingAdvice ? (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent"></div>
              {t('loading_advice', { defaultValue: 'Generating advice...' })}
            </div>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">{advice}</p>
          )}
        </div>
      )}

      <p className="text-xs text-center text-gray-400 mt-4">
        {t('color_palette')} · {palette.colors.length} {t('colors_unit')}
      </p>
    </div>
  );
}
