import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const transactionSchema = z.object({
  transactionId: z.string().min(10, 'Transaction ID must be at least 10 characters'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  amount: z.string().default('20.00'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionVerificationFormProps {
  paymentMethod: string;
  onVerified: () => void;
}

const TransactionVerificationForm: React.FC<TransactionVerificationFormProps> = ({
  paymentMethod,
  onVerified,
}) => {
  const [status, setStatus] = useState<'idle' | 'pending' | 'verified' | 'failed'>('idle');
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      paymentMethod,
      amount: '20.00',
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    setStatus('pending');
    try {
      // Simulate API call to backend for verification
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Mock verification logic
      if (data.transactionId.length >= 10) {
        setStatus('verified');
        toast.success('Transaction verified! Proceeding to email verification...');
        setTimeout(() => onVerified(), 1500);
      } else {
        setStatus('failed');
        toast.error('Transaction verification failed. Please try again.');
      }
    } catch (error) {
      setStatus('failed');
      toast.error('An error occurred during verification.');
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-emerald-400 mb-6">
        Transaction Verification
      </h3>

      {status === 'verified' && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg mb-6">
          <CheckCircle className="text-emerald-400" size={24} />
          <div>
            <p className="text-emerald-400 font-semibold">Verified</p>
            <p className="text-emerald-300 text-sm">
              Your transaction has been confirmed.
            </p>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-6">
          <XCircle className="text-red-400" size={24} />
          <div>
            <p className="text-red-400 font-semibold">Verification Failed</p>
            <p className="text-red-300 text-sm">
              Please check your transaction ID and try again.
            </p>
          </div>
        </div>
      )}

      {status !== 'verified' && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Transaction ID *
            </label>
            <input
              {...register('transactionId')}
              type="text"
              placeholder="Enter your transaction ID"
              className="w-full bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              disabled={status === 'pending'}
            />
            {errors.transactionId && (
              <p className="text-red-400 text-sm mt-1">
                {errors.transactionId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Payment Method
            </label>
            <input
              {...register('paymentMethod')}
              type="text"
              disabled
              className="w-full bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              Amount
            </label>
            <input
              {...register('amount')}
              type="text"
              disabled
              className="w-full bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-400 cursor-not-allowed opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'pending' || status === 'verified'}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {status === 'pending' && (
              <>
                <Loader size={20} className="animate-spin" />
                Verifying...
              </>
            )}
            {status !== 'pending' && 'Submit Transaction'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TransactionVerificationForm;