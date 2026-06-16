import { useState, useCallback } from 'react';

const API_BASE = '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (method, endpoint, body = null) => {
    setLoading(true);
    setError(null);
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      };
      if (body) options.body = JSON.stringify(body);
      const response = await fetch(`${API_BASE}${endpoint}`, options);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Request failed');
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVersion = useCallback(async () => {
    return await request('GET', '/version');
  }, [request]);

  const compareVersion = useCallback(async (clientVersion) => {
    return await request('GET', `/version/compare?clientVersion=${clientVersion}`);
  }, [request]);

  const bumpVersion = useCallback(async (changelog) => {
    return await request('POST', '/version/bump', { changelog });
  }, [request]);

  const getContent = useCallback(async (type) => {
    return await request('GET', `/content/${type}`);
  }, [request]);

  const getAllContent = useCallback(async () => {
    return await request('GET', '/content');
  }, [request]);

  const getIncrementalContent = useCallback(async (lastModified) => {
    return await request('GET', `/content/incremental?lastModified=${lastModified}`);
  }, [request]);

  const updateContent = useCallback(async (type, data, changelog) => {
    return await request('POST', `/content/${type}`, { data, changelog });
  }, [request]);

  const batchUpdate = useCallback(async (data, changelog) => {
    return await request('POST', '/batch-update', { ...data, changelog });
  }, [request]);

  const rollback = useCallback(async (version, changelog) => {
    return await request('POST', '/rollback', { version, changelog });
  }, [request]);

  const getLogs = useCallback(async () => {
    return await request('GET', '/logs');
  }, [request]);

  const getSyncConfig = useCallback(async () => {
    return await request('GET', '/sync/config');
  }, [request]);

  const updateSyncConfig = useCallback(async (config) => {
    return await request('POST', '/sync/config', config);
  }, [request]);

  const getSyncStats = useCallback(async () => {
    return await request('GET', '/sync/stats');
  }, [request]);

  const resetStats = useCallback(async () => {
    return await request('POST', '/sync/stats/reset');
  }, [request]);

  const clearCache = useCallback(async () => {
    return await request('POST', '/cache/clear');
  }, [request]);

  return {
    loading,
    error,
    getVersion,
    compareVersion,
    bumpVersion,
    getContent,
    getAllContent,
    getIncrementalContent,
    updateContent,
    batchUpdate,
    rollback,
    getLogs,
    getSyncConfig,
    updateSyncConfig,
    getSyncStats,
    resetStats,
    clearCache,
  };
}
