import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle, Key, LogIn, Mail, Sparkles, UserPlus } from 'lucide-react';
import { RollingText } from './RollingText';
import {
  sendPasswordReset,
  signInWithEmail,
  signUpWithEmail,
  updateCurrentUserPassword,
} from '../services/authService';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import { getFriendlyErrorMessage } from '../lib/errors';

type AuthMode = 'login' | 'signup' | 'forgot' | 'reset';
const PASSWORD_RECOVERY_KEY = 'warungify_password_recovery';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
  onPasswordResetComplete?: () => void;
  onBackToLanding: () => void;
  lang: 'id' | 'en';
  setLang: (lang: 'id' | 'en') => void;
  onDemoClick: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ 
  onLoginSuccess, 
  onPasswordResetComplete, 
  onBackToLanding,
  lang,
  setLang,
  onDemoClick,
}) => {
  const initialMode = useMemo<AuthMode>(() => (
    window.location.hash.includes('mode=reset') || sessionStorage.getItem(PASSWORD_RECOVERY_KEY) === 'true' ? 'reset' : 'login'
  ), []);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isLogin = mode === 'login';
  const isSignup = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  const title = {
    login: lang === 'id' ? 'Selamat Datang' : 'Welcome Back',
    signup: lang === 'id' ? 'Buat Akun Baru' : 'Create New Account',
    forgot: lang === 'id' ? 'Reset Password' : 'Reset Password',
    reset: lang === 'id' ? 'Password Baru' : 'New Password',
  }[mode];

  const subtitle = {
    login: lang === 'id' ? 'Login untuk masuk ke workspace Warungify Anda.' : 'Login to enter your Warungify workspace.',
    signup: lang === 'id' ? 'Daftar akun dan verifikasi email sebelum masuk dashboard.' : 'Register an account and verify your email before entering the dashboard.',
    forgot: lang === 'id' ? 'Masukkan email akun Anda untuk menerima link reset password.' : 'Enter your account email to receive a password reset link.',
    reset: lang === 'id' ? 'Masukkan password baru untuk mengamankan akun Anda.' : 'Enter a new password to secure your account.',
  }[mode];

  const submitLabel = {
    login: lang === 'id' ? 'Masuk Workspace' : 'Enter Workspace',
    signup: lang === 'id' ? 'Daftar Akun' : 'Create Account',
    forgot: lang === 'id' ? 'Kirim Link Reset' : 'Send Reset Link',
    reset: lang === 'id' ? 'Perbarui Password' : 'Update Password',
  }[mode];

  const resetMessages = () => {
    setError('');
    setNotice('');
  };

  const switchMode = (nextMode: AuthMode) => {
    resetMessages();
    if (nextMode !== 'reset' && window.location.hash.includes('mode=reset')) {
      window.history.replaceState(null, '', `${window.location.pathname}#/login`);
    }
    setMode(nextMode);
  };

  const validatePasswordMatch = () => {
    if ((isSignup || isReset) && password !== confirmPassword) {
      throw new Error(lang === 'id' ? 'Konfirmasi password tidak cocok.' : 'Password confirmation does not match.');
    }
    if ((isSignup || isReset || isLogin) && password.length < 6) {
      throw new Error(lang === 'id' ? 'Password minimal 6 karakter.' : 'Password must be at least 6 characters.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    try {
      if (!isSupabaseConfigured) {
        throw new Error(lang === 'id' ? 'Supabase env belum dikonfigurasi. Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.' : 'Supabase env has not been configured. Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      }

      if (isLogin) {
        sessionStorage.removeItem('warungify_email_confirm_redirect');
        if (window.location.search.includes('auth=confirm')) {
          window.history.replaceState(null, '', `${window.location.pathname}#/login`);
        }
        validatePasswordMatch();
        await signInWithEmail(email, password);
        onLoginSuccess(email);
      } else if (isSignup) {
        validatePasswordMatch();
        await signUpWithEmail(email, password, fullName);
        setNotice(lang === 'id' ? 'Akun dibuat. Cek email Anda untuk verifikasi sebelum login.' : 'Account created. Check your email for verification before logging in.');
        setPassword('');
        setConfirmPassword('');
        setMode('login');
      } else if (isForgot) {
        await sendPasswordReset(email);
        setNotice(lang === 'id' ? 'Link reset password sudah dikirim. Cek inbox email Anda.' : 'Password reset link sent. Check your email inbox.');
      } else if (isReset) {
        validatePasswordMatch();
        await updateCurrentUserPassword(password);
        setNotice(lang === 'id' ? 'Password berhasil diperbarui. Silakan login ulang jika diminta.' : 'Password updated successfully. Please log in again if prompted.');
        setPassword('');
        setConfirmPassword('');
        onPasswordResetComplete?.();
        window.history.replaceState(null, '', `${window.location.pathname}#/login`);
        setMode('login');
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, lang === 'id' ? 'Permintaan autentikasi gagal. Silakan periksa email dan password Anda.' : 'Auth request failed. Please check your email and password.', lang));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-50 py-12 px-4 font-sans select-none">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-900/4">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onBackToLanding}
              className="group inline-flex h-9 items-center gap-2 rounded-xl bg-slate-50 px-3 text-[11px] font-bold text-slate-500 shadow-xs transition-all duration-500 hover:bg-slate-950 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-translate-x-0.5" />
              <RollingText compact>{lang === 'id' ? 'Kembali' : 'Back'}</RollingText>
            </button>

            <button
              type="button"
              onClick={() => setLang(lang === 'id' ? 'en' : 'id')}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[10px] uppercase font-mono tracking-tight text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all cursor-pointer"
            >
              <RollingText compact>{lang}</RollingText>
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3 pt-2">
            <div className="flex items-center justify-center gap-2.5">
              <img
                src="/logo_warungify_upgrade.png"
                alt="Warungify Logo"
                className="w-10 h-10 object-contain rounded-xl"
              />
              <span className="text-lg font-bold text-slate-950 tracking-tight">Warungify</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="p-3.5 bg-amber-50 border border-amber-200/70 rounded-xl text-[11px] font-semibold text-amber-800 leading-normal">
              {lang === 'id' 
                ? 'Supabase belum aktif. Isi `.env` dari `.env.example`, lalu restart dev server.' 
                : 'Supabase is not active yet. Fill `.env` from `.env.example`, then restart dev server.'}
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200/60 rounded-xl text-[11px] font-semibold text-rose-800 leading-normal">
              {error}
            </div>
          )}

          {notice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-[11px] font-semibold text-emerald-800 leading-normal flex gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'id' ? 'Nama Lengkap' : 'Full Name'}</label>
                <input
                  type="text"
                  required
                  placeholder={lang === 'id' ? 'Nama bisnis / owner' : 'Business / owner name'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-medium"
                />
              </div>
            )}

            {!isReset && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'id' ? 'Alamat Email' : 'Email Address'}</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="owner@warungify.app"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'id' ? 'Kata Sandi' : 'Password'}</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="group text-[10px] font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                    >
                      <RollingText compact>{lang === 'id' ? 'Lupa Password?' : 'Forgot Password?'}</RollingText>
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-medium"
                  />
                </div>
              </div>
            )}

            {(isSignup || isReset) && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{lang === 'id' ? 'Konfirmasi Kata Sandi' : 'Confirm Password'}</label>
                <input
                  type="password"
                  required
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all font-medium"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group w-full h-10 rounded-xl border border-transparent bg-slate-950 hover:bg-white active:bg-slate-50 text-white hover:text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-500 cursor-pointer shadow-sm disabled:opacity-50 disabled:hover:bg-slate-950 disabled:hover:text-white"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isSignup ? <UserPlus className="w-4 h-4" /> : isForgot ? <Mail className="w-4 h-4" /> : <LogIn className="w-4 h-4 transition-transform duration-500 group-hover:translate-x-0.5" />}
                  <RollingText>{submitLabel}</RollingText>
                </>
              )}
            </button>

            {isLogin && (
              <button
                type="button"
                onClick={onDemoClick}
                disabled={isLoading}
                className="group w-full h-10 rounded-xl border border-slate-200 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer shadow-xs disabled:opacity-50"
              >
                <RollingText>{lang === 'id' ? 'Coba Demo Dasbor (Tanpa Login)' : 'Try Dashboard Demo (No Login)'}</RollingText>
              </button>
            )}
          </form>

          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] font-bold">
            {!isLogin && (
              <button type="button" onClick={() => switchMode('login')} className="group text-slate-500 hover:text-slate-950 cursor-pointer">
                <RollingText compact>{lang === 'id' ? 'Kembali ke login' : 'Back to login'}</RollingText>
              </button>
            )}
            {!isSignup && !isReset && (
              <button type="button" onClick={() => switchMode('signup')} className="group text-emerald-600 hover:text-emerald-700 cursor-pointer">
                <RollingText compact>{lang === 'id' ? 'Buat akun' : 'Create account'}</RollingText>
              </button>
            )}
            {isLogin && (
              <span className="text-slate-300">{lang === 'id' ? 'Verifikasi email diperlukan' : 'Email verification required'}</span>
            )}
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-start gap-3 select-none">
            <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
              {lang === 'id' 
                ? 'Gunakan akun yang sudah diverifikasi agar data order tersimpan di database per user.' 
                : 'Use a verified account so that order data is saved in the database per user.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
