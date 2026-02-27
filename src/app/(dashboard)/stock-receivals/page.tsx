'use client';

import { useState, useMemo, useRef } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useStockReceivials } from '@/hooks/api/useStockReceivials';
import { useItems } from '@/hooks/api/useItems';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useSuppliers } from '@/hooks/api/useSuppliers';
import { useAuth } from '@/hooks/auth';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Plus, FileText } from 'lucide-react';
import { formatDate, formatCurrency, formatNumber, getCurrentDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';
import axiosInstance from '@/lib/axios';

interface StockReceival {
    id: number;
    item_id: number;
    department_id: number;
    quantity: number;
    unit_cost: number | null;
    supplier_id: number | null;
    delivery_receipt_no: string | null;
    delivery_receipt_file: string | null;
    received_at: string;
    notes: string | null;
    item?: { id: number; name: string; unit?: { abbreviation: string } };
    department?: { id: number; name: string };
    supplier?: { id: number; name: string } | null;
    modified_by?: string | null;
}

const empty = { item_id: '', department_id: '', quantity: '', unit_cost: '', supplier_id: '', delivery_receipt_no: '', received_at: '', notes: '' };

export default function StockRecevalsPage() {
    const { user }  = useAuth();
    const isAdmin   = user?.user_type === 'system_administrator';
    const api       = useStockReceivials();
    const itemApi   = useItems();
    const deptApi   = useDepartments();
    const suppApi   = useSuppliers();

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
    const [drFile, setDrFile]         = useState<File | null>(null);
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);
    const fileInputRef                = useRef<HTMLInputElement>(null);
    const [viewDrFile, setViewDrFile] = useState<string | null>(null);

    const [search, setSearch] = useState('');
    const [page, setPage]     = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => {
        setForm({ ...empty, received_at: getCurrentDate() });
        setDrFile(null);
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = '';
        setCreateOpen(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('item_id',  form.item_id);
            if (isAdmin && form.department_id) fd.append('department_id', form.department_id);
            fd.append('quantity', form.quantity);
            if (form.unit_cost)           fd.append('unit_cost',             form.unit_cost);
            if (form.supplier_id)         fd.append('supplier_id',           form.supplier_id);
            if (form.delivery_receipt_no) fd.append('delivery_receipt_no',   form.delivery_receipt_no);
            if (drFile)                   fd.append('delivery_receipt_file', drFile);
            fd.append('received_at', form.received_at);
            if (form.notes) fd.append('notes', form.notes);

            await axiosInstance.post('/api/stock-receivals', fd, { headers: { 'Content-Type': undefined } });
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
            r.delivery_receipt_no?.toLowerCase().includes(q) ||
            r.supplier?.name?.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const itemOptions = consumableItems.map((i: { id: number; name: string }) => ({ value: i.id, label: i.name }));
    const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));
    const suppOptions = suppliers.map(s => ({ value: s.id, label: s.name }));

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';

    const columns: Column<StockReceival>[] = [
        { key: 'item',     label: 'Item',     render: r => r.item?.name ?? '—' },
        ...(isAdmin ? [{ key: 'department', label: 'Department', render: (r: StockReceival) => r.department?.name ?? '—' } as Column<StockReceival>] : []),
        { key: 'supplier', label: 'Supplier', render: r => r.supplier?.name ?? '—' },
        { key: 'quantity', label: 'Quantity', render: r => `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ''}` },
        { key: 'unit_cost',   label: 'Unit Cost',   render: r => r.unit_cost != null ? formatCurrency(r.unit_cost) : '—' },
        { key: 'total_cost',  label: 'Total Cost',  render: r => r.unit_cost != null ? formatCurrency(r.quantity * r.unit_cost) : '—' },
        { key: 'received_at', label: 'Received',    render: r => formatDate(r.received_at, 'MMMM d, yyyy') },
        {
            key: 'delivery_receipt_no', label: 'DR No.',
            render: r => r.delivery_receipt_file ? (
                <button
                    onClick={() => setViewDrFile(`${backendUrl}/storage/${r.delivery_receipt_file}`)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    {r.delivery_receipt_no ?? 'View DR'}
                </button>
            ) : (r.delivery_receipt_no ?? '—'),
        },
        { key: 'notes',       label: 'Notes',       render: r => r.notes ?? '—' },
        { key: 'modified_by', label: 'Modified By', render: r => r.modified_by ?? '—' },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Stock Receivals" subtitle="Record incoming consumable stock (automatically updates stock levels)"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Record Receival</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by item, DR no., or supplier…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Record Stock Receival" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save & Update Stock</Button></>}>
                <div className="space-y-4">
                    {isAdmin ? (
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Item (Consumable)" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} required error={err('item_id')} />
                            <Select label="Receiving Department" value={form.department_id} onChange={e => set('department_id', e.target.value)} options={deptOptions} required error={err('department_id')} />
                        </div>
                    ) : (
                        <Select label="Item (Consumable)" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} required error={err('item_id')} />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Quantity" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} required error={err('quantity')} />
                        <Input label="Unit Cost (PHP)" type="number" value={form.unit_cost} onChange={e => set('unit_cost', e.target.value)} error={err('unit_cost')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Supplier" value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)} options={suppOptions} placeholder="None" error={err('supplier_id')} />
                        <Input label="Delivery Receipt No." value={form.delivery_receipt_no} onChange={e => set('delivery_receipt_no', e.target.value)} error={err('delivery_receipt_no')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Date Received" type="date" value={form.received_at} onChange={e => set('received_at', e.target.value)} required error={err('received_at')} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Delivery Receipt File <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={e => setDrFile(e.target.files?.[0] ?? null)}
                                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-[#9bc6ef]/20 file:text-[#070505] hover:file:bg-[#9bc6ef]/40 border border-gray-300 rounded-lg px-2 py-1.5 cursor-pointer"
                            />
                            {err('delivery_receipt_file') && <p className="mt-1 text-xs text-red-600">{err('delivery_receipt_file')}</p>}
                        </div>
                    </div>
                    <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
            </Modal>
            <Modal open={!!viewDrFile} onClose={() => setViewDrFile(null)} title="Delivery Receipt" size="xl">
                {viewDrFile && (
                    <iframe
                        src={viewDrFile}
                        className="w-full rounded"
                        style={{ height: '75vh' }}
                        title="Delivery Receipt PDF"
                    />
                )}
            </Modal>
        </motion.div>
    );
}
