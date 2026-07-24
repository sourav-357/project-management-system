import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  UploadCloud,
  Users,
  FolderKanban,
  Settings,
  Share2,
  MessagesSquare,
  Menu,
  X
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const { totalUnreadCount } = useSocket();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const commonNav = [
    { label: 'Network & Connections', icon: Share2, path: '/connections' },
    { label: 'Instant Chat', icon: MessagesSquare, path: '/chat', badge: totalUnreadCount },
  ];

  const studentNav = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/student/dashboard' },
    { label: 'My Proposal', icon: FileText, path: '/student/proposal' },
    { label: 'Supervisor Selector', icon: UserCheck, path: '/student/supervisors' },
    { label: 'Project Documents', icon: UploadCloud, path: '/student/documents' },
    ...commonNav,
    { label: 'Profile & Settings', icon: Settings, path: '/student/profile' },
  ];

  const teacherNav = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/teacher/dashboard' },
    { label: 'Supervisor Requests', icon: UserCheck, path: '/teacher/requests' },
    { label: 'Supervised Students', icon: Users, path: '/teacher/students' },
    { label: 'Project Proposals', icon: FolderKanban, path: '/teacher/proposals' },
    ...commonNav,
    { label: 'Profile & Settings', icon: Settings, path: '/teacher/profile' },
  ];

  const adminNav = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { label: 'User Directory', icon: Users, path: '/admin/users' },
    { label: 'All Projects', icon: FolderKanban, path: '/admin/projects' },
    ...commonNav,
    { label: 'Profile & Settings', icon: Settings, path: '/admin/profile' },
  ];

  const navItems =
    user.role === 'Student'
      ? studentNav
      : user.role === 'Teacher'
        ? teacherNav
        : adminNav;

  const navContent = (
    <div className="h-full flex flex-col justify-between p-4">
      <div>
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider text-slate-500 uppercase">
          <span>{user.role} Workspace</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="mt-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {Boolean(item.badge) && (
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-600 text-white rounded-full shadow-sm animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800/80 mt-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center font-bold text-xs text-slate-800 dark:text-slate-200 overflow-hidden shrink-0">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user.name?.charAt(0) || 'U'
          )}
        </div>
        <div className="overflow-hidden space-y-0.5">
          <p className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate">{user.name}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 left-5 z-40 p-3 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-500 transition-all flex items-center justify-center"
        title="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside className="hidden md:flex w-64 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-y-auto shrink-0 transition-colors">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex">
          <aside className="w-72 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
