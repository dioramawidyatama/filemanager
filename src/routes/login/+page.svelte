<script>
  import { enhance } from '$app/forms';
  
  export let form;
  
  let sshKey = '';
  let isSubmitting = false;
</script>

<div class="min-h-screen flex items-center justify-center bg-slate-900 p-4">
  <div class="w-full max-w-lg">
    <div class="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-2xl">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-white mb-2">FileManager</h1>
        <p class="text-slate-400">Authenticate with your SSH key</p>
      </div>
      
      <!-- Form -->
      <form method="POST" action="?/login" use:enhance={() => {
        isSubmitting = true;
        return async ({ result, update }) => {
          isSubmitting = false;
          await update();
        };
      }}>
        {#if form?.error}
          <div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {form.error}
          </div>
        {/if}
        
        <div class="mb-4">
          <label for="sshKey" class="block text-sm font-medium text-slate-300 mb-2">
            SSH Public Key
          </label>
          <textarea
            id="sshKey"
            name="sshKey"
            bind:value={sshKey}
            placeholder="Paste your SSH public key here (ssh-rsa, ssh-ed25519, etc.)"
            class="w-full h-40 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
            required
          ></textarea>
          <p class="mt-2 text-xs text-slate-500">
            Your key should look like: <code class="text-slate-400">ssh-ed25519 AAAAC3NzaC... username</code>
          </p>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || !sshKey.trim()}
          class="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {#if isSubmitting}
            <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Authenticating...
          {:else}
            Sign In
          {/if}
        </button>
      </form>
      
      <div class="mt-6 text-center text-xs text-slate-500">
        <p>Your SSH key must be in the server's authorized_keys file.</p>
      </div>
    </div>
  </div>
</div>
