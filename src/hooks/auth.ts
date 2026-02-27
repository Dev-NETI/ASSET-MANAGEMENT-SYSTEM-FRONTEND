'use client';

import useSWR from 'swr';
import axios from '@/lib/axios';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AuthUser {
    id: number;
    name: string;
    email: string;
    user_type: 'system_administrator' | 'employee';
    department_id: number | null;
    permissions: string[] | null;
}

interface LoginProps {
    email: string;
    password: string;
    setErrors: (errors: Record<string, string[]>) => void;
    setStatus: (status: string | null) => void;
}

interface VerifyCodeProps {
    code: string;
    setErrors: (errors: Record<string, string[]>) => void;
    setStatus: (status: string | null) => void;
}

interface UseAuthOptions {
    middleware?: 'auth' | 'guest';
    redirectIfAuthenticated?: string;
}

export const useAuth = ({ middleware, redirectIfAuthenticated }: UseAuthOptions = {}) => {
    const router = useRouter();

    // `initialized` becomes true after the first client-side render (useEffect has run)
    const [initialized, setInitialized] = useState(false);
    const [hasToken, setHasToken] = useState(false);

    useEffect(() => {
        const token = !!localStorage.getItem('auth_token');
        setHasToken(token);
        setInitialized(true);
    }, []);

    const {
        data: user,
        error,
        mutate,
        isLoading: swrLoading,
    } = useSWR<AuthUser>(
        hasToken ? '/api/user' : null,
        // GET /api/user returns the raw user object (not wrapped in ApiResponse)
        () => axios.get('/api/user').then(res => res.data),
        { shouldRetryOnError: false }
    );

    // True while waiting for initialization OR while SWR is actively fetching
    const isLoading = !initialized || (hasToken && swrLoading);

    const login = async ({ setErrors, setStatus, ...props }: LoginProps) => {
        setErrors({});
        setStatus(null);
        try {
            const res = await axios.post('/api/login', props);

            // 2FA step: credentials verified, verification code sent to email
            if (res.data?.requires_verification) {
                sessionStorage.setItem('pending_user_id', String(res.data.user_id));
                router.push('/verify-code');
                return;
            }

            // Fallback direct token path
            const token: string | undefined =
                res.data?.access_token ??
                res.data?.data?.access_token ??
                res.data?.data?.token ??
                res.data?.token;
            if (token) {
                localStorage.setItem('auth_token', token);
                setHasToken(true);
            }
            await mutate();
            router.push('/');
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
            if (e.response?.status === 422) {
                setErrors(e.response.data?.errors ?? {});
            } else if (e.response?.status === 401) {
                setStatus('These credentials do not match our records.');
            } else {
                throw err;
            }
        }
    };

    const verifyCode = async ({ code, setErrors, setStatus }: VerifyCodeProps) => {
        const pendingUserId = sessionStorage.getItem('pending_user_id');
        if (!pendingUserId) {
            router.push('/login');
            return;
        }

        setErrors({});
        setStatus(null);

        try {
            const res = await axios.post('/api/verify-code', {
                user_id: parseInt(pendingUserId, 10),
                code,
            });

            const token: string | undefined = res.data?.access_token;
            if (token) {
                sessionStorage.removeItem('pending_user_id');
                localStorage.setItem('auth_token', token);
                setHasToken(true);
            }
            await mutate();
            router.push('/');
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } };
            if (e.response?.status === 422) {
                setErrors(e.response.data?.errors ?? {});
            } else {
                setStatus('Verification failed. Please try again.');
            }
        }
    };

    const resendCode = async (userId: number): Promise<{ success: boolean; message: string }> => {
        try {
            const res = await axios.post('/api/resend-verification', { user_id: userId });
            return { success: true, message: res.data?.message ?? 'Code sent.' };
        } catch (err: unknown) {
            const e = err as { response?: { status?: number; data?: { message?: string } } };
            const msg = e.response?.data?.message ?? 'Failed to resend code.';
            return { success: false, message: msg };
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
        } catch (_) {
            // ignore network errors on logout
        } finally {
            localStorage.removeItem('auth_token');
            sessionStorage.removeItem('pending_user_id');
            setHasToken(false);
            setInitialized(true); // stay initialized
            await mutate(undefined, false);
            router.push('/login');
        }
    };

    useEffect(() => {
        if (!initialized) return;
        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            router.push(redirectIfAuthenticated);
        }
        // Auth middleware: redirect to login if we're done loading and still have no user
        if (middleware === 'auth' && !swrLoading) {
            if (error || (!user && !hasToken)) {
                logout();
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, error, initialized, hasToken, swrLoading]);

    return { user, error, isLoading, login, verifyCode, resendCode, logout, mutate };
};
