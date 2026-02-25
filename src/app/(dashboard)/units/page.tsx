'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useUnits } from '@/hooks/api/useUnits';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

interface Unit {
    id: number;
    name: string;
    abbreviation: string;
    items_count?: number;
}

const empty = { name: '', abbreviation: '' };

export default function UnitsPage() {
    const api = useUnits();
    const { data: res, isLoading, mutate } = useSWR('/api/units', () => api.index());
    const rows: Unit[] = (res as { data?: { data?: Unit[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<Unit | null>(null);
    const [deleteRow, setDeleteRow]   = useState<Unit | null>(null);
    const [form, setForm]             = useState({ ...empty });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);
    const [deleting, setDeleting]     = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage]     = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...empty }); setErrors({}); setCreateOpen(true); };
    const openEdit   = (row: Unit) => { setForm({ name: row.name, abbreviation: row.abbreviation }); setErrors({}); setEditRow(row); };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editRow) { await api.update(editRow.id, form); toast.success('Unit updated.'); setEditRow(null); }
            else         { await api.store(form); toast.success('Unit created.'); setCreateOpen(false); }
            mutate();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('An error occurred.');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        try { await api.destroy(deleteRow.id); toast.success('Unit deleted.'); setDeleteRow(null); mutate(); }
        catch { toast.error('Cannot delete: unit is in use.'); }
        finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.abbreviation?.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns: Column<Unit>[] = [
        { key: 'name',         label: 'Name' },
        { key: 'abbreviation', label: 'Abbreviation', className: 'font-mono' },
        { key: 'items_count',  label: 'Items', render: r => r.items_count ?? 0 },
        {
            key: 'actions', label: 'Actions', className: 'w-24 text-right',
            render: row => (
                <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteRow(row)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
            ),
        },
    ];

    const FormBody = () => (
        <div className="grid grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required placeholder="e.g. Kilogram" />
            <Input label="Abbreviation" value={form.abbreviation} onChange={e => set('abbreviation', e.target.value)} error={err('abbreviation')} required placeholder="e.g. kg" />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Units of Measure" subtitle="Manage measurement units used in items"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Unit</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or abbreviation…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Unit" size="sm"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                <FormBody />
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Unit" size="sm"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                <FormBody />
            </Modal>
            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete unit "${deleteRow?.name}"?`} />
        </motion.div>
    );
}
