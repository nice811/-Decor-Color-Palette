/**
 * 登录/注册弹窗组件
 * 支持登录和注册切换，包含表单验证和错误提示
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const { t } = useTranslation('common');
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const result = await login(username, password);
        if (result.success) {
          onClose();
          resetForm();
        } else {
          setError(result.error || t('auth_error_generic', { defaultValue: 'Login failed' }));
        }
      } else {
        if (password.length < 6) {
          setError(t('auth_error_password_short', { defaultValue: 'Password must be at least 6 characters' }));
          setLoading(false);
          return;
        }
        const result = await register(username, password, email || undefined);
        if (result.success) {
          onClose();
          resetForm();
        } else {
          setError(result.error || t('auth_error_generic', { defaultValue: 'Registration failed' }));
        }
      }
    } catch (err) {
      setError(t('auth_error_network', { defaultValue: 'Network error, please try again' }));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setEmail('');
    setError(null);
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">
            {mode === 'login'
              ? t('auth_login_title', { defaultValue: 'Login' })
              : t('auth_register_title', { defaultValue: 'Create Account' })}
          </h2>
          <p className="text-white/80 text-sm mt-1">
            {mode === 'login'
              ? t('auth_login_desc', { defaultValue: 'Access your saved palettes' })
              : t('auth_register_desc', { defaultValue: 'Save palettes permanently' })}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 用户名 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth_username', { defaultValue: 'Username' })}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('auth_username_placeholder', { defaultValue: 'Enter username' })}
            />
          </div>

          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('auth_password', { defaultValue: 'Password' })}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder={t('auth_password_placeholder', { defaultValue: 'Enter password' })}
            />
          </div>

          {/* 邮箱（注册时显示） */}
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('auth_email', { defaultValue: 'Email (optional)' })}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t('auth_email_placeholder', { defaultValue: 'Enter email (optional)' })}
              />
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm">
              ❌ {error}
            </div>
          )}

          {/* 提交按钮 */}
          <button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {t('auth_loading', { defaultValue: 'Processing...' })}
              </>
            ) : (
              mode === 'login'
                ? t('auth_login_btn', { defaultValue: 'Login' })
                : t('auth_register_btn', { defaultValue: 'Create Account' })
            )}
          </button>

          {/* 切换模式 */}
          <div className="text-center text-sm text-gray-600">
            {mode === 'login' ? (
              <>
                {t('auth_no_account', { defaultValue: 'No account?' })}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:underline ml-1 font-medium"
                >
                  {t('auth_register_link', { defaultValue: 'Register' })}
                </button>
              </>
            ) : (
              <>
                {t('auth_has_account', { defaultValue: 'Already have account?' })}
                <button
                  type="button"
                  onClick={switchMode}
                  className="text-blue-600 hover:underline ml-1 font-medium"
                >
                  {t('auth_login_link', { defaultValue: 'Login' })}
                </button>
              </>
            )}
          </div>
        </form>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}