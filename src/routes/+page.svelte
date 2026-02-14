<script lang="ts">
  import { onMount } from 'svelte';
  import FileGrid from '$lib/components/FileGrid.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import type { FileNode } from '$lib/types';
  
  interface Props {
    data: { files: FileNode[]; currentPath: string };
  }
  
  let { data }: Props = $props();
  
  // State using Svelte 5 runes
  let files = $state<FileNode[]>(data.files);
  let currentPath = $state(data.currentPath);
  let viewMode = $state<'grid' | 'list'>('grid');
  let selectedFiles = $state<Set<string>>(new Set());
  let isLoading = $state(false);
  
  // Derived state
  let selectedCount = $derived(selectedFiles.size);
  
  async function loadFiles(path: string) {
    isLoading = true;
    try {
      const response = await fetch(`/api/files?path=${encodeURIComponent(path)}`);
      if (response.ok) {
        const result = await response.json();
        files = result.files;
        currentPath = result.path;
        selectedFiles = new Set();
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function handleNavigate(path: string) {
    loadFiles(path);
  }
  
  function handleFileClick(file: FileNode) {
    if (file.type === 'directory') {
      loadFiles(file.path);
    }
  }
  
  function handleSelect(newSelected: Set<string>) {
    selectedFiles = newSelected;
  }
  
  function handleRefresh() {
    loadFiles(currentPath);
  }
  
  function handleViewChange(mode: 'grid' | 'list') {
    viewMode = mode;
  }
</script>

<div class="h-full flex flex-col">
  <!-- Toolbar -->
  <Toolbar 
    {currentPath}
    {selectedCount}
    {viewMode}
    onRefresh={handleRefresh}
    onViewChange={handleViewChange}
  />
  
  <!-- Breadcrumb -->
  <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
  
  <!-- File Browser -->
  <div class="flex-1 overflow-auto p-4 scrollbar-thin">
    {#if isLoading}
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    {:else if files.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-slate-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p class="text-lg font-medium">This folder is empty</p>
        <p class="text-sm mt-1">Upload files to get started</p>
      </div>
    {:else}
      {#if viewMode === 'grid'}
        <FileGrid 
          {files}
          {selectedFiles}
          onFileClick={handleFileClick}
          onSelect={handleSelect}
        />
      {:else}
        <FileList 
          {files}
          {selectedFiles}
          onFileClick={handleFileClick}
          onSelect={handleSelect}
        />
      {/if}
    {/if}
  </div>
</div>
