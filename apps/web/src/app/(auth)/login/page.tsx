'use client';

import React, { useState, useEffect, useReducer, Suspense, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Phone,
  Smartphone,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

/* ─── Motion ─────────────────────────────────────────────── */
// `motion` package (same API as framer-motion) is already installed
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/* ─── Types ─────────────────────────────────────────────── */
type AuthMode = 'STAFF' | 'PARENT';
type LoginStep = 'credentials' | 'mfa';
type ParentPhase = 'input' | 'otp';

/* ─── Role redirect helper ──────────────────────────────── */
function resolveRoleRedirect(user: { scope?: string; roleType?: string }, returnUrl?: string | null): string {
  if (user.scope === 'PLATFORM' || user.roleType === 'PLATFORM_ADMIN') return '/platform/dashboard';
  if (user.roleType === 'TEACHER') return returnUrl && returnUrl !== '/school' ? returnUrl : '/teacher/dashboard';
  if (user.roleType === 'PARENT') return '/parent';
  if (user.roleType === 'FEE_MANAGER') return returnUrl && returnUrl !== '/school' ? returnUrl : '/school/fees';
  if (['DIRECTOR', 'PRINCIPAL', 'ADMIN', 'SCHOOL_ADMIN', 'OWNER', 'STAFF'].includes(user.roleType || ''))
    return returnUrl || '/school';
  return '/school';
}

/* ─── Slide variants ────────────────────────────────────── */
const EASE_OUT_QUINT = [0.16, 1, 0.3, 1] as const;

function slideVariants(reduced: boolean) {
  if (reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: { duration: 0.15 } },
      exit:  { opacity: 0, transition: { duration: 0.1 } },
    };
  }
  return {
    enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.22, ease: EASE_OUT_QUINT } },
    exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT_QUINT } }),
  };
}

/* ─── Inline styles ─────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

  .lf-card {
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 24px;
    box-shadow:
      0 25px 60px -15px rgba(15, 23, 42, 0.16),
      0 10px 25px -5px rgba(15, 23, 42, 0.06),
      0 0 0 1px rgba(226, 232, 240, 0.7);
    overflow: hidden;
    font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  /* Header strip */
  .lf-header {
    padding: 1.75rem 1.75rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .lf-title {
    font-size: 1.35rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
    line-height: 1.2;
    margin: 0 0 0.25rem;
  }
  .lf-subtitle {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
  }

  /* Tab switcher */
  .lf-tabs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: #f1f5f9;
    border-radius: 10px;
    padding: 3px;
    margin-top: 1rem;
  }
  .lf-tab {
    padding: 0.5rem;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: transparent;
    color: #64748b;
    transition: color 150ms ease;
    position: relative;
  }
  .lf-tab--active {
    background: #fff;
    color: #0f172a;
    box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(0,0,0,0.04);
  }
  .lf-tab--parent.lf-tab--active {
    color: #059669;
  }

  /* Body */
  .lf-body {
    padding: 1.5rem 1.75rem;
    position: relative;
    overflow: hidden;
  }

  /* Error alert */
  .lf-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }
  .lf-alert__icon { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
  .lf-alert__title { font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 2px; }
  .lf-alert__msg   { font-size: 11px; color: #b91c1c; }

  /* Success alert */
  .lf-success {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }
  .lf-success__icon  { color: #16a34a; flex-shrink: 0; margin-top: 1px; }
  .lf-success__title { font-size: 12px; font-weight: 600; color: #14532d; margin-bottom: 2px; }
  .lf-success__msg   { font-size: 11px; color: #166534; }

  /* Form fields */
  .lf-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
  .lf-field:last-of-type { margin-bottom: 0; }
  .lf-label { font-size: 12px; font-weight: 600; color: #374151; }
  .lf-label__req { color: #ef4444; margin-left: 2px; }
  .lf-label__opt { color: #94a3b8; font-weight: 400; margin-left: 4px; }

  .lf-input-wrap { position: relative; }
  .lf-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    width: 15px;
    height: 15px;
  }
  .lf-input {
    width: 100%;
    height: 42px;
    padding: 0 12px 0 38px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    color: #0f172a;
    background: #fff;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease;
    box-sizing: border-box;
  }
  .lf-input::placeholder { color: #cbd5e1; }
  .lf-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
  }
  .lf-input--error {
    border-color: #f87171;
  }
  .lf-input--error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
  }
  .lf-input--mono {
    font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.15em;
    text-align: center;
    font-size: 1.1rem;
    font-weight: 600;
    padding-left: 38px;
  }
  .lf-input--no-icon { padding-left: 12px; }
  .lf-input-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: #94a3b8;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 150ms ease;
  }
  .lf-input-toggle:hover { color: #475569; }
  .lf-input-toggle:focus-visible { outline: 2px solid #10b981; outline-offset: 1px; }
  .lf-field-err { font-size: 11px; color: #ef4444; font-weight: 500; }

  /* Parent type switcher */
  .lf-type-row {
    display: flex;
    gap: 8px;
    margin-bottom: 1rem;
  }
  .lf-type-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0.5rem;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: 1.5px solid #e2e8f0;
    background: transparent;
    color: #64748b;
    transition: all 150ms ease;
  }
  .lf-type-btn--active {
    border-color: #10b981;
    background: rgba(16,185,129,0.06);
    color: #059669;
  }

  /* Helpers row */
  .lf-helpers {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.75rem;
    font-size: 12px;
  }
  .lf-remember {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    cursor: pointer;
    user-select: none;
  }
  .lf-remember input[type="checkbox"] {
    width: 15px;
    height: 15px;
    border-radius: 4px;
    accent-color: #10b981;
    cursor: pointer;
  }
  .lf-forgot {
    color: #059669;
    font-weight: 600;
    text-decoration: none;
    border-radius: 4px;
    padding: 2px 4px;
    transition: color 120ms ease;
  }
  .lf-forgot:hover { color: #047857; text-decoration: underline; }
  .lf-forgot:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }

  /* Footer */
  .lf-footer {
    padding: 1.25rem 1.75rem 1.75rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* Primary button */
  .lf-btn {
    width: 100%;
    height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 150ms ease;
    letter-spacing: 0.005em;
  }
  .lf-btn--primary {
    background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    border-radius: 12px;
    font-weight: 700;
  }
  .lf-btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    transform: translateY(-1px);
  }
  .lf-btn--primary:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  }
  .lf-btn--primary:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .lf-btn--ghost {
    background: transparent;
    color: #64748b;
    border: none;
    font-size: 12px;
    font-weight: 500;
    height: auto;
    padding: 4px 8px;
    width: auto;
    gap: 4px;
    border-radius: 6px;
    transition: color 120ms ease;
  }
  .lf-btn--ghost:hover { color: #0f172a; }

  /* Footer link row */
  .lf-footer-link {
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    padding-top: 0.875rem;
    border-top: 1px solid #f1f5f9;
  }
  .lf-footer-link a {
    color: #0284c7;
    font-weight: 700;
    text-decoration: none;
    transition: color 120ms ease;
  }
  .lf-footer-link a:hover { color: #0369a1; text-decoration: underline; }

  /* MFA header */
  .lf-mfa-icon-wrap {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    color: #059669;
    margin-bottom: 0.75rem;
    box-shadow: 0 2px 8px rgba(16,185,129,0.15);
  }

  /* OTP input */
  .lf-otp-info {
    font-size: 11px;
    color: #64748b;
    margin-top: 0.375rem;
    line-height: 1.5;
  }

  /* Cooldown / resend row */
  .lf-resend-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 0.625rem;
    font-size: 12px;
  }
  .lf-resend-row button {
    background: none;
    border: none;
    cursor: pointer;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 12px;
    padding: 0;
  }
  .lf-resend-active { color: #059669; font-weight: 600; }
  .lf-resend-active:hover { text-decoration: underline; }
  .lf-resend-cooldown { color: #94a3b8; cursor: not-allowed !important; }

  /* Recovery toggle */
  .lf-recovery-toggle {
    text-align: right;
    margin-top: 0.75rem;
  }
  .lf-recovery-toggle button {
    background: none;
    border: none;
    font-size: 12px;
    font-weight: 600;
    color: #059669;
    cursor: pointer;
    font-family: 'Inter', system-ui, sans-serif;
    padding: 2px 0;
    transition: color 120ms ease;
  }
  .lf-recovery-toggle button:hover { color: #047857; text-decoration: underline; }

  /* Hint text */
  .lf-hint {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.5;
    margin-top: 0.25rem;
  }

  .lf-note {
    font-size: 11px;
    color: #94a3b8;
    text-align: center;
    line-height: 1.5;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .lf-btn--primary { transition: none !important; transform: none !important; }
  }
`;

/* ────────────────────────────────────────────────────────── */
/*  Main Login Form                                          */
/* ────────────────────────────────────────────────────────── */
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/school';
  const prefersReduced = useReducedMotion() ?? false;
  const variants = slideVariants(prefersReduced);

  const { login, verifyMfaChallenge, user, authState } = useAuth();

  /* ── auth mode: STAFF | PARENT ─── */
  const [authMode, setAuthMode] = useState<AuthMode>('STAFF');

  /* ── STAFF state ─── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  /* ── MFA state ─── */
  const [loginStep, setLoginStep] = useState<LoginStep>('credentials');
  const [mfaChallengeToken, setMfaChallengeToken] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  /* ── PARENT state ─── */
  const [parentType, setParentType] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhase, setParentPhase] = useState<ParentPhase>('input');
  const [otpCode, setOtpCode] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  /* slide direction tracking */
  const [direction, setDirection] = useState(1);
  const prevStep = useRef<string>('credentials');

  /* Hydration guard: motion injects different style attr types on SSR vs client */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* ── Cooldown timer ─── */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  /* ── Redirect if already authenticated ─── */
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user) {
      router.replace(resolveRoleRedirect(user, returnUrl));
    }
  }, [authState, user, router, returnUrl]);

  /* ── Form validation ─── */
  const validateCredentials = (): boolean => {
    let ok = true;
    setServerError(null);

    if (!email.trim()) {
      setEmailError('Email is required.');
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required.');
      ok = false;
    } else {
      setPasswordError(null);
    }
    return ok;
  };

  /* ── STAFF submit ─── */
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCredentials() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await login({ email: email.trim(), password, rememberMe });

      if (result.success && result.mfaRequired && result.mfaChallengeToken) {
        setMfaChallengeToken(result.mfaChallengeToken);
        setPassword('');
        setDirection(1);
        setLoginStep('mfa');
        setMfaError(null);
        return;
      }
      if (result.success && result.user) {
        window.location.href = resolveRoleRedirect(result.user, returnUrl);
      } else {
        const errorMsg =
          result.error ||
          (result.errorCode === 'INVALID_CREDENTIALS'
            ? 'Invalid email or password.'
            : result.errorCode === 'NETWORK_ERROR'
            ? 'Unable to connect. Please try again.'
            : result.errorCode === 'SERVICE_UNAVAILABLE'
            ? 'Authentication service is temporarily unavailable.'
            : 'Something went wrong. Please try again.');
        setServerError(errorMsg);
      }
    } catch {
      setServerError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Parent OTP ─── */
  const handleSendParentOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setServerError(null);
    const identifier = parentType === 'PHONE' ? parentPhone.trim() : parentEmail.trim();
    if (!identifier) {
      setServerError(`Please enter your registered ${parentType === 'PHONE' ? 'mobile number' : 'email address'}.`);
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch('/api/auth/parent/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentType === 'PHONE' ? { phone: identifier } : { email: identifier }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || 'Failed to send verification code.');
      } else {
        setMaskedTarget(data.identifier || identifier);
        setCooldown(data.cooldownSeconds || 60);
        setParentPhase('otp');
      }
    } catch {
      setServerError('Network error while requesting verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyParentOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    const cleanOtp = otpCode.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setServerError('Please enter the 6-digit verification code.');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const identifier = parentType === 'PHONE' ? parentPhone.trim() : parentEmail.trim();
      const res = await fetch('/api/auth/parent/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...(parentType === 'PHONE' ? { phone: identifier } : { email: identifier }), code: cleanOtp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.message || 'Invalid or expired verification code.');
        return;
      }
      if (data.mfaRequired && data.challengeToken) {
        setMfaChallengeToken(data.challengeToken);
        setLoginStep('mfa');
        setOtpCode('');
        setMfaError(null);
        return;
      }
      if (data.success) window.location.href = '/parent';
    } catch {
      setServerError('Network error while verifying code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  /* ── MFA ─── */
  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallengeToken || isVerifyingMfa) return;
    const trimmedCode = mfaCode.trim();
    if (!trimmedCode) {
      setMfaError(useRecoveryCode ? 'Please enter a recovery code.' : 'Please enter the 6-digit code.');
      return;
    }
    setIsVerifyingMfa(true);
    setMfaError(null);
    try {
      const result = await verifyMfaChallenge(mfaChallengeToken, trimmedCode, useRecoveryCode);
      if (result.success && result.user) {
        window.location.href = resolveRoleRedirect(result.user, returnUrl);
      } else {
        setMfaError(result.error || 'Invalid verification code. Please check and try again.');
      }
    } catch {
      setMfaError('Unable to verify code. Please try again.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  const resetToCredentials = () => {
    setDirection(-1);
    setLoginStep('credentials');
    setMfaChallengeToken(null);
    setMfaCode('');
    setMfaError(null);
    setUseRecoveryCode(false);
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <style>{css}</style>

      <div className="lf-card">
        {/* ── Header ── */}
        <div className="lf-header">
          <AnimatePresence mode="wait" initial={false}>
            {loginStep === 'mfa' ? (
              <motion.div
                key="mfa-header"
                initial={false}
                animate={mounted ? { opacity: 1, y: 0 } : undefined}
                exit={mounted ? { opacity: 0 } : undefined}
                transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
                suppressHydrationWarning
              >
                <div className="lf-mfa-icon-wrap">
                  <ShieldCheck size={22} />
                </div>
                <h1 className="lf-title">Two-Factor Verification</h1>
                <p className="lf-subtitle">
                  {useRecoveryCode
                    ? 'Enter one of your 8-character single-use recovery codes.'
                    : 'Enter the 6-digit code from your authenticator app.'}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="login-header"
                initial={false}
                animate={mounted ? { opacity: 1 } : undefined}
                exit={mounted ? { opacity: 0 } : undefined}
                transition={{ duration: 0.2 }}
                suppressHydrationWarning
              >
                <h1 className="lf-title">
                  {authMode === 'PARENT' ? 'Parent Portal' : 'Welcome back'}
                </h1>
                <p className="lf-subtitle">
                  {authMode === 'PARENT'
                    ? 'Sign in with your registered mobile number or email using one-time verification.'
                    : 'Sign in to your school administrator or staff account.'}
                </p>

                {/* Tab switcher — only shown on credentials step */}
                <div className="lf-tabs" role="tablist" aria-label="Login portal">
                  <button
                    role="tab"
                    aria-selected={authMode === 'STAFF'}
                    className={`lf-tab ${authMode === 'STAFF' ? 'lf-tab--active' : ''}`}
                    onClick={() => { setAuthMode('STAFF'); setServerError(null); }}
                  >
                    Staff Login
                  </button>
                  <button
                    role="tab"
                    aria-selected={authMode === 'PARENT'}
                    className={`lf-tab lf-tab--parent ${authMode === 'PARENT' ? 'lf-tab--active' : ''}`}
                    onClick={() => { setAuthMode('PARENT'); setServerError(null); }}
                  >
                    Parent (OTP)
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Body ── */}
        <div className="lf-body">
          <AnimatePresence custom={direction} mode="wait" initial={false}>

            {/* ── MFA STEP ── */}
            {loginStep === 'mfa' && (
              <motion.div
                key="mfa"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <form onSubmit={handleMfaSubmit} noValidate>
                  {mfaError && (
                    <div className="lf-alert" role="alert" aria-live="assertive">
                      <AlertCircle size={15} className="lf-alert__icon" />
                      <div>
                        <p className="lf-alert__title">Verification Failed</p>
                        <p className="lf-alert__msg">{mfaError}</p>
                      </div>
                    </div>
                  )}

                  <div className="lf-field">
                    <label htmlFor="mfaCode" className="lf-label">
                      {useRecoveryCode ? 'Recovery Code' : '6-Digit Code'}
                      <span className="lf-label__req">*</span>
                    </label>
                    <div className="lf-input-wrap">
                      <KeyRound className="lf-input-icon" aria-hidden="true" />
                      <input
                        id="mfaCode"
                        name="mfaCode"
                        type="text"
                        inputMode={useRecoveryCode ? 'text' : 'numeric'}
                        autoComplete="one-time-code"
                        autoFocus
                        disabled={isVerifyingMfa}
                        maxLength={useRecoveryCode ? 16 : 6}
                        value={mfaCode}
                        onChange={e => {
                          const val = useRecoveryCode
                            ? e.target.value.toUpperCase()
                            : e.target.value.replace(/\D/g, '').slice(0, 6);
                          setMfaCode(val);
                          if (mfaError) setMfaError(null);
                        }}
                        placeholder={useRecoveryCode ? 'e.g. A1B2-C3D4' : '000000'}
                        className="lf-input lf-input--mono"
                        aria-invalid={!!mfaError}
                      />
                    </div>
                    <p className="lf-hint">
                      {useRecoveryCode ? 'Each recovery code can only be used once.' : 'Codes rotate every 30 seconds.'}
                    </p>
                  </div>

                  <div className="lf-recovery-toggle">
                    <button
                      type="button"
                      onClick={() => { setUseRecoveryCode(!useRecoveryCode); setMfaCode(''); setMfaError(null); }}
                    >
                      {useRecoveryCode ? 'Use authenticator app instead' : 'Lost device? Use recovery code'}
                    </button>
                  </div>

                  <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <button
                      type="submit"
                      disabled={isVerifyingMfa || (!useRecoveryCode && mfaCode.length !== 6)}
                      className="lf-btn lf-btn--primary"
                    >
                      {isVerifyingMfa
                        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Verifying...</>
                        : 'Verify & Continue'}
                    </button>

                    <button type="button" className="lf-btn lf-btn--ghost" onClick={resetToCredentials}>
                      <ArrowLeft size={13} aria-hidden="true" />
                      Back to email &amp; password
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── STAFF CREDENTIALS ── */}
            {loginStep === 'credentials' && authMode === 'STAFF' && (
              <motion.div
                key="staff"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <form onSubmit={handleCredentialsSubmit} noValidate>
                  {serverError && (
                    <div className="lf-alert" role="alert" aria-live="assertive">
                      <AlertCircle size={15} className="lf-alert__icon" />
                      <div>
                        <p className="lf-alert__title">Authentication failed</p>
                        <p className="lf-alert__msg">{serverError}</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  <div className="lf-field">
                    <label htmlFor="email" className="lf-label">
                      Email <span className="lf-label__req">*</span>
                    </label>
                    <div className="lf-input-wrap">
                      <Mail className="lf-input-icon" aria-hidden="true" />
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={email}
                        onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                        onBlur={() => {
                          if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
                            setEmailError('Enter a valid email address.');
                        }}
                        placeholder="admin@school.edu"
                        aria-invalid={!!emailError}
                        aria-describedby={emailError ? 'email-error' : undefined}
                        className={`lf-input ${emailError ? 'lf-input--error' : ''}`}
                      />
                    </div>
                    {emailError && <p id="email-error" role="alert" className="lf-field-err">{emailError}</p>}
                  </div>

                  {/* Password */}
                  <div className="lf-field">
                    <label htmlFor="password" className="lf-label">
                      Password <span className="lf-label__req">*</span>
                    </label>
                    <div className="lf-input-wrap">
                      <Lock className="lf-input-icon" aria-hidden="true" />
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        value={password}
                        onChange={e => { setPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                        placeholder="Enter your password"
                        aria-invalid={!!passwordError}
                        aria-describedby={passwordError ? 'password-error' : undefined}
                        className={`lf-input ${passwordError ? 'lf-input--error' : ''}`}
                        style={{ paddingRight: 40 }}
                      />
                      <button
                        type="button"
                        className="lf-input-toggle"
                        onClick={() => setShowPassword(p => !p)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {passwordError && <p id="password-error" role="alert" className="lf-field-err">{passwordError}</p>}
                  </div>

                  {/* Remember + Forgot */}
                  <div className="lf-helpers">
                    <label className="lf-remember" htmlFor="remember-device">
                      <input
                        id="remember-device"
                        type="checkbox"
                        checked={rememberMe}
                        disabled={isSubmitting}
                        onChange={e => setRememberMe(e.target.checked)}
                      />
                      Remember this device
                    </label>
                    <Link href="/forgot-password" className="lf-forgot">Forgot password?</Link>
                  </div>

                  <div style={{ marginTop: '1.5rem' }}>
                    <button type="submit" disabled={isSubmitting} className="lf-btn lf-btn--primary">
                      {isSubmitting
                        ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Signing in...</>
                        : <>Sign In <ArrowRight size={14} aria-hidden="true" /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* ── PARENT PORTAL ── */}
            {loginStep === 'credentials' && authMode === 'PARENT' && (
              <motion.div
                key="parent"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <form
                  onSubmit={parentPhase === 'otp' ? handleVerifyParentOtp : handleSendParentOtp}
                  noValidate
                >
                  {serverError && (
                    <div className="lf-alert" role="alert" aria-live="assertive">
                      <AlertCircle size={15} className="lf-alert__icon" />
                      <div>
                        <p className="lf-alert__title">Authentication failed</p>
                        <p className="lf-alert__msg">{serverError}</p>
                      </div>
                    </div>
                  )}

                  <AnimatePresence mode="wait" initial={false}>
                    {parentPhase === 'input' && (
                      <motion.div
                        key="parent-input"
                        initial={false}
                        animate={mounted ? { opacity: 1, y: 0 } : undefined}
                        exit={mounted ? { opacity: 0, y: -6, transition: { duration: 0.14 } } : undefined}
                        transition={{ duration: 0.18, ease: EASE_OUT_QUINT }}
                        suppressHydrationWarning
                      >
                        {/* Type switcher */}
                        <div className="lf-type-row">
                          <button
                            type="button"
                            className={`lf-type-btn ${parentType === 'PHONE' ? 'lf-type-btn--active' : ''}`}
                            onClick={() => { setParentType('PHONE'); setServerError(null); }}
                          >
                            <Smartphone size={13} aria-hidden="true" />
                            Phone Number
                          </button>
                          <button
                            type="button"
                            className={`lf-type-btn ${parentType === 'EMAIL' ? 'lf-type-btn--active' : ''}`}
                            onClick={() => { setParentType('EMAIL'); setServerError(null); }}
                          >
                            <Mail size={13} aria-hidden="true" />
                            Email Address
                          </button>
                        </div>

                        {parentType === 'PHONE' ? (
                          <div className="lf-field">
                            <label htmlFor="parentPhone" className="lf-label">
                              Registered Mobile Number <span className="lf-label__req">*</span>
                            </label>
                            <div className="lf-input-wrap">
                              <Phone className="lf-input-icon" aria-hidden="true" />
                              <input
                                id="parentPhone"
                                type="tel"
                                inputMode="tel"
                                disabled={isSendingOtp}
                                value={parentPhone}
                                onChange={e => { setParentPhone(e.target.value); if (serverError) setServerError(null); }}
                                placeholder="e.g. 9876543210 or +91 98765 43210"
                                className="lf-input"
                              />
                            </div>
                            <p className="lf-hint">Standard Indian mobile numbers resolve to +91 format.</p>
                          </div>
                        ) : (
                          <div className="lf-field">
                            <label htmlFor="parentEmail" className="lf-label">
                              Registered Email Address <span className="lf-label__req">*</span>
                            </label>
                            <div className="lf-input-wrap">
                              <Mail className="lf-input-icon" aria-hidden="true" />
                              <input
                                id="parentEmail"
                                type="email"
                                inputMode="email"
                                disabled={isSendingOtp}
                                value={parentEmail}
                                onChange={e => { setParentEmail(e.target.value); if (serverError) setServerError(null); }}
                                placeholder="parent@example.com"
                                className="lf-input"
                              />
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '1.5rem' }}>
                          <button type="submit" disabled={isSendingOtp} className="lf-btn lf-btn--primary">
                            {isSendingOtp
                              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Sending code...</>
                              : 'Send Verification Code'}
                          </button>
                        </div>
                      </motion.div>
                    )}

                    {parentPhase === 'otp' && (
                      <motion.div
                        key="parent-otp"
                        initial={false}
                        animate={mounted ? { opacity: 1, y: 0 } : undefined}
                        exit={mounted ? { opacity: 0, y: -6, transition: { duration: 0.14 } } : undefined}
                        transition={{ duration: 0.18, ease: EASE_OUT_QUINT }}
                        suppressHydrationWarning
                      >
                        <div className="lf-success" role="status">
                          <CheckCircle2 size={15} className="lf-success__icon" />
                          <div>
                            <p className="lf-success__title">Code dispatched</p>
                            <p className="lf-success__msg">
                              We sent a 6-digit code to <strong style={{ fontFamily: 'JetBrains Mono,monospace' }}>{maskedTarget}</strong>.
                            </p>
                          </div>
                        </div>

                        <div className="lf-field">
                          <label htmlFor="otpCode" className="lf-label">
                            6-Digit Verification Code <span className="lf-label__req">*</span>
                          </label>
                          <div className="lf-input-wrap">
                            <KeyRound className="lf-input-icon" aria-hidden="true" />
                            <input
                              id="otpCode"
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              autoFocus
                              disabled={isVerifyingOtp}
                              value={otpCode}
                              onChange={e => { setOtpCode(e.target.value.replace(/\D/g, '').slice(0,6)); if (serverError) setServerError(null); }}
                              placeholder="000000"
                              className="lf-input lf-input--mono"
                            />
                          </div>
                        </div>

                        <div className="lf-resend-row">
                          <button
                            type="button"
                            onClick={() => { setParentPhase('input'); setOtpCode(''); setServerError(null); }}
                            style={{ color: '#64748b' }}
                          >
                            Change {parentType === 'PHONE' ? 'phone' : 'email'}
                          </button>
                          <button
                            type="button"
                            disabled={cooldown > 0 || isSendingOtp}
                            onClick={() => handleSendParentOtp()}
                            className={cooldown > 0 ? 'lf-resend-cooldown' : 'lf-resend-active'}
                          >
                            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                          </button>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                          <button
                            type="submit"
                            disabled={isVerifyingOtp || otpCode.length !== 6}
                            className="lf-btn lf-btn--primary"
                          >
                            {isVerifyingOtp
                              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Verifying...</>
                              : 'Verify & Sign In'}
                          </button>
                        </div>

                        <p className="lf-note" style={{ marginTop: '1rem' }}>
                          School-enrolled parent accounts are pre-registered by school administration.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div className="lf-footer">
          <div className="lf-footer-link">
            Don&apos;t have an account?{' '}
            <Link href="/signup">
              Create school account <ArrowRight size={11} style={{ display:'inline', verticalAlign:'middle' }} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ─── Page export (Suspense wrapper for useSearchParams) ── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '3rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <Loader2 size={24} style={{ color: '#94a3b8', animation: 'spin 1s linear infinite' }} aria-hidden="true" />
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Loading sign in portal...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
