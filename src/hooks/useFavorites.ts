import { useState, useEffect, useCallback } from 'react';
import { Palette } from '@/data/colors';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'decor-color-favorites';

export function useFavorites() {
  const { isLoggedIn, addToCloudFavorites, removeFromCloudFavorites, cloudFavorites } = useAuth();
  const [favorites, setFavorites] = useState<Palette[]>([]);
  const [syncStatus, setSyncStatus] = useState<'local' | 'cloud' | 'syncing'>('local');

  // 初始化：从localStorage加载本地收藏
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  // 登录后同步云端收藏到本地显示
  useEffect(() => {
    if (isLoggedIn && cloudFavorites.length > 0) {
      // 将云端收藏转换为Palette格式并合并到本地
      const cloudPalettes: Palette[] = cloudFavorites.map((fav) => {
        try {
          const paletteData = JSON.parse(fav.color_data);
          return {
            ...paletteData,
            id: `cloud-${fav.id}`, // 标记为云端收藏
            _cloudId: fav.id, // 保存云端ID用于删除
          };
        } catch {
          return null;
        }
      }).filter(Boolean) as Palette[];

      setFavorites(cloudPalettes);
      setSyncStatus('cloud');
    }
  }, [isLoggedIn, cloudFavorites]);

  // 持久化本地收藏（未登录时）
  useEffect(() => {
    if (!isLoggedIn) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      } catch {
        // storage unavailable
      }
    }
  }, [favorites, isLoggedIn]);

  const toggleFavorite = useCallback(async (palette: Palette) => {
    const exists = favorites.some((p) => p.id === palette.id || p._cloudId === palette._cloudId);

    if (exists) {
      // 取消收藏
      if (isLoggedIn && palette._cloudId) {
        // 从云端删除
        const success = await removeFromCloudFavorites(palette._cloudId);
        if (!success) {
          console.error('Failed to remove from cloud favorites');
          return;
        }
      }
      setFavorites((prev) => prev.filter((p) => p.id !== palette.id && p._cloudId !== palette._cloudId));
    } else {
      // 添加收藏
      if (isLoggedIn) {
        // 添加到云端
        const success = await addToCloudFavorites(palette);
        if (!success) {
          console.error('Failed to add to cloud favorites');
          // 降级到本地收藏
          setFavorites((prev) => [...prev, palette]);
          return;
        }
        // 云端添加成功，等待同步更新
      } else {
        // 未登录，添加到本地
        setFavorites((prev) => [...prev, palette]);
      }
    }
  }, [favorites, isLoggedIn, addToCloudFavorites, removeFromCloudFavorites]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((p) => p.id === id || p._cloudId?.toString() === id.replace('cloud-', '')),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite, setFavorites, syncStatus };
}
