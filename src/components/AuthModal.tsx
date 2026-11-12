import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  KeyRound, 
  Mail, 
  ArrowRight, 
  Zap, 
  Eye, 
  EyeOff, 
  Globe, 
  User, 
  CheckCircle2, 
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Lock,
  X
} from 'lucide-react';
import { Language, UserSession } from '../types';
import { translations } from '../i18n';
import { secureFetch } from '../utils/cryptoClient';

interface AuthModalProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLoginSuccess: (session: UserSession) => void;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  language,
  onLanguageChange,
  onLoginSuccess,
  onClose,
}) => {
  const t = translations[language];

  // Auth flow states
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('register');
  const [registerStep, setRegisterStep] = useState<'details' | 'verify'>('details');

  // Input states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Status & feedback
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugCode, setDebugCode] = useState<string | null>(null);

  // Resend cooldown timer (60s)
  const [timerSeconds, setTimerSeconds] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerSeconds]);

  // Handle Step 1: Send Verification Code to Email
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    const targetEmail = email.trim();
    const targetName = name.trim();

    if (!targetName) {
      setError(language === 'ru' ? 'Пожалуйста, укажите ваше имя или никнейм' : 'Please enter your name');
      return;
    }

    if (!targetEmail || !targetEmail.includes('@')) {
      setError(language === 'ru' ? 'Введите корректный адрес электронной почты' : 'Please enter a valid email address');
      return;
    }

    if (!password || password.length < 4) {
      setError(language === 'ru' ? 'Пароль должен содержать минимум 4 символа' : 'Password must have at least 4 characters');
      return;
    }

    setIsLoading(true);

    try {
      const res = await secureFetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: targetName,
          email: targetEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при отправке кода');
      }

      setRegisterStep('verify');
      setTimerSeconds(60);
      setSuccessNotice(`${t.codeSentNotice} ${targetEmail}`);
      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
    } catch (err: any) {
      setError(err.message || 'Сбой соединения с сервером');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Step 2: Confirm 6-Digit Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError(language === 'ru' ? 'Введите полный 6-значный код подтверждения' : 'Enter the complete 6-digit verification code');
      return;
    }

    setIsLoading(true);

    try {
      const res = await secureFetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: cleanCode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Неверный код подтверждения');
      }

      // The server stores the session in an HttpOnly cookie; only the profile is cached locally.
      localStorage.removeItem('budgettech_token');
      localStorage.setItem('budgettech_user_session', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Ошибка проверки кода');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (timerSeconds > 0) return;
    setError('');
    setIsLoading(true);

    try {
      const res = await secureFetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось повторно отправить код');
      }

      setTimerSeconds(60);
      setSuccessNotice(`${t.codeSentNotice} ${email.trim()}`);
      if (data.debugCode) {
        setDebugCode(data.debugCode);
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка повторной отправки');
    } finally {
      setIsLoading(false);
    }
  };

  // Login for returning users
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetEmail = email.trim();
    if (!targetEmail) {
      setError(language === 'ru' ? 'Введите Email' : 'Enter email');
      return;
    }

    if (!password) {
      setError(language === 'ru' ? 'Введите пароль' : 'Enter password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await secureFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Неверный email или пароль');
      }

      localStorage.removeItem('budgettech_token');
      localStorage.setItem('budgettech_user_session', JSON.stringify(data.user));

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Fast Guest Access
  const handleGuestLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const guestName = t.guestNameDefault;
      const session: UserSession = {
        isLoggedIn: true,
        email: 'guest@budgettech.cyber',
        name: guestName,
        avatarSeed: 'cyber_guest_seed',
        joinDate: new Date().toLocaleDateString(),
        savedBuildCount: 0,
        isGuest: true,
        isVerified: false,
      };

      localStorage.setItem('budgettech_user_session', JSON.stringify(session));
      setIsLoading(false);
      onLoginSuccess(session);
    }, 200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#05060a]/95 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {/* Background Cyber Glow Spheres */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 3D Holographic Auth Modal Container */}
      <div className="relative w-full max-w-md tactile-modal rounded-2xl overflow-hidden p-6 sm:p-8 z-10 my-auto shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-purple-500/30">
        
        {/* Top Accent Neon Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-emerald-400" />

        {/* Top Header & Language Picker */}
        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-purple-500/15">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
                Budget<span className="text-purple-400">Tech</span>
              </span>
              <p className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
                Secure Hardware Aggregator
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector Inside Modal */}
            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700/60 rounded-lg p-1">
              <Globe className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as Language)}
                className="bg-transparent text-xs text-slate-200 font-medium px-1.5 py-1 focus:outline-none cursor-pointer"
              >
                <option value="en" className="bg-slate-900 text-white">EN</option>
                <option value="de" className="bg-slate-900 text-white">DE</option>
                <option value="ru" className="bg-slate-900 text-white">RU</option>
                <option value="uk" className="bg-slate-900 text-white">UA</option>
              </select>
            </div>

            {/* Close Modal Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* STEP 2: VERIFICATION CODE FORM */}
        {activeTab === 'register' && registerStep === 'verify' ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => {
                  setRegisterStep('details');
                  setError('');
                }}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-900 border border-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t.changeEmail}</span>
              </button>
            </div>

            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                <span>{t.verifyCodeTitle}</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.verifyCodeSubtitle}
              </p>
              <div className="mt-2 py-1.5 px-3 rounded-lg bg-purple-950/40 border border-purple-500/30 text-xs font-mono text-purple-300 truncate">
                ✉️ {email}
              </div>
            </div>

            {/* Test Helper Pill for Sandbox Testing */}
            {debugCode && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-emerald-300">
                  <span className="font-semibold">Код подтверждения отправлен:</span>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(debugCode)}
                    className="underline text-[11px] font-mono hover:text-emerald-200 cursor-pointer"
                  >
                    Вставить {debugCode}
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">
                  В тестовой среде вы можете ввести код из почты или нажать «Вставить» для мгновенной проверки.
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">
                  {t.enterCodeLabel}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="------"
                  autoFocus
                  className="w-full text-center tracking-[0.6em] text-2xl font-mono py-3 bg-slate-950 border border-purple-500/50 rounded-xl text-emerald-400 placeholder-slate-700 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors shadow-inner"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || verificationCode.length < 6}
                className="w-full py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-[0_0_25px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.confirmCodeButton}</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2 text-xs">
                {timerSeconds > 0 ? (
                  <span className="text-slate-500 font-mono">
                    {t.resendInSeconds} {timerSeconds}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t.resendCodeButton}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setRegisterStep('details');
                    setError('');
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {t.changeEmail}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* STEP 1: LOGIN OR REGISTRATION DETAILS */
          <div>
            {/* Title and Subtitle */}
            <div className="mb-5">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {activeTab === 'register' ? t.tabRegister : t.tabLogin}
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.authModalSubtitle}
              </p>
            </div>

            {/* Tabs: Sign In / Create Account */}
            <div className="flex p-1 bg-slate-900/90 rounded-xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => { setActiveTab('login'); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-purple-600/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.tabLogin}
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('register'); setRegisterStep('details'); setError(''); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
                  activeTab === 'register'
                    ? 'bg-purple-600/90 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {t.tabRegister}
              </button>
            </div>

            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={activeTab === 'register' ? handleSendCode : handleLoginSubmit} className="space-y-3.5">
              
              {/* Name input (only for registration) */}
              {activeTab === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {t.nameLabel}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.namePlaceholder}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  {t.passwordLabel}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator for Registration */}
                {activeTab === 'register' && password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1">
                      <span>Надежность пароля:</span>
                      <span className={
                        password.length < 6 ? 'text-rose-400 font-semibold' :
                        (password.length >= 8 && /[0-9]/.test(password)) ? 'text-emerald-400 font-semibold' :
                        'text-amber-400 font-semibold'
                      }>
                        {password.length < 6 ? (language === 'ru' ? 'Слишком короткий' : 'Too short') :
                         (password.length >= 8 && /[0-9]/.test(password)) ? (language === 'ru' ? 'Высокая (100k rounds)' : 'Strong (100k rounds)') :
                         (language === 'ru' ? 'Средняя' : 'Moderate')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 h-1">
                      <div className={`rounded-full transition-all duration-300 ${password.length >= 4 ? (password.length < 6 ? 'bg-rose-500' : 'bg-amber-400') : 'bg-slate-800'}`} />
                      <div className={`rounded-full transition-all duration-300 ${password.length >= 6 ? (password.length >= 8 && /[0-9]/.test(password) ? 'bg-emerald-400' : 'bg-amber-400') : 'bg-slate-800'}`} />
                      <div className={`rounded-full transition-all duration-300 ${password.length >= 8 && /[0-9]/.test(password) ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-[0_0_25px_rgba(168,85,247,0.35)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {activeTab === 'register' 
                        ? (language === 'ru' ? 'Получить код подтверждения' : language === 'de' ? 'Bestätigungscode anfordern' : language === 'uk' ? 'Отримати код підтвердження' : 'Get Verification Code') 
                        : t.loginButton}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Fast Guest Login Option */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <span className="relative px-3 bg-[#0d101a] text-[11px] text-slate-500 uppercase tracking-wider font-mono">
                {language === 'ru' ? 'Или быстрый вход' : 'Or quick access'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span>{t.guestLoginButton}</span>
            </button>
          </div>
        )}

        {/* Real End-to-End Encryption Wire Badge */}
        <div className="mt-4 py-2 px-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px] text-emerald-400 font-mono shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-semibold tracking-wide">E2EE Сквозное шифрование:</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300 font-bold uppercase tracking-wider">
            RSA-OAEP-256 + AES-GCM
          </span>
        </div>

        {/* Security Note at bottom */}
        <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 text-center font-mono">
          {t.authSecurityNote}
        </div>
      </div>
    </div>
  );
};
