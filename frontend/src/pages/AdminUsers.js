import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserCheck,
  UserX,
  Filter,
  Eye,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await api.get(`/admin/users?${params}`);
      setUsers(res.data.users);
      setPagination(res.data.pagination);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchUsers(pagination.page);
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, isActive: !currentStatus });
      }
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const viewUserDetails = async (userId) => {
    try {
      const res = await api.get(`/admin/users/${userId}`);
      setSelectedUser(res.data);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load user details');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Users Management</h1>
          <p className="text-dark-400 mt-1">Manage and monitor user accounts</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-4">
          <form onSubmit={handleSearch} className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field pl-10"
                placeholder="Search by name, email, or phone..."
              />
            </div>
          </form>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-dark-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending_kyc">Pending KYC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dark-700">
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">User</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Contact</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Balance</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Status</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">KYC</th>
                    <th className="text-left py-4 px-4 text-sm font-medium text-dark-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-dark-800/50 hover:bg-dark-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-600/20 flex items-center justify-center">
                            <span className="text-primary-400 font-semibold">
                              {user.name?.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{user.name}</p>
                            <p className="text-xs text-dark-500">{user.isAdmin ? 'Administrator' : 'User'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm text-dark-300">{user.email}</p>
                        <p className="text-xs text-dark-500">{user.phone}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-white">
                          {user.currency} {user.balance?.toFixed(2)}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.kycStatus === 'verified' ? 'bg-emerald-600/20 text-emerald-400' :
                          user.kycStatus === 'pending' ? 'bg-amber-600/20 text-amber-400' :
                          'bg-red-600/20 text-red-400'
                        }`}>
                          {user.kycStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => viewUserDetails(user.id)}
                            className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user.id, user.isActive)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.isActive 
                                ? 'bg-red-600/20 text-red-400 hover:bg-red-600/30' 
                                : 'bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                            }`}
                            title={user.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </div>
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
                  Page {pagination.page} of {pagination.totalPages} · {pagination.totalCount} total
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchUsers(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => fetchUsers(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
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

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">User Details</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-lg bg-dark-800 text-dark-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-dark-950">
                  <p className="text-xs text-dark-500">Name</p>
                  <p className="text-white font-medium">{selectedUser.user.name}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-950">
                  <p className="text-xs text-dark-500">Email</p>
                  <p className="text-white font-medium">{selectedUser.user.email}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-950">
                  <p className="text-xs text-dark-500">Phone</p>
                  <p className="text-white font-medium">{selectedUser.user.phone}</p>
                </div>
                <div className="p-3 rounded-lg bg-dark-950">
                  <p className="text-xs text-dark-500">Balance</p>
                  <p className="text-white font-medium">{selectedUser.user.currency} {selectedUser.user.balance?.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-dark-950 border border-dark-700">
                <h3 className="font-medium text-white mb-3">Recent Transactions</h3>
                {selectedUser.transactions.length === 0 ? (
                  <p className="text-dark-500 text-sm">No transactions</p>
                ) : (
                  <div className="space-y-2">
                    {selectedUser.transactions.map((txn) => (
                      <div key={txn.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-900">
                        <div>
                          <p className="text-sm text-white">{txn.type}</p>
                          <p className="text-xs text-dark-500">{txn.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">${txn.amount?.toFixed(2)}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            txn.status === 'completed' ? 'bg-emerald-600/20 text-emerald-400' :
                            txn.status === 'pending' ? 'bg-amber-600/20 text-amber-400' :
                            'bg-red-600/20 text-red-400'
                          }`}>
                            {txn.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
