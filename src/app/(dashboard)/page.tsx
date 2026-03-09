'use client';

import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import StatCard from '@/components/shared/StatCard';
import Spinner from '@/components/ui/Spinner';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useItems } from '@/hooks/api/useItems';
import { useEmployees } from '@/hooks/api/useEmployees';
import { useItemAssets } from '@/hooks/api/useItemAssets';
import { useInventoryStocks } from '@/hooks/api/useInventoryStocks';
import { useAssetAssignments } from '@/hooks/api/useAssetAssignments';
import { useAuth } from '@/hooks/auth';
import {
    Building2, Package, Users, Monitor,
    AlertTriangle, ClipboardList, PackageX, ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface RawDept { id: number; name: string; }

interface RawAsset {
    id: number;
    item_code: string;
    department_id: number | null;
    department?: RawDept | null;
    status: string;
    item?: {
        id: number;
        name: string;
        category?: { id: number; name: string } | null;
    };
}

interface RawAssignment {
    id: number;
    status: string;
    asset?: { id: number; item_code: string; item?: { name: string } };
    assignable_label?: string | null;
    assignable?: {
        id: number;
        name?: string;
        full_name?: string;
        first_name?: string;
        last_name?: string;
    } | null;
}

interface RawStock {
    id: number;
    department_id: number;
    quantity: number;
    is_below_minimum?: boolean;
    item?: { id: number; name: string; unit?: { abbreviation: string } };
    department?: RawDept;
}

interface DetailRow { label: string; value: string | number; }

/* ─── DetailCard ─────────────────────────────────────────────────────── */
interface DetailCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    gradient: string;
    headerBg: string;
    sub?: string;
    index: number;
    detailTitle: string;
    computeDetails: (deptId?: number) => DetailRow[];
    isAdmin: boolean;
    departments: RawDept[];
    emptyText?: string;
    valueLabel?: string; // column header for the right-hand value
}

function DetailCard({
    label, value, icon, gradient, headerBg, sub, index,
    detailTitle, computeDetails, isAdmin, departments,
    emptyText = 'No data available', valueLabel = 'Count',
}: DetailCardProps) {
    const [open, setOpen]           = useState(false);
    const [deptFilter, setDeptFilter] = useState<number | ''>('');
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const details = computeDetails(deptFilter !== '' ? Number(deptFilter) : undefined);

    return (
        <div ref={ref} className="relative">
            {/* Stat card */}
            <motion.div
                className="bg-white rounded-2xl border border-border p-5 flex items-center gap-4 shadow-sm overflow-hidden cursor-pointer select-none"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={index}
                onClick={() => setOpen(v => !v)}
                whileHover={{
                    y: -4,
                    boxShadow: '0 16px 32px rgba(10,22,40,0.14)',
                    transition: { type: 'spring', stiffness: 300, damping: 18 },
                }}
            >
                {/* Corner dots */}
                <div className="absolute top-3 right-3 grid grid-cols-3 gap-0.5 opacity-[0.07]">
                    {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="h-1 w-1 rounded-full bg-sidebar" />
                    ))}
                </div>
                <div className={`rounded-xl p-3 bg-linear-to-br ${gradient} text-white shrink-0 shadow-sm`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</p>
                    <p className="text-3xl font-bold text-ink leading-tight">{value}</p>
                    {sub && <p className="text-xs text-sidebar-text mt-0.5 truncate">{sub}</p>}
                </div>
            </motion.div>

            {/* Detail modal */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                        className="absolute top-full mt-2 left-0 z-100 bg-white rounded-xl border border-border shadow-2xl shadow-slate-900/15 overflow-hidden"
                        style={{ minWidth: '260px', width: 'max-content', maxWidth: '340px' }}
                    >
                        {/* Header */}
                        <div className={`px-3 py-2.5 ${headerBg} flex items-center justify-between`}>
                            <p className="text-[11px] font-bold text-white uppercase tracking-widest">{detailTitle}</p>
                            <span className="text-[10px] text-white/60 font-mono tabular-nums ml-3 shrink-0">
                                {details.length} item{details.length !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {/* Admin dept filter */}
                        {isAdmin && departments.length > 0 && (
                            <div className="px-2 pt-2 pb-0">
                                <div className="relative">
                                    <select
                                        value={deptFilter}
                                        onChange={e => setDeptFilter(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full text-xs text-ink bg-surface border border-border rounded-lg pl-2.5 pr-7 py-1.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                                    >
                                        <option value="">All Departments</option>
                                        {departments.map(d => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {/* Column headers */}
                        {details.length > 0 && (
                            <div className="flex items-center justify-between px-4 pt-2 pb-1">
                                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider">Item</span>
                                <span className="text-[10px] font-semibold text-muted uppercase tracking-wider shrink-0">{valueLabel}</span>
                            </div>
                        )}

                        {/* Rows */}
                        {details.length > 0 ? (
                            <div className="px-1.5 pb-1.5 max-h-56 overflow-y-auto">
                                {details.map((d, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-surface transition-colors gap-3"
                                    >
                                        <span className="text-xs text-ink truncate">{d.label}</span>
                                        <span className="text-xs font-semibold text-ink shrink-0 tabular-nums">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-muted text-center py-5 px-3">{emptyText}</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Dashboard page ─────────────────────────────────────────────────── */
export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.user_type === 'system_administrator';

    const departments   = useDepartments();
    const items         = useItems();
    const employees     = useEmployees();
    const itemAssets    = useItemAssets();
    const stocks        = useInventoryStocks();
    const assignments   = useAssetAssignments();

    const { data: deptData,   isLoading: l1 } = useSWR('dashboard-dept',        () => departments.index());
    const { data: itemData,   isLoading: l2 } = useSWR('dashboard-items',       () => items.index());
    const { data: empData,    isLoading: l3 } = useSWR('dashboard-emp',         () => employees.index());
    const { data: assetData,  isLoading: l4 } = useSWR('dashboard-assets',      () => itemAssets.index());
    const { data: stockData,  isLoading: l5 } = useSWR('dashboard-stocks',      () => stocks.index());
    const { data: assignData, isLoading: l6 } = useSWR('dashboard-assignments', () => assignments.index());

    const loading = l1 || l2 || l3 || l4 || l5 || l6;

    const deptList        = (deptData   as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const itemList        = (itemData   as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const empList         = (empData    as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const typedAssets     = ((assetData  as { data?: { data?: unknown[] } })?.data?.data ?? []) as RawAsset[];
    const typedStocks     = ((stockData  as { data?: { data?: unknown[] } })?.data?.data ?? []) as RawStock[];
    const typedAssignments = ((assignData as { data?: { data?: unknown[] } })?.data?.data ?? []) as RawAssignment[];
    const typedDepts      = deptList as RawDept[];

    /* ── Compute functions (called inside DetailCard with optional deptId) ── */

    // 1 — Fixed assets: count per category, filtered by dept
    const computeAssetByCategory = (deptId?: number): DetailRow[] => {
        const src = deptId ? typedAssets.filter(a => a.department_id === deptId) : typedAssets;
        const map: Record<string, number> = {};
        src.forEach(a => {
            const cat = a.item?.category?.name ?? 'Uncategorized';
            map[cat] = (map[cat] ?? 0) + 1;
        });
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({ label, value }));
    };

    // 2 — Active assignments: asset code + name → assignee name, filtered by asset's dept
    const computeActiveAssignments = (deptId?: number): DetailRow[] => {
        const active = typedAssignments.filter(a => a.status === 'active');
        const src = deptId
            ? active.filter(a => {
                const asset = typedAssets.find(x => x.id === a.asset?.id);
                return asset?.department_id === deptId;
            })
            : active;
        return src.map(a => {
            const assignee =
                (a.assignable_label ??
                a.assignable?.full_name ??
                a.assignable?.name ??
                `${a.assignable?.first_name ?? ''} ${a.assignable?.last_name ?? ''}`.trim()) ||
                '—';
            return {
                label: `${a.asset?.item_code ?? '—'} — ${a.asset?.item?.name ?? '—'}`,
                value: assignee,
            };
        });
    };

    // 3 — Low stock: consumable name → remaining quantity, filtered by dept
    const computeLowStock = (deptId?: number): DetailRow[] => {
        const src = typedStocks.filter(s =>
            s.is_below_minimum && Number(s.quantity) > 0 &&
            (deptId ? s.department_id === deptId : true)
        );
        return src.map(s => ({
            label: s.item?.name ?? '—',
            value: `${Number(s.quantity)}${s.item?.unit?.abbreviation ? ` ${s.item.unit.abbreviation}` : ''}`,
        }));
    };

    // 4 — Out of stock: consumable name → dept, filtered by dept
    const computeOutOfStock = (deptId?: number): DetailRow[] => {
        const src = typedStocks.filter(s =>
            Number(s.quantity) === 0 &&
            (deptId ? s.department_id === deptId : true)
        );
        return src.map(s => ({
            label: s.item?.name ?? '—',
            value: s.department?.name ?? '—',
        }));
    };

    /* ── Summary counts ── */
    const activeAssignCount = typedAssignments.filter(a => a.status === 'active').length;
    const lowStockCount     = typedStocks.filter(s => s.is_below_minimum && Number(s.quantity) > 0).length;
    const outOfStockCount   = typedStocks.filter(s => Number(s.quantity) === 0).length;

    const hour      = new Date().getHours();
    const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const firstName = user?.name?.split(' ')[0] ?? 'there';

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Greeting */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
                <div className="border-l-4 border-gold pl-4">
                    <h1 className="text-2xl font-bold text-ink">{greeting}, {firstName}</h1>
                    <p className="text-sm text-muted mt-0.5">Overview of your inventory system</p>
                </div>
            </motion.div>

            {/* ── Summary ── */}
            <section>
                <motion.p
                    className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3"
                    variants={fadeUp} initial="hidden" animate="visible"
                >
                    Summary
                </motion.p>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden" animate="visible"
                >
                    {isAdmin && (
                        <StatCard index={0} label="Departments" value={deptList.length}
                            icon={<Building2 className="h-6 w-6" />} color="bg-[#9bc6ef]" />
                    )}
                    <StatCard index={1} label="Total Items" value={itemList.length}
                        icon={<Package className="h-6 w-6" />} color="bg-[#cdac6a]"
                        sub="Registered item types" />
                    {isAdmin && (
                        <StatCard index={2} label="Employees" value={empList.length}
                            icon={<Users className="h-6 w-6" />} color="bg-[#9bc6ef]" />
                    )}
                    <StatCard index={3} label="Total Asset Units" value={typedAssets.length}
                        icon={<Monitor className="h-6 w-6" />} color="bg-[#cdac6a]"
                        sub="Physical fixed asset units" />
                </motion.div>
            </section>

            {/* ── Breakdown — click to view detail ── */}
            <section>
                <motion.p
                    className="text-[11px] font-bold text-muted uppercase tracking-widest mb-3"
                    variants={fadeUp} initial="hidden" animate="visible"
                >
                    Breakdown — click a card for details
                </motion.p>
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
                    variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
                    initial="hidden" animate="visible"
                >
                    {/* Fixed Assets by Category */}
                    <DetailCard
                        index={0}
                        label="Fixed Assets"
                        value={typedAssets.length}
                        icon={<Monitor className="h-6 w-6" />}
                        gradient="from-primary to-blue-400"
                        headerBg="bg-sidebar"
                        sub="Click to view by category"
                        detailTitle="Assets by category"
                        computeDetails={computeAssetByCategory}
                        isAdmin={isAdmin}
                        departments={typedDepts}
                        emptyText="No assets recorded"
                        valueLabel="Units"
                    />

                    {/* Active Assignments */}
                    <DetailCard
                        index={1}
                        label="Active Assignments"
                        value={activeAssignCount}
                        icon={<ClipboardList className="h-6 w-6" />}
                        gradient="from-gold to-amber-400"
                        headerBg="bg-gold"
                        sub="Click to view assigned assets"
                        detailTitle="Currently assigned assets"
                        computeDetails={computeActiveAssignments}
                        isAdmin={isAdmin}
                        departments={typedDepts}
                        emptyText="No active assignments"
                        valueLabel="Assigned to"
                    />

                    {/* Low Stock */}
                    <DetailCard
                        index={2}
                        label="Low Stock Alerts"
                        value={lowStockCount}
                        icon={<AlertTriangle className="h-6 w-6" />}
                        gradient={lowStockCount > 0 ? 'from-amber-500 to-orange-500' : 'from-slate-400 to-slate-500'}
                        headerBg={lowStockCount > 0 ? 'bg-amber-500' : 'bg-slate-500'}
                        sub="Click to view low stock items"
                        detailTitle="Low stock consumables"
                        computeDetails={computeLowStock}
                        isAdmin={isAdmin}
                        departments={typedDepts}
                        emptyText="All items sufficiently stocked"
                        valueLabel="Remaining"
                    />

                    {/* Out of Stock */}
                    <DetailCard
                        index={3}
                        label="Out of Stock"
                        value={outOfStockCount}
                        icon={<PackageX className="h-6 w-6" />}
                        gradient={outOfStockCount > 0 ? 'from-red-500 to-rose-600' : 'from-slate-400 to-slate-500'}
                        headerBg={outOfStockCount > 0 ? 'bg-red-500' : 'bg-slate-500'}
                        sub="Click to view out-of-stock items"
                        detailTitle="Out of stock consumables"
                        computeDetails={computeOutOfStock}
                        isAdmin={isAdmin}
                        departments={typedDepts}
                        emptyText="No items are out of stock"
                        valueLabel="Department"
                    />
                </motion.div>
            </section>
        </div>
    );
}
