import React, { useCallback, useEffect, useRef, useState } from 'react';
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

const TransactionVerificationForm: React.FC<TransactionVerificationFormProps> = ({
  paymentSession,
  onVerified,
}) => {
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const inFlightRef = useRef(false);
  const completedRef = useRef(false);

  const runVerification = useCallback(async () => {
    if (inFlightRef.current || completedRef.current) return;

    inFlightRef.current = true;
    setIsChecking(true);
    setStatus((prev) => (prev === 'verified' ? prev : 'checking'));
    setAttempts((prev) => prev + 1);

    try {
      const nextResult = await backendApi.verifySession(paymentSession.id);
      setResult(nextResult);

      if (nextResult.verified) {
        completedRef.current = true;
        setStatus('verified');
        toast.success('Payment detected. Proceeding...');
        window.setTimeout(() => onVerified(), 1000);
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

    return () => window.clearInterval(timer);
  }, [runVerification, paymentSession.id]);

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-emerald-400 mb-3">Automatic Payment Verification</h3>
      <p className="text-slate-300 text-sm mb-2">
        Checking {paymentSession.network} endpoints in parallel for address{' '}
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
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <XCircle className="text-red-400" size={24} />
          <div>
            <p className="text-red-400 font-semibold">Verification Stopped</p>
            <p className="text-red-300 text-sm">
              {result?.message ?? 'Could not verify payment.'}
            </p>
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
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-2 mb-5">
          <p className="text-slate-300 text-sm font-semibold">Fallback endpoint results</p>
          {result.endpointChecks.length === 0 && (
            <p className="text-slate-400 text-sm">No endpoint checks available.</p>
          )}
          {result.endpointChecks.map((entry) => (
            <div
              key={`${entry.endpoint}-${entry.error ?? entry.balance ?? 'ok'}`}
              className={`p-3 border rounded-lg text-sm ${
                entry.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900/50 border-slate-700 text-slate-300'
              }`}
            >
              <p className="font-mono break-all">{entry.endpoint}</p>
              <p className="text-xs mt-1">
                {entry.ok
                  ? `Balance detected: ${entry.balance ?? 0} ${paymentSession.symbol}`
                  : entry.error ?? `Balance below ${paymentSession.expectedAmount} ${paymentSession.symbol}`}
              </p>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => void runVerification()}
        disabled={isChecking || status === 'verified' || status === 'failed'}
        className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
        Check Again
      </button>
    </div>
  );
};

export default TransactionVerificationForm;

