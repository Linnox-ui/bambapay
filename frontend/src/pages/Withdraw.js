import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  ArrowUpRight,
  Banknote,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Withdraw = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [accountDetails, setAccountDetails] = useState({
    accountNumber: '',
    bankName: '',
    accountName: '',
    phoneNumber: ''
  });
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  const validateStep1 = () => {
    const newErrors = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (parseFloat(amount) > user?.balance) newErrors.amount = 'Insufficient balance';
    if (parseFloat(amount) < 10) newErrors.amount = 'Minimum withdrawal is $10';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (method === 'bank_transfer') {
      if (!accountDetails.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!accountDetails.bankName) newErrors.bankName = 'Bank name is required';
      if (!accountDetails.accountName) newErrors.accountName = 'Account holder name is required';
    } else {
      if (!accountDetails.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    }
    if (!pin || pin.length < 4) newErrors.pin = 'PIN is required (4-6 digits)';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setErrors({});
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await api.post('/payments/withdraw', {
        amount: parseFloat(amount),
        method,
        accountDetails: method === 'bank_transfer' ? {
          accountNumber: accountDetails.accountNumber,
          bankName: accountDetails.bankName,
          accountName: accountDetails.accountName
        } : {
          phoneNumber: accountDetails.phoneNumber
        },
        pin
      });
      setResult(res.data);
      toast.success(res.data.message);
      setStep(3);
    } catch (error) {
      const message = error.response?.data?.message || 'Withdrawal failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setAmount('');
    setMethod('bank_transfer');
    setAccountDetails({ accountNumber: '', bankName: '', accountName: '', phoneNumber: '' });
    setPin('');
    setResult(null);
    setErrors({});
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Withdraw Funds</h1>
        <p className="text-dark-400 mt-1">Transfer money to your bank or mobile money</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <React.Fragment key={s}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors transition-opacity ${
              step >= s ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400'
            }`}>
              {step > s ? <CheckCircle className="w-5 h-5" /> : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-1 rounded-full ${step > s ? 'bg-primary-500' : 'bg-dark-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card">
        {step === 1 && (
          <div className="space-y-6">
            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Amount ({user?.currency})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 font-medium">{user?.currency}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`input-field pl-16 ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  min="10"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.amount}
                </p>
              )}
              <p className="mt-1 text-sm text-dark-500">
                Available: {user?.currency} {user?.balance?.toFixed(2)} · Min: $10
              </p>
            </div>

            {/* Method */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Withdrawal Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('bank_transfer')}
                  className={`p-4 rounded-xl border text-left transition-colors transition-opacity ${
                    method === 'bank_transfer'
                      ? 'border-primary-500 bg-primary-600/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <Banknote className={`w-6 h-6 mb-2 ${method === 'bank_transfer' ? 'text-primary-400' : 'text-dark-400'}`} />
                  <p className={`font-medium ${method === 'bank_transfer' ? 'text-white' : 'text-dark-300'}`}>Bank Transfer</p>
                  <p className="text-xs text-dark-500 mt-1">1-3 business days</p>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('mobile_money')}
                  className={`p-4 rounded-xl border text-left transition-colors transition-opacity ${
                    method === 'mobile_money'
                      ? 'border-primary-500 bg-primary-600/10'
                      : 'border-dark-700 bg-dark-800/50 hover:border-dark-600'
                  }`}
                >
                  <Smartphone className={`w-6 h-6 mb-2 ${method === 'mobile_money' ? 'text-primary-400' : 'text-dark-400'}`} />
                  <p className={`font-medium ${method === 'mobile_money' ? 'text-white' : 'text-dark-300'}`}>Mobile Money</p>
                  <p className="text-xs text-dark-500 mt-1">Instant</p>
                </button>
              </div>
            </div>

            <button onClick={handleNext} className="w-full btn-primary flex items-center justify-center gap-2">
              Continue <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">Amount</span>
                <span className="text-white font-medium">{user?.currency} {parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Method</span>
                <span className="text-white font-medium capitalize">{method.replace('_', ' ')}</span>
              </div>
              <div className="border-t border-dark-700 pt-3 flex justify-between">
                <span className="text-dark-300 font-medium">Total</span>
                <span className="text-white font-bold">{user?.currency} {parseFloat(amount).toFixed(2)}</span>
              </div>
            </div>

            {/* Account Details */}
            {method === 'bank_transfer' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Bank Name</label>
                  <input
                    type="text"
                    value={accountDetails.bankName}
                    onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                    className={`input-field ${errors.bankName ? 'border-red-500' : ''}`}
                    placeholder="e.g., Chase Bank"
                  />
                  {errors.bankName && <p className="mt-1 text-sm text-red-400">{errors.bankName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Account Holder Name</label>
                  <input
                    type="text"
                    value={accountDetails.accountName}
                    onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                    className={`input-field ${errors.accountName ? 'border-red-500' : ''}`}
                    placeholder="Full name on account"
                  />
                  {errors.accountName && <p className="mt-1 text-sm text-red-400">{errors.accountName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Account Number</label>
                  <input
                    type="text"
                    value={accountDetails.accountNumber}
                    onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                    className={`input-field ${errors.accountNumber ? 'border-red-500' : ''}`}
                    placeholder="Account number"
                  />
                  {errors.accountNumber && <p className="mt-1 text-sm text-red-400">{errors.accountNumber}</p>}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-2">Mobile Money Number</label>
                <input
                  type="tel"
                  value={accountDetails.phoneNumber}
                  onChange={(e) => setAccountDetails({ ...accountDetails, phoneNumber: e.target.value })}
                  className={`input-field ${errors.phoneNumber ? 'border-red-500' : ''}`}
                  placeholder="+254700000000"
                />
                {errors.phoneNumber && <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>}
              </div>
            )}

            {/* PIN */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Transaction PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className={`input-field text-center text-2xl tracking-[0.5em] ${errors.pin ? 'border-red-500' : ''}`}
                placeholder="••••"
                maxLength={6}
              />
              {errors.pin && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.pin}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="flex-1 btn-secondary">
                Back
              </button>
              <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Confirm Withdrawal <ArrowUpRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 3 && result && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Withdrawal Initiated!</h2>
              <p className="text-dark-400">{result.message}</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">{result.transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Amount</span>
                <span className="text-white font-medium">{user?.currency} {result.transaction.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Method</span>
                <span className="text-white font-medium capitalize">{result.transaction.method.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Estimated Arrival</span>
                <span className="text-amber-400 font-medium">{result.transaction.estimatedArrival}</span>
              </div>
            </div>
            <button onClick={resetForm} className="btn-primary">
              Withdraw Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdraw;
