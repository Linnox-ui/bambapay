import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Send,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Search,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const SendMoney = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [recipientPhone, setRecipientPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showContacts, setShowContacts] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/wallet/contacts');
      setContacts(res.data.contacts);
    } catch (error) {
      console.error('Failed to fetch contacts');
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery)
  );

  const validateStep1 = () => {
    const newErrors = {};
    if (!recipientPhone) newErrors.recipient = 'Recipient phone is required';
    else if (!/^\+?[1-9]\d{1,14}$/.test(recipientPhone)) newErrors.recipient = 'Invalid phone format';
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = 'Valid amount is required';
    if (parseFloat(amount) > user?.balance) newErrors.amount = 'Insufficient balance';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
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
      const res = await api.post('/wallet/send', {
        recipientPhone,
        amount: parseFloat(amount),
        description,
        pin
      });
      setResult(res.data);
      toast.success(res.data.message);
      setStep(3);
    } catch (error) {
      const message = error.response?.data?.message || 'Transfer failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setRecipientPhone('');
    setAmount('');
    setDescription('');
    setPin('');
    setResult(null);
    setErrors({});
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Send Money</h1>
        <p className="text-dark-400 mt-1">Transfer funds to anyone, anywhere</p>
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
            {/* Recipient */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Recipient Phone</label>
              <div className="relative">
                <input
                  type="tel"
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className={`input-field ${errors.recipient ? 'border-red-500' : ''}`}
                  placeholder="+254700000000"
                />
                <button
                  type="button"
                  onClick={() => setShowContacts(!showContacts)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-dark-400 hover:text-white transition-colors"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
              {errors.recipient && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.recipient}
                </p>
              )}

              {/* Contacts Dropdown */}
              {showContacts && (
                <div className="mt-2 p-4 rounded-xl bg-dark-950 border border-dark-700">
                  <div className="flex items-center justify-between mb-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input-field text-sm"
                      placeholder="Search contacts..."
                    />
                    <button onClick={() => setShowContacts(false)} className="ml-2 p-2 text-dark-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {filteredContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setRecipientPhone(contact.phone);
                          setShowContacts(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-dark-800 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{contact.name}</p>
                          <p className="text-sm text-dark-400">{contact.phone}</p>
                        </div>
                      </button>
                    ))}
                    {filteredContacts.length === 0 && (
                      <p className="text-dark-500 text-center py-4">No contacts found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

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
                  min="0.01"
                  step="0.01"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-sm text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.amount}
                </p>
              )}
              <p className="mt-1 text-sm text-dark-500">
                Available: {user?.currency} {user?.balance?.toFixed(2)}
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">Description (Optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input-field"
                placeholder="What's this for?"
                maxLength={500}
              />
            </div>

            <button onClick={handleNext} className="w-full btn-primary flex items-center justify-center gap-2">
              Continue <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Summary */}
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 space-y-3">
              <div className="flex justify-between">
                <span className="text-dark-400">To</span>
                <span className="text-white font-medium">{recipientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Amount</span>
                <span className="text-white font-medium">{user?.currency} {parseFloat(amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Fee (1%)</span>
                <span className="text-white font-medium">{user?.currency} {Math.min(parseFloat(amount) * 0.01, 5).toFixed(2)}</span>
              </div>
              <div className="border-t border-dark-700 pt-3 flex justify-between">
                <span className="text-dark-300 font-medium">Total</span>
                <span className="text-white font-bold">{user?.currency} {parseFloat(amount).toFixed(2)}</span>
              </div>
              {description && (
                <div className="pt-2">
                  <span className="text-dark-400 text-sm">Note: {description}</span>
                </div>
              )}
            </div>

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
                  <>Confirm Transfer <Send className="w-5 h-5" /></>
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
              <h2 className="text-2xl font-bold text-white mb-2">Transfer Successful!</h2>
              <p className="text-dark-400">{result.message}</p>
            </div>
            <div className="p-4 rounded-xl bg-dark-950 border border-dark-700 text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-dark-400">Transaction ID</span>
                <span className="text-white font-mono text-sm">{result.transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Amount Sent</span>
                <span className="text-white font-medium">{user?.currency} {result.transaction.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">Fee</span>
                <span className="text-white font-medium">{user?.currency} {result.transaction.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">New Balance</span>
                <span className="text-emerald-400 font-bold">{user?.currency} {result.transaction.newBalance.toFixed(2)}</span>
              </div>
            </div>
            <button onClick={resetForm} className="btn-primary">
              Send Another
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SendMoney;
