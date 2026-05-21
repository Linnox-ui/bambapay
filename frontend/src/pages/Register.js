import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pin: '',
    currency: 'USD'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const { register } = useAuth();
  const navigate = useNavigate();

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) newErrors.phone = 'Include country code (e.g., +254...)'; 
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Minimum 8 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.pin) newErrors.pin = 'Transaction PIN is required';
    else if (!/^\d{4,6}$/.test(formData.pin)) newErrors.pin = 'PIN must be 4-6 digits';
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
      const user = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        pin: formData.pin,
        currency: formData.currency
      });
      toast.success(`Welcome to BambaPay, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-8 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-dark-900" />

      <div className="w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">BambaPay</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-dark-400">Join thousands of users worldwide</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary-500' : 'bg-dark-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400'}`}>1</div>
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-dark-700'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400'}`}>2</div>
        </div>

        <div className="card">
          <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }} className="space-y-5">
            {step === 1 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">First Name</label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-300 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Phone (+country code)</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="+254700000000"
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input-field"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                  </select>
                </div>

                <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`input-field pr-12 ${errors.password ? 'border-red-500' : ''}`}
                      placeholder="Min 8 characters"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    placeholder="Repeat password"
                  />
                  {errors.confirmPassword && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark-300 mb-2">Transaction PIN (4-6 digits)</label>
                  <input
                    type="password"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    maxLength={6}
                    className={`input-field ${errors.pin ? 'border-red-500' : ''}`}
                    placeholder="1234"
                  />
                  {errors.pin && <p className="mt-1 text-sm text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> {errors.pin}</p>}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 btn-secondary">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Create Account <ArrowRight className="w-5 h-5" /></>
                    )}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-dark-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
