/**
 * 用户认证上下文
 * 管理全局用户登录状态、Token存储、收藏同步
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, loginUser, registerUser, verifyToken, getFavorites, addFavorite, deleteFavorite, FavoriteItem } from '@/services/authService';
import { Palette } from '@/data/colors';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (username: string, password: string, email?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // 云端收藏
  cloudFavorites: FavoriteItem[];
  syncFavorites: () => Promise<void>;
  addToCloudFavorites: (palette: Palette) => Promise<boolean>;
  removeFromCloudFavorites: (favoriteId: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'decor-color-token';
const USER_KEY = 'decor-color-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [cloudFavorites, setCloudFavorites] = useState<FavoriteItem[]>([]);

  // 初始化：从localStorage恢复登录状态
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedToken && storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // 验证Token有效性
      verifyToken(storedToken).then((result) => {
        if (result.valid) {
          setToken(storedToken);
          setUser(parsedUser);
          // 同步云端收藏
          syncFavoritesInternal(storedToken);
        } else {
          // Token无效，清除存储
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // 内部同步收藏函数
  const syncFavoritesInternal = async (t: string) => {
    const result = await getFavorites(t);
    if (result.success) {
      setCloudFavorites(result.data);
    }
  };

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    const result = await loginUser(username, password);
    if (result.success && result.token && result.data) {
      setToken(result.token);
      setUser(result.data);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data));
      // 同步云端收藏
      await syncFavoritesInternal(result.token);
      return { success: true };
    }
    return { success: false, error: result.error || result.message };
  }, []);

  // 注册
  const register = useCallback(async (username: string, password: string, email?: string) => {
    const result = await registerUser(username, password, email);
    if (result.success && result.token && result.data) {
      setToken(result.token);
      setUser(result.data);
      localStorage.setItem(TOKEN_KEY, result.token);
      localStorage.setItem(USER_KEY, JSON.stringify(result.data));
      return { success: true };
    }
    return { success: false, error: result.error || result.message };
  }, []);

  // 登出
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setCloudFavorites([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // 同步云端收藏
  const syncFavorites = useCallback(async () => {
    if (!token) return;
    await syncFavoritesInternal(token);
  }, [token]);

  // 添加到云端收藏
  const addToCloudFavorites = useCallback(async (palette: Palette) => {
    if (!token) return false;
    const result = await addFavorite(token, palette.name, palette);
    if (result.success && result.data) {
      setCloudFavorites((prev) => [...prev, result.data!]);
      return true;
    }
    return false;
  }, [token]);

  // 从云端删除收藏
  const removeFromCloudFavorites = useCallback(async (favoriteId: number) => {
    if (!token) return false;
    const result = await deleteFavorite(token, favoriteId);
    if (result.success) {
      setCloudFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      return true;
    }
    return false;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn: !!token && !!user,
        loading,
        login,
        register,
        logout,
        cloudFavorites,
        syncFavorites,
        addToCloudFavorites,
        removeFromCloudFavorites,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}