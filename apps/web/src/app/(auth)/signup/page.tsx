'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  Check,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

/* ─── Types ─────────────────────────────────────────────── */
type SignupStep = 1 | 2 | 3 | 4;

interface AdminFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface SchoolFormState {
  name: string;
  code: string;
  affiliation: string;
  officialEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
}

/* ─── Shared CSS ─────────────────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');

  .sf-card {
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

  /* Header */
  .sf-header {
    padding: 2rem 2rem 1.25rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .sf-title {
    font-size: 1.45rem;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.025em;
    line-height: 1.2;
    margin: 0 0 0.35rem;
  }
  .sf-subtitle {
    font-size: 12.5px;
    color: #64748b;
    line-height: 1.55;
    margin: 0;
  }

  /* Stepper */
  .sf-stepper {
    display: flex;
    align-items: center;
    gap: 0;
    margin-top: 1.25rem;
  }
  .sf-step {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }
  .sf-step__bubble {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11.5px;
    font-weight: 700;
    flex-shrink: 0;
    transition: background 250ms ease, color 250ms ease, box-shadow 250ms ease;
    border: 2px solid #e2e8f0;
    background: #fff;
    color: #94a3b8;
  }
  .sf-step__bubble--active {
    background: #0284c7;
    border-color: #0284c7;
    color: #fff;
    box-shadow: 0 2px 10px rgba(2, 132, 199, 0.35);
  }
  .sf-step__bubble--done {
    background: #ecfdf5;
    border-color: #10b981;
    color: #10b981;
  }
  .sf-step__label {
    font-size: 11.5px;
    font-weight: 600;
    color: #94a3b8;
    white-space: nowrap;
    transition: color 200ms ease;
  }
  .sf-step__label--active { color: #0284c7; font-weight: 700; }
  .sf-step__label--done   { color: #10b981; }
  .sf-step__connector {
    flex: 1;
    height: 1.5px;
    background: #e2e8f0;
    margin: 0 8px;
    transition: background 300ms ease;
    min-width: 16px;
  }
  .sf-step__connector--done { background: #10b981; }

  /* Progress bar */
  .sf-progress {
    height: 3px;
    background: #f1f5f9;
    border-radius: 0;
    overflow: hidden;
    margin-top: 1rem;
  }
  .sf-progress__fill {
    height: 100%;
    background: linear-gradient(90deg, #059669, #10b981);
    border-radius: 0;
    transition: width 350ms cubic-bezier(0.16,1,0.3,1);
  }

  /* Body */
  .sf-body {
    padding: 1.5rem 1.75rem;
    min-height: 320px;
    position: relative;
    overflow: hidden;
  }

  /* Section header */
  .sf-section-head {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    margin-bottom: 1.25rem;
    padding-bottom: 0.875rem;
    border-bottom: 1px solid #f1f5f9;
  }
  .sf-section-head__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 10px;
    background: rgba(2, 132, 199, 0.1);
    color: #0284c7;
    flex-shrink: 0;
  }
  .sf-section-title {
    font-size: 13.5px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.2rem;
  }
  .sf-section-desc {
    font-size: 11.5px;
    color: #64748b;
    margin: 0;
    line-height: 1.45;
  }

  /* Error alert */
  .sf-alert {
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    padding: 0.75rem;
    background: #fff5f5;
    border: 1px solid #fecaca;
    border-radius: 10px;
    margin-bottom: 1.25rem;
  }
  .sf-alert__icon  { color: #ef4444; flex-shrink: 0; margin-top: 1px; }
  .sf-alert__title { font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 2px; }
  .sf-alert__msg   { font-size: 11px; color: #b91c1c; }

  /* Form fields */
  .sf-grid { display: grid; gap: 0.875rem; }
  .sf-grid--2 { grid-template-columns: 1fr 1fr; }

  @media (max-width: 480px) {
    .sf-grid--2 { grid-template-columns: 1fr; }
  }

  .sf-field { display: flex; flex-direction: column; gap: 0.375rem; }
  .sf-label { font-size: 12px; font-weight: 600; color: #374151; }
  .sf-label__req { color: #ef4444; margin-left: 2px; }
  .sf-label__opt { color: #94a3b8; font-weight: 400; margin-left: 4px; font-size: 11px; }

  .sf-input-wrap { position: relative; }
  .sf-input-icon {
    position: absolute;
    left: 11px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    width: 14px;
    height: 14px;
  }
  .sf-input {
    width: 100%;
    height: 40px;
    padding: 0 11px;
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
  .sf-input--icon { padding-left: 34px; }
  .sf-input::placeholder { color: #cbd5e1; }
  .sf-input:focus {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
  }
  .sf-input--error { border-color: #f87171; }
  .sf-input--error:focus {
    border-color: #ef4444;
    box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
  }
  .sf-input-toggle {
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
  .sf-input-toggle:hover { color: #475569; }
  .sf-field-err { font-size: 11px; color: #ef4444; font-weight: 500; }

  /* Password requirements */
  .sf-pw-reqs {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 0.75rem;
    margin-top: 0.25rem;
  }
  .sf-pw-reqs__title { font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 0.5rem; }
  .sf-pw-reqs__list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.375rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .sf-pw-req {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: #94a3b8;
    transition: color 150ms ease;
  }
  .sf-pw-req--met { color: #059669; font-weight: 500; }
  .sf-pw-req__check {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e2e8f0;
    color: #94a3b8;
    flex-shrink: 0;
    transition: background 150ms ease, color 150ms ease;
  }
  .sf-pw-req--met .sf-pw-req__check {
    background: #dcfce7;
    color: #16a34a;
  }

  /* Security info box */
  .sf-info-box {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.875rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
  }
  .sf-info-box__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 8px;
    background: rgba(16,185,129,0.1);
    color: #059669;
    flex-shrink: 0;
  }
  .sf-info-box__title { font-size: 12px; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
  .sf-info-box__list {
    list-style: disc;
    padding-left: 1rem;
    margin: 0;
    font-size: 11px;
    color: #64748b;
    line-height: 1.7;
  }

  /* Terms checkbox */
  .sf-terms-label {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    color: #374151;
    line-height: 1.6;
  }
  .sf-terms-label input[type="checkbox"] {
    width: 16px;
    height: 16px;
    margin-top: 1px;
    border-radius: 4px;
    accent-color: #0f172a;
    cursor: pointer;
    flex-shrink: 0;
  }

  /* Review table */
  .sf-review-section {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    overflow: hidden;
    margin-bottom: 0.75rem;
  }
  .sf-review-section:last-child { margin-bottom: 0; }
  .sf-review-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.875rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
  }
  .sf-review-head__label {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .sf-review-head__edit {
    font-size: 11px;
    font-weight: 600;
    color: #059669;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    font-family: 'Inter', system-ui, sans-serif;
  }
  .sf-review-head__edit:hover { text-decoration: underline; }
  .sf-review-body { padding: 0.875rem; }
  .sf-review-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.625rem;
  }
  .sf-review-item {}
  .sf-review-item__key { font-size: 10px; color: #94a3b8; font-weight: 500; margin-bottom: 2px; }
  .sf-review-item__val { font-size: 12px; color: #1e293b; font-weight: 500; }

  /* Footer */
  .sf-footer {
    padding: 1.25rem 1.75rem 1.75rem;
    border-top: 1px solid #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .sf-footer-nav {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  .sf-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 42px;
    padding: 0 1.25rem;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    cursor: pointer;
    border: none;
    outline: none;
    transition: all 150ms ease;
    letter-spacing: 0.005em;
    white-space: nowrap;
  }
  .sf-phone-wrap {
    display: flex;
    align-items: center;
    position: relative;
  }
  .sf-phone-prefix {
    position: absolute;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    pointer-events: none;
    z-index: 2;
  }
  .sf-phone-prefix svg {
    color: #94a3b8;
  }
  .sf-flag {
    font-size: 14px;
    line-height: 1;
  }
  .sf-country-code {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
  }
  .sf-prefix-div {
    color: #cbd5e1;
    margin-left: 2px;
  }
  .sf-input--phone {
    padding-left: 88px;
  }

  .sf-btn--primary {
    background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);
    color: #fff;
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
    border-radius: 12px;
    padding: 0 1.5rem;
    font-weight: 700;
    margin-left: auto;
  }
  .sf-btn--primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #0369a1 0%, #1d4ed8 100%);
    box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
    transform: translateY(-1px);
  }
  .sf-btn--primary:active:not(:disabled) { transform: translateY(0); }
  .sf-btn--primary:disabled { opacity: 0.55; cursor: not-allowed; }
  .sf-btn--outline {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    color: #475569;
    border-radius: 12px;
    font-weight: 600;
    padding: 0 1.25rem;
  }
  .sf-btn--outline:hover { border-color: #cbd5e1; background: #f1f5f9; }
  .sf-btn--ghost {
    background: transparent;
    color: #64748b;
    border: none;
    font-size: 12px;
    padding: 0 0.5rem;
    height: 36px;
  }
  .sf-btn--ghost:hover { color: #374151; }

  .sf-footer-link {
    text-align: center;
    font-size: 12px;
    color: #94a3b8;
    padding-top: 0.875rem;
    border-top: 1px solid #f1f5f9;
  }
  .sf-footer-link a {
    color: #0284c7;
    font-weight: 700;
    text-decoration: none;
    transition: color 120ms ease;
  }
  .sf-footer-link a:hover { color: #0369a1; text-decoration: underline; }

  .sf-hint {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.5;
  }

  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  @media (prefers-reduced-motion: reduce) {
    .sf-btn--primary { transition: none !important; transform: none !important; }
    .sf-step__bubble,
    .sf-progress__fill { transition: none !important; }
  }
`;

/* ─── Step variants ──────────────────────────────────────── */
const EASE_OUT_QUINT = [0.16, 1, 0.3, 1] as const;

function buildVariants(reduced: boolean) {
  if (reduced) {
    return {
      enter: { opacity: 0 },
      center: { opacity: 1, transition: { duration: 0.15 } },
      exit:  { opacity: 0, transition: { duration: 0.1 } },
    };
  }
  return {
    enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.24, ease: EASE_OUT_QUINT } },
    exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0, transition: { duration: 0.18, ease: EASE_OUT_QUINT } }),
  };
}

/* ─── Step config ────────────────────────────────────────── */
const STEPS = [
  { label: 'Admin', icon: User },
  { label: 'School', icon: Building2 },
  { label: 'Security', icon: ShieldCheck },
  { label: 'Review', icon: Check },
];

/* ────────────────────────────────────────────────────────── */
/*  Signup Page                                              */
/* ────────────────────────────────────────────────────────── */
export default function SignupPage() {
  const router = useRouter();
  const { signup, user, authState } = useAuth();
  const prefersReduced = useReducedMotion() ?? false;
  const variants = buildVariants(prefersReduced);

  const [currentStep, setCurrentStep] = useState<SignupStep>(1);
  const [direction, setDirection] = useState(1);

  /* Prevent hydration mismatch — motion styles differ between SSR and client */
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  /* Step 1: Administrator */
  const [adminData, setAdminData] = useState<AdminFormState>({
    firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminErrors, setAdminErrors] = useState<Partial<Record<keyof AdminFormState, string>>>({});

  /* Step 2: School */
  const [schoolData, setSchoolData] = useState<SchoolFormState>({
    name: '', code: '', affiliation: '', officialEmail: '', phone: '', address: '', city: '', state: '', pinCode: '',
  });
  const [schoolErrors, setSchoolErrors] = useState<Partial<Record<keyof SchoolFormState, string>>>({});

  /* Step 3: Terms */
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  /* Submission */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  /* Redirect if already authenticated */
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user) {
      if (['DIRECTOR','PRINCIPAL','SCHOOL_ADMIN','ADMIN','TEACHER'].includes(user.roleType || '')) {
        router.replace('/school');
      } else {
        router.replace('/access-denied');
      }
    }
  }, [authState, user, router]);

  /* Warn on tab close when dirty */
  useEffect(() => {
    const dirty = adminData.firstName || adminData.lastName || adminData.email || schoolData.name;
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty && !isSubmitting) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [adminData, schoolData, isSubmitting]);

  /* Password strength */
  const pwCriteria = {
    minLength: adminData.password.length >= 8,
    hasUpper: /[A-Z]/.test(adminData.password),
    hasLower: /[a-z]/.test(adminData.password),
    hasNumber: /[0-9]/.test(adminData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(adminData.password),
  };
  const isPasswordSecure = Object.values(pwCriteria).every(Boolean);

  /* Step 1 validation */
  const validateAdmin = (): boolean => {
    const errors: Partial<Record<keyof AdminFormState, string>> = {};
    if (!adminData.firstName.trim()) errors.firstName = 'First name is required.';
    if (!adminData.lastName.trim())  errors.lastName  = 'Last name is required.';
    if (!adminData.email.trim())     errors.email     = 'Work email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email.trim())) errors.email = 'Enter a valid email.';
    if (!adminData.password)         errors.password  = 'Password is required.';
    else if (!isPasswordSecure)      errors.password  = 'Password does not meet all requirements.';
    if (!adminData.confirmPassword)  errors.confirmPassword = 'Confirm your password.';
    else if (adminData.password !== adminData.confirmPassword) errors.confirmPassword = 'Passwords do not match.';
    setAdminErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* Step 2 validation */
  const validateSchool = (): boolean => {
    const errors: Partial<Record<keyof SchoolFormState, string>> = {};
    if (!schoolData.name.trim()) errors.name = 'School legal name is required.';
    if (schoolData.officialEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolData.officialEmail.trim()))
      errors.officialEmail = 'Enter a valid email.';
    setSchoolErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* Navigation */
  const goTo = (step: SignupStep, dir: number) => {
    setDirection(dir);
    setCurrentStep(step);
    setServerError(null);
  };

  const handleNext = () => {
    if (currentStep === 1 && validateAdmin())       goTo(2, 1);
    else if (currentStep === 2 && validateSchool()) goTo(3, 1);
    else if (currentStep === 3) {
      if (!agreedToTerms) { setTermsError('You must agree to continue.'); return; }
      setTermsError(null);
      goTo(4, 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) goTo((currentStep - 1) as SignupStep, -1);
  };

  /* Final submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!agreedToTerms) { goTo(3, -1); setTermsError('You must agree to the terms.'); return; }

    setIsSubmitting(true);
    setServerError(null);
    try {
      const payload = {
        administrator: {
          firstName: adminData.firstName.trim(),
          lastName:  adminData.lastName.trim(),
          email:     adminData.email.trim(),
          phone:     adminData.phone.trim() || undefined,
          password:  adminData.password,
        },
        school: {
          name:          schoolData.name.trim(),
          code:          schoolData.code.trim()          || undefined,
          affiliation:   schoolData.affiliation.trim()   || undefined,
          officialEmail: schoolData.officialEmail.trim() || undefined,
          phone:         schoolData.phone.trim()         || undefined,
          address:       schoolData.address.trim()       || undefined,
          city:          schoolData.city.trim()          || undefined,
          state:         schoolData.state.trim()         || undefined,
          pinCode:       schoolData.pinCode.trim()       || undefined,
        },
        agreedToTerms: true,
      };

      const result = await signup(payload);

      if (result.success) {
        if (result.requiresEmailVerification) {
          router.push(`/verify-email?email=${encodeURIComponent(adminData.email.trim())}`);
        } else {
          router.push('/school');
        }
      } else {
        const msg =
          result.error ||
          (result.errorCode === 'EMAIL_EXISTS'         ? 'This email is already registered.'
          : result.errorCode === 'SERVICE_UNAVAILABLE' ? 'Account creation service is currently unavailable.'
          : result.errorCode === 'NETWORK_ERROR'       ? 'Unable to create your account. Please try again.'
          : 'Please correct the highlighted fields.');
        setServerError(msg);
      }
    } catch {
      setServerError('Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ──────────────────── RENDER ──────────────────── */
  return (
    <>
      <style>{css}</style>

      <div className="sf-card">
        {/* ── Header ── */}
        <div className="sf-header">
          <h1 className="sf-title">Create school account</h1>
          <p className="sf-subtitle">Set up your institution&apos;s Rivo workspace and administrator account.</p>

          {/* Stepper */}
          <div className="sf-stepper" role="list" aria-label="Setup steps">
            {STEPS.map((step, i) => {
              const stepNum = (i + 1) as SignupStep;
              const isActive = currentStep === stepNum;
              const isDone   = currentStep > stepNum;

              return (
                <React.Fragment key={step.label}>
                  <div className="sf-step" role="listitem">
                    <div
                      className={`sf-step__bubble ${isActive ? 'sf-step__bubble--active' : isDone ? 'sf-step__bubble--done' : ''}`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {isDone ? <Check size={12} strokeWidth={3} /> : stepNum}
                    </div>
                    <span className={`sf-step__label ${isActive ? 'sf-step__label--active' : isDone ? 'sf-step__label--done' : ''}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`sf-step__connector ${isDone ? 'sf-step__connector--done' : ''}`} aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="sf-progress" role="progressbar" aria-valuenow={(currentStep / 4) * 100} aria-valuemin={0} aria-valuemax={100}>
            <div className="sf-progress__fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="sf-body">
          {serverError && (
            <div className="sf-alert" role="alert" aria-live="assertive">
              <AlertCircle size={15} className="sf-alert__icon" />
              <div>
                <p className="sf-alert__title">Account Creation Failed</p>
                <p className="sf-alert__msg">{serverError}</p>
              </div>
            </div>
          )}

          <AnimatePresence custom={direction} mode="wait" initial={false}>

            {/* ── STEP 1: ADMIN ── */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <div className="sf-section-head">
                  <div className="sf-section-head__icon">
                    <Users className="w-5 h-5 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="sf-section-title">Administrator Account</h2>
                    <p className="sf-section-desc">Create the primary school administrator profile.</p>
                  </div>
                </div>

                <div className="sf-grid" style={{ gap: '1rem' }}>
                  {/* Name row */}
                  <div className="sf-grid sf-grid--2">
                    <div className="sf-field">
                      <label htmlFor="firstName" className="sf-label">First Name <span className="sf-label__req">*</span></label>
                      <div className="sf-input-wrap">
                        <User className="sf-input-icon" aria-hidden="true" />
                        <input
                          id="firstName"
                          className={`sf-input sf-input--icon ${adminErrors.firstName ? 'sf-input--error' : ''}`}
                          placeholder="e.g. Rachel"
                          value={adminData.firstName}
                          onChange={e => { setAdminData(p => ({...p, firstName: e.target.value})); if (adminErrors.firstName) setAdminErrors(p => ({...p, firstName: undefined})); }}
                        />
                      </div>
                      {adminErrors.firstName && <p className="sf-field-err">{adminErrors.firstName}</p>}
                    </div>
                    <div className="sf-field">
                      <label htmlFor="lastName" className="sf-label">Last Name <span className="sf-label__req">*</span></label>
                      <div className="sf-input-wrap">
                        <User className="sf-input-icon" aria-hidden="true" />
                        <input
                          id="lastName"
                          className={`sf-input sf-input--icon ${adminErrors.lastName ? 'sf-input--error' : ''}`}
                          placeholder="e.g. Adams"
                          value={adminData.lastName}
                          onChange={e => { setAdminData(p => ({...p, lastName: e.target.value})); if (adminErrors.lastName) setAdminErrors(p => ({...p, lastName: undefined})); }}
                        />
                      </div>
                      {adminErrors.lastName && <p className="sf-field-err">{adminErrors.lastName}</p>}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="sf-field">
                    <label htmlFor="adminEmail" className="sf-label">Work Email <span className="sf-label__req">*</span></label>
                    <div className="sf-input-wrap">
                      <Mail className="sf-input-icon" aria-hidden="true" />
                      <input
                        id="adminEmail"
                        type="email"
                        className={`sf-input sf-input--icon ${adminErrors.email ? 'sf-input--error' : ''}`}
                        placeholder="principal@institution.edu"
                        value={adminData.email}
                        onChange={e => { setAdminData(p => ({...p, email: e.target.value})); if (adminErrors.email) setAdminErrors(p => ({...p, email: undefined})); }}
                      />
                    </div>
                    {adminErrors.email && <p className="sf-field-err">{adminErrors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="sf-field">
                    <label htmlFor="adminPhone" className="sf-label">Phone Number <span className="sf-label__opt">(Optional)</span></label>
                    <div className="sf-input-wrap sf-phone-wrap">
                      <div className="sf-phone-prefix">
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="sf-flag">🇮🇳</span>
                        <span className="sf-country-code">+91</span>
                        <span className="sf-prefix-div">|</span>
                      </div>
                      <input
                        id="adminPhone"
                        type="tel"
                        className="sf-input sf-input--phone"
                        placeholder="98765 43210"
                        value={adminData.phone}
                        onChange={e => setAdminData(p => ({...p, phone: e.target.value}))}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="sf-field">
                    <label htmlFor="adminPassword" className="sf-label">Password <span className="sf-label__req">*</span></label>
                    <div className="sf-input-wrap">
                      <Lock className="sf-input-icon" aria-hidden="true" />
                      <input
                        id="adminPassword"
                        type={showPassword ? 'text' : 'password'}
                        className={`sf-input sf-input--icon ${adminErrors.password ? 'sf-input--error' : ''}`}
                        style={{ paddingRight: 38 }}
                        placeholder="Create a strong password"
                        value={adminData.password}
                        onChange={e => { setAdminData(p => ({...p, password: e.target.value})); if (adminErrors.password) setAdminErrors(p => ({...p, password: undefined})); }}
                      />
                      <button type="button" className="sf-input-toggle" onClick={() => setShowPassword(p => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {adminErrors.password && <p className="sf-field-err">{adminErrors.password}</p>}

                    {/* Requirements */}
                    <div className="sf-pw-reqs">
                      <p className="sf-pw-reqs__title">Password must contain:</p>
                      <ul className="sf-pw-reqs__list">
                        {[
                          ['minLength', 'Min. 8 characters'],
                          ['hasUpper',  'Uppercase letter'],
                          ['hasLower',  'Lowercase letter'],
                          ['hasNumber', 'One number (0-9)'],
                          ['hasSpecial','Special character'],
                        ].map(([key, label]) => (
                          <li key={key} className={`sf-pw-req ${pwCriteria[key as keyof typeof pwCriteria] ? 'sf-pw-req--met' : ''}`}>
                            <span className="sf-pw-req__check">
                              {pwCriteria[key as keyof typeof pwCriteria] ? <Check size={9} strokeWidth={3} /> : null}
                            </span>
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="sf-field">
                    <label htmlFor="confirmPassword" className="sf-label">Confirm Password <span className="sf-label__req">*</span></label>
                    <div className="sf-input-wrap">
                      <Lock className="sf-input-icon" aria-hidden="true" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`sf-input sf-input--icon ${adminErrors.confirmPassword ? 'sf-input--error' : ''}`}
                        style={{ paddingRight: 38 }}
                        placeholder="Re-enter your password"
                        value={adminData.confirmPassword}
                        onChange={e => { setAdminData(p => ({...p, confirmPassword: e.target.value})); if (adminErrors.confirmPassword) setAdminErrors(p => ({...p, confirmPassword: undefined})); }}
                      />
                      <button type="button" className="sf-input-toggle" onClick={() => setShowConfirmPassword(p => !p)} aria-label={showConfirmPassword ? 'Hide' : 'Show'}>
                        {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {adminErrors.confirmPassword && <p className="sf-field-err">{adminErrors.confirmPassword}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: SCHOOL ── */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <div className="sf-section-head">
                  <h2 className="sf-section-title">School Information</h2>
                  <p className="sf-section-desc">Configure your institution&apos;s legal identity and operational details.</p>
                </div>

                <div className="sf-grid" style={{ gap: '1rem' }}>
                  {/* School name */}
                  <div className="sf-field">
                    <label htmlFor="schoolName" className="sf-label">School Legal Name <span className="sf-label__req">*</span></label>
                    <div className="sf-input-wrap">
                      <Building2 className="sf-input-icon" aria-hidden="true" />
                      <input
                        id="schoolName"
                        className={`sf-input sf-input--icon ${schoolErrors.name ? 'sf-input--error' : ''}`}
                        placeholder="e.g. St. Xavier International Academy"
                        value={schoolData.name}
                        onChange={e => { setSchoolData(p => ({...p, name: e.target.value})); if (schoolErrors.name) setSchoolErrors(p => ({...p, name: undefined})); }}
                      />
                    </div>
                    {schoolErrors.name && <p className="sf-field-err">{schoolErrors.name}</p>}
                  </div>

                  {/* Code + Affiliation */}
                  <div className="sf-grid sf-grid--2">
                    <div className="sf-field">
                      <label htmlFor="schoolCode" className="sf-label">School Code <span className="sf-label__opt">(Optional)</span></label>
                      <input
                        id="schoolCode"
                        className="sf-input"
                        placeholder="e.g. SXIA-01"
                        value={schoolData.code}
                        onChange={e => setSchoolData(p => ({...p, code: e.target.value}))}
                      />
                    </div>
                    <div className="sf-field">
                      <label htmlFor="affiliation" className="sf-label">Affiliation / Board <span className="sf-label__opt">(Optional)</span></label>
                      <input
                        id="affiliation"
                        className="sf-input"
                        placeholder="e.g. CBSE"
                        value={schoolData.affiliation}
                        onChange={e => setSchoolData(p => ({...p, affiliation: e.target.value}))}
                      />
                    </div>
                  </div>

                  {/* Official email + phone */}
                  <div className="sf-grid sf-grid--2">
                    <div className="sf-field">
                      <label htmlFor="officialEmail" className="sf-label">Official Email <span className="sf-label__opt">(Optional)</span></label>
                      <input
                        id="officialEmail"
                        type="email"
                        className={`sf-input ${schoolErrors.officialEmail ? 'sf-input--error' : ''}`}
                        placeholder="info@institution.edu"
                        value={schoolData.officialEmail}
                        onChange={e => { setSchoolData(p => ({...p, officialEmail: e.target.value})); if (schoolErrors.officialEmail) setSchoolErrors(p => ({...p, officialEmail: undefined})); }}
                      />
                      {schoolErrors.officialEmail && <p className="sf-field-err">{schoolErrors.officialEmail}</p>}
                    </div>
                    <div className="sf-field">
                      <label htmlFor="schoolPhone" className="sf-label">Phone <span className="sf-label__opt">(Optional)</span></label>
                      <input
                        id="schoolPhone"
                        type="tel"
                        className="sf-input"
                        placeholder="+91 (011) 123-4567"
                        value={schoolData.phone}
                        onChange={e => setSchoolData(p => ({...p, phone: e.target.value}))}
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <div className="sf-field">
                    <label htmlFor="schoolAddress" className="sf-label">Address <span className="sf-label__opt">(Optional)</span></label>
                    <input
                      id="schoolAddress"
                      className="sf-input"
                      placeholder="Institutional street address"
                      value={schoolData.address}
                      onChange={e => setSchoolData(p => ({...p, address: e.target.value}))}
                    />
                  </div>

                  {/* City, State, PIN */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '0.875rem' }}>
                    <div className="sf-field">
                      <label htmlFor="city" className="sf-label">City <span className="sf-label__opt">(Optional)</span></label>
                      <input id="city" className="sf-input" placeholder="City" value={schoolData.city} onChange={e => setSchoolData(p => ({...p, city: e.target.value}))} />
                    </div>
                    <div className="sf-field">
                      <label htmlFor="state" className="sf-label">State <span className="sf-label__opt">(Optional)</span></label>
                      <input id="state" className="sf-input" placeholder="State" value={schoolData.state} onChange={e => setSchoolData(p => ({...p, state: e.target.value}))} />
                    </div>
                    <div className="sf-field">
                      <label htmlFor="pinCode" className="sf-label">PIN <span className="sf-label__opt">(Opt.)</span></label>
                      <input id="pinCode" className="sf-input" placeholder="110001" value={schoolData.pinCode} onChange={e => setSchoolData(p => ({...p, pinCode: e.target.value}))} />
                    </div>
                  </div>

                  {/* Multi-campus note */}
                  <div className="sf-info-box">
                    <span className="sf-info-box__icon"><Building2 size={14} /></span>
                    <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: '#374151' }}>Multi-Campus Support:</strong> Branch campuses are not required during initial setup. You can add them in Settings after onboarding.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: SECURITY & TERMS ── */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <div className="sf-section-head">
                  <h2 className="sf-section-title">Security &amp; Acknowledgement</h2>
                  <p className="sf-section-desc">Confirm institutional governance and access policies.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="sf-info-box" style={{ alignItems: 'flex-start', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span className="sf-info-box__icon"><ShieldCheck size={14} /></span>
                      <p className="sf-info-box__title" style={{ margin: 0 }}>Institutional Governance Standards</p>
                    </div>
                    <ul className="sf-info-box__list">
                      <li>Your administrator account holds top-tier authority over school records and user provisioning.</li>
                      <li>Student and guardian privacy is maintained under strict multi-tenant data isolation.</li>
                      <li>Password complexity, session timeouts, and MFA policies are configurable in School Settings.</li>
                    </ul>
                  </div>

                  <div style={{ paddingTop: '0.25rem' }}>
                    <label className="sf-terms-label" htmlFor="terms-check">
                      <input
                        id="terms-check"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={e => { setAgreedToTerms(e.target.checked); if (termsError) setTermsError(null); }}
                      />
                      <span>
                        I agree to the Rivo{' '}
                        <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 600 }}>Terms of Service</a>
                        {' '}and{' '}
                        <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 600 }}>Privacy Policy</a>
                        , and confirm that I am authorized to establish this institutional workspace.
                      </span>
                    </label>
                    {termsError && <p className="sf-field-err" style={{ marginTop: '0.375rem' }}>{termsError}</p>}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 4: REVIEW ── */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={mounted ? variants : undefined}
                initial={false}
                animate={mounted ? 'center' : undefined}
                exit={mounted ? 'exit' : undefined}
                suppressHydrationWarning
              >
                <div className="sf-section-head">
                  <h2 className="sf-section-title">Review &amp; Confirm</h2>
                  <p className="sf-section-desc">Verify your information before creating the school workspace.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {/* Admin review */}
                  <div className="sf-review-section">
                    <div className="sf-review-head">
                      <span className="sf-review-head__label">Administrator</span>
                      <button className="sf-review-head__edit" onClick={() => goTo(1, -1)}>Edit</button>
                    </div>
                    <div className="sf-review-body">
                      <div className="sf-review-grid">
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Name</p>
                          <p className="sf-review-item__val">{adminData.firstName} {adminData.lastName}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Email</p>
                          <p className="sf-review-item__val" style={{ wordBreak: 'break-all' }}>{adminData.email}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Phone</p>
                          <p className="sf-review-item__val">{adminData.phone || <span style={{ color: '#94a3b8' }}>Not provided</span>}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Role</p>
                          <p className="sf-review-item__val">Primary Administrator</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* School review */}
                  <div className="sf-review-section">
                    <div className="sf-review-head">
                      <span className="sf-review-head__label">School Information</span>
                      <button className="sf-review-head__edit" onClick={() => goTo(2, -1)}>Edit</button>
                    </div>
                    <div className="sf-review-body">
                      <div className="sf-review-grid">
                        <div className="sf-review-item" style={{ gridColumn: '1 / -1' }}>
                          <p className="sf-review-item__key">Legal Name</p>
                          <p className="sf-review-item__val">{schoolData.name}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">School Code</p>
                          <p className="sf-review-item__val">{schoolData.code || <span style={{ color: '#94a3b8' }}>—</span>}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Affiliation</p>
                          <p className="sf-review-item__val">{schoolData.affiliation || <span style={{ color: '#94a3b8' }}>—</span>}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Official Email</p>
                          <p className="sf-review-item__val" style={{ wordBreak: 'break-all' }}>{schoolData.officialEmail || <span style={{ color: '#94a3b8' }}>—</span>}</p>
                        </div>
                        <div className="sf-review-item">
                          <p className="sf-review-item__key">Address</p>
                          <p className="sf-review-item__val">{schoolData.address || <span style={{ color: '#94a3b8' }}>—</span>}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer Navigation ── */}
        <div className="sf-footer">
          <div className="sf-footer-nav">
            {currentStep > 1 ? (
              <button type="button" className="sf-btn sf-btn--outline" onClick={handleBack} disabled={isSubmitting}>
                <ArrowLeft size={13} aria-hidden="true" />
                Back
              </button>
            ) : (
              <Link href="/login">
                <button type="button" className="sf-btn sf-btn--outline" style={{ minWidth: 100 }}>Cancel</button>
              </Link>
            )}

            {currentStep < 4 ? (
              <button type="button" className="sf-btn sf-btn--primary" onClick={handleNext}>
                Continue
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className="sf-btn sf-btn--primary"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} aria-hidden="true" /> Creating...</>
                  : <>Create School Account <ArrowRight size={13} aria-hidden="true" /></>}
              </button>
            )}
          </div>

          <div className="sf-footer-link">
            Already have an account?{' '}
            <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </>
  );
}
