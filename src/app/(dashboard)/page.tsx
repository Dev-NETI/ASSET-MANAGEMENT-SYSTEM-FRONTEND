'use client';

import useSWR from 'swr';
import StatCard from '@/components/shared/StatCard';
import Spinner from '@/components/ui/Spinner';
import { useDepartments } from '@/hooks/api/useDepartments';
import { useItems } from '@/hooks/api/useItems';
import { useEmployees } from '@/hooks/api/useEmployees';
import { useItemAssets } from '@/hooks/api/useItemAssets';
import { useInventoryStocks } from '@/hooks/api/useInventoryStocks';
import { useAuth } from '@/hooks/auth';
import {
    Building2, Package, Users, Monitor, Archive,
    AlertTriangle, ClipboardList
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

export default function DashboardPage() {
    const { user } = useAuth();
    const isAdmin = user?.user_type === 'system_administrator';

    const departments  = useDepartments();
    const items        = useItems();
    const employees    = useEmployees();
    const itemAssets   = useItemAssets();
    const stocks       = useInventoryStocks();

    const { data: deptData,   isLoading: l1 } = useSWR('dashboard-dept',    () => departments.index());
    const { data: itemData,   isLoading: l2 } = useSWR('dashboard-items',   () => items.index());
    const { data: empData,    isLoading: l3 } = useSWR('dashboard-emp',     () => employees.index());
    const { data: assetData,  isLoading: l4 } = useSWR('dashboard-assets',  () => itemAssets.index());
    const { data: stockData,  isLoading: l5 } = useSWR('dashboard-stocks',  () => stocks.index());

    const loading = l1 || l2 || l3 || l4 || l5;

    const deptList   = (deptData as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const itemList   = (itemData as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const empList    = (empData  as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const assetList  = (assetData as { data?: { data?: unknown[] } })?.data?.data ?? [];
    const stockList  = (stockData as { data?: { data?: unknown[] } })?.data?.data ?? [];

    const fixedAssets  = (itemList as { item_type?: string }[]).filter(i => i.item_type === 'fixed_asset');
    const consumables  = (itemList as { item_type?: string }[]).filter(i => i.item_type === 'consumable');
    const activeAssets = (assetList as { status?: string }[]).filter(a => a.status === 'assigned');
    const lowStock     = (stockList as { is_below_minimum?: boolean }[]).filter(s => s.is_below_minimum);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div>
            <motion.div
                className="mb-8"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
            >
                <h1 className="text-2xl font-bold text-[#1e293b] border-l-4 border-[#6366f1] pl-3">Dashboard</h1>
                <p className="text-sm text-[#64748b] mt-1 pl-3">Overview of your inventory system</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {isAdmin && (
                    <StatCard
                        index={0}
                        label="Departments"
                        value={deptList.length}
                        icon={<Building2 className="h-6 w-6" />}
                        color="bg-[#9bc6ef]"
                    />
                )}
                <StatCard
                    index={1}
                    label="Total Items"
                    value={itemList.length}
                    icon={<Package className="h-6 w-6" />}
                    color="bg-[#cdac6a]"
                />
                {isAdmin && (
                    <StatCard
                        index={2}
                        label="Employees"
                        value={empList.length}
                        icon={<Users className="h-6 w-6" />}
                        color="bg-[#9bc6ef]"
                    />
                )}
                <StatCard
                    index={3}
                    label="Fixed Assets"
                    value={fixedAssets.length}
                    icon={<Monitor className="h-6 w-6" />}
                    color="bg-[#cdac6a]"
                    sub="Registered asset types"
                />
                <StatCard
                    index={4}
                    label="Consumable Items"
                    value={consumables.length}
                    icon={<Archive className="h-6 w-6" />}
                    color="bg-[#9bc6ef]"
                    sub="Registered consumable types"
                />
                <StatCard
                    index={5}
                    label="Active Assignments"
                    value={activeAssets.length}
                    icon={<ClipboardList className="h-6 w-6" />}
                    color="bg-[#cdac6a]"
                    sub="Currently assigned units"
                />
                <StatCard
                    index={6}
                    label="Low Stock Alerts"
                    value={lowStock.length}
                    icon={<AlertTriangle className="h-6 w-6" />}
                    color={lowStock.length > 0 ? 'bg-red-500' : 'bg-gray-400'}
                    sub="Items below minimum level"
                />
            </div>
        </div>
    );
}
