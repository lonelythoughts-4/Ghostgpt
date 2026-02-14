import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import type { PublicSession } from '../lib/payments';

interface PaymentMethodModalProps {
  isOpen: boolean;
  session: PublicSession | null;
  isPreparing: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (session: PublicSession) => void;
}

const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
  isOpen,
  session,
  isPreparing,
  error,
  onClose,
  onConfirm,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!isOpen || !session) return;

    const expiresAt = new Date(session.expiresAt).getTime();
    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [isOpen, session]);

  const canConfirm = useMemo(() => {
    if (!session) return false;
    return countdown > 0;
  }, [session, countdown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      toast.success('Address copied.');
      window.setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.error('Copy failed. Copy manually.');
    }
  };

  const generateQrUrl = (payload: string, size = 300) => {
    const encoded = encodeURIComponent(payload);
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-emerald-400">Deposit Wallet</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {isPreparing && (
          <div className="flex items-center gap-3 p-4 bg-slate-900/60 border border-emerald-500/20 rounded-lg mb-6">
            <Loader2 className="text-emerald-400 animate-spin" size={18} />
            <p className="text-slate-300 text-sm">Creating deposit session...</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        )}

        {session && !isPreparing && !error && (
          <div className="space-y-4 mb-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">Network</p>
              <p className="text-emerald-400 font-semibold">{session.network}</p>
              <p className="text-slate-500 text-xs mt-1">Mode: {session.chainEnv}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-1">Required amount</p>
              <p className="text-emerald-400 font-semibold text-lg">
                {session.expectedAmount} {session.symbol}
              </p>
            </div>

            <div>
              <p className="text-slate-400 text-sm mb-2">Primary deposit address</p>
              <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between gap-2">
                <code className="text-emerald-400 text-xs break-all font-mono">{session.address}</code>
                <button
                  onClick={() => handleCopy(session.address, 'primary')}
                  className="flex-shrink-0 p-2 hover:bg-slate-800 rounded transition-colors"
                  aria-label="Copy primary address"
                >
                  {copiedKey === 'primary' ? (
                    <Check size={18} className="text-emerald-400" />
                  ) : (
                    <Copy size={18} className="text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {session.fallbackAddress && (
              <div>
                <p className="text-slate-400 text-sm mb-2">
                  Secondary deposit address ({session.fallbackNetwork ?? 'Fallback network'})
                </p>
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between gap-2">
                  <code className="text-emerald-400 text-xs break-all font-mono">
                    {session.fallbackAddress}
                  </code>
                  <button
                    onClick={() => handleCopy(session.fallbackAddress!, 'fallback')}
                    className="flex-shrink-0 p-2 hover:bg-slate-800 rounded transition-colors"
                    aria-label="Copy fallback address"
                  >
                    {copiedKey === 'fallback' ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : (
                      <Copy size={18} className="text-slate-400" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <img
                  src={generateQrUrl(session.address)}
                  alt="Primary deposit QR"
                  width={96}
                  height={96}
                  className="rounded border border-emerald-500/20 bg-white/5"
                />
                <p className="text-xs text-slate-300">Primary wallet QR</p>
              </div>
              {session.fallbackAddress && (
                <div className="flex items-center gap-3">
                  <img
                    src={generateQrUrl(session.fallbackAddress)}
                    alt="Secondary deposit QR"
                    width={96}
                    height={96}
                    className="rounded border border-emerald-500/20 bg-white/5"
                  />
                  <p className="text-xs text-slate-300">
                    Secondary wallet QR ({session.fallbackNetwork ?? 'Fallback'})
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900/50 border border-emerald-500/20 rounded-lg">
              <p className="text-slate-300 text-xs">
                Auto verification checks many fallback public endpoints in parallel.
              </p>
              <p className="text-slate-500 text-xs mt-1">Session ID: {session.id}</p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
              <p className="text-amber-400 text-sm font-semibold">
                Send payment within {formatTime(countdown)}
              </p>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => session && onConfirm(session)}
            disabled={!canConfirm}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-2 rounded-lg transition-all duration-200"
          >
            I Sent Payment
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;
