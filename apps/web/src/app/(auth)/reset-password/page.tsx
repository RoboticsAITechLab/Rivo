'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, Loader2, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  .rp-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.02);
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .rp-header {
    padding: 1.75rem 1.75rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .rp-icon-wrap {
    width: 46px;
    height: 46px;
    border-radius: 12px;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #059669;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(16,185,129,0.15);
  }
  .rp-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
    margin: 0 0 0.25rem;
    line-height: 1.2;
  }
  .rp-subtitle {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
  }

  .rp-body { padding: 1.5rem 1.75rem; }

  .rp-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }
  .rp-alert__icon  { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
  .rp-alert__title { font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 2px; }
  .rp-alert__msg   { font-size: 11px; color: #b91c1c; }

  .rp-warn {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 10px;
    margin-bottom: 1.25rem;
    font-size: 11px;
    color: #92400e;
  }

  .rp-field { display: flex; flex-direction: column; gap: 0.375rem; margin-bottom: 1rem; }
  .rp-field:last-of-type { margin-bottom: 0; }
  .rp-label { font-size: 12px; font-weight: 600; color: #374151; }
  .rp-label__req { color: #ef4444; margin-left: 2px; }

  .rp-input-wrap { position: relative; }
  .rp-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    width: 15px;
    height: 15px;
  }
  .rp-input {
    width: 100%;
    height: 42px;
    padding: 0 40px 0 38px;
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
  .rp-input::placeholder { color: #cbd5e1; }
  .rp-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .rp-input--error { border-color: #f87171; }
  .rp-input--error:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
  .rp-input-toggle {
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
  .rp-input-toggle:hover { color: #475569; }
  .rp-field-err { font-size: 11px; color: #ef4444; font-weight: 500; }

  .rp-footer {
    padding: 1.25rem 1.75rem 1.75rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .rp-btn {
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
  }
  .rp-btn--primary {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15), 0 4px 12px rgba(15,23,42,0.18);
  }
  .rp-btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18), 0 6px 20px rgba(15,23,42,0.22);
  }
  .rp-btn--primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .rp-btn--success {
    background: linear-gradient(135deg, #059669, #10b981);
    color: #fff;
    box-shadow: 0 4px 12px rgba(16,185,129,0.25);
  }
  .rp-back-link {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    text-decoration: none;
    transition: color 120ms ease;
    justify-content: center;
    padding: 4px 0;
  }
  .rp-back-link:hover { color: #0f172a; }

  /* Success state */
  .rp-success-body {
    padding: 1.5rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
  }
  .rp-success-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #059669;
    box-shadow: 0 4px 20px rgba(16,185,129,0.25);
  }
  .rp-success-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
  .rp-success-msg   { font-size: 12px; color: #64748b; line-height: 1.7; margin: 0; max-width: 30ch; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function ResetPasswordFormContent() {
  const searchParams = useSearchParams();
  const token = (searchParams.get('token') || searchParams.get('t') || '').trim();

  const { resetPassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  /* Password strength */
  const pwCriteria = {
    minLength: newPassword.length >= 8,
    hasUpper:  /[A-Z]/.test(newPassword),
    hasLower:  /[a-z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword),
  };

  const validate = (): boolean => {
    setServerError(null);
    let ok = true;

    if (!token) { setServerError('Reset link is invalid or missing a security token.'); return false; }

    if (!newPassword) {
      setPasswordError('New password is required.'); ok = false;
    } else if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.'); ok = false;
    } else {
      setPasswordError(null);
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.'); ok = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.'); ok = false;
    } else {
      setConfirmError(null);
    }

    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await resetPassword({ token, newPassword });
      if (result.success) {
        setIsSuccess(true);
      } else {
        const msg =
          result.error ||
          (result.errorCode === 'INVALID_TOKEN'       ? 'Reset link is invalid or has expired.'
          : result.errorCode === 'PASSWORD_TOO_WEAK'  ? (result.error || 'Password does not meet complexity requirements.')
          : result.errorCode === 'SERVICE_UNAVAILABLE' ? 'Password reset service is currently unavailable.'
          : result.errorCode === 'NETWORK_ERROR'       ? 'Unable to connect. Please try again.'
          : 'Something went wrong. Please try again.');
        setServerError(msg);
      }
    } catch {
      setServerError('Unable to connect. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="rp-card">
        <div className="rp-header">
          <div className="rp-icon-wrap">
            <ShieldCheck size={22} />
          </div>
          <h1 className="rp-title">Set new password</h1>
          <p className="rp-subtitle">
            Enter and confirm your new institutional account password.
          </p>
        </div>

        {isSuccess ? (
          <div className="rp-success-body">
            <div className="rp-success-icon">
              <CheckCircle2 size={28} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <p className="rp-success-title">Password reset complete</p>
              <p className="rp-success-msg">
                Your password has been updated successfully. You can now sign in with your new credentials.
              </p>
            </div>
            <Link href="/login" style={{ width: '100%', maxWidth: '280px' }}>
              <button className="rp-btn rp-btn--success" style={{ width: '100%' }}>
                Proceed to Sign In
              </button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="rp-body">
              {serverError && (
                <div className="rp-alert" role="alert" aria-live="assertive">
                  <AlertCircle size={15} className="rp-alert__icon" />
                  <div>
                    <p className="rp-alert__title">Password reset failed</p>
                    <p className="rp-alert__msg">{serverError}</p>
                  </div>
                </div>
              )}

              {!token && (
                <div className="rp-warn" role="alert">
                  <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1, color: '#d97706' }} />
                  No recovery token detected. Please use the link sent to your institutional email.
                </div>
              )}

              {/* New Password */}
              <div className="rp-field">
                <label htmlFor="newPassword" className="rp-label">
                  New Password <span className="rp-label__req">*</span>
                </label>
                <div className="rp-input-wrap">
                  <Lock className="rp-input-icon" aria-hidden="true" />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    disabled={isSubmitting}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); if (passwordError) setPasswordError(null); }}
                    placeholder="Minimum 8 characters"
                    aria-invalid={!!passwordError}
                    className={`rp-input ${passwordError ? 'rp-input--error' : ''}`}
                  />
                  <button
                    type="button"
                    className="rp-input-toggle"
                    onClick={() => setShowPassword(p => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {passwordError && <p className="rp-field-err">{passwordError}</p>}

                {/* Inline strength hints */}
                {newPassword && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    marginTop: '0.375rem',
                  }}>
                    {[
                      ['minLength', '8+ chars'],
                      ['hasUpper',  'Uppercase'],
                      ['hasLower',  'Lowercase'],
                      ['hasNumber', 'Number'],
                      ['hasSpecial','Special'],
                    ].map(([key, label]) => {
                      const met = pwCriteria[key as keyof typeof pwCriteria];
                      return (
                        <span
                          key={key}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 600,
                            background: met ? '#dcfce7' : '#f1f5f9',
                            color: met ? '#16a34a' : '#94a3b8',
                            border: `1px solid ${met ? '#bbf7d0' : '#e2e8f0'}`,
                            transition: 'all 150ms ease',
                          }}
                        >
                          {met && <Check size={9} strokeWidth={3} aria-hidden="true" />}
                          {label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="rp-field">
                <label htmlFor="confirmResetPassword" className="rp-label">
                  Confirm New Password <span className="rp-label__req">*</span>
                </label>
                <div className="rp-input-wrap">
                  <Lock className="rp-input-icon" aria-hidden="true" />
                  <input
                    id="confirmResetPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    disabled={isSubmitting}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); if (confirmError) setConfirmError(null); }}
                    placeholder="Re-enter new password"
                    aria-invalid={!!confirmError}
                    className={`rp-input ${confirmError ? 'rp-input--error' : ''}`}
                  />
                  <button
                    type="button"
                    className="rp-input-toggle"
                    onClick={() => setShowConfirmPassword(p => !p)}
                    aria-label={showConfirmPassword ? 'Hide' : 'Show'}
                  >
                    {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {confirmError && <p className="rp-field-err">{confirmError}</p>}
              </div>
            </div>

            <div className="rp-footer">
              <button type="submit" disabled={isSubmitting} className="rp-btn rp-btn--primary">
                {isSubmitting
                  ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Updating password...</>
                  : 'Reset Password'}
              </button>

              <Link href="/login" className="rp-back-link">
                <ArrowLeft size={13} aria-hidden="true" />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
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
          <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Loading password reset portal...</p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
