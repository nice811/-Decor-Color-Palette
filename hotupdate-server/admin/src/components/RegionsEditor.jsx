import { useState, useEffect } from 'react';

// ============================================================
// 区域配置说明（中文注释，仅供开发者调试参考）
// ============================================================
//
// 【区域划分】
// west     = 北美市场（American）   → 低饱和、高级灰调、柔和明度
// nordic   = 北欧市场（Nordic）    → 低饱和、冷灰调、高明度
// mediterranean = 地中海南欧（Sothern EU）→ 中高饱和、暖色调、中明度
//
// 【HSL色彩模型说明】
// H (Hue) 色相：0-360度，决定颜色种类
//   0-30  = 红橙黄色系（暖色）
//   30-90 = 黄绿色系
//   90-150 = 绿色系
//   150-210 = 青蓝绿色系
//   210-270 = 蓝色系
//   270-330 = 蓝紫色系
//   330-360 = 紫红色系
//
// S (Saturation) 饱和度：0-1，表示颜色的纯度
//   0.0-0.2 = 极低饱和（灰色调）
//   0.2-0.4 = 低饱和（高级灰）
//   0.4-0.6 = 中等饱和
//   0.6-0.8 = 高饱和（鲜艳）
//   0.8-1.0 = 极高饱和
//
// L (Lightness) 明度：0-1，表示颜色的明暗
//   0.0-0.3 = 暗色调
//   0.3-0.5 = 中间色调
//   0.5-0.7 = 亮色调
//   0.7-0.9 = 淡色调
//   0.9-1.0 = 极亮（接近白色）
//
// 【参数作用说明】
// hueRanges        = 基础墙面色相范围，决定主色调
// wallSaturation   = 墙面饱和度范围，影响色调沉稳度
// accentSaturation = 软装点缀色饱和度，影响活泼程度
// lightnessMin/Max = 明度上下限，影响整体明亮程度
// accentLightnessMin/Max = 点缀清明度范围
// neutralLightness = 中性色明度范围（灰调）
//
// ============================================================

const REGIONS = [
  { 
    code: 'west', 
    name: '北美市场', 
    emoji: '🇺🇸',
    desc: 'American Market',
    color: '#3B82F6',
    defaultParams: {
      hueRanges: [[0, 40], [180, 230], [30, 60]],
      wallSaturation: [0.18, 0.35],
      accentSaturation: [0.25, 0.45],
      lightnessMin: 0.72,
      lightnessMax: 0.92,
      accentLightnessMin: 0.50,
      accentLightnessMax: 0.70,
      neutralLightnessMin: 0.75,
      neutralLightnessMax: 0.92,
      description: '柔和低饱和配色，适合现代简约、北欧风格'
    }
  },
  { 
    code: 'nordic', 
    name: '北欧市场', 
    emoji: '🇸🇪',
    desc: 'Nordic Market',
    color: '#10B981',
    defaultParams: {
      hueRanges: [[180, 220], [200, 240], [0, 360]],
      wallSaturation: [0.12, 0.28],
      accentSaturation: [0.20, 0.40],
      lightnessMin: 0.78,
      lightnessMax: 0.95,
      accentLightnessMin: 0.45,
      accentLightnessMax: 0.68,
      neutralLightnessMin: 0.82,
      neutralLightnessMax: 0.96,
      description: '冷灰调高明度，极简斯堪的纳维亚风格'
    }
  },
  { 
    code: 'mediterranean', 
    name: '地中海南欧', 
    emoji: '🇪🇸',
    desc: 'Southern EU Market',
    color: '#F59E0B',
    defaultParams: {
      hueRanges: [[15, 45], [35, 65], [180, 200]],
      wallSaturation: [0.35, 0.55],
      accentSaturation: [0.55, 0.85],
      lightnessMin: 0.65,
      lightnessMax: 0.88,
      accentLightnessMin: 0.55,
      accentLightnessMax: 0.78,
      neutralLightnessMin: 0.70,
      neutralLightnessMax: 0.88,
      description: '温暖中高饱和，南欧地中海风格'
    }
  },
];

export default function RegionsEditor({ data, onSave }) {
  const [regions, setRegions] = useState({});
  const [changelog, setChangelog] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [activeRegion, setActiveRegion] = useState('west');
  const [params, setParams] = useState({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data && Object.keys(data).length > 0) {
      setRegions(data);
      setParams(data[activeRegion] || getDefaultParams(activeRegion));
    } else {
      const defaultData = {};
      REGIONS.forEach(r => {
        defaultData[r.code] = r.defaultParams;
      });
      setRegions(defaultData);
      setParams(defaultData[activeRegion]);
    }
  }, [data]);

  useEffect(() => {
    if (regions[activeRegion]) {
      setParams(regions[activeRegion]);
    }
  }, [activeRegion, regions]);

  const getDefaultParams = (code) => {
    return REGIONS.find(r => r.code === code)?.defaultParams || REGIONS[0].defaultParams;
  };

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const updateHueRange = (index, field, value) => {
    const newRanges = [...(params.hueRanges || [])];
    newRanges[index] = { ...newRanges[index], [field]: parseInt(value) || 0 };
    setParams(prev => ({ ...prev, hueRanges: newRanges }));
    setSaved(false);
  };

  const addHueRange = () => {
    const newRanges = [...(params.hueRanges || []), { min: 0, max: 30 }];
    setParams(prev => ({ ...prev, hueRanges: newRanges }));
    setSaved(false);
  };

  const removeHueRange = (index) => {
    const newRanges = (params.hueRanges || []).filter((_, i) => i !== index);
    setParams(prev => ({ ...prev, hueRanges: newRanges }));
    setSaved(false);
  };

  const handleSave = () => {
    const newRegions = { ...regions };
    newRegions[activeRegion] = params;
    setRegions(newRegions);
    onSave(newRegions, changelog || `更新${REGIONS.find(r => r.code === activeRegion)?.name}配色参数`);
    setChangelog('');
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (confirm('确定要重置此区域的参数为默认值吗？')) {
      const defaultParams = getDefaultParams(activeRegion);
      setParams(defaultParams);
      setSaved(false);
    }
  };

  const handleResetAll = () => {
    if (confirm('确定要重置所有区域的参数为默认值吗？')) {
      const defaultData = {};
      REGIONS.forEach(r => {
        defaultData[r.code] = r.defaultParams;
      });
      setRegions(defaultData);
      setParams(defaultData[activeRegion]);
      onSave(defaultData, '重置所有区域为默认配色参数');
      setSaved(true);
    }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-100';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const currentRegion = REGIONS.find(r => r.code === activeRegion);

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      {/* 顶部工具栏 */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className={`text-2xl font-bold ${textClass}`}>配色 HSL 参数配置</h2>
            <p className={`text-sm ${textSecondary}`}>可视化调整三大市场区域配色算法参数</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              {darkMode ? '🌞 浅色' : '🌙 深色'}
            </button>
            <button
              onClick={handleResetAll}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              🔄 重置全部
            </button>
          </div>
        </div>

        {/* 区域选择标签 */}
        <div className="flex gap-2">
          {REGIONS.map(region => (
            <button
              key={region.code}
              onClick={() => setActiveRegion(region.code)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeRegion === region.code
                  ? 'text-white'
                  : `${cardClass} border ${textSecondary} hover:bg-gray-50`
              }`}
              style={activeRegion === region.code ? { backgroundColor: region.color } : {}}
            >
              <span>{region.emoji}</span>
              <span className="font-medium">{region.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：参数配置表单 */}
          <div className={`${cardClass} rounded-xl border p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{currentRegion?.emoji}</span>
                <div>
                  <h3 className={`text-xl font-bold ${textClass}`}>{currentRegion?.name}</h3>
                  <p className={`text-sm ${textSecondary}`}>{currentRegion?.description}</p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
              >
                重置默认
              </button>
            </div>

            <div className="space-y-6">
              {/* 色相区间配置 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  🎨 色相区间配置（Hue Ranges）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  定义基础墙面可使用的色相范围（0-360度），可添加多个区间
                </p>
                <div className="space-y-2">
                  {(params.hueRanges || []).map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={range.min}
                        onChange={(e) => updateHueRange(index, 'min', e.target.value)}
                        className={`w-20 px-2 py-1 rounded border text-sm ${inputClass}`}
                      />
                      <span className={textSecondary}>° ~ </span>
                      <input
                        type="number"
                        min="0"
                        max="360"
                        value={range.max}
                        onChange={(e) => updateHueRange(index, 'max', e.target.value)}
                        className={`w-20 px-2 py-1 rounded border text-sm ${inputClass}`}
                      />
                      <span className={textSecondary}>°</span>
                      <button
                        onClick={() => removeHueRange(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addHueRange}
                  className="mt-2 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
                >
                  + 添加色相区间
                </button>
              </div>

              {/* 墙面饱和度 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  🧱 墙面饱和度（Wall Saturation）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  控制墙面颜色的饱和度范围，欧美偏好低饱和高级灰
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className={`text-xs ${textSecondary}`}>最小值：{params.wallSaturation?.[0] || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.wallSaturation?.[0] || 0}
                      onChange={(e) => updateParam('wallSaturation', [parseFloat(e.target.value), params.wallSaturation?.[1] || 0.5])}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`text-xs ${textSecondary}`}>最大值：{params.wallSaturation?.[1] || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.wallSaturation?.[1] || 0.5}
                      onChange={(e) => updateParam('wallSaturation', [params.wallSaturation?.[0] || 0, parseFloat(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 点缀色饱和度 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  ✨ 点缀色饱和度（Accent Saturation）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  控制软装、装饰品的颜色饱和度，影响活泼程度
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className={`text-xs ${textSecondary}`}>最小值：{params.accentSaturation?.[0] || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.accentSaturation?.[0] || 0}
                      onChange={(e) => updateParam('accentSaturation', [parseFloat(e.target.value), params.accentSaturation?.[1] || 0.5])}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className={`text-xs ${textSecondary}`}>最大值：{params.accentSaturation?.[1] || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.accentSaturation?.[1] || 0.5}
                      onChange={(e) => updateParam('accentSaturation', [params.accentSaturation?.[0] || 0, parseFloat(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 明度范围 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  💡 基础明度范围（Lightness Range）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  控制整体配色的明暗程度，高明度=明亮通透，低明度=沉稳厚重
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${textSecondary}`}>墙面明度下限：{params.lightnessMin || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.lightnessMin || 0}
                      onChange={(e) => updateParam('lightnessMin', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${textSecondary}`}>墙面明度上限：{params.lightnessMax || 1}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.lightnessMax || 1}
                      onChange={(e) => updateParam('lightnessMax', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 点缀清明度 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  🌟 点缀清明度（Accent Lightness）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  控制点缀色的明暗，通常比墙面稍暗以形成对比
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${textSecondary}`}>下限：{params.accentLightnessMin || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.accentLightnessMin || 0}
                      onChange={(e) => updateParam('accentLightnessMin', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${textSecondary}`}>上限：{params.accentLightnessMax || 1}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.accentLightnessMax || 1}
                      onChange={(e) => updateParam('accentLightnessMax', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 中性清明度 */}
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <h4 className={`font-semibold mb-3 ${textClass}`}>
                  ⚪ 中性清明度（Neutral Lightness）
                </h4>
                <p className={`text-xs ${textSecondary} mb-3`}>
                  控制灰色、中性色的明度范围，高值=浅灰，低值=深灰
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`text-xs ${textSecondary}`}>下限：{params.neutralLightnessMin || 0}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.neutralLightnessMin || 0}
                      onChange={(e) => updateParam('neutralLightnessMin', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className={`text-xs ${textSecondary}`}>上限：{params.neutralLightnessMax || 1}</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={params.neutralLightnessMax || 1}
                      onChange={(e) => updateParam('neutralLightnessMax', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* 保存按钮 */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <input
                  type="text"
                  placeholder="📝 更新日志（可选）..."
                  value={changelog}
                  onChange={(e) => setChangelog(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${inputClass}`}
                />
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  💾 保存并发布参数
                </button>
              </div>

              {saved && (
                <div className="mt-2 text-center text-green-500 text-sm">
                  ✓ 保存成功！前端下次访问将自动使用新参数
                </div>
              )}
            </div>
          </div>

          {/* 右侧：实时预览 */}
          <div className="space-y-6">
            {/* 色彩预览 */}
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>🎨 色彩预览</h3>
              
              {/* 墙面色预览 */}
              <div className="mb-4">
                <p className={`text-sm ${textSecondary} mb-2`}>墙面主色预览（基于当前饱和度与明度）</p>
                <div className="flex gap-2">
                  {[0, 0.25, 0.5].map((sat, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg"
                      style={{
                        backgroundColor: `hsl(30, ${(params.wallSaturation?.[0] + (params.wallSaturation?.[1] - params.wallSaturation?.[0]) * sat) || 0.3 * 100}%, ${(params.lightnessMin || 0.7) * 100}%)`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 点缀色预览 */}
              <div className="mb-4">
                <p className={`text-sm ${textSecondary} mb-2`}>点缀色预览</p>
                <div className="flex gap-2">
                  {[0, 0.5, 1].map((sat, i) => (
                    <div
                      key={i}
                      className="w-16 h-16 rounded-lg"
                      style={{
                        backgroundColor: `hsl(200, ${(params.accentSaturation?.[0] + (params.accentSaturation?.[1] - params.accentSaturation?.[0]) * sat) || 0.5 * 100}%, ${(params.accentLightnessMin || 0.5) * 100}%)`
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* 中性色预览 */}
              <div>
                <p className={`text-sm ${textSecondary} mb-2`}>中性色预览</p>
                <div className="flex gap-2">
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{ backgroundColor: `hsl(0, 0%, ${(params.neutralLightnessMin || 0.8) * 100}%)` }}
                  />
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{ backgroundColor: `hsl(0, 0%, ${((params.neutralLightnessMin + params.neutralLightnessMax) / 2 || 0.85) * 100}%)` }}
                  />
                  <div
                    className="w-16 h-16 rounded-lg"
                    style={{ backgroundColor: `hsl(0, 0%, ${(params.neutralLightnessMax || 0.9) * 100}%)` }}
                  />
                </div>
              </div>
            </div>

            {/* 参数JSON预览 */}
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📋 当前区域JSON参数</h3>
              <pre className={`text-xs font-mono p-4 rounded-lg overflow-auto max-h-64 ${darkMode ? 'bg-gray-900 text-green-400' : 'bg-gray-50 text-gray-800'}`}>
                {JSON.stringify(params, null, 2)}
              </pre>
            </div>

            {/* 说明文档 */}
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📖 参数调整指南</h3>
              <div className={`text-sm space-y-3 ${textSecondary}`}>
                <div>
                  <strong className={textClass}>北美市场 (west)：</strong>
                  推荐低饱和(0.18-0.35)+高明度(0.72-0.92)，适合现代简约风格
                </div>
                <div>
                  <strong className={textClass}>北欧市场 (nordic)：</strong>
                  极低饱和(0.12-0.28)+极高明度(0.78-0.95)，适合斯堪的纳维亚极简
                </div>
                <div>
                  <strong className={textClass}>地中海南欧 (mediterranean)：</strong>
                  中高饱和(0.35-0.55)+中高明度(0.65-0.88)，适合温暖南欧风格
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
