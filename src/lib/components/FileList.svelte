<script lang="ts">
  import type { FileNode } from '$lib/types';
  
  interface Props {
    files: FileNode[];
    selectedFiles: Set<string>;
    onFileClick: (file: FileNode) => void;
    onSelect: (selected: Set<string>) => void;
  }
  
  let { files, selectedFiles, onFileClick, onSelect }: Props = $props();
  
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  function formatDate(date: Date): string {
    return new Date(date).toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }
  
  function handleClick(file: FileNode, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      onSelect(newSelected);
    } else {
      onFileClick(file);
    }
  }
  
  function getFileIcon(file: FileNode): string {
    if (file.type === 'directory') return 'folder';
    if (file.mimeType?.startsWith('image/')) return 'image';
    if (file.mimeType?.startsWith('video/')) return 'video';
    if (file.mimeType?.startsWith('audio/')) return 'audio';
    if (file.name.endsWith('.pdf')) return 'pdf';
    if (file.name.match(/\.(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h|php)$/)) return 'code';
    return 'file';
  }
</script>

<div class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
  <!-- Header -->
  <div class="hidden sm:grid sm:grid-cols-[1fr_100px_150px_50px] gap-4 px-4 py-3 bg-slate-750 border-b border-slate-700 text-sm font-medium text-slate-400">
    <span>Name</span>
    <span>Size</span>
    <span>Modified</span>
    <span></span>
  </div>
  
  <!-- File List -->
  <div class="divide-y divide-slate-700">
    {#each files as file (file.id)}
      <button
        class="w-full grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_100px_150px_50px] gap-3 sm:gap-4 px-4 py-3 items-center text-left transition-colors
          {selectedFiles.has(file.path) ? 'bg-blue-600/10' : 'hover:bg-slate-750'}"
        onclick={(e) => handleClick(file, e)}
      >
        <!-- Icon -->
        <div class="w-5 h-5 flex items-center justify-center">
          {#if getFileIcon(file) === 'folder'}
            <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
            </svg>
          {:else if getFileIcon(file) === 'image'}
            <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21" stroke-width="2"/>
            </svg>
          {:else if getFileIcon(file) === 'code'}
            <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
          {:else if getFileIcon(file) === 'pdf'}
            <svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          {:else}
            <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          {/if}
        </div>
        
        <!-- Name -->
        <span class="text-sm text-slate-200 truncate font-medium">{file.name}</span>
        
        <!-- Size (hidden on mobile) -->
        <span class="hidden sm:block text-sm text-slate-500">
          {file.type === 'directory' ? '--' : formatSize(file.size)}
        </span>
        
        <!-- Date (hidden on mobile) -->
        <span class="hidden sm:block text-sm text-slate-500">
          {formatDate(file.modifiedAt)}
        </span>
        
        <!-- Selection indicator -->
        <div class="flex justify-center">
          {#if selectedFiles.has(file.path)}
            <div class="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
              <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          {/if}
        </div>
      </button>
    {/each}
  </div>
</div>
