import type { FileNode } from './types';

// Global state using Svelte 5 runes pattern
// These are used as shared state across components

export function createFileManagerState() {
  return {
    currentPath: $state<string>('/'),
    files: $state<FileNode[]>([]),
    selectedFiles: $state<Set<string>>(new Set()),
    viewMode: $state<'grid' | 'list'>('grid'),
    isLoading: $state<boolean>(false),
  };
}

// Type for the state
export type FileManagerState = ReturnType<typeof createFileManagerState>;
