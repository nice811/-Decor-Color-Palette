/**
 * 用户认证服务
 * 封装登录、注册、收藏等API调用
 */

const API_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3001';

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  token?: string;
  error?: string;
  message?: string;
}

export interface FavoriteItem {
  id: number;
  user_id: number;
  palette_name?: string;
  color_data: string;
  created_at: string;
}

export interface FavoritesResponse {
  success: boolean;
  data: FavoriteItem[];
  error?: string;
}

/**
 * 用户注册
 */
export async function registerUser(
  username: string,
  password: string,
  email?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: 'network_error',
      message: 'Network error, please try again',
    };
  }
}

/**
 * 用户登录
 */
export async function loginUser(
  username: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return await response.json();
  } catch (err) {
    return {
      success: false,
      error: 'network_error',
      message: 'Network error, please try again',
    };
  }
}

/**
 * 获取用户收藏列表
 */
export async function getFavorites(token: string): Promise<FavoritesResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (err) {
    return { success: false, data: [] };
  }
}

/**
 * 添加收藏
 */
export async function addFavorite(
  token: string,
  paletteName: string,
  colorData: object
): Promise<{ success: boolean; data?: FavoriteItem; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paletteName, colorData }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, error: 'network_error' };
  }
}

/**
 * 删除收藏
 */
export async function deleteFavorite(
  token: string,
  favoriteId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites/${favoriteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    return await response.json();
  } catch (err) {
    return { success: false, error: 'network_error' };
  }
}

/**
 * 更新收藏名称
 */
export async function updateFavoriteName(
  token: string,
  favoriteId: number,
  newName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/favorites/${favoriteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ paletteName: newName }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, error: 'network_error' };
  }
}

/**
 * 验证Token有效性
 */
export async function verifyToken(token: string): Promise<{ valid: boolean; user?: User }> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    return data;
  } catch {
    return { valid: false };
  }
}