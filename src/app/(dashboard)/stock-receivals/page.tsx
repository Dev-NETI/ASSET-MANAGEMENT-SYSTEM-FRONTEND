'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useStockReceivials } from '@/hooks/api/useStockReceivials';
import { useItems } from '@/hooks/api/useItems';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useSuppliers } from '@/hooks/api/useSuppliers';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Plus } from 'lucide-react';
import { formatDate, formatCurrency, formatNumber, getCurrentDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface StockReceival {
    id: number;
    item_id: number;
    department_id: number;
    quantity: number;
    unit_cost: number | null;
    supplier_id: number | null;
    reference_no: string | null;
    received_at: string;
    notes: string | null;
    item?: { id: number; name: string; unit?: { abbreviation: string } };
    department?: { id: number; name: string };
    supplier?: { id: number; name: string } | null;
}

const empty = { item_id: '', department_id: '', quantity: '', unit_cost: '', supplier_id: '', reference_no: '', received_at: '', notes: '' };

export default function StockRecevalsPage() {
    const api      = useStockReceivials();
    const itemApi  = useItems();
    const deptApi  = useDepartments();
    const suppApi  = useSuppliers();

    const { data: res,     isLoading, mutate } = useSWR('/api/stock-receivals', () => api.index());
    const { data: itemRes }                    = useSWR('/api/items-c',         () => itemApi.index());
    const { data: deptRes }                    = useSWR('/api/departments',     () => deptApi.index());
    const { data: suppRes }                    = useSWR('/api/suppliers',       () => suppApi.index());

    const rows: StockReceival[]  = (res as { data?: { data?: StockReceival[] } })?.data?.data ?? [];
    const allItems               = (itemRes as { data?: { data?: { id: number; name: string; item_type: string }[] } })?.data?.data ?? [];
    const consumableItems        = allItems.filter((i: { item_type: string }) => i.item_type === 'consumable');
    const departments            = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];
    const suppliers              = (suppRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm]             = useState({ ...empty });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage]     = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                item_id: Number(form.item_id),
                department_id: Number(form.department_id),
                quantity: Number(form.quantity),
                unit_cost: form.unit_cost ? Number(form.unit_cost) : null,
                supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
            };
            await api.store(payload);
            toast.success('Stock receival recorded. Stock updated.');
            setCreateOpen(false);
            mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error(er.response?.data?.message ?? 'An error occurred.');
        } finally { setSaving(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.item?.name?.toLowerCase().includes(q) ||
            r.reference_no?.toLowerCase().includes(q) ||
            r.supplier?.name?.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const itemOptions = consumableItems.map((i: { id: number; name: string }) => ({ value: i.id, label: i.name }));
    const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));
    const suppOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

    const columns: Column<StockReceival>[] = [
        { key: 'item',         label: 'Item',       render: r => r.item?.name ?? '—' },
        { key: 'department',   label: 'Department', render: r => r.department?.name ?? '—' },
        { key: 'quantity',     label: 'Quantity',   render: r => `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ''}` },
        { key: 'unit_cost',    label: 'Unit Cost',  render: r => formatCurrency(r.unit_cost) },
        { key: 'supplier',     label: 'Supplier',   render: r => r.supplier?.name ?? '—' },
        { key: 'reference_no', label: 'Ref No.',    render: r => r.reference_no ?? '—' },
        { key: 'received_at',  label: 'Received',   render: r => formatDate(r.received_at, 'MMMM d, yyyy') },
        { key: 'notes',        label: 'Notes',      render: r => r.notes ?? '—' },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Stock Receivals" subtitle="Record incoming consumable stock (automatically updates stock levels)"
                action={<Button onClick={() => { setForm({ ...empty, received_at: getCurrentDate() }); setErrors({}); setCreateOpen(true); }}><Plus className="h-4 w-4" />Record Receival</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by item, reference no., or supplier…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Record Stock Receival" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save & Update Stock</Button></>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Item (Consumable)" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} required error={err('item_id')} />
                        <Select label="Receiving Department" value={form.department_id} onChange={e => set('department_id', e.target.value)} options={deptOptions} required error={err('department_id')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Quantity" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} required error={err('quantity')} />
                        <Input label="Unit Cost (PHP)" type="number" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} error={err('unit_cost')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Supplier" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} options={suppOptions} placeholder="None" error={err('supplier_id')} />
                        <Input label="Reference No." value={form.reference_no} onChange={e => set('reference_no', e.target.value)} error={err('reference_no')} />
                    </div>
                    <Input label="Date Received" type="date" value={form.received_at} onChange={e => set('received_at', e.target.value)} required error={err('received_at')} />
                    <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
            </Modal>
        </motion.div>
    );
}
