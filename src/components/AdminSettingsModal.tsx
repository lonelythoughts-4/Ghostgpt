import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { AppSettings, ChainEnv } from '../lib/payments';

interface AdminSettingsModalProps {
  isOpen: boolean;
  settings: AppSettings | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (nextEnv: ChainEnv) => void;
}

const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  settings,
  isSaving,
  onClose,
  onSave,
}) => {
  const [selected, setSelected] = useState<ChainEnv>('mainnet');

  const initial = useMemo(() => settings?.chainEnv ?? 'mainnet', [settings?.chainEnv]);

  React.useEffect(() => {
    if (!isOpen) return;
    setSelected(initial);
  }, [isOpen, initial]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg max-w-md w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-emerald-400">Admin Settings</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close"
            type="button"
          >
            <X size={22} />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-slate-300 text-sm font-semibold">Network Mode</p>

          <label className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer">
            <div>
              <p className="text-slate-200 text-sm font-semibold">Mainnet</p>
              <p className="text-slate-400 text-xs">Real networks and real funds.</p>
            </div>
            <input
              type="radio"
              name="chainEnv"
              value="mainnet"
              checked={selected === 'mainnet'}
              onChange={() => setSelected('mainnet')}
              className="accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between gap-3 p-3 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer">
            <div>
              <p className="text-slate-200 text-sm font-semibold">Testnet</p>
              <p className="text-slate-400 text-xs">Sepolia / Devnet / Testnet endpoints.</p>
            </div>
            <input
              type="radio"
              name="chainEnv"
              value="testnet"
              checked={selected === 'testnet'}
              onChange={() => setSelected('testnet')}
              className="accent-emerald-500"
            />
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold py-2 rounded-lg transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selected)}
            disabled={isSaving || selected === initial}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-2 rounded-lg transition-all duration-200"
            type="button"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsModal;

