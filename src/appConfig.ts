// Frontend configuration.
//
// NOTE:
// - This bundle runs in the user's browser.
// - Do not put secrets here (no seed phrases, no admin tokens, no private keys).
// - If your cloudflared URL changes, you must update API_BASE_URL and redeploy.

export const API_BASE_URL = 'https://proven-nice-discrete-windsor.trycloudflare.com';

// Used only to hide/show admin UI controls. Server-side auth is still required.
export const ADMIN_TELEGRAM_ID = 7623727266;
