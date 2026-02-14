export const PAYMENT_METHODS = [
  'ethereum',
  'solana',
  'tron',
  'xrp',
  'usdt',
  'btc',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type ChainEnv = 'mainnet' | 'testnet';

export interface AppSettings {
  chainEnv: ChainEnv;
  updatedAt: string;
}

export interface PublicSession {
  id: string;
  method: PaymentMethod;
  chainEnv: ChainEnv;
  network: string;
  address: string;
  fallbackAddress?: string;
  fallbackNetwork?: string;
  expectedAmount: number;
  symbol: string;
  createdAt: string;
  expiresAt: string;
  verifiedAt?: string;
}

export interface EndpointCheck {
  endpoint: string;
  ok: boolean;
  balance?: number;
  error?: string;
}

export interface VerificationResult {
  verified: boolean;
  method: PaymentMethod;
  chainEnv: ChainEnv;
  expectedAmount: number;
  symbol: string;
  checkedAt: string;
  endpointChecks: EndpointCheck[];
  message: string;
}

