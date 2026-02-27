'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth';
import { useAccount } from '@/hooks/api/useAccount';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { User, Lock, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import toast from 'react-hot-toast';

export default function AccountPage() {
    const { user, mutate } = useAuth({ middleware: 'auth' });
    const { update } = useAccount();

    // Profile form
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [profileErrors, setProfileErrors] = useState<Record<string, string[]>>({});
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileInitialized, setProfileInitialized] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string[]>>({});
    const [passwordLoading, setPasswordLoading] = useState(false);

    // Initialize profile form once user data loads
    if (user && !profileInitialized) {
        setProfileForm({ name: user.name, email: user.email });
        setProfileInitialized(true);
    }

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileErrors({});
        setProfileLoading(true);
        try {
            await update({ name: profileForm.name, email: profileForm.email });
            await mutate();
            toast.success('Profile updated successfully.');
        } catch (err: unknown) {
            const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (e.response?.data?.errors) {
                setProfileErrors(e.response.data.errors);
            } else {
                toast.error('Failed to update profile.');
            }
        } finally {
            setProfileLoading(false);
        }
    };

    const handlePasswordSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordErrors({});

        if (!passwordForm.current_password) {
            setPasswordErrors({ current_password: ['Current password is required.'] });
            return;
        }
        if (!passwordForm.password) {
            setPasswordErrors({ password: ['New password is required.'] });
            return;
        }
        if (passwordForm.password !== passwordForm.password_confirmation) {
            setPasswordErrors({ password_confirmation: ['Passwords do not match.'] });
            return;
        }

        setPasswordLoading(true);
        try {
            await update({
                name: user?.name ?? '',
                email: user?.email ?? '',
                current_password: passwordForm.current_password,
                password: passwordForm.password,
                password_confirmation: passwordForm.password_confirmation,
            });
            toast.success('Password updated successfully.');
            setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
        } catch (err: unknown) {
            const e = err as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (e.response?.data?.errors) {
                setPasswordErrors(e.response.data.errors);
            } else {
                toast.error('Failed to update password.');
            }
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="p-6 max-w-2xl mx-auto space-y-6"
        >
            {/* Page title */}
            <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Account Settings</h1>
                <p className="text-sm text-[#64748b] mt-1">Manage your profile information and password.</p>
            </div>

            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
                    <div className="bg-indigo-100 rounded-lg p-2">
                        <User className="h-4 w-4 text-[#6366f1]" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#1e293b]">Profile Information</p>
                        <p className="text-xs text-[#64748b]">Update your name and email address.</p>
                    </div>
                </div>

                <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                    <Input
                        label="Full Name"
                        type="text"
                        value={profileForm.name}
                        onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                        error={profileErrors.name?.[0]}
                        placeholder="Your full name"
                        required
                    />
                    <Input
                        label="Email Address"
                        type="email"
                        value={profileForm.email}
                        onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                        error={profileErrors.email?.[0]}
                        placeholder="your@email.com"
                        required
                    />
                    <div className="flex justify-end pt-1">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={profileLoading}
                            size="sm"
                        >
                            <Save className="h-4 w-4 mr-1.5" />
                            Save Profile
                        </Button>
                    </div>
                </form>
            </div>

            {/* Password card */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-[#f1f5f9] bg-[#f8fafc]">
                    <div className="bg-amber-100 rounded-lg p-2">
                        <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-[#1e293b]">Change Password</p>
                        <p className="text-xs text-[#64748b]">Use a strong password of at least 8 characters.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSave} className="p-6 space-y-4">
                    <Input
                        label="Current Password"
                        type="password"
                        value={passwordForm.current_password}
                        onChange={e => setPasswordForm(f => ({ ...f, current_password: e.target.value }))}
                        error={passwordErrors.current_password?.[0]}
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                    />
                    <Input
                        label="New Password"
                        type="password"
                        value={passwordForm.password}
                        onChange={e => setPasswordForm(f => ({ ...f, password: e.target.value }))}
                        error={passwordErrors.password?.[0]}
                        placeholder="At least 8 characters"
                        autoComplete="new-password"
                    />
                    <Input
                        label="Confirm New Password"
                        type="password"
                        value={passwordForm.password_confirmation}
                        onChange={e => setPasswordForm(f => ({ ...f, password_confirmation: e.target.value }))}
                        error={passwordErrors.password_confirmation?.[0]}
                        placeholder="Re-enter new password"
                        autoComplete="new-password"
                    />
                    <div className="flex justify-end pt-1">
                        <Button
                            type="submit"
                            variant="primary"
                            loading={passwordLoading}
                            size="sm"
                        >
                            <Lock className="h-4 w-4 mr-1.5" />
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
