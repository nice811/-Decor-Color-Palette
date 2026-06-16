import { useState, useEffect, useMemo } from 'react';

const ROOMS = [
  { value: 'living', label: 'Living Room', icon: '🛋️' },
  { value: 'bedroom', label: 'Bedroom', icon: '🛏️' },
  { value: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { value: 'bathroom', label: 'Bathroom', icon: '🛁' },
];

const STYLES = [
  { value: 'modern', label: 'Modern', color: '#3B82F6' },
  { value: 'traditional', label: 'Traditional', color: '#8B5CF6' },
  { value: 'nordic', label: 'Nordic', color: '#10B981' },
  { value: 'bohemian', label: 'Bohemian', color: '#F59E0B' },
  { value: 'minimal', label: 'Minimal', color: '#6B7280' },
  { value: 'scandinavian', label: 'Scandinavian', color: '#EC4899' },
];

const REGIONS = [
  { value: 'west', label: 'Western', emoji: '🌍', color: '#3B82F6', desc: 'US/EU' },
  { value: 'sea', label: 'Southeast Asia', emoji: '🏝️', color: '#10B981', desc: 'SEA' },
  { value: 'jpkr', label: 'Japan/Korea', emoji: '🏯', color: '#F59E0B', desc: 'JP/KR' },
];

const COLOR_ROLES = [
  { role: 'background', label: 'Background', default: '#FFFFFF' },
  { role: 'primary', label: 'Primary', default: '#333333' },
  { role: 'secondary', label: 'Secondary', default: '#666666' },
  { role: 'accent', label: 'Accent', default: '#FF6B6B' },
  { role: 'neutral', label: 'Neutral', default: '#CCCCCC' },
];

function ColorSwatch({ hex, size = 'md', onClick }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };
  return (
    <div
      className={`${sizeClasses[size]} rounded-lg shadow-sm cursor-pointer transition-transform hover:scale-110 border border-gray-200`}
      style={{ backgroundColor: hex }}
      onClick={onClick}
      title={hex}
    />
  );
}

function Tag({ label, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
        active
          ? 'text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      style={active ? { backgroundColor: color } : {}}
    >
      {label}
    </button>
  );
}

export default function PalettesEditor({ data, onSave }) {
  const [palettes, setPalettes] = useState([]);
  const [selectedPalette, setSelectedPalette] = useState(null);
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiCount, setAiCount] = useState(5);
  const [aiStyle, setAiStyle] = useState('modern');
  const [aiRegion, setAiRegion] = useState('west');
  const [aiRoom, setAiRoom] = useState('living');
  const [changelog, setChangelog] = useState('');
  const [editMode, setEditMode] = useState(null);
  const [editingPalette, setEditingPalette] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setPalettes(data || []);
  }, [data]);

  const filteredPalettes = useMemo(() => {
    return palettes.filter(palette => {
      if (filterRegion !== 'all' && palette.region !== filterRegion) return false;
      if (filterRoom !== 'all' && palette.room !== filterRoom) return false;
      if (filterStyle !== 'all' && palette.style !== filterStyle) return false;
      if (searchQuery && !palette.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [palettes, filterRegion, filterRoom, filterStyle, searchQuery]);

  const openEdit = (palette) => {
    setEditingPalette({ ...palette });
    setEditMode(palette.id);
  };

  const saveEdit = () => {
    if (!editingPalette) return;
    setPalettes(palettes.map(p => p.id === editingPalette.id ? editingPalette : p));
    setEditMode(null);
    setEditingPalette(null);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditingPalette(null);
  };

  const deletePalette = (id) => {
    if (confirm('Are you sure you want to delete this palette?')) {
      setPalettes(palettes.filter(p => p.id !== id));
      if (selectedPalette?.id === id) setSelectedPalette(null);
    }
  };

  const addNewPalette = () => {
    const newPalette = {
      id: `palette-${Date.now()}`,
      name: 'New Palette',
      style: 'modern',
      room: 'living',
      region: 'west',
      description: '',
      colors: COLOR_ROLES.map(role => ({
        hex: role.default,
        name: role.label,
        role: role.role,
      })),
    };
    setPalettes([newPalette, ...palettes]);
    openEdit(newPalette);
  };

  const updateColor = (paletteId, colorIndex, field, value) => {
    setPalettes(palettes.map(p => {
      if (p.id !== paletteId) return p;
      const colors = [...p.colors];
      colors[colorIndex][field] = value;
      return { ...p, colors };
    }));
    if (editingPalette?.id === paletteId) {
      const colors = [...editingPalette.colors];
      colors[colorIndex][field] = value;
      setEditingPalette({ ...editingPalette, colors });
    }
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importText);
      const validPalettes = imported.map((p, i) => ({
        ...p,
        id: p.id || `imported-${Date.now()}-${i}`,
      }));
      setPalettes([...validPalettes, ...palettes]);
      setShowImportModal(false);
      setImportText('');
    } catch (err) {
      alert('Invalid JSON format');
    }
  };

  const generateAiPalettes = async () => {
    setIsGenerating(true);
    const generated = [];
    
    for (let i = 0; i < aiCount; i++) {
      const palette = generateRandomPalette(aiStyle, aiRoom, aiRegion);
      generated.push(palette);
    }
    
    setPalettes([...generated, ...palettes]);
    setIsGenerating(false);
    setShowAiModal(false);
  };

  const generateRandomPalette = (style, room, region) => {
    const hues = {
      modern: [200, 220, 240, 260],
      traditional: [20, 30, 40, 350],
      nordic: [180, 190, 200, 210],
      bohemian: [0, 30, 45, 330],
      minimal: [0, 200, 220, 240],
      scandinavian: [10, 20, 220, 240],
    };

    const saturation = {
      west: [0.18, 0.35],
      sea: [0.45, 0.75],
      jpkr: [0.25, 0.55],
    };

    const lightness = {
      west: [0.72, 0.92],
      sea: [0.68, 0.90],
      jpkr: [0.70, 0.93],
    };

    const styleHues = hues[style] || hues.modern;
    const baseHue = styleHues[Math.floor(Math.random() * styleHues.length)] + Math.floor(Math.random() * 20) - 10;
    const satRange = saturation[region] || saturation.west;
    const lightRange = lightness[region] || lightness.west;

    const getRandom = (min, max) => Math.random() * (max - min) + min;

    const colors = [
      { hex: hslToHex(baseHue, getRandom(0.05, 0.15), getRandom(0.92, 0.98)), name: 'Background', role: 'background' },
      { hex: hslToHex(baseHue, getRandom(satRange[0], satRange[1]), getRandom(0.35, 0.55)), name: 'Primary', role: 'primary' },
      { hex: hslToHex((baseHue + 30) % 360, getRandom(satRange[0] * 0.8, satRange[1] * 0.8), getRandom(0.50, 0.70)), name: 'Secondary', role: 'secondary' },
      { hex: hslToHex((baseHue + 180) % 360, getRandom(satRange[0] * 1.2, satRange[1] * 1.2), getRandom(0.55, 0.75)), name: 'Accent', role: 'accent' },
      { hex: hslToHex(baseHue, getRandom(0.02, 0.08), getRandom(0.85, 0.95)), name: 'Neutral', role: 'neutral' },
    ];

    const regionNames = { west: 'Western', sea: 'Tropical', jpkr: 'Zen' };
    const styleNames = { modern: 'Modern', traditional: 'Classic', nordic: 'Scandinavian', bohemian: 'Bohemian', minimal: 'Minimal', scandinavian: 'Nordic' };

    return {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${regionNames[region]} ${styleNames[style]} ${Math.floor(baseHue)}°`,
      style,
      room,
      region,
      description: `Beautiful ${styleNames[style].toLowerCase()} color palette perfect for ${room} spaces`,
      colors,
    };
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
  };

  const handleSave = () => {
    onSave(palettes, changelog || 'Updated color palettes');
    setChangelog('');
  };

  const exportJson = () => {
    const json = JSON.stringify(palettes, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'color-palettes.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${textClass}`}>Color Palette Manager</h2>
          <p className={`text-sm ${textSecondary}`}>Manage and organize your color schemes</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            {darkMode ? '🌞 Light' : '🌙 Dark'}
          </button>
          <button
            onClick={exportJson}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            📥 Export JSON
          </button>
          <button
            onClick={addNewPalette}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            + Add Palette
          </button>
        </div>
      </div>

      <div className={`${cardClass} rounded-xl p-4 mb-6 border`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search palettes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            />
          </div>
          <div>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            >
              <option value="all">All Regions</option>
              {REGIONS.map(r => (
                <option key={r.value}>{r.emoji} {r.label}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
            >
              <option value="all">All Rooms</option>
              {ROOMS.map(r => (
                <option key={r.value}>{r.icon} {r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Tag
              label="All"
              color="#6B7280"
              active={filterStyle === 'all'}
              onClick={() => setFilterStyle('all')}
            />
            {STYLES.map(s => (
              <Tag
                key={s.value}
                label={s.label}
                color={s.color}
                active={filterStyle === s.value}
                onClick={() => setFilterStyle(s.value)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowImportModal(true)}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
        >
          📤 Batch Import
        </button>
        <button
          onClick={() => setShowAiModal(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          🤖 AI Generate
        </button>
        <div className="flex-1" />
        <input
          type="text"
          placeholder="Update changelog..."
          value={changelog}
          onChange={(e) => setChangelog(e.target.value)}
          className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass} w-64`}
        />
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Save & Publish
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPalettes.length === 0 ? (
          <div className={`col-span-full text-center py-12 ${textSecondary}`}>
            <p className="text-4xl mb-4">🎨</p>
            <p>No palettes found matching your filters</p>
          </div>
        ) : (
          filteredPalettes.map(palette => (
            <div
              key={palette.id}
              className={`${cardClass} rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-lg ${
                selectedPalette?.id === palette.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex">
                <div className="flex-1">
                  {editMode === palette.id ? (
                    <div className="p-4">
                      <input
                        type="text"
                        value={editingPalette?.name || ''}
                        onChange={(e) => setEditingPalette({ ...editingPalette, name: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border mb-3 ${inputClass}`}
                      />
                      <textarea
                        value={editingPalette?.description || ''}
                        onChange={(e) => setEditingPalette({ ...editingPalette, description: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border mb-3 h-16 ${inputClass}`}
                        placeholder="Description..."
                      />
                      <div className="flex gap-2">
                        <select
                          value={editingPalette?.room || 'living'}
                          onChange={(e) => setEditingPalette({ ...editingPalette, room: e.target.value })}
                          className={`px-3 py-2 rounded-lg border ${inputClass}`}
                        >
                          {ROOMS.map(r => <option key={r.value}>{r.icon} {r.label}</option>)}
                        </select>
                        <select
                          value={editingPalette?.style || 'modern'}
                          onChange={(e) => setEditingPalette({ ...editingPalette, style: e.target.value })}
                          className={`px-3 py-2 rounded-lg border ${inputClass}`}
                        >
                          {STYLES.map(s => <option key={s.value}>{s.label}</option>)}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-semibold ${textClass}`}>{palette.name}</h3>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium"
                          style={{ backgroundColor: REGIONS.find(r => r.value === palette.region)?.color + '20', color: REGIONS.find(r => r.value === palette.region)?.color }}
                        >
                          {REGIONS.find(r => r.value === palette.region)?.emoji} {REGIONS.find(r => r.value === palette.region)?.desc}
                        </span>
                      </div>
                      {palette.description && (
                        <p className={`text-sm ${textSecondary} mb-3 line-clamp-2`}>{palette.description}</p>
                      )}
                      <div className="flex gap-2 flex-wrap mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${textSecondary} bg-gray-100`}>
                          {ROOMS.find(r => r.value === palette.room)?.icon} {ROOMS.find(r => r.value === palette.room)?.label}
                        </span>
                        <span
                          className="px-2 py-1 rounded-full text-xs text-white"
                          style={{ backgroundColor: STYLES.find(s => s.value === palette.style)?.color }}
                        >
                          {STYLES.find(s => s.value === palette.style)?.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="w-20 flex flex-col">
                  {palette.colors.map((color, ci) => (
                    <div
                      key={ci}
                      className="flex-1 cursor-pointer hover:scale-105 transition-transform relative group"
                      style={{ backgroundColor: color.hex }}
                      onClick={() => {
                        navigator.clipboard.writeText(color.hex);
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <span className="text-white text-xs font-bold">{color.hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className={`px-4 py-2 flex gap-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                {editMode === palette.id ? (
                  <>
                    <button onClick={saveEdit} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">
                      Save
                    </button>
                    <button onClick={cancelEdit} className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600">
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(palette)} className={`px-3 py-1 text-sm rounded hover:bg-gray-100 ${textSecondary}`}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => deletePalette(palette.id)} className={`px-3 py-1 text-sm rounded hover:bg-red-100 text-red-500`}>
                      🗑️ Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-xl p-6 w-full max-w-2xl border`}>
            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>📤 Batch Import</h3>
            <p className={`text-sm ${textSecondary} mb-4`}>
              Paste your JSON data below. Each palette should have: id, name, style, room, region, description, colors[]
            </p>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className={`w-full h-64 px-4 py-3 rounded-lg border font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
              placeholder='[
  {
    "id": "palette-1",
    "name": "Sunset Dreams",
    "style": "bohemian",
    "room": "living",
    "region": "sea",
    "description": "Warm tropical palette",
    "colors": [
      {"hex": "#FFF8F0", "name": "Background", "role": "background"},
      {"hex": "#E8A87C", "name": "Primary", "role": "primary"},
      {"hex": "#C38D9E", "name": "Secondary", "role": "secondary"},
      {"hex": "#F58E8E", "name": "Accent", "role": "accent"},
      {"hex": "#D4D4D4", "name": "Neutral", "role": "neutral"}
    ]
  }
]'
            />
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setShowImportModal(false)} className={`px-4 py-2 rounded-lg ${textSecondary} hover:bg-gray-100`}>
                Cancel
              </button>
              <button onClick={handleImport} className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showAiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`${cardClass} rounded-xl p-6 w-full max-w-md border`}>
            <h3 className={`text-xl font-bold mb-4 ${textClass}`}>🤖 AI Generate Palettes</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Number of palettes</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={aiCount}
                  onChange={(e) => setAiCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Style</label>
                <select
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                >
                  {STYLES.map(s => <option key={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Region</label>
                <select
                  value={aiRegion}
                  onChange={(e) => setAiRegion(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                >
                  {REGIONS.map(r => <option key={r.value}>{r.emoji} {r.label}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>Room</label>
                <select
                  value={aiRoom}
                  onChange={(e) => setAiRoom(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                >
                  {ROOMS.map(r => <option key={r.value}>{r.icon} {r.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button onClick={() => setShowAiModal(false)} className={`px-4 py-2 rounded-lg ${textSecondary} hover:bg-gray-100`}>
                Cancel
              </button>
              <button
                onClick={generateAiPalettes}
                disabled={isGenerating}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
