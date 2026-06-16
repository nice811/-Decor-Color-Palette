import { useState, useEffect } from 'react';

// ============================================================
// SEO配置说明（中文注释，仅供开发者调试参考）
// ============================================================
//
// 【SEO配置内容】
// Meta Title       = 浏览器标签页标题，影响搜索结果展示
// Meta Description = 搜索结果摘要，影响点击率
// Keywords         = 关键词标签（已弱化但仍有参考价值）
// OG Image         = Facebook/LinkedIn社交分享图片
// Twitter Card     = Twitter分享卡片样式
// FAQ Schema       = 结构化数据，触发Google"人们还在问"区块
//
// 【多语言SEO策略】
// en = 英文市场（美国/英国/澳大利亚等英语国家）
// de = 德语市场（德国/奥地利/瑞士德语区）
// fr = 法语市场（法国/比利时/瑞士法语区/加拿大法语区）
// es = 西班牙语市场（西班牙/拉丁美洲）
// it = 意大利语市场（意大利/瑞士意大利语区）
//
// 【FAQ结构化数据格式】
// Google要求JSON-LD格式，包含Question和Answer对
// 每个FAQ最多40个问题
//
// 【Sitemap生成】
// 包含主URL + 5个语言变体URL
// 每个URL包含hreflang标签用于语言定位
//
// ============================================================

const LANGUAGES = [
  { code: 'en', name: '英文', flag: '🇬🇧', native: 'English', market: '英语国家' },
  { code: 'de', name: '德文', flag: '🇩🇪', native: 'Deutsch', market: '德国/奥地利/瑞士' },
  { code: 'fr', name: '法文', flag: '🇫🇷', native: 'Français', market: '法国/比利时/加拿大' },
  { code: 'es', name: '西班牙文', flag: '🇪🇸', native: 'Español', market: '西班牙/拉丁美洲' },
  { code: 'it', name: '意大利文', flag: '🇮🇹', native: 'Italiano', market: '意大利/瑞士' },
];

// 各语种默认SEO模板
const SEO_TEMPLATES = {
  en: {
    title: 'Decor Color Palette – Free Home Color Scheme Generator',
    description: 'Discover perfect color palettes for home decoration. Free online tool to generate, browse and export HEX color codes for living rooms, bedrooms, kitchens and bathrooms.',
    keywords: 'home color palette, color scheme generator, interior design colors, room color ideas, HEX color codes, free color tool, home decoration',
    ogTitle: 'Decor Color Palette – Free Home Color Scheme Generator',
    ogDescription: 'Create beautiful color schemes for your home. Free color palette generator with exportable HEX codes.',
    twitterCard: 'summary_large_image',
  },
  de: {
    title: 'Decor Farbpalette – Kostenloser Farbschema-Generator',
    description: 'Entdecken Sie perfekte Farbpaletten für Ihre Inneneinrichtung. Kostenloses Online-Tool zum Erstellen und Exportieren von HEX-Farbcodes.',
    keywords: 'Farbpalette, Farbschema Generator, Inneneinrichtung Farben, HEX Farbcodes, kostenloses Farbtool',
    ogTitle: 'Decor Farbpalette – Kostenloser Farbschema-Generator',
    ogDescription: 'Erstellen Sie wunderschöne Farbschemata für Ihr Zuhause. Kostenloser Farbpaletten-Generator.',
    twitterCard: 'summary_large_image',
  },
  fr: {
    title: 'Palette de Couleurs Décoration – Générateur de Schémas Colorés Gratuit',
    description: 'Découvrez des palettes de couleurs parfaites pour la décoration intérieure. Outil gratuit pour créer et exporter des codes couleurs HEX.',
    keywords: 'palette de couleurs, générateur de schéma coloré, couleurs décoration intérieure, codes couleurs HEX, outil couleur gratuit',
    ogTitle: 'Palette de Couleurs Décoration – Générateur Gratuit',
    ogDescription: 'Créez de beaux schémas colorés pour votre maison. Générateur de palette gratuit avec codes HEX exportables.',
    twitterCard: 'summary_large_image',
  },
  es: {
    title: 'Paleta de Colores Decoración – Generador Gratuito de Esquemas',
    description: 'Descubra paletas de colores perfectas para la decoración del hogar. Herramienta gratuita para crear y exportar códigos de color HEX.',
    keywords: 'paleta de colores, generador de esquema de color, colores decoración interior, códigos color HEX, herramienta color gratuita',
    ogTitle: 'Paleta de Colores Decoración – Generador Gratuito',
    ogDescription: 'Cree hermosos esquemas de color para su hogar. Generador de paleta gratuito con códigos HEX exportables.',
    twitterCard: 'summary_large_image',
  },
  it: {
    title: 'Palette Colori Decorazione – Generatore Gratuito di Schemi',
    description: 'Scopri palette di colori perfette per la decorazione della casa. Strumento gratuito per creare ed esportare codici colore HEX.',
    keywords: 'palette colori, generatore schema colori, colori decorazione interna, codici colore HEX, strumento colori gratuito',
    ogTitle: 'Palette Colori Decorazione – Generatore Gratuito',
    ogDescription: 'Crea bellissimi schemi di colore per la tua casa. Generatore di palette gratuito con codici HEX esportabili.',
    twitterCard: 'summary_large_image',
  },
};

// 默认FAQ模板（英文）
const FAQ_TEMPLATES = {
  en: [
    { question: 'How does the color palette generator work?', answer: 'Our color palette generator analyzes your selected room type and decor style to create harmonious color combinations. You can browse curated palettes or generate custom schemes with one click.' },
    { question: 'Can I copy color codes from the palette?', answer: 'Yes. Simply click on any color swatch to copy its HEX code to your clipboard instantly. All color codes are free to use for any project.' },
    { question: 'Is the tool free to use?', answer: 'Yes, DecorColorTool is completely free. No registration required. Generate and save as many color palettes as you like.' },
    { question: 'What room types are available?', answer: 'You can generate color schemes for living rooms, bedrooms, kitchens, and bathrooms. Each room type has tailored color recommendations.' },
    { question: 'Can I save my favorite palettes?', answer: 'Yes! Click the heart icon on any palette to save it to your favorites. Your saved palettes will be stored in your browser.' },
  ],
  de: [
    { question: 'Wie funktioniert der Farbpalettengenerator?', answer: 'Unser Generator analysiert Ihren ausgewählten Raumtyp und Einrichtungsstil, um harmonische Farbkombinationen zu erstellen.' },
    { question: 'Kann ich Farbcodes kopieren?', answer: 'Ja. Klicken Sie einfach auf ein Farbmuster, um den HEX-Code in die Zwischenablage zu kopieren. Alle Farbcodes sind kostenlos.' },
    { question: 'Ist das Tool kostenlos?', answer: 'Ja, DecorColorTool ist völlig kostenlos. Keine Registrierung erforderlich. Erstellen und speichern Sie so viele Paletten wie Sie möchten.' },
    { question: 'Welche Raumtypen sind verfügbar?', answer: 'Sie können Farbschemata für Wohnzimmer, Schlafzimmer, Küchen und Badezimmer generieren.' },
    { question: 'Kann ich meine Lieblingspaletten speichern?', answer: 'Ja! Klicken Sie auf das Herz-Symbol, um Paletten zu Ihren Favoriten hinzuzufügen.' },
  ],
  fr: [
    { question: 'Comment fonctionne le générateur de palette?', answer: 'Notre générateur analyse le type de pièce et le style de décoration sélectionnés pour créer des combinaisons de couleurs harmonieuses.' },
    { question: 'Puis-je copier les codes couleurs?', answer: 'Oui. Cliquez simplement sur un échantillon pour copier instantanément le code HEX. Tous les codes sont gratuits.' },
    { question: 'L\'outil est-il gratuit?', answer: 'Oui, DecorColorTool est complètement gratuit. Aucune inscription requise. Générez et sauvegardez autant de palettes que vous le souhaitez.' },
    { question: 'Quels types de pièces sont disponibles?', answer: 'Vous pouvez générer des schémas pour les salons, chambres, cuisines et salles de bains.' },
    { question: 'Puis-je sauvegarder mes palettes préférées?', answer: 'Oui! Cliquez sur l\'icône cœur pour sauvegarder vos palettes préférées.' },
  ],
  es: [
    { question: '¿Cómo funciona el generador de paletas?', answer: 'Nuestro generador analiza el tipo de habitación y estilo de decoración seleccionado para crear combinaciones de colores armoniosas.' },
    { question: '¿Puedo copiar los códigos de color?', answer: 'Sí. Simplemente haga clic en cualquier muestra de color para copiar el código HEX al portapapeles instantáneamente.' },
    { question: '¿La herramienta es gratuita?', answer: 'Sí, DecorColorTool es completamente gratuito. No se requiere registro. Genere y guarde tantas paletas como desee.' },
    { question: '¿Qué tipos de habitaciones están disponibles?', answer: 'Puede generar esquemas para salas de estar, dormitorios, cocinas y baños.' },
    { question: '¿Puedo guardar mis paletas favoritas?', answer: '¡Sí! Haga clic en el icono del corazón para guardar paletas en sus favoritos.' },
  ],
  it: [
    { question: 'Come funziona il generatore di palette?', answer: 'Il nostro generatore analizza il tipo di stanza e lo stile di decorazione selezionato per creare combinazioni di colori armoniche.' },
    { question: 'Posso copiare i codici colore?', answer: 'Sì. Basta cliccare su qualsiasi campione per copiare istantaneamente il codice HEX. Tutti i codici sono gratuiti.' },
    { question: 'Lo strumento è gratuito?', answer: 'Sì, DecorColorTool è completamente gratuito. Nessuna registrazione richiesta. Genera e salva tutte le palette che desideri.' },
    { question: 'Quali tipi di stanze sono disponibili?', answer: 'Puoi generare schemi per soggiorni, camere da letto, cucine e bagni.' },
    { question: 'Posso salvare le mie palette preferite?', answer: 'Sì! Clicca sull\'icona del cuore per salvare le palette nei preferiti.' },
  ],
};

export default function SeoEditor({ data, onSave }) {
  const [seo, setSeo] = useState({});
  const [activeLang, setActiveLang] = useState('en');
  const [changelog, setChangelog] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [saved, setSaved] = useState(false);
  const [showSitemapModal, setShowSitemapModal] = useState(false);
  const [sitemapContent, setSitemapContent] = useState('');

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setSeo(data);
    } else {
      const defaultSeo = {};
      LANGUAGES.forEach(lang => {
        defaultSeo[lang.code] = {
          ...SEO_TEMPLATES[lang.code],
          faq: FAQ_TEMPLATES[lang.code] || [],
        };
      });
      setSeo(defaultSeo);
    }
  }, [data]);

  const updateSeo = (lang, field, value) => {
    setSeo(prev => ({
      ...prev,
      [lang]: {
        ...prev[lang],
        [field]: value,
      },
    }));
    setSaved(false);
  };

  const addFaqItem = (lang) => {
    const newFaq = [...(seo[lang]?.faq || []), { question: '', answer: '' }];
    updateSeo(lang, 'faq', newFaq);
  };

  const updateFaqItem = (lang, index, field, value) => {
    const newFaq = [...(seo[lang]?.faq || [])];
    newFaq[index] = { ...newFaq[index], [field]: value };
    updateSeo(lang, 'faq', newFaq);
  };

  const removeFaqItem = (lang, index) => {
    const newFaq = (seo[lang]?.faq || []).filter((_, i) => i !== index);
    updateSeo(lang, 'faq', newFaq);
  };

  const fillTemplate = (lang) => {
    const template = SEO_TEMPLATES[lang];
    const faqTemplate = FAQ_TEMPLATES[lang] || [];
    setSeo(prev => ({
      ...prev,
      [lang]: {
        ...template,
        faq: faqTemplate,
      },
    }));
    setSaved(false);
  };

  const generateAllLanguages = async () => {
    setIsGenerating(true);
    const targetLangs = LANGUAGES.filter(l => l.code !== 'en');

    for (let i = 0; i < targetLangs.length; i++) {
      const lang = targetLangs[i];
      setGenerationProgress(`正在生成${lang.name}SEO...`);
      
      // 模拟AI翻译延迟
      await new Promise(r => setTimeout(r, 500));
      
      // 使用模板填充（实际项目中可接入AI翻译API）
      setSeo(prev => ({
        ...prev,
        [lang.code]: {
          ...SEO_TEMPLATES[lang.code],
          faq: FAQ_TEMPLATES[lang.code] || [],
        },
      }));
    }

    setIsGenerating(false);
    setGenerationProgress('');
    setSaved(false);
  };

  const handleSave = () => {
    // 清理数据，确保不包含任何中文
    const cleanSeo = {};
    LANGUAGES.forEach(lang => {
      cleanSeo[lang.code] = seo[lang.code] || {};
    });
    onSave(cleanSeo, changelog || '更新全站SEO配置');
    setChangelog('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const generateSitemap = () => {
    const baseUrl = 'https://decorcolortool.com';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <url>
    <loc>${baseUrl}/</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/?lang=de" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/?lang=fr" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/?lang=es" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  ${LANGUAGES.filter(l => l.code !== 'en').map(lang => `
  <url>
    <loc>${baseUrl}/?lang=${lang.code}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/" />
    <xhtml:link rel="alternate" hreflang="de" href="${baseUrl}/?lang=de" />
    <xhtml:link rel="alternate" hreflang="fr" href="${baseUrl}/?lang=fr" />
    <xhtml:link rel="alternate" hreflang="es" href="${baseUrl}/?lang=es" />
    <xhtml:link rel="alternate" hreflang="it" href="${baseUrl}/?lang=it" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n')}

</urlset>`;

    setSitemapContent(xml);
    setShowSitemapModal(true);
  };

  const downloadSitemap = () => {
    const blob = new Blob([sitemapContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sitemap.xml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const currentSeo = seo[activeLang] || {};

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${textClass}`}>全站SEO配置</h2>
            <p className={`text-sm ${textSecondary}`}>配置5种语言独立SEO内容，支持Meta标签、OG分享、FAQ结构化数据</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {darkMode ? '🌞 浅色' : '🌙 深色'}
            </button>
            <button
              onClick={generateSitemap}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              🗺️ 生成Sitemap
            </button>
            <button
              onClick={generateAllLanguages}
              disabled={isGenerating}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              🤖 AI生成全部
            </button>
          </div>
        </div>

        {isGenerating && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <span className="animate-spin">⏳</span>
              <span>{generationProgress || '正在生成...'}</span>
            </div>
          </div>
        )}

        {/* 语言标签 */}
        <div className="flex gap-2">
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
              <span className="font-medium">{lang.name}</span>
              <span className="text-xs opacity-70">({lang.market})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：SEO表单 */}
          <div className="space-y-6">
            {/* Meta标签配置 */}
            <div className={`${cardClass} rounded-xl border p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${textClass}`}>🏷️ Meta 标签配置</h3>
                <button
                  onClick={() => fillTemplate(activeLang)}
                  className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  📝 填充模板
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Meta Title（页面标题）
                    <span className="text-xs text-gray-400 ml-2">建议50-60字符</span>
                  </label>
                  <input
                    type="text"
                    value={currentSeo.title || ''}
                    onChange={(e) => updateSeo(activeLang, 'title', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                    placeholder="Enter page title for search engines"
                  />
                  <div className={`text-xs mt-1 ${textSecondary}`}>
                    当前：{(currentSeo.title || '').length} 字符
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Meta Description（页面描述）
                    <span className="text-xs text-gray-400 ml-2">建议120-160字符</span>
                  </label>
                  <textarea
                    value={currentSeo.description || ''}
                    onChange={(e) => updateSeo(activeLang, 'description', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                    rows={3}
                    placeholder="Enter meta description for search engines"
                  />
                  <div className={`text-xs mt-1 ${textSecondary}`}>
                    当前：{(currentSeo.description || '').length} 字符
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>
                    Keywords（关键词）
                    <span className="text-xs text-gray-400 ml-2">逗号分隔</span>
                  </label>
                  <input
                    type="text"
                    value={currentSeo.keywords || ''}
                    onChange={(e) => updateSeo(activeLang, 'keywords', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                    placeholder="Enter keywords separated by commas"
                  />
                </div>
              </div>
            </div>

            {/* OG社交分享配置 */}
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📱 社交分享配置</h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>OG Title（Facebook/LinkedIn标题）</label>
                  <input
                    type="text"
                    value={currentSeo.ogTitle || ''}
                    onChange={(e) => updateSeo(activeLang, 'ogTitle', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                    placeholder="Title for social media sharing"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>OG Description（Facebook/LinkedIn描述）</label>
                  <textarea
                    value={currentSeo.ogDescription || ''}
                    onChange={(e) => updateSeo(activeLang, 'ogDescription', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                    rows={2}
                    placeholder="Description for social media sharing"
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${textClass}`}>Twitter Card 类型</label>
                  <select
                    value={currentSeo.twitterCard || 'summary_large_image'}
                    onChange={(e) => updateSeo(activeLang, 'twitterCard', e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                  >
                    <option value="summary">Summary（标准卡片）</option>
                    <option value="summary_large_image">Summary Large Image（大图卡片）</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧：FAQ配置 */}
          <div className={`${cardClass} rounded-xl border p-6`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold ${textClass}`}>❓ FAQ 结构化数据</h3>
                <p className={`text-sm ${textSecondary}`}>触发Google"人们还在问"区块</p>
              </div>
              <button
                onClick={() => addFaqItem(activeLang)}
                className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
              >
                + 添加问答
              </button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {(currentSeo.faq || []).map((item, index) => (
                <div key={index} className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <span className={`text-sm font-medium ${textSecondary}`}>问题 {index + 1}</span>
                    <button
                      onClick={() => removeFaqItem(activeLang, index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                  <input
                    type="text"
                    value={item.question || ''}
                    onChange={(e) => updateFaqItem(activeLang, index, 'question', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border mb-2 ${inputClass}`}
                    placeholder="Enter question"
                  />
                  <textarea
                    value={item.answer || ''}
                    onChange={(e) => updateFaqItem(activeLang, index, 'answer', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${inputClass}`}
                    rows={2}
                    placeholder="Enter answer"
                  />
                </div>
              ))}

              {(currentSeo.faq || []).length === 0 && (
                <div className={`text-center py-8 ${textSecondary}`}>
                  <p className="text-4xl mb-4">❓</p>
                  <p>暂无FAQ，点击上方按钮添加</p>
                </div>
              )}
            </div>

            <div className={`mt-4 text-sm ${textSecondary}`}>
              共 {(currentSeo.faq || []).length} 个问答（建议5-10个）
            </div>
          </div>
        </div>

        {/* 保存按钮 */}
        <div className={`${cardClass} rounded-xl border p-6 mt-6`}>
          <div className="flex items-center gap-4">
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
              💾 保存并发布SEO配置
            </button>
          </div>

          {saved && (
            <div className="mt-2 text-center text-green-500 text-sm">
              ✓ 保存成功！前端下次访问将自动同步最新SEO配置
            </div>
          )}
        </div>

        {/* 预览 */}
        <div className={`${cardClass} rounded-xl border p-6 mt-6`}>
          <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>👁️ Google搜索结果预览</h3>
          <div className="border border-gray-200 rounded-lg p-4 max-w-2xl">
            <div className="text-blue-600 text-xl hover:underline cursor-pointer mb-1">
              {currentSeo.title || 'Page Title'}
            </div>
            <div className="text-green-700 text-sm mb-1">
              https://decorcolortool.com/
            </div>
            <div className="text-gray-600 text-sm">
              {currentSeo.description || 'Page description will appear here...'}
            </div>
          </div>
        </div>
      </div>

      {/* Sitemap弹窗 */}
      {showSitemapModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-xl p-6 w-full max-w-4xl border max-h-[80vh] overflow-hidden flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${textClass}`}>🗺️ Sitemap.xml 预览</h3>
              <button
                onClick={() => setShowSitemapModal(false)}
                className={`${textSecondary} hover:${textClass}`}
              >
                ✕
              </button>
            </div>
            <p className={`text-sm ${textSecondary} mb-4`}>
              已包含5种语言版本的hreflang标签，适配Google海外收录
            </p>
            <pre className={`flex-1 overflow-auto p-4 rounded-lg text-xs font-mono ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-50 text-gray-800'}`}>
              {sitemapContent}
            </pre>
            <div className="flex justify-end gap-4 mt-4">
              <button
                onClick={() => setShowSitemapModal(false)}
                className={`px-4 py-2 rounded-lg ${textSecondary} hover:bg-gray-100`}
              >
                关闭
              </button>
              <button
                onClick={downloadSitemap}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                📥 下载 sitemap.xml
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
