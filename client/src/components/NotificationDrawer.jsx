import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import {
  Bell, Check, CheckCheck, Inbox, ExternalLink, X, Trash2, UserCheck, Video, MessageSquare, ShieldCheck, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotificationDrawer = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('All'); // 'All' | 'Unread'

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      const list = res.data.data.notifications || [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (id, isRead) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (!isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      await api.delete('/notifications/clear-all');
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'meeting':
        return <Video className="w-3.5 h-3.5 text-indigo-500" />;
      case 'request':
        return <UserCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'feedback':
        return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />;
      case 'approval':
        return <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />;
      default:
        return <AlertCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'Unread') return !n.isRead;
    return true;
  });

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        title="Notification Centre"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-bounce shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Modern Slide-over Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden backdrop-blur-md">
          {/* Header Bar */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Notification Centre
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded-full border border-indigo-200 dark:border-indigo-800">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filtering Tabs & Action Bar */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 flex justify-between items-center text-xs">
            <div className="flex gap-1">
              {['All', 'Unread'].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                    filter === t
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Read All
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-0.5"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <Inbox className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-semibold">No notifications available</p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-3.5 flex gap-3 transition-colors ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 opacity-80'
                      : 'bg-indigo-50/50 dark:bg-indigo-950/40 font-medium border-l-2 border-indigo-600'
                  }`}
                >
                  <div className="pt-0.5 shrink-0">
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getNotificationIcon(n.type)}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-slate-900 dark:text-slate-100 leading-snug text-[11px]">{n.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                      <div className="flex items-center gap-2">
                        {n.link && (
                          <Link
                            to={n.link}
                            onClick={() => {
                              markAsRead(n._id);
                              setIsOpen(false);
                            }}
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                          >
                            View <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                        {!n.isRead && (
                          <button
                            onClick={() => markAsRead(n._id)}
                            className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-0.5 font-bold"
                          >
                            <Check className="w-3 h-3" /> Read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(n._id, n.isRead)}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded"
                          title="Delete notification"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
