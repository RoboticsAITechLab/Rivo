'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth/auth-context';

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

export default function SignupPage() {
  const router = useRouter();
  const { signup, user, authState } = useAuth();

  const [currentStep, setCurrentStep] = useState<SignupStep>(1);

  // Step 1: Administrator Details
  const [adminData, setAdminData] = useState<AdminFormState>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [adminErrors, setAdminErrors] = useState<Partial<Record<keyof AdminFormState, string>>>({});

  // Step 2: School Information
  const [schoolData, setSchoolData] = useState<SchoolFormState>({
    name: '',
    code: '',
    affiliation: '',
    officialEmail: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pinCode: '',
  });
  const [schoolErrors, setSchoolErrors] = useState<Partial<Record<keyof SchoolFormState, string>>>({});

  // Step 3: Security & Terms
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (authState === 'AUTHENTICATED' && user) {
      if (
        user.roleType === 'SCHOOL_ADMIN' ||
        user.roleType === 'ADMIN' ||
        user.roleType === 'OWNER' ||
        user.roleType === 'TEACHER'
      ) {
        router.replace('/school');
      } else {
        router.replace('/access-denied');
      }
    }
  }, [authState, user, router]);

  // Warn on tab closing if form has dirty data
  useEffect(() => {
    const isDirty =
      adminData.firstName ||
      adminData.lastName ||
      adminData.email ||
      schoolData.name;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [adminData, schoolData, isSubmitting]);

  // Password criteria check
  const passwordCriteria = {
    minLength: adminData.password.length >= 8,
    hasUpper: /[A-Z]/.test(adminData.password),
    hasLower: /[a-z]/.test(adminData.password),
    hasNumber: /[0-9]/.test(adminData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(adminData.password),
  };

  const isPasswordSecure =
    passwordCriteria.minLength &&
    passwordCriteria.hasUpper &&
    passwordCriteria.hasLower &&
    passwordCriteria.hasNumber &&
    passwordCriteria.hasSpecial;

  // Step 1 Validation
  const validateAdminStep = (): boolean => {
    const errors: Partial<Record<keyof AdminFormState, string>> = {};
    let valid = true;

    if (!adminData.firstName.trim()) {
      errors.firstName = 'First name is required.';
      valid = false;
    }

    if (!adminData.lastName.trim()) {
      errors.lastName = 'Last name is required.';
      valid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminData.email.trim()) {
      errors.email = 'Work email is required.';
      valid = false;
    } else if (!emailRegex.test(adminData.email.trim())) {
      errors.email = 'Enter a valid email address.';
      valid = false;
    }

    if (!adminData.password) {
      errors.password = 'Password is required.';
      valid = false;
    } else if (!isPasswordSecure) {
      errors.password = 'Password does not meet all security requirements.';
      valid = false;
    }

    if (!adminData.confirmPassword) {
      errors.confirmPassword = 'Confirm your password.';
      valid = false;
    } else if (adminData.password !== adminData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      valid = false;
    }

    setAdminErrors(errors);
    return valid;
  };

  // Step 2 Validation
  const validateSchoolStep = (): boolean => {
    const errors: Partial<Record<keyof SchoolFormState, string>> = {};
    let valid = true;

    if (!schoolData.name.trim()) {
      errors.name = 'School legal name is required.';
      valid = false;
    }

    if (schoolData.officialEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(schoolData.officialEmail.trim())) {
        errors.officialEmail = 'Enter a valid email address.';
        valid = false;
      }
    }

    setSchoolErrors(errors);
    return valid;
  };

  // Step navigation
  const handleNext = () => {
    setServerError(null);

    if (currentStep === 1) {
      if (validateAdminStep()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateSchoolStep()) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      if (!agreedToTerms) {
        setTermsError('You must agree to the Terms of Service and Privacy Policy to continue.');
        return;
      }
      setTermsError(null);
      setCurrentStep(4);
    }
  };

  const handleBack = () => {
    setServerError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as SignupStep);
    }
  };

  // Step 5: Final Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!agreedToTerms) {
      setCurrentStep(3);
      setTermsError('You must agree to the terms to complete account creation.');
      return;
    }

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        administrator: {
          firstName: adminData.firstName.trim(),
          lastName: adminData.lastName.trim(),
          email: adminData.email.trim(),
          phone: adminData.phone.trim() || undefined,
          password: adminData.password,
        },
        school: {
          name: schoolData.name.trim(),
          code: schoolData.code.trim() || undefined,
          affiliation: schoolData.affiliation.trim() || undefined,
          officialEmail: schoolData.officialEmail.trim() || undefined,
          phone: schoolData.phone.trim() || undefined,
          address: schoolData.address.trim() || undefined,
          city: schoolData.city.trim() || undefined,
          state: schoolData.state.trim() || undefined,
          pinCode: schoolData.pinCode.trim() || undefined,
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
        const errorMsg =
          result.error ||
          (result.errorCode === 'EMAIL_EXISTS'
            ? 'This email is already registered.'
            : result.errorCode === 'SERVICE_UNAVAILABLE'
            ? 'Account creation service is currently unavailable.'
            : result.errorCode === 'NETWORK_ERROR'
            ? 'Unable to create your account. Please try again.'
            : 'Please correct the highlighted fields.');

        setServerError(errorMsg);
      }
    } catch {
      setServerError('Unable to create your account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm border-slate-200/80 bg-white">
      <CardHeader className="space-y-3 pb-4">
        <div>
          <CardTitle className="text-xl font-bold tracking-tight text-slate-900">
            Create your school account
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Set up your school workspace and administrator account.
          </CardDescription>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 mb-2">
            <span className={currentStep === 1 ? 'font-bold text-slate-900' : ''}>
              ① Admin
            </span>
            <span className="text-slate-300">───</span>
            <span className={currentStep === 2 ? 'font-bold text-slate-900' : ''}>
              ② School
            </span>
            <span className="text-slate-300">───</span>
            <span className={currentStep === 3 ? 'font-bold text-slate-900' : ''}>
              ③ Security
            </span>
            <span className="text-slate-300">───</span>
            <span className={currentStep === 4 ? 'font-bold text-slate-900' : ''}>
              ④ Review
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-slate-900 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Server Error Alert */}
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in-0 duration-200"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
            <div className="space-y-0.5">
              <p className="font-semibold text-red-800">Account Creation Failed</p>
              <p>{serverError}</p>
            </div>
          </div>
        )}

        {/* ================= STEP 1: ADMINISTRATOR ================= */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Administrator</h3>
              <p className="text-[11px] text-slate-500">
                Create the primary school administrator account.
              </p>
            </div>

            {/* Name fields row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="firstName"
                  className="block text-xs font-semibold text-slate-700"
                >
                  First Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="firstName"
                  value={adminData.firstName}
                  onChange={(e) => {
                    setAdminData({ ...adminData, firstName: e.target.value });
                    if (adminErrors.firstName) {
                      setAdminErrors({ ...adminErrors, firstName: undefined });
                    }
                  }}
                  placeholder="e.g. Rachel"
                  className={`text-xs sm:text-sm ${
                    adminErrors.firstName ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {adminErrors.firstName && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {adminErrors.firstName}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="lastName"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Last Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="lastName"
                  value={adminData.lastName}
                  onChange={(e) => {
                    setAdminData({ ...adminData, lastName: e.target.value });
                    if (adminErrors.lastName) {
                      setAdminErrors({ ...adminErrors, lastName: undefined });
                    }
                  }}
                  placeholder="e.g. Adams"
                  className={`text-xs sm:text-sm ${
                    adminErrors.lastName ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {adminErrors.lastName && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {adminErrors.lastName}
                  </p>
                )}
              </div>
            </div>

            {/* Work Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="adminEmail"
                className="block text-xs font-semibold text-slate-700"
              >
                Work Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="adminEmail"
                  type="email"
                  value={adminData.email}
                  onChange={(e) => {
                    setAdminData({ ...adminData, email: e.target.value });
                    if (adminErrors.email) {
                      setAdminErrors({ ...adminErrors, email: undefined });
                    }
                  }}
                  placeholder="principal@institution.edu"
                  className={`pl-9 text-xs sm:text-sm ${
                    adminErrors.email ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {adminErrors.email && (
                <p className="text-[11px] text-red-600 font-medium">
                  {adminErrors.email}
                </p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label
                htmlFor="adminPhone"
                className="block text-xs font-semibold text-slate-700"
              >
                Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="adminPhone"
                  type="tel"
                  value={adminData.phone}
                  onChange={(e) => setAdminData({ ...adminData, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="pl-9 text-xs sm:text-sm border-slate-200"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="adminPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="adminPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={adminData.password}
                  onChange={(e) => {
                    setAdminData({ ...adminData, password: e.target.value });
                    if (adminErrors.password) {
                      setAdminErrors({ ...adminErrors, password: undefined });
                    }
                  }}
                  placeholder="Create a strong password"
                  className={`pl-9 pr-10 text-xs sm:text-sm ${
                    adminErrors.password ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {adminErrors.password && (
                <p className="text-[11px] text-red-600 font-medium">
                  {adminErrors.password}
                </p>
              )}

              {/* Real-time Password Requirements Checklist */}
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 space-y-1 text-[11px]">
                <p className="font-semibold text-slate-700">Password must contain:</p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-600">
                  <li className={`flex items-center gap-1.5 ${passwordCriteria.minLength ? 'text-emerald-700 font-medium' : ''}`}>
                    <span className="w-3.5 text-center">{passwordCriteria.minLength ? '✓' : '•'}</span>
                    Minimum 8 characters
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordCriteria.hasUpper ? 'text-emerald-700 font-medium' : ''}`}>
                    <span className="w-3.5 text-center">{passwordCriteria.hasUpper ? '✓' : '•'}</span>
                    One uppercase letter
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordCriteria.hasLower ? 'text-emerald-700 font-medium' : ''}`}>
                    <span className="w-3.5 text-center">{passwordCriteria.hasLower ? '✓' : '•'}</span>
                    One lowercase letter
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordCriteria.hasNumber ? 'text-emerald-700 font-medium' : ''}`}>
                    <span className="w-3.5 text-center">{passwordCriteria.hasNumber ? '✓' : '•'}</span>
                    One number (0-9)
                  </li>
                  <li className={`flex items-center gap-1.5 ${passwordCriteria.hasSpecial ? 'text-emerald-700 font-medium' : ''}`}>
                    <span className="w-3.5 text-center">{passwordCriteria.hasSpecial ? '✓' : '•'}</span>
                    One special character (!@#$)
                  </li>
                </ul>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-semibold text-slate-700"
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={adminData.confirmPassword}
                  onChange={(e) => {
                    setAdminData({ ...adminData, confirmPassword: e.target.value });
                    if (adminErrors.confirmPassword) {
                      setAdminErrors({ ...adminErrors, confirmPassword: undefined });
                    }
                  }}
                  placeholder="Re-enter your password"
                  className={`pl-9 pr-10 text-xs sm:text-sm ${
                    adminErrors.confirmPassword ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {adminErrors.confirmPassword && (
                <p className="text-[11px] text-red-600 font-medium">
                  {adminErrors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 2: SCHOOL ================= */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">School Information</h3>
              <p className="text-[11px] text-slate-500">
                Configure your institution&apos;s legal profile and operational identifiers.
              </p>
            </div>

            {/* School Legal Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="schoolName"
                className="block text-xs font-semibold text-slate-700"
              >
                School Legal Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <Input
                  id="schoolName"
                  value={schoolData.name}
                  onChange={(e) => {
                    setSchoolData({ ...schoolData, name: e.target.value });
                    if (schoolErrors.name) {
                      setSchoolErrors({ ...schoolErrors, name: undefined });
                    }
                  }}
                  placeholder="e.g. St. Xavier International Academy"
                  className={`pl-9 text-xs sm:text-sm ${
                    schoolErrors.name ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
              </div>
              {schoolErrors.name && (
                <p className="text-[11px] text-red-600 font-medium">
                  {schoolErrors.name}
                </p>
              )}
            </div>

            {/* School Code & Affiliation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="schoolCode"
                  className="block text-xs font-semibold text-slate-700"
                >
                  School Code <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="schoolCode"
                  value={schoolData.code}
                  onChange={(e) => setSchoolData({ ...schoolData, code: e.target.value })}
                  placeholder="e.g. SXIA-01"
                  className="text-xs sm:text-sm border-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="affiliation"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Affiliation / Board <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="affiliation"
                  value={schoolData.affiliation}
                  onChange={(e) => setSchoolData({ ...schoolData, affiliation: e.target.value })}
                  placeholder="e.g. CBSE / State Board"
                  className="text-xs sm:text-sm border-slate-200"
                />
              </div>
            </div>

            {/* Official Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label
                  htmlFor="officialEmail"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Official Email <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="officialEmail"
                  type="email"
                  value={schoolData.officialEmail}
                  onChange={(e) => {
                    setSchoolData({ ...schoolData, officialEmail: e.target.value });
                    if (schoolErrors.officialEmail) {
                      setSchoolErrors({ ...schoolErrors, officialEmail: undefined });
                    }
                  }}
                  placeholder="info@institution.edu"
                  className={`text-xs sm:text-sm ${
                    schoolErrors.officialEmail ? 'border-red-500' : 'border-slate-200'
                  }`}
                />
                {schoolErrors.officialEmail && (
                  <p className="text-[11px] text-red-600 font-medium">
                    {schoolErrors.officialEmail}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="schoolPhone"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Phone <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <Input
                  id="schoolPhone"
                  type="tel"
                  value={schoolData.phone}
                  onChange={(e) => setSchoolData({ ...schoolData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="text-xs sm:text-sm border-slate-200"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label
                htmlFor="schoolAddress"
                className="block text-xs font-semibold text-slate-700"
              >
                Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <Input
                id="schoolAddress"
                value={schoolData.address}
                onChange={(e) => setSchoolData({ ...schoolData, address: e.target.value })}
                placeholder="Institutional street address"
                className="text-xs sm:text-sm border-slate-200"
              />
            </div>

            {/* Multi-campus notification note */}
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 flex items-start gap-2">
              <Building2 className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
              <p>
                <strong>Multi-Campus Support:</strong> Campus branches are not required during initial setup. You can add and configure individual branch campuses in Settings after onboarding.
              </p>
            </div>
          </div>
        )}

        {/* ================= STEP 3: SECURITY & TERMS ================= */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Security & Acknowledgement</h3>
              <p className="text-[11px] text-slate-500">
                Confirm institutional governance and access policies.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-semibold text-slate-900">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Institutional Governance Standards</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-600 pl-5 list-disc">
                  <li>Your administrator account holds top-tier authority over school records and user provisioning.</li>
                  <li>Student and guardian privacy is maintained under strict multi-tenant isolation.</li>
                  <li>Password complexity, session timeouts, and MFA policies can be adjusted in School Settings.</li>
                </ul>
              </div>

              {/* Terms Checkbox */}
              <div className="pt-2">
                <label
                  htmlFor="terms-check"
                  className="flex items-start gap-2.5 text-xs text-slate-700 cursor-pointer select-none"
                >
                  <input
                    id="terms-check"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (termsError) setTermsError(null);
                    }}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 accent-slate-900 cursor-pointer"
                  />
                  <span>
                    I agree to the Rivo Terms of Service and Privacy Policy, and confirm that I am authorized to establish this institutional workspace.
                  </span>
                </label>
                {termsError && (
                  <p className="text-[11px] text-red-600 font-medium pt-1">
                    {termsError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 4: REVIEW ================= */}
        {currentStep === 4 && (
          <div className="space-y-4 animate-in fade-in-0 duration-200">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-800">Review & Confirm</h3>
              <p className="text-[11px] text-slate-500">
                Verify your entered information before creating the school workspace.
              </p>
            </div>

            {/* Review Cards (Zero Mock Data) */}
            <div className="space-y-3">
              {/* Administrator Details */}
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-semibold text-slate-900 uppercase tracking-wider text-[10px]">
                    Administrator
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-slate-500 block">Name:</span>
                    <span className="font-medium text-slate-800">
                      {adminData.firstName} {adminData.lastName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email:</span>
                    <span className="font-medium text-slate-800 break-all">
                      {adminData.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Phone:</span>
                    <span className="font-medium text-slate-800">
                      {adminData.phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Role:</span>
                    <span className="font-medium text-slate-800">
                      Primary School Administrator
                    </span>
                  </div>
                </div>
              </div>

              {/* School Details */}
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="font-semibold text-slate-900 uppercase tracking-wider text-[10px]">
                    School Information
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="col-span-2">
                    <span className="text-slate-500 block">Legal Name:</span>
                    <span className="font-medium text-slate-800">
                      {schoolData.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">School Code:</span>
                    <span className="font-medium text-slate-800">
                      {schoolData.code || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Affiliation:</span>
                    <span className="font-medium text-slate-800">
                      {schoolData.affiliation || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Official Email:</span>
                    <span className="font-medium text-slate-800">
                      {schoolData.officialEmail || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Address:</span>
                    <span className="font-medium text-slate-800">
                      {schoolData.address || 'Not provided'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-3 pt-2">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between w-full gap-3">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </Button>
          ) : (
            <Link href="/login">
              <Button
                type="button"
                variant="ghost"
                className="text-xs text-slate-500 hover:text-slate-800 h-9"
              >
                Cancel
              </Button>
            </Link>
          )}

          {currentStep < 4 ? (
            <Button
              type="button"
              onClick={handleNext}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 ml-auto"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-9 ml-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Creating account...
                </>
              ) : (
                'Create School Account'
              )}
            </Button>
          )}
        </div>

        {/* Existing account link */}
        <div className="w-full text-center border-t border-slate-100 pt-3">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
