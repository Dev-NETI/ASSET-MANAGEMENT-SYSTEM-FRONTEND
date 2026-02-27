'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useCategories } from '@/hooks/api/useCategories';
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
import { fadeUp } from '@/lib/motion';

interface Category {
    id: number;
    name: string;
    code: string | null;
    description: string | null;
    parent_id: number | null;
    parent?: { id: number; name: string } | null;
    children_count?: number;
    items_count?: number;
}

const empty = { name: '', code: '', description: '' };

export default function CategoriesPage() {
    const api = useCategories();
    const { data: res, isLoading, mutate } = useSWR('/api/categories', () => api.index());
    const rows: Category[] = (res as { data?: { data?: Category[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<Category | null>(null);
    const [deleteRow, setDeleteRow]   = useState<Category | null>(null);
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
    const openEdit = (row: Category) => {
        setForm({ name: row.name, code: row.code ?? '', description: row.description ?? '' });
        setErrors({});
        setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form };
            if (editRow) {
                await api.update(editRow.id, payload);
                toast.success('Category updated.');
                setEditRow(null);
            } else {
                await api.store(payload);
                toast.success('Category created.');
                setCreateOpen(false);
            }
            mutate();
        } catch (e: unknown) {
            const err = e as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else toast.error('An error occurred.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        try {
            await api.destroy(deleteRow.id);
            toast.success('Category deleted.');
            setDeleteRow(null);
            mutate();
        } catch {
            toast.error('Cannot delete: category has sub-categories or items.');
        } finally {
            setDeleting(false);
        }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        if (!search.trim()) return rows;
        const q = search.toLowerCase();
        return rows.filter(r =>
            r.name?.toLowerCase().includes(q) ||
            r.code?.toLowerCase().includes(q)
        );
    }, [rows, search]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const columns: Column<Category>[] = [
        { key: 'name', label: 'Name' },
        { key: 'code', label: 'Code', render: r => r.code ?? '—', className: 'font-mono' },
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
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required />
                <Input label="Code" value={form.code} onChange={e => set('code', e.target.value)} error={err('code')} />
            </div>
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} error={err('description')} />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Categories" subtitle="Manage item categories"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Category</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or code…" />
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Category"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                <FormBody />
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Category"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                <FormBody />
            </Modal>
            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete category "${deleteRow?.name}"?`} />
        </motion.div>
    );
}
