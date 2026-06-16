export class HotUpdateClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:3001';
    this.pollInterval = options.pollInterval || 24 * 60 * 60 * 1000;
    this.timeout = options.timeout || 10000;
    this.cacheKey = options.cacheKey || 'decor-color-hotupdate';
    this.onUpdate = options.onUpdate || (() => {});
    this.onError = options.onError || (() => {});
    this.currentVersion = null;
    this.cache = this.loadCache();
    this.pollTimer = null;
  }

  loadCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  saveCache(data) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (err) {
      console.warn('Failed to save cache:', err);
    }
  }

  async fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async getVersion() {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/version`);
      if (!response.ok) throw new Error('Failed to fetch version');
      return await response.json();
    } catch (err) {
      this.onError('getVersion', err);
      return null;
    }
  }

  async getContent(type) {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/content/${type}`);
      if (!response.ok) throw new Error('Failed to fetch content');
      return await response.json();
    } catch (err) {
      this.onError('getContent', err);
      return null;
    }
  }

  async getAllContent() {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}/api/content`);
      if (!response.ok) throw new Error('Failed to fetch all content');
      return await response.json();
    } catch (err) {
      this.onError('getAllContent', err);
      return null;
    }
  }

  async checkForUpdate() {
    const remoteVersion = await this.getVersion();
    if (!remoteVersion) {
      return { updated: false, reason: 'Failed to fetch remote version', data: null };
    }

    this.currentVersion = remoteVersion.version;
    const localVersion = this.cache?.version;

    if (!localVersion || remoteVersion.version !== localVersion) {
      const content = await this.getAllContent();
      if (content) {
        const newCache = {
          version: remoteVersion.version,
          timestamp: Date.now(),
          ...content,
        };
        this.saveCache(newCache);
        this.onUpdate(newCache);
        return {
          updated: true,
          reason: localVersion ? 'Version mismatch' : 'No local cache',
          data: newCache,
        };
      } else {
        return {
          updated: false,
          reason: 'Failed to fetch content, using cache',
          data: this.cache,
        };
      }
    }

    return {
      updated: false,
      reason: 'Version matches',
      data: this.cache,
    };
  }

  async updatePartial(type) {
    const content = await this.getContent(type);
    if (content && this.cache) {
      this.cache[type] = content;
      this.saveCache(this.cache);
      this.onUpdate(this.cache);
      return { success: true, data: this.cache };
    }
    return { success: false, data: null };
  }

  getCachedContent(type) {
    return this.cache?.[type] || null;
  }

  getCachedVersion() {
    return this.cache?.version || null;
  }

  startAutoPolling() {
    if (this.pollTimer) return;
    
    this.pollTimer = setInterval(() => {
      this.checkForUpdate();
    }, this.pollInterval);
  }

  stopAutoPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  clearCache() {
    localStorage.removeItem(this.cacheKey);
    this.cache = null;
  }

  async initialize(force = false) {
    if (!force && this.cache) {
      return this.cache;
    }
    
    const result = await this.checkForUpdate();
    return result.data || this.cache;
  }
}

export default HotUpdateClient;
