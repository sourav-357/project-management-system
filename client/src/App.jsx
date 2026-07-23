import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';

import { StudentDashboard } from './pages/StudentDashboard';
import { ProposalForm } from './pages/ProposalForm';
import { SupervisorSelector } from './pages/SupervisorSelector';
import { StudentFiles } from './pages/StudentFiles';

import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherRequests } from './pages/TeacherRequests';
import { SupervisedStudents } from './pages/SupervisedStudents';
import { TeacherProposals } from './pages/TeacherProposals';

import { AdminDashboard } from './pages/AdminDashboard';
import { UserManagement } from './pages/UserManagement';
import { ProjectManagement } from './pages/ProjectManagement';
import { ProfileSettings } from './pages/ProfileSettings';

import { Connections } from './pages/Connections';
import { InstantChat } from './pages/InstantChat';
import { MeetingsDashboard } from './pages/MeetingsDashboard';
import { GroupMeeting } from './pages/GroupMeeting';

const DashboardLayout = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Student']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/proposal" element={<ProposalForm />} />
              <Route path="/student/supervisors" element={<SupervisorSelector />} />
              <Route path="/student/documents" element={<StudentFiles />} />
              <Route path="/student/profile" element={<ProfileSettings />} />
            </Route>
          </Route>

          {/* Teacher Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Teacher']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              <Route path="/teacher/requests" element={<TeacherRequests />} />
              <Route path="/teacher/students" element={<SupervisedStudents />} />
              <Route path="/teacher/proposals" element={<TeacherProposals />} />
              <Route path="/teacher/profile" element={<ProfileSettings />} />
            </Route>
          </Route>

          {/* Admin Protected Routes */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/projects" element={<ProjectManagement />} />
              <Route path="/admin/profile" element={<ProfileSettings />} />
            </Route>
          </Route>

          {/* All Roles Shared Routes: Connections, Chat, Meetings */}
          <Route element={<ProtectedRoute allowedRoles={['Student', 'Teacher', 'Admin']} />}>
            <Route element={<DashboardLayout />}>
              <Route path="/connections" element={<Connections />} />
              <Route path="/chat" element={<InstantChat />} />
              <Route path="/meetings" element={<MeetingsDashboard />} />
              <Route path="/meetings/:meetingId" element={<GroupMeeting />} />
            </Route>
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
