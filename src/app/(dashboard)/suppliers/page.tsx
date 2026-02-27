'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useSuppliers } from '@/hooks/api/useSuppliers';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { truncate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface Supplier {
    id: number;
    name: string;
    contact_person: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    stock_receivials_count?: number;
    modified_by?: string | null;
}

const empty = { name: '', contact_person: '', email: '', phone: '', address: '' };

export default function SuppliersPage() {
    const api = useSuppliers();
    const { data: res, isLoading, mutate } = useSWR('/api/suppliers', () => api.index());
    const rows: Supplier[] = (res as { data?: { data?: Supplier[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<Supplier | null>(null);
    const [deleteRow, setDeleteRow]   = useState<Supplier | null>(null);
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
    const openEdit = (row: Supplier) => {
        setForm({ name: row.name, contact_person: row.contact_person ?? '', email: row.email ?? '', phone: row.phone ?? '', address: row.address ?? '' });
        setErrors({}); setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editRow) { await api.update(editRow.id, form); toast.success('Supplier updated.'); setEditRow(null); }
            else         { await api.store(form); toast.success('Supplier created.'); setCreateOpen(false); }
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
        try { await api.destroy(deleteRow.id); toast.success('Supplier deleted.'); setDeleteRow(null); mutate(); }
        catch { toast.error('Cannot delete: supplier has related receivals.'); }
        finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.contact_person?.toLowerCase().includes(q) ||
            r.email?.toLowerCase().includes(q) ||
            r.phone?.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns: Column<Supplier>[] = [
        { key: 'name',           label: 'Name' },
        { key: 'contact_person', label: 'Contact',     render: r => r.contact_person ?? '—' },
        { key: 'email',          label: 'Email',       render: r => r.email ?? '—' },
        { key: 'phone',          label: 'Phone',       render: r => r.phone ?? '—' },
        { key: 'address',        label: 'Address',     render: r => truncate(r.address ?? '', 40) },
        { key: 'modified_by',    label: 'Modified By', render: r => r.modified_by ?? '—' },
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

    const formFields = (
        <div className="space-y-4">
            <Input label="Supplier Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Contact Person" value={form.contact_person} onChange={e => set('contact_person', e.target.value)} error={err('contact_person')} />
                <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} error={err('phone')} />
            </div>
            <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={err('email')} />
            <Textarea label="Address" value={form.address} onChange={e => set('address', e.target.value)} error={err('address')} />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Suppliers" subtitle="Manage vendor/supplier records"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Supplier</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name, contact, email, or phone…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Supplier"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                {formFields}
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Supplier"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                {formFields}
            </Modal>
            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete supplier "${deleteRow?.name}"?`} />
        </motion.div>
    );
}
