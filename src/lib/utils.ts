import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function sanitize(input: string | any): string | any {
  if (typeof input !== 'string') return input;

  return input
    .trim()
    // Remove potential script tags
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "")
    // Remove other dangerous HTML tags
    .replace(/<[^>]*>?/gm, "")
    // Prevent common SQL/NoSQL injection characters if needed
    // (Firestore handles this mostly, but good to be clean)
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
