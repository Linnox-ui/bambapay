import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Wallet, 
  Shield, 
  Zap, 
  Globe, 
  ArrowRight, 
  CheckCircle,
  Smartphone,
  Lock,
  TrendingUp
} from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Send and receive money in seconds, not days. Real-time transactions across the globe.'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: '256-bit encryption, biometric authentication, and fraud detection protect your money.'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Support for multiple currencies and payment methods worldwide.'
    },
    {
      icon: Smartphone,
      title: 'Mobile First',
      description: 'Beautiful, responsive design that works perfectly on any device.'
    },
    {
      icon: Lock,
      title: 'Privacy Focused',
      description: 'Your data is yours. We never sell your information to third parties.'
    },
    {
      icon: TrendingUp,
      title: 'Low Fees',
      description: 'Transparent pricing with no hidden charges. Keep more of your money.'
    }
  ];

  const stats = [
    { value: '$2.5B+', label: 'Transactions Processed' },
    { value: '500K+', label: 'Active Users' },
    { value: '150+', label: 'Countries Supported' },
    { value: '99.9%', label: 'Uptime Guaranteed' }
  ];

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-white">BambaPay</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-dark-300 hover:text-white font-medium transition-colors">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary text-sm">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            Now available in 150+ countries
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Send Money <br />
            <span className="gradient-text">Without Borders</span>
          </h1>

          <p className="text-xl text-dark-400 max-w-2xl mx-auto mb-10">
            The modern payment platform for individuals and businesses. 
            Fast, secure, and incredibly simple to use.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn-primary text-lg px-8">
              Create Free Account
              <ArrowRight className="w-5 h-5 inline ml-2" />
            </Link>
            <Link to="/login" className="btn-secondary text-lg px-8">
              Sign In
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-dark-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-dark-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              A complete suite of payment tools designed for the modern world.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="card-hover group">
                  <div className="w-12 h-12 rounded-xl bg-primary-600/20 flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-dark-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-dark-400 max-w-2xl mx-auto">
              Get started in minutes with our simple three-step process.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Account', desc: 'Sign up with your email and verify your identity in minutes.' },
              { step: '02', title: 'Add Money', desc: 'Deposit funds via card, bank transfer, or mobile money.' },
              { step: '03', title: 'Start Transacting', desc: 'Send money, pay bills, and manage your finances effortlessly.' }
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="card text-center">
                  <div className="text-5xl font-bold text-primary-600/30 mb-4">{item.step}</div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-dark-400">{item.desc}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-primary-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="card bg-gradient-to-br from-primary-900/50 to-dark-800 border-primary-500/20 text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-dark-300 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust BambaPay for their daily transactions.
              No hidden fees, no complicated setup.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn-primary text-lg px-8">
                Create Free Account
              </Link>
              <div className="flex items-center gap-2 text-dark-400">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dark-800/50 py-12 bg-dark-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">BambaPay</span>
            </div>
            <p className="text-dark-500 text-sm">
              © 2026 BambaPay. All rights reserved. Secure digital payments for everyone.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
