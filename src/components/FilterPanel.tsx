import { useTranslation } from 'react-i18next';
import { Palette, ALL_ROOMS, ALL_STYLES } from '@/data/colors';
import { RegionCode } from '@/utils/regionDetector';

interface FilterPanelProps {
  selectedRoom: Palette['room'] | undefined;
  selectedStyle: Palette['style'] | undefined;
  selectedRegion: RegionCode | undefined;
  onRoomChange: (room: Palette['room'] | undefined) => void;
  onStyleChange: (style: Palette['style'] | undefined) => void;
  onRegionChange: (region: RegionCode | undefined) => void;
  onGenerate: () => void;
}

export default function FilterPanel({
  selectedRoom,
  selectedStyle,
  selectedRegion,
  onRoomChange,
  onStyleChange,
  onRegionChange,
  onGenerate,
}: FilterPanelProps) {
  const { t } = useTranslation('common');

  const roomKeyMap: Record<Palette['room'], string> = {
    living: 'room_living',
    bedroom: 'room_bedroom',
    kitchen: 'room_kitchen',
    bathroom: 'room_bathroom',
  };

  const styleKeyMap: Record<Palette['style'], string> = {
    modern: 'style_modern',
    traditional: 'style_traditional',
    scandinavian: 'style_scandinavian',
    bohemian: 'style_bohemian',
  };

  const regionLabels: Record<RegionCode, string> = {
    west: t('region_west'),
    sea: t('region_sea'),
    jpkr: t('region_jpkr'),
  };

  const regionList: RegionCode[] = ['west', 'sea', 'jpkr'];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('region_filter')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onRegionChange(undefined)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                !selectedRegion
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('all')}
            </button>
            {regionList.map((r) => (
              <button
                key={r}
                onClick={() => onRegionChange(r)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedRegion === r
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {regionLabels[r]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('room_filter')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onRoomChange(undefined)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                !selectedRoom
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('all')}
            </button>
            {ALL_ROOMS.map((r) => (
              <button
                key={r}
                onClick={() => onRoomChange(r)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedRoom === r
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(roomKeyMap[r])}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            {t('style_filter')}
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onStyleChange(undefined)}
              className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                !selectedStyle
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {t('all')}
            </button>
            {ALL_STYLES.map((s) => (
              <button
                key={s}
                onClick={() => onStyleChange(s)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedStyle === s
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {t(styleKeyMap[s])}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-start lg:justify-end">
          <button
            onClick={onGenerate}
            className="w-full lg:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all active:scale-95"
          >
            ✨ {t('btn_generate')}
          </button>
        </div>
      </div>
    </div>
  );
}
