<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  
  interface Props {
    content: string;
    language: string;
    filename?: string;
  }
  
  let { content, language, filename = '' }: Props = $props();
  
  let editorContainer: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = $state(null);
  let monaco: typeof Monaco | null = $state(null);
  
  onMount(async () => {
    // Dynamically import Monaco Editor
    monaco = await import('monaco-editor');
    
    // Configure Monaco environment
    self.MonacoEnvironment = {
      getWorker: async (_moduleId: unknown, label: string) => {
        if (label === 'json') {
          return new (await import('monaco-editor/esm/vs/language/json/json.worker?worker')).default();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
          return new (await import('monaco-editor/esm/vs/language/css/css.worker?worker')).default();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
          return new (await import('monaco-editor/esm/vs/language/html/html.worker?worker')).default();
        }
        if (label === 'typescript' || label === 'javascript') {
          return new (await import('monaco-editor/esm/vs/language/typescript/ts.worker?worker')).default();
        }
        return new (await import('monaco-editor/esm/vs/editor/editor.worker?worker')).default();
      }
    };
    
    // Create editor
    editor = monaco.editor.create(editorContainer, {
      value: content,
      language: mapLanguage(language),
      theme: 'vs-dark',
      readOnly: true,
      automaticLayout: true,
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      renderWhitespace: 'selection',
      tabSize: 2,
      wordWrap: 'on',
      folding: true,
      foldingHighlight: true,
      showFoldingControls: 'always',
    });
  });
  
  onDestroy(() => {
    if (editor) {
      editor.dispose();
      editor = null;
    }
  });
  
  // Update content when it changes
  $effect(() => {
    if (editor && content !== editor.getValue()) {
      editor.setValue(content);
    }
  });
  
  // Update language when it changes
  $effect(() => {
    if (editor && monaco) {
      const model = editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, mapLanguage(language));
      }
    }
  });
  
  function mapLanguage(lang: string): string {
    const languageMap: Record<string, string> = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json',
      'python': 'python',
      'markdown': 'markdown',
      'yaml': 'yaml',
      'xml': 'xml',
      'sql': 'sql',
      'shell': 'shell',
      'powershell': 'powershell',
      'dockerfile': 'dockerfile',
      'rust': 'rust',
      'go': 'go',
      'java': 'java',
      'php': 'php',
      'ruby': 'ruby',
      'csharp': 'csharp',
      'cpp': 'cpp',
      'c': 'c',
      'swift': 'swift',
      'kotlin': 'kotlin',
      'scala': 'scala',
      'r': 'r',
      'vue': 'html',
      'svelte': 'html',
      'scss': 'scss',
      'sass': 'sass',
      'less': 'less',
      'toml': 'ini',
      'ini': 'ini',
      'terraform': 'hcl',
      'graphql': 'graphql',
    };
    
    return languageMap[lang] || 'plaintext';
  }
  
  function copyContent() {
    navigator.clipboard.writeText(content);
  }
  
  function downloadFile() {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
</script>

<div class="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
  <!-- Toolbar -->
  <div class="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
    <div class="flex items-center gap-2">
      <span class="text-xs font-mono text-slate-400 uppercase">{language}</span>
      {#if filename}
        <span class="text-xs text-slate-500">• {filename}</span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
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
  
  <!-- Editor -->
  <div bind:this={editorContainer} class="flex-1 min-h-[400px]"></div>
</div>

<style>
  :global(.monaco-editor) {
    padding-top: 8px;
  }
</style>
