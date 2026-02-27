'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useItemAssets } from '@/hooks/api/useItemAssets';
import { useItems } from '@/hooks/api/useItems';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useEmployees } from '@/hooks/api/useEmployees';
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
import { Plus, Pencil, Trash2, UserCheck, Undo2 } from 'lucide-react';
import { formatDate, formatCurrency, getCurrentDate } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface ItemAsset {
    id: number;
    item_id: number;
    item_code: string;
    serial_number: string | null;
    purchase_date: string | null;
    purchase_price: number | null;
    warranty_expiry: string | null;
    condition: string;
    department_id: number | null;
    status: string;
    notes: string | null;
    item?: { id: number; name: string };
    department?: { id: number; name: string } | null;
    modified_by?: string | null;
}

const emptyAsset  = { item_id: '', item_code: '', serial_number: '', purchase_date: '', purchase_price: '', warranty_expiry: '', condition: 'new', department_id: '', notes: '' };
const emptyAssign = { assignable_type: 'employee', assignable_id: '', assigned_at: '', expected_return_date: '', condition_on_assign: 'good', purpose: '', notes: '' };
const emptyReturn = { returned_at: '', condition_on_return: 'good', notes: '' };

const conditionOptions = [
    { value: 'new', label: 'New' }, { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' },
    { value: 'damaged', label: 'Damaged' },
];

export default function ItemAssetsPage() {
    const api      = useItemAssets();
    const itemApi  = useItems();
    const deptApi  = useDepartments();
    const empApi   = useEmployees();

    const { data: res,     isLoading, mutate } = useSWR('/api/item-assets',  () => api.index());
    const { data: itemRes }                    = useSWR('/api/items-fa',     () => itemApi.index());
    const { data: deptRes }                    = useSWR('/api/departments',  () => deptApi.index());
    const { data: empRes  }                    = useSWR('/api/employees',    () => empApi.index());

    const rows: ItemAsset[]  = (res as { data?: { data?: ItemAsset[] } })?.data?.data ?? [];
    const allItems           = (itemRes as { data?: { data?: { id: number; name: string; item_type: string }[] } })?.data?.data ?? [];
    const fixedItems         = allItems.filter((i: { item_type: string }) => i.item_type === 'fixed_asset');
    const departments        = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];
    const employees          = (empRes  as { data?: { data?: { id: number; first_name: string; last_name: string; full_name?: string }[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen]   = useState(false);
    const [editRow, setEditRow]         = useState<ItemAsset | null>(null);
    const [deleteRow, setDeleteRow]     = useState<ItemAsset | null>(null);
    const [assignRow, setAssignRow]     = useState<ItemAsset | null>(null);
    const [returnRow, setReturnRow]     = useState<ItemAsset | null>(null);
    const [form, setForm]               = useState({ ...emptyAsset });
    const [assignForm, setAssignForm]   = useState({ ...emptyAssign });
    const [returnForm, setReturnForm]   = useState({ ...emptyReturn });
    const [errors, setErrors]           = useState<Record<string, string[]>>({});
    const [saving, setSaving]           = useState(false);
    const [deleting, setDeleting]       = useState(false);

    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]               = useState(1);
    const PER_PAGE = 10;

    const set  = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const setA = (k: string, v: string) => setAssignForm(f => ({ ...f, [k]: v }));
    const setR = (k: string, v: string) => setReturnForm(f => ({ ...f, [k]: v }));
    const err  = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...emptyAsset }); setErrors({}); setCreateOpen(true); };
    const openEdit   = (row: ItemAsset) => {
        setForm({
            item_id: String(row.item_id), item_code: row.item_code, serial_number: row.serial_number ?? '',
            purchase_date: row.purchase_date ? formatDate(row.purchase_date, 'yyyy-mm-dd') : '',
            purchase_price: row.purchase_price != null ? String(row.purchase_price) : '',
            warranty_expiry: row.warranty_expiry ? formatDate(row.warranty_expiry, 'yyyy-mm-dd') : '',
            condition: row.condition, department_id: row.department_id ? String(row.department_id) : '', notes: row.notes ?? '',
        });
        setErrors({}); setEditRow(row);
    };
    const openAssign = (row: ItemAsset) => {
        setAssignForm({ ...emptyAssign, assigned_at: getCurrentDate() });
        setErrors({}); setAssignRow(row);
    };
    const openReturn = (row: ItemAsset) => {
        setReturnForm({ ...emptyReturn, returned_at: getCurrentDate() });
        setErrors({}); setReturnRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form, item_id: Number(form.item_id),
                department_id: form.department_id ? Number(form.department_id) : null,
                purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
            };
            if (editRow) { await api.update(editRow.id, payload); toast.success('Asset updated.'); setEditRow(null); }
            else         { await api.store(payload); toast.success('Asset created.'); setCreateOpen(false); }
            mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error('An error occurred.');
        } finally { setSaving(false); }
    };

    const handleAssign = async () => {
        if (!assignRow) return;
        setSaving(true);
        try {
            const payload = { ...assignForm, assignable_id: Number(assignForm.assignable_id) };
            await api.assign(assignRow.id, payload);
            toast.success('Asset assigned successfully.');
            setAssignRow(null); mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error('Failed to assign asset.');
        } finally { setSaving(false); }
    };

    const handleReturn = async () => {
        if (!returnRow) return;
        setSaving(true);
        try {
            await api.returnAsset(returnRow.id, returnForm);
            toast.success('Asset returned.');
            setReturnRow(null); mutate();
        } catch (e: unknown) {
            const er = e as { response?: { data?: { errors?: Record<string, string[]> } } };
            if (er.response?.data?.errors) setErrors(er.response.data.errors);
            else toast.error('Failed to return asset.');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        try { await api.destroy(deleteRow.id); toast.success('Asset deleted.'); setDeleteRow(null); mutate(); }
        catch { toast.error('Cannot delete: asset has active assignment.'); }
        finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.item_code?.toLowerCase().includes(q) ||
                r.item?.name?.toLowerCase().includes(q) ||
                r.serial_number?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }
        return result;
    }, [rows, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const itemOptions       = fixedItems.map((i: { id: number; name: string }) => ({ value: i.id, label: i.name }));
    const deptOptions       = departments.map(d => ({ value: d.id, label: d.name }));
    const empOptions        = employees.map(e => ({ value: e.id, label: e.full_name ?? `${e.first_name} ${e.last_name}` }));
    const assignableOptions = assignForm.assignable_type === 'employee' ? empOptions : deptOptions;

    const columns: Column<ItemAsset>[] = [
        { key: 'item_code',      label: 'Item Code',   className: 'font-mono' },
        { key: 'item',           label: 'Item',        render: r => r.item?.name ?? '—' },
        { key: 'department',     label: 'Dept.',       render: r => r.department?.name ?? '—' },
        { key: 'condition',      label: 'Condition',   render: r => <Badge status={r.condition} /> },
        { key: 'status',         label: 'Status',      render: r => <Badge status={r.status} /> },
        { key: 'purchase_price', label: 'Value',       render: r => formatCurrency(r.purchase_price) },
        { key: 'modified_by',    label: 'Modified By', render: r => r.modified_by ?? '—' },
        {
            key: 'actions', label: 'Actions', className: 'w-48 text-right',
            render: row => (
                <div className="flex justify-end gap-1 flex-wrap">
                    {row.status === 'available' && (
                        <button onClick={() => openAssign(row)} title="Assign" className="p-1.5 text-gray-400 hover:text-green-600 rounded"><UserCheck className="h-4 w-4" /></button>
                    )}
                    {row.status === 'assigned' && (
                        <button onClick={() => openReturn(row)} title="Return" className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Undo2 className="h-4 w-4" /></button>
                    )}
                    <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setDeleteRow(row)} className="p-1.5 text-gray-400 hover:text-red-600 rounded"><Trash2 className="h-4 w-4" /></button>
                </div>
            ),
        },
    ];

    const AssetFormBody = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <Select label="Item" value={form.item_id} onChange={e => set('item_id', e.target.value)} options={itemOptions} error={err('item_id')} required disabled={!!editRow} />
                <Input label="Item Code" value={form.item_code} onChange={e => set('item_code', e.target.value)} error={err('item_code')} required disabled={!!editRow} placeholder="e.g. NOD-LAP-001" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Serial Number" value={form.serial_number} onChange={e => set('serial_number', e.target.value)} error={err('serial_number')} />
                <Select label="Condition" value={form.condition} onChange={e => set('condition', e.target.value)} options={conditionOptions} error={err('condition')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Purchase Date" type="date" value={form.purchase_date} onChange={e => set('purchase_date', e.target.value)} error={err('purchase_date')} />
                <Input label="Purchase Price" type="number" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} error={err('purchase_price')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Warranty Expiry" type="date" value={form.warranty_expiry} onChange={e => set('warranty_expiry', e.target.value)} error={err('warranty_expiry')} />
                <Select label="Department" value={form.department_id} onChange={e => set('department_id', e.target.value)} options={deptOptions} placeholder="None" error={err('department_id')} />
            </div>
            <Textarea label="Notes" value={form.notes} onChange={e => set('notes', e.target.value)} error={err('notes')} />
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Fixed Assets" subtitle="Manage physical fixed-asset units with unique item codes"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Asset</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by code, item name, or serial…">
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Statuses</option>
                    <option value="available">Available</option>
                    <option value="assigned">Assigned</option>
                    <option value="under_repair">Under Repair</option>
                    <option value="disposed">Disposed</option>
                </select>
            </FilterBar>
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            {/* Create/Edit modals */}
            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Register Asset" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                <AssetFormBody />
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Asset" size="lg"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                <AssetFormBody />
            </Modal>

            {/* Assign Modal */}
            <Modal open={!!assignRow} onClose={() => setAssignRow(null)} title={`Assign: ${assignRow?.item_code}`}
                footer={<><Button variant="secondary" onClick={() => setAssignRow(null)}>Cancel</Button><Button onClick={handleAssign} loading={saving}>Assign</Button></>}>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select label="Assign To" value={assignForm.assignable_type}
                            onChange={e => { setA('assignable_type', e.target.value); setA('assignable_id', ''); }}
                            options={[{ value: 'employee', label: 'Employee' }, { value: 'department', label: 'Department' }]} required />
                        <Select label={assignForm.assignable_type === 'employee' ? 'Employee' : 'Department'}
                            value={assignForm.assignable_id} onChange={e => setA('assignable_id', e.target.value)}
                            options={assignableOptions} required error={err('assignable_id')} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Assigned Date" type="date" value={assignForm.assigned_at} onChange={e => setA('assigned_at', e.target.value)} required />
                        <Input label="Expected Return" type="date" value={assignForm.expected_return_date} onChange={e => setA('expected_return_date', e.target.value)} />
                    </div>
                    <Select label="Condition on Assign" value={assignForm.condition_on_assign} onChange={e => setA('condition_on_assign', e.target.value)} options={conditionOptions} required />
                    <Input label="Purpose" value={assignForm.purpose} onChange={e => setA('purpose', e.target.value)} />
                    <Textarea label="Notes" value={assignForm.notes} onChange={e => setA('notes', e.target.value)} />
                </div>
            </Modal>

            {/* Return Modal */}
            <Modal open={!!returnRow} onClose={() => setReturnRow(null)} title={`Return: ${returnRow?.item_code}`} size="sm"
                footer={<><Button variant="secondary" onClick={() => setReturnRow(null)}>Cancel</Button><Button onClick={handleReturn} loading={saving}>Confirm Return</Button></>}>
                <div className="space-y-4">
                    <Input label="Return Date" type="date" value={returnForm.returned_at} onChange={e => setR('returned_at', e.target.value)} required />
                    <Select label="Condition on Return" value={returnForm.condition_on_return} onChange={e => setR('condition_on_return', e.target.value)} options={conditionOptions} required />
                    <Textarea label="Notes" value={returnForm.notes} onChange={e => setR('notes', e.target.value)} />
                </div>
            </Modal>

            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete asset "${deleteRow?.item_code}"?`} />
        </motion.div>
    );
}
