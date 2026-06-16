import { useState, useEffect } from 'react';

export default function ConfigEditor({ data, onSave }) {
  const [config, setConfig] = useState({
    welcomeTitle: '',
    welcomeDesc: '',
    footerText: '',
    themeColor: '#3B82F6',
    primaryColor: '#3B82F6',
  });
  const [changelog, setChangelog] = useState('');

  useEffect(() => {
    setConfig(data || config);
  }, [data]);

  const handleSave = () => {
    onSave(config, changelog || 'Updated site config');
    setChangelog('');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-6">Site Configuration</h2>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Welcome Title</label>
          <input
            type="text"
            value={config.welcomeTitle}
            onChange={(e) => setConfig({ ...config, welcomeTitle: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Decor Color Palette"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Welcome Description</label>
          <input
            type="text"
            value={config.welcomeDesc}
            onChange={(e) => setConfig({ ...config, welcomeDesc: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Discover perfect color palettes for your home"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Footer Text</label>
          <input
            type="text"
            value={config.footerText}
            onChange={(e) => setConfig({ ...config, footerText: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="curated palettes available"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Theme Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.themeColor}
              onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
              className="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.themeColor}
              onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Primary Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="w-10 h-10 border rounded cursor-pointer"
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
              className="flex-1 px-3 py-2 border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <input
          type="text"
          placeholder="Update changelog (optional)"
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
