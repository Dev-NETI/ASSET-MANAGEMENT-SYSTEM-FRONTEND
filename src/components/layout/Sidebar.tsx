"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  Tag,
  Ruler,
  Truck,
  Package,
  Users,
  UserCog,
  Monitor,
  ClipboardList,
  Archive,
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/auth";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [{ href: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Administration",
    items: [
      {
        href: "/departments",
        label: "Departments",
        icon: Building2,
        permission: "departments",
      },
      { href: "/units", label: "Units", icon: Ruler, permission: "units" },
      {
        href: "/employees",
        label: "Employees",
        icon: Users,
        permission: "employees",
      },
      {
        href: "/users",
        label: "User Accounts",
        icon: UserCog,
        permission: "users",
      },
    ],
  },
  {
    label: "Catalog",
    items: [
      {
        href: "/categories",
        label: "Categories",
        icon: Tag,
        permission: "categories",
      },
      {
        href: "/suppliers",
        label: "Suppliers",
        icon: Truck,
        permission: "suppliers",
      },
      { href: "/items", label: "Items", icon: Package, permission: "items" },
    ],
  },
  {
    label: "Fixed Assets",
    items: [
      {
        href: "/item-assets",
        label: "Assets",
        icon: Monitor,
        permission: "item-assets",
      },
      {
        href: "/asset-assignments",
        label: "Assignments",
        icon: ClipboardList,
        permission: "asset-assignments",
      },
    ],
  },
  {
    label: "Consumable Stock",
    items: [
      {
        href: "/inventory-stocks",
        label: "Stock Levels",
        icon: Archive,
        permission: "inventory-stocks",
      },
      {
        href: "/stock-receivals",
        label: "Stock Receivals",
        icon: ArrowDownToLine,
        permission: "stock-receivals",
      },
      {
        href: "/stock-issuances",
        label: "Stock Issuances",
        icon: ArrowUpFromLine,
        permission: "stock-issuances",
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.user_type === "system_administrator";

  const canAccess = (permission?: string): boolean => {
    if (!permission) return true;
    if (isAdmin) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  const visibleGroups = navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => canAccess(i.permission)),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="flex flex-col bg-[#1a1f36] flex-shrink-0 overflow-hidden"
      style={{ minWidth: collapsed ? 64 : 256 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 bg-gradient-to-br from-[#6366f1] to-violet-600 rounded-lg p-1.5 shadow-sm shadow-indigo-500/40">
          <Archive className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="font-bold text-sm leading-tight text-white"
          >
            Inventory
            <br />
            <span className="text-[#c8d3f5]/60 text-xs font-normal">
              Management System
            </span>
          </motion.span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleGroups.map((group, gi) => (
          <div key={gi}>
            {/* Group separator line when collapsed (skip first group) */}
            {group.label && collapsed && gi > 0 && (
              <div className="mx-3 my-2 h-px bg-white/10" />
            )}

            {/* Group label when expanded */}
            {group.label && !collapsed && (
              <p className="px-4 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#c8d3f5]/40 select-none">
                {group.label}
              </p>
            )}

            {/* Nav items */}
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <motion.div
                  key={href}
                  whileHover={{ x: collapsed ? 0 : 3 }}
                  transition={{ duration: 0.15 }}
                >
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors",
                      active
                        ? "bg-[#6366f1] text-white font-semibold shadow-lg shadow-indigo-500/25"
                        : "text-[#c8d3f5]/75 hover:bg-indigo-500/15 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center justify-center p-3 border-t border-white/10 text-[#c8d3f5]/50 hover:text-white hover:bg-indigo-500/15 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </motion.aside>
  );
}
