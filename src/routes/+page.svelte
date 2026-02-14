<script lang="ts">
  import { onMount } from 'svelte';
  import { files, currentPath, selectedFiles, viewMode, isLoading } from '$lib/stores';
  import FileGrid from '$lib/components/FileGrid.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import type { FileNode } from '$lib/types';
  
  export let data: { files: FileNode[]; currentPath: string };
  
  // Initialize from server data
  $: files.set(data.files);
  $: currentPath.set(data.currentPath);
  
  async function loadFiles(path: string) {
    isLoading.set(true);
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const result = await response.json();
        files.set(result.files);
        currentPath.set(result.path);
        selectedFiles.set(new Set());
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      isLoading.set(false);
    }
  }
  
  function handleNavigate(event: CustomEvent<string>) {
    const path = event.detail;
    loadFiles(path);
  }
  
  function handleFileClick(event: CustomEvent<FileNode>) {
    const file = event.detail;
    if (file.type === 'directory') {
      loadFiles(file.path);
    }
  }
  
  function handleSelect(event: CustomEvent<Set<string>>) {
    selectedFiles.set(event.detail);
  }
</script>

<div class="h-full flex flex-col">
  <!-- Toolbar -->
  <Toolbar 
    on:refresh={() => loadFiles($currentPath)}
    on:viewChange={(e) => viewMode.set(e.detail)}
  />
  
  <!-- Breadcrumb -->
  <Breadcrumb path={$currentPath} on:navigate={handleNavigate} />
  
  <!-- File Browser -->
  <div class="flex-1 overflow-auto p-4 scrollbar-thin">
    {#if $isLoading}
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    {:else if $files.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-slate-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p class="text-lg font-medium">This folder is empty</p>
        <p class="text-sm mt-1">Upload files to get started</p>
      </div>
    {:else}
      {#if $viewMode === 'grid'}
        <FileGrid 
          files={$files} 
          selected={$selectedFiles}
          on:click={handleFileClick}
          on:select={handleSelect}
        />
      {:else}
        <FileList 
          files={$files}
          selected={$selectedFiles}
          on:click={handleFileClick}
          on:select={handleSelect}
        />
      {/if}
    {/if}
  </div>
</div>
