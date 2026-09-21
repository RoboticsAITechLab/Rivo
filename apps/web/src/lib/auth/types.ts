export type AuthState =
  | 'UNKNOWN'
  | 'AUTHENTICATING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'ERROR';

export type UserRoleType =
  | 'OWNER'
  | 'ADMIN'
  | 'SCHOOL_ADMIN'
  | 'TEACHER'
  | 'STUDENT'
  | 'PARENT';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleType: UserRoleType;
  initials: string;
  schoolId?: string;
  schoolName?: string;
  schoolSlug?: string;
  campusId?: string;
  avatarUrl?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AdminSignupPayload {
  administrator: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    password: string;
    avatarUrl?: string;
  };
  school: {
    name: string;
    code?: string;
    affiliation?: string;
    officialEmail?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pinCode?: string;
  };
  agreedToTerms: boolean;
}

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_LOCKED'
  | 'EMAIL_EXISTS'
  | 'NETWORK_ERROR'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN_ERROR';

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
  errorCode?: AuthErrorCode;
  requiresEmailVerification?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?: 'NETWORK_ERROR' | 'SERVICE_UNAVAILABLE' | 'UNKNOWN_ERROR';
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message?: string;
  error?: string;
  errorCode?:
    | 'INVALID_TOKEN'
    | 'PASSWORD_TOO_WEAK'
    | 'NETWORK_ERROR'
    | 'SERVICE_UNAVAILABLE'
    | 'UNKNOWN_ERROR';
}

export interface IAuthService {
  login(credentials: LoginCredentials): Promise<AuthResult>;
  signup(payload: AdminSignupPayload): Promise<AuthResult>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
  refreshSession(): Promise<AuthUser | null>;
  forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResult>;
  resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResult>;
}
