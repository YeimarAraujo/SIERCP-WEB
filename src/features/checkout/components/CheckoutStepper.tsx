'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface Step {
  id: string;
  title: string;
}

interface CheckoutStepperProps {
  steps: Step[];
  currentIndex: number;
}

export function CheckoutStepper({ steps, currentIndex }: CheckoutStepperProps) {
  return (
    <nav aria-label="Pasos del checkout" className="flex items-center justify-center gap-0 mb-10">
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Nodo del paso */}
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                className="relative flex items-center justify-center w-9 h-9 rounded-full text-sm font-black"
                initial={false}
                animate={{
                  background: isCompleted
                    ? 'hsl(var(--color-success, 142 76% 36%))'
                    : isActive
                    ? 'linear-gradient(135deg, var(--clr-primary), var(--clr-accent))'
                    : 'transparent',
                  borderColor: isCompleted
                    ? 'transparent'
                    : isActive
                    ? 'transparent'
                    : 'var(--clr-border)',
                  borderWidth: isActive || isCompleted ? 0 : 2,
                  boxShadow: isActive
                    ? '0 4px 16px color-mix(in srgb, var(--clr-primary) 35%, transparent)'
                    : 'none',
                }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                style={{ border: isCompleted || isActive ? 'none' : '2px solid var(--clr-border)' }}
              >
                {isCompleted ? (
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="text-white"
                  />
                ) : (
                  <span
                    className={
                      isActive
                        ? 'text-white'
                        : 'text-[var(--clr-muted)]'
                    }
                  >
                    {i + 1}
                  </span>
                )}

                {/* Pulso animado en el paso activo */}
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full"
                    style={{ background: 'var(--clr-primary)' }}
                    initial={{ opacity: 0.4, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.7 }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                )}
              </motion.div>

              <span
                className="text-[10px] font-bold whitespace-nowrap max-w-[72px] text-center leading-tight"
                style={{
                  color: isActive
                    ? 'var(--clr-primary)'
                    : isCompleted
                    ? 'var(--clr-success)'
                    : 'var(--clr-muted)',
                }}
              >
                {step.title}
              </span>
            </div>

            {/* Conector entre pasos */}
            {i < steps.length - 1 && (
              <div className="relative h-0.5 w-12 sm:w-16 mx-2 mb-5 overflow-hidden rounded-full"
                style={{ background: 'var(--clr-border)' }}>
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'var(--clr-success)' }}
                  initial={false}
                  animate={{ width: isCompleted ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
