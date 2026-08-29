'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { t, setLocale, getLocale } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locale, setLocaleState] = useState<'mr' | 'en'>('mr');
  const { login } = useAuthStore();
  const router = useRouter();

  useEffect(() => { setLocaleState(getLocale()); }, []);

  const toggleLocale = () => {
    const newLocale = locale === 'mr' ? 'en' : 'mr';
    setLocale(newLocale);
    setLocaleState(newLocale);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.user, res.data.accessToken, res.data.refreshToken);
      toast.success(locale === 'mr' ? 'लॉगिन यशस्वी!' : 'Login successful!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 p-4">
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <motion.div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
            क
          </motion.div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-[Noto_Sans_Devanagari]">{t('appName')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t('loginSubtitle')}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('username')}</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t('password')}</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <LogIn size={18} />}
              {t('login')}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={toggleLocale} className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              {locale === 'mr' ? 'Switch to English' : 'मराठीत बदला'}
            </button>
          </div>
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Default: superadmin / admin123</p>
        </div>
      </motion.div>
    </div>
  );
}
