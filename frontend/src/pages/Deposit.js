import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Smartphone, Wallet, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../utils/api';

const Deposit = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const quickAmounts = [500, 1000, 5000, 10000];

  /**
   * Format phone number to 2547XXXXXXXX for Safaricom
   */
  const formatPhoneNumber = (input) => {
    let cleaned = input.replace(/\D/g, '');
    
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  /**
   * Validate Safaricom phone number format
   */
  const isValidPhoneNumber = (phone) => {
    const formatted = formatPhoneNumber(phone);
    // 2547XXXXXXXX or 2541XXXXXXXX (Safaricom prefixes)
    return /^254[71]\d{8}$/.test(formatted);
  };

  /**
   * Validate amount
   */
  const isValidAmount = (value) => {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
  };

  const handleQuickAmount = (value) => {
    setAmount(value.toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!isValidAmount(amount)) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      toast.error('Please enter a valid Safaricom phone number (e.g., 07XX XXX XXX or 2547XX XXX XXX)');
      return;
    }

    setIsLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const parsedAmount = parseFloat(amount);

      const response = await api.post('/wallet/deposit', {
        amount: parsedAmount,
        phoneNumber: formattedPhone
      });

      if (response.data.success) {
        toast.success(
          response.data.message || 'STK Push sent! Check your phone for the M-Pesa PIN prompt.',
          { duration: 6000, icon: <CheckCircle2 className="text-green-500" /> }
        );
        
        // Redirect to transactions page after brief delay so user sees toast
        setTimeout(() => {
          navigate('/transactions');
        }, 1500);
      }
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to initiate deposit. Please try again.';
      
      toast.error(errorMessage, { duration: 5000 });
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    // Allow only digits, +, and spaces for UX
    if (/^[\d+\s]*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (/^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors group"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400 group-hover:text-slate-200" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-white">Deposit Funds</h1>
            <p className="text-sm text-slate-400">Add money via M-Pesa</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* Info Card */}
          <div className="mb-8 p-4 bg-emerald-950/30 border border-emerald-900/50 rounded-xl flex items-start gap-3">
            <Smartphone className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-emerald-300">M-Pesa STK Push</h3>
              <p className="text-xs text-emerald-400/80 mt-1">
                Enter your Safaricom number and amount. You will receive a PIN prompt on your phone to authorize the payment.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Amount Input */}
            <div className="space-y-2">
              <label htmlFor="amount" className="block text-sm font-medium text-slate-300">
                Amount (KES)
              </label>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="0.00"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>

              {/* Quick Amount Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                {quickAmounts.map((quickAmt) => (
                  <button
                    key={quickAmt}
                    type="button"
                    onClick={() => handleQuickAmount(quickAmt)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      parseFloat(amount) === quickAmt
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    KES {quickAmt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                M-Pesa Phone Number
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  placeholder="07XX XXX XXX or 2547XX XXX XXX"
                  disabled={isLoading}
                  maxLength={16}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
              </div>
              <p className="text-xs text-slate-500">
                Enter your Safaricom number. We will format it automatically.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !amount || !phoneNumber}
              className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Initiating STK Push...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-5 h-5" />
                  <span>Deposit via M-Pesa</span>
                </>
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              Secured by Safaricom M-Pesa. Your PIN is never shared with BambaPay.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deposit;