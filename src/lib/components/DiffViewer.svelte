<script lang="ts">
  interface Props {
    oldContent: string;
    newContent: string;
    oldLabel?: string;
    newLabel?: string;
    onClose: () => void;
  }
  
  let { 
    oldContent, 
    newContent, 
    oldLabel = 'Old Version', 
    newLabel = 'New Version',
    onClose 
  }: Props = $props();
  
  type DiffLine = {
    type: 'unchanged' | 'added' | 'removed';
    oldLineNum: number | null;
    newLineNum: number | null;
    content: string;
  };
  
  // Simple line-by-line diff
  let diffLines = $derived<DiffLine[]>(() => {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const result: DiffLine[] = [];
    
    let oldIndex = 0;
    let newIndex = 0;
    
    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldLines[oldIndex];
      const newLine = newLines[newIndex];
      
      if (oldIndex >= oldLines.length) {
        // Only new lines left
        result.push({
          type: 'added',
          oldLineNum: null,
          newLineNum: newIndex + 1,
          content: newLine,
        });
        newIndex++;
      } else if (newIndex >= newLines.length) {
        // Only old lines left
        result.push({
          type: 'removed',
          oldLineNum: oldIndex + 1,
          newLineNum: null,
          content: oldLine,
        });
        oldIndex++;
      } else if (oldLine === newLine) {
        // Lines match
        result.push({
          type: 'unchanged',
          oldLineNum: oldIndex + 1,
          newLineNum: newIndex + 1,
          content: oldLine,
        });
        oldIndex++;
        newIndex++;
      } else {
        // Lines differ - simplified approach
        result.push({
          type: 'removed',
          oldLineNum: oldIndex + 1,
          newLineNum: null,
          content: oldLine,
        });
        result.push({
          type: 'added',
          oldLineNum: null,
          newLineNum: newIndex + 1,
          content: newLine,
        });
        oldIndex++;
        newIndex++;
      }
    }
    
    return result;
  }());
  
  let showUnchanged = $state(true);
  
  let filteredLines = $derived(showUnchanged ? diffLines : diffLines.filter(l => l.type !== 'unchanged'));
  
  let stats = $derived({
    added: diffLines.filter(l => l.type === 'added').length,
    removed: diffLines.filter(l => l.type === 'removed').length,
    unchanged: diffLines.filter(l => l.type === 'unchanged').length,
  });
</script>

<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onclick={onClose}>
  <div 
    class="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-6xl h-[90vh] flex flex-col"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
      <div>
        <h3 class="text-lg font-semibold text-white">Diff View</h3>
        <div class="flex items-center gap-4 mt-1 text-sm">
          <span class="text-red-400">-{stats.removed} lines</span>
          <span class="text-green-400">+{stats.added} lines</span>
          <span class="text-slate-500">{stats.unchanged} unchanged</span>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input 
            type="checkbox" 
            bind:checked={showUnchanged}
            class="rounded bg-slate-700 border-slate-600"
          />
          Show unchanged
        </label>
        <button class="text-slate-400 hover:text-white" onclick={onClose}>
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Labels -->
    <div class="grid grid-cols-2 gap-px bg-slate-700 text-sm">
      <div class="bg-slate-800 px-4 py-2 text-slate-400">{oldLabel}</div>
      <div class="bg-slate-800 px-4 py-2 text-slate-400">{newLabel}</div>
    </div>
    
    <!-- Diff Content -->
    <div class="flex-1 overflow-auto font-mono text-sm">
      <table class="w-full">
        <tbody>
          {#each filteredLines as line}
            <tr class={line.type === 'added' ? 'bg-green-500/10' : line.type === 'removed' ? 'bg-red-500/10' : ''}>
              <!-- Old Line Number -->
              <td class="w-12 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-700/50">
                {line.oldLineNum || ''}
              </td>
              <!-- Old Content -->
              <td class="w-1/2 px-3 py-0.5 whitespace-pre border-r border-slate-700 {line.type === 'removed' ? 'text-red-300' : line.type === 'unchanged' ? 'text-slate-300' : ''}">
                {line.type === 'added' ? '' : line.content}
              </td>
              <!-- New Line Number -->
              <td class="w-12 px-2 py-0.5 text-right text-slate-500 select-none border-r border-slate-700/50">
                {line.newLineNum || ''}
              </td>
              <!-- New Content -->
              <td class="w-1/2 px-3 py-0.5 whitespace-pre {line.type === 'added' ? 'text-green-300' : line.type === 'unchanged' ? 'text-slate-300' : ''}">
                {line.type === 'removed' ? '' : line.content}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</div>
