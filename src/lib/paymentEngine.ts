import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as bip39 from 'bip39';
import bs58check from 'bs58check';
import { derivePath } from 'ed25519-hd-key';
import { ethers } from 'ethers';
import { ripemd160 } from '@noble/hashes/legacy.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { deriveAddress as deriveXrpAddress } from 'ripple-keypairs';
import TronWeb from 'tronweb';
import { Client as XrplClient } from 'xrpl';

export const PAYMENT_METHODS = [
  'ethereum',
  'solana',
  'tron',
  'xrp',
  'usdt',
  'btc',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentSession {
  id: string;
  method: PaymentMethod;
  network: string;
  address: string;
  privateKey: string;
  privateKeyFormat: string;
  fallbackAddress?: string;
  fallbackPrivateKey?: string;
  fallbackPrivateKeyFormat?: string;
  fallbackNetwork?: string;
  expectedAmount: number;
  symbol: string;
  createdAt: string;
  expiresAt: string;
  derivationPath: string;
  note?: string;
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
  expectedAmount: number;
  symbol: string;
  checkedAt: string;
  endpointChecks: EndpointCheck[];
  message: string;
}

const ETH_RPCS = [
  'https://cloudflare-eth.com',
  'https://eth.llamarpc.com',
  'https://ethereum-rpc.publicnode.com',
  'https://rpc.ankr.com/eth',
];

const SOLANA_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
  'https://solana-api.projectserum.com',
  'https://solana-mainnet.core.chainstack.com',
];

const TRON_FULL_HOSTS = [
  'https://api.trongrid.io',
  'https://tron-mainnet.public.blastapi.io',
  'https://tron-rpc.publicnode.com',
  'https://tron.drpc.org',
];

const XRP_WS_ENDPOINTS = [
  'wss://xrplcluster.com',
  'wss://s1.ripple.com',
  'wss://s2.ripple.com',
];

const BTC_ADDRESS_APIS = [
  'https://blockstream.info/api/address',
  'https://mempool.space/api/address',
];

const USDT_ERC20_CONTRACT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const USDT_TRC20_CONTRACT = 'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';
const POLL_TIMEOUT_MS = 9000;

const CHAIN_CONFIG: Record<
  PaymentMethod,
  { network: string; amount: number; symbol: string; derivationPath: string }
> = {
  ethereum: {
    network: 'Ethereum Mainnet',
    amount: 0.01,
    symbol: 'ETH',
    derivationPath: `m/44'/60'/0'/0/{index}`,
  },
  usdt: {
    network: 'USDT (ERC20 + TRC20)',
    amount: 20,
    symbol: 'USDT',
    derivationPath: `m/44'/60'/0'/0/{index}`,
  },
  solana: {
    network: 'Solana Mainnet',
    amount: 0.25,
    symbol: 'SOL',
    derivationPath: `m/44'/501'/{index}'/0'`,
  },
  tron: {
    network: 'Tron Mainnet',
    amount: 100,
    symbol: 'TRX',
    derivationPath: `m/44'/195'/0'/0/{index}`,
  },
  xrp: {
    network: 'XRP Ledger Mainnet',
    amount: 35,
    symbol: 'XRP',
    derivationPath: `m/44'/144'/0'/0/{index}`,
  },
  btc: {
    network: 'Bitcoin Mainnet',
    amount: 0.00025,
    symbol: 'BTC',
    derivationPath: `m/44'/0'/0'/0/{index}`,
  },
};

function buildSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function withTimeout<T>(promise: Promise<T>, ms = POLL_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('Timeout')), ms);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function rpcPostJson(
  endpoint: string,
  method: string,
  params: unknown[],
): Promise<unknown> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = (await response.json()) as {
    result?: unknown;
    error?: { message?: string };
  };

  if (data.error) {
    throw new Error(data.error.message ?? 'RPC error');
  }

  return data.result;
}

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

function normalizeBigNumberish(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return BigInt(Math.trunc(value));
  }

  if (typeof value === 'string') {
    const v = value.trim();
    if (v.startsWith('0x') || /^\d+$/.test(v)) {
      return BigInt(v);
    }
  }

  if (typeof value === 'object' && value !== null) {
    const withHex = value as { _hex?: string; toString?: () => string };
    if (typeof withHex._hex === 'string') {
      return BigInt(withHex._hex);
    }
    if (typeof withHex.toString === 'function') {
      const text = withHex.toString();
      if (text.startsWith('0x') || /^\d+$/.test(text)) {
        return BigInt(text);
      }
    }
  }

  throw new Error('Unsupported numeric response format');
}

function getResolvedPath(template: string, index: number) {
  return template.replace('{index}', String(index));
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function toCompressedWif(privateKeyHex: string) {
  const keyBytes = ethers.getBytes(privateKeyHex);
  const payload = new Uint8Array(1 + keyBytes.length + 1);
  payload[0] = 0x80;
  payload.set(keyBytes, 1);
  payload[payload.length - 1] = 0x01;
  return bs58check.encode(payload);
}

function assertValidMnemonic(seedPhrase: string) {
  if (!bip39.validateMnemonic(seedPhrase.trim())) {
    throw new Error('Invalid seed phrase. Enter a valid BIP-39 mnemonic.');
  }
}

function deriveEthereumAddress(seedPhrase: string, index: number) {
  const path = getResolvedPath(CHAIN_CONFIG.ethereum.derivationPath, index);
  const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
  return {
    address: wallet.address,
    derivationPath: path,
    privateKey: wallet.privateKey,
    privateKeyFormat: 'hex-0x',
  };
}

function deriveUsdtErc20Address(seedPhrase: string, index: number) {
  const path = getResolvedPath(CHAIN_CONFIG.usdt.derivationPath, index);
  const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
  return {
    address: wallet.address,
    derivationPath: path,
    privateKey: wallet.privateKey,
    privateKeyFormat: 'hex-0x',
  };
}

function deriveTronAddress(seedPhrase: string, index: number) {
  const path = getResolvedPath(CHAIN_CONFIG.tron.derivationPath, index);
  const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
  const address = TronWeb.address.fromPrivateKey(wallet.privateKey.replace(/^0x/, ''));
  return {
    address,
    derivationPath: path,
    privateKey: wallet.privateKey,
    privateKeyFormat: 'hex-0x',
  };
}

function deriveXrpClassicAddress(seedPhrase: string, index: number) {
  const path = getResolvedPath(CHAIN_CONFIG.xrp.derivationPath, index);
  const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
  const compressedPubKey = ethers.SigningKey.computePublicKey(
    wallet.privateKey,
    true,
  )
    .replace(/^0x/, '')
    .toUpperCase();
  const address = deriveXrpAddress(compressedPubKey);
  return {
    address,
    derivationPath: path,
    privateKey: wallet.privateKey,
    privateKeyFormat: 'hex-0x',
  };
}

function deriveBitcoinAddress(seedPhrase: string, index: number) {
  const path = getResolvedPath(CHAIN_CONFIG.btc.derivationPath, index);
  const wallet = ethers.HDNodeWallet.fromPhrase(seedPhrase, undefined, path);
  const compressedPubKeyHex = ethers.SigningKey.computePublicKey(
    wallet.privateKey,
    true,
  ).replace(/^0x/, '');
  const pubKeyBytes = ethers.getBytes(`0x${compressedPubKeyHex}`);
  const hashed = ripemd160(sha256(pubKeyBytes));
  const payload = new Uint8Array(1 + hashed.length);
  payload[0] = 0x00;
  payload.set(hashed, 1);
  const address = bs58check.encode(payload);
  const wif = toCompressedWif(wallet.privateKey);
  return {
    address,
    derivationPath: path,
    privateKey: wif,
    privateKeyFormat: 'wif-compressed',
  };
}

export async function createPaymentSession(
  seedPhrase: string,
  method: PaymentMethod,
  index: number,
): Promise<PaymentSession> {
  assertValidMnemonic(seedPhrase);

  const config = CHAIN_CONFIG[method];
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + 5 * 60 * 1000);

  let result: {
    address: string;
    derivationPath: string;
    privateKey: string;
    privateKeyFormat: string;
  };
  let fallbackAddress: string | undefined;
  let fallbackNetwork: string | undefined;
  let fallbackPrivateKey: string | undefined;
  let fallbackPrivateKeyFormat: string | undefined;

  switch (method) {
    case 'ethereum':
      result = deriveEthereumAddress(seedPhrase, index);
      break;
    case 'usdt': {
      result = deriveUsdtErc20Address(seedPhrase, index);
      const tronResult = deriveTronAddress(seedPhrase, index);
      fallbackAddress = tronResult.address;
      fallbackNetwork = 'TRON (TRC20)';
      fallbackPrivateKey = tronResult.privateKey;
      fallbackPrivateKeyFormat = tronResult.privateKeyFormat;
      break;
    }
    case 'solana': {
      const path = getResolvedPath(CHAIN_CONFIG.solana.derivationPath, index);
      const seed = bip39.mnemonicToSeedSync(seedPhrase);
      const { key } = derivePath(path, seed.toString('hex'));
      const account = Keypair.fromSeed(key);
      result = {
        address: account.publicKey.toBase58(),
        derivationPath: path,
        privateKey: bytesToHex(account.secretKey),
        privateKeyFormat: 'solana-secretkey-hex',
      };
      break;
    }
    case 'tron':
      result = deriveTronAddress(seedPhrase, index);
      break;
    case 'xrp':
      result = deriveXrpClassicAddress(seedPhrase, index);
      break;
    case 'btc':
      result = deriveBitcoinAddress(seedPhrase, index);
      break;
    default:
      throw new Error('Unsupported payment method');
  }

  return {
    id: buildSessionId(),
    method,
    network: config.network,
    address: result.address,
    privateKey: result.privateKey,
    privateKeyFormat: result.privateKeyFormat,
    fallbackAddress,
    fallbackNetwork,
    fallbackPrivateKey,
    fallbackPrivateKeyFormat,
    expectedAmount: config.amount,
    symbol: config.symbol,
    createdAt: createdAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    derivationPath: result.derivationPath,
  };
}

function runChecksInParallel(
  checks: Array<Promise<EndpointCheck>>,
): Promise<EndpointCheck[]> {
  return Promise.all(
    checks.map((check) =>
      check.catch((error: unknown) => ({
        endpoint: 'unknown',
        ok: false,
        error: normalizeError(error),
      })),
    ),
  );
}

async function verifyEthBalance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  return runChecksInParallel(
    ETH_RPCS.map(async (endpoint) => {
      try {
        const result = (await rpcPostJson(endpoint, 'eth_getBalance', [
          address,
          'latest',
        ])) as string;
        const balance = Number(ethers.formatEther(BigInt(result)));
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

async function verifyUsdtErc20Balance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  const data = `0x70a08231${address.replace(/^0x/, '').padStart(64, '0')}`;
  return runChecksInParallel(
    ETH_RPCS.map(async (endpoint) => {
      try {
        const result = (await rpcPostJson(endpoint, 'eth_call', [
          { to: USDT_ERC20_CONTRACT, data },
          'latest',
        ])) as string;
        const raw = normalizeBigNumberish(result);
        const balance = Number(raw) / 1_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

async function verifyUsdtTrc20Balance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  return runChecksInParallel(
    TRON_FULL_HOSTS.map(async (endpoint) => {
      try {
        const tronWeb = new TronWeb({ fullHost: endpoint });
        const contract = await withTimeout(tronWeb.contract().at(USDT_TRC20_CONTRACT));
        const rawBalance = await withTimeout(contract.balanceOf(address).call());
        const raw = normalizeBigNumberish(rawBalance);
        const balance = Number(raw) / 1_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

async function verifySolanaBalance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  const pubKey = new PublicKey(address);
  return runChecksInParallel(
    SOLANA_RPCS.map(async (endpoint) => {
      try {
        const conn = new Connection(endpoint, 'confirmed');
        const lamports = await withTimeout(conn.getBalance(pubKey));
        const balance = lamports / 1_000_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

async function verifyTronBalance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  return runChecksInParallel(
    TRON_FULL_HOSTS.map(async (endpoint) => {
      try {
        const tronWeb = new TronWeb({ fullHost: endpoint });
        const balanceSun = await withTimeout(tronWeb.trx.getBalance(address));
        const balance = Number(balanceSun) / 1_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

async function verifyXrpBalance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  return runChecksInParallel(
    XRP_WS_ENDPOINTS.map(async (endpoint) => {
      let client: XrplClient | null = null;
      try {
        client = new XrplClient(endpoint, { timeout: POLL_TIMEOUT_MS });
        await client.connect();
        const response = await client.request({
          command: 'account_info',
          account: address,
          ledger_index: 'validated',
        });
        const accountData = (response.result as { account_data?: { Balance?: string } })
          .account_data;
        const drops = Number(accountData?.Balance ?? 0);
        const balance = drops / 1_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      } finally {
        try {
          if (client?.isConnected()) {
            await client.disconnect();
          }
        } catch {
          // best effort close
        }
      }
    }),
  );
}

async function verifyBtcBalance(
  address: string,
  expectedAmount: number,
): Promise<EndpointCheck[]> {
  return runChecksInParallel(
    BTC_ADDRESS_APIS.map(async (endpoint) => {
      try {
        const response = await withTimeout(fetch(`${endpoint}/${address}`));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const payload = (await response.json()) as {
          chain_stats?: { funded_txo_sum?: number; spent_txo_sum?: number };
        };
        const funded = payload.chain_stats?.funded_txo_sum ?? 0;
        const spent = payload.chain_stats?.spent_txo_sum ?? 0;
        const sats = funded - spent;
        const balance = sats / 100_000_000;
        return { endpoint, ok: balance >= expectedAmount, balance };
      } catch (error) {
        return { endpoint, ok: false, error: normalizeError(error) };
      }
    }),
  );
}

function summarizeResult(
  session: PaymentSession,
  checks: EndpointCheck[],
  unsupportedMessage?: string,
): VerificationResult {
  if (unsupportedMessage) {
    return {
      verified: false,
      method: session.method,
      expectedAmount: session.expectedAmount,
      symbol: session.symbol,
      checkedAt: new Date().toISOString(),
      endpointChecks: [],
      message: unsupportedMessage,
    };
  }

  const verified = checks.some((entry) => entry.ok);
  const message = verified
    ? 'Payment detected.'
    : 'Payment not detected yet across fallback endpoints.';

  return {
    verified,
    method: session.method,
    expectedAmount: session.expectedAmount,
    symbol: session.symbol,
    checkedAt: new Date().toISOString(),
    endpointChecks: checks,
    message,
  };
}

export async function verifyPaymentSession(
  session: PaymentSession,
): Promise<VerificationResult> {
  let checks: EndpointCheck[] = [];

  switch (session.method) {
    case 'ethereum':
      checks = await verifyEthBalance(session.address, session.expectedAmount);
      break;
    case 'usdt': {
      const erc20Checks = await verifyUsdtErc20Balance(
        session.address,
        session.expectedAmount,
      );
      const trc20Checks = session.fallbackAddress
        ? await verifyUsdtTrc20Balance(session.fallbackAddress, session.expectedAmount)
        : [];
      checks = [
        ...erc20Checks.map((entry) => ({
          ...entry,
          endpoint: `ERC20 | ${entry.endpoint}`,
        })),
        ...trc20Checks.map((entry) => ({
          ...entry,
          endpoint: `TRC20 | ${entry.endpoint}`,
        })),
      ];
      break;
    }
    case 'solana':
      checks = await verifySolanaBalance(session.address, session.expectedAmount);
      break;
    case 'tron':
      checks = await verifyTronBalance(session.address, session.expectedAmount);
      break;
    case 'xrp':
      checks = await verifyXrpBalance(session.address, session.expectedAmount);
      break;
    case 'btc':
      checks = await verifyBtcBalance(session.address, session.expectedAmount);
      break;
    default:
      return summarizeResult(session, [], 'Unsupported method');
  }

  return summarizeResult(session, checks);
}

export function deriveNextSeedPhrase(seedPhrase: string, salt: string): string {
  assertValidMnemonic(seedPhrase);
  const hash = ethers.keccak256(
    ethers.toUtf8Bytes(`${seedPhrase.trim()}::${salt}::${Date.now()}`),
  );
  const entropy = hash.slice(2, 34);
  return bip39.entropyToMnemonic(entropy);
}
