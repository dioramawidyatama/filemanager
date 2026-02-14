import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
  // Allow login page
  if (url.pathname === '/login') {
    return { user: locals.user };
  }
  
  // Require authentication for all other pages
  if (!locals.user) {
    throw redirect(303, '/login');
  }
  
  return { user: locals.user };
};
