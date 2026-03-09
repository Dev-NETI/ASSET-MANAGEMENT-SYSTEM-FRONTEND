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
import { motion, AnimatePresence } from "framer-motion";
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
    .map((g) => ({ ...g, items: g.items.filter((i) => canAccess(i.permission)) }))
    .filter((g) => g.items.length > 0);

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="flex flex-col bg-sidebar shrink-0 overflow-hidden relative"
      style={{ minWidth: collapsed ? 64 : 256 }}
    >
      {/* Subtle radial glow */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(212,168,83,0.07)_0%,transparent_70%)] pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/8 relative">
        <div className="shrink-0 bg-linear-to-br from-gold to-amber-400 rounded-lg p-1.5 shadow-sm shadow-yellow-600/30">
          <Archive className="h-5 w-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="font-bold text-sm leading-tight text-white"
            >
              Inventory
              <br />
              <span className="text-sidebar-text text-xs font-normal">Management System</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              collapsed ? (
                <div className="mx-3 my-2 h-px bg-white/10" />
              ) : (
                <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                  <div className="h-px flex-1 bg-white/8" />
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold/55 select-none whitespace-nowrap">
                    {group.label}
                  </p>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
              )
            )}

            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <motion.div
                  key={href}
                  whileHover={{ x: collapsed ? 0 : 2 }}
                  transition={{ duration: 0.12 }}
                >
                  <Link
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "relative flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all duration-150",
                      active
                        ? "bg-white/8 text-gold font-semibold"
                        : "text-sidebar-text hover:bg-white/6 hover:text-white",
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-gold rounded-r-full"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className={cn("h-4 w-4 shrink-0", active && "text-gold")} />
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.12 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User mini row + collapse */}
      <div className="border-t border-white/8">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5 px-4 py-3"
            >
              <div className="h-7 w-7 rounded-full bg-linear-to-br from-gold to-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-[10px] font-bold text-white">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name ?? "User"}</p>
                <p className="text-[10px] text-sidebar-text truncate capitalize">
                  {user?.user_type?.replace("_", " ") ?? "Employee"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full p-2.5 text-sidebar-text hover:text-gold hover:bg-white/6 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </motion.aside>
  );
}
