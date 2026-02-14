<script lang="ts">
  interface Props {
    currentPath: string;
    selectedCount: number;
    viewMode: 'grid' | 'list';
    onRefresh: () => void;
    onViewChange: (mode: 'grid' | 'list') => void;
  }
  
  let { currentPath, selectedCount, viewMode, onRefresh, onViewChange }: Props = $props();
</script>

<div class="flex items-center justify-between gap-4 px-4 py-3 bg-slate-800 border-b border-slate-700">
  <!-- Left: Path info -->
  <div class="flex items-center gap-2 min-w-0">
    <h2 class="text-sm font-medium text-slate-300 truncate hidden sm:block">
      {currentPath === '/' ? 'Home' : currentPath}
    </h2>
    {#if selectedCount > 0}
      <span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
        {selectedCount} selected
      </span>
    {/if}
  </div>
  
  <!-- Right: Actions -->
  <div class="flex items-center gap-2">
    <!-- Refresh -->
    <button 
      class="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
      onclick={onRefresh}
      title="Refresh"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
      </svg>
    </button>
    
    <!-- View toggle -->
    <div class="flex items-center bg-slate-700 rounded-lg p-1">
      <button 
        class="p-1.5 rounded transition-colors {viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
        onclick={() => onViewChange('grid')}
        title="Grid view"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="3" y="3" width="7" height="7" stroke-width="2"/>
          <rect x="14" y="3" width="7" height="7" stroke-width="2"/>
          <rect x="14" y="14" width="7" height="7" stroke-width="2"/>
          <rect x="3" y="14" width="7" height="7" stroke-width="2"/>
        </svg>
      </button>
      <button 
        class="p-1.5 rounded transition-colors {viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
        onclick={() => onViewChange('list')}
        title="List view"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <line x1="8" y1="6" x2="21" y2="6" stroke-width="2"/>
          <line x1="8" y1="12" x2="21" y2="12" stroke-width="2"/>
          <line x1="8" y1="18" x2="21" y2="18" stroke-width="2"/>
          <line x1="3" y1="6" x2="3.01" y2="6" stroke-width="2"/>
          <line x1="3" y1="12" x2="3.01" y2="12" stroke-width="2"/>
          <line x1="3" y1="18" x2="3.01" y2="18" stroke-width="2"/>
        </svg>
      </button>
    </div>
  </div>
</div>
