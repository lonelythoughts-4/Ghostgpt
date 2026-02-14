import type { AppSettings, PaymentMethod, PublicSession, VerificationResult, ChainEnv } from './payments';
import { getTelegramInitData } from './telegramWebApp';

function getApiBaseUrl(): string {
  const base = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_BASE_URL;
  return (base ?? '').trim().replace(/\/+$/, '');
}

async function readJsonOrThrow<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;

  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error?: unknown }).error ?? `HTTP ${res.status}`)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  const url = base ? `${base}${path}` : path;

  const headers = new Headers(init?.headers ?? {});
  if (!headers.has('content-type') && init?.body) {
    headers.set('content-type', 'application/json');
  }

  const initData = getTelegramInitData();
  if (initData && !headers.has('x-telegram-init-data')) {
    headers.set('x-telegram-init-data', initData);
  }

  const res = await fetch(url, { ...init, headers });
  return readJsonOrThrow<T>(res);
}

export const backendApi = {
  async getSettings(): Promise<AppSettings> {
    return apiFetch<AppSettings>('/api/v1/settings', { method: 'GET' });
  },

  async createSession(method: PaymentMethod): Promise<PublicSession> {
    return apiFetch<PublicSession>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  },

  async verifySession(sessionId: string): Promise<VerificationResult> {
    return apiFetch<VerificationResult>(`/api/v1/sessions/${encodeURIComponent(sessionId)}/verify`, {
      method: 'POST',
    });
  },

  async setChainEnv(chainEnv: ChainEnv): Promise<AppSettings> {
    return apiFetch<AppSettings>('/admin/settings', {
      method: 'POST',
      body: JSON.stringify({ chainEnv }),
    });
  },
};

