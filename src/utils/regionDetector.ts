export type RegionCode = 'west' | 'sea' | 'jpkr';

export interface RegionInfo {
  region: RegionCode;
  country: string;
  countryCode: string;
  fromCache: boolean;
}

const WEST_COUNTRIES = new Set<string>([
  'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK',
  'FI', 'BE', 'CH', 'AT', 'IE', 'PT', 'LU', 'PL', 'CZ', 'HU',
  'GR', 'RO', 'EU', 'AU', 'NZ', 'IS', 'EE', 'LV', 'LT', 'SI', 'SK',
]);

const SEA_COUNTRIES = new Set<string>([
  'SG', 'MY', 'TH', 'VN', 'PH', 'ID', 'KH', 'LA', 'MM', 'BN', 'TL',
]);

const JPKR_COUNTRIES = new Set<string>([
  'JP', 'KR', 'KP',
]);

const MIDDLE_EAST_COUNTRIES = new Set<string>([
  'AE', 'SA', 'IL', 'TR', 'QA', 'KW', 'BH', 'OM', 'JO', 'IQ', 'LB', 'SY', 'YE',
]);

const LATAM_COUNTRIES = new Set<string>([
  'BR', 'AR', 'CL', 'CO', 'MX', 'PE', 'VE', 'CU', 'UY', 'PY', 'BO', 'EC', 'GT',
]);

const INDIA_COUNTRIES = new Set<string>([
  'IN', 'BD', 'NP', 'LK', 'PK',
]);

const CHINA_COUNTRIES = new Set<string>([
  'CN', 'MO', 'HK', 'TW',
]);

function normalizeCode(code: string | undefined | null): string {
  if (!code) return '';
  return code.trim().toUpperCase();
}

function classifyRegion(countryCode: string): RegionCode {
  const code = normalizeCode(countryCode);
  if (WEST_COUNTRIES.has(code)) return 'west';
  if (SEA_COUNTRIES.has(code)) return 'sea';
  if (JPKR_COUNTRIES.has(code)) return 'jpkr';
  if (MIDDLE_EAST_COUNTRIES.has(code)) return 'west';
  if (LATAM_COUNTRIES.has(code)) return 'west';
  if (INDIA_COUNTRIES.has(code)) return 'sea';
  if (CHINA_COUNTRIES.has(code)) return 'jpkr';
  return 'west';
}

const STORAGE_KEY = 'decor-color-region-v1';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry {
  region: RegionCode;
  country: string;
  countryCode: string;
  timestamp: number;
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: CacheEntry = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_TTL) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    /* ignore */
  }
}

async function fetchFromIpApi(): Promise<{ country: string; countryCode: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const countryCode = normalizeCode(data.country_code);
    const country = data.country_name || data.country || countryCode;
    if (!countryCode) return null;
    return { country, countryCode };
  } catch {
    return null;
  }
}

async function fetchFromIpInfoCo(): Promise<{ country: string; countryCode: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch('https://ipinfo.io/json', {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const data = await response.json();
    const countryCode = normalizeCode(data.country);
    if (!countryCode) return null;
    return { country: data.country || countryCode, countryCode };
  } catch {
    return null;
  }
}

function detectFromBrowserLanguage(): RegionCode {
  if (typeof navigator === 'undefined') return 'west';
  const langs = navigator.languages && navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language || navigator.userLanguage || 'en'];

  for (const lang of langs) {
    const l = lang.toLowerCase();
    if (l.startsWith('ja')) return 'jpkr';
    if (l.startsWith('ko')) return 'jpkr';
    if (l.startsWith('zh')) return 'jpkr';
    if (l.startsWith('th')) return 'sea';
    if (l.startsWith('vi')) return 'sea';
    if (l.startsWith('id')) return 'sea';
    if (l.startsWith('ms')) return 'sea';
    if (l.startsWith('tl')) return 'sea';
    if (l.startsWith('en')) return 'west';
    if (l.startsWith('de')) return 'west';
    if (l.startsWith('fr')) return 'west';
    if (l.startsWith('es')) return 'west';
    if (l.startsWith('it')) return 'west';
    if (l.startsWith('sv')) return 'west';
    if (l.startsWith('nl')) return 'west';
  }
  return 'west';
}

export async function detectRegion(): Promise<RegionInfo> {
  const cached = readCache();
  if (cached) {
    return {
      region: cached.region,
      country: cached.country,
      countryCode: cached.countryCode,
      fromCache: true,
    };
  }

  const detectors = [fetchFromIpApi, fetchFromIpInfoCo];
  for (const detector of detectors) {
    try {
      const result = await detector();
      if (result && result.countryCode) {
        const region = classifyRegion(result.countryCode);
        writeCache({
          region,
          country: result.country,
          countryCode: result.countryCode,
          timestamp: Date.now(),
        });
        return {
          region,
          country: result.country,
          countryCode: result.countryCode,
          fromCache: false,
        };
      }
    } catch {
      /* try next */
    }
  }

  const fallbackRegion = detectFromBrowserLanguage();
  writeCache({
    region: fallbackRegion,
    country: 'Unknown',
    countryCode: 'XX',
    timestamp: Date.now(),
  });
  return {
    region: fallbackRegion,
    country: 'Unknown',
    countryCode: 'XX',
    fromCache: false,
  };
}

export function getRegionLabel(region: RegionCode): string {
  switch (region) {
    case 'west':
      return 'West (US/EU)';
    case 'sea':
      return 'Southeast Asia';
    case 'jpkr':
      return 'Japan & Korea';
  }
}

export function getRegionEmoji(region: RegionCode): string {
  switch (region) {
    case 'west':
      return '🌍';
    case 'sea':
      return '🏝️';
    case 'jpkr':
      return '🏯';
  }
}

export const ALL_REGIONS: RegionCode[] = ['west', 'sea', 'jpkr'];

export function clearRegionCache(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
