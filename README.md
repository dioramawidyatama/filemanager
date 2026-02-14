# FileManager v2.0

A modern, web-based file manager with SSH key authentication. Built with **SvelteKit 5** (full-stack) and **Tailwind CSS 4**.

## Features

- 🔐 **SSH Key Authentication** - Secure login using SSH public keys from authorized_keys
- 📁 **File Browser** - Grid and list views with responsive design
- 🛡️ **Path Security** - Blocks traversal attacks, sensitive files, and restricted directories
- 📱 **Mobile First** - Responsive Tailwind CSS design
- ⚡ **Fast** - SvelteKit 5 with runes and server-side rendering

## Architecture

```
┌─────────────────────────────────────┐
│         SvelteKit 5                 │
│    (Full-Stack Node.js Adapter)     │
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │   Frontend   │ │   API Routes │ │
│  │   (Svelte 5) │ │   (Server)   │ │
│  └──────────────┘ └──────────────┘ │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │  File Root   │
    │(/home/opc/   │
    │   clawd)     │
    └──────────────┘
```

## Tech Stack

- **Svelte 5** - Latest version with runes ($state, $derived, $effect)
- **SvelteKit 2.x** - Full-stack framework with Node.js adapter
- **Tailwind CSS 4** - Utility-first CSS framework
- **Node.js 20** - Runtime

## Quick Start

### Using Docker

```bash
# Clone and build
cd filemanager
docker-compose up -d

# Access the application
open http://localhost:3000
```

Your SSH public key from `~/.ssh/authorized_keys` is automatically mounted for authentication.

### Development

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start dev server
npm run dev
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `FILE_ROOT` | `/home/opc/clawd` | Root directory for files **(CRITICAL)** |
| `AUTHORIZED_KEYS_PATH` | `/home/opc/.ssh/authorized_keys` | Path to authorized_keys file |
| `NODE_ENV` | `development` | Environment mode |

## Security

### Path Restrictions

**Root Directory:** `/home/opc/clawd`

**Blocked Directories:**
- `.ssh/` - SSH keys
- `.gnupg/` - GPG keys
- `memory/` - Personal data
- `backups/` - Database backups
- `logs/` - Log files
- `config/` - Configuration files
- Hidden files (starting with `.`)

**Blocked Files:**
- `authorized_keys`, `.env`, private keys
- Any file containing: secrets, credentials, password, token, apikey

**Allowed Directories:**
- `projects/` - Read-write
- `docs/` - Read-write
- `src/` - Read-write
- `resources/` - Read-write

### Authentication

Users authenticate by pasting their SSH public key. The key is validated against the `authorized_keys` file using MD5 fingerprint matching.

**Session Token Format:**
```
base64url(fingerprint_no_colons:timestamp)
```

**Cookie Settings:**
- `httpOnly: true` - Prevents XSS access
- `secure: false` - Works over HTTP in development
- `sameSite: 'lax'` - CSRF protection
- `maxAge: 30 days`

### Audit Logging

All file operations are logged:
```
[AUDIT] 2024-01-01T00:00:00.000Z | SUCCESS | LIST_DIR | user=username | path=/projects
```

## Project Structure

```
filemanager/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte 5 components (runes)
│   │   ├── server/         # Server utilities
│   │   ├── stores.ts       # State management
│   │   └── types.ts        # TypeScript types
│   ├── routes/
│   │   ├── api/            # API endpoints
│   │   ├── login/          # Login page
│   │   ├── +page.svelte    # Main file manager
│   │   └── +layout.svelte  # App layout
│   ├── hooks.server.ts     # Auth hooks
│   └── app.css             # Tailwind CSS v4
├── Dockerfile
├── docker-compose.yml
├── svelte.config.js        # Svelte 5 config
└── package.json
```

## Svelte 5 Migration

All components use Svelte 5 runes:

```typescript
// State
let count = $state(0);

// Derived
let doubled = $derived(count * 2);

// Effects
$effect(() => {
  console.log('Count changed:', count);
});

// Props
interface Props {
  data: { files: FileNode[] };
}
let { data }: Props = $props();
```

## Development Tasks

- [x] SvelteKit project with Node.js adapter
- [x] SSH key authentication
- [x] Path sanitization with strict rules
- [x] File listing API with audit logging
- [x] Mobile-responsive layout
- [x] **Svelte 5 migration**
- [x] **FILE_ROOT = /home/opc/clawd**
- [x] **Security hardening**

## License

MIT
