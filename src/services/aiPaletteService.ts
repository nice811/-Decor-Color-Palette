/**
 * AI配色生成服务
 * 调用后端API生成配色方案
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3001';

/**
 * AI配色生成请求参数
 */
export interface GeneratePaletteParams {
  region: 'western' | 'southeast' | 'japanese';
  room: 'living' | 'bedroom' | 'kitchen' | 'bathroom';
  style: 'modern' | 'classic' | 'minimalist' | 'cozy';
}

/**
 * 单个颜色
 */
export interface ColorItem {
  hex: string;
  name: string;
}

/**
 * AI配色生成响应
 */
export interface GeneratePaletteResponse {
  success: boolean;
  data: ColorItem[];
  fallback: boolean;
  requestId: string;
  message?: string;
  error?: string;
}

/**
 * 调用后端AI接口生成配色方案
 * @param params 地区、房间、风格参数
 * @returns Promise<GeneratePaletteResponse>
 */
export async function generatePaletteWithAI(params: GeneratePaletteParams): Promise<GeneratePaletteResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒超时

  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/generate-palette`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Request failed: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (err) {
    clearTimeout(timeoutId);

    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          data: [],
          fallback: false,
          requestId: '',
          error: 'timeout',
          message: 'Request timeout, please try again'
        };
      }
      throw err;
    }

    return {
      success: false,
      data: [],
      fallback: false,
      requestId: '',
      error: 'unknown',
      message: 'Network error, please check your connection'
    };
  }
}

/**
 * 获取AI配置信息
 */
export async function getAIConfig() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/config`);
    if (!response.ok) throw new Error('Failed to fetch AI config');
    return await response.json();
  } catch (err) {
    console.error('Failed to get AI config:', err);
    return null;
  }
}
