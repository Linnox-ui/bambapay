import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../utils/api';
import {
  History,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    type: 'all',
    status: 'all'
  });

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', filters.page);
      params.append('limit', filters.limit);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);

      const res = await api.get(`/admin/transactions?${params}`);
      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [filters.page, filters.type, filters.status]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const getStatusColor = useMemo(() => {
    const colors = {
      completed: 'bg-emerald-600/20 text-emerald-400',
      pending: 'bg-amber-600/20 text-amber-400',
      failed: 'bg-red-600/20 text-red-400'
    };
    return (status) => colors[status] || 'bg-dark-700 text-dark-400';
  }, []);

  const getTypeIcon = useMemo(() => {
    return (type) => {
      if (type === 'deposit') return <ArrowDownLeft className="w-4 h-4 text-primary-400" />;
      if (type === 'withdraw') return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      if (type === 'send') return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      if (type === 'receive') return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      return <History className="w-4 h-4 text-dark-400" />;
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-white">All Transactions</h1>
        <p className="text-dark-400 mt-1">Monitor and review all platform transactions</p>
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
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">All Types</option>
            <option value="send">Send</option>
            <option value="receive">Receive</option>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Count', value: pagination.totalCount || 0, color: 'text-white' },
          { label: 'Send', value: transactions.filter(t => t.type === 'send').length, color: 'text-red-400' },
          { label: 'Receive', value: transactions.filter(t => t.type === 'receive').length, color: 'text-emerald-400' },
          { label: 'Deposit', value: transactions.filter(t => t.type === 'deposit').length, color: 'text-primary-400' }
        ].map((stat, index) => (
          <div key={index} className="card">
            <p className="text-sm text-dark-400">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-12 h-12 text-dark-600 mx-auto mb-3" />
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
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Fee</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Sender</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Receiver</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            txn.type === 'deposit' ? 'bg-primary-600/20' :
                            txn.type === 'withdraw' ? 'bg-amber-600/20' :
                            txn.type === 'send' ? 'bg-red-600/20' : 'bg-emerald-600/20'
                          }`}>
                            {getTypeIcon(txn.type)}
                          </div>
                          <div>
                            <p className="text-sm text-white font-medium">{txn.description || txn.type}</p>
                            <p className="text-xs text-dark-500 font-mono">{txn.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-300 capitalize">{txn.type}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm font-medium text-white">{txn.currency} {txn.amount?.toFixed(2)}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-dark-400">{txn.fee > 0 ? `${txn.currency} ${txn.fee.toFixed(2)}` : '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}>
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-dark-300">{txn.sender?.name || 'System'}</p>
                        <p className="text-xs text-dark-500">{txn.sender?.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-dark-300">{txn.receiver?.name || 'System'}</p>
                        <p className="text-xs text-dark-500">{txn.receiver?.phone}</p>
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
                    className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-dark-300 px-3">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={!pagination.hasNextPage}
                    className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 transition-colors"
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

export default AdminTransactions;
