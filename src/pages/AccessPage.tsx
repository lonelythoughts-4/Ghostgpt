import React, { useState } from 'react';
    import { CreditCard, Zap } from 'lucide-react';
    import { useNavigate } from 'react-router-dom';
    import GettingStartedModal from '../components/GettingStartedModal';
    import PaymentMethodModal from '../components/PaymentMethodModal';
    import TransactionVerificationForm from '../components/TransactionVerificationForm';
    import EmailVerificationForm from '../components/EmailVerificationForm';
    import SubscriptionStatus from '../components/SubscriptionStatus';
    
    type Step = 'getting-started' | 'payment-method' | 'transaction' | 'email' | 'complete';
    
    const AccessPage: React.FC = () => {
      const [step, setStep] = useState<Step>('getting-started');
      const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
      const [showPaymentModal, setShowPaymentModal] = useState(false);
      const navigate = useNavigate();
    
      const paymentMethods = [
        { id: 'ethereum', label: 'Ethereum (ETH)', icon: CreditCard },
        { id: 'solana', label: 'Solana (SOL)', icon: CreditCard },
        { id: 'tron', label: 'Tron (TRX)', icon: CreditCard },
        { id: 'xrp', label: 'XRP Ledger (XRP)', icon: CreditCard },
        { id: 'xmr', label: 'Monero (XMR)', icon: CreditCard },
        { id: 'usdt', label: 'USDT (TRC20 / ERC20)', icon: CreditCard },
        { id: 'btc', label: 'Bitcoin (BTC)', icon: CreditCard },
      ];
    
      const handleProceedFromGettingStarted = () => {
        setStep('payment-method');
      };
    
      const handleSelectPaymentMethod = (methodId: string) => {
        setSelectedPaymentMethod(methodId);
        setShowPaymentModal(true);
      };
    
      const handleConfirmPayment = (method: string) => {
        setShowPaymentModal(false);
        setStep('transaction');
      };
    
      const handleTransactionVerified = () => {
        setStep('email');
      };
    
      const handleEmailSuccess = () => {
        setStep('complete');
      };
    
      return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Page Header */}
            <div className="mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-emerald-400 mb-4">
                Access & Payment
              </h1>
              <p className="text-slate-300 text-lg">
                Complete your payment verification to unlock full access to GhostGPT.
              </p>
            </div>
    
            {/* Subscription Status */}
            {step === 'complete' && (
              <div className="mb-8">
                <SubscriptionStatus status="active" daysRemaining={30} />
              </div>
            )}
    
            {/* Step Indicator */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      ['getting-started', 'payment-method', 'transaction', 'email', 'complete'].indexOf(step) >= 0
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    1
                  </div>
                  <span className="text-slate-300 text-sm">Payment Method</span>
                </div>
                <div className="flex-1 h-1 bg-slate-700 mx-4"></div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      ['transaction', 'email', 'complete'].indexOf(step) >= 0
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    2
                  </div>
                  <span className="text-slate-300 text-sm">Verify Transaction</span>
                </div>
                <div className="flex-1 h-1 bg-slate-700 mx-4"></div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      ['email', 'complete'].indexOf(step) >= 0
                        ? 'bg-emerald-500 text-slate-900'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    3
                  </div>
                  <span className="text-slate-300 text-sm">Email Verification</span>
                </div>
              </div>
            </div>
    
            {/* Content */}
            <div className="space-y-8">
              {/* Payment Method Selection */}
              {step === 'payment-method' && (
                <div>
                  <h2 className="text-xl font-bold text-emerald-400 mb-6">
                    Choose Payment Method
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => handleSelectPaymentMethod(method.id)}
                        className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 rounded-lg p-6 text-center transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 group"
                      >
                        <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
                          {method.label.split(' ')[0]}
                        </div>
                        <p className="text-slate-300 text-sm font-medium">
                          {method.label.split(' ').slice(1).join(' ')}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
    
              {/* Transaction Verification */}
              {step === 'transaction' && selectedPaymentMethod && (
                <TransactionVerificationForm
                  paymentMethod={selectedPaymentMethod}
                  onVerified={handleTransactionVerified}
                />
              )}
    
              {/* Email Verification */}
              {step === 'email' && (
                <EmailVerificationForm onSuccess={handleEmailSuccess} />
              )}
    
              {/* Complete */}
              {step === 'complete' && (
                <div className="bg-gradient-to-b from-slate-800 to-slate-900 border border-emerald-500/30 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="text-emerald-400" size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-emerald-400 mb-4">
                    Welcome to GhostGPT
                  </h2>
                  <p className="text-slate-300 mb-6">
                    Your account is now active. You can access the full AI interface and all premium features.
                  </p>
                  <div className="bg-slate-900/50 border border-emerald-500/20 rounded-lg p-4 mb-6 text-left">
                    <p className="text-slate-400 text-sm mb-2">
                      <span className="text-emerald-400 font-semibold">Username:</span> Will be sent to your email
                    </p>
                    <p className="text-slate-400 text-sm">
                      <span className="text-emerald-400 font-semibold">Password:</span> Will be sent to your email
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('/trial')}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-900 font-bold py-3 rounded-lg transition-all duration-200"
                  >
                    Start Using GhostGPT
                  </button>
                </div>
              )}
            </div>
          </div>
    
          {/* Modals */}
          <GettingStartedModal
            isOpen={step === 'getting-started'}
            onProceed={handleProceedFromGettingStarted}
          />
          <PaymentMethodModal
            isOpen={showPaymentModal}
            method={selectedPaymentMethod}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={handleConfirmPayment}
          />
        </main>
      );
    };
    
    export default AccessPage;
