"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Specification {
  [key: string]: string | number;
}

interface AssetDetail {
  id: number;
  item_code: string;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: string | null;
  warranty_expiry: string | null;
  condition: string;
  status: string;
  notes: string | null;
  item: {
    name: string;
    brand: string | null;
    model: string | null;
    specifications: Specification | null;
  } | null;
  department: { name: string } | null;
  active_assignment: {
    assigned_at: string;
    purpose: string | null;
    assignable: {
      full_name?: string;
      name?: string;
    } | null;
  } | null;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  available: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "Available",
  },
  assigned: { bg: "bg-blue-100", text: "text-blue-700", label: "Assigned" },
  under_repair: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "Under Repair",
  },
  disposed: { bg: "bg-red-100", text: "text-red-700", label: "Disposed" },
};

const CONDITION_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  new: { bg: "bg-sky-100", text: "text-sky-700", label: "New" },
  good: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Good" },
  fair: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Fair" },
  poor: { bg: "bg-orange-100", text: "text-orange-700", label: "Poor" },
  damaged: { bg: "bg-red-100", text: "text-red-700", label: "Damaged" },
  lost: { bg: "bg-gray-100", text: "text-gray-700", label: "Lost" },
  disposed: { bg: "bg-red-100", text: "text-red-700", label: "Disposed" },
};

function Badge({ value, map }: { value: string; map: typeof STATUS_STYLES }) {
  const style = map[value] ?? {
    bg: "bg-gray-100",
    text: "text-gray-600",
    label: value,
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style.bg} ${style.text}`}
    >
      {style.label}
    </span>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start py-3 border-b border-gray-100 last:border-0">
      <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wide w-36 shrink-0 mb-0.5 sm:mb-0 pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-gray-800 font-medium">{value}</dd>
    </div>
  );
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function AssetDetailPage() {
  const { code } = useParams<{ code: string }>();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";
    fetch(`${backendUrl}/api/item-assets/code/${encodeURIComponent(code)}`, {
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const json = await res.json();
        setAsset(json?.data ?? null);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-4 border-[#6366f1] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading asset details…</p>
        </div>
      </div>
    );
  }

  if (notFound || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-xl font-bold text-gray-800 mb-1">
            Asset Not Found
          </h1>
          <p className="text-sm text-gray-500">
            No asset with code <strong>{code}</strong> exists.
          </p>
        </div>
      </div>
    );
  }

  const assigneeName =
    asset.active_assignment?.assignable?.full_name ??
    asset.active_assignment?.assignable?.name ??
    null;

  const specs = asset.item?.specifications;
  const specText =
    specs && typeof specs === "object"
      ? Object.entries(specs)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar */}
      <div className="bg-[#1a1f36] text-white px-4 py-4 flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-[#8b92b8] uppercase tracking-widest">
            Inventory System
          </span>
          <span className="text-base font-semibold text-white leading-tight">
            Fixed Asset Detail
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Item Code card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Item Code
              </p>
              <p className="font-mono text-2xl font-bold text-[#1a1f36] tracking-wide">
                {asset.item_code}
              </p>
              <p className="text-base text-gray-700 mt-1 font-medium">
                {asset.item?.name}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge value={asset.status} map={STATUS_STYLES} />
              <Badge value={asset.condition} map={CONDITION_STYLES} />
            </div>
          </div>
        </div>

        {/* Asset details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 pt-1 pb-2">
          <p className="text-xs font-semibold text-[#6366f1] uppercase tracking-wide pt-4 pb-2">
            Item Information
          </p>
          <dl>
            <Row label="Brand" value={asset.item?.brand} />
            <Row label="Model" value={asset.item?.model} />
            <Row
              label="Specification"
              value={
                specText ? (
                  <span className="whitespace-pre-line">{specText}</span>
                ) : null
              }
            />
          </dl>
        </div>

        {/* Asset properties */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 pt-1 pb-2">
          <p className="text-xs font-semibold text-[#6366f1] uppercase tracking-wide pt-4 pb-2">
            Asset Properties
          </p>
          <dl>
            <Row label="Department" value={asset.department?.name} />
            <Row label="Serial No." value={asset.serial_number} />
            <Row
              label="Purchase Date"
              value={formatDate(asset.purchase_date)}
            />
            <Row label="Warranty" value={formatDate(asset.warranty_expiry)} />
            <Row label="Notes" value={asset.notes} />
          </dl>
        </div>

        {/* Assignment */}
        {asset.active_assignment && (
          <div className="bg-blue-50 rounded-2xl border border-blue-100 px-5 pt-1 pb-2">
            <p className="text-xs font-semibold text-blue-500 uppercase tracking-wide pt-4 pb-2">
              Currently Assigned
            </p>
            <dl>
              <Row label="Assigned To" value={assigneeName} />
              <Row
                label="Assigned On"
                value={formatDate(asset.active_assignment.assigned_at)}
              />
              <Row label="Purpose" value={asset.active_assignment.purpose} />
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
