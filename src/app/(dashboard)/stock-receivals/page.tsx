"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useStockReceivials } from "@/hooks/api/useStockReceivials";
import { useItems } from "@/hooks/api/useItems";
import { useCategories } from "@/hooks/api/useCategories";
import { useUnits } from "@/hooks/api/useUnits";
import { useDepartments } from "@/hooks/api/useDepartments";
import { useSuppliers } from "@/hooks/api/useSuppliers";
import { useAuth } from "@/hooks/auth";
import PageHeader from "@/components/shared/PageHeader";
import FilterBar from "@/components/shared/FilterBar";
import DataTable, { Column } from "@/components/shared/DataTable";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { Plus, FileText, SlidersHorizontal } from "lucide-react";
import {
  formatDate,
  formatCurrency,
  formatNumber,
  getCurrentDate,
} from "@/lib/utils";
import { fadeUp } from "@/lib/motion";
import axiosInstance from "@/lib/axios";

interface ReceivalDocument {
  id: number;
  stock_receival_id: number;
  file_path: string;
  original_name: string;
}

interface StockReceival {
  id: number;
  item_id: number;
  department_id: number;
  quantity: number;
  unit_cost: number | null;
  supplier_id: number | null;
  delivery_receipt_no: string | null;
  delivery_receipt_file: string | null;
  received_at: string;
  notes: string | null;
  documents?: ReceivalDocument[];
  item?: { id: number; name: string; unit?: { abbreviation: string } };
  department?: { id: number; name: string };
  supplier?: { id: number; name: string } | null;
  modified_by?: string | null;
}

const empty = {
  item_id: "",
  department_id: "",
  quantity: "",
  unit_cost: "",
  supplier_id: "",
  received_at: "",
  notes: "",
};

export default function StockRecevalsPage() {
  const { user } = useAuth();
  const isAdmin = user?.user_type === "system_administrator";
  const api = useStockReceivials();
  const itemApi = useItems();
  const categoryApi = useCategories();
  const unitApi = useUnits();
  const deptApi = useDepartments();
  const suppApi = useSuppliers();

  const {
    data: res,
    isLoading,
    mutate,
  } = useSWR("/api/stock-receivals", () => api.index());
  const { data: itemRes } = useSWR("/api/items-c", () => itemApi.index());
  const { data: deptRes } = useSWR("/api/departments", () => deptApi.index());
  const { data: suppRes } = useSWR("/api/suppliers", () => suppApi.index());
  const { data: catRes } = useSWR("/api/categories", () => categoryApi.index());
  const { data: unitRes } = useSWR("/api/units", () => unitApi.index());

  const rows: StockReceival[] =
    (res as { data?: { data?: StockReceival[] } })?.data?.data ?? [];
  const allItems =
    (
      itemRes as {
        data?: { data?: { id: number; name: string; item_type: string }[] };
      }
    )?.data?.data ?? [];
  const consumableItems = allItems.filter(
    (i: { item_type: string }) => i.item_type === "consumable",
  );
  const departments =
    (deptRes as { data?: { data?: { id: number; name: string }[] } })?.data
      ?.data ?? [];
  const suppliers =
    (suppRes as { data?: { data?: { id: number; name: string }[] } })?.data
      ?.data ?? [];
  const categories =
    (catRes as { data?: { data?: { id: number; name: string }[] } })?.data
      ?.data ?? [];
  const units =
    (
      unitRes as {
        data?: { data?: { id: number; name: string; abbreviation: string }[] };
      }
    )?.data?.data ?? [];

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [docsListRow, setDocsListRow] = useState<StockReceival | null>(null);
  const [docView, setDocView] = useState<{ url: string; label: string } | null>(
    null,
  );

  // Item autocomplete state
  const [itemSearch, setItemSearch] = useState("");
  const [itemDropdownOpen, setItemDropdownOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    description: "",
    category_id: "",
    unit_id: "",
    brand: "",
    model: "",
    specifications: "",
    min_stock_level: "",
  });
  const itemDropdownRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const defaultCols = new Set([
    "item",
    "supplier",
    "quantity",
    "unit_cost",
    "received_at",
    "documents",
    ...(isAdmin ? ["department"] : []),
  ]);
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Set<string>>(defaultCols);
  const colsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (colsRef.current && !colsRef.current.contains(e.target as Node))
        setColsOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        itemDropdownRef.current &&
        !itemDropdownRef.current.contains(e.target as Node)
      )
        setItemDropdownOpen(false);
    };
    if (itemDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [itemDropdownOpen]);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const setNI = (k: string, v: string) =>
    setNewItemForm((f) => ({ ...f, [k]: v }));
  const err = (k: string) => errors[k]?.[0];

  const openCreate = () => {
    setForm({ ...empty, received_at: getCurrentDate() });
    setPendingFiles([]);
    setErrors({});
    setItemSearch("");
    setIsNewItem(false);
    setNewItemForm({
      description: "",
      category_id: "",
      unit_id: "",
      brand: "",
      model: "",
      specifications: "",
      min_stock_level: "",
    });
    setCreateOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // If registering a brand-new item, create it first
      let resolvedItemId = form.item_id;
      if (isNewItem && itemSearch.trim()) {
        if (!newItemForm.category_id || !newItemForm.unit_id) {
          setErrors({
            category_id: newItemForm.category_id
              ? []
              : ["Category is required."],
            unit_id: newItemForm.unit_id ? [] : ["Unit is required."],
          });
          setSaving(false);
          return;
        }
        const specs = newItemForm.specifications.trim()
          ? newItemForm.specifications
              .split("\n")
              .map((s) => s.trim())
              .filter(Boolean)
          : null;
        const itemCreateRes = await itemApi.store({
          name: itemSearch.trim(),
          description: newItemForm.description || null,
          category_id: Number(newItemForm.category_id),
          unit_id: Number(newItemForm.unit_id),
          item_type: "consumable",
          brand: newItemForm.brand || null,
          model: newItemForm.model || null,
          specifications: specs,
          min_stock_level: newItemForm.min_stock_level
            ? Number(newItemForm.min_stock_level)
            : 0,
        });
        const newId =
          (itemCreateRes as { data?: { data?: { id: number } } })?.data?.data
            ?.id ?? 0;
        if (!newId) throw new Error("Failed to create item.");
        resolvedItemId = String(newId);
      }

      const fd = new FormData();
      fd.append("item_id", resolvedItemId);
      if (isAdmin && form.department_id)
        fd.append("department_id", form.department_id);
      fd.append("quantity", form.quantity);
      if (form.unit_cost) fd.append("unit_cost", form.unit_cost);
      if (form.supplier_id) fd.append("supplier_id", form.supplier_id);
      fd.append("received_at", form.received_at);
      if (form.notes) fd.append("notes", form.notes);

      const res = await axiosInstance.post("/api/stock-receivals", fd, {
        headers: { "Content-Type": undefined },
      });

      // Upload pending documents after the receival is created
      const savedId = (res as { data?: { data?: { id: number } } })?.data?.data
        ?.id;
      if (savedId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          try {
            const docFd = new FormData();
            docFd.append("file", file);
            await api.uploadDocument(savedId, docFd);
          } catch {
            toast.error(`Failed to upload ${file.name}.`);
          }
        }
      }

      toast.success("Stock receival recorded. Stock updated.");
      setPendingFiles([]);
      setCreateOpen(false);
      mutate();
    } catch (e: unknown) {
      const er = e as {
        response?: {
          data?: { errors?: Record<string, string[]>; message?: string };
        };
      };
      if (er.response?.data?.errors) setErrors(er.response.data.errors);
      else toast.error(er.response?.data?.message ?? "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.item?.name?.toLowerCase().includes(q) ||
        r.supplier?.name?.toLowerCase().includes(q),
    );
  }, [rows, search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const deptOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const suppOptions = suppliers.map((s) => ({ value: s.id, label: s.name }));
  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: c.name,
  }));
  const unitOptions = units.map((u) => ({
    value: u.id,
    label: u.abbreviation ? `${u.name} (${u.abbreviation})` : u.name,
  }));
  const itemMatches = useMemo(() => {
    if (!itemSearch.trim()) return consumableItems.slice(0, 12);
    const q = itemSearch.toLowerCase();
    return consumableItems.filter((i: { name: string }) =>
      i.name.toLowerCase().includes(q),
    );
  }, [consumableItems, itemSearch]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "";

  const toggleableCols = [
    { key: "item", label: "Item" },
    ...(isAdmin ? [{ key: "department", label: "Department" }] : []),
    { key: "supplier", label: "Supplier" },
    { key: "quantity", label: "Quantity" },
    { key: "unit_cost", label: "Unit Cost" },
    { key: "total_cost", label: "Total Cost" },
    { key: "received_at", label: "Received" },
    { key: "documents", label: "Documents" },
    { key: "notes", label: "Notes" },
    { key: "modified_by", label: "Modified By" },
  ];

  const columns: Column<StockReceival>[] = [
    { key: "item", label: "Item", render: (r) => r.item?.name ?? "—" },
    ...(isAdmin
      ? [
          {
            key: "department",
            label: "Department",
            render: (r: StockReceival) => r.department?.name ?? "—",
          } as Column<StockReceival>,
        ]
      : []),
    {
      key: "supplier",
      label: "Supplier",
      render: (r) => r.supplier?.name ?? "—",
    },
    {
      key: "quantity",
      label: "Quantity",
      render: (r) =>
        `${formatNumber(r.quantity)} ${r.item?.unit?.abbreviation ?? ""}`,
    },
    {
      key: "unit_cost",
      label: "Unit Cost",
      render: (r) => (r.unit_cost != null ? formatCurrency(r.unit_cost) : "—"),
    },
    {
      key: "total_cost",
      label: "Total Cost",
      render: (r) =>
        r.unit_cost != null ? formatCurrency(r.quantity * r.unit_cost) : "—",
    },
    {
      key: "received_at",
      label: "Received",
      render: (r) => formatDate(r.received_at, "MMMM d, yyyy"),
    },
    {
      key: "documents",
      label: "Documents",
      render: (r) => {
        const docs = r.documents ?? [];
        if (docs.length === 0) return <span className="text-gray-400">—</span>;
        if (docs.length === 1) {
          const url = `${backendUrl}/storage/${docs[0].file_path}`;
          return (
            <button
              onClick={() => setDocView({ url, label: docs[0].original_name })}
              className="inline-flex items-center gap-1 text-indigo-600 hover:underline text-xs"
            >
              <FileText className="h-3.5 w-3.5 shrink-0" />
              {docs[0].original_name.length > 20
                ? docs[0].original_name.slice(0, 18) + "…"
                : docs[0].original_name}
            </button>
          );
        }
        return (
          <button
            onClick={() => setDocsListRow(r)}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 whitespace-nowrap"
          >
            <FileText className="h-3 w-3" />
            {docs.length} files
          </button>
        );
      },
    },
    { key: "notes", label: "Notes", render: (r) => r.notes ?? "—" },
    {
      key: "modified_by",
      label: "Modified By",
      render: (r) => r.modified_by ?? "—",
    },
  ];

  const visibleColumns = columns.filter((c) => visibleCols.has(c.key));

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="visible">
      <PageHeader
        title="Stock Receivals"
        subtitle="Record incoming consumable stock (automatically updates stock levels)"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Record Receival
          </Button>
        }
      />
      <FilterBar
        search={search}
        onSearchChange={handleSearch}
        placeholder="Search by item or supplier…"
      >
        <div className="relative" ref={colsRef}>
          <Button variant="secondary" onClick={() => setColsOpen((o) => !o)}>
            <SlidersHorizontal className="h-4 w-4" />
            Columns
          </Button>
          {colsOpen && (
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-52">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Show Columns
              </p>
              {toggleableCols.map((c) => (
                <label
                  key={c.key}
                  className="flex items-center gap-2 py-1 cursor-pointer text-sm text-gray-700 hover:text-gray-900"
                >
                  <input
                    type="checkbox"
                    checked={visibleCols.has(c.key)}
                    onChange={(e) =>
                      setVisibleCols((prev) => {
                        const n = new Set(prev);
                        e.target.checked ? n.add(c.key) : n.delete(c.key);
                        return n;
                      })
                    }
                    className="rounded border-gray-300"
                  />
                  {c.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </FilterBar>
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

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Record Stock Receival"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              Save & Update Stock
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* ── Item autocomplete (+ optional department for admins) ── */}
          <div className={isAdmin ? "grid grid-cols-2 gap-4" : undefined}>
            <div className="relative" ref={itemDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Item (Consumable) <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={itemSearch}
                onChange={(e) => {
                  setItemSearch(e.target.value);
                  set("item_id", "");
                  setIsNewItem(false);
                  setItemDropdownOpen(true);
                }}
                onFocus={() => setItemDropdownOpen(true)}
                placeholder="Type to search or create…"
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 ${err("item_id") ? "border-red-400" : "border-gray-300"}`}
              />
              {err("item_id") && (
                <p className="mt-1 text-xs text-red-500">{err("item_id")}</p>
              )}
              {itemDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {itemMatches.length === 0 && !itemSearch.trim() && (
                    <p className="px-3 py-2 text-xs text-gray-400">
                      No consumable items found.
                    </p>
                  )}
                  {itemMatches.map((item: { id: number; name: string }) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        set("item_id", String(item.id));
                        setItemSearch(item.name);
                        setIsNewItem(false);
                        setItemDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      {item.name}
                    </button>
                  ))}
                  {itemSearch.trim() &&
                    !consumableItems.some(
                      (i: { name: string }) =>
                        i.name.toLowerCase() === itemSearch.toLowerCase(),
                    ) && (
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setIsNewItem(true);
                          setItemDropdownOpen(false);
                          set("item_id", "");
                        }}
                        className="w-full text-left px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 border-t border-gray-100 flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        Create new item: &ldquo;{itemSearch}&rdquo;
                      </button>
                    )}
                </div>
              )}
            </div>
            {isAdmin && (
              <Select
                label="Receiving Department"
                value={form.department_id}
                onChange={(e) => set("department_id", e.target.value)}
                options={deptOptions}
                required
                error={err("department_id")}
              />
            )}
          </div>

          {/* ── Inline new-item form ── */}
          {isNewItem && (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/40 p-4 space-y-3">
              <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                New Item Details —{" "}
                <span className="font-normal normal-case text-indigo-500">
                  item_type will be set to <em>consumable</em> automatically
                </span>
              </p>
              <Textarea
                label="Description"
                value={newItemForm.description}
                onChange={(e) => setNI("description", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={newItemForm.category_id}
                  onChange={(e) => setNI("category_id", e.target.value)}
                  options={categoryOptions}
                  required
                  error={errors.category_id?.[0]}
                />
                <Select
                  label="Unit"
                  value={newItemForm.unit_id}
                  onChange={(e) => setNI("unit_id", e.target.value)}
                  options={unitOptions}
                  required
                  error={errors.unit_id?.[0]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Brand"
                  value={newItemForm.brand}
                  onChange={(e) => setNI("brand", e.target.value)}
                  placeholder="e.g. Pilot"
                />
                <Input
                  label="Model"
                  value={newItemForm.model}
                  onChange={(e) => setNI("model", e.target.value)}
                  placeholder="e.g. G-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Stock Level"
                  type="number"
                  value={newItemForm.min_stock_level}
                  onChange={(e) => setNI("min_stock_level", e.target.value)}
                  placeholder="0"
                />
                <div />
              </div>
              <Textarea
                label="Specifications"
                value={newItemForm.specifications}
                onChange={(e) => setNI("specifications", e.target.value)}
                placeholder={"One spec per line, e.g.\nBlue ink\n0.7mm tip"}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantity"
              type="number"
              value={form.quantity}
              onChange={(e) => set("quantity", e.target.value)}
              required
              error={err("quantity")}
            />
            <Input
              label="Unit Cost (PHP)"
              type="number"
              value={form.unit_cost}
              onChange={(e) => set("unit_cost", e.target.value)}
              error={err("unit_cost")}
            />
          </div>
          <Select
            label="Supplier"
            value={form.supplier_id}
            onChange={(e) => set("supplier_id", e.target.value)}
            options={suppOptions}
            placeholder="None"
            error={err("supplier_id")}
          />
          <Input
            label="Date Received"
            type="date"
            value={form.received_at}
            onChange={(e) => set("received_at", e.target.value)}
            required
            error={err("received_at")}
          />
          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Purchase Documents{" "}
              <span className="text-gray-400 font-normal text-xs">
                (PDF / image / Office files, optional)
              </span>
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              onChange={(e) =>
                setPendingFiles(Array.from(e.target.files ?? []))
              }
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
            />
            {pendingFiles.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">
                {pendingFiles.length} file{pendingFiles.length > 1 ? "s" : ""}{" "}
                selected — will be uploaded on save
              </p>
            )}
          </div>
        </div>
      </Modal>
      {/* Documents List Modal */}
      <Modal
        open={!!docsListRow}
        onClose={() => setDocsListRow(null)}
        title={`Purchase Documents — ${docsListRow?.item?.name ?? ""}`}
        size="sm"
      >
        {docsListRow && (
          <div className="space-y-2">
            {(docsListRow.documents ?? []).map((doc, idx) => {
              const url = `${backendUrl}/storage/${doc.file_path}`;
              const ext =
                doc.original_name.split(".").pop()?.toLowerCase() ?? "";
              const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
                ext,
              );
              const isPdf = ext === "pdf";
              const icon = isPdf ? "📄" : isImage ? "🖼️" : "📎";
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5"
                >
                  <span className="text-lg leading-none shrink-0">{icon}</span>
                  <span
                    className="flex-1 text-sm text-gray-700 truncate"
                    title={doc.original_name}
                  >
                    <span className="text-xs text-gray-400 mr-1">
                      #{idx + 1}
                    </span>
                    {doc.original_name}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setDocsListRow(null);
                        setDocView({ url, label: doc.original_name });
                      }}
                      className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 border border-indigo-200"
                    >
                      View
                    </button>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 border border-gray-200"
                    >
                      ↗
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Document Viewer */}
      <Modal
        open={!!docView}
        onClose={() => setDocView(null)}
        title={docView?.label ?? "Document"}
        size="xl"
        footer={
          <a
            href={docView?.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:underline"
          >
            Open in new tab ↗
          </a>
        }
      >
        {docView &&
          (docView.url
            .toLowerCase()
            .match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/) ? (
            <div className="flex items-center justify-center">
              <img
                src={docView.url}
                alt={docView.label}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
          ) : (
            <iframe
              src={docView.url}
              className="w-full rounded border border-gray-200"
              style={{ height: "70vh" }}
              title={docView.label}
            />
          ))}
      </Modal>
    </motion.div>
  );
}
