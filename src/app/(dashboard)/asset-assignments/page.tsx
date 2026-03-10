'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/auth';
import { useAssetAssignments } from '@/hooks/api/useAssetAssignments';
import { useDepartments } from '@/hooks/api/useDepartments';
import PageHeader from '@/components/shared/PageHeader';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';
import { SlidersHorizontal, Search, X } from 'lucide-react';

interface AssetAssignment {
    id: number;
    status: string;
    assigned_at: string;
    expected_return_date: string | null;
    returned_at: string | null;
    purpose: string | null;
    asset?: { id: number; item_code: string; serial_number?: string | null; mac_address?: string | null; item?: { id: number; name: string; category?: { id: number; name: string } | null } };
    assignable?: { id: number; name?: string; first_name?: string; last_name?: string; full_name?: string } | null;
    assignable_type?: string | null;
    assignable_label?: string | null;
    assigned_by_user?: { name: string };
    modified_by?: string | null;
}

export default function AssetAssignmentsPage() {
    const { user } = useAuth();
    const api = useAssetAssignments();
    const deptApi = useDepartments();
    const { data: res, isLoading } = useSWR('/api/asset-assignments', () => api.index());
    const { data: deptRes } = useSWR('/api/departments', () => deptApi.index());
    const rows: AssetAssignment[] = (res as { data?: { data?: AssetAssignment[] } })?.data?.data ?? [];
    const departments = (deptRes as { data?: { data?: { id: number; name: string; code: string }[] } })?.data?.data ?? [];

    const nodDeptId = departments.find((d) => d.code === 'NOD')?.id;
    const isNodDept = nodDeptId !== undefined && user?.department_id === nodDeptId;

    const [search, setSearch]             = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [itemFilter, setItemFilter]         = useState('');
    const [statusFilter, setStatusFilter]     = useState('');
    const [page, setPage]                 = useState(1);
    const PER_PAGE = 10;

    const [colsOpen, setColsOpen] = useState(false);
    const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(['item_code', 'serial_number', 'mac_address', 'item_name', 'assigned_to', 'type', 'assigned_at', 'status']));
    const colsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const getAssignableName = (row: AssetAssignment) => {
        if (row.assignable_label) return row.assignable_label;
        if (!row.assignable) return '—';
        return row.assignable.full_name ?? row.assignable.name ??
            `${row.assignable.first_name ?? ''} ${row.assignable.last_name ?? ''}`.trim();
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const uniqueCategories = useMemo(() => {
        const cats = new Map<number, string>();
        rows.forEach(r => { if (r.asset?.item?.category) cats.set(r.asset.item.category.id, r.asset.item.category.name); });
        return Array.from(cats.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [rows]);

    const uniqueItems = useMemo(() => {
        const items = new Map<number, string>();
        rows.forEach(r => { if (r.asset?.item) items.set(r.asset.item.id, r.asset.item.name); });
        return Array.from(items.entries()).sort((a, b) => a[1].localeCompare(b[1]));
    }, [rows]);

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.asset?.item_code?.toLowerCase().includes(q) ||
                r.asset?.item?.name?.toLowerCase().includes(q) ||
                getAssignableName(r).toLowerCase().includes(q)
            );
        }
        if (categoryFilter) {
            result = result.filter(r => r.asset?.item?.category?.id === Number(categoryFilter));
        }
        if (itemFilter) {
            result = result.filter(r => r.asset?.item?.id === Number(itemFilter));
        }
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }
        return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, search, categoryFilter, itemFilter, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const toggleableCols = [
        { key: 'item_code',            label: 'Asset Code' },
        ...(isNodDept ? [
            { key: 'serial_number', label: 'Serial No.' },
            { key: 'mac_address',   label: 'MAC Address' },
        ] : []),
        { key: 'item_name',            label: 'Item' },
        { key: 'assigned_to',          label: 'Assigned To' },
        { key: 'type',                 label: 'Type' },
        { key: 'assigned_at',          label: 'Assigned' },
        { key: 'expected_return_date', label: 'Expected Return' },
        { key: 'returned_at',          label: 'Returned' },
        { key: 'status',               label: 'Status' },
        { key: 'purpose',              label: 'Purpose' },
        { key: 'modified_by',          label: 'Modified By' },
    ];

    const columns: Column<AssetAssignment>[] = [
        { key: 'item_code',            label: 'Asset Code',      render: r => <span className="font-mono">{r.asset?.item_code ?? '—'}</span> },
        ...(isNodDept ? [
            { key: 'serial_number', label: 'Serial No.',  render: (r: AssetAssignment) => <span className="font-mono">{r.asset?.serial_number ?? '—'}</span> },
            { key: 'mac_address',   label: 'MAC Address', render: (r: AssetAssignment) => <span className="font-mono">{r.asset?.mac_address ?? '—'}</span> },
        ] : []),
        { key: 'item_name',            label: 'Item',            render: r => r.asset?.item?.name ?? '—' },
        { key: 'assigned_to',          label: 'Assigned To',     render: r => getAssignableName(r) },
        { key: 'type',                 label: 'Type',            render: r => !r.assignable_type ? 'Others' : r.assignable_type.includes('Employee') ? 'Employee' : 'Department' },
        { key: 'assigned_at',          label: 'Assigned',        render: r => formatDate(r.assigned_at, 'MMMM d, yyyy') },
        { key: 'expected_return_date', label: 'Expected Return', render: r => r.expected_return_date ? formatDate(r.expected_return_date, 'MMMM d, yyyy') : '—' },
        { key: 'returned_at',          label: 'Returned',        render: r => r.returned_at ? formatDate(r.returned_at, 'MMMM d, yyyy') : '—' },
        { key: 'status',               label: 'Status',          render: r => <Badge status={r.status} /> },
        { key: 'purpose',              label: 'Purpose',         render: r => r.purpose ?? '—' },
        { key: 'modified_by',          label: 'Modified By',     render: r => r.modified_by ?? '—' },
    ];

    const visibleColumns = columns.filter(c => visibleCols.has(c.key));

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Asset Assignments" subtitle="History of fixed-asset assignments and returns (read-only)" />
            {/* Compact filter bar */}
            {(() => {
                const hasActiveFilters = !!(search.trim() || categoryFilter || itemFilter || statusFilter);
                const selectCls = 'text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef] cursor-pointer';
                return (
                    <div className="flex flex-wrap items-center gap-2 mb-4 bg-white border border-border/80 rounded-xl px-3 py-2 shadow-sm">
                        {/* Search */}
                        <div className="relative flex-1 min-w-40 max-w-xs">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold pointer-events-none" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search by code, item, or assignee…"
                                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 bg-surface text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
                            />
                            {search && (
                                <button onClick={() => handleSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-ink">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="h-4 w-px bg-gray-200 shrink-0" />

                        {/* Category */}
                        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className={selectCls}>
                            <option value="">All Categories</option>
                            {uniqueCategories.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>

                        {/* Item */}
                        <select value={itemFilter} onChange={e => { setItemFilter(e.target.value); setPage(1); }} className={selectCls}>
                            <option value="">All Items</option>
                            {uniqueItems.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                        </select>

                        {/* Status */}
                        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={selectCls}>
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="returned">Returned</option>
                        </select>

                        {/* Clear */}
                        {hasActiveFilters && (
                            <button
                                onClick={() => { handleSearch(''); setCategoryFilter(''); setItemFilter(''); setStatusFilter(''); setPage(1); }}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <X className="h-3 w-3" />
                                Clear
                            </button>
                        )}

                        <div className="h-4 w-px bg-gray-200 shrink-0 ml-auto" />

                        {/* Columns */}
                        <div className="relative" ref={colsRef}>
                            <button
                                onClick={() => setColsOpen(o => !o)}
                                className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9bc6ef] whitespace-nowrap"
                            >
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                Columns
                            </button>
                            {colsOpen && (
                                <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-40">
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Show Columns</p>
                                    {toggleableCols.map(c => (
                                        <label key={c.key} className="flex items-center gap-2 py-0.5 cursor-pointer group">
                                            <input type="checkbox" checked={visibleCols.has(c.key)}
                                                onChange={e => setVisibleCols(prev => { const n = new Set(prev); e.target.checked ? n.add(c.key) : n.delete(c.key); return n; })}
                                                className="h-3.5 w-3.5 accent-indigo-600" />
                                            <span className="text-xs text-gray-700 group-hover:text-indigo-600">{c.label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}
            <DataTable columns={visibleColumns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        </motion.div>
    );
}
