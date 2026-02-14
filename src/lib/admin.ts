export async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyAdminPassphrase(passphrase: string): Promise<boolean> {
  const expected = (import.meta as { env?: Record<string, string | undefined> }).env
    ?.VITE_ADMIN_PASSPHRASE_SHA256;
  if (!expected) return false;

  const actual = await sha256Hex(passphrase);
  return actual.toLowerCase() === expected.trim().toLowerCase();
}

