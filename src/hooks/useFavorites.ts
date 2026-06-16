import { useState, useEffect, useCallback } from 'react';
import { Palette } from '@/data/colors';

const STORAGE_KEY = 'decor-color-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Palette[]>([]);

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // storage unavailable
    }
  }, [favorites]);

  const toggleFavorite = useCallback((palette: Palette) => {
    setFavorites((prev) => {
      const exists = prev.some((p) => p.id === palette.id);
      if (exists) {
        return prev.filter((p) => p.id !== palette.id);
      }
      return [...prev, palette];
    });
  }, []);

  const isFavorite = useCallback(
    (id: string) => favorites.some((p) => p.id === id),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite, setFavorites };
}
