'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useUsers } from '@/hooks/api/useUsers';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useAuth } from '@/hooks/auth';
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
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react';
import { fadeUp } from '@/lib/motion';

interface User {
    id: number;
    name: string;
    email: string;
    user_type: 'system_administrator' | 'employee';
    department_id: number | null;
    department?: { id: number; name: string; code: string };
    permissions: string[] | null;
    created_at: string;
}

const PERMISSION_GROUPS = [
    {
        label: 'Administration',
        items: [
            { key: 'departments', label: 'Departments' },
            { key: 'units',       label: 'Units' },
            { key: 'employees',   label: 'Employees' },
            { key: 'users',       label: 'User Accounts' },
        ],
    },
    {
        label: 'Catalog',
        items: [
            { key: 'categories', label: 'Categories' },
            { key: 'suppliers',  label: 'Suppliers' },
            { key: 'items',      label: 'Items' },
        ],
    },
    {
        label: 'Fixed Assets',
        items: [
            { key: 'item-assets',       label: 'Assets' },
            { key: 'asset-assignments', label: 'Assignments' },
        ],
    },
    {
        label: 'Consumable Stock',
        items: [
            { key: 'inventory-stocks', label: 'Stock Levels' },
            { key: 'stock-receivals',  label: 'Stock Receivals' },
            { key: 'stock-issuances',  label: 'Stock Issuances' },
        ],
    },
];

const empty = {
    name: '', email: '', password: '', password_confirmation: '',
    user_type: '', department_id: '', permissions: [] as string[],
};

const roleOptions = [
    { value: 'system_administrator', label: 'System Administrator' },
    { value: 'employee',             label: 'Employee' },
];

export default function UsersPage() {
    const { user: authUser } = useAuth();
    const isAdmin = authUser?.user_type === 'system_administrator';

    const api     = useUsers();
    const deptApi = useDepartments();

    const { data: res, isLoading, mutate } = useSWR(
        isAdmin ? '/api/users' : null,
        () => api.index()
    );
    const { data: deptRes } = useSWR('/api/departments', () => deptApi.index());

    const rows: User[] = (res as { data?: { data?: User[] } })?.data?.data ?? [];
    const departments   = (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data?.data ?? [];

    const [createOpen, setCreateOpen] = useState(false);
    const [editRow, setEditRow]       = useState<User | null>(null);
    const [deleteRow, setDeleteRow]   = useState<User | null>(null);
    const [form, setForm]             = useState({ ...empty });
    const [errors, setErrors]         = useState<Record<string, string[]>>({});
    const [saving, setSaving]         = useState(false);
    const [deleting, setDeleting]     = useState(false);

    const [search, setSearch]         = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [page, setPage]             = useState(1);
    const PER_PAGE = 10;

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
    const err = (k: string) => errors[k]?.[0];

    const openCreate = () => { setForm({ ...empty }); setErrors({}); setCreateOpen(true); };
    const openEdit   = (row: User) => {
        setForm({
            name: row.name, email: row.email,
            password: '', password_confirmation: '',
            user_type: row.user_type,
            department_id: row.department_id ? String(row.department_id) : '',
            permissions: row.permissions ?? [],
        });
        setErrors({}); setEditRow(row);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: form.name, email: form.email, user_type: form.user_type,
                department_id: form.user_type === 'employee' && form.department_id
                    ? Number(form.department_id) : null,
                permissions: form.user_type === 'employee' ? form.permissions : null,
            };
            if (form.password) {
                payload.password = form.password;
                payload.password_confirmation = form.password_confirmation;
            }

            if (editRow) {
                await api.update(editRow.id, payload);
                toast.success('User updated.');
                setEditRow(null);
            } else {
                await api.store(payload);
                toast.success('User created.');
                setCreateOpen(false);
            }
            mutate();
        } catch (e: unknown) {
            const apiErr = e as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            if (apiErr.response?.data?.errors) setErrors(apiErr.response.data.errors);
            else toast.error(apiErr.response?.data?.message ?? 'An error occurred.');
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteRow) return;
        setDeleting(true);
        try {
            await api.destroy(deleteRow.id);
            toast.success('User deleted.');
            setDeleteRow(null);
            mutate();
        } catch (e: unknown) {
            const apiErr = e as { response?: { data?: { message?: string } } };
            toast.error(apiErr.response?.data?.message ?? 'Cannot delete this user.');
        } finally { setDeleting(false); }
    };

    const handleSearch = (val: string) => { setSearch(val); setPage(1); };

    const filtered = useMemo(() => {
        let result = rows;
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(r =>
                r.name?.toLowerCase().includes(q) ||
                r.email?.toLowerCase().includes(q)
            );
        }
        if (roleFilter) result = result.filter(r => r.user_type === roleFilter);
        return result;
    }, [rows, search, roleFilter]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const deptOptions = departments.map(d => ({ value: d.id, label: d.name }));

    const isEmployee = form.user_type === 'employee';

    const togglePermission = (key: string, checked: boolean) => {
        setForm(f => ({
            ...f,
            permissions: checked
                ? [...f.permissions, key]
                : f.permissions.filter(p => p !== key),
        }));
    };

    const columns: Column<User>[] = [
        { key: 'name',  label: 'Name' },
        { key: 'email', label: 'Email', render: r => (
            <span className="text-[#64748b]">{r.email}</span>
        )},
        { key: 'user_type', label: 'Role', render: r => (
            <div className="flex flex-col gap-1">
                <Badge
                    status={r.user_type}
                    label={r.user_type === 'system_administrator' ? 'Administrator' : 'Employee'}
                />
                {r.user_type === 'employee' && (
                    <span className="text-xs text-[#94a3b8]">
                        {(r.permissions ?? []).length} permission{(r.permissions ?? []).length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>
        )},
        { key: 'department', label: 'Department', render: r => r.department?.name ?? (
            <span className="text-[#94a3b8]">—</span>
        )},
        {
            key: 'actions', label: 'Actions', className: 'w-24 text-right',
            render: row => (
                <div className="flex justify-end gap-1">
                    <button
                        onClick={() => openEdit(row)}
                        className="p-1.5 text-[#94a3b8] hover:text-[#6366f1] rounded-lg hover:bg-indigo-50 transition-colors"
                        title="Edit user"
                    >
                        <Pencil className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setDeleteRow(row)}
                        disabled={row.id === authUser?.id}
                        className="p-1.5 text-[#94a3b8] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={row.id === authUser?.id ? 'Cannot delete own account' : 'Delete user'}
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            ),
        },
    ];

    const FormBody = () => (
        <div className="space-y-4">
            <Input
                label="Full Name"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={err('name')}
                placeholder="Juan dela Cruz"
                required
            />
            <Input
                label="Email Address"
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                error={err('email')}
                placeholder="user@example.com"
                required
            />
            <div className="grid grid-cols-2 gap-4">
                <Select
                    label="Role"
                    value={form.user_type}
                    onChange={e => {
                        set('user_type', e.target.value);
                        if (e.target.value === 'system_administrator') set('department_id', '');
                    }}
                    options={roleOptions}
                    placeholder="Select role…"
                    error={err('user_type')}
                    required
                />
                <Select
                    label="Department"
                    value={form.department_id}
                    onChange={e => set('department_id', e.target.value)}
                    options={deptOptions}
                    placeholder="Select department…"
                    error={err('department_id')}
                    disabled={!isEmployee}
                    required={isEmployee}
                />
            </div>
            <div className="border-t border-[#f1f5f9] pt-4">
                {editRow && (
                    <p className="text-xs text-[#94a3b8] mb-3">
                        Leave password fields blank to keep the current password.
                    </p>
                )}
                <div className="grid grid-cols-2 gap-4">
                    <Input
                        label={editRow ? 'New Password' : 'Password'}
                        type="password"
                        value={form.password}
                        onChange={e => set('password', e.target.value)}
                        error={err('password')}
                        placeholder="••••••••"
                        required={!editRow}
                        autoComplete="new-password"
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        value={form.password_confirmation}
                        onChange={e => set('password_confirmation', e.target.value)}
                        error={err('password_confirmation')}
                        placeholder="••••••••"
                        required={!editRow}
                        autoComplete="new-password"
                    />
                </div>
            </div>
            {isEmployee && (
                <div className="border-t border-[#f1f5f9] pt-4">
                    <p className="text-sm font-medium text-[#1e293b] mb-3">Access Permissions</p>
                    <div className="grid grid-cols-1 gap-4">
                        {PERMISSION_GROUPS.map(group => (
                            <div key={group.label}>
                                <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] mb-2">
                                    {group.label}
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    {group.items.map(item => (
                                        <label key={item.key} className="flex items-center gap-2.5 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={form.permissions.includes(item.key)}
                                                onChange={e => togglePermission(item.key, e.target.checked)}
                                                className="h-4 w-4 rounded border-[#e2e8f0] accent-[#6366f1]"
                                            />
                                            <span className="text-sm text-[#1e293b] group-hover:text-[#6366f1] transition-colors">
                                                {item.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    if (!isAdmin) {
        return (
            <motion.div
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                className="flex flex-col items-center justify-center py-24 text-center"
            >
                <div className="bg-red-50 rounded-2xl p-5 mb-4">
                    <ShieldAlert className="h-10 w-10 text-red-400" />
                </div>
                <h2 className="text-lg font-semibold text-[#1e293b]">Access Denied</h2>
                <p className="text-sm text-[#64748b] mt-1">
                    Only system administrators can manage user accounts.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
            <PageHeader
                title="User Accounts"
                subtitle="Manage system users and their access roles"
                action={
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" />
                        Add User
                    </Button>
                }
            />

            <FilterBar search={search} onSearchChange={handleSearch} placeholder="Search by name or email…">
                <select
                    value={roleFilter}
                    onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
                    className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-2 bg-[#f8fafc] text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-[#6366f1]"
                >
                    <option value="">All Roles</option>
                    <option value="system_administrator">Administrator</option>
                    <option value="employee">Employee</option>
                </select>
            </FilterBar>

            <DataTable
                columns={columns}
                data={paged}
                loading={isLoading}
                keyExtractor={r => r.id}
            />
            <Pagination
                page={page}
                totalPages={totalPages}
                total={filtered.length}
                perPage={PER_PAGE}
                onPageChange={setPage}
            />

            <Modal
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                title="Add User Account"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} loading={saving}>Create User</Button>
                    </>
                }
            >
                <FormBody />
            </Modal>

            <Modal
                open={!!editRow}
                onClose={() => setEditRow(null)}
                title="Edit User Account"
                size="lg"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditRow(null)}>Cancel</Button>
                        <Button onClick={handleSave} loading={saving}>Update User</Button>
                    </>
                }
            >
                <FormBody />
            </Modal>

            <ConfirmDialog
                open={!!deleteRow}
                onClose={() => setDeleteRow(null)}
                onConfirm={handleDelete}
                loading={deleting}
                title="Delete User Account"
                message={`Permanently delete "${deleteRow?.name}" (${deleteRow?.email})? This action cannot be undone.`}
            />
        </motion.div>
    );
}
