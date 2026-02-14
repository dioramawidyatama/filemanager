/// <reference types="@sveltejs/kit" />
/// <reference types="vite/client" />

import type { User } from '$lib/types';

declare global {
  namespace App {
    interface Error {
      message: string;
      code?: string;
    }
    interface Locals {
      user: User | null;
      authorizedKeysPath: string;
      fileRoot: string;
    }
    interface PageData {
      user?: User;
    }
    interface Platform {}
  }
}

export {};
