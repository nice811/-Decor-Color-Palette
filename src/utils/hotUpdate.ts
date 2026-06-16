export interface HotUpdateConfig {
  baseUrl: string;
  pollInterval?: number;
  enabled?: boolean;
}

export interface ContentData {
  palettes: any[];
  locales: Record<string, Record<string, string>>;
  regionParams: Record<string, any>;
  seo: Record<string, any>;
  siteConfig: Record<string, string>;
}

export interface VersionInfo {
  version: string;
  timestamp: number;
  changelog: string[];
}

export interface UpdateResult {
  updated: boolean;
  reason: string;
  data: ContentData | null;
  version: string | null;
}

const CACHE_KEY = 'decor-color-hotupdate';
const TIMEOUT = 10000;

export function loadCache(): (ContentData & { version: string; timestamp: number }) | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

export function saveCache(data: ContentData & { version: string; timestamp: number }) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('HotUpdate: Failed to save cache:', err);
  }
}

function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

export async function getRemoteVersion(baseUrl: string): Promise<VersionInfo | null> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/version`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('HotUpdate: Failed to fetch remote version:', err);
    return null;
  }
}

export async function getAllContent(baseUrl: string): Promise<ContentData | null> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/content`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('HotUpdate: Failed to fetch all content:', err);
    return null;
  }
}

export async function compareVersions(baseUrl: string, clientVersion: string): Promise<{
  serverVersion: string;
  shouldUpdate: boolean;
  updateType: 'major' | 'minor' | 'patch' | 'none';
  forceRefresh: boolean;
} | null> {
  try {
    const response = await fetchWithTimeout(`${baseUrl}/api/version/compare?clientVersion=${encodeURIComponent(clientVersion)}`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error('HotUpdate: Failed to compare versions:', err);
    return null;
  }
}

export async function checkForUpdate(config: HotUpdateConfig): Promise<UpdateResult> {
  const { baseUrl, enabled = true } = config;
  
  if (!enabled) {
    return { updated: false, reason: 'Hot update disabled', data: null, version: null };
  }

  const remoteVersion = await getRemoteVersion(baseUrl);
  if (!remoteVersion) {
    const cachedData = loadCache();
    return {
      updated: false,
      reason: 'Failed to fetch remote version, using cache',
      data: cachedData,
      version: cachedData?.version || null,
    };
  }

  const cachedData = loadCache();
  const localVersion = cachedData?.version;

  if (!localVersion || remoteVersion.version !== localVersion) {
    const comparison = await compareVersions(baseUrl, localVersion || '0.0.0');
    
    if (comparison?.forceRefresh) {
      console.warn('HotUpdate: Major version update detected, consider page refresh');
    }

    const content = await getAllContent(baseUrl);
    if (content) {
      const newCache = {
        version: remoteVersion.version,
        timestamp: Date.now(),
        ...content,
      };
      saveCache(newCache);
      return {
        updated: true,
        reason: localVersion ? 'Version mismatch' : 'No local cache',
        data: content,
        version: remoteVersion.version,
      };
    } else {
      return {
        updated: false,
        reason: 'Failed to fetch content, using cache',
        data: cachedData,
        version: localVersion || remoteVersion.version,
      };
    }
  }

  return {
    updated: false,
    reason: 'Version matches',
    data: cachedData,
    version: remoteVersion.version,
  };
}

export function clearCache(): void {
  localStorage.removeItem(CACHE_KEY);
}
