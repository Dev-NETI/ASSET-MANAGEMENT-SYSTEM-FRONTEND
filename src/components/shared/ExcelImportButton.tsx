'use client';

import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, Download, CheckCircle, AlertCircle, SkipForward } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { AxiosResponse } from 'axios';

interface ImportError { row: number; error: string; }
interface ImportResult {
    imported: number;
    created?: string[];
    skipped?: string[];
    errors?: ImportError[];
}

interface Props {
    onDownloadTemplate: () => Promise<AxiosResponse>;
    onImport: (fd: FormData) => Promise<AxiosResponse>;
    onSuccess?: () => void;
    label?: string;
}

export default function ExcelImportButton({ onDownloadTemplate, onImport, onSuccess, label = 'Import Excel' }: Props) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState<ImportResult | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleTemplate = async () => {
        setDownloading(true);
        try {
            const res = await onDownloadTemplate();
            const blob = new Blob([res.data], {
                type: res.headers['content-type'] ?? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cd = (res.headers['content-disposition'] as string) ?? '';
            const match = cd.match(/filename="?([^";\r\n]+)"?/);
            a.download = match?.[1] ?? 'template.xlsx';
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            toast.error('Failed to download template.');
        } finally {
            setDownloading(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFile(e.target.files?.[0] ?? null);
        setResult(null);
    };

    const handleImport = async () => {
        if (!selectedFile) return;
        setImporting(true);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append('file', selectedFile);
            const res = await onImport(fd);
            const data: ImportResult = res.data?.data ?? res.data;
            setResult(data);
            if ((data.imported ?? 0) > 0) {
                toast.success(`${data.imported} record(s) imported successfully.`);
                onSuccess?.();
            } else {
                toast('Import complete — no new records added.', { icon: 'ℹ️' });
            }
        } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message ?? 'Import failed.');
        } finally {
            setImporting(false);
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    const openModal = () => {
        setResult(null);
        setSelectedFile(null);
        setModalOpen(true);
    };

    return (
        <>
            <Button variant="secondary" onClick={openModal}>
                <Upload className="h-4 w-4" />
                {label}
            </Button>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={label}
                size="md"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalOpen(false)}>Close</Button>
                        {selectedFile && !result && (
                            <Button onClick={handleImport} loading={importing}>
                                <Upload className="h-4 w-4" />
                                Import
                            </Button>
                        )}
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Step 1 — Download the Excel template
                        </p>
                        <Button variant="secondary" size="sm" onClick={handleTemplate} loading={downloading}>
                            <Download className="h-3.5 w-3.5" />
                            Download Template
                        </Button>
                        <p className="mt-2 text-xs text-gray-500">
                            Fill in the template and save it as .xlsx before uploading.
                        </p>
                    </div>

                    {/* Step 2 */}
                    <div className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                            Step 2 — Upload your completed file
                        </p>
                        <input
                            ref={fileRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                        {selectedFile && (
                            <p className="mt-1 text-xs text-gray-400">Selected: {selectedFile.name}</p>
                        )}
                    </div>

                    {/* Result */}
                    {result && (
                        <div className="rounded-lg border border-gray-200 p-4 space-y-3">
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-1.5 text-green-700">
                                    <CheckCircle className="h-4 w-4" />
                                    <strong>{result.imported ?? 0}</strong>&nbsp;imported
                                </span>
                                {(result.skipped?.length ?? 0) > 0 && (
                                    <span className="flex items-center gap-1.5 text-yellow-700">
                                        <SkipForward className="h-4 w-4" />
                                        <strong>{result.skipped!.length}</strong>&nbsp;skipped
                                    </span>
                                )}
                                {(result.errors?.length ?? 0) > 0 && (
                                    <span className="flex items-center gap-1.5 text-red-600">
                                        <AlertCircle className="h-4 w-4" />
                                        <strong>{result.errors!.length}</strong>&nbsp;errors
                                    </span>
                                )}
                            </div>

                            {result.errors && result.errors.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-red-600 mb-1">Errors:</p>
                                    <ul className="space-y-0.5 max-h-40 overflow-y-auto">
                                        {result.errors.map((e, i) => (
                                            <li key={i} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                                                Row {e.row}: {e.error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {result.skipped && result.skipped.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-yellow-700 mb-1">Skipped (duplicates):</p>
                                    <ul className="space-y-0.5 max-h-32 overflow-y-auto">
                                        {result.skipped.map((s, i) => (
                                            <li key={i} className="text-xs text-yellow-800 bg-yellow-50 rounded px-2 py-1">
                                                {String(s)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
