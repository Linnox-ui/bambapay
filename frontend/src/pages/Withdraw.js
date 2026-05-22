import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  ArrowUpRight, 
  Wallet, 
  AlertCircle, 
  Loader2,
  RefreshCw,
  Phone,
  Banknote
} from 'lucide-react';
import toast from 'react-hot-toast';

const Withdraw = ({ onBalanceRefresh }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    amount: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || Number(formData.amount) < 10) {
      newErrors.amount = 'Minimum withdrawal is 10';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{9,12}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid phone number (e.g. 2547XXXXXXXX)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await api.post('/wallet/withdraw', {
        amount: Number(formData.amount),
        phoneNumber: formData.phoneNumber.trim()
      });

      toast.success(res.data?.message || 'Withdrawal initiated successfully');

      // Clear form
      setFormData({ amount: '', phoneNumber: '' });
      setErrors({});

      // Trigger balance refresh if callback provided
      if (typeof onBalanceRefresh === 'function') {
        onBalanceRefresh();
      }
    } catch (error) {
      const message = error.response?.data?.message 
        || error.response?.data?.error 
        || 'Withdrawal failed. Please try again.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-dark-900 text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          Withdraw Funds
        </h1>
        <p className="text-dark-400 mt-1 ml-[52px]">
          Send money directly to your M-Pesa or mobile wallet
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Amount to Withdraw
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <input
                    type="number"
                    min="10"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="100.00"
                    disabled={isLoading}
                    className={`input-field pl-11 ${errors.amount ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 text-sm font-medium">
                    {user?.currency || 'USD'}
                  </div>
                </div>
                {errors.amount && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.amount}
                  </p>
                )}
                <p className="mt-2 text-xs text-dark-500">
                  Minimum withdrawal: 10 {user?.currency || 'USD'}
                </p>
              </div>

              {/* Phone Number Input */}
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">
                  Recipient Phone Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleChange('phoneNumber', e.target.value)}
                    placeholder="2547XXXXXXXX"
                    disabled={isLoading}
                    className={`input-field pl-11 ${errors.phoneNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phoneNumber}
                  </p>
                )}
                <p className="mt-2 text-xs text-dark-500">
                  Include country code without the + sign (e.g. 2547XXXXXXXX)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5" />
                    Withdraw Funds
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <div className="card bg-dark-800/50 border border-dark-700/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Wallet className="w-4 h-4 text-primary-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Available Balance</h3>
                <p className="text-2xl font-bold text-white">
                  {user?.currency || 'USD'} {user?.balance?.toLocaleString() || '0.00'}
                </p>
                {typeof onBalanceRefresh === 'function' && (
                  <button
                    onClick={onBalanceRefresh}
                    className="mt-2 text-xs text-primary-400 hover:text-primary-300 inline-flex items-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh balance
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card bg-dark-800/50 border border-dark-700/50">
            <h3 className="text-sm font-semibold text-white mb-3">Withdrawal Notes</h3>
            <ul className="space-y-2 text-sm text-dark-400">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                Funds are sent to the provided mobile number via M-Pesa
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                Processing usually takes 1–3 minutes
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                Ensure your phone number is correct before confirming
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                Minimum withdrawal amount is 10 {user?.currency || 'USD'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Withdraw;