import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { login } = useContext(AuthContext);
  const { t, isRTL } = useLanguage();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.response?.data?.message || t('login-error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4 language-transition" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden card-transition">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img src="/Logo.jpg" alt="Skill Snap Logo" className="w-12 h-12 object-contain rounded-lg" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-transition">
              {t('welcome-back-login')}
            </h2>
            <p className="text-slate-600 text-transition">
              {t('sign-in-to-continue')}
            </p>
          </div>
          
          {/* Form */}
          <div className="px-8 pb-8">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('email-address')}
                  </label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-slate-400 text-direction-transition"
                    placeholder={t('enter-email')}
                    value={formData.email}
                    onChange={handleChange}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
                
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('password')}
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 hover:border-slate-400 text-direction-transition"
                    placeholder={t('enter-password')}
                    value={formData.password}
                    onChange={handleChange}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl toggle-button"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {t('signing-in')}
                  </div>
                ) : (
                  t('sign-in')
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                {t('forgot-password')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;