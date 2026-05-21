import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  ChevronLeft,
  ChevronRight,
  Download,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState({ sent: 0, received: 0, deposited: 0 });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    type: 'all',
    status: 'all'
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);

      const res = await api.get(`/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
      setStats(res.data.summary);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.type, filters.status]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getStatusBadge = useMemo(() => {
    const classes = {
      completed: 'status-completed',
      pending: 'status-pending',
      failed: 'status-failed'
    };
    return (status) => classes[status] || 'bg-dark-700 text-dark-400';
  }, []);

  const getTypeIcon = useMemo(() => {
    return (type, isIncoming) => {
      if (type === 'deposit') return <ArrowDownLeft className="w-5 h-5 text-primary-400" />;
      if (type === 'withdraw') return <ArrowUpRight className="w-5 h-5 text-amber-400" />;
      return isIncoming 
        ? <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
        : <ArrowUpRight className="w-5 h-5 text-red-400" />;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-dark-400 mt-1">View and manage your transaction history</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-dark-400 mb-1">Total Sent</p>
          <p className="text-xl font-bold text-red-400">{user?.currency} {stats.sent.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-dark-400 mb-1">Total Received</p>
          <p className="text-xl font-bold text-emerald-400">{user?.currency} {stats.received.toFixed(2)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-dark-400 mb-1">Total Deposited</p>
          <p className="text-xl font-bold text-primary-400">{user?.currency} {stats.deposited.toFixed(2)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <span className="text-sm text-dark-400">Filters:</span>
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Types</option>
            <option value="send">Sent</option>
            <option value="receive">Received</option>
            <option value="deposit">Deposits</option>
            <option value="withdraw">Withdrawals</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary-500" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No transactions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Transaction</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Type</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Amount</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            txn.type === 'deposit' ? 'bg-primary-600/20' :
                            txn.type === 'withdraw' ? 'bg-amber-600/20' :
                            txn.isIncoming ? 'bg-emerald-600/20' : 'bg-red-600/20'
                          }`}>
                            {getTypeIcon(txn.type, txn.isIncoming)}
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{txn.description || txn.type}</p>
                            <p className="text-xs text-dark-500">{txn.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300 capitalize">{txn.type}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`font-semibold ${
                          txn.isIncoming || txn.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {txn.isIncoming || txn.type === 'deposit' ? '+' : '-'}{user?.currency} {txn.amount.toFixed(2)}
                        </span>
                        {txn.fee > 0 && (
                          <p className="text-xs text-dark-500">Fee: {user?.currency} {txn.fee.toFixed(2)}</p>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`status-badge ${getStatusBadge(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-400">
                          {format(new Date(txn.createdAt), 'MMM d, yyyy')}
                        </span>
                        <p className="text-xs text-dark-500">
                          {format(new Date(txn.createdAt), 'h:mm a')}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-dark-800/50">
                <p className="text-sm text-dark-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={!pagination.hasPrevPage}
                    className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-dark-300 px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Transactions;
