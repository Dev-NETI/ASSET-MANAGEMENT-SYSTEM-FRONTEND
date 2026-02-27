'use client';

import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    confirmLabel?: string;
    loading?: boolean;
}

export default function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title = 'Confirm Delete',
    message = 'Are you sure you want to delete this record? This action cannot be undone.',
    confirmLabel = 'Delete',
    loading = false,
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} size="sm"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
                </>
            }
        >
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-red-50 border border-red-100 p-2.5">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm text-[#64748b] mt-1">{message}</p>
            </div>
        </Modal>
    );
}
