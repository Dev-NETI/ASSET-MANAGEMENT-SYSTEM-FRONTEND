import { cn, getStatusColor, formatStatus } from '@/lib/utils';

interface BadgeProps {
    status: string;
    className?: string;
    label?: string;
}

export default function Badge({ status, className, label }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                getStatusColor(status),
                className
            )}
        >
            {label ?? formatStatus(status)}
        </span>
    );
}
