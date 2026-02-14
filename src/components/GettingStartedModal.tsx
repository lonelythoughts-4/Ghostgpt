import React from 'react';
import { AlertCircle } from 'lucide-react';

interface GettingStartedModalProps {
  isOpen: boolean;
  onProceed: () => void;
}

const GettingStartedModal: React.FC<GettingStartedModalProps> = ({
  isOpen,
  onProceed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <AlertCircle className="text-emerald-400" size={24} />
          </div>
          <h2 className="text-xl font-bold text-emerald-400">Getting Started</h2>
        </div>

        {/* Content */}
        <div className="space-y-4 mb-8">
          <p className="text-slate-300 text-sm leading-relaxed">
            To unlock access to the bot, make a one-time initial deposit of{' '}
            <span className="text-emerald-400 font-semibold">$20</span>.
          </p>

          <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-4 space-y-3">
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">1.</span>
              <p className="text-slate-300 text-sm">
                Choose a payment method and we will generate a deposit address
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">2.</span>
              <p className="text-slate-300 text-sm">
                Send the exact amount shown in the payment modal
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">3.</span>
              <p className="text-slate-300 text-sm">
                Auto verification checks multiple public RPC endpoints in parallel
              </p>
            </div>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-bold">4.</span>
              <p className="text-slate-300 text-sm">
                Once payment is detected, you will be granted access
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-xs italic">
            Your security and privacy are our top priority.
          </p>
        </div>

        {/* Button */}
        <button
          onClick={onProceed}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
        >
          Choose Payment Method
        </button>
      </div>
    </div>
  );
};

export default GettingStartedModal;
