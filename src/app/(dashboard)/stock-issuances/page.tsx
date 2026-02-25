'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useStockIssuances } from '@/hooks/api/useStockIssuances';
import { useItems } from '@/hooks/api/useItems';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useEmployees } from '@/hooks/api/useEmployees';
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
import { formatDate, formatNumber, getCurrentDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface StockIssuance {
    id: number;
    item_id: number;
    from_department_id: number;
    quantity: number;
    issued_at: string;
    purpose: string | null;
    notes: string | null;
    issuable_type?: string;
    item?: { id: number; name: string; unit?: { abbreviation: string } };
    from_department?: { id: number; name: string };
    issuable?: { id: number; name?: string; first_name?: string; last_name?: string; full_name?: string };
}

const empty = { item_id: '', from_department_id: '', issuable_type: 'employee', issuable_id: '', quantity: '', issued_at: '', purpose: '', notes: '' };

export default function StockIssuancesPage() {
    const api     = useStockIssuances();
    const itemApi = useItems();
    const deptApi = useDepartments();
    const empApi  = useEmployees();

    const { data: res,     isLoading, mutate } = useSWR('/api/stock-issuances', () => api.index());
    const { data: itemRes }                    = useSWR('/api/items-si',        () => itemApi.index());
    const { data: deptRes }                    = useSWR('/api/departments',     () => deptApi.index());
    const { data: empRes  }                    = useSWR('/api/employees',       () => empApi.index());

    const rows: StockIssuance[]  = (res as { data?: { data?: StockIssuance[] } })?.data?.data ?? [];
    const allItems               = (itemRes as { data?: { data?: { id: number; name: string; item_type: string }[] } })?.data?.data ?? [];
    const consumableItems        = allItems.filter((i: { item_type: string }) => i.item_type === 'consumable');
    const departments            = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];
    const employees              = (empRes  as { data?: { data?: { id: number; first_name: string; last_name: string; full_name?: string }[] } })?.data?.data ?? [];

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
                item_id: Number(form.item_id),
                from_department_id: Number(form.from_department_id),
                issuable_type: form.issuable_type,
                issuable_id: Number(form.issuable_id),
                quantity: Number(form.quantity),
                issued_at: form.issued_at,
                purpose: form.purpose,
                notes: form.notes,
            };
            await api.store(payload);
            toast.success('Stock issued. Stock decremented.');
            setCreateOpen(false);
            mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error(er.response?.data?.message ?? 'Insufficient stock or invalid request.');
        } finally { setSaving(false); }
    };

    const getIssuableName = (row: StockIssuance) => {
        if (!row.issuable) return '—';
        return row.issuable.full_name ?? row.issuable.name ??
            `${row.issuable.first_name ?? ''} ${row.issuable.last_name ?? ''}`.trim();
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.item?.name?.toLowerCase().includes(q) ||
            // reference_no not present on issuances, but keep for future compat
            getIssuableName(r).toLowerCase().includes(q)
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const itemOptions     = consumableItems.map((i: { id: number; name: string }) => ({ value: i.id, label: i.name }));
    const deptOptions     = departments.map(d => ({ value: d.id, label: d.name }));
    const empOptions      = employees.map(e => ({ value: e.id, label: e.full_name ?? `${e.first_name} ${e.last_name}` }));
    const issuableOptions = form.issuable_type === 'employee' ? empOptions : deptOptions;

    const columns: Column<StockIssuance>[] = [
        { key: 'item',              label: 'Item',        render: r => r.item?.name ?? '—' },
        { key: 'from_department',   label: 'From Dept.',  render: r => r.from_department?.name ?? '—' },
        { key: 'issued_to',         label: 'Issued To',   render: r => getIssuableName(r) },
        { key: 'type',              label: 'Type',        render: r => r.issuable_type?.includes('Employee') ? 'Employee' : 'Department' },
        { key: 'quantity',          label: 'Quantity',    render: r => `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ''}` },
        { key: 'issued_at',         label: 'Issued',      render: r => formatDate(r.issued_at, 'MMMM d, yyyy') },
        { key: 'purpose',           label: 'Purpose',     render: r => r.purpose ?? '—' },
    ];

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Stock Issuances" subtitle="Record consumable stock issued to employees or departments"
                action={<Button onClick={() => { setForm({ ...empty, issued_at: getCurrentDate() }); setErrors({}); setCreateOpen(true); }}><Plus className="h-4 w-4" />Record Issuance</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by item name or issued to…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Record Stock Issuance" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save & Decrement Stock</Button></>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Item (Consumable)" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} required error={err('item_id')} />
                        <Select label="From Department" value={form.from_department_id} onChange={e => set('from_department_id', e.target.value)} options={deptOptions} required error={err('from_department_id')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Issue To" value={form.issuable_type}
                            onChange={e => { set('issuable_type', e.target.value); set('issuable_id', ''); }}
                            options={[{ value: 'employee', label: 'Employee' }, { value: 'department', label: 'Department' }]} required />
                        <Select label={form.issuable_type === 'employee' ? 'Employee' : 'Department'}
                            value={form.issuable_id} onChange={e => set('issuable_id', e.target.value)}
                            options={issuableOptions} required error={err('issuable_id')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Quantity" type="number" value={form.quantity} onChange={e => set('quantity', e.target.value)} required error={err('quantity')} />
                        <Input label="Date Issued" type="date" value={form.issued_at} onChange={e => set('issued_at', e.target.value)} required error={err('issued_at')} />
                    </div>
                    <Input label="Purpose" value={form.purpose} onChange={e => set('purpose', e.target.value)} error={err('purpose')} />
                    <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} />
                </div>
            </Modal>
        </motion.div>
    );
}
