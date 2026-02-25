// Shared Framer Motion animation variants
import type { Variants } from 'framer-motion';

export const fadeUp: Variants = {
    hidden:  { opacity: 0, y: 16 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, delay: i * 0.05, ease: [0.25, 0.1, 0.25, 1] },
    }),
};

export const fadeIn: Variants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export const scaleIn: Variants = {
    hidden:  { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    exit:    { opacity: 0, scale: 0.95, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export const slideDown: Variants = {
    hidden:  { opacity: 0, y: -8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
    exit:    { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export const staggerContainer: Variants = {
    hidden:  {},
    visible: { transition: { staggerChildren: 0.06 } },
};

export const rowVariant: Variants = {
    hidden:  { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

export const backdropVariant: Variants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit:    { opacity: 0, transition: { duration: 0.15 } },
};
