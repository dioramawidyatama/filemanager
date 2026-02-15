<script lang="ts">
  import FileGrid from '$lib/components/FileGrid.svelte';
  import FileList from '$lib/components/FileList.svelte';
  import Breadcrumb from '$lib/components/Breadcrumb.svelte';
  import Toolbar from '$lib/components/Toolbar.svelte';
  import FileViewer from '$lib/components/FileViewer.svelte';
  import ContextMenu from '$lib/components/ContextMenu.svelte';
  import InlineRename from '$lib/components/InlineRename.svelte';
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
  
  // File viewer state
  let showViewer = $state(false);
  let selectedFile = $state<FileNode | null>(null);
  let fileContent = $state<string | null>(null);
  let fileLanguage = $state<string>('plaintext');
  let isLoadingContent = $state(false);
  
  // Context menu state
  let contextMenu = $state<{ x: number; y: number; file: FileNode | null } | null>(null);
  
  // Inline rename state
  let renamingFile = $state<FileNode | null>(null);
  
  // New file/folder modal state
  let showCreateModal = $state(false);
  let createType = $state<'file' | 'folder'>('file');
  let newItemName = $state('');
  
  // Upload state
  let uploadInput: HTMLInputElement;
  let isUploading = $state(false);
  let isDragOver = $state(false);
  
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
  
  async function handleFileClick(file: FileNode) {
    if (file.type === 'directory') {
      loadFiles(file.path);
    } else {
      await openFileViewer(file);
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
  
  async function openFileViewer(file: FileNode) {
    selectedFile = file;
    showViewer = true;
    isLoadingContent = true;
    fileContent = null;
    fileLanguage = 'plaintext';
    
    try {
      const response = await fetch(`/api/files/content?path=${encodeURIComponent(file.path)}`);
      
      if (response.ok) {
        const result = await response.json();
        fileLanguage = result.language || 'plaintext';
        
        if (result.type === 'text') {
          fileContent = result.content;
        } else {
          fileContent = null;
        }
      }
    } catch (error) {
      console.error('Error loading file:', error);
    } finally {
      isLoadingContent = false;
    }
  }
  
  function closeViewer() {
    showViewer = false;
    selectedFile = null;
    fileContent = null;
  }
  
  async function saveFile(content: string): Promise<void> {
    if (!selectedFile) return;
    
    const response = await fetch('/api/files/save', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: selectedFile.path, content }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Save failed');
    }
    
    // Refresh to update file size/modified time
    handleRefresh();
  }
  
  // Context Menu Handlers
  function handleContextMenu(event: MouseEvent, file: FileNode) {
    event.preventDefault();
    contextMenu = { x: event.clientX, y: event.clientY, file };
  }
  
  function closeContextMenu() {
    contextMenu = null;
  }
  
  function startRename(file: FileNode) {
    renamingFile = file;
    closeContextMenu();
  }
  
  async function handleRename(file: FileNode, newName: string) {
    try {
      const response = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: file.path, newName }),
      });
      
      if (response.ok) {
        handleRefresh();
      }
    } catch (error) {
      console.error('Rename failed:', error);
    }
    renamingFile = null;
  }
  
  async function handleDelete(file: FileNode) {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/delete?path=${encodeURIComponent(file.path)}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        handleRefresh();
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
    closeContextMenu();
  }
  
  function openCreateModal(type: 'file' | 'folder') {
    createType = type;
    newItemName = '';
    showCreateModal = true;
    closeContextMenu();
  }
  
  async function handleCreate() {
    if (!newItemName.trim()) return;
    
    try {
      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          parentPath: currentPath, 
          name: newItemName.trim(),
          type: createType 
        }),
      });
      
      if (response.ok) {
        handleRefresh();
        showCreateModal = false;
      } else {
        const error = await response.json();
        alert(error.message || 'Create failed');
      }
    } catch (error) {
      console.error('Create failed:', error);
    }
  }
  
  function triggerUpload() {
    uploadInput?.click();
    closeContextMenu();
  }
  
  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    const filesList = input.files;
    
    if (!filesList || filesList.length === 0) return;
    
    await uploadFiles(filesList);
    input.value = '';
  }
  
  async function uploadFiles(filesList: FileList) {
    isUploading = true;
    
    const formData = new FormData();
    formData.append('path', currentPath);
    
    for (const file of Array.from(filesList)) {
      formData.append('file', file);
    }
    
    try {
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        handleRefresh();
      } else {
        const error = await response.json();
        alert(error.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      isUploading = false;
    }
  }
  
  // Drag & Drop Handlers
  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = true;
  }
  
  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = false;
  }
  
  async function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    isDragOver = false;
    
    const items = event.dataTransfer?.items;
    if (!items) return;
    
    const filesToUpload: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          filesToUpload.push(file);
        }
      }
    }
    
    if (filesToUpload.length > 0) {
      const dataTransfer = new DataTransfer();
      filesToUpload.forEach(f => dataTransfer.items.add(f));
      await uploadFiles(dataTransfer.files);
    }
  }
  
  function handleGridFileClick(file: FileNode, event: MouseEvent) {
    if (renamingFile?.id === file.id) return;
    
    if (event.ctrlKey || event.metaKey) {
      return;
    }
    
    if (file.type === 'directory') {
      loadFiles(file.path);
    } else {
      handleFileClick(file);
    }
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
    onCreateFile={() => openCreateModal('file')}
    onCreateFolder={() => openCreateModal('folder')}
    onUpload={triggerUpload}
  />
  
  <!-- Breadcrumb -->
  <Breadcrumb path={currentPath} onNavigate={handleNavigate} />
  
  <!-- File Browser with Drag & Drop -->
  <div 
    class="flex-1 overflow-auto p-4 scrollbar-thin transition-colors {isDragOver ? 'bg-blue-500/10 border-2 border-blue-500 border-dashed' : ''}"
    oncontextmenu={(e) => handleContextMenu(e, null)}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    {#if isDragOver}
      <div class="flex flex-col items-center justify-center h-full text-blue-400 pointer-events-none">
        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
        </svg>
        <p class="text-lg font-medium">Drop files here to upload</p>
      </div>
    {:else if isLoading || isUploading}
      <div class="flex items-center justify-center h-full">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span class="ml-3 text-slate-400">{isUploading ? 'Uploading...' : 'Loading...'}</span>
      </div>
    {:else if files.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-slate-500">
        <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
        <p class="text-lg font-medium">This folder is empty</p>
        <p class="text-sm mt-1">Drag & drop files here or use the buttons above</p>
      </div>
    {:else}
      {#if viewMode === 'grid'}
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {#each files as file (file.id)}
            {#if renamingFile?.id === file.id}
              <div class="flex flex-col items-center p-4 rounded-xl bg-slate-800 border-2 border-blue-500">
                <InlineRename 
                  {file} 
                  onSave={(name) => handleRename(file, name)} 
                  onCancel={() => renamingFile = null} 
                />
              </div>
            {:else}
              <button
                class="group relative flex flex-col items-center p-4 rounded-xl transition-all duration-200
                  {selectedFiles.has(file.path) 
                    ? 'bg-blue-600/20 border-2 border-blue-500' 
                    : 'bg-slate-800 border-2 border-transparent hover:bg-slate-750 hover:border-slate-600'}"
                onclick={(e) => handleGridFileClick(file, e)}
                oncontextmenu={(e) => handleContextMenu(e, file)}
              >
                <!-- File Icon -->
                <div class="w-16 h-16 mb-3 flex items-center justify-center">
                  {#if file.type === 'directory'}
                    <svg class="w-14 h-14 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/>
                    </svg>
                  {:else if file.mimeType?.startsWith('image/')}
                    <svg class="w-14 h-14 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-5-5L5 21" stroke-width="2"/>
                    </svg>
                  {:else if file.name.match(/\.(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h|php)$/)}                    <svg class="w-14 h-14 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                    </svg>
                  {:else}
                    <svg class="w-14 h-14 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  {/if}
                </div>
                
                <!-- File Name -->
                <span class="text-sm text-center text-slate-200 font-medium truncate w-full px-1">
                  {file.name}
                </span>
                
                <!-- File Meta -->
                <span class="text-xs text-slate-500 mt-1">
                  {file.type === 'directory' ? '--' : `${(file.size / 1024).toFixed(1)} KB`}
                </span>
              </button>
            {/if}
          {/each}
        </div>
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

<!-- Hidden File Input -->
<input 
  bind:this={uploadInput}
  type="file"
  multiple
  class="hidden"
  onchange={handleFileUpload}
/>

<!-- Context Menu -->
{#if contextMenu}
  <ContextMenu
    x={contextMenu.x}
    y={contextMenu.y}
    file={contextMenu.file}
    onClose={closeContextMenu}
    onRename={startRename}
    onDelete={handleDelete}
    onCreateFile={() => openCreateModal('file')}
    onCreateFolder={() => openCreateModal('folder')}
    onRefresh={handleRefresh}
  />
{/if}

<!-- Create Modal -->
{#if showCreateModal}
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onclick={() => showCreateModal = false}>
    <div class="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md" onclick={(e) => e.stopPropagation()}>
      <h3 class="text-lg font-semibold text-white mb-4">
        Create New {createType === 'file' ? 'File' : 'Folder'}
      </h3>
      <input
        bind:value={newItemName}
        placeholder="Enter name..."
        class="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <div class="flex justify-end gap-3 mt-4">
        <button 
          class="px-4 py-2 text-slate-300 hover:text-white transition-colors"
          onclick={() => showCreateModal = false}
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          onclick={handleCreate}
          disabled={!newItemName.trim()}
        >
          Create
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- File Viewer Modal -->
{#if showViewer && selectedFile}
  <FileViewer 
    file={selectedFile}
    content={fileContent}
    language={fileLanguage}
    onClose={closeViewer}
    onSave={saveFile}
  />
{/if}
