import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye,
  EyeOff,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const [balance, setBalance] = useState(user?.balance || 0);
  const [showBalance, setShowBalance] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({ sent: 0, received: 0, deposited: 0 });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [balanceRes, txnRes] = await Promise.all([
        api.get('/wallet/balance'),
        api.get('/transactions?limit=5')
      ]);
      setBalance(balanceRes.data.data.balance);
      setTransactions(txnRes.data.transactions);
      setStats(txnRes.data.summary);
      updateUser({ ...user, balance: balanceRes.data.balance });
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [user, updateUser]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const quickActions = useMemo(() => [
    { label: 'Send', icon: Send, path: '/send', color: 'bg-primary-600/20 text-primary-400' },
    { label: 'Deposit', icon: ArrowDownLeft, path: '/deposit', color: 'bg-emerald-600/20 text-emerald-400' },
    { label: 'Withdraw', icon: ArrowUpRight, path: '/withdraw', color: 'bg-amber-600/20 text-amber-400' },
    { label: 'History', icon: Clock, path: '/transactions', color: 'bg-purple-600/20 text-purple-400' },
  ], []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-dark-400 mt-1">Welcome back, {user?.firstName}</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="p-3 rounded-xl bg-dark-800 text-dark-400 hover:text-white hover:bg-dark-700 transition-colors transition-opacity"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Balance Card */}
      <div className="card bg-gradient-to-br from-primary-900/50 to-dark-800 border-primary-500/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary-400" />
            <span className="text-dark-300 font-medium">Total Balance</span>
          </div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            className="p-2 rounded-lg bg-dark-800/50 text-dark-400 hover:text-white transition-colors"
          >
            {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-dark-400 text-2xl">{user?.currency}</span>
          <span className="text-5xl font-bold text-white">
          {showBalance ? (balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }) : '••••••'}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-emerald-400">
            <TrendingUp className="w-4 h-4" /> +{stats.received.toFixed(2)} received
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <TrendingDown className="w-4 h-4" /> -{stats.sent.toFixed(2)} sent
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.label}
              to={action.path}
              className="card hover:border-primary-500/30 transition-colors transition-opacity duration-300 group"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-white">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-400 text-sm">Total Sent</span>
            <ArrowUpRight className="w-4 h-4 text-red-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.currency} {stats.sent.toFixed(2)}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-400 text-sm">Total Received</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.currency} {stats.received.toFixed(2)}</p>
        </div>
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-dark-400 text-sm">Total Deposited</span>
            <Wallet className="w-4 h-4 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-white">{user?.currency} {stats.deposited.toFixed(2)}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Transactions</h2>
          <Link to="/transactions" className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1">
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No transactions yet</p>
            <Link to="/send" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
              Make your first transfer
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn) => (
              <div key={txn.id} className="flex items-center justify-between p-4 rounded-xl bg-dark-800/50 hover:bg-dark-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.isIncoming ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                  }`}>
                    {txn.isIncoming ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-white">{txn.description || txn.type}</p>
                    <p className="text-sm text-dark-400">
                      {txn.isIncoming ? `From: ${txn.sender?.name || 'Unknown'}` : `To: ${txn.receiver?.name || 'Unknown'}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${txn.isIncoming ? 'text-emerald-400' : 'text-red-400'}`}>
                    {txn.isIncoming ? '+' : '-'}{user?.currency} {txn.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-dark-500">
                    {format(new Date(txn.createdAt), 'MMM d, h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
