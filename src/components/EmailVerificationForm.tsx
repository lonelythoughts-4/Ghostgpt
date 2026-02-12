import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type EmailFormData = z.infer<typeof emailSchema>;

interface EmailVerificationFormProps {
  onSuccess: () => void;
}

const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call to backend
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock success
      setIsSuccess(true);
      toast.success('Email submitted successfully!');
      setTimeout(() => onSuccess(), 2000);
    } catch (error) {
      toast.error('Failed to submit email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="text-emerald-400" size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-400 mb-2">
              Verification Successful
            </h3>
            <p className="text-slate-300 text-sm">
              Your login credentials will be sent to your email shortly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-6">
      <h3 className="text-lg font-bold text-emerald-400 mb-6">
        Email Verification
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Email Address *
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="your@email.com"
            className="w-full bg-slate-900/50 border border-emerald-500/20 rounded-lg px-4 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
          )}
        </div>

        <p className="text-slate-400 text-xs">
          Your credentials will be sent to this email address.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-slate-900 disabled:text-slate-400 font-bold py-3 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && (
            <>
              <Loader size={20} className="animate-spin" />
              Submitting...
            </>
          )}
          {!isSubmitting && 'Submit Email'}
        </button>
      </form>
    </div>
  );
};

export default EmailVerificationForm;