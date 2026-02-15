<script lang="ts">
  import type { FileNode } from '$lib/types';
  
  interface Props {
    file: FileNode;
    onSave: (newName: string) => void;
    onCancel: () => void;
  }
  
  let { file, onSave, onCancel }: Props = $props();
  
  let newName = $state(file.name);
  let inputElement: HTMLInputElement;
  let error = $state('');
  
  // Focus input on mount
  $effect(() => {
    if (inputElement) {
      inputElement.focus();
      inputElement.select();
    }
  });
  
  function handleSubmit() {
    const trimmed = newName.trim();
    
    if (!trimmed) {
      error = 'Name cannot be empty';
      return;
    }
    
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      error = 'Name cannot contain path separators';
      return;
    }
    
    if (trimmed.startsWith('.')) {
      error = 'Name cannot start with a dot';
      return;
    }
    
    if (trimmed === file.name) {
      onCancel();
      return;
    }
    
    onSave(trimmed);
  }
  
  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<div class="flex flex-col gap-1">
  <input
    bind:this={inputElement}
    bind:value={newName}
    onkeydown={handleKeydown}
    onblur={handleSubmit}
    class="w-full px-2 py-1 bg-slate-700 border border-blue-500 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
    type="text"
  />
  {#if error}
    <span class="text-xs text-red-400">{error}</span>
  {/if}
</div>
