'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Building2,
    Tag,
    Ruler,
    Truck,
    Package,
    Users,
    Monitor,
    ClipboardList,
    Archive,
    ArrowDownToLine,
    ArrowUpFromLine,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
    { href: '/',                    label: 'Dashboard',          icon: LayoutDashboard },
    { href: '/departments',         label: 'Departments',        icon: Building2 },
    { href: '/categories',          label: 'Categories',         icon: Tag },
    { href: '/units',               label: 'Units',              icon: Ruler },
    { href: '/suppliers',           label: 'Suppliers',          icon: Truck },
    { href: '/items',               label: 'Items',              icon: Package },
    { href: '/employees',           label: 'Employees',          icon: Users },
    { href: '/item-assets',         label: 'Fixed Assets',       icon: Monitor },
    { href: '/asset-assignments',   label: 'Assignments',        icon: ClipboardList },
    { href: '/inventory-stocks',    label: 'Stock Levels',       icon: Archive },
    { href: '/stock-receivals',     label: 'Stock Receivals',    icon: ArrowDownToLine },
    { href: '/stock-issuances',     label: 'Stock Issuances',    icon: ArrowUpFromLine },
];

export default function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    return (
        <motion.aside
            animate={{ width: collapsed ? 64 : 256 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col bg-[#9bc6ef] flex-shrink-0 overflow-hidden"
            style={{ minWidth: collapsed ? 64 : 256 }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-[#78aede]/50">
                <div className="flex-shrink-0 bg-[#cdac6a] rounded-lg p-1.5">
                    <Archive className="h-5 w-5 text-white" />
                </div>
                {!collapsed && (
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="font-bold text-sm leading-tight text-[#070505]"
                    >
                        Inventory<br />
                        <span className="text-[#070505]/60 text-xs font-normal">Management System</span>
                    </motion.span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 overflow-y-auto">
                {navItems.map(({ href, label, icon: Icon }) => {
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
                                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors',
                                    active
                                        ? 'bg-[#cdac6a] text-[#070505] font-semibold shadow-sm'
                                        : 'text-[#070505]/75 hover:bg-[#78aede]/50 hover:text-[#070505]'
                                )}
                            >
                                <Icon className="h-5 w-5 flex-shrink-0" />
                                {!collapsed && <span>{label}</span>}
                            </Link>
                        </motion.div>
                    );
                })}
            </nav>

            {/* Collapse toggle */}
            <button
                onClick={() => setCollapsed(c => !c)}
                className="flex items-center justify-center p-3 border-t border-[#78aede]/50 text-[#070505]/60 hover:text-[#070505] hover:bg-[#78aede]/30 transition-colors"
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
        </motion.aside>
    );
}
