import { type ClassValue } from 'clsx';
import type { Snippet } from 'svelte';
export declare const cn: (...values: ClassValue[]) => string;
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
    ref?: E | null;
};
export type WithoutChild<T> = T extends {
    child?: Snippet;
} ? Omit<T, 'child'> : T;
export type WithoutChildren<T> = T extends {
    children?: Snippet;
} ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export declare const buttonClass = "inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
export declare const inputClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
export declare const popoverClass = "z-50 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md";
export declare const selected: (items: string[], value: string) => boolean;
