import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ColorItem, isLightColor } from '@/data/colors';

interface ColorCardProps {
  color: ColorItem;
  size?: 'sm' | 'md' | 'lg';
}

export default function ColorCard({ color, size = 'md' }: ColorCardProps) {
  const { t } = useTranslation('common');
  const [copied, setCopied] = useState(false);

  const textColor = isLightColor(color.hex) ? 'text-gray-800' : 'text-white';
  const sizeClasses = {
    sm: 'w-full h-16',
    md: 'w-full h-24',
    lg: 'w-full h-32',
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = color.hex;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="flex flex-col items-stretch">
      <button
        onClick={handleCopy}
        className={`${sizeClasses[size]} rounded-lg shadow-md transition-all hover:shadow-lg hover:scale-105 active:scale-95 cursor-pointer flex flex-col justify-end p-3`}
        style={{ backgroundColor: color.hex }}
        title="Click to copy HEX"
      >
        <span className={`text-sm font-mono font-bold ${textColor}`}>
          {color.hex}
        </span>
        <span className={`text-xs ${textColor} opacity-80 mt-1`}>
          {color.name}
        </span>
      </button>
      <p className="text-xs text-center mt-2 text-gray-600 min-h-[20px]">
        {copied ? t('toast_copy_success') : t('btn_copy')}
      </p>
    </div>
  );
}
