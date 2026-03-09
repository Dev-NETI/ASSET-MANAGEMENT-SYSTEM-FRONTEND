"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/auth";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { LayoutDashboard, Package, Users } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp, scaleIn } from "@/lib/motion";
import Image from "next/image";

export default function LoginPage() {
  const { login } = useAuth({
    middleware: "guest",
    redirectIfAuthenticated: "/",
  });

  const [form, setForm] = useState({ email: "", password: "" });
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
    <div className="min-h-screen flex">
      {/* Left panel — deep navy executive brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#d4a853 1px, transparent 1px), linear-gradient(90deg, #d4a853 1px, transparent 1px)",
            backgroundSize: "52px 52px",
          }}
        />
        {/* Gold ambient glows */}
        <div className="absolute top-20 left-12 h-72 w-72 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-12 h-72 w-72 bg-amber-400/8 rounded-full blur-3xl" />
        {/* Animated floating orbs */}
        <motion.div
          className="absolute top-1/3 right-16 h-3 w-3 rounded-full bg-gold/40"
          animate={{ y: [-8, 8, -8] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/3 left-20 h-2 w-2 rounded-full bg-gold/30"
          animate={{ y: [6, -6, 6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/4 h-1.5 w-1.5 rounded-full bg-gold/25"
          animate={{ y: [-5, 5, -5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          {/* NETI logo — gold-bordered frosted panel */}
          <div className="bg-white/8 backdrop-blur-sm border border-gold/30 rounded-2xl px-8 py-5 mb-6 shadow-xl shadow-black/20">
            <Image
              src="/assets/NETI.png"
              alt="NETI Logo"
              width={160}
              height={64}
              className="h-14 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-1 tracking-tight">Asset</h1>
          <p className="text-gold/80 text-lg font-light mb-10 tracking-wide">Management System</p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            {[
              { icon: LayoutDashboard, text: "Real-time dashboard insights" },
              { icon: Package,         text: "Department-scoped inventory tracking" },
              { icon: Users,           text: "Role-based access control" },
            ].map(({ icon: Icon, text }, i) => (
              <motion.div
                key={text}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/8"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.35 }}
              >
                <div className="bg-gold/15 rounded-lg p-1.5 shrink-0">
                  <Icon className="h-4 w-4 text-gold" />
                </div>
                <span className="text-sm text-sidebar-text text-left">{text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center bg-surface p-6">
        {/* Mobile logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="bg-white rounded-2xl px-6 py-4 mb-3 shadow-md border border-border border-t-4 border-t-gold">
            <Image
              src="/assets/NETI.png"
              alt="NETI Logo"
              width={120}
              height={48}
              className="h-10 w-auto object-contain"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-ink">Inventory System</h1>
        </div>

        <motion.div
          className="w-full max-w-sm"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          {/* Card with gold top accent */}
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/80 border border-border border-t-4 border-t-gold p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-ink tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted mt-1">Sign in to your account to continue</p>
            </div>

            {status && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700"
              >
                {status}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                error={errors.email?.[0]}
                placeholder="admin@inventory.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
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
          </div>

          <p className="text-center text-xs text-sidebar-text mt-4">
            Inventory Management System &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
