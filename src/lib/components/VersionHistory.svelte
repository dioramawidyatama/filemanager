<script lang="ts">
  import type { FileNode } from '$lib/types';
  
  interface Version {
    id: number;
    size: number;
    checksum: string;
    created_by: string;
    created_at: number;
    commit_message: string | null;
    parent_version_id: number | null;
  }
  
  interface Props {
    file: FileNode;
    versions: Version[];
    currentVersionId?: number;
    onSelect: (version: Version) => void;
    onRestore: (version: Version) => void;
    onCompare: (version1: Version, version2: Version) => void;
    onClose: () => void;
  }
  
  let { 
    file, 
    versions, 
    currentVersionId, 
    onSelect, 
    onRestore, 
    onCompare, 
    onClose 
  }: Props = $props();
  
  let selectedVersionId = $state<number | null>(null);
  let compareMode = $state(false);
  let compareVersionId = $state<number | null>(null);
  
  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }
  
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
  
  function handleVersionClick(version: Version, event: MouseEvent) {
    if (compareMode) {
      if (compareVersionId === null) {
        compareVersionId = version.id;
      } else if (compareVersionId === version.id) {
        compareVersionId = null;
      } else {
        const v1 = versions.find(v => v.id === compareVersionId);
        if (v1) {
          onCompare(v1, version);
        }
        compareMode = false;
        compareVersionId = null;
      }
    } else {
      selectedVersionId = version.id;
      onSelect(version);
    }
  }
  
  function handleRestore(version: Version, event: Event) {
    event.stopPropagation();
    if (confirm(`Restore to version from ${formatDate(version.created_at)}?`)) {
      onRestore(version);
    }
  }
</script>

<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick={onClose}>
  <div 
    class="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl max-h-[80vh] flex flex-col"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-700">
      <div>
        <h3 class="text-lg font-semibold text-white">Version History</h3>
        <p class="text-sm text-slate-400">{file.name}</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          class="px-3 py-1 text-sm rounded transition-colors {compareMode ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}"
          onclick={() => { compareMode = !compareMode; compareVersionId = null; }}
        >
          {compareMode ? 'Cancel Compare' : 'Compare'}
        </button>
        <button class="text-slate-400 hover:text-white" onclick={onClose}>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Instructions -->
    {#if compareMode}
      <div class="px-6 py-2 bg-blue-500/10 border-b border-blue-500/30">
        <p class="text-sm text-blue-400">
          Select two versions to compare. First: {compareVersionId ? '#' + compareVersionId : '...'}
        </p>
      </div>
    {/if}
    
    <!-- Version List -->
    <div class="flex-1 overflow-auto p-4">
      {#if versions.length === 0}
        <div class="text-center py-8 text-slate-500">
          <p>No versions found for this file.</p>
        </div>
      {:else}
        <div class="space-y-2">
          {#each versions as version, index (version.id)}
            <button 
              class="w-full text-left p-3 rounded-lg border transition-colors
                {selectedVersionId === version.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700'}
                {compareVersionId === version.id ? 'ring-2 ring-blue-400' : ''}"
              onclick={(e) => handleVersionClick(version, e)}
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-mono text-slate-400">#{version.id}</span>
                    {#if version.id === currentVersionId}
                      <span class="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded">Current</span>
                    {/if}
                    {#if index === 0}
                      <span class="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded">Latest</span>
                    {/if}
                  </div>
                  <p class="text-sm text-slate-300 mt-1 truncate">
                    {version.commit_message || 'No message'}
                  </p>
                  <div class="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span>{formatDate(version.created_at)}</span>
                    <span>•</span>
                    <span>by {version.created_by}</span>
                    <span>•</span>
                    <span>{formatSize(version.size)}</span>
                  </div>
                </div>
                
                {#if !compareMode}
                  <button 
                    class="ml-3 px-3 py-1 text-xs bg-slate-600 hover:bg-slate-500 text-white rounded transition-colors"
                    onclick={(e) => handleRestore(version, e)}
                  >
                    Restore
                  </button>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
