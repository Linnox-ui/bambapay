import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  User,
  Mail,
  Phone,
  Shield,
  Edit3,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});

  const validateProfile = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phone)) newErrors.phone = 'Invalid phone format';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfile()) return;
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', formData);
      updateUser({ ...user, ...res.data.user });
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword || passwordData.newPassword.length < 8) newErrors.newPassword = 'Min 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Profile</h1>
        <p className="text-dark-400 mt-1">Manage your account settings</p>
      </div>

      {/* Profile Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-primary-400" />
            Personal Information
          </h2>
          <button
            onClick={() => {
              if (editing) {
                setFormData({
                  firstName: user?.firstName || '',
                  lastName: user?.lastName || '',
                  phone: user?.phone || ''
                });
              }
              setEditing(!editing);
              setErrors({});
            }}
            className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1"
          >
            {editing ? 'Cancel' : <><Edit3 className="w-4 h-4" /> Edit</>}
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">First Name</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-400">{errors.firstName}</p>}
                </>
              ) : (
                <p className="text-white font-medium">{user?.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Last Name</label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-400">{errors.lastName}</p>}
                </>
              ) : (
                <p className="text-white font-medium">{user?.lastName}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1 flex items-center gap-1">
              <Mail className="w-3 h-3" /> Email
            </label>
            <p className="text-white font-medium">{user?.email}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-400 mb-1 flex items-center gap-1">
              <Phone className="w-3 h-3" /> Phone
            </label>
            {editing ? (
              <>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
              </>
            ) : (
              <p className="text-white font-medium">{user?.phone}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">Currency</label>
              <p className="text-white font-medium">{user?.currency}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-dark-400 mb-1">KYC Status</label>
              <span className={`status-badge ${
                user?.kycStatus === 'verified' ? 'status-completed' :
                user?.kycStatus === 'pending' ? 'status-pending' : 'status-failed'
              }`}>
                {user?.kycStatus}
              </span>
            </div>
          </div>

          {editing && (
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle className="w-5 h-5" /> Save Changes</>}
            </button>
          )}
        </div>
      </div>

      {/* Security Card */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-400" />
            Security
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-950 border border-dark-700">
            <div>
              <p className="font-medium text-white">Password</p>
              <p className="text-sm text-dark-400">Last changed recently</p>
            </div>
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="btn-secondary text-sm"
            >
              Change Password
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4 p-4 rounded-xl bg-dark-950 border border-dark-700">
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  className={`input-field ${errors.currentPassword ? 'border-red-500' : ''}`}
                />
                {errors.currentPassword && <p className="mt-1 text-xs text-red-400">{errors.currentPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  className={`input-field ${errors.newPassword ? 'border-red-500' : ''}`}
                />
                {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  className={`input-field ${errors.confirmPassword ? 'border-red-500' : ''}`}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>}
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPasswordForm(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl bg-dark-950 border border-dark-700">
            <div>
              <p className="font-medium text-white">Transaction PIN</p>
              <p className="text-sm text-dark-400">Required for all transactions</p>
            </div>
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Set
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
