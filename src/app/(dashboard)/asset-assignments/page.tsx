'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { useAssetAssignments } from '@/hooks/api/useAssetAssignments';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface AssetAssignment {
    id: number;
    status: string;
    assigned_at: string;
    expected_return_date: string | null;
    returned_at: string | null;
    condition_on_assign: string;
    condition_on_return: string | null;
    purpose: string | null;
    asset?: { id: number; item_code: string; item?: { name: string } };
    assignable?: { id: number; name?: string; first_name?: string; last_name?: string; full_name?: string };
    assignable_type?: string;
    assigned_by_user?: { name: string };
}

export default function AssetAssignmentsPage() {
    const api = useAssetAssignments();
    const { data: res, isLoading } = useSWR('/api/asset-assignments', () => api.index());
    const rows: AssetAssignment[] = (res as { data?: { data?: AssetAssignment[] } })?.data?.data ?? [];

    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]               = useState(1);
    const PER_PAGE = 10;

    const getAssignableName = (row: AssetAssignment) => {
        if (!row.assignable) return '—';
        return row.assignable.full_name ?? row.assignable.name ??
            `${row.assignable.first_name ?? ''} ${row.assignable.last_name ?? ''}`.trim();
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

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
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }
        return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns: Column<AssetAssignment>[] = [
        { key: 'item_code',    label: 'Asset Code',  render: r => <span className="font-mono">{r.asset?.item_code ?? '—'}</span> },
        { key: 'item_name',    label: 'Item',        render: r => r.asset?.item?.name ?? '—' },
        { key: 'assigned_to',  label: 'Assigned To', render: r => getAssignableName(r) },
        { key: 'type',         label: 'Type',        render: r => r.assignable_type?.includes('Employee') ? 'Employee' : 'Department' },
        { key: 'assigned_at',  label: 'Assigned',    render: r => formatDate(r.assigned_at, 'MMMM d, yyyy') },
        { key: 'expected_return_date', label: 'Expected Return', render: r => r.expected_return_date ? formatDate(r.expected_return_date, 'MMMM d, yyyy') : '—' },
        { key: 'returned_at',  label: 'Returned',    render: r => r.returned_at ? formatDate(r.returned_at, 'MMMM d, yyyy') : '—' },
        { key: 'condition',    label: 'Condition',   render: r => <Badge status={r.condition_on_assign} /> },
        { key: 'status',       label: 'Status',      render: r => <Badge status={r.status} /> },
        { key: 'purpose',      label: 'Purpose',     render: r => r.purpose ?? '—' },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Asset Assignments" subtitle="History of fixed-asset assignments and returns (read-only)" />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by asset code, item name, or assignee…">
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="returned">Returned</option>
                    <option value="lost">Lost</option>
                </select>
            </FilterBar>
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        </motion.div>
    );
}
