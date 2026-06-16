import { useState, useEffect } from 'react';

function StatusBadge({ status }) {
  const styles = {
    active: 'bg-green-100 text-green-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.info}`}>
      {status === 'active' && '✓ 运行中'}
      {status === 'success' && '✓ 成功'}
      {status === 'warning' && '⚠️ 警告'}
      {status === 'error' && '✕ 错误'}
      {status === 'info' && 'ℹ️ 信息'}
    </span>
  );
}

function formatTime(timestamp) {
  return new Date(timestamp).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

function formatHour(timestamp) {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPanel({ version, logs, onRollback, api }) {
  const [stats, setStats] = useState(null);
  const [config, setConfig] = useState(null);
  const [rollbackVersion, setRollbackVersion] = useState('');
  const [rollbackReason, setRollbackReason] = useState('');
  const [manualChangelog, setManualChangelog] = useState('');
  const [activeTab, setActiveTab] = useState('version');
  const [notification, setNotification] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, configData] = await Promise.all([
        api.getSyncStats(),
        api.getSyncConfig(),
      ]);
      setStats(statsData);
      setConfig(configData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRollback = async () => {
    if (!rollbackVersion) return;
    try {
      await onRollback(rollbackVersion, rollbackReason || `回退到 ${rollbackVersion}`);
      setRollbackVersion('');
      setRollbackReason('');
      showNotification('版本回退成功！');
      loadData();
    } catch (err) {
      showNotification('回退失败：' + err.message, 'error');
    }
  };

  const handleManualBump = async () => {
    try {
      await api.bumpVersion(manualChangelog || '手动升级版本');
      setManualChangelog('');
      showNotification('版本升级成功！');
      loadData();
    } catch (err) {
      showNotification('升级失败：' + err.message, 'error');
    }
  };

  const handleConfigSave = async () => {
    try {
      await api.updateSyncConfig(config);
      showNotification('同步配置已更新！');
    } catch (err) {
      showNotification('配置保存失败：' + err.message, 'error');
    }
  };

  const handleClearCache = async () => {
    if (confirm('确定要清空云端缓存吗？这将强制所有访客下次访问时完整拉取全部资源。')) {
      try {
        await api.clearCache();
        showNotification('缓存已清空，版本已升级！');
        loadData();
      } catch (err) {
        showNotification('清空失败：' + err.message, 'error');
      }
    }
  };

  const handleResetStats = async () => {
    if (confirm('确定要重置统计数据吗？')) {
      try {
        await api.resetStats();
        showNotification('统计数据已重置！');
        loadData();
      } catch (err) {
        showNotification('重置失败：' + err.message, 'error');
      }
    }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputClass = darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';

  const tabs = [
    { id: 'version', label: '版本管理', icon: '📦' },
    { id: 'logs', label: '更新日志', icon: '📋' },
    { id: 'sync', label: '同步配置', icon: '🔄' },
    { id: 'stats', label: '访问统计', icon: '📊' },
  ];

  const chartData = stats?.last24Hours || [];
  const maxCount = Math.max(...chartData.map(d => d.count), 1);

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-300`}>
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-bold ${textClass}`}>版本管理 & 自动同步中心</h2>
            <p className={`text-sm ${textSecondary}`}>管理云端资源版本、配置同步规则、查看访问统计</p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            {darkMode ? '🌞 浅色' : '🌙 深色'}
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : `${cardClass} border ${textSecondary} hover:bg-gray-50`
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'version' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardClass} rounded-xl border p-6`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={`text-xl font-bold ${textClass}`}>📦 当前版本</h3>
                  <p className={`text-sm ${textSecondary}`}>云端资源版本信息</p>
                </div>
                <StatusBadge status="active" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>版本号</span>
                  <span className={`text-2xl font-bold ${textClass}`}>v{version?.version || '---'}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>上次更新时间</span>
                  <span className={textClass}>{version?.timestamp ? formatTime(version.timestamp) : '---'}</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>今日同步请求</span>
                  <span className={textClass}>{stats?.todaySyncRequests || 0} 次</span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>累计同步请求</span>
                  <span className={textClass}>{stats?.totalSyncRequests || 0} 次</span>
                </div>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>⚙️ 版本操作</h3>

              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>手动升级版本</label>
                  <input
                    type="text"
                    placeholder="输入更新说明（可选）..."
                    value={manualChangelog}
                    onChange={(e) => setManualChangelog(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${inputClass}`}
                  />
                  <button
                    onClick={handleManualBump}
                    className="mt-2 w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    🚀 升级版本号
                  </button>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>版本回退</label>
                  <input
                    type="text"
                    placeholder="输入要回退的版本号（如 1.0.5）"
                    value={rollbackVersion}
                    onChange={(e) => setRollbackVersion(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border ${inputClass}`}
                  />
                  <input
                    type="text"
                    placeholder="回退原因（可选）..."
                    value={rollbackReason}
                    onChange={(e) => setRollbackReason(e.target.value)}
                    className={`w-full px-4 py-2 rounded-lg border mt-2 ${inputClass}`}
                  />
                  <button
                    onClick={handleRollback}
                    disabled={!rollbackVersion}
                    className="mt-2 w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                  >
                    ↩️ 回退版本
                  </button>
                </div>

                <button
                  onClick={handleClearCache}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  🗑️ 清空云端缓存（强制全量更新）
                </button>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📝 更新记录</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {version?.changelog?.map((entry, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span className={`text-sm ${textClass}`}>{entry}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className={`${cardClass} rounded-xl border p-6`}>
            <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📋 更新日志记录</h3>
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-600">
                <div>时间</div>
                <div>操作类型</div>
                <div>详情</div>
                <div>ID</div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className={`text-center py-8 ${textSecondary}`}>暂无日志记录</div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="grid grid-cols-4 px-4 py-3 border-t border-gray-100 hover:bg-gray-50">
                      <div className="text-sm">{formatTime(log.timestamp)}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          log.action === 'version_bump' ? 'bg-green-100 text-green-700' :
                          log.action === 'rollback' ? 'bg-orange-100 text-orange-700' :
                          log.action === 'cache_clear' ? 'bg-red-100 text-red-700' :
                          log.action === 'config_update' ? 'bg-blue-100 text-blue-700' :
                          log.action === 'stats_reset' ? 'bg-gray-100 text-gray-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {log.action === 'version_bump' && '版本升级'}
                          {log.action === 'rollback' && '版本回退'}
                          {log.action === 'cache_clear' && '清空缓存'}
                          {log.action === 'config_update' && '配置更新'}
                          {log.action === 'stats_reset' && '重置统计'}
                          {log.action === 'batch_update' && '批量更新'}
                          {!['version_bump', 'rollback', 'cache_clear', 'config_update', 'stats_reset', 'batch_update'].includes(log.action) && log.action}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">{log.details}</div>
                      <div className="text-xs text-gray-400">{log.id.slice(-8)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>🔄 同步规则配置</h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textClass}`}>开启自动轮询</label>
                    <p className={`text-xs ${textSecondary}`}>前端每24小时自动检查版本更新</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, autoPollingEnabled: !config?.autoPollingEnabled })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${config?.autoPollingEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config?.autoPollingEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${textClass}`}>大版本更新强制刷新</label>
                    <p className={`text-xs ${textSecondary}`}>主版本号变更时提示用户刷新页面</p>
                  </div>
                  <button
                    onClick={() => setConfig({ ...config, forceRefreshOnMajorUpdate: !config?.forceRefreshOnMajorUpdate })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${config?.forceRefreshOnMajorUpdate ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${config?.forceRefreshOnMajorUpdate ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>同步模式</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfig({ ...config, syncMode: 'incremental' })}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        config?.syncMode === 'incremental'
                          ? 'bg-blue-500 text-white'
                          : `${cardClass} border ${textSecondary}`
                      }`}
                    >
                      📦 增量同步
                    </button>
                    <button
                      onClick={() => setConfig({ ...config, syncMode: 'full' })}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        config?.syncMode === 'full'
                          ? 'bg-blue-500 text-white'
                          : `${cardClass} border ${textSecondary}`
                      }`}
                    >
                      📥 全量同步
                    </button>
                  </div>
                  <p className={`text-xs mt-2 ${textSecondary}`}>
                    {config?.syncMode === 'incremental' 
                      ? '仅拉取变更的资源，节省带宽' 
                      : '每次都完整拉取所有资源'}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${textSecondary}`}>轮询间隔（毫秒）</label>
                  <input
                    type="number"
                    value={config?.pollInterval || 86400000}
                    onChange={(e) => setConfig({ ...config, pollInterval: parseInt(e.target.value) || 86400000 })}
                    className={`w-full px-4 py-2 rounded-lg border ${inputClass}`}
                  />
                  <p className={`text-xs mt-2 ${textSecondary}`}>
                    默认 86400000 毫秒 = 24小时
                  </p>
                </div>

                <button
                  onClick={handleConfigSave}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  💾 保存配置
                </button>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📖 同步规则说明</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800">🎯 自动轮询机制</h4>
                  <p className="text-sm text-blue-600 mt-1">
                    前端每次打开页面时自动检查云端版本，如果版本不一致则自动拉取更新。同时每24小时后台轮询一次。
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800">📦 增量同步</h4>
                  <p className="text-sm text-green-600 mt-1">
                    仅下载修改过的资源文件，减少带宽消耗，提升同步速度。推荐用于日常更新。
                  </p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-medium text-orange-800">📥 全量同步</h4>
                  <p className="text-sm text-orange-600 mt-1">
                    每次都下载全部资源文件，确保数据完整性。适用于重大版本更新或数据修复。
                  </p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg">
                  <h4 className="font-medium text-red-800">🗑️ 清空缓存</h4>
                  <p className="text-sm text-red-600 mt-1">
                    升级小版本号，强制所有前端下次访问时完整拉取全部资源，确保所有用户获取最新数据。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${cardClass} rounded-xl border p-6`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📊 同步统计概览</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>今日同步请求</span>
                  <span className={`text-2xl font-bold ${textClass}`}>{stats?.todaySyncRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>累计同步请求</span>
                  <span className={`text-2xl font-bold ${textClass}`}>{stats?.totalSyncRequests || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className={textSecondary}>统计最后重置</span>
                  <span className={textClass}>{stats?.lastReset ? formatDate(stats.lastReset) : '---'}</span>
                </div>
                <button
                  onClick={handleResetStats}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  🔄 重置统计数据
                </button>
              </div>
            </div>

            <div className={`${cardClass} rounded-xl border p-6 lg:col-span-2`}>
              <h3 className={`text-lg font-semibold mb-4 ${textClass}`}>📈 近24小时访问趋势</h3>
              <div className="h-48 flex items-end gap-1">
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = Math.floor(Date.now() / 3600000) - 23 + i;
                  const data = chartData.find(d => d.hour === hour);
                  const count = data?.count || 0;
                  const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-blue-500 rounded-t transition-all"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${formatHour(hour * 3600000)}: ${count} 次`}
                      />
                      <span className="text-xs text-gray-400 mt-1">
                        {i % 6 === 0 ? formatHour(hour * 3600000) : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>24小时前</span>
                <span>现在</span>
              </div>

              {stats?.versionRequests && Object.keys(stats.versionRequests).length > 0 && (
                <div className="mt-6">
                  <h4 className={`text-sm font-medium mb-2 ${textSecondary}`}>版本访问分布</h4>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.versionRequests).map(([version, count]) => (
                      <span key={version} className={`px-3 py-1 rounded-full text-sm ${cardClass} border`}>
                        <span className="font-medium">{version}</span>
                        <span className="ml-1 text-gray-500">({count})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {notification && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg z-50 transition-all ${
          notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
