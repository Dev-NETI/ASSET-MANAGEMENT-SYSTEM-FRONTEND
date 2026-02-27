'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { useInventoryStocks } from '@/hooks/api/useInventoryStocks';
import { useAuth } from '@/hooks/auth';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import { AlertTriangle, PackageX } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface InventoryStock {
    id: number;
    item_id: number;
    department_id: number;
    quantity: number;
    is_below_minimum?: boolean;
    item?: { id: number; name: string; unit?: { abbreviation: string }; min_stock_level?: number };
    department?: { id: number; name: string };
}

export default function InventoryStocksPage() {
    const { user } = useAuth();
    const isAdmin  = user?.user_type === 'system_administrator';
    const api      = useInventoryStocks();

    const { data: res, isLoading } = useSWR('/api/inventory-stocks', () => api.index());

    const rows: InventoryStock[] = (res as { data?: { data?: InventoryStock[] } })?.data?.data ?? [];

    const [search, setSearch]               = useState('');
    const [belowMinFilter, setBelowMinFilter] = useState('');
    const [page, setPage]                   = useState(1);
    const PER_PAGE = 10;

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r => r.item?.name?.toLowerCase().includes(q));
        }
        if (belowMinFilter === 'low') {
            result = result.filter(r => r.is_below_minimum === true);
        } else if (belowMinFilter === 'ok') {
            result = result.filter(r => !r.is_below_minimum);
        }
        return result;
    }, [rows, search, belowMinFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns: Column<InventoryStock>[] = [
        { key: 'item',     label: 'Item',     render: r => r.item?.name ?? '—' },
        ...(isAdmin ? [{ key: 'department', label: 'Department', render: (r: InventoryStock) => r.department?.name ?? '—' } as Column<InventoryStock>] : []),
        { key: 'quantity', label: 'Quantity', render: r => `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ''}` },
        { key: 'min_stock', label: 'Min Level', render: r => r.item?.min_stock_level != null ? formatNumber(r.item.min_stock_level) : '—' },
        {
            key: 'alert', label: 'Alert',
            render: r => {
                if (Number(r.quantity) === 0) {
                    return <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 text-xs font-semibold"><PackageX className="h-3.5 w-3.5" />Out of Stock</span>;
                }
                if (r.is_below_minimum) {
                    return <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 text-xs font-semibold"><AlertTriangle className="h-3.5 w-3.5" />Low Stock</span>;
                }
                return <span className="text-green-600 text-xs font-medium">OK</span>;
            },
        },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Inventory Stock Levels" subtitle="Consumable stock quantities per item per department" />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by item name…">
                <select
                    value={belowMinFilter}
                    onChange={e => { setBelowMinFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Stock Levels</option>
                    <option value="low">Below Minimum</option>
                    <option value="ok">Above Minimum</option>
                </select>
            </FilterBar>
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />
        </motion.div>
    );
}
