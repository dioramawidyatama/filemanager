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
    @apply text-2xl font-bold text-white mb-4 pb-2 border-b border-slate-700;
  }
  
  .markdown-body :global(h2) {
    @apply text-xl font-semibold text-white mt-6 mb-3 pb-2 border-b border-slate-700;
  }
  
  .markdown-body :global(h3) {
    @apply text-lg font-semibold text-slate-200 mt-4 mb-2;
  }
  
  .markdown-body :global(h4, h5, h6) {
    @apply font-semibold text-slate-300 mt-3 mb-2;
  }
  
  .markdown-body :global(p) {
    @apply mb-4 leading-relaxed;
  }
  
  .markdown-body :global(a) {
    @apply text-blue-400 hover:text-blue-300 underline;
  }
  
  .markdown-body :global(ul, ol) {
    @apply mb-4 pl-6;
  }
  
  .markdown-body :global(ul) {
    @apply list-disc;
  }
  
  .markdown-body :global(ol) {
    @apply list-decimal;
  }
  
  .markdown-body :global(li) {
    @apply mb-1;
  }
  
  .markdown-body :global(code) {
    @apply bg-slate-800 text-slate-200 px-1.5 py-0.5 rounded text-sm font-mono;
  }
  
  .markdown-body :global(pre) {
    @apply bg-slate-800 p-4 rounded-lg overflow-x-auto mb-4;
  }
  
  .markdown-body :global(pre code) {
    @apply bg-transparent p-0;
  }
  
  .markdown-body :global(blockquote) {
    @apply border-l-4 border-blue-500 pl-4 py-1 my-4 bg-slate-800/50;
  }
  
  .markdown-body :global(table) {
    @apply w-full border-collapse mb-4;
  }
  
  .markdown-body :global(th, td) {
    @apply border border-slate-700 px-3 py-2 text-left;
  }
  
  .markdown-body :global(th) {
    @apply bg-slate-800 font-semibold text-slate-200;
  }
  
  .markdown-body :global(td) {
    @apply text-slate-300;
  }
  
  .markdown-body :global(hr) {
    @apply border-slate-700 my-6;
  }
  
  .markdown-body :global(img) {
    @apply max-w-full rounded-lg;
  }
  
  .markdown-body :global(.highlight) {
    @apply bg-yellow-500/20 px-1 rounded;
  }
</style>
