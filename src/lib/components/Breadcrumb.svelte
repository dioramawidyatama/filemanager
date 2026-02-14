<script lang="ts">
  interface Props {
    path: string;
    onNavigate: (path: string) => void;
  }
  
  let { path, onNavigate }: Props = $props();
  
  let segments = $derived(path.split('/').filter(Boolean));
  
  function navigateTo(index: number) {
    const newPath = '/' + segments.slice(0, index + 1).join('/');
    onNavigate(newPath);
  }
  
  function navigateHome() {
    onNavigate('/');
  }
</script>

<div class="flex items-center gap-1 px-4 py-2 bg-slate-850 border-b border-slate-700 text-sm overflow-x-auto scrollbar-thin">
  <button 
    class="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors flex-shrink-0"
    onclick={navigateHome}
  >
    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
    </svg>
  </button>
  
  {#each segments as segment, index}
    <span class="text-slate-600 flex-shrink-0">/</span>
    <button 
      class="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-700 rounded transition-colors truncate max-w-[150px] sm:max-w-[200px]"
      onclick={() => navigateTo(index)}
    >
      {segment}
    </button>
  {/each}
</div>
