/**
 * AI装修建议服务
 * 根据配色方案生成装修建议
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3001';

export interface DecorAdviceRequest {
  paletteName: string;
  colors: Array<{ hex: string; name: string; role: string }>;
  room: string;
  style: string;
  language?: 'en' | 'it' | 'zh-CN';
}

export interface DecorAdviceResponse {
  success: boolean;
  advice?: string;
  suggestions?: Array<{
    category: string;
    items: string[];
  }>;
  error?: string;
}

/**
 * 获取AI装修建议
 * @param request 配色方案信息
 * @returns Promise<DecorAdviceResponse>
 */
export async function getDecorAdvice(request: DecorAdviceRequest): Promise<DecorAdviceResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/decor-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    return await response.json();

  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'timeout',
      };
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'unknown',
    };
  }
}

/**
 * 本地备用装修建议（AI失败时使用）
 */
export function getFallbackDecorAdvice(room: string, style: string, language: string = 'en'): string {
  const adviceTemplates: Record<string, Record<string, Record<string, string>>> = {
    en: {
      living: {
        modern: 'For a modern living room, focus on clean lines and minimal furniture. Use the primary color for your sofa or accent wall, and the neutral tones for flooring and curtains. Add metallic accents in lighting fixtures.',
        traditional: 'In a traditional living room, consider rich wood furniture pieces. Use the primary color for upholstery and the accent color for decorative pillows. Warm lighting enhances the cozy atmosphere.',
        scandinavian: 'Scandinavian style emphasizes natural light and simplicity. Use light neutral tones for walls and flooring. Add cozy textiles in the accent color, and incorporate natural wood elements.',
        bohemian: 'Bohemian living rooms thrive on layered textures. Mix the colors in rugs, cushions, and wall art. Add plants, vintage furniture, and handmade decorative items for a relaxed vibe.',
      },
      bedroom: {
        modern: 'A modern bedroom should feel serene. Use the background color for walls, primary for bedding, and accent for throw pillows. Keep furniture minimal with clean lines.',
        traditional: 'Traditional bedrooms benefit from warm, rich tones. Use the primary color for your headboard or bedding, and accent colors in lamps and decorative items.',
        scandinavian: 'Scandinavian bedrooms prioritize comfort. Light neutral walls, soft bedding in primary tones, and natural wood furniture create a peaceful retreat.',
        bohemian: 'Bohemian bedrooms are all about personal expression. Layer textiles in your palette colors, add unique lighting, and incorporate plants and artwork.',
      },
      kitchen: {
        modern: 'Modern kitchens shine with sleek surfaces. Use the primary color for cabinets or backsplash, neutral for countertops, and accent for small appliances or bar stools.',
        traditional: 'Traditional kitchens feel warm and inviting. Wood cabinets in neutral tones, primary color for walls, and accent in kitchen accessories.',
        scandinavian: 'Scandinavian kitchens are functional and bright. White or light neutral cabinets, primary accents in textiles, and natural wood elements.',
        bohemian: 'Bohemian kitchens embrace eclectic charm. Mix colors in cabinet fronts, add patterned tiles, and incorporate vintage accessories.',
      },
      bathroom: {
        modern: 'Modern bathrooms focus on clean aesthetics. Primary color for tiles or vanity, neutral for fixtures, and accent in towels or accessories.',
        traditional: 'Traditional bathrooms feel timeless. Neutral tiles, primary color in vanity or mirror frame, and warm lighting fixtures.',
        scandinavian: 'Scandinavian bathrooms are spa-like. Light neutral tiles, primary accents in towels and plants, and natural wood shelving.',
        bohemian: 'Bohemian bathrooms are playful. Mix colors in tiles, add patterned shower curtains, and incorporate unique storage solutions.',
      },
    },
    it: {
      living: {
        modern: 'Per un soggiorno moderno, concentrati su linee pulite e mobili minimalisti. Usa il colore primario per il divano o la parete accent, e i toni neutri per pavimenti e tende.',
        traditional: 'In un soggiorno tradizionale, considera mobili in legno ricco. Usa il colore primario per i tessuti e il colore accent per cuscini decorativi.',
        scandinavian: 'Lo stile scandinavo enfatizza la luce naturale e la semplicità. Usa toni neutri leggeri per pareti e pavimenti.',
        bohemian: 'I soggiorni bohemien prosperano con texture stratificate. Mescola i colori in tappeti, cuscini e arte murale.',
      },
      bedroom: {
        modern: 'Una camera moderna dovrebbe sentirsi serena. Usa il colore di sfondo per pareti, primario per bedding.',
        traditional: 'Le camere tradizionali beneficiano di toni caldi e ricchi.',
        scandinavian: 'Le camere scandinave privilegiano il comfort.',
        bohemian: 'Le camere bohemien sono tutta espressione personale.',
      },
      kitchen: {
        modern: 'Le cucine moderne brillano con superfici eleganti.',
        traditional: 'Le cucine tradizionali sono calde e invitanti.',
        scandinavian: 'Le cucine scandinave sono funzionali e luminose.',
        bohemian: 'Le cucine bohemien abbracciano il fascino eclettico.',
      },
      bathroom: {
        modern: 'I bagni moderni si concentrano su estetiche pulite.',
        traditional: 'I bagni tradizionali sono senza tempo.',
        scandinavian: 'I bagni scandinavi sono come spa.',
        bohemian: 'I bagni bohemien sono giocosi.',
      },
    },
    'zh-CN': {
      living: {
        modern: '现代客厅注重简洁线条和极简家具。主色调用于沙发或背景墙，中性色用于地板和窗帘。金属质感的灯具增添现代感。',
        traditional: '传统客厅适合使用深色木质家具。主色调用于软装，点缀色用于装饰枕头。温暖的灯光营造舒适氛围',
        scandinavian: '北欧风格强调自然光线和简约。浅色中性色调用于墙面和地板。点缀色用于纺织品，搭配原木元素',
        bohemian: '波西米亚客厅充满层次质感。在地毯、抱枕和墙面装饰中混搭各种颜色。添加绿植、复古家具和手工艺品',
      },
      bedroom: {
        modern: '现代卧室应营造宁静氛围。背景色用于墙面，主色调用于床品，点缀色用于抱枕。家具保持简约线条',
        traditional: '传统卧室适合温暖浓郁色调。主色调用于床头板或床品，点缀色用于灯具和装饰品',
        scandinavian: '北欧卧室优先考虑舒适感。浅色中性墙面，主色调柔软床品，原木家具营造宁静空间',
        bohemian: '波西米亚卧室强调个性表达。在纺织品中叠加配色方案的颜色，添加独特灯具和绿植艺术品',
      },
      kitchen: {
        modern: '现代厨房以光滑表面为特色。主色调用于橱柜或防溅墙，中性色用于台面，点缀色用于小家电或吧椅',
        traditional: '传统厨房温暖亲切。中性色调木质橱柜，主色调用于墙面，点缀色用于厨房配件',
        scandinavian: '北欧厨房功能明亮。白色或浅色中性橱柜，主色调点缀纺织品，原木元素',
        bohemian: '波西米亚厨房拥抱复古魅力。混搭橱柜颜色，添加图案瓷砖和复古配件',
      },
      bathroom: {
        modern: '现代浴室注重简洁美学。主色调用于瓷砖或洗手台，中性色用于卫浴设施，点缀色用于毛巾或配件',
        traditional: '传统浴室永恒经典。中性瓷砖，主色调用于洗手台或镜框，温暖灯具',
        scandinavian: '北欧浴室如SPA般舒适。浅色中性瓷砖，主色调点缀毛巾和绿植，原木搁架',
        bohemian: '波西米亚浴室充满趣味。混搭瓷砖颜色，添加图案淋浴帘和独特收纳方案',
      },
    },
  };

  const langKey = language === 'zh-CN' ? 'zh-CN' : (language === 'it' ? 'it' : 'en');
  const roomAdvice = adviceTemplates[langKey]?.[room]?.[style];

  return roomAdvice || adviceTemplates.en[room]?.[style] || 'Choose colors that reflect your personal style and create a harmonious atmosphere.';
}