import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, ArrowRight, AlertCircle, Mail, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyAccount } = useAuth();

  // Pull email from navigation state; redirect back to register if missing
  const email = location.state?.email;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  // Redirect if no email was passed
  useEffect(() => {
    if (!email) {
      toast.error('Please register first.');
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // keep only last char
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace on empty box → move focus to previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    pasted.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    setError('');

    // Focus the next empty input or the last one
    const nextEmpty = newOtp.findIndex((v) => v === '');
    const focusIndex = nextEmpty === -1 ? 5 : Math.min(nextEmpty, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');

    if (code.length !== 6) {
      setError('Please enter all 6 digits.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await verifyAccount(email, code);
      toast.success(`Welcome to BambaPay, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired OTP. Please try again.';
      setError(message);
      toast.error(message);
      // Clear inputs on failure so user can re-type
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // Hook up to your backend resend endpoint when ready
    toast('Resend OTP feature coming soon.', { icon: '\u23F3' });
  };

  if (!email) return null; // wait for redirect

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center py-8 px-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-transparent to-dark-900" />

      <div className="w-full max-w-md mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">BambaPay</span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-2">Verify Your Email</h2>
          <p className="text-dark-400">
            We sent a 6-digit code to
          </p>
          <p className="text-primary-400 font-medium mt-1 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {email}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6-digit OTP inputs */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-3 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-14 text-center text-xl font-bold rounded-lg bg-dark-800 border-2 text-white placeholder-dark-600 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all ${
                      error ? 'border-red-500' : 'border-dark-700'
                    }`}
                    disabled={loading}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-3 text-sm text-red-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Verify & Continue <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResend}
              className="text-sm text-primary-400 hover:text-primary-300 font-medium inline-flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Resend code
            </button>
            <Link
              to="/register"
              className="text-sm text-dark-400 hover:text-dark-300 transition-colors"
            >
              Wrong email?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;