import { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PalettesEditor from './components/PalettesEditor';
import LocalesEditor from './components/LocalesEditor';
import RegionsEditor from './components/RegionsEditor';
import SeoEditor from './components/SeoEditor';
import ConfigEditor from './components/ConfigEditor';
import HistoryPanel from './components/HistoryPanel';
import { useApi } from './hooks/useApi';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('palettes');
  const [version, setVersion] = useState(null);
  const [logs, setLogs] = useState([]);
  const [content, setContent] = useState({
    palettes: [],
    locales: {},
    regionParams: {},
    seo: {},
    siteConfig: {},
  });
  const api = useApi();
  const { loading, error, getVersion, getContent, updateContent, rollback, getLogs } = api;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [versionData, contentData, logsData] = await Promise.all([
        getVersion(),
        getContent('palettes'),
        getLogs(),
      ]);
      setVersion(versionData);
      setContent(prev => ({ ...prev, palettes: contentData }));
      setLogs(logsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'locales') {
      getContent('locales').then(data => setContent(prev => ({ ...prev, locales: data })));
    } else if (activeTab === 'regions') {
      getContent('regionParams').then(data => setContent(prev => ({ ...prev, regionParams: data })));
    } else if (activeTab === 'seo') {
      getContent('seo').then(data => setContent(prev => ({ ...prev, seo: data })));
    } else if (activeTab === 'config') {
      getContent('siteConfig').then(data => setContent(prev => ({ ...prev, siteConfig: data })));
    } else if (activeTab === 'history') {
      getLogs().then(data => setLogs(data));
    }
  }, [activeTab]);

  const handleSave = async (type, data, changelog) => {
    try {
      const result = await updateContent(type, data, changelog);
      setVersion(result.version);
      setContent(prev => ({ ...prev, [type]: data }));
      if (type === 'palettes') {
        getLogs().then(data => setLogs(data));
      }
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleRollback = async (rollbackVersion, reason) => {
    try {
      const result = await rollback(rollbackVersion, reason);
      setVersion(result.version);
      getLogs().then(data => setLogs(data));
    } catch (err) {
      console.error('Rollback failed:', err);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'palettes':
        return <PalettesEditor data={content.palettes} onSave={(data, changelog) => handleSave('palettes', data, changelog)} />;
      case 'locales':
        return <LocalesEditor data={content.locales} onSave={(data, changelog) => handleSave('locales', data, changelog)} />;
      case 'regions':
        return <RegionsEditor data={content.regionParams} onSave={(data, changelog) => handleSave('regionParams', data, changelog)} />;
      case 'seo':
        return <SeoEditor data={content.seo} onSave={(data, changelog) => handleSave('seo', data, changelog)} />;
      case 'config':
        return <ConfigEditor data={content.siteConfig} onSave={(data, changelog) => handleSave('siteConfig', data, changelog)} />;
      case 'history':
        return <HistoryPanel version={version} logs={logs} onRollback={handleRollback} api={api} />;
      default:
        return <PalettesEditor data={content.palettes} onSave={(data, changelog) => handleSave('palettes', data, changelog)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header version={version} onRefresh={handleRefresh} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
