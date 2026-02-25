'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useEmployees } from '@/hooks/api/useEmployees';
import { useDepartments } from '@/hooks/api/useDepartments';
import PageHeader from '@/components/shared/PageHeader';
import FilterBar from '@/components/shared/FilterBar';
import DataTable, { Column } from '@/components/shared/DataTable';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

interface Employee {
    id: number;
    employee_id: string;
    first_name: string;
    last_name: string;
    full_name?: string;
    department_id: number;
    position: string | null;
    email: string | null;
    phone: string | null;
    status: 'active' | 'inactive';
    department?: { id: number; name: string };
}

const empty = { employee_id: '', first_name: '', last_name: '', department_id: '', position: '', email: '', phone: '', status: 'active' };

export default function EmployeesPage() {
    const api     = useEmployees();
    const deptApi = useDepartments();

    const { data: res,     isLoading, mutate } = useSWR('/api/employees',   () => api.index());
    const { data: deptRes }                    = useSWR('/api/departments', () => deptApi.index());

    const rows: Employee[] = (res as { data?: { data?: Employee[] } })?.data?.data ?? [];
    const departments      = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<Employee | null>(null);
    const [deleteRow, setDeleteRow]   = useState<Employee | null>(null);
    const [form, setForm]             = useState({ ...empty });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);
    const [deleting, setDeleting]     = useState(false);

    const [search, setSearch]           = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page, setPage]               = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...empty }); setErrors({}); setCreateOpen(true); };
    const openEdit = (row: Employee) => {
        setForm({
            employee_id: row.employee_id, first_name: row.first_name, last_name: row.last_name,
            department_id: String(row.department_id), position: row.position ?? '',
            email: row.email ?? '', phone: row.phone ?? '', status: row.status,
        });
        setErrors({}); setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { ...form, department_id: Number(form.department_id) };
            if (editRow) { await api.update(editRow.id, payload); toast.success('Employee updated.'); setEditRow(null); }
            else         { await api.store(payload); toast.success('Employee created.'); setCreateOpen(false); }
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
        try { await api.destroy(deleteRow.id); toast.success('Employee deleted.'); setDeleteRow(null); mutate(); }
        catch { toast.error('Cannot delete: employee has active assignments.'); }
        finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.first_name?.toLowerCase().includes(q) ||
                r.last_name?.toLowerCase().includes(q) ||
                r.employee_id?.toLowerCase().includes(q) ||
                r.position?.toLowerCase().includes(q)
            );
        }
        if (statusFilter) {
            result = result.filter(r => r.status === statusFilter);
        }
        return result;
    }, [rows, search, statusFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const deptOptions   = departments.map(d => ({ value: d.id, label: d.name }));
    const statusOptions = [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }];

    const columns: Column<Employee>[] = [
        { key: 'employee_id', label: 'Employee ID', className: 'font-mono' },
        { key: 'full_name',   label: 'Name',       render: r => r.full_name ?? `${r.first_name} ${r.last_name}` },
        { key: 'department',  label: 'Department', render: r => r.department?.name ?? '—' },
        { key: 'position',    label: 'Position',   render: r => r.position ?? '—' },
        { key: 'email',       label: 'Email',      render: r => r.email ?? '—' },
        { key: 'status',      label: 'Status',     render: r => <Badge status={r.status} /> },
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
                <Input label="Employee ID" value={form.employee_id} onChange={e => set('employee_id', e.target.value)} error={err('employee_id')} required disabled={!!editRow} />
                <Select label="Department" value={form.department_id} onChange={e => set('department_id', e.target.value)} options={deptOptions} error={err('department_id')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={form.first_name} onChange={e => set('first_name', e.target.value)} error={err('first_name')} required />
                <Input label="Last Name" value={form.last_name} onChange={e => set('last_name', e.target.value)} error={err('last_name')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Position" value={form.position} onChange={e => set('position', e.target.value)} error={err('position')} />
                <Select label="Status" value={form.status} onChange={e => set('status', e.target.value)} options={statusOptions} error={err('status')} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} error={err('email')} />
                <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} error={err('phone')} />
            </div>
        </div>
    );

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader title="Employees" subtitle="Manage staff records per department"
                action={<Button onClick={openCreate}><Plus className="h-4 w-4" />Add Employee</Button>} />
            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name, ID, or position…">
                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef]"
                >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </FilterBar>
            <DataTable columns={columns} data={paged} loading={isLoading} keyExtractor={r => r.id} />
            <Pagination page={page} totalPages={totalPages} total={filtered.length} perPage={PER_PAGE} onPageChange={setPage} />

            <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Add Employee" size="lg"
                footer={<><Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Save</Button></>}>
                <FormBody />
            </Modal>
            <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Edit Employee" size="lg"
                footer={<><Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button><Button onClick={handleSave} loading={saving}>Update</Button></>}>
                <FormBody />
            </Modal>
            <ConfirmDialog open={!!deleteRow} onClose={() => setDeleteRow(null)} onConfirm={handleDelete} loading={deleting}
                message={`Delete employee "${deleteRow?.first_name} ${deleteRow?.last_name}"?`} />
        </motion.div>
    );
}
