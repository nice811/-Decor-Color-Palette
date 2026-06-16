import { loadCache } from '@/utils/hotUpdate';

const LANGS = ['en', 'de', 'fr', 'es', 'it'];

export class HotUpdateBackend {
  constructor(services?: any, options?: any) {
    this.services = services;
    this.options = options || {};
  }

  init(services: any, options: any) {
    this.services = services;
    this.options = options;
  }

  read(language: string, namespace: string, callback: (err: any, data?: any) => void) {
    if (!LANGS.includes(language)) {
      return callback(null, {});
    }

    try {
      const cachedData = loadCache();
      
      if (cachedData && cachedData.locales && cachedData.locales[language]) {
        const data = cachedData.locales[language][namespace] || {};
        return callback(null, data);
      }

      callback(null, {});
    } catch (err) {
      console.error('HotUpdateBackend: Failed to load translations:', err);
      callback(null, {});
    }
  }

  create(language: string, namespace: string, key: string, fallbackValue: string) {}

  services?: any;
  options?: any;
}

export default HotUpdateBackend;
