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
                <label htmlFor={textareaId} className="text-sm font-medium text-gray-700">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <textarea
                id={textareaId}
                rows={rows}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-gray-900 resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                    'disabled:bg-gray-50 disabled:text-gray-500',
                    error ? 'border-red-400' : 'border-gray-300',
                    className
                )}
                {...props}
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
