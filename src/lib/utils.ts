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
        available:    'bg-green-100 text-green-800',
        assigned:     'bg-blue-100 text-blue-800',
        under_repair: 'bg-yellow-100 text-yellow-800',
        disposed:     'bg-gray-100 text-gray-800',
        active:       'bg-green-100 text-green-800',
        returned:     'bg-gray-100 text-gray-800',
        lost:         'bg-red-100 text-red-800',
        inactive:     'bg-red-100 text-red-800',
        new:          'bg-emerald-100 text-emerald-800',
        good:         'bg-blue-100 text-blue-800',
        fair:         'bg-yellow-100 text-yellow-800',
        poor:         'bg-orange-100 text-orange-800',
        damaged:      'bg-red-100 text-red-800',
        fixed_asset:  'bg-purple-100 text-purple-800',
        consumable:   'bg-orange-100 text-orange-800',
    };
    return colors[status] ?? 'bg-gray-100 text-gray-800';
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
