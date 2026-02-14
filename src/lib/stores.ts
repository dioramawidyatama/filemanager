import { writable } from 'svelte/store';
import type { FileNode } from './types';

export const currentPath = writable<string>('/');
export const files = writable<FileNode[]>([]);
export const selectedFiles = writable<Set<string>>(new Set());
export const viewMode = writable<'grid' | 'list'>('grid');
export const isLoading = writable<boolean>(false);
