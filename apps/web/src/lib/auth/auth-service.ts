import {
  AdminSignupPayload,
  AuthResult,
  AuthUser,
  ForgotPasswordPayload,
  ForgotPasswordResult,
  IAuthService,
  LoginCredentials,
  ResetPasswordPayload,
  ResetPasswordResult,
} from './types';

/**
 * Production-ready Authentication Service / API Adapter.
 * Connects the web client to backend authentication endpoints.
 * Strictly adheres to the zero-mock-data rule: never fakes success when backend is unavailable.
 */
export class AuthService implements IAuthService {
  private readonly apiBaseUrl: string;

  constructor(apiBaseUrl = '/api/auth') {
    this.apiBaseUrl = apiBaseUrl;
  }

  public async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: credentials.email.trim(),
          password: credentials.password,
          rememberMe: !!credentials.rememberMe,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          return {
            success: false,
            error: 'Invalid email or password.',
            errorCode: 'INVALID_CREDENTIALS',
          };
        }

        if (response.status === 423) {
          return {
            success: false,
            error:
              'Account is temporarily locked due to consecutive failed attempts. Try again in 15 minutes or contact your administrator.',
            errorCode: 'ACCOUNT_LOCKED',
          };
        }

        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return {
            success: false,
            error: 'Authentication service is currently unavailable.',
            errorCode: 'SERVICE_UNAVAILABLE',
          };
        }

        let errorMessage = 'Something went wrong. Please try again.';
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Fallback to default message
        }

        return {
          success: false,
          error: errorMessage,
          errorCode: 'UNKNOWN_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
        requiresEmailVerification: !!data.requiresEmailVerification,
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  public async signup(payload: AdminSignupPayload): Promise<AuthResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/signup/admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 409) {
          return {
            success: false,
            error: 'This email is already registered.',
            errorCode: 'EMAIL_EXISTS',
          };
        }

        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return {
            success: false,
            error: 'Account creation service is currently unavailable.',
            errorCode: 'SERVICE_UNAVAILABLE',
          };
        }

        let errorMessage = 'Please correct the highlighted fields.';
        try {
          const errorData = await response.json();
          if (errorData?.message) {
            errorMessage = errorData.message;
          }
        } catch {
          // Fallback
        }

        return {
          success: false,
          error: errorMessage,
          errorCode: 'UNKNOWN_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
        requiresEmailVerification: !!data.requiresEmailVerification,
      };
    } catch {
      return {
        success: false,
        error: 'Unable to create your account. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  public async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  public async refreshSession(): Promise<AuthUser | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data?.user || null;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // Best-effort logout notification
    }
  }

  public async logoutAll(): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/logout-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch {
      // Best-effort logout-all notification
    }
  }

  public async forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: payload.email.trim(),
        }),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return {
            success: false,
            error: 'Account recovery service is currently unavailable.',
            errorCode: 'SERVICE_UNAVAILABLE',
          };
        }

        return {
          success: false,
          error: 'Something went wrong. Please try again.',
          errorCode: 'UNKNOWN_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        message:
          data?.message ||
          "If an account exists with this email address, we've sent password reset instructions.",
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }

  public async resetPassword(payload: ResetPasswordPayload): Promise<ResetPasswordResult> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token: payload.token,
          newPassword: payload.newPassword,
        }),
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 422) {
          return {
            success: false,
            error: 'Reset link is invalid or expired.',
            errorCode: 'INVALID_TOKEN',
          };
        }

        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return {
            success: false,
            error: 'Password reset service is currently unavailable.',
            errorCode: 'SERVICE_UNAVAILABLE',
          };
        }

        return {
          success: false,
          error: 'Something went wrong. Please try again.',
          errorCode: 'UNKNOWN_ERROR',
        };
      }

      const data = await response.json();
      return {
        success: true,
        message: data?.message || 'Your password has been reset successfully.',
      };
    } catch {
      return {
        success: false,
        error: 'Unable to connect. Please try again.',
        errorCode: 'NETWORK_ERROR',
      };
    }
  }
}

export const authService = new AuthService();
