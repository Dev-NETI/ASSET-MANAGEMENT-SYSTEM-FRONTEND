"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { jsPDF } from "jspdf";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/auth";
import { useItemAssets } from "@/hooks/api/useItemAssets";
import { useItems } from "@/hooks/api/useItems";
import { useDepartments } from "@/hooks/api/useDepartments";
import { useEmployees } from "@/hooks/api/useEmployees";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { Column } from "@/components/shared/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Badge from "@/components/ui/Badge";
import {
  Plus,
  Pencil,
  Trash2,
  UserCheck,
  Undo2,
  QrCode,
  Eye,
  SlidersHorizontal,
  Download,
  Search,
  X,
} from "lucide-react";
import { formatDate, formatCurrency, getCurrentDate } from "@/lib/utils";
import { fadeUp } from "@/lib/motion";

interface ItemAsset {
  id: number;
  item_id: number;
  item_code: string;
  serial_number: string | null;
  mac_address: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  condition: string;
  department_id: number | null;
  status: string;
  notes: string | null;
  delivery_receipt_no: string | null;
  delivery_receipt_file: string | null;
  item?: {
    id: number;
    name: string;
    brand?: string | null;
    model?: string | null;
    specifications?: string[] | Record<string, string> | null;
    category?: { id: number; name: string } | null;
  };
  department?: { id: number; name: string } | null;
  modified_by?: string | null;
  created_at?: string | null;
}

const emptyAsset = {
  item_id: "",
  item_code: "",
  serial_number: "",
  mac_address: "",
  purchase_date: "",
  purchase_price: "",
  warranty_expiry: "",
  condition: "new",
  department_id: "",
  notes: "",
  delivery_receipt_no: "",
};
const emptyAssign = {
  assignable_type: "employee",
  assignable_id: "",
  assignable_label: "",
  assigned_at: "",
  expected_return_date: "",
  condition_on_assign: "good",
  purpose: "",
  notes: "",
};
const emptyReturn = { returned_at: "", condition_on_return: "good", notes: "" };

const conditionOptions = [
  { value: "new", label: "New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
  { value: "damaged", label: "Damaged" },
];

function generateNextItemCode(existingCodes: string[]): string | null {
  if (existingCodes.length === 0) return null;
  let maxNum = -1;
  let maxCode = "";
  for (const code of existingCodes) {
    const match = code.match(/^(.*?)(\d+)$/);
    if (match) {
      const n = parseInt(match[2], 10);
      if (n > maxNum) {
        maxNum = n;
        maxCode = code;
      }
    }
  }
  if (maxNum === -1 || !maxCode) return null;
  const match = maxCode.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  return match[1] + String(maxNum + 1).padStart(match[2].length, "0");
}

function generateSequentialCodes(
  startCode: string,
  quantity: number,
): string[] {
  const codes: string[] = [startCode];
  for (let i = 1; i < quantity; i++) {
    const next = generateNextItemCode([codes[codes.length - 1]]);
    if (!next) break;
    codes.push(next);
  }
  return codes;
}

// Directly computes the Nth code without iterating — O(1) for preview of last code.
function generateNthCode(startCode: string, n: number): string | null {
  const match = startCode.match(/^(.*?)(\d+)$/);
  if (!match) return null;
  const num = parseInt(match[2], 10) + n - 1;
  return match[1] + String(num).padStart(match[2].length, "0");
}

export default function ItemAssetsPage() {
  const { user } = useAuth();
  const isAdmin = user?.user_type === "system_administrator";

  const api = useItemAssets();
  const itemApi = useItems();
  const deptApi = useDepartments();
  const empApi = useEmployees();

  const {
    data: res,
    isLoading,
    mutate,
  } = useSWR("/api/item-assets", () => api.index());
  const { data: itemRes } = useSWR("/api/items-fa", () => itemApi.index());
  const { data: deptRes } = useSWR("/api/departments", () => deptApi.index());
  const { data: empRes } = useSWR("/api/employees", () => empApi.index());

  const rows: ItemAsset[] =
    (res as { data?: { data?: ItemAsset[] } })?.data?.data ?? [];
  const allItems =
    (
      itemRes as {
        data?: { data?: { id: number; name: string; item_type: string }[] };
      }
    )?.data?.data ?? [];
  const fixedItems = allItems.filter(
    (i: { item_type: string }) => i.item_type === "fixed_asset",
  );
  const departments =
    (
      deptRes as {
        data?: { data?: { id: number; name: string; code: string }[] };
      }
    )?.data?.data ?? [];
  const employees =
    (
      empRes as {
        data?: {
          data?: {
            id: number;
            first_name: string;
            last_name: string;
            full_name?: string;
          }[];
        };
      }
    )?.data?.data ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<ItemAsset | null>(null);
  const [deleteRow, setDeleteRow] = useState<ItemAsset | null>(null);
  const [assignRow, setAssignRow] = useState<ItemAsset | null>(null);
  const [returnRow, setReturnRow] = useState<ItemAsset | null>(null);
  const [form, setForm] = useState({ ...emptyAsset });
  const [assignForm, setAssignForm] = useState({ ...emptyAssign });
  const [returnForm, setReturnForm] = useState({ ...emptyReturn });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [viewRow, setViewRow] = useState<ItemAsset | null>(null);
  const [drFile, setDrFile] = useState<File | null>(null);
  const [drView, setDrView] = useState<{ url: string; label: string } | null>(
    null,
  );
  const [isMultiple, setIsMultiple] = useState(false);
  const [quantity, setQuantity] = useState("2");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [generatingQR, setGeneratingQR] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrItems, setQrItems] = useState<
    Array<{
      item_code: string;
      item_name: string;
      department: string;
      qr: string;
    }>
  >([]);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemFilter, setItemFilter] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set([
      "item_code",
      "item",
      "department",
      "condition",
      "status",
      "purchase_price",
      "delivery_receipt",
    ]),
  );
  const colsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node))
        setColsOpen(false);
    };
    if (colsOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [colsOpen]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setA = (k: string, v: string) =>
    setAssignForm((f) => ({ ...f, [k]: v }));
  const setR = (k: string, v: string) =>
    setReturnForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k]?.[0];

  const openCreate = () => {
    setForm({ ...emptyAsset });
    setErrors({});
    setDrFile(null);
    setIsMultiple(false);
    setQuantity("2");
    setCreateOpen(true);
  };
  const openEdit = (row: ItemAsset) => {
    setForm({
      item_id: String(row.item_id),
      item_code: row.item_code,
      serial_number: row.serial_number ?? "",
      mac_address: row.mac_address ?? "",
      purchase_date: row.purchase_date
        ? formatDate(row.purchase_date, "yyyy-mm-dd")
        : "",
      purchase_price:
        row.purchase_price != null ? String(row.purchase_price) : "",
      warranty_expiry: row.warranty_expiry
        ? formatDate(row.warranty_expiry, "yyyy-mm-dd")
        : "",
      condition: row.condition,
      department_id: row.department_id ? String(row.department_id) : "",
      notes: row.notes ?? "",
      delivery_receipt_no: row.delivery_receipt_no ?? "",
    });
    setErrors({});
    setDrFile(null);
    setEditRow(row);
  };
  const openAssign = (row: ItemAsset) => {
    setAssignForm({ ...emptyAssign, assigned_at: getCurrentDate() });
    setErrors({});
    setAssignRow(row);
  };
  const openReturn = (row: ItemAsset) => {
    setReturnForm({ ...emptyReturn, returned_at: getCurrentDate() });
    setErrors({});
    setReturnRow(row);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        item_id: Number(form.item_id),
        department_id: form.department_id ? Number(form.department_id) : null,
        purchase_price: form.purchase_price
          ? Number(form.purchase_price)
          : null,
      };

      // ── Multiple assets ──────────────────────────────────────────────────────
      if (!editRow && isMultiple) {
        const qty = Math.max(2, parseInt(quantity, 10) || 2);
        const codes = generateSequentialCodes(form.item_code, qty);

        if (codes.length < qty) {
          setErrors({
            item_code: [
              "Item code must end with a number (e.g. NOD-CAB-001) so it can be auto-incremented.",
            ],
          });
          return;
        }

        const responses = await Promise.all(
          codes.map((code) => api.store({ ...payload, item_code: code })),
        );

        // Upload the same DR file to every created asset
        if (drFile) {
          const createdIds = responses
            .map(
              (r) =>
                (r as { data?: { data?: { id: number } } })?.data?.data?.id,
            )
            .filter((id): id is number => !!id);
          await Promise.all(
            createdIds.map(async (id) => {
              try {
                const fd = new FormData();
                fd.append("delivery_receipt_file", drFile);
                await api.uploadDR(id, fd);
              } catch {
                /* continue even if one upload fails */
              }
            }),
          );
        }

        setDrFile(null);
        toast.success(`${qty} assets created.`);
        setCreateOpen(false);
        mutate();
        return;
      }

      // ── Single asset ─────────────────────────────────────────────────────────
      let savedId: number;
      if (editRow) {
        await api.update(editRow.id, payload);
        savedId = editRow.id;
      } else {
        const res = await api.store(payload);
        savedId =
          (res as { data?: { data?: { id: number } } })?.data?.data?.id ?? 0;
      }

      // Upload DR file if one was selected
      if (drFile && savedId) {
        try {
          const fd = new FormData();
          fd.append("delivery_receipt_file", drFile);
          await api.uploadDR(savedId, fd);
        } catch {
          toast.error("Asset saved but delivery receipt upload failed.");
        }
      }

      setDrFile(null);
      if (editRow) {
        toast.success("Asset updated.");
        setEditRow(null);
      } else {
        toast.success("Asset created.");
        setCreateOpen(false);
      }
      mutate();
    } catch (e: unknown) {
      const er = e as {
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      if (er.response?.data?.errors) setErrors(er.response.data.errors);
      else toast.error("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignRow) return;
    setSaving(true);
    try {
      const payload = {
        ...assignForm,
        assignable_id:
          assignForm.assignable_type !== "others"
            ? Number(assignForm.assignable_id)
            : null,
      };
      await api.assign(assignRow.id, payload);
      toast.success("Asset assigned successfully.");
      setAssignRow(null);
      mutate();
    } catch (e: unknown) {
      const er = e as {
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      if (er.response?.data?.errors) setErrors(er.response.data.errors);
      else toast.error("Failed to assign asset.");
    } finally {
      setSaving(false);
    }
  };

  const handleReturn = async () => {
    if (!returnRow) return;
    setSaving(true);
    try {
      await api.returnAsset(returnRow.id, returnForm);
      toast.success("Asset returned.");
      setReturnRow(null);
      mutate();
    } catch (e: unknown) {
      const er = e as {
        response?: { data?: { errors?: Record<string, string[]> } };
      };
      if (er.response?.data?.errors) setErrors(er.response.data.errors);
      else toast.error("Failed to return asset.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    try {
      await api.destroy(deleteRow.id);
      toast.success("Asset deleted.");
      setDeleteRow(null);
      mutate();
    } catch {
      toast.error("Cannot delete: asset has active assignment.");
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = (currentFiltered: ItemAsset[]) => {
    const allSelected =
      currentFiltered.length > 0 &&
      currentFiltered.every((r) => selectedIds.has(r.id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(currentFiltered.map((r) => r.id)));
    }
  };

  const handleGenerateQR = async () => {
    const selected = filtered.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    setGeneratingQR(true);
    try {
      const QRCode = (await import("qrcode")).default;
      const items = await Promise.all(
        selected.map(async (asset) => ({
          item_code: asset.item_code,
          item_name: asset.item?.name ?? "",
          department: asset.department?.name ?? "",
          qr: await QRCode.toDataURL(
            `${window.location.origin}/assets/${asset.item_code}`,
            {
              width: 220,
              margin: 1,
              color: { dark: "#1a1f36", light: "#ffffff" },
            },
          ),
        })),
      );
      setQrItems(items);
      setQrModalOpen(true);
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleDownloadQR = () => {
    // A4 in mm
    const PAGE_W = 210;
    const PAGE_H = 297;
    const MARGIN = 10;
    const COLS = 3;
    const GAP = 6;
    const QR_SIZE = 44;
    const CODE_H = 6; // approx height for item-code text line
    const CARD_PAD = 5;
    const CARD_H = CARD_PAD * 2 + QR_SIZE + GAP / 2 + CODE_H;
    const CARD_W = (PAGE_W - MARGIN * 2 - GAP * (COLS - 1)) / COLS;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    qrItems.forEach((item, idx) => {
      const cardsPerPage =
        COLS * Math.floor((PAGE_H - MARGIN * 2) / (CARD_H + GAP));
      const col = idx % COLS;
      const row = Math.floor((idx % cardsPerPage) / COLS);

      if (idx > 0 && col === 0 && row === 0) doc.addPage();

      const x = MARGIN + col * (CARD_W + GAP);
      const y = MARGIN + row * (CARD_H + GAP);

      // Card border
      doc.setDrawColor(209, 213, 219);
      doc.setLineWidth(0.3);
      doc.roundedRect(x, y, CARD_W, CARD_H, 2, 2, "S");

      // QR image (data URL, strip prefix)
      const imgData = item.qr.replace(/^data:image\/png;base64,/, "");
      const qrX = x + CARD_W / 2 - QR_SIZE / 2;
      const qrY = y + CARD_PAD;
      doc.addImage(imgData, "PNG", qrX, qrY, QR_SIZE, QR_SIZE);

      // Item code text
      doc.setFont("courier", "bold");
      doc.setFontSize(8);
      doc.setTextColor(26, 31, 54);
      doc.text(item.item_code, x + CARD_W / 2, qrY + QR_SIZE + 4, {
        align: "center",
      });
    });

    doc.save("qr-codes-fixed-assets.pdf");
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const uniqueCategories = useMemo(() => {
    const cats = new Map<number, string>();
    rows.forEach((r) => {
      if (r.item?.category) cats.set(r.item.category.id, r.item.category.name);
    });
    return Array.from(cats.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [rows]);

  const filtered = useMemo(() => {
    let result = rows;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.item_code?.toLowerCase().includes(q) ||
          r.item?.name?.toLowerCase().includes(q) ||
          r.serial_number?.toLowerCase().includes(q),
      );
    }
    if (categoryFilter) {
      result = result.filter(
        (r) => r.item?.category?.id === Number(categoryFilter),
      );
    }
    if (itemFilter) {
      result = result.filter((r) => r.item_id === Number(itemFilter));
    }
    return result;
  }, [rows, search, categoryFilter, itemFilter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((r) => selectedIds.has(r.id));

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const itemOptions = fixedItems.map((i: { id: number; name: string }) => ({
    value: i.id,
    label: i.name,
  }));
  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const empOptions = employees.map((e) => ({
    value: e.id,
    label: e.full_name ?? `${e.first_name} ${e.last_name}`,
  }));
  const assignableOptions =
    assignForm.assignable_type === "employee" ? empOptions : deptOptions;

  // MAC address is only relevant for NOD (IT) department
  const nodDeptId = departments.find((d) => d.code === "NOD")?.id;
  const effectiveDeptId = isAdmin
    ? form.department_id
      ? Number(form.department_id)
      : null
    : (user?.department_id ?? null);
  const isNodDept = nodDeptId !== undefined && effectiveDeptId === nodDeptId;
  // Show MAC field only for NOD dept, and only when creating a single asset (not multiple)
  const showMacField = isNodDept && (!!editRow || !isMultiple);

  const columns: Column<ItemAsset>[] = [
    {
      key: "__select",
      label: (
        <input
          type="checkbox"
          checked={allFilteredSelected}
          ref={(el) => {
            if (el) el.indeterminate = someSelected && !allFilteredSelected;
          }}
          onChange={() => toggleSelectAll(filtered)}
          className="h-4 w-4 cursor-pointer accent-primary"
          title="Select all"
        />
      ),
      className: "w-10",
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 cursor-pointer accent-primary"
        />
      ),
    },
    { key: "item_code", label: "Item Code", className: "font-mono" },
    {
      key: "serial_number",
      label: "Serial No.",
      render: (r) => r.serial_number ?? "—",
      className: "font-mono",
    },
    {
      key: "mac_address",
      label: "MAC Address",
      render: (r) => r.mac_address ?? "—",
      className: "font-mono",
    },
    { key: "item", label: "Item", render: (r) => r.item?.name ?? "—" },
    {
      key: "item_category",
      label: "Category",
      render: (r) => r.item?.category?.name ?? "—",
    },
    { key: "item_brand", label: "Brand", render: (r) => r.item?.brand ?? "—" },
    { key: "item_model", label: "Model", render: (r) => r.item?.model ?? "—" },
    {
      key: "item_specifications",
      label: "Specifications",
      render: (r) => {
        const s = r.item?.specifications;
        if (!s) return <span className="text-gray-400">—</span>;
        const text = Array.isArray(s)
          ? s.join(" · ")
          : Object.entries(s)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
        return (
          <span className="text-xs text-gray-600 line-clamp-2 max-w-48 block">
            {text}
          </span>
        );
      },
    },
    ...(isAdmin
      ? [
          {
            key: "department",
            label: "Dept.",
            render: (r: ItemAsset) => r.department?.name ?? "—",
          },
        ]
      : []),
    {
      key: "condition",
      label: "Condition",
      render: (r) => <Badge status={r.condition} />,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <Badge status={r.status} />,
    },
    {
      key: "purchase_price",
      label: "Value",
      render: (r) => formatCurrency(r.purchase_price),
    },
    {
      key: "delivery_receipt",
      label: "Delivery Receipt",
      render: (r) => {
        if (r.delivery_receipt_file) {
          const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${r.delivery_receipt_file}`;
          const label = r.delivery_receipt_no || "View DR";
          return (
            <button
              onClick={() => setDrView({ url, label })}
              className="text-indigo-600 hover:underline font-mono text-xs whitespace-nowrap text-left"
            >
              {label}
            </button>
          );
        }
        return r.delivery_receipt_no || "—";
      },
    },
    {
      key: "modified_by",
      label: "Modified By",
      render: (r) => r.modified_by ?? "—",
    },
    {
      key: "created_at",
      label: "Created Date",
      render: (r) => (r.created_at ? formatDate(r.created_at) : "—"),
    },
    {
      key: "actions",
      label: "Actions",
      className: "w-48 text-right",
      render: (row) => (
        <div className="flex justify-end gap-1 flex-wrap">
          {row.status === "available" && (
            <button
              onClick={() => openAssign(row)}
              title="Assign"
              className="p-1.5 text-gray-400 hover:text-green-600 rounded"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          {row.status === "assigned" && (
            <button
              onClick={() => openReturn(row)}
              title="Return"
              className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
            >
              <Undo2 className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => setViewRow(row)}
            title="View details"
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(row)}
            className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteRow(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const toggleableCols = [
    { key: "item_code", label: "Item Code" },
    { key: "serial_number", label: "Serial No." },
    { key: "mac_address", label: "MAC Address" },
    { key: "item", label: "Item" },
    { key: "item_category", label: "Category" },
    { key: "item_brand", label: "Brand" },
    { key: "item_model", label: "Model" },
    { key: "item_specifications", label: "Specifications" },
    ...(isAdmin ? [{ key: "department", label: "Dept." }] : []),
    { key: "condition", label: "Condition" },
    { key: "status", label: "Status" },
    { key: "purchase_price", label: "Value" },
    { key: "delivery_receipt", label: "Delivery Receipt" },
    { key: "modified_by", label: "Modified By" },
    { key: "created_at", label: "Created Date" },
  ];

  const visibleColumns = columns.filter(
    (col) =>
      col.key === "__select" ||
      col.key === "actions" ||
      visibleCols.has(col.key as string),
  );

  const assetFormBody = (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Item"
          value={form.item_id}
          onChange={(e) => {
            const itemId = e.target.value;
            set("item_id", itemId);
            if (!editRow) {
              const existingCodes = rows
                .filter((r) => r.item_id === Number(itemId))
                .map((r) => r.item_code);
              const next = generateNextItemCode(existingCodes);
              set("item_code", next ?? "");
            }
          }}
          options={itemOptions}
          error={err("item_id")}
          required
          disabled={!!editRow}
        />
        <Input
          label={!editRow && isMultiple ? "Starting Item Code" : "Item Code"}
          value={form.item_code}
          onChange={(e) => set("item_code", e.target.value)}
          error={err("item_code")}
          required
          disabled={!!editRow}
          placeholder={
            form.item_id
              ? rows.some((r) => r.item_id === Number(form.item_id))
                ? isMultiple
                  ? "Auto-generated (starting)"
                  : "Auto-generated"
                : "Enter starting code e.g. NOD-CAB-001"
              : "Select an item first"
          }
        />
      </div>

      {/* Add Multiple toggle — create mode only */}
      {!editRow && (
        <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <input
            type="checkbox"
            id="isMultiple"
            checked={isMultiple}
            onChange={(e) => setIsMultiple(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-indigo-600 rounded"
          />
          <label
            htmlFor="isMultiple"
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
          >
            Add multiple assets
          </label>
          {isMultiple && (
            <>
              <input
                type="number"
                min="2"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-xs text-gray-400">assets (min 2)</span>
            </>
          )}
        </div>
      )}

      {/* Code preview when adding multiple */}
      {!editRow &&
        isMultiple &&
        form.item_code &&
        parseInt(quantity, 10) >= 2 &&
        (() => {
          const qty = Math.max(2, parseInt(quantity, 10) || 2);
          const preview = generateSequentialCodes(
            form.item_code,
            Math.min(qty, 3),
          );
          const last = qty > 3 ? generateNthCode(form.item_code, qty) : null;
          return (
            <p className="text-xs text-gray-400 -mt-1 pl-1">
              Will create:{" "}
              <span className="font-mono">
                {preview.join(", ")}
                {last ? ` … ${last}` : ""}
              </span>
            </p>
          );
        })()}

      <div className={editRow || !isMultiple ? "grid grid-cols-2 gap-4" : ""}>
        {(editRow || !isMultiple) && (
          <Input
            label="Serial Number"
            value={form.serial_number}
            onChange={(e) => set("serial_number", e.target.value)}
            error={err("serial_number")}
          />
        )}
        <Select
          label="Condition"
          value={form.condition}
          onChange={(e) => set("condition", e.target.value)}
          options={conditionOptions}
          error={err("condition")}
          required
        />
      </div>
      {showMacField && (
        <div>
          <Input
            label="MAC Address"
            value={form.mac_address}
            onChange={(e) => set("mac_address", e.target.value)}
            error={err("mac_address")}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
          <p className="text-xs text-gray-400 mt-0.5 pl-0.5">
            Optional — only applicable to network devices
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Purchase Date"
          type="date"
          value={form.purchase_date}
          onChange={(e) => set("purchase_date", e.target.value)}
          error={err("purchase_date")}
        />
        <Input
          label="Purchase Price"
          type="number"
          value={form.purchase_price}
          onChange={(e) => set("purchase_price", e.target.value)}
          error={err("purchase_price")}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Warranty Expiry"
          type="date"
          value={form.warranty_expiry}
          onChange={(e) => set("warranty_expiry", e.target.value)}
          error={err("warranty_expiry")}
        />
        {isAdmin && (
          <Select
            label="Department"
            value={form.department_id}
            onChange={(e) => set("department_id", e.target.value)}
            options={deptOptions}
            placeholder="None"
            error={err("department_id")}
          />
        )}
      </div>
      <Textarea
        label="Notes"
        value={form.notes}
        onChange={(e) => set("notes", e.target.value)}
        error={err("notes")}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Delivery Receipt No."
          value={form.delivery_receipt_no}
          onChange={(e) => set("delivery_receipt_no", e.target.value)}
          error={err("delivery_receipt_no")}
          placeholder="e.g. DR-2024-001"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            DR File{" "}
            <span className="text-xs text-gray-400 font-normal">
              (PDF / image, optional
              {isMultiple && !editRow ? " — shared across all" : ""})
            </span>
          </label>
          {editRow?.delivery_receipt_file && !drFile && (
            <button
              type="button"
              onClick={() =>
                setDrView({
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/storage/${editRow.delivery_receipt_file}`,
                  label: editRow.delivery_receipt_no || "Current file",
                })
              }
              className="text-xs text-indigo-600 hover:underline block mb-1 text-left"
            >
              View current file ↗
            </button>
          )}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setDrFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <PageHeader
        title="Fixed Assets"
        subtitle="Manage physical fixed-asset units with unique item codes"
        action={
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button
                variant="secondary"
                onClick={handleGenerateQR}
                loading={generatingQR}
              >
                <QrCode className="h-4 w-4" />
                Generate QR ({selectedIds.size})
              </Button>
            )}
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Asset
            </Button>
          </div>
        }
      />
      {/* Compact filter bar */}
      {(() => {
        const hasActiveFilters = !!(
          categoryFilter ||
          itemFilter ||
          search.trim()
        );
        const selectCls =
          "text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#070505] focus:outline-none focus:ring-2 focus:ring-[#9bc6ef] cursor-pointer";
        return (
          <div className="flex flex-wrap items-center gap-2 mb-4 bg-white border border-border/80 rounded-xl px-3 py-2 shadow-sm">
            {/* Search */}
            <div className="relative flex-1 min-w-40 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gold pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search by code, item, serial…"
                className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-gray-200 bg-surface text-ink placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-colors"
              />
              {search && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-ink"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="h-4 w-px bg-gray-200 shrink-0" />

            {/* Category */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              <option value="">All Categories</option>
              {uniqueCategories.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>

            {/* Item */}
            <select
              value={itemFilter}
              onChange={(e) => {
                setItemFilter(e.target.value);
                setPage(1);
              }}
              className={selectCls}
            >
              <option value="">All Items</option>
              {fixedItems.map((i: { id: number; name: string }) => (
                <option key={i.id} value={i.id}>
                  {i.name}
                </option>
              ))}
            </select>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  handleSearch("");
                  setCategoryFilter("");
                  setItemFilter("");
                  setPage(1);
                }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}

            <div className="h-4 w-px bg-gray-200 shrink-0 ml-auto" />

            {/* Columns toggle */}
            <div ref={colsRef} className="relative">
              <button
                onClick={() => setColsOpen((v) => !v)}
                className="flex items-center gap-1.5 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9bc6ef] whitespace-nowrap"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Columns
              </button>
              {colsOpen && (
                <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-3 min-w-40">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Show Columns
                  </p>
                  {toggleableCols.map((col) => (
                    <label
                      key={col.key}
                      className="flex items-center gap-2 py-0.5 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={visibleCols.has(col.key)}
                        onChange={() =>
                          setVisibleCols((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.key)) next.delete(col.key);
                            else next.add(col.key);
                            return next;
                          })
                        }
                        className="h-3.5 w-3.5 accent-indigo-600"
                      />
                      <span className="text-xs text-gray-700 group-hover:text-indigo-600">
                        {col.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}
      <DataTable
        columns={visibleColumns}
        data={paged}
        loading={isLoading}
        keyExtractor={(r) => r.id}
      />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        perPage={PER_PAGE}
        onPageChange={setPage}
      />

      {/* Create/Edit modals */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Register Asset"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        {assetFormBody}
      </Modal>
      <Modal
        open={!!editRow}
        onClose={() => setEditRow(null)}
        title="Edit Asset"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Update
            </Button>
          </>
        }
      >
        {assetFormBody}
      </Modal>

      {/* Assign Modal */}
      <Modal
        open={!!assignRow}
        onClose={() => setAssignRow(null)}
        title={`Assign: ${assignRow?.item_code}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} loading={saving}>
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Assign To"
              value={assignForm.assignable_type}
              onChange={(e) => {
                setA("assignable_type", e.target.value);
                setA("assignable_id", "");
                setA("assignable_label", "");
              }}
              options={[
                { value: "employee", label: "Employee" },
                { value: "department", label: "Department" },
                { value: "others", label: "Others" },
              ]}
              required
            />
            {assignForm.assignable_type === "others" ? (
              <Textarea
                label="Specify assignee / location"
                value={assignForm.assignable_label}
                onChange={(e) => setA("assignable_label", e.target.value)}
                error={err("assignable_label")}
                required
              />
            ) : (
              <Select
                label={
                  assignForm.assignable_type === "employee"
                    ? "Employee"
                    : "Department"
                }
                value={assignForm.assignable_id}
                onChange={(e) => setA("assignable_id", e.target.value)}
                options={assignableOptions}
                required
                error={err("assignable_id")}
              />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Assigned Date"
              type="date"
              value={assignForm.assigned_at}
              onChange={(e) => setA("assigned_at", e.target.value)}
              required
            />
            <Input
              label="Expected Return"
              type="date"
              value={assignForm.expected_return_date}
              onChange={(e) => setA("expected_return_date", e.target.value)}
            />
          </div>
          <Select
            label="Condition on Assign"
            value={assignForm.condition_on_assign}
            onChange={(e) => setA("condition_on_assign", e.target.value)}
            options={conditionOptions}
            required
          />
          <Input
            label="Purpose"
            value={assignForm.purpose}
            onChange={(e) => setA("purpose", e.target.value)}
          />
          <Textarea
            label="Notes"
            value={assignForm.notes}
            onChange={(e) => setA("notes", e.target.value)}
          />
        </div>
      </Modal>

      {/* Return Modal */}
      <Modal
        open={!!returnRow}
        onClose={() => setReturnRow(null)}
        title={`Return: ${returnRow?.item_code}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReturnRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleReturn} loading={saving}>
              Confirm Return
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Return Date"
            type="date"
            value={returnForm.returned_at}
            onChange={(e) => setR("returned_at", e.target.value)}
            required
          />
          <Select
            label="Condition on Return"
            value={returnForm.condition_on_return}
            onChange={(e) => setR("condition_on_return", e.target.value)}
            options={conditionOptions}
            required
          />
          <Textarea
            label="Notes"
            value={returnForm.notes}
            onChange={(e) => setR("notes", e.target.value)}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete asset "${deleteRow?.item_code}"?`}
      />

      {/* Asset Detail Viewer */}
      <Modal
        open={!!viewRow}
        onClose={() => setViewRow(null)}
        title={`Asset Details — ${viewRow?.item_code ?? ""}`}
        size="lg"
      >
        {viewRow &&
          (() => {
            const item = viewRow.item;
            const specs = item?.specifications;
            const specsEntries: [string, string][] = specs
              ? Array.isArray(specs)
                ? specs.map((s, i) => [String(i + 1), s])
                : Object.entries(specs)
              : [];

            const DetailRow = ({
              label,
              value,
            }: {
              label: string;
              value: React.ReactNode;
            }) => (
              <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
                <span className="w-36 shrink-0 text-xs font-medium text-gray-500 uppercase tracking-wide pt-0.5">
                  {label}
                </span>
                <span className="text-sm text-gray-800 flex-1">
                  {value ?? "—"}
                </span>
              </div>
            );

            return (
              <div className="space-y-5">
                {/* Item Information */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
                    Item Information
                  </h3>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                    <DetailRow label="Name" value={item?.name} />
                    <DetailRow label="Category" value={item?.category?.name} />
                    <DetailRow label="Brand" value={item?.brand} />
                    <DetailRow label="Model" value={item?.model} />
                  </div>
                  {specsEntries.length > 0 && (
                    <div className="mt-2 rounded-xl border border-gray-100 bg-gray-50 px-4 py-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                        Specifications
                      </p>
                      <ul className="space-y-1">
                        {specsEntries.map(([k, v]) => (
                          <li key={k} className="flex gap-2 text-sm">
                            {!isNaN(Number(k)) ? (
                              <span className="text-gray-700">• {v}</span>
                            ) : (
                              <>
                                <span className="text-gray-500 shrink-0">
                                  {k}:
                                </span>
                                <span className="text-gray-800">{v}</span>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Asset Details */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
                    Asset Details
                  </h3>
                  <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-1">
                    <DetailRow
                      label="Item Code"
                      value={
                        <span className="font-mono">{viewRow.item_code}</span>
                      }
                    />
                    <DetailRow
                      label="Serial No."
                      value={
                        viewRow.serial_number ? (
                          <span className="font-mono">
                            {viewRow.serial_number}
                          </span>
                        ) : null
                      }
                    />
                    {viewRow.mac_address && (
                      <DetailRow
                        label="MAC Address"
                        value={
                          <span className="font-mono">
                            {viewRow.mac_address}
                          </span>
                        }
                      />
                    )}
                    <DetailRow
                      label="Department"
                      value={viewRow.department?.name}
                    />
                    <DetailRow
                      label="Condition"
                      value={<Badge status={viewRow.condition} />}
                    />
                    <DetailRow
                      label="Status"
                      value={<Badge status={viewRow.status} />}
                    />
                    <DetailRow
                      label="Value"
                      value={formatCurrency(viewRow.purchase_price)}
                    />
                    <DetailRow
                      label="Purchase Date"
                      value={
                        viewRow.purchase_date
                          ? formatDate(viewRow.purchase_date)
                          : null
                      }
                    />
                    <DetailRow
                      label="Warranty Expires"
                      value={
                        viewRow.warranty_expiry
                          ? formatDate(viewRow.warranty_expiry)
                          : null
                      }
                    />
                    <DetailRow
                      label="DR No."
                      value={viewRow.delivery_receipt_no}
                    />
                  </div>
                </div>
              </div>
            );
          })()}
      </Modal>

      {/* QR Code Preview */}
      <Modal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`QR Codes — ${qrItems.length} Asset${qrItems.length !== 1 ? "s" : ""}`}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setQrModalOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownloadQR}>
              <Download className="h-4 w-4" />
              Download
            </Button>
          </>
        }
      >
        <div className="flex justify-center overflow-x-auto">
          <div
            className="bg-white border border-gray-200 shadow-sm grid grid-cols-3 gap-4 content-start"
            style={{ width: "210mm", minHeight: "297mm", padding: "10mm" }}
          >
            {qrItems.map((item) => (
              <div
                key={item.item_code}
                className="border border-gray-200 rounded-lg flex flex-col items-center gap-2 break-inside-avoid"
                style={{ padding: "5mm" }}
              >
                <img
                  src={item.qr}
                  alt={item.item_code}
                  style={{ width: "44mm", height: "44mm" }}
                />
                <div className="font-mono text-xs font-bold text-center text-[#1a1f36] tracking-wide leading-snug">
                  {item.item_code}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Delivery Receipt Viewer */}
      <Modal
        open={!!drView}
        onClose={() => setDrView(null)}
        title={`Delivery Receipt — ${drView?.label ?? ""}`}
        size="xl"
        footer={
          <a
            href={drView?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline"
          >
            Open in new tab ↗
          </a>
        }
      >
        {drView &&
          (drView.url.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/) ? (
            <div className="flex items-center justify-center">
              <img
                src={drView.url}
                alt="Delivery Receipt"
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          ) : (
            <iframe
              src={drView.url}
              className="w-full rounded border border-gray-200"
              style={{ height: "70vh" }}
              title="Delivery Receipt"
            />
          ))}
      </Modal>
    </motion.div>
  );
}
