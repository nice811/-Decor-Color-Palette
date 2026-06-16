import { useEffect, useState, useCallback, useRef } from 'react';
import {
  checkForUpdate,
  loadCache,
  HotUpdateConfig,
  ContentData,
  UpdateResult,
} from '@/utils/hotUpdate';

export interface HotUpdateState {
  content: ContentData | null;
  loading: boolean;
  error: string | null;
  version: string | null;
  updateAvailable: boolean;
  forceRefreshRequired: boolean;
}

export function useHotUpdateSync(config: HotUpdateConfig) {
  const { baseUrl, pollInterval = 24 * 60 * 60 * 1000, enabled = true } = config;
  
  const [state, setState] = useState<HotUpdateState>({
    content: null,
    loading: true,
    error: null,
    version: null,
    updateAvailable: false,
    forceRefreshRequired: false,
  });
  
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleUpdate = useCallback((result: UpdateResult) => {
    setState(prev => ({
      ...prev,
      content: result.data || prev.content,
      version: result.version || prev.version,
      updateAvailable: result.updated,
      loading: false,
      error: null,
    }));
    
    if (result.updated && result.data) {
      console.info('HotUpdate: Content updated successfully to version', result.version);
    }
  }, []);

  const initialize = useCallback(async (force = false) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const cachedData = loadCache();
      
      if (!force && cachedData) {
        setState(prev => ({
          ...prev,
          content: cachedData,
          version: cachedData.version,
          loading: false,
        }));
        
        const result = await checkForUpdate({ baseUrl, enabled });
        handleUpdate(result);
        
        return cachedData;
      }

      const result = await checkForUpdate({ baseUrl, enabled });
      handleUpdate(result);
      
      return result.data || cachedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Initialization failed';
      console.error('HotUpdate: Initialization failed:', err);
      
      const cachedData = loadCache();
      setState(prev => ({
        ...prev,
        content: cachedData || prev.content,
        version: cachedData?.version || prev.version,
        loading: false,
        error: errorMessage,
      }));
      
      return cachedData;
    }
  }, [baseUrl, enabled, handleUpdate]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!enabled) {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      return;
    }

    pollTimerRef.current = setInterval(async () => {
      console.debug('HotUpdate: Polling for updates...');
      const result = await checkForUpdate({ baseUrl, enabled });
      handleUpdate(result);
    }, pollInterval);

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, [baseUrl, enabled, pollInterval, handleUpdate]);

  const refresh = useCallback(() => {
    initialize(true);
  }, [initialize]);

  return {
    ...state,
    refresh,
  };
}
