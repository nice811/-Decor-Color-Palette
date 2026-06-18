/**
 * 简易后台统计页面
 * 展示访问统计、AI使用统计、用户统计
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:3001';

interface StatsOverview {
  totalUsers: number;
  totalFavorites: number;
  totalVisits: number;
  todayVisits: number;
  aiTotalRequests: number;
  aiSuccessRate: number;
  aiFallbackRate: number;
}

interface AIUsageStats {
  log_date: string;
  total_requests: number;
  success_requests: number;
  fallback_requests: number;
  error_requests: number;
}

interface VisitStats {
  log_date: string;
  total_visits: number;
  unique_ips: number;
}

export function AdminStats() {
  const { t } = useTranslation('common');
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [aiUsage, setAiUsage] = useState<AIUsageStats[]>([]);
  const [visits, setVisits] = useState<VisitStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);

      try {
        // 获取概览统计
        const overviewRes = await fetch(`${API_BASE_URL}/api/stats/overview`);
        const overviewData = await overviewRes.json();
        if (overviewData.success) {
          setOverview(overviewData.data);
        }

        // 获取AI使用统计（最近7天）
        const aiRes = await fetch(`${API_BASE_URL}/api/stats/ai-usage?days=7`);
        const aiData = await aiRes.json();
        if (aiData.success) {
          setAiUsage(aiData.data);
        }

        // 获取访问统计（最近7天）
        const visitsRes = await fetch(`${API_BASE_URL}/api/stats/visits?days=7`);
        const visitsData = await visitsRes.json();
        if (visitsData.success) {
          setVisits(visitsData.data);
        }
      } catch (err) {
        setError('Failed to fetch statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            📊 Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Statistics overview for HomePalette
          </p>
        </div>

        {/* 概览卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-500 mb-2">Total Users</div>
            <div className="text-3xl font-bold text-blue-600">
              {overview?.totalUsers || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-500 mb-2">Total Favorites</div>
            <div className="text-3xl font-bold text-red-600">
              {overview?.totalFavorites || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-500 mb-2">Today Visits</div>
            <div className="text-3xl font-bold text-green-600">
              {overview?.todayVisits || 0}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-500 mb-2">AI Requests</div>
            <div className="text-3xl font-bold text-purple-600">
              {overview?.aiTotalRequests || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">
              Success: {overview?.aiSuccessRate || 0}% | Fallback: {overview?.aiFallbackRate || 0}%
            </div>
          </div>
        </div>

        {/* AI使用统计图表 */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🤖 AI Usage (Last 7 Days)
          </h2>
          {aiUsage.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <div className="space-y-3">
              {aiUsage.map((stat) => (
                <div key={stat.log_date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    {stat.log_date}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-600">✓ {stat.success_requests}</span>
                    <span className="text-yellow-600">⚠ {stat.fallback_requests}</span>
                    <span className="text-red-600">✗ {stat.error_requests}</span>
                    <span className="text-gray-600 font-bold">Total: {stat.total_requests}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 访问统计 */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            🌐 Visits (Last 7 Days)
          </h2>
          {visits.length === 0 ? (
            <p className="text-gray-500">No data available</p>
          ) : (
            <div className="space-y-3">
              {visits.map((stat) => (
                <div key={stat.log_date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700">
                    {stat.log_date}
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">Visits: {stat.total_visits}</span>
                    <span className="text-purple-600">Unique IPs: {stat.unique_ips}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 返回链接 */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="text-blue-600 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}