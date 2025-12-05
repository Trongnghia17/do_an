// Update this file: /React/src/app/routes.jsx
// Add admin routes to existing router configuration

import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import GuestRoute from '@/components/common/GuestRoute';
import AuthLayout from '@/components/layout/AuthLayout';
import MainLayout from '@/components/layout/MainLayout';

// ... existing imports ...

// ========== ADD THESE IMPORTS ==========
import AdminLayout from '@/features/admin/components/AdminLayout';
import ProtectedAdminRoute from '@/features/admin/components/ProtectedAdminRoute';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import UserManagement from '@/features/admin/pages/UserManagement';
import ExamManagement from '@/features/admin/pages/ExamManagement';
import RoleManagement from '@/features/admin/pages/RoleManagement';
// ========================================

const PublicShell = <MainLayout />;

export const router = createBrowserRouter([
  // ... existing routes ...

  // ========== ADD ADMIN ROUTES HERE (before fallback) ==========
  {
    path: '/admin',
    element: <ProtectedAdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            index: true,
            element: <AdminDashboard />,
          },
          {
            path: 'users',
            element: <UserManagement />,
          },
          {
            path: 'exams',
            element: <ExamManagement />,
          },
          {
            path: 'roles',
            element: <RoleManagement />,
          },
          {
            path: 'analytics',
            element: <div style={{ padding: 24 }}><h1>Analytics (Coming Soon)</h1></div>,
          },
          {
            path: 'settings',
            element: <div style={{ padding: 24 }}><h1>Settings (Coming Soon)</h1></div>,
          },
        ],
      },
    ],
  },
  // ============================================================

  // fallback
  { path: '*', element: <Navigate to="/" /> },
]);
