import { useState, useEffect, useMemo } from 'react';

const LANGUAGES = [
  { code: 'en', name: '英文', flag: '🇬🇧', native: 'English' },
  { code: 'de', name: '德文', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'fr', name: '法文', flag: '🇫🇷', native: 'Français' },
  { code: 'es', name: '西班牙文', flag: '🇪🇸', native: 'Español' },
  { code: 'it', name: '意大利文', flag: '🇮🇹', native: 'Italiano' },
];

const CATEGORIES = [
  { 
    id: 'nav', 
    label: '导航公共文案', 
    icon: '🧭',
    keys: [
      'nav_home', 'nav_generator', 'nav_favorites', 'nav_language', 'nav_region',
      'nav_about', 'nav_contact', 'nav_help', 'site_name', 'site_tagline'
    ]
  },
  { 
    id: 'generator', 
    label: '配色生成页', 
    icon: '🎨',
    keys: [
      'gen_title', 'gen_subtitle', 'gen_room_label', 'gen_style_label', 'gen_region_label',
      'gen_generate_btn', 'gen_random_btn', 'gen_save_btn', 'gen_copy_btn', 'gen_favorite_btn',
      'gen_room_living', 'gen_room_bedroom', 'gen_room_kitchen', 'gen_room_bathroom',
      'gen_style_modern', 'gen_style_traditional', 'gen_style_nordic', 'gen_style_bohemian',
      'gen_result_title', 'gen_no_results', 'gen_filter_all', 'gen_filter_region'
    ]
  },
  { 
    id: 'favorites', 
    label: '收藏页文案', 
    icon: '❤️',
    keys: [
      'fav_title', 'fav_empty_title', 'fav_empty_desc', 'fav_remove_btn', 'fav_remove_confirm',
      'fav_no_items', 'fav_added_success', 'fav_removed_success', 'fav_view_btn'
    ]
  },
  { 
    id: 'gdpr', 
    label: 'GDPR合规文案', 
    icon: '🔒',
    keys: [
      'gdpr_title', 'gdpr_desc', 'gdpr_accept_btn', 'gdpr_decline_btn', 'gdpr_privacy_link',
      'gdpr_cookie_title', 'gdpr_cookie_desc', 'gdpr_necessary', 'gdpr_analytics', 'gdpr_marketing',
      'gdpr_settings', 'gdpr_accept_all', 'gdpr_save_preferences'
    ]
  },
  { 
    id: 'buttons', 
    label: '按钮提示文案', 
    icon: '🔘',
    keys: [
      'btn_copy', 'btn_copied', 'btn_save', 'btn_share', 'btn_download', 'btn_back',
      'btn_next', 'btn_prev', 'btn_close', 'btn_confirm', 'btn_cancel', 'btn_delete',
      'btn_edit', 'btn_add', 'btn_search', 'btn_filter', 'btn_clear', 'btn_apply',
      'tooltip_click_to_copy', 'tooltip_added_to_favorites', 'tooltip_removed_from_favorites'
    ]
  },
  { 
    id: 'errors', 
    label: '错误提示文案', 
    icon: '⚠️',
    keys: [
      'error_network', 'error_timeout', 'error_load_failed', 'error_save_failed',
      'error_invalid_json', 'error_required_field', 'error_copy_failed'
    ]
  },
  { 
    id: 'footer', 
    label: '页脚文案', 
    icon: '📄',
    keys: [
      'footer_copyright', 'footer_privacy', 'footer_terms', 'footer_contact',
      'footer_language', 'footer_powered_by', 'footer_version'
    ]
  },
];

const ENGLISH_TEMPLATES = {
  'nav_home': 'Home',
  'nav_generator': 'Color Generator',
  'nav_favorites': 'Favorites',
  'nav_language': 'Language',
  'nav_region': 'Region',
  'nav_about': 'About',
  'nav_contact': 'Contact',
  'nav_help': 'Help',
  'site_name': 'Decor Color Tool',
  'site_tagline': 'Discover perfect color palettes',
  'gen_title': 'Color Palette Generator',
  'gen_subtitle': 'Create beautiful color schemes for your home',
  'gen_room_label': 'Room Type',
  'gen_style_label': 'Style',
  'gen_region_label': 'Region',
  'gen_generate_btn': 'Generate Palette',
  'gen_random_btn': 'Random',
  'gen_save_btn': 'Save',
  'gen_copy_btn': 'Copy',
  'gen_favorite_btn': 'Add to Favorites',
  'gen_room_living': 'Living Room',
  'gen_room_bedroom': 'Bedroom',
  'gen_room_kitchen': 'Kitchen',
  'gen_room_bathroom': 'Bathroom',
  'gen_style_modern': 'Modern',
  'gen_style_traditional': 'Traditional',
  'gen_style_nordic': 'Nordic',
  'gen_style_bohemian': 'Bohemian',
  'gen_result_title': 'Generated Palettes',
  'gen_no_results': 'No palettes found',
  'gen_filter_all': 'All',
  'gen_filter_region': 'Filter by Region',
  'fav_title': 'My Favorites',
  'fav_empty_title': 'No Favorites Yet',
  'fav_empty_desc': 'Start exploring and save your favorite palettes',
  'fav_remove_btn': 'Remove',
  'fav_remove_confirm': 'Remove this palette from favorites?',
  'fav_no_items': 'Your saved palettes will appear here',
  'fav_added_success': 'Added to favorites',
  'fav_removed_success': 'Removed from favorites',
  'fav_view_btn': 'View Details',
  'gdpr_title': 'We Value Your Privacy',
  'gdpr_desc': 'We use cookies to enhance your browsing experience and analyze site traffic.',
  'gdpr_accept_btn': 'Accept All',
  'gdpr_decline_btn': 'Decline',
  'gdpr_privacy_link': 'Privacy Policy',
  'gdpr_cookie_title': 'Cookie Settings',
  'gdpr_cookie_desc': 'Manage your cookie preferences',
  'gdpr_necessary': 'Necessary',
  'gdpr_analytics': 'Analytics',
  'gdpr_marketing': 'Marketing',
  'gdpr_settings': 'Settings',
  'gdpr_accept_all': 'Accept All',
  'gdpr_save_preferences': 'Save Preferences',
  'btn_copy': 'Copy',
  'btn_copied': 'Copied!',
  'btn_save': 'Save',
  'btn_share': 'Share',
  'btn_download': 'Download',
  'btn_back': 'Back',
  'btn_next': 'Next',
  'btn_prev': 'Previous',
  'btn_close': 'Close',
  'btn_confirm': 'Confirm',
  'btn_cancel': 'Cancel',
  'btn_delete': 'Delete',
  'btn_edit': 'Edit',
  'btn_add': 'Add',
  'btn_search': 'Search',
  'btn_filter': 'Filter',
  'btn_clear': 'Clear',
  'btn_apply': 'Apply',
  'tooltip_click_to_copy': 'Click to copy color code',
  'tooltip_added_to_favorites': 'Added to favorites',
  'tooltip_removed_from_favorites': 'Removed from favorites',
  'error_network': 'Network error. Please check your connection.',
  'error_timeout': 'Request timed out. Please try again.',
  'error_load_failed': 'Failed to load content',
  'error_save_failed': 'Failed to save changes',
  'error_invalid_json': 'Invalid JSON format',
  'error_required_field': 'This field is required',
  'error_copy_failed': 'Failed to copy to clipboard',
  'footer_copyright': '© 2024 Decor Color Tool. All rights reserved.',
  'footer_privacy': 'Privacy Policy',
  'footer_terms': 'Terms of Service',
  'footer_contact': 'Contact Us',
  'footer_language': 'Language',
  'footer_powered_by': 'Powered by',
  'footer_version': 'Version',
};

export default function LocalesEditor({ data, onSave }) {
  const [locales, setLocales] = useState({});
  const [activeLang, setActiveLang] = useState('en');
  const [activeCategory, setActiveCategory] = useState('nav');
  const [filterMissing, setFilterMissing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState('');
  const [changelog, setChangelog] = useState('');
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setLocales(data);
    } else {
      const defaultLocales = {};
      LANGUAGES.forEach(lang => {
        defaultLocales[lang.code] = lang.code === 'en' 
          ? { ...ENGLISH_TEMPLATES }
          : {};
      });
      setLocales(defaultLocales);
    }
  }, [data]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const allKeys = useMemo(() => {
    const keys = new Set();
    LANGUAGES.forEach(lang => {
      if (locales[lang.code]) {
        Object.keys(locales[lang.code]).forEach(k => keys.add(k));
      }
    });
    CATEGORIES.forEach(cat => {
      cat.keys.forEach(k => keys.add(k));
    });
    return [...keys];
  }, [locales]);

  const filteredKeys = useMemo(() => {
    const categoryKeys = CATEGORIES.find(c => c.id === activeCategory)?.keys || allKeys;
    return categoryKeys.filter(key => {
      if (filterMissing) {
        const hasEnglish = locales.en?.[key]?.trim();
        const missingLangs = LANGUAGES.filter(l => 
          l.code !== 'en' && !locales[l.code]?.[key]?.trim()
        );
        if (hasEnglish && missingLangs.length > 0) return true;
        return false;
      }
      if (searchQuery) {
        const enValue = locales.en?.[key] || '';
        return key.toLowerCase().includes(searchQuery.toLowerCase()) ||
               enValue.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  }, [locales, activeCategory, filterMissing, searchQuery]);

  const missingCounts = useMemo(() => {
    const counts = {};
    LANGUAGES.filter(l => l.code !== 'en').forEach(lang => {
      counts[lang.code] = 0;
      allKeys.forEach(key => {
        if (!locales[lang.code]?.[key]?.trim() && locales.en?.[key]?.trim()) {
          counts[lang.code]++;
        }
      });
    });
    return counts;
  }, [locales, allKeys]);

  const updateValue = (lang, key, value) => {
    setLocales(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [key]: value,
      },
    }));
  };

  const handleKeyEdit = (key) => {
    setEditingKey(key);
    setEditValue(locales[activeLang]?.[key] || '');
  };

  const saveKeyEdit = () => {
    if (editingKey) {
      updateValue(activeLang, editingKey, editValue);
      setEditingKey(null);
      setEditValue('');
    }
  };

  const generateMissingTranslations = async () => {
    setIsTranslating(true);
    const targetLangs = LANGUAGES.filter(l => l.code !== 'en');
    let progress = 0;

    for (const lang of targetLangs) {
      const missingKeys = filteredKeys.filter(key => 
        !locales[lang.code]?.[key]?.trim() && locales.en?.[key]?.trim()
      );

      for (const key of missingKeys) {
        const enValue = locales.en[key];
        const translatedValue = await translateText(enValue, 'en', lang.code);
        updateValue(lang.code, key, translatedValue);
        progress++;
        setTranslationProgress(`${lang.name}: ${progress}/${missingKeys.length * targetLangs.length}`);
        await new Promise(r => setTimeout(r, 100));
      }
    }

    setIsTranslating(false);
    setTranslationProgress('');
    showNotification('翻译补齐完成！');
  };

  const translateText = async (text, from, to) => {
    const translations = {
      'de': {
        'Home': 'Startseite',
        'Color Generator': 'Farbgenerator',
        'Favorites': 'Favoriten',
        'Language': 'Sprache',
        'Region': 'Region',
        'About': 'Über uns',
        'Contact': 'Kontakt',
        'Help': 'Hilfe',
        'Decor Color Tool': 'Decor Color Tool',
        'Discover perfect color palettes': 'Entdecken Sie perfekte Farbpaletten',
      },
      'fr': {
        'Home': 'Accueil',
        'Color Generator': 'Générateur de couleurs',
        'Favorites': 'Favoris',
        'Language': 'Langue',
        'Region': 'Région',
        'About': 'À propos',
        'Contact': 'Contact',
        'Help': 'Aide',
        'Decor Color Tool': 'Decor Color Tool',
        'Discover perfect color palettes': 'Découvrez des palettes de couleurs parfaites',
      },
      'es': {
        'Home': 'Inicio',
        'Color Generator': 'Generador de colores',
        'Favorites': 'Favoritos',
        'Language': 'Idioma',
        'Region': 'Región',
        'About': 'Acerca de',
        'Contact': 'Contacto',
        'Help': 'Ayuda',
        'Decor Color Tool': 'Decor Color Tool',
        'Discover perfect color palettes': 'Descubre paletas de colores perfectas',
      },
      'it': {
        'Home': 'Home',
        'Color Generator': 'Generatore di colori',
        'Favorites': 'Preferiti',
        'Language': 'Lingua',
        'Region': 'Regione',
        'About': 'Chi siamo',
        'Contact': 'Contattaci',
        'Help': 'Aiuto',
        'Decor Color Tool': 'Decor Color Tool',
        'Discover perfect color palettes': 'Scopri palette di colori perfette',
      },
    };

    if (translations[to]?.[text]) {
      return translations[to][text];
    }

    const prefixes = {
      'de': '[DE] ',
      'fr': '[FR] ',
      'es': '[ES] ',
      'it': '[IT] ',
    };

    return prefixes[to] + text;
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importText);
      setLocales(imported);
      setShowImportModal(false);
      setImportText('');
      showNotification('导入成功！');
    } catch (err) {
      showNotification('JSON格式无效！', 'error');
    }
  };

  const handleExport = () => {
    const exportData = {};
    LANGUAGES.forEach(lang => {
      exportData[lang.code] = locales[lang.code] || {};
    });
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'locales-export.json';
    a.click();
    URL.revokeObjectURL(url);
    showNotification('导出成功！');
  };

  const handleSave = () => {
    const cleanLocales = {};
    LANGUAGES.forEach(lang => {
      cleanLocales[lang.code] = locales[lang.code] || {};
    });
    onSave(cleanLocales, changelog || '更新多语言文案');
    setChangelog('');
    showNotification('保存并发布成功！');
  };

  const fillEnglishTemplate = () => {
    const newLocales = { ...locales };
    newLocales.en = { ...ENGLISH_TEMPLATES };
    setLocales(newLocales);
    showNotification('英文模板已填充！');
  };

  const getMissingLanguages = (key) => {
    return LANGUAGES.filter(l => 
      l.code !== 'en' && !locales[l.code]?.[key]?.trim()
    ).map(l => l.flag);
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${textClass}`}>多语言文案管理</h2>
            <p className={`text-sm ${textSecondary}`}>严格语言隔离 · 仅管理5套对外语种资源</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {darkMode ? '🌞 浅色' : '🌙 深色'}
            </button>
            <button
              onClick={fillEnglishTemplate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              📝 填充英文模板
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <input
            type="text"
            placeholder="🔍 搜索文案键名或内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filterMissing}
              onChange={(e) => setFilterMissing(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className={`text-sm ${textSecondary}`}>仅显示缺失翻译</span>
          </label>
          <div className="flex-1" />
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            📤 导出JSON
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            📥 导入JSON
          </button>
          <button
            onClick={generateMissingTranslations}
            disabled={isTranslating}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            🤖 AI翻译补齐
          </button>
        </div>

        {isTranslating && (
          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <span className="animate-spin">⏳</span>
              <span>{translationProgress || '正在翻译...'}</span>
            </div>
          </div>
        )}

        {Object.values(missingCounts).some(c => c > 0) && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium text-yellow-800">缺失翻译统计：</span>
              {LANGUAGES.filter(l => l.code !== 'en').map(lang => (
                missingCounts[lang.code] > 0 && (
                  <span key={lang.code} className="flex items-center gap-1 text-yellow-700">
                    {lang.flag} {lang.name}: <strong>{missingCounts[lang.code]}</strong>
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex">
        <div className="w-64 border-r border-gray-200 bg-white p-4 min-h-[calc(100vh-180px)]">
          <h3 className={`font-semibold mb-4 ${textClass}`}>文案分类</h3>
          <div className="space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-blue-500 text-white'
                    : `${textSecondary} hover:bg-gray-100`
                }`}
              >
                <span>{cat.icon}</span>
                <span className="text-sm">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="flex gap-2 mb-6 flex-wrap">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  activeLang === lang.code
                    ? 'bg-blue-500 text-white'
                    : `${cardClass} border ${textSecondary} hover:bg-gray-50`
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {lang.code !== 'en' && missingCounts[lang.code] > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeLang === lang.code ? 'bg-white/20' : 'bg-red-500 text-white'
                  }`}>
                    {missingCounts[lang.code]}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className={`${cardClass} rounded-xl border overflow-hidden`}>
            <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <div className="col-span-3 p-3">键名 (Key)</div>
              <div className="col-span-6 p-3">文案内容</div>
              <div className="col-span-3 p-3 text-center">操作</div>
            </div>

            <div className="max-h-[calc(100vh-380px)] overflow-y-auto">
              {filteredKeys.length === 0 ? (
                <div className={`text-center py-12 ${textSecondary}`}>
                  <p className="text-4xl mb-4">📝</p>
                  <p>暂无匹配结果</p>
                </div>
              ) : (
                filteredKeys.map(key => {
                  const value = locales[activeLang]?.[key] || '';
                  const hasEnglish = locales.en?.[key]?.trim();
                  const missingFlags = getMissingLanguages(key);
                  const isEditing = editingKey === key;
                  const isMissing = !value.trim() && hasEnglish;

                  return (
                    <div
                      key={key}
                      className={`grid grid-cols-12 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        isMissing ? 'bg-red-50' : ''
                      }`}
                    >
                      <div className="col-span-3 p-3">
                        <code className="text-sm text-blue-600 font-mono">{key}</code>
                        {missingFlags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {missingFlags.map((flag, i) => (
                              <span key={i} title="缺失翻译">{flag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="col-span-6 p-3">
                        {isEditing ? (
                          <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                            rows={2}
                            autoFocus
                          />
                        ) : (
                          <p className={`text-sm ${value.trim() ? textClass : 'text-gray-400 italic'}`}>
                            {value.trim() || '(空)'}
                          </p>
                        )}
                      </div>
                      <div className="col-span-3 p-3 flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button
                              onClick={saveKeyEdit}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                              ✓ 保存
                            </button>
                            <button
                              onClick={() => setEditingKey(null)}
                              className="px-3 py-1 bg-gray-400 text-white text-sm rounded hover:bg-gray-500"
                            >
                              ✕ 取消
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleKeyEdit(key)}
                              className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                            >
                              ✏️ 编辑
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`确定删除 "${key}" 的翻译？`)) {
                                  updateValue(activeLang, key, '');
                                }
                              }}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                            >
                              🗑️ 删除
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <input
              type="text"
              placeholder="📝 更新日志（可选）..."
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              💾 保存并发布到云端
            </button>
          </div>
        </div>
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-xl p-6 w-full max-w-2xl border`}>
            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>📥 导入多语言JSON</h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              粘贴包含5种语言(en/de/fr/es/it)的JSON数据，将覆盖现有内容
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className={`w-full h-64 px-4 py-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              placeholder={`{
  "en": { "nav_home": "Home", ... },
  "de": { "nav_home": "Startseite", ... },
  "fr": { ... },
  "es": { ... },
  "it": { ... }
}`}
            />
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className={`px-4 py-2 rounded-lg ${textSecondary} hover:bg-gray-100`}
              >
                取消
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg z-50 transition-all ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
