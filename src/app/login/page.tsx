'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, scaleIn } from '@/lib/motion';

export default function LoginPage() {
    const { login } = useAuth({ middleware: 'guest', redirectIfAuthenticated: '/' });

    const [form, setForm] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [status, setStatus] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login({ setErrors, setStatus, ...form });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#9bc6ef] via-[#78aede] to-[#cdac6a] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <motion.div
                    className="flex flex-col items-center mb-8"
                    variants={fadeUp}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="bg-[#cdac6a] rounded-2xl p-4 mb-4 shadow-lg">
                        <Archive className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Inventory System</h1>
                    <p className="text-white/70 text-sm mt-1">Sign in to your account</p>
                </motion.div>

                {/* Card */}
                <motion.div
                    className="bg-[#fafaf5] rounded-2xl shadow-2xl p-8"
                    variants={scaleIn}
                    initial="hidden"
                    animate="visible"
                >
                    {status && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                            {status}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email Address"
                            type="email"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            error={errors.email?.[0]}
                            placeholder="admin@inventory.com"
                            required
                            autoComplete="email"
                        />
                        <Input
                            label="Password"
                            type="password"
                            value={form.password}
                            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                            error={errors.password?.[0]}
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                        <Button
                            type="submit"
                            variant="gold"
                            className="w-full"
                            loading={loading}
                            size="lg"
                        >
                            Sign In
                        </Button>
                    </form>
                </motion.div>

                <p className="text-center text-xs text-white/60 mt-6">
                    Inventory Management System &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
