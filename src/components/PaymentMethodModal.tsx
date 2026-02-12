import React, { useState } from 'react';
    import { Copy, Check, X } from 'lucide-react';
    import { toast } from 'react-toastify';
    
    interface PaymentMethodModalProps {
      isOpen: boolean;
      method: string | null;
      onClose: () => void;
      onConfirm: (method: string) => void;
    }
    
    const PaymentMethodModal: React.FC<PaymentMethodModalProps> = ({
      isOpen,
      method,
      onClose,
      onConfirm,
    }) => {
      const [copied, setCopied] = useState(false);
      const [countdown, setCountdown] = useState(300); // 5 minutes
    
      React.useEffect(() => {
        if (!isOpen || !method) return;
    
        setCountdown(300);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
    
        return () => clearInterval(timer);
      }, [isOpen, method]);
    
      // Payment addresses and network display values.
      // Replace these addresses with real admin-provided addresses in production.
      const paymentDetails: Record<
        string,
        { address: string; network: string; displayName: string }
      > = {
        ethereum: {
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f42e0e',
          network: 'Ethereum (ERC-20)',
          displayName: 'Ethereum',
        },
        solana: {
          address: '3d1P9bF2Yz8u7L8a4yq9nK8s2v1qxYwV7Tz2nP7Q1aE1',
          network: 'Solana',
          displayName: 'Solana',
        },
        tron: {
          address: 'TQn9Y2khEsLJW1ChVWFMSUqBjGuTiiJi2e',
          network: 'TRON (TRC-20)',
          displayName: 'TRON',
        },
        xrp: {
          address: 'rLHzPsX6oXkzU2fouzYgF8ZjhVcitp1W4',
          network: 'XRP Ledger',
          displayName: 'XRP',
        },
        xmr: {
          address:
            '44AFFq5kSiGBoZ... (example Monero address - integrated payment may require payment ID)',
          network: 'Monero (XMR)',
          displayName: 'Monero',
        },
        usdt: {
          address: 'TQn9Y2khEsLJW1ChVWFMSUqBjGuTiiJi2e',
          network: 'USDT (TRC-20 / ERC-20)',
          displayName: 'USDT',
        },
        btc: {
          address: '1A1z7agoat4aLSE8g7Xn4xNV3H5C6whzQq',
          network: 'Bitcoin',
          displayName: 'Bitcoin',
        },
      };
    
      const details = method ? paymentDetails[method] : undefined;
    
      const handleCopy = async () => {
        if (!details) return;

        try {
          if (!navigator.clipboard?.writeText) {
            throw new Error('Clipboard not available');
          }

          await navigator.clipboard.writeText(details.address);
          setCopied(true);
          toast.success('Address copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          toast.error('Unable to copy. Please copy the address manually.');
        }
      };
    
      const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      };
    
      // QR generation: create a QR image URL using a trusted public QR-generation endpoint.
      // The QR encodes the raw address string (so wallets scanning it will obtain the address).
      // In production you may replace this with a self-hosted QR service or generate client-side.
      const generateQrUrl = (payload: string, size = 300) => {
        const encoded = encodeURIComponent(payload);
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png`;
      };
    
      if (!isOpen || !method || !details) return null;
    
      return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-emerald-400">
                {details.displayName} Payment
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
    
            {/* Details */}
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-slate-400 text-sm mb-2">Network</p>
                <p className="text-emerald-400 font-semibold">{details.network}</p>
              </div>
    
              <div>
                <p className="text-slate-400 text-sm mb-2">Amount</p>
                <p className="text-emerald-400 font-semibold text-lg">$20.00</p>
              </div>
    
              <div>
                <p className="text-slate-400 text-sm mb-2">Wallet Address</p>
                <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between gap-2">
                  <code className="text-emerald-400 text-xs break-all font-mono">
                    {details.address}
                  </code>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-shrink-0 p-2 hover:bg-slate-800 rounded transition-colors"
                      aria-label="Copy address"
                    >
                      {copied ? (
                        <Check size={18} className="text-emerald-400" />
                      ) : (
                        <Copy size={18} className="text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
    
              {/* QR Code */}
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <img
                    src={generateQrUrl(details.address, 300)}
                    alt={`QR code for ${details.displayName} address`}
                    width={120}
                    height={120}
                    className="rounded border border-emerald-500/20 bg-white/5"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-slate-300 text-sm mb-2">
                    Scan this QR to copy the address into your wallet.
                  </p>
                  <p className="text-slate-400 text-xs">
                    If your wallet supports currency-specific URIs, paste the address directly from above.
                  </p>
                </div>
              </div>
    
              {/* Countdown */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                <p className="text-amber-400 text-sm font-semibold">
                  Send exact amount within {formatTime(countdown)}
                </p>
              </div>
            </div>
    
            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(method)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-2 rounded-lg transition-all duration-200"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      );
    };
    
    export default PaymentMethodModal;
