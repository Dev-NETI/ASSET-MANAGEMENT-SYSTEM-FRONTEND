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
import Select from '@/components/ui/Select';
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

const empty = { name: '', code: '', description: '', parent_id: '' };

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

    const [search, setSearch]       = useState('');
    const [levelFilter, setLevelFilter] = useState('');
    const [page, setPage]           = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...empty }); setErrors({}); setCreateOpen(true); };
    const openEdit = (row: Category) => {
        setForm({ name: row.name, code: row.code ?? '', description: row.description ?? '', parent_id: row.parent_id ? String(row.parent_id) : '' });
        setErrors({});
        setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form, parent_id: form.parent_id || null };
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
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.code?.toLowerCase().includes(q)
            );
        }
        if (levelFilter === 'top') {
            result = result.filter(r => r.parent_id === null);
        } else if (levelFilter === 'sub') {
            result = result.filter(r => r.parent_id !== null);
        }
        return result;
    }, [rows, search, levelFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    // Only top-level categories as parent options
    const parentOptions = rows
        .filter(r => !r.parent_id)
        .map(r => ({ value: r.id, label: r.name }));

    const columns: Column<Category>[] = [
        { key: 'name',   label: 'Name' },
        { key: 'code',   label: 'Code', render: r => r.code ?? '—', className: 'font-mono' },
        { key: 'parent', label: 'Parent', render: r => r.parent?.name ?? '—' },
        { key: 'children_count', label: 'Sub-cats', render: r => r.children_count ?? 0 },
        { key: 'items_count',    label: 'Items',    render: r => r.items_count ?? 0 },
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
            <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Code" value={form.code} onChange={e => set('code', e.target.value)} error={err('code')} />
                <Select label="Parent Category" value={form.parent_id} onChange={e => set('parent_id', e.target.value)}
                    options={parentOptions} placeholder="None (top-level)" error={err('parent_id')} />
            </div>
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} error={err('description')} />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Categories" subtitle="Hierarchical item categories"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Category</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or code…">
                <select
                    value={levelFilter}
                    onChange={e => { setLevelFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Levels</option>
                    <option value="top">Top-level Only</option>
                    <option value="sub">Sub-categories Only</option>
                </select>
            </FilterBar>
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
