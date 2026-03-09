import { cn } from '@/lib/utils';
import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export default function Input({ label, error, className, id, ...props }: InputProps) {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={inputId} className="text-sm font-medium text-ink">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-ink bg-white',
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
