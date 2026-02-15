import type { AppSettings, PaymentMethod, PublicSession, VerificationResult, ChainEnv } from './payments';
import { getTelegramInitData } from './telegramWebApp';
import { API_BASE_URL } from '../appConfig';

export type ChatRole = 'system' | 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };
export type ChatReply = {
  content: string;
  model: string;
  trial?: {
    isAdmin: boolean;
    trialsUsed: number;
    trialsLimit: number | null;
    maxWords: number | null;
    responseWords: number;
  };
};

function getApiBaseUrl(): string {
  return API_BASE_URL.trim().replace(/\/+$/, '');
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

  try {
    const res = await fetch(url, { ...init, headers });
    return readJsonOrThrow<T>(res);
  } catch (err) {
    // Browsers typically throw TypeError("Failed to fetch") when the backend is down
    // or the request is blocked by CORS/preflight.
    if (err instanceof TypeError) {
      throw new Error(`Network error calling backend (${url}). Check the tunnel URL and backend CORS allowlist.`);
    }
    throw err;
  }
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

  async chat(messages: ChatMessage[]): Promise<ChatReply> {
    return apiFetch<ChatReply>('/api/v1/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    });
  },
};
