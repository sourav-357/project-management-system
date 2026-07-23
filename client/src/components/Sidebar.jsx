import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  UploadCloud,
  MessageSquare,
  Users,
  FolderKanban,
  CheckSquare,
  Settings,
  Share2,
  MessagesSquare,
  Video,
  Menu,
  X
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const commonNav = [
    { label: 'Network & Connections', icon: Share2, path: '/connections' },
    { label: 'Instant Chat', icon: MessagesSquare, path: '/chat' },
    { label: 'Video Meetings & Calls', icon: Video, path: '/meetings' },
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
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          <span>Navigation ({user.role})</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="mt-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-semibold shadow-sm shadow-indigo-100 dark:shadow-indigo-950'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                }`
              }
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-800 mt-4">
        <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">{user.department || 'General Department'}</p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger Float Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-5 left-5 z-40 p-3 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all flex items-center justify-center"
        title="Open Navigation Menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop Sticky Constant Sidebar */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 sticky top-[65px] h-[calc(100vh-65px)] overflow-y-auto shrink-0 transition-colors">
        {navContent}
      </aside>

      {/* Mobile Drawer Overlay Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex">
          <aside className="w-72 bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200">
            {navContent}
          </aside>
          <div className="flex-1" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  );
};
