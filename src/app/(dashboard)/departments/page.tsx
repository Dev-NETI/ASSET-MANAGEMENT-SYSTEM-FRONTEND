'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useDepartments } from '@/hooks/api/useDepartments';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { Plus, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

interface Department {
    id: number;
    name: string;
    code: string;
    description: string | null;
    head_name: string | null;
    employees_count?: number;
    item_assets_count?: number;
    inventory_stocks_count?: number;
    modified_by?: string | null;
}

const empty = { name: '', code: '', description: '' };

export default function DepartmentsPage() {
    const api = useDepartments();
    const { data: res, isLoading, mutate } = useSWR('/api/departments', () => api.index());
    const rows: Department[] = (res as { data?: { data?: Department[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen]   = useState(false);
    const [editRow, setEditRow]         = useState<Department | null>(null);
    const [deleteRow, setDeleteRow]     = useState<Department | null>(null);
    const [form, setForm]               = useState({ ...empty });
    const [errors, setErrors]           = useState<Record<string, string[]>>({});
    const [saving, setSaving]           = useState(false);
    const [deleting, setDeleting]       = useState(false);

    const [search, setSearch] = useState('');
    const [page, setPage]     = useState(1);
    const PER_PAGE = 10;

    const [colsOpen, setColsOpen] = useState(false);
    const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(['code', 'name', 'modified_by']));
    const colsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (colsRef.current && !colsRef.current.contains(e.target as Node)) setColsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...empty }); setErrors({}); setCreateOpen(true); };
    const openEdit = (row: Department) => {
        setForm({ name: row.name, code: row.code, description: row.description ?? '' });
        setErrors({});
        setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editRow) {
                await api.update(editRow.id, form);
                toast.success('Department updated.');
                setEditRow(null);
            } else {
                await api.store(form);
                toast.success('Department created.');
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
            toast.success('Department deleted.');
            setDeleteRow(null);
            mutate();
        } catch {
            toast.error('Cannot delete: department has related records.');
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

    const toggleableCols = [
        { key: 'code',        label: 'Code' },
        { key: 'name',        label: 'Name' },
        { key: 'modified_by', label: 'Modified By' },
    ];

    const columns: Column<Department>[] = [
        { key: 'code',        label: 'Code',        className: 'font-mono w-24' },
        { key: 'name',        label: 'Name' },
        { key: 'modified_by', label: 'Modified By',  render: r => r.modified_by ?? '—' },
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

    const visibleColumns = columns.filter(c => c.key === 'actions' || visibleCols.has(c.key));

    const formFields = (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required />
                <Input label="Code" value={form.code} onChange={e => set('code', e.target.value)} error={err('code')} required placeholder="e.g. NOD" />
            </div>
            <Textarea label="Description" value={form.description} onChange={e => set('description', e.target.value)} error={err('description')} />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader
                title="Departments"
                subtitle="Manage organizational departments"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Department</Button>}
            />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or code…">
                <div className="relative" ref={colsRef}>
                    <Button variant="secondary" onClick={() => setColsOpen(o => !o)}>
                        <SlidersHorizontal className="h-4 w-4" />
                        Columns
                    </Button>
                    {colsOpen && (
                        <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-48">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Show Columns</p>
                            {toggleableCols.map(c => (
                                <label key={c.key} className="flex items-center gap-2 py-1 cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                                    <input type="checkbox" checked={visibleCols.has(c.key)}
                                        onChange={e => setVisibleCols(prev => { const n = new Set(prev); e.target.checked ? n.add(c.key) : n.delete(c.key); return n; })}
                                        className="rounded border-gray-300" />
                                    {c.label}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            </FilterBar>
            <DataTable columns={visibleColumns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Department"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                {formFields}
            </Modal>

            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Department"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                {formFields}
            </Modal>

            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete department "${deleteRow?.name}"?`} />
        </motion.div>
    );
}
