import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/features/user/components/ProtectedRoute';
import GuestRoute from '@/components/common/GuestRoute';
import AuthLayout from '@/features/user/components/AuthLayout';
import MainLayout from '@/features/user/components/MainLayout';
import Login from '@/features/user/auth/pages/Login';
import Register from '@/features/user/auth/pages/Register';
import VerifyOtp from '@/features/user/auth/pages/VerifyOtp';
import OAuthCallback from '@/features/user/auth/pages/OAuthCallback';
import Home from '../features/user/home/pages/Home';
import OnlineExamLibrary from '../features/user/exams/pages/OnlineExamLibrary';
import ExamPackage from '../features/user/exams/pages/ExamPackage';
import ExamPackageDetail from '../features/user/exams/pages/ExamPackageDetail';
import ExamInstructions from '../features/user/exams/pages/ExamInstructions';
import ReadingTest from '../features/user/exams/pages/ReadingTest';
import WritingTest from '../features/user/exams/pages/WritingTest';
import SpeakingTest from '../features/user/exams/pages/SpeakingTest';
import ListeningTest from '../features/user/exams/pages/ListeningTest';
import Profile from '../features/user/profile/Profile';
import ExamHistory from '../features/user/profile/ExamHistory';
import PaymentHistory from '../features/user/profile/PaymentHistory';
import LoginHistory from '../features/user/profile/LoginHistory';
import ListeningToeic from '../features/user/toeic/pages/Listening';
import WritingToeic from '../features/user/toeic/pages/Writing';
import SpeakingToeic from '../features/user/toeic/pages/Speaking';
import ReadingToeic from '../features/user/toeic/pages/Reading';

// Admin Panel imports
import AdminLayout from '@/features/admin/components/AdminLayout';
import ProtectedAdminRoute from '@/features/admin/components/ProtectedAdminRoute';
import AdminLogin from '@/features/admin/pages/AdminLogin';
import AdminDashboard from '@/features/admin/pages/AdminDashboard';
import UserManagement from '@/features/admin/pages/UserManagement';
import ExamManagement from '@/features/admin/pages/ExamManagement';
import ExamDetail from '@/features/admin/pages/ExamDetail';
import TestDetail from '@/features/admin/pages/TestDetail';
import SkillManagement from '@/features/admin/pages/SkillManagement';
import SkillDetail from '@/features/admin/pages/SkillDetail';
import SectionManagement from '@/features/admin/pages/SectionManagement';
import QuestionGroupManagement from '@/features/admin/pages/QuestionGroupManagement';
import QuestionManagement from '@/features/admin/pages/QuestionManagement';
import RoleManagement from '@/features/admin/pages/RoleManagement';

const PublicShell = (
  <MainLayout />
);

export const router = createBrowserRouter([

  {
    // phục vụ cho việc chưa đăng nhập vẫn xem dc trang
    element: PublicShell, children: [
      { path: '/', element: <Home /> },
      { path: '/de-thi-online', element: <OnlineExamLibrary /> },
      { path: '/bo-de/:examType', element: <ExamPackage /> },
      { path: '/bo-de/:examType/:examId', element: <ExamPackageDetail /> },
    ]
  },

  // Exam Instructions - Trang riêng không dùng layout
  {
    path: '/exam/instructions/:skillId',
    element: <ExamInstructions />,
  },
  {
    path: '/exam/instructions/:skillId/:sectionId',
    element: <ExamInstructions />,
  },

  // Exam Test Pages - Trang làm bài
  // Reading
  {
    path: '/exam/section/:skillId/:sectionId/test/reading',
    element: <ReadingTest />,
  },
  {
    path: '/exam/full/:skillId/test/reading',
    element: <ReadingTest />,
  },
  
  // Writing
  {
    path: '/exam/section/:skillId/:sectionId/test/writing',
    element: <WritingTest />,
  },
  {
    path: '/exam/full/:skillId/test/writing',
    element: <WritingTest />,
  },
  
  // Speaking
  {
    path: '/exam/section/:skillId/:sectionId/test/speaking',
    element: <SpeakingTest />,
  },
  {
    path: '/exam/full/:skillId/test/speaking',
    element: <SpeakingTest />,
  },
  
  // Listening
  {
    path: '/exam/section/:skillId/:sectionId/test/listening',
    element: <ListeningTest />,
  },
  {
    path: '/exam/full/:skillId/test/listening',
    element: <ListeningTest />,
  },

  // phần thi TOEIC
  { path: '/toeic-listening/:skillId', element: <ListeningToeic /> },
  { path: '/toeic-listening/:skillId/:sectionId', element: <ListeningToeic /> },
  { path: '/toeic-writing/:skillId', element: <WritingToeic /> },
  { path: '/toeic-writing/:skillId/:sectionId', element: <WritingToeic /> },
  { path: '/toeic-speaking/:skillId', element: <SpeakingToeic /> },
  { path: '/toeic-speaking/:skillId/:sectionId', element: <SpeakingToeic /> },
  { path: '/toeic-reading/:skillId', element: <ReadingToeic /> },
  { path: '/toeic-reading/:skillId/:sectionId', element: <ReadingToeic /> },

  {
    element: <GuestRoute><AuthLayout /></GuestRoute>,
    children: [
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/verify-otp', element: <VerifyOtp /> },
      { path: '/oauth/callback', element: <OAuthCallback /> },
    ],
  },

  // PROTECTED (ví dụ sau này: /courses, /attendance, ...)
  // phục vụ cho việc đăng nhập mới xem dc trang
  {
    element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
    children: [
      // trang cá nhân
      { path: '/trang-ca-nhan', element: <Profile /> },
      { path: '/lich-su-lam-bai', element: <ExamHistory /> },
      { path: '/lich-su-thanh-toan', element: <PaymentHistory /> },
      { path: '/lich-su-giao-dich-owl', element: <ExamHistory /> },
      { path: '/lich-su-dang-nhap', element: <LoginHistory /> },
    ],
  },

  // Admin Login (Public - no auth required)
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },

  // Admin Panel Routes (Protected)
  {
    path: '/admin',
    element: <ProtectedAdminRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'exams', element: <ExamManagement /> },
          { path: 'exams/:examId', element: <ExamDetail /> },
          { path: 'exams/:examId/tests/:testId', element: <TestDetail /> },
          { path: 'skills', element: <SkillManagement /> },
          { path: 'skills/:skillId', element: <SkillDetail /> },
          { path: 'skills/:skillId/sections/:sectionId/groups', element: <QuestionGroupManagement /> },
          { path: 'skills/:skillId/sections/:sectionId/groups/:groupId/questions', element: <QuestionManagement /> },
          { path: 'roles', element: <RoleManagement /> },
          { 
            path: 'analytics', 
            element: <div style={{ padding: 24 }}><h1>Analytics (Coming Soon)</h1></div> 
          },
          { 
            path: 'settings', 
            element: <div style={{ padding: 24 }}><h1>Settings (Coming Soon)</h1></div> 
          },
        ],
      },
    ],
  },

  // fallback
  { path: '*', element: <Navigate to="/" /> },
]);
