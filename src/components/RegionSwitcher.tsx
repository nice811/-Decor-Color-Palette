import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  RegionCode,
  ALL_REGIONS,
  getRegionLabel,
  getRegionEmoji,
} from '@/utils/regionDetector';

interface RegionSwitcherProps {
  currentRegion: RegionCode;
  onRegionChange: (region: RegionCode) => void;
  country?: string;
  loading?: boolean;
}

export default function RegionSwitcher({
  currentRegion,
  onRegionChange,
  country,
  loading = false,
}: RegionSwitcherProps) {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all flex items-center gap-2 text-sm"
      >
        {loading ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="font-medium text-gray-700">{t('detecting')}</span>
          </>
        ) : (
          <>
            <span className="text-lg">{getRegionEmoji(currentRegion)}</span>
            <span className="font-medium text-gray-700">{getRegionLabel(currentRegion)}</span>
            {country && country !== 'Unknown' && (
              <span className="text-xs text-gray-500">· {country}</span>
            )}
            <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
          </>
        )}
      </button>

      {open && !loading && (
        <ul className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          <li className="px-4 py-2 text-xs text-gray-500 border-b bg-gray-50">
            {t('region_select')}
          </li>
          {ALL_REGIONS.map((region) => (
            <li key={region}>
              <button
                onClick={() => {
                  onRegionChange(region);
                  setOpen(false);
                }}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                  currentRegion === region
                    ? 'bg-purple-50 text-purple-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{getRegionEmoji(region)}</span>
                <span className="flex flex-col">
                  <span className="font-medium">{getRegionLabel(region)}</span>
                  <span className="text-xs text-gray-500">{t(`region_desc_${region}`)}</span>
                </span>
                {currentRegion === region && <span className="ml-auto text-purple-600">✓</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
