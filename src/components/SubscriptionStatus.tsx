import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SubscriptionStatusProps {
  status: 'active' | 'expiring_soon' | 'expired';
  daysRemaining?: number;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  status,
  daysRemaining = 30,
}) => {
  const [displayDays, setDisplayDays] = useState(daysRemaining);

  useEffect(() => {
    setDisplayDays(daysRemaining);
  }, [daysRemaining]);

  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          icon: CheckCircle,
          title: 'Subscription Active',
          message: `Your subscription is active for ${displayDays} more days.`,
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-400',
          accentColor: 'text-emerald-300',
        };
      case 'expiring_soon':
        return {
          icon: AlertCircle,
          title: 'Renewal Required Soon',
          message: `Your subscription expires in ${displayDays} days. Renew now to maintain access.`,
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-400',
          accentColor: 'text-amber-300',
        };
      case 'expired':
        return {
          icon: AlertCircle,
          title: 'Subscription Expired',
          message: 'Your subscription has expired. Please renew to regain access.',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          textColor: 'text-red-400',
          accentColor: 'text-red-300',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`${config.bgColor} border ${config.borderColor} rounded-lg p-4 flex items-start gap-3`}
    >
      <Icon className={config.textColor} size={24} />
      <div className="flex-1">
        <p className={`font-semibold ${config.textColor}`}>{config.title}</p>
        <p className={`text-sm ${config.accentColor}`}>{config.message}</p>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
