import { cn } from '@/lib/utils';
import { SelectHTMLAttributes } from 'react';

interface SelectOption {
    value: string | number;
    label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: SelectOption[];
    placeholder?: string;
}

export default function Select({
    label,
    error,
    options,
    placeholder = 'Select...',
    className,
    id,
    ...props
}: SelectProps) {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    return (
        <div className="flex flex-col gap-1">
            {label && (
                <label htmlFor={selectId} className="text-sm font-medium text-ink">
                    {label}
                    {props.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
            )}
            <select
                id={selectId}
                className={cn(
                    'w-full rounded-lg border px-3 py-2 text-sm text-ink bg-white',
                    'focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary',
                    'disabled:bg-surface disabled:text-sidebar-text',
                    'transition-colors duration-150',
                    error ? 'border-red-400 focus:ring-red-500/20 focus:border-red-400' : 'border-border',
                    className
                )}
                {...props}
            >
                <option value="">{placeholder}</option>
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
