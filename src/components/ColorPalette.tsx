import { useTranslation } from 'react-i18next';
import { Palette } from '@/data/colors';
import { getRegionEmoji } from '@/utils/regionDetector';
import ColorCard from './ColorCard';

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
  const { t } = useTranslation('common');

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 transition-all hover:shadow-xl border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{palette.name}</h3>
          <p className="text-sm text-gray-500 capitalize">
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
      <p className="text-xs text-center text-gray-400 mt-4">
        {t('color_palette')} · {palette.colors.length} {t('colors_unit')}
      </p>
    </div>
  );
}
