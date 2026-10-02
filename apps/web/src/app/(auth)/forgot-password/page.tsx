'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  .fp-card {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 16px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.06), 0 0 0 0.5px rgba(0,0,0,0.02);
    overflow: hidden;
    font-family: 'Inter', system-ui, sans-serif;
  }

  .fp-header {
    padding: 1.75rem 1.75rem 1.5rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .fp-icon-wrap {
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
  .fp-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.025em;
    margin: 0 0 0.25rem;
    line-height: 1.2;
  }
  .fp-subtitle {
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.6;
    margin: 0;
  }

  .fp-body { padding: 1.5rem 1.75rem; }

  .fp-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }
  .fp-alert__icon  { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
  .fp-alert__title { font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 2px; }
  .fp-alert__msg   { font-size: 11px; color: #b91c1c; }

  .fp-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .fp-label { font-size: 12px; font-weight: 600; color: #374151; }
  .fp-label__req { color: #ef4444; margin-left: 2px; }

  .fp-input-wrap { position: relative; }
  .fp-input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    width: 15px;
    height: 15px;
  }
  .fp-input {
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
  .fp-input::placeholder { color: #cbd5e1; }
  .fp-input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,0.12); }
  .fp-input--error { border-color: #f87171; }
  .fp-input--error:focus { border-color: #ef4444; box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
  .fp-field-err { font-size: 11px; color: #ef4444; font-weight: 500; }

  .fp-footer {
    padding: 1.25rem 1.75rem 1.75rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }
  .fp-btn {
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
  .fp-btn--primary {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15), 0 4px 12px rgba(15,23,42,0.18);
  }
  .fp-btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0,0,0,0.18), 0 6px 20px rgba(15,23,42,0.22);
  }
  .fp-btn--primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .fp-btn--outline {
    background: #fff;
    border: 1.5px solid #e2e8f0;
    color: #374151;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  }
  .fp-btn--outline:hover { border-color: #cbd5e1; background: #f8fafc; }

  .fp-back-link {
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
  .fp-back-link:hover { color: #0f172a; }

  /* Success state */
  .fp-success-body {
    padding: 1.5rem 1.75rem 1.75rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 1.25rem;
  }
  .fp-success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #059669;
    box-shadow: 0 4px 16px rgba(16,185,129,0.2);
  }
  .fp-success-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }
  .fp-success-msg   { font-size: 12px; color: #64748b; line-height: 1.7; margin: 0; max-width: 30ch; }
  .fp-success-hint  { font-size: 11px; color: #94a3b8; line-height: 1.6; margin: 0; }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validate = (): boolean => {
    setServerError(null);
    const trimmed = email.trim();
    if (!trimmed) { setEmailError('Email is required.'); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailError('Enter a valid email address.'); return false; }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await forgotPassword({ email: email.trim() });
      if (result.success) {
        setSuccessMessage(
          result.message || "If an account exists with this email address, we've sent password reset instructions."
        );
      } else {
        const msg =
          result.error ||
          (result.errorCode === 'SERVICE_UNAVAILABLE' ? 'Account recovery service is currently unavailable.'
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
      <div className="fp-card">
        <div className="fp-header">
          <div className="fp-icon-wrap">
            <ShieldCheck size={22} />
          </div>
          <h1 className="fp-title">Forgot your password?</h1>
          <p className="fp-subtitle">
            Enter your institutional email and we&apos;ll send you password reset instructions.
          </p>
        </div>

        {successMessage ? (
          <div className="fp-success-body">
            <div className="fp-success-icon">
              <CheckCircle2 size={26} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <p className="fp-success-title">Recovery email dispatched</p>
              <p className="fp-success-msg">{successMessage}</p>
            </div>
            <p className="fp-success-hint">
              Didn&apos;t receive it? Check your spam folder or contact your school IT administrator.
            </p>
            <Link href="/login" style={{ width: '100%', maxWidth: '240px' }}>
              <button className="fp-btn fp-btn--outline" style={{ width: '100%' }}>
                <ArrowLeft size={13} aria-hidden="true" />
                Back to Login
              </button>
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} noValidate>
              <div className="fp-body">
                {serverError && (
                  <div className="fp-alert" role="alert" aria-live="assertive">
                    <AlertCircle size={15} className="fp-alert__icon" />
                    <div>
                      <p className="fp-alert__title">Recovery request failed</p>
                      <p className="fp-alert__msg">{serverError}</p>
                    </div>
                  </div>
                )}

                <div className="fp-field">
                  <label htmlFor="forgotEmail" className="fp-label">
                    Email <span className="fp-label__req">*</span>
                  </label>
                  <div className="fp-input-wrap">
                    <Mail className="fp-input-icon" aria-hidden="true" />
                    <input
                      id="forgotEmail"
                      name="email"
                      type="email"
                      autoComplete="email"
                      autoFocus
                      disabled={isSubmitting}
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (emailError) setEmailError(null); }}
                      placeholder="admin@school.edu"
                      aria-invalid={!!emailError}
                      aria-describedby={emailError ? 'forgot-email-error' : undefined}
                      className={`fp-input ${emailError ? 'fp-input--error' : ''}`}
                    />
                  </div>
                  {emailError && <p id="forgot-email-error" role="alert" className="fp-field-err">{emailError}</p>}
                </div>
              </div>

              <div className="fp-footer">
                <button type="submit" disabled={isSubmitting} className="fp-btn fp-btn--primary">
                  {isSubmitting
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Sending...</>
                    : 'Send Reset Link'}
                </button>

                <Link href="/login" className="fp-back-link">
                  <ArrowLeft size={13} aria-hidden="true" />
                  Back to Login
                </Link>
              </div>
            </form>
          </>
        )}
      </div>
    </>
  );
}
