'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth';
import Button from '@/components/ui/Button';
import { Mail, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, scaleIn } from '@/lib/motion';
import Image from 'next/image';
import toast from 'react-hot-toast';

const DIGIT_COUNT = 6;
const COOLDOWN_MAX = 60;

export default function VerifyCodePage() {
    const router = useRouter();
    const { verifyCode, resendCode } = useAuth();

    const [digits, setDigits] = useState<string[]>(Array(DIGIT_COUNT).fill(''));
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(COOLDOWN_MAX);
    const [pendingUserId, setPendingUserId] = useState<number | null>(null);

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        const id = sessionStorage.getItem('pending_user_id');
        if (!id) {
            router.replace('/login');
            return;
        }
        setPendingUserId(parseInt(id, 10));
        inputRefs.current[0]?.focus();
    }, [router]);

    // Countdown timer for resend cooldown
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleDigitChange = (index: number, value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (!cleaned && value !== '') return;

        // Handle paste of full code
        if (cleaned.length > 1) {
            const newDigits = Array(DIGIT_COUNT).fill('');
            cleaned.slice(0, DIGIT_COUNT).split('').forEach((ch, i) => {
                newDigits[i] = ch;
            });
            setDigits(newDigits);
            const focusIdx = Math.min(cleaned.length, DIGIT_COUNT - 1);
            inputRefs.current[focusIdx]?.focus();
            if (cleaned.length >= DIGIT_COUNT) {
                submitCode(newDigits.join(''));
            }
            return;
        }

        const newDigits = [...digits];
        newDigits[index] = cleaned;
        setDigits(newDigits);
        setErrors({});
        setStatus(null);

        if (cleaned && index < DIGIT_COUNT - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        if (cleaned && index === DIGIT_COUNT - 1) {
            const code = [...newDigits.slice(0, DIGIT_COUNT - 1), cleaned].join('');
            if (code.length === DIGIT_COUNT && !code.includes('')) {
                submitCode(code);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < DIGIT_COUNT - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const submitCode = async (code: string) => {
        if (loading) return;
        setLoading(true);
        try {
            await verifyCode({ code, setErrors, setStatus });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const code = digits.join('');
        if (code.length < DIGIT_COUNT) {
            setErrors({ code: ['Please enter all 6 digits.'] });
            return;
        }
        submitCode(code);
    };

    const handleResend = async () => {
        if (!pendingUserId || resending || cooldown > 0) return;
        setResending(true);
        const result = await resendCode(pendingUserId);
        setResending(false);
        if (result.success) {
            setCooldown(COOLDOWN_MAX);
            setDigits(Array(DIGIT_COUNT).fill(''));
            setErrors({});
            setStatus(null);
            inputRefs.current[0]?.focus();
            toast.success(result.message);
        } else {
            toast.error(result.message);
        }
    };

    const codeError = errors.code?.[0];
    const cooldownPct = (cooldown / COOLDOWN_MAX) * 100;

    return (
        <div className="min-h-screen flex">
            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f36] flex-col items-center justify-center p-12 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: 'linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)',
                        backgroundSize: '48px 48px',
                    }}
                />
                <div className="absolute top-24 left-16 h-64 w-64 bg-indigo-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-24 right-16 h-64 w-64 bg-violet-500/20 rounded-full blur-3xl" />

                <motion.div
                    className="relative z-10 flex flex-col items-center text-center"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-8 py-5 mb-6 shadow-xl">
                        <Image
                            src="/assets/NETI.png"
                            alt="NETI Logo"
                            width={160}
                            height={64}
                            className="h-14 w-auto object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">Inventory</h1>
                    <p className="text-sidebar-text text-lg font-light mb-10">Management System</p>

                    <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-6 max-w-xs">
                        <div className="bg-indigo-500/20 rounded-xl p-3 w-fit mx-auto mb-4">
                            <Mail className="h-6 w-6 text-[#a5b4fc]" />
                        </div>
                        <p className="text-sidebar-text text-sm leading-relaxed">
                            A 6-digit verification code has been sent to your email address. Enter the code to complete your sign-in.
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc] p-6">
                {/* Mobile logo */}
                <div className="lg:hidden flex flex-col items-center mb-8">
                    <div className="bg-white rounded-2xl px-6 py-4 mb-3 shadow-md border border-border">
                        <Image
                            src="/assets/NETI.png"
                            alt="NETI Logo"
                            width={120}
                            height={48}
                            className="h-10 w-auto object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-2xl font-bold text-[#1e293b]">Inventory System</h1>
                </div>

                <motion.div
                    className="w-full max-w-sm"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-8">
                        {/* Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                                <Mail className="h-8 w-8 text-[#6366f1]" />
                            </div>
                        </div>

                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-[#1e293b]">Check your email</h2>
                            <p className="text-sm text-[#64748b] mt-1">Enter the 6-digit code we sent you</p>
                        </div>

                        {status && (
                            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 text-center">
                                {status}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* OTP digit inputs */}
                            <div className="flex gap-2 justify-center mb-2">
                                {digits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={el => { inputRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={digit}
                                        onChange={e => handleDigitChange(index, e.target.value)}
                                        onKeyDown={e => handleKeyDown(index, e)}
                                        disabled={loading}
                                        className={[
                                            'text-center text-xl font-bold rounded-xl border-2 transition-all',
                                            'focus:outline-none focus:ring-2',
                                            'disabled:opacity-50 disabled:cursor-not-allowed',
                                            codeError
                                                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200 focus:border-red-500'
                                                : 'border-[#e2e8f0] text-[#1e293b] focus:ring-indigo-200 focus:border-[#6366f1] bg-white',
                                        ].join(' ')}
                                        style={{ width: '44px', height: '52px' }}
                                    />
                                ))}
                            </div>

                            {codeError && (
                                <p className="text-xs text-red-600 text-center mb-3">{codeError}</p>
                            )}

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full mt-4"
                                loading={loading}
                                size="lg"
                            >
                                Verify Code
                            </Button>
                        </form>

                        {/* Resend + progress bar + back */}
                        <div className="mt-5 flex flex-col gap-3">
                            {/* Resend button */}
                            <button
                                type="button"
                                onClick={handleResend}
                                disabled={resending || cooldown > 0}
                                className="flex items-center justify-center gap-1.5 text-sm text-[#6366f1] hover:text-indigo-800 disabled:text-[#94a3b8] disabled:cursor-not-allowed transition-colors mx-auto"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
                                {resending ? 'Sending...' : 'Resend code'}
                            </button>

                            {/* Reverse progress bar — visible during cooldown */}
                            {cooldown > 0 && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] text-[#94a3b8]">
                                        <span>Resend available in</span>
                                        <span className="font-medium tabular-nums">{cooldown}s</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#e2e8f0] rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#6366f1] rounded-full transition-[width] duration-1000 ease-linear"
                                            style={{ width: `${cooldownPct}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => {
                                    sessionStorage.removeItem('pending_user_id');
                                    router.push('/login');
                                }}
                                className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors text-center"
                            >
                                Back to login
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-xs text-[#94a3b8] mt-4">
                        Inventory Management System &copy; {new Date().getFullYear()}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
