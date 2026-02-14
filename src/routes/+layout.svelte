<script lang="ts">
  import '../app.css';
  
  interface Props {
    data: { user: { id: string; username: string; fingerprint: string } | null };
    children: import('svelte').Snippet;
  }
  
  let { data, children }: Props = $props();
</script>

{#if data.user}
  <div class="min-h-screen flex flex-col bg-slate-900">
    <!-- Header -->
    <header class="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h1 class="text-lg font-semibold text-white hidden sm:block">FileManager</h1>
      </div>
      
      <div class="flex items-center gap-4">
        <span class="text-sm text-slate-400 hidden md:block">{data.user.username}</span>
        <form method="POST" action="/login?/logout">
          <button type="submit" class="p-2 text-slate-400 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </form>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="flex-1 overflow-hidden">
      {@render children()}
    </main>
  </div>
{:else}
  {@render children()}
{/if}
