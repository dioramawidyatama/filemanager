# FileManager

A modern, web-based file manager with SSH key authentication. Built with SvelteKit (full-stack) and Tailwind CSS.

## Features

- 🔐 **SSH Key Authentication** - Secure login using SSH public keys from authorized_keys
- 📁 **File Browser** - Grid and list views with responsive design
- 🛡️ **Path Security** - Blocks traversal attacks and sensitive file access
- 📱 **Mobile First** - Responsive Tailwind CSS design
- ⚡ **Fast** - SvelteKit with server-side rendering

## Architecture

```
┌─────────────────────────────────────┐
│           SvelteKit                 │
│    (Full-Stack Node.js Adapter)     │
│                                     │
│  ┌──────────────┐ ┌──────────────┐ │
│  │   Frontend   │ │   API Routes │ │
│  │   (Svelte)   │ │   (Server)   │ │
│  └──────────────┘ └──────────────┘ │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │   File Root  │
    │   (/data)    │
    └──────────────┘
```

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
| `FILE_ROOT` | `/data` | Root directory for files |
| `AUTHORIZED_KEYS_PATH` | `/data/.ssh/authorized_keys` | Path to authorized_keys file |
| `NODE_ENV` | `development` | Environment mode |

## Authentication

Users authenticate by pasting their SSH public key. The key is validated against the `authorized_keys` file using MD5 fingerprint matching.

Supported key formats:
- `ssh-rsa`
- `ssh-ed25519`
- `ssh-ecdsa`
- `ssh-dss`

## Security

- ✅ SSH key authentication (no passwords)
- ✅ Path traversal protection
- ✅ Blocked sensitive paths (/etc, /proc, .ssh, etc.)
- ✅ Blocked sensitive files (.env, private keys)
- ✅ Session-based authentication with httpOnly cookies
- ✅ CSRF protection via SameSite cookies

## Project Structure

```
filemanager/
├── src/
│   ├── lib/
│   │   ├── components/     # Svelte components
│   │   ├── server/         # Server utilities
│   │   ├── stores.ts       # Svelte stores
│   │   └── types.ts        # TypeScript types
│   ├── routes/
│   │   ├── api/            # API endpoints
│   │   ├── login/          # Login page
│   │   ├── +page.svelte    # Main file manager
│   │   └── +layout.svelte  # App layout
│   ├── hooks.server.ts     # Auth hooks
│   └── app.html
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Development Tasks

- [x] Scaffold SvelteKit project with Node.js adapter
- [x] Setup SSH key authentication
- [x] Implement path sanitization
- [x] Build file listing API
- [x] Create mobile-responsive layout

## License

MIT
