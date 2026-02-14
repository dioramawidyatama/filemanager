import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { verifySSHKey, generateSessionToken } from '$lib/server/auth';

export const actions: Actions = {
  login: async ({ request, cookies, locals }) => {
    const formData = await request.formData();
    const sshKey = formData.get('sshKey') as string;
    
    if (!sshKey || typeof sshKey !== 'string') {
      return fail(400, { error: 'SSH key is required' });
    }
    
    const user = await verifySSHKey(sshKey, locals.authorizedKeysPath);
    
    if (!user) {
      return fail(401, { error: 'Invalid SSH key' });
    }
    
    // Generate session token
    const sessionToken = generateSessionToken(sshKey);
    
    // Set session cookie (30 days)
    cookies.set('session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });
    
    throw redirect(303, '/');
  },
  
  logout: async ({ cookies }) => {
    cookies.delete('session', { path: '/' });
    throw redirect(303, '/login');
  }
};
