import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Users,
  Wallet,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsers: 0,
    totalTransactions: 0,
    totalVolume: 0,
    totalDeposits: 0,
    pendingKyc: 0,
    activeUsers: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
      setRecentTransactions(res.data.recentTransactions);
      setDailyStats(res.data.dailyStats.map(d => ({
        date: d._id,
        volume: d.volume,
        count: d.count
      })));
    } catch (error) {
      toast.error('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'text-blue-400', bg: 'bg-blue-600/20' },
    { label: 'New Users (30d)', value: stats.newUsers.toLocaleString(), icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
    { label: 'Total Volume', value: `$${stats.totalVolume.toLocaleString()}`, icon: Wallet, color: 'text-primary-400', bg: 'bg-primary-600/20' },
    { label: 'Active Users', value: stats.activeUsers.toLocaleString(), icon: Activity, color: 'text-amber-400', bg: 'bg-amber-600/20' },
    { label: 'Pending KYC', value: stats.pendingKyc.toLocaleString(), icon: Shield, color: 'text-purple-400', bg: 'bg-purple-600/20' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: ArrowDownLeft, color: 'text-cyan-400', bg: 'bg-cyan-600/20' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-emerald-400 bg-emerald-600/20',
      pending: 'text-amber-400 bg-amber-600/20',
      failed: 'text-red-400 bg-red-600/20'
    };
    return colors[status] || 'text-dark-400 bg-dark-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-dark-400 mt-1">Platform overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-sm text-dark-400">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            Transaction Volume (30 Days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyStats}>
                <defs>
                  <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Area type="monotone" dataKey="volume" stroke="#3b82f6" fillOpacity={1} fill="url(#volumeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Count Chart */}
        <div className="card">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Transaction Count (30 Days)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-400" />
          Recent Transactions
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Amount</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Sender</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Receiver</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-dark-400">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-300 font-mono">{txn.id}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-300 capitalize">{txn.type}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm font-medium text-white">${txn.amount.toFixed(2)}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                      {txn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-300">{txn.sender}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-300">{txn.receiver}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-dark-500">
                      {format(new Date(txn.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
