<script lang="ts">
  import type { FileNode } from '$lib/types';
  
  interface Props {
    x: number;
    y: number;
    file: FileNode | null;
    onClose: () => void;
    onRename: (file: FileNode) => void;
    onDelete: (file: FileNode) => void;
    onCreateFile: () => void;
    onCreateFolder: () => void;
    onRefresh: () => void;
  }
  
  let { 
    x, 
    y, 
    file, 
    onClose, 
    onRename, 
    onDelete, 
    onCreateFile, 
    onCreateFolder, 
    onRefresh 
  }: Props = $props();
  
  // Adjust position if menu would go off screen
  let adjustedX = $state(x);
  let adjustedY = $state(y);
  
  let menuElement: HTMLDivElement;
  
  $effect(() => {
    if (menuElement) {
      const rect = menuElement.getBoundingClientRect();
      if (x + rect.width > window.innerWidth) {
        adjustedX = x - rect.width;
      }
      if (y + rect.height > window.innerHeight) {
        adjustedY = y - rect.height;
      }
    }
  });
  
  function handleRename() {
    if (file) {
      onRename(file);
      onClose();
    }
  }
  
  function handleDelete() {
    if (file) {
      onDelete(file);
      onClose();
    }
  }
</script>

<!-- Backdrop -->
<div 
  class="fixed inset-0 z-40" 
  onclick={onClose}
  onkeydown={(e) => e.key === 'Escape' && onClose()}
  role="button"
  tabindex="-1"
></div>

<!-- Menu -->
<div 
  bind:this={menuElement}
  class="fixed z-50 min-w-[180px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1"
  style="left: {adjustedX}px; top: {adjustedY}px;"
>
  {#if file}
    <!-- File/Folder specific actions -->
    <div class="px-3 py-2 border-b border-slate-700 mb-1">
      <span class="text-xs text-slate-400 truncate block max-w-[200px]">{file.name}</span>
    </div>
    
    <button 
      class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
      onclick={handleRename}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
      </svg>
      Rename
    </button>
    
    <button 
      class="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
      onclick={handleDelete}
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
      </svg>
      Delete
    </button>
    
    <div class="border-t border-slate-700 my-1"></div>
  {/if}
  
  <!-- General actions -->
  <button 
    class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
    onclick={() => { onCreateFile(); onClose(); }}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
    New File
  </button>
  
  <button 
    class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
    onclick={() => { onCreateFolder(); onClose(); }}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
    </svg>
    New Folder
  </button>
  
  <div class="border-t border-slate-700 my-1"></div>
  
  <button 
    class="w-full px-4 py-2 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2 transition-colors"
    onclick={() => { onRefresh(); onClose(); }}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
    </svg>
    Refresh
  </button>
</div>
