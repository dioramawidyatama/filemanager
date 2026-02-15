<script lang="ts">
  import CodeViewer from './CodeViewer.svelte';
  import MarkdownPreview from './MarkdownPreview.svelte';
  import type { FileNode } from '$lib/types';
  
  interface Props {
    file: FileNode;
    content: string | null;
    language: string;
    onClose: () => void;
  }
  
  let { file, content, language, onClose }: Props = $props();
  
  let isLoading = $state(false);
  let copySuccess = $state(false);
  
  // Determine file type from extension or language
  function getFileType(filename: string, lang: string): 'code' | 'markdown' | 'image' | 'binary' {
    // Check language first (from API)
    if (lang === 'markdown') return 'markdown';
    
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    
    if (['md', 'mdx'].includes(ext)) return 'markdown';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)) return 'image';
    if (['txt', 'js', 'jsx', 'ts', 'tsx', 'html', 'css', 'scss', 'sass', 'less', 'json', 'xml', 'yaml', 'yml', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'hpp', 'php', 'swift', 'kt', 'sh', 'bash', 'zsh', 'sql', 'dockerfile', 'tf'].includes(ext)) return 'code';
    
    return 'binary';
  }
  
  const fileType = $derived(getFileType(file.name, language));
  
  // Format file size
  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // Download file
  async function downloadFile() {
    try {
      const response = await fetch(`/api/files/download?path=${encodeURIComponent(file.path)}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Download failed:', err);
    }
  }
  
  // Copy content
  async function copyContent() {
    if (content) {
      await navigator.clipboard.writeText(content);
      copySuccess = true;
      setTimeout(() => copySuccess = false, 2000);
    }
  }
  
  // Large file warning threshold (2MB)
  const LARGE_FILE_THRESHOLD = 2 * 1024 * 1024;
  const isLargeFile = $derived(file.size > LARGE_FILE_THRESHOLD);
</script>

<!-- Modal Overlay -->
<div class="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onclick={onClose}>
  <!-- Modal Content -->
  <div 
    class="bg-slate-900 rounded-xl border border-slate-700 w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
    onclick={(e) => e.stopPropagation()}
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
      <div class="flex items-center gap-3 min-w-0">
        <!-- File Icon -->
        <div class="flex-shrink-0">
          {#if fileType === 'image'}
            <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21" stroke-width="2"/>
            </svg>
          {:else if fileType === 'markdown'}
            <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          {:else if fileType === 'code'}
            <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
            </svg>
          {:else}
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
          {/if}
        </div>
        
        <!-- File Info -->
        <div class="min-w-0">
          <h3 class="text-lg font-semibold text-white truncate">{file.name}</h3>
          <p class="text-sm text-slate-400">{formatSize(file.size)} • {file.mimeType || 'Unknown type'}</p>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center gap-3">
        {#if content && fileType !== 'image'}
          <button 
            class="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors flex items-center gap-2"
            onclick={copyContent}
          >
            {#if copySuccess}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Copied!
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copy
            {/if}
          </button>
        {/if}
        
        <button 
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
          onclick={downloadFile}
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Download
        </button>
        
        <button 
          class="p-2 text-slate-400 hover:text-white transition-colors"
          onclick={onClose}
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Large File Warning -->
    {#if isLargeFile}
      <div class="px-6 py-3 bg-yellow-500/10 border-b border-yellow-500/30 flex items-center gap-3">
        <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
        <span class="text-sm text-yellow-400">
          Large file ({formatSize(file.size)}). Preview may be slow.
        </span>
      </div>
    {/if}
    
    <!-- Content Area -->
    <div class="flex-1 overflow-hidden p-4">
      {#if fileType === 'code' && content}
        <CodeViewer {content} {language} filename={file.name} />
      {:else if fileType === 'markdown' && content}
        <MarkdownPreview {content} filename={file.name} />
      {:else if fileType === 'image'}
        <div class="h-full flex items-center justify-center bg-slate-800 rounded-lg">
          <img 
            src={`/api/files/raw?path=${encodeURIComponent(file.path)}`} 
            alt={file.name}
            class="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      {:else}
        <!-- Binary or unsupported file -->
        <div class="h-full flex flex-col items-center justify-center bg-slate-800 rounded-lg text-slate-400">
          <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          <p class="text-lg font-medium text-slate-300 mb-2">Binary File</p>
          <p class="text-sm mb-4">This file type cannot be previewed.</p>
          <button 
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2"
            onclick={downloadFile}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Download File
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
