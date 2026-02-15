<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type * as Monaco from 'monaco-editor';
  
  interface Props {
    content: string;
    language: string;
    filename?: string;
    readOnly?: boolean;
    onSave?: (content: string) => void;
    onContentChange?: (content: string) => void;
  }
  
  let { 
    content, 
    language, 
    filename = '', 
    readOnly = true, 
    onSave,
    onContentChange 
  }: Props = $props();
  
  let editorContainer: HTMLDivElement;
  let editor: Monaco.editor.IStandaloneCodeEditor | null = $state(null);
  let monaco: typeof Monaco | null = $state(null);
  let isDirty = $state(false);
  let isSaving = $state(false);
  
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
      readOnly: readOnly,
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
    
    // Track content changes
    editor.onDidChangeModelContent(() => {
      if (editor) {
        const newContent = editor.getValue();
        isDirty = newContent !== content;
        onContentChange?.(newContent);
      }
    });
    
    // Add save command (Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  });
  
  onDestroy(() => {
    if (editor) {
      editor.dispose();
      editor = null;
    }
  });
  
  // Update content when it changes (only if not dirty)
  $effect(() => {
    if (editor && content !== editor.getValue() && !isDirty) {
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
  
  // Update readOnly when it changes
  $effect(() => {
    if (editor) {
      editor.updateOptions({ readOnly });
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
  
  async function handleSave() {
    if (!editor || !onSave || !isDirty) return;
    
    isSaving = true;
    try {
      const newContent = editor.getValue();
      await onSave(newContent);
      isDirty = false;
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      isSaving = false;
    }
  }
  
  function copyContent() {
    if (editor) {
      navigator.clipboard.writeText(editor.getValue());
    }
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
  
  function toggleEditMode() {
    if (editor) {
      const newReadOnly = !editor.getOption(monaco!.editor.EditorOption.readOnly);
      editor.updateOptions({ readOnly: newReadOnly });
    }
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
      {#if isDirty}
        <span class="text-xs text-yellow-500">• Unsaved</span>
      {/if}
    </div>
    <div class="flex items-center gap-2">
      {#if !readOnly}
        <button 
          class="px-3 py-1 text-xs bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white rounded transition-colors flex items-center gap-1"
          onclick={handleSave}
          disabled={!isDirty || isSaving}
        >
          {#if isSaving}
            <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Saving...
          {:else}
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"/>
            </svg>
            Save
          {/if}
        </button>
      {/if}
      
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
