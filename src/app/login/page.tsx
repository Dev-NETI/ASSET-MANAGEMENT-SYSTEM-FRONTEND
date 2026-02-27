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
      {/* Left panel — dark indigo brand side */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1a1f36] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(90deg, #6366f1 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Decorative blobs */}
        <div className="absolute top-24 left-16 h-64 w-64 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-24 right-16 h-64 w-64 bg-violet-500/20 rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
        >
          {/* NETI logo on a frosted white container */}
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
          <h1 className="text-4xl font-bold text-white mb-2">Asset</h1>
          <p className="text-sidebar-text text-lg font-light mb-10">
            Management System
          </p>

          <div className="flex flex-col gap-4 w-full max-w-xs">
            {[
              { icon: LayoutDashboard, text: "Real-time dashboard insights" },
              {
                icon: Package,
                text: "Department-scoped inventory tracking",
              },
              { icon: Users, text: "Role-based access control" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10"
              >
                <div className="bg-indigo-500/20 rounded-lg p-1.5">
                  <Icon className="h-4 w-4 text-[#a5b4fc]" />
                </div>
                <span className="text-sm text-[#c8d3f5]">{text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right panel — login form */}
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
          <h1 className="text-2xl font-bold text-[#1e293b]">
            Inventory System
          </h1>
        </div>

        <motion.div
          className="w-full max-w-sm"
          variants={scaleIn}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-[#e2e8f0] p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#1e293b]">
                Welcome back
              </h2>
              <p className="text-sm text-[#64748b] mt-1">
                Sign in to your account to continue
              </p>
            </div>

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
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                error={errors.email?.[0]}
                placeholder="admin@inventory.com"
                required
                autoComplete="email"
              />
              <Input
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                error={errors.password?.[0]}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={loading}
                size="lg"
              >
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-[#94a3b8] mt-4">
            Inventory Management System &copy; {new Date().getFullYear()}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
