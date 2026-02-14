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
  
  function handleClick(file: FileNode, event: MouseEvent) {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      const newSelected = new Set(selectedFiles);
      if (newSelected.has(file.path)) {
        newSelected.delete(file.path);
      } else {
        newSelected.add(file.path);
      }
      onSelect(newSelected);
    } else {
      // Navigate or open
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

<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
  {#each files as file (file.id)}
    <button
      class="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-200
        {selectedFiles.has(file.path) 
          ? 'bg-blue-600/20 border-2 border-blue-500' 
          : 'bg-slate-800 border-2 border-transparent hover:bg-slate-750 hover:border-slate-600'}"
      onclick={(e) => handleClick(file, e)}
    >
      <!-- File Icon -->
      <div class="w-16 h-16 mb-3 flex items-center justify-center">
        {#if getFileIcon(file) === 'folder'}
          <svg class="w-14 h-14 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
          </svg>
        {:else if getFileIcon(file) === 'image'}
          <svg class="w-14 h-14 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21" stroke-width="2"/>
          </svg>
        {:else if getFileIcon(file) === 'code'}
          <svg class="w-14 h-14 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
        {:else if getFileIcon(file) === 'pdf'}
          <svg class="w-14 h-14 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
        {:else}
          <svg class="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        {/if}
      </div>
      
      <!-- File Name -->
      <span class="text-sm text-center text-slate-200 font-medium truncate w-full px-1" title={file.name}>
        {file.name}
      </span>
      
      <!-- File Meta -->
      <span class="text-xs text-slate-500 mt-1">
        {file.type === 'directory' ? '--' : formatSize(file.size)}
      </span>
      
      <!-- Selection indicator -->
      {#if selectedFiles.has(file.path)}
        <div class="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
      {/if}
    </button>
  {/each}
</div>
