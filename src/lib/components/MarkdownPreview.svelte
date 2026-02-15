<script lang="ts">
  import { marked } from 'marked';
  import DOMPurify from 'dompurify';
  import { onMount } from 'svelte';
  
  interface Props {
    content: string;
    filename?: string;
  }
  
  let { content, filename = '' }: Props = $props();
  
  let viewMode = $state<'rendered' | 'raw'>('rendered');
  let renderedContent = $state('');
  let purify: typeof DOMPurify | null = $state(null);
  
  onMount(() => {
    // Initialize DOMPurify
    purify = DOMPurify;
  });
  
  // Configure marked for GitHub Flavored Markdown
  marked.setOptions({
    gfm: true,
    breaks: true,
    headerIds: true,
    mangle: false,
  });
  
  // Render markdown when content changes
  $effect(() => {
    if (purify) {
      const rawHtml = marked.parse(content) as string;
      renderedContent = purify.sanitize(rawHtml);
    }
  });
  
  function copyContent() {
    navigator.clipboard.writeText(content);
  }
  
  function downloadFile() {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'document.md';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
  <!-- Toolbar -->
  <div class="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
    <div class="flex items-center gap-2">
      <span class="text-xs font-mono text-slate-400 uppercase">Markdown</span>
      {#if filename}
        <span class="text-xs text-slate-500">• {filename}</span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      <!-- View Toggle -->
      <div class="flex items-center bg-slate-700 rounded p-0.5">
        <button 
          class="px-2 py-1 text-xs rounded transition-colors {viewMode === 'rendered' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
          onclick={() => viewMode = 'rendered'}
        >
          Rendered
        </button>
        <button 
          class="px-2 py-1 text-xs rounded transition-colors {viewMode === 'raw' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
          onclick={() => viewMode = 'raw'}
        >
          Raw
        </button>
      </div>
      
      <button 
        class="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors"
        onclick={copyContent}
      >
        Copy
      </button>
      <button 
        class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
        onclick={downloadFile}
      >
        Download
      </button>
    </div>
  </div>
  
  <!-- Content -->
  <div class="flex-1 overflow-auto">
    {#if viewMode === 'rendered'}
      <div class="markdown-body p-6 text-slate-200">
        {@html renderedContent}
      </div>
    {:else}
      <pre class="p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap">{content}</pre>
    {/if}
  </div>
</div>

<style>
  .markdown-body :global(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    color: white;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #334155;
  }
  
  .markdown-body :global(h2) {
    font-size: 1.25rem;
    font-weight: 600;
    color: white;
    margin-top: 1.5rem;
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #334155;
  }
  
  .markdown-body :global(h3) {
    font-size: 1.125rem;
    font-weight: 600;
    color: #e2e8f0;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .markdown-body :global(h4),
  .markdown-body :global(h5),
  .markdown-body :global(h6) {
    font-weight: 600;
    color: #cbd5e1;
    margin-top: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .markdown-body :global(p) {
    margin-bottom: 1rem;
    line-height: 1.625;
  }
  
  .markdown-body :global(a) {
    color: #60a5fa;
    text-decoration: underline;
  }
  
  .markdown-body :global(a:hover) {
    color: #93c5fd;
  }
  
  .markdown-body :global(ul) {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    list-style-type: disc;
  }
  
  .markdown-body :global(ol) {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
    list-style-type: decimal;
  }
  
  .markdown-body :global(li) {
    margin-bottom: 0.25rem;
  }
  
  .markdown-body :global(code) {
    background-color: #1e293b;
    color: #e2e8f0;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    font-family: monospace;
  }
  
  .markdown-body :global(pre) {
    background-color: #1e293b;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
    margin-bottom: 1rem;
  }
  
  .markdown-body :global(pre code) {
    background-color: transparent;
    padding: 0;
  }
  
  .markdown-body :global(blockquote) {
    border-left: 4px solid #3b82f6;
    padding-left: 1rem;
    padding-top: 0.25rem;
    padding-bottom: 0.25rem;
    margin-top: 1rem;
    margin-bottom: 1rem;
    background-color: rgba(30, 41, 59, 0.5);
  }
  
  .markdown-body :global(table) {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  
  .markdown-body :global(th) {
    border: 1px solid #334155;
    padding: 0.5rem 0.75rem;
    text-align: left;
    background-color: #1e293b;
    font-weight: 600;
    color: #e2e8f0;
  }
  
  .markdown-body :global(td) {
    border: 1px solid #334155;
    padding: 0.5rem 0.75rem;
    text-align: left;
    color: #cbd5e1;
  }
  
  .markdown-body :global(hr) {
    border-color: #334155;
    margin-top: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .markdown-body :global(img) {
    max-width: 100%;
    border-radius: 0.5rem;
  }
  
  .markdown-body :global(.highlight) {
    background-color: rgba(234, 179, 8, 0.2);
    padding-left: 0.25rem;
    padding-right: 0.25rem;
    border-radius: 0.25rem;
  }
</style>
