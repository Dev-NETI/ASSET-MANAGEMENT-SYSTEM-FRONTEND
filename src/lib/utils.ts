import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Returns today as YYYY-MM-DD
export const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Format a date string into various human-readable formats
export function formatDate(dateString: string | null | undefined, format = 'MMMM d, yyyy'): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const pad = (n: number) => String(n).padStart(2, '0');

    const formatMap: Record<string, () => string> = {
        'yyyy-mm-dd': () =>
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        'd F, Y': () =>
            `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })}, ${date.getFullYear()}`,
        'mm/dd/yyyy': () =>
            `${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()}`,
        'MMMM d, yyyy': () =>
            `${date.toLocaleString('default', { month: 'long' })} ${date.getDate()}, ${date.getFullYear()}`,
        'yyyy-mm-dd hh:mm:ss': () =>
            `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
    };

    return formatMap[format] ? formatMap[format]() : formatMap['MMMM d, yyyy']();
}

// Format Philippine Peso
export function formatCurrency(amount: number | null | undefined): string {
    if (amount == null) return '—';
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(amount);
}

// Thousand-separated number
export function formatNumber(num: number | null | undefined): string {
    if (num == null) return '0';
    return new Intl.NumberFormat('en-US').format(num);
}

// Convert snake_case status to Title Case
export function formatStatus(status: string | null | undefined): string {
    if (!status) return '—';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
}

// Return Tailwind badge classes based on status string
export function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
        available:    'bg-emerald-50 text-emerald-700 border border-emerald-200',
        assigned:     'bg-indigo-50 text-indigo-700 border border-indigo-200',
        under_repair: 'bg-amber-50 text-amber-700 border border-amber-200',
        disposed:     'bg-slate-100 text-slate-600 border border-slate-200',
        active:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
        returned:     'bg-slate-100 text-slate-600 border border-slate-200',
        lost:         'bg-red-50 text-red-700 border border-red-200',
        inactive:     'bg-red-50 text-red-700 border border-red-200',
        new:          'bg-teal-50 text-teal-700 border border-teal-200',
        good:         'bg-sky-50 text-sky-700 border border-sky-200',
        fair:         'bg-amber-50 text-amber-700 border border-amber-200',
        poor:         'bg-orange-50 text-orange-700 border border-orange-200',
        damaged:      'bg-red-50 text-red-700 border border-red-200',
        fixed_asset:           'bg-indigo-50 text-indigo-700 border border-indigo-200',
        consumable:            'bg-violet-50 text-violet-700 border border-violet-200',
        system_administrator:  'bg-violet-50 text-violet-700 border border-violet-200',
        employee:              'bg-sky-50 text-sky-700 border border-sky-200',
    };
    return colors[status] ?? 'bg-slate-100 text-slate-600 border border-slate-200';
}

// Truncate long strings
export function truncate(str: string | null | undefined, length = 50): string {
    if (!str) return '—';
    return str.length > length ? str.substring(0, length) + '…' : str;
}

// Clear all browser cookies
export const clearCookies = () => {
    document.cookie.split(';').forEach(cookie => {
        const [key] = cookie.split('=');
        document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
    });
};

// Generate a strong 8-char password
export function generateStrongPassword() {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const special = '@$!%*?&';
    const all = lowercase + uppercase + digits + special;

    let pwd = '';
    pwd += lowercase[Math.floor(Math.random() * lowercase.length)];
    pwd += uppercase[Math.floor(Math.random() * uppercase.length)];
    pwd += digits[Math.floor(Math.random() * digits.length)];
    pwd += special[Math.floor(Math.random() * special.length)];

    for (let i = pwd.length; i < 8; i++) {
        pwd += all[Math.floor(Math.random() * all.length)];
    }

    return pwd.split('').sort(() => Math.random() - 0.5).join('');
}
