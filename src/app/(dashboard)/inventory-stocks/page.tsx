'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useInventoryStocks } from '@/hooks/api/useInventoryStocks';
import { useItems } from '@/hooks/api/useItems';
import { useDepartments } from '@/hooks/api/useDepartments';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { SlidersHorizontal, AlertTriangle } from 'lucide-react';
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
    const api     = useInventoryStocks();
    const itemApi = useItems();
    const deptApi = useDepartments();

    const { data: res,     isLoading, mutate } = useSWR('/api/inventory-stocks', () => api.index());
    const { data: itemRes }                    = useSWR('/api/items-consumable',  () => itemApi.index());
    const { data: deptRes }                    = useSWR('/api/departments',       () => deptApi.index());

    const rows: InventoryStock[]  = (res as { data?: { data?: InventoryStock[] } })?.data?.data ?? [];
    const allItems                = (itemRes as { data?: { data?: { id: number; name: string; item_type: string }[] } })?.data?.data ?? [];
    const consumableItems         = allItems.filter((i: { item_type: string }) => i.item_type === 'consumable');
    const departments             = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];

    const [adjustOpen, setAdjustOpen] = useState(false);
    const [form, setForm]             = useState({ item_id: '', department_id: '', quantity: '', notes: '' });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);

    const [search, setSearch]               = useState('');
    const [belowMinFilter, setBelowMinFilter] = useState('');
    const [page, setPage]                   = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const handleAdjust = async () => {
        setSaving(true);
        try {
            await api.adjust({
                item_id: Number(form.item_id),
                department_id: Number(form.department_id),
                quantity: Number(form.quantity),
                notes: form.notes,
            });
            toast.success('Stock adjusted.');
            setAdjustOpen(false);
            mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error(er.response?.data?.message ?? 'An error occurred.');
        } finally { setSaving(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.item?.name?.toLowerCase().includes(q)
            );
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

    const itemOptions = consumableItems.map((i: { id: number; name: string }) => ({ value: i.id, label: i.name }));
    const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));

    const columns: Column<InventoryStock>[] = [
        { key: 'item',       label: 'Item',       render: r => r.item?.name ?? '—' },
        { key: 'department', label: 'Department', render: r => r.department?.name ?? '—' },
        { key: 'quantity',   label: 'Quantity',   render: r => `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ''}` },
        { key: 'min_stock',  label: 'Min Level',  render: r => r.item?.min_stock_level != null ? formatNumber(r.item.min_stock_level) : '—' },
        {
            key: 'alert', label: 'Alert',
            render: r => r.is_below_minimum
                ? <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertTriangle className="h-3.5 w-3.5" />Low Stock</span>
                : <span className="text-green-600 text-xs">OK</span>,
        },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Inventory Stock Levels" subtitle="Consumable stock quantities per item per department"
                action={<Button onClick={() => { setForm({ item_id: '', department_id: '', quantity: '', notes: '' }); setErrors({}); setAdjustOpen(true); }}><SlidersHorizontal className="h-4 w-4" />Adjust Stock</Button>} />
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

            <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust Stock" size="sm"
                footer={<><Button variant="secondary" onClick={() => setAdjustOpen(false)}>Cancel</Button><Button onClick={handleAdjust} loading={saving}>Apply</Button></>}>
                <div className="space-y-4">
                    <Select label="Item (Consumable)" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} required error={err('item_id')} />
                    <Select label="Department" value={form.department_id} onChange={e => set('department_id', e.target.value)} options={deptOptions} required error={err('department_id')} />
                    <Input label="New Quantity" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} required error={err('quantity')} />
                    <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} />
                </div>
            </Modal>
        </motion.div>
    );
}
