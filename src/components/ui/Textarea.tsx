import { cn } from '@/lib/utils';
import { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export default function Textarea({ label, error, className, id, rows = 3, ...props }: TextareaProps) {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={textareaId} className="text-sm font-medium text-ink">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                id={textareaId}
                rows={rows}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-ink bg-white resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
                    'placeholder:text-sidebar-text disabled:bg-surface disabled:text-sidebar-text',
                    'transition-colors duration-150',
                    error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : 'border-border',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
