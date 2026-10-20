'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, type ReactNode } from 'react';

/* ── Reveal: animación de entrada al hacer scroll ── */
export function Reveal({
    children,
    delay = 0,
    duration = 0.6,
    className = '',
    once = true,
}: {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── RevealLeft: entrada desde la izquierda ── */
export function RevealLeft({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── RevealRight: entrada desde la derecha ── */
export function RevealRight({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── RevealScale: entrada con escala ── */
export function RevealScale({
    children,
    delay = 0,
    className = '',
}: {
    children: ReactNode;
    delay?: number;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── HoverLift: elevación al hover ── */
export function HoverLift({
    children,
    className = '',
    as: Component = motion.div,
}: {
    children: ReactNode;
    className?: string;
    as?: any;
}) {
    return (
        <Component
            className={className}
            whileHover={{ y: -6, transition: { duration: 0.2, ease: 'easeOut' } }}
            whileTap={{ scale: 0.98 }}
        >
            {children}
        </Component>
    );
}

/* ── StaggerChildren: animación escalonada ── */
export function StaggerChildren({
    children,
    className = '',
    staggerDelay = 0.08,
}: {
    children: ReactNode;
    className?: string;
    staggerDelay?: number;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });

    return (
        <motion.div
            ref={ref}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={{
                visible: { transition: { staggerChildren: staggerDelay } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

/* ── AnimatedCounter: contador animado ── */
export function AnimatedCounter({
    end,
    duration = 2,
    prefix = '',
    suffix = '',
    className = '',
}: {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.span
            ref={ref}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            className={className}
        >
            <CountUp end={end} duration={duration} prefix={prefix} suffix={suffix} />
        </motion.span>
    );
}

function CountUp({
    end,
    duration,
    prefix,
    suffix,
}: {
    end: number;
    duration: number;
    prefix: string;
    suffix: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const hasAnimated = useRef(false);

    const animate = () => {
        if (hasAnimated.current || !ref.current) return;
        hasAnimated.current = true;

        const startTime = performance.now();
        const startVal = 0;

        const update = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startVal + (end - startVal) * eased);

            if (ref.current) {
                ref.current.textContent = `${prefix}${current.toLocaleString('es-CO')}${suffix}`;
            }

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };

        requestAnimationFrame(update);
    };

    const observer = useRef<IntersectionObserver | null>(null);

    if (typeof window !== 'undefined' && ref.current) {
        if (!observer.current) {
            observer.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting) {
                        animate();
                        observer.current?.disconnect();
                    }
                },
                { threshold: 0.5 }
            );
            observer.current.observe(ref.current);
        }
    }

    return <span ref={ref}>{prefix}0{suffix}</span>;
}
