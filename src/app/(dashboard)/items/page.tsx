'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/auth';
import { useItems } from '@/hooks/api/useItems';
import { useCategories } from '@/hooks/api/useCategories';
import { useUnits } from '@/hooks/api/useUnits';
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
import Badge from '@/components/ui/Badge';
import { Plus, Pencil, Trash2, SlidersHorizontal } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';
import ExcelImportButton from '@/components/shared/ExcelImportButton';

interface Item {
    id: number;
    name: string;
    description: string | null;
    category_id: number;
    unit_id: number;
    item_type: 'fixed_asset' | 'consumable';
    brand: string | null;
    model: string | null;
    specifications: Record<string, string> | null;
    min_stock_level: number | null;
    department_id: number | null;
    category?: { id: number; name: string };
    unit?: { id: number; name: string; abbreviation: string };
    department?: { id: number; name: string } | null;
    total_units?: number;
    available_units?: number;
    total_stock?: number;
    modified_by?: string | null;
}

const empty = { name: '', description: '', category_id: '', unit_id: '', item_type: 'consumable', brand: '', model: '', specifications: '', min_stock_level: '' };

export default function ItemsPage() {
    const { user } = useAuth();
    const isAdmin  = user?.user_type === 'system_administrator';

    const api        = useItems();
    const catApi     = useCategories();
    const unitApi    = useUnits();

    const { data: res,     isLoading, mutate } = useSWR('/api/items',      () => api.index());
    const { data: catRes  }                    = useSWR('/api/categories', () => catApi.index());
    const { data: unitRes }                    = useSWR('/api/units',      () => unitApi.index());

    const rows: Item[]  = (res     as { data?: { data?: Item[] } })?.data?.data ?? [];
    const categories    = (catRes  as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];
    const units         = (unitRes as { data?: { data?: { id: number; name: string; abbreviation: string }[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<Item | null>(null);
    const [deleteRow, setDeleteRow]   = useState<Item | null>(null);
    const [form, setForm]             = useState({ ...empty });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);
    const [deleting, setDeleting]     = useState(false);

    const [search, setSearch]         = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [page, setPage]             = useState(1);
    const PER_PAGE = 10;

    const [colsOpen, setColsOpen] = useState(false);
    const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(['category', 'name', 'item_type', 'stock', 'unit']));
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
    const openEdit = (row: Item) => {
        setForm({
            name: row.name, description: row.description ?? '',
            category_id: String(row.category_id), unit_id: String(row.unit_id),
            item_type: row.item_type, brand: row.brand ?? '', model: row.model ?? '',
            specifications: row.specifications
                ? Object.entries(row.specifications).map(([k, v]) => `${k}: ${v}`).join('\n')
                : '',
            min_stock_level: row.min_stock_level != null ? String(row.min_stock_level) : '',
        });
        setErrors({}); setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const specsText = form.specifications.trim();
            const specifications = specsText
                ? Object.fromEntries(
                    specsText.split('\n')
                        .map(line => line.split(':').map(s => s.trim()))
                        .filter(parts => parts.length >= 2 && parts[0])
                        .map(([k, ...rest]) => [k, rest.join(':').trim()])
                  )
                : null;
            const payload = {
                ...form,
                category_id: Number(form.category_id),
                unit_id: Number(form.unit_id),
                min_stock_level: form.min_stock_level ? Number(form.min_stock_level) : null,
                specifications,
            };
            if (editRow) { await api.update(editRow.id, payload); toast.success('Item updated.'); setEditRow(null); }
            else         { await api.store(payload); toast.success('Item created.'); setCreateOpen(false); }
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
        try { await api.destroy(deleteRow.id); toast.success('Item deleted.'); setDeleteRow(null); mutate(); }
        catch { toast.error('Cannot delete: item has assets or stock.'); }
        finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.brand?.toLowerCase().includes(q)
            );
        }
        if (typeFilter) {
            result = result.filter(r => r.item_type === typeFilter);
        }
        return result;
    }, [rows, search, typeFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const catOptions  = categories.map(c => ({ value: c.id, label: c.name }));
    const unitOptions = units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }));
    const typeOptions = [{ value: 'fixed_asset', label: 'Fixed Asset' }, { value: 'consumable', label: 'Consumable' }];

    const toggleableCols = [
        { key: 'category',       label: 'Category' },
        { key: 'brand',          label: 'Brand' },
        { key: 'model',          label: 'Model' },
        { key: 'name',           label: 'Name' },
        { key: 'specifications', label: 'Specifications' },
        { key: 'item_type',      label: 'Item Type' },
        { key: 'stock',          label: 'Stock/Units' },
        { key: 'unit',           label: 'Unit' },
        ...(isAdmin ? [{ key: 'department', label: 'Department' }] : []),
        { key: 'modified_by',    label: 'Modified By' },
    ];

    const columns: Column<Item>[] = [
        { key: 'category',       label: 'Category',      render: r => r.category?.name ?? '—' },
        { key: 'brand',          label: 'Brand',         render: r => r.brand ?? '—' },
        { key: 'model',          label: 'Model',         render: r => r.model ?? '—' },
        { key: 'name',           label: 'Name' },
        {
            key: 'specifications', label: 'Specifications',
            render: r => {
                const specs = r.specifications;
                if (!specs || typeof specs !== 'object') return '—';
                const entries = Object.entries(specs);
                return entries.length ? entries.map(([k, v]) => `${k}: ${v}`).join(', ') : '—';
            },
        },
        { key: 'item_type',      label: 'Item Type',     render: r => <Badge status={r.item_type} /> },
        {
            key: 'stock', label: 'Stock/Units',
            render: r => r.item_type === 'fixed_asset'
                ? `${r.available_units ?? 0} / ${r.total_units ?? 0} avail`
                : formatNumber(r.total_stock ?? 0),
        },
        { key: 'unit',        label: 'Unit',        render: r => r.unit?.abbreviation ?? '—' },
        ...(isAdmin ? [{ key: 'department', label: 'Department', render: (r: Item) => r.department?.name ?? '—' } as Column<Item>] : []),
        { key: 'modified_by', label: 'Modified By', render: r => r.modified_by ?? '—' },
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
            <Input label="Item Name" value={form.name} onChange={e => set('name', e.target.value)} error={err('name')} required />
            <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category_id} onChange={e => set('category_id', e.target.value)}
                    options={catOptions} error={err('category_id')} required />
                <Select label="Unit" value={form.unit_id} onChange={e => set('unit_id', e.target.value)}
                    options={unitOptions} error={err('unit_id')} required />
            </div>
            <Select label="Item Type" value={form.item_type} onChange={e => set('item_type', e.target.value)}
                options={typeOptions} error={err('item_type')} required
                disabled={!!editRow} />
            <div className="grid grid-cols-2 gap-4">
                <Input label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)} error={err('brand')} />
                <Input label="Model" value={form.model} onChange={e => set('model', e.target.value)} error={err('model')} />
            </div>
            <Textarea
                label="Specifications"
                value={form.specifications}
                onChange={e => set('specifications', e.target.value)}
                error={err('specifications')}
                placeholder={"Processor: Intel Core i5\nRAM: 16GB\nStorage: 512GB SSD"}
            />
            {form.item_type === 'consumable' && (
                <Input label="Min Stock Level" type="number" value={form.min_stock_level}
                    onChange={e => set('min_stock_level', e.target.value)} error={err('min_stock_level')} />
            )}
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Items" subtitle="Manage fixed-asset and consumable item definitions"
                action={
                    <div className="flex items-center gap-2">
                        <ExcelImportButton
                            onDownloadTemplate={() => api.downloadTemplate()}
                            onImport={(fd) => api.importExcel(fd)}
                            onSuccess={() => mutate()}
                            label="Import Excel"
                        />
                        <Button onClick={openCreate}><Plus className="h-4 w-4" />Add Item</Button>
                    </div>
                } />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or brand…">
                <select
                    value={typeFilter}
                    onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Types</option>
                    <option value="fixed_asset">Fixed Asset</option>
                    <option value="consumable">Consumable</option>
                </select>
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

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Item" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                {formFields}
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Item" size="lg"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                {formFields}
            </Modal>
            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete item "${deleteRow?.name}"?`} />
        </motion.div>
    );
}
