import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import type { PublicSession, VerificationResult } from '../lib/payments';
import { backendApi } from '../lib/backendApi';

interface TransactionVerificationFormProps {
  paymentSession: PublicSession;
  onVerified: () => void;
}

type VerificationStatus = 'idle' | 'checking' | 'waiting' | 'verified' | 'failed';

const POLL_INTERVAL_MS = 12000;

function formatAmount(value: number): string {
  if (!Number.isFinite(value)) return String(value);
  const abs = Math.abs(value);
  if (abs === 0) return '0';
  if (abs >= 100) return value.toFixed(2);
  if (abs >= 1) return value.toFixed(4);
  return value.toFixed(6);
}

function pickWorkingBalance(result: VerificationResult | null): number | null {
  if (!result) return null;
  const working = result.endpointChecks.find((entry) => !entry.error && typeof entry.balance === 'number');
  return typeof working?.balance === 'number' ? working.balance : null;
}

const GlitchBurst: React.FC<{ mode: 'scan' | 'hit' }> = ({ mode }) => {
  return <div className={`gg-glitch-burst gg-glitch-burst--${mode}`} aria-hidden="true" />;
};

const TransactionVerificationForm: React.FC<TransactionVerificationFormProps> = ({
  paymentSession,
  onVerified,
}) => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [glitch, setGlitch] = useState<{ key: number; mode: 'scan' | 'hit' } | null>(null);
  const inFlightRef = useRef(false);
  const completedRef = useRef(false);
  const glitchTimerRef = useRef<number | null>(null);

  const runVerification = useCallback(async () => {
    if (inFlightRef.current || completedRef.current) return;

    if (glitchTimerRef.current) {
      window.clearTimeout(glitchTimerRef.current);
      glitchTimerRef.current = null;
    }

    inFlightRef.current = true;
    setIsChecking(true);
    setStatus((prev) => (prev === 'verified' ? prev : 'checking'));
    setAttempts((prev) => prev + 1);
    setGlitch((prev) => ({ key: (prev?.key ?? 0) + 1, mode: 'scan' }));
    glitchTimerRef.current = window.setTimeout(() => setGlitch(null), 380);

    try {
      const nextResult = await backendApi.verifySession(paymentSession.id);
      setResult(nextResult);

      if (nextResult.verified) {
        completedRef.current = true;
        setStatus('verified');
        toast.success('Payment detected.');
        setGlitch((prev) => ({ key: (prev?.key ?? 0) + 1, mode: 'hit' }));
        if (glitchTimerRef.current) {
          window.clearTimeout(glitchTimerRef.current);
          glitchTimerRef.current = null;
        }
        glitchTimerRef.current = window.setTimeout(() => setGlitch(null), 900);
        return;
      }

      setStatus('waiting');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Verification failed unexpectedly.';
      setStatus('failed');
      setResult((prev) =>
        prev ?? {
          verified: false,
          method: paymentSession.method,
          chainEnv: paymentSession.chainEnv,
          expectedAmount: paymentSession.expectedAmount,
          symbol: paymentSession.symbol,
          checkedAt: new Date().toISOString(),
          endpointChecks: [],
          message,
        },
      );
    } finally {
      inFlightRef.current = false;
      setIsChecking(false);
    }
  }, [onVerified, paymentSession]);

  useEffect(() => {
    completedRef.current = false;
    inFlightRef.current = false;
    setAttempts(0);
    setResult(null);
    setStatus('idle');

    void runVerification();
    const timer = window.setInterval(() => {
      void runVerification();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      if (glitchTimerRef.current) {
        window.clearTimeout(glitchTimerRef.current);
        glitchTimerRef.current = null;
      }
    };
  }, [runVerification, paymentSession.id]);

  const workingBalance = useMemo(() => pickWorkingBalance(result), [result]);
  const statusMessage = useMemo(() => {
    if (status === 'verified') return 'Payment detected.';
    if (status === 'failed') return result?.message ?? 'Could not verify payment.';
    if (workingBalance !== null) {
      return `Balance: ${formatAmount(workingBalance)} ${paymentSession.symbol}. Waiting for >= ${paymentSession.expectedAmount} ${paymentSession.symbol}.`;
    }
    return result?.message ?? 'Waiting for payment...';
  }, [paymentSession.expectedAmount, paymentSession.symbol, result?.message, status, workingBalance]);

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-6 relative overflow-hidden">
      {glitch && <GlitchBurst key={glitch.key} mode={glitch.mode} />}
      <h3 className="text-lg font-bold text-emerald-400 mb-3">Automatic Payment Verification</h3>
      <p className="text-slate-300 text-sm mb-2">
        Checking {paymentSession.network} in parallel for address{' '}
        <span className="font-mono text-emerald-300">{paymentSession.address}</span>.
      </p>
      {paymentSession.fallbackAddress && (
        <p className="text-slate-400 text-xs mb-6">
          Also checking {paymentSession.fallbackNetwork ?? 'fallback network'} address{' '}
          <span className="font-mono text-emerald-300">{paymentSession.fallbackAddress}</span>.
        </p>
      )}

      {status === 'verified' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
          <CheckCircle className="text-emerald-400" size={24} />
          <div>
            <p className="text-emerald-400 font-semibold">Verified</p>
            <p className="text-emerald-300 text-sm">
              Payment detected for {paymentSession.expectedAmount} {paymentSession.symbol}.
            </p>
            {result?.txId && (
              <p className="text-emerald-200 text-xs mt-2 break-all">
                Txn ID: <span className="font-mono">{result.txId}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <XCircle className="text-red-400" size={24} />
          <div>
            <p className="text-red-400 font-semibold">Verification Stopped</p>
            <p className="text-red-300 text-sm">{statusMessage}</p>
          </div>
        </div>
      )}

      {status !== 'verified' && status !== 'failed' && (
        <div className="flex items-center gap-3 p-4 bg-slate-900/50 border border-emerald-500/20 rounded-lg mb-6">
          <Loader2 className={`text-emerald-400 ${isChecking ? 'animate-spin' : ''}`} size={20} />
          <div>
            <p className="text-emerald-400 font-semibold">
              {status === 'checking' ? 'Checking now...' : 'Waiting for payment'}
            </p>
            <p className="text-slate-300 text-sm">
              Poll attempt #{attempts}. Auto-check runs every {Math.floor(POLL_INTERVAL_MS / 1000)}
              s.
            </p>
            <p className="text-slate-400 text-xs mt-2">{statusMessage}</p>
          </div>
        </div>
      )}

      {status === 'verified' ? (
        <button
          onClick={() => onVerified()}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200"
        >
          Continue
        </button>
      ) : (
        <button
          onClick={() => void runVerification()}
          disabled={isChecking || status === 'failed'}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
          Check Again
        </button>
      )}
    </div>
  );
};

export default TransactionVerificationForm;
