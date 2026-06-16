import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEnvLang } from '@/hooks/useEnvLang';

interface LangOption {
  code: string;
  label: string;
  flag: string;
}

const ALL_LANG_OPTIONS: LangOption[] = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'zh-CN', label: '中文(调试)', flag: '🇨🇳' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { isDebugLang } = useEnvLang();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLang = i18n.language;

  const renderOptions = isDebugLang
    ? ALL_LANG_OPTIONS
    : ALL_LANG_OPTIONS.filter((item) => item.code !== 'zh-CN');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLang = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.lang = lng;
    setOpen(false);
  };

  const currentLabel =
    renderOptions.find((l) => l.code === currentLang || currentLang.startsWith(l.code))
      ?.label || 'English';
  const currentFlag =
    renderOptions.find((l) => l.code === currentLang || currentLang.startsWith(l.code))
      ?.flag || '🇺🇸';

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all flex items-center gap-2"
      >
        <span className="text-lg">{currentFlag}</span>
        <span className="font-medium text-gray-800">{currentLabel}</span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {renderOptions.map((item) => (
            <li key={item.code}>
              <button
                onClick={() => changeLang(item.code)}
                className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-all ${
                  currentLang === item.code || currentLang.startsWith(item.code)
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.flag}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
