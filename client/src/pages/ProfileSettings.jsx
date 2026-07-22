import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { User, KeyRound, ShieldAlert, Upload, CheckCircle2, AlertCircle, LogOut } from 'lucide-react';

export const ProfileSettings = () => {
  const { user, refreshUserData, logoutAll } = useAuth();

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  const [avatarError, setAvatarError] = useState('');

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  // Logout all state
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleAvatarSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setAvatarMsg('');
      setAvatarError('');
    }
  };

  const handleAvatarUpload = async (e) => {
    e.preventDefault();
    if (!avatarFile) return;

    setAvatarLoading(true);
    setAvatarMsg('');
    setAvatarError('');

    const formData = new FormData();
    formData.append('avatar', avatarFile);

    try {
      const res = await api.put('/auth/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAvatarMsg('Profile avatar updated successfully!');
      await refreshUserData();
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassError('');

    if (newPassword !== confirmPassword) {
      setPassError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long');
      return;
    }

    setPassLoading(true);
    try {
      const res = await api.put('/auth/password/change', { oldPassword, newPassword });
      setPassMsg(res.data.message || 'Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPassLoading(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!window.confirm('Are you sure you want to sign out from all active devices and sessions?')) return;

    setLogoutLoading(true);
    try {
      await logoutAll();
    } catch (err) {
      alert('Failed to terminate all sessions');
    } finally {
      setLogoutLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">Account & Security Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage your profile details, avatar, security, and active sessions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col items-center text-center space-y-4">
          <div className="relative group">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt={user?.name}
                className="w-28 h-28 rounded-full object-cover border-4 border-indigo-100 dark:border-indigo-900 shadow-md"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-extrabold shadow-md shadow-indigo-200 dark:shadow-indigo-950">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">{user?.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-full">
              {user?.role} • {user?.department || 'General'}
            </span>
          </div>

          {/* Avatar Upload Form */}
          <form onSubmit={handleAvatarUpload} className="w-full pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
            {avatarMsg && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] flex items-center gap-1.5 text-left">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> {avatarMsg}
              </div>
            )}
            {avatarError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] flex items-center gap-1.5 text-left">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {avatarError}
              </div>
            )}

            <label className="cursor-pointer block py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-center">
              Choose Avatar Image
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </label>

            {avatarFile && (
              <button
                type="submit"
                disabled={avatarLoading}
                className="w-full py-2 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-50"
              >
                {avatarLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" /> Upload Avatar
                  </>
                )}
              </button>
            )}
          </form>
        </div>

        {/* Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Change Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm border-b border-slate-100 dark:border-slate-800 pb-3">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Change Password
            </div>

            {passMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {passMsg}
              </div>
            )}
            {passError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {passError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-950 disabled:opacity-50"
                >
                  {passLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Sessions & Security Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 border-l-4 border-l-rose-500">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
                <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Active Sessions & Security
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              If you suspect unapproved access to your account or lost a device, you can log out from all active sessions across all devices simultaneously.
            </p>

            <button
              onClick={handleLogoutAllDevices}
              disabled={logoutLoading}
              className="px-4 py-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 font-semibold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {logoutLoading ? 'Signing out everywhere...' : 'Sign Out of All Active Devices'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
