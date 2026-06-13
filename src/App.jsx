import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { queryClientInstance } from '@/lib/query-client';
import AppHeader from '@/components/layout/AppHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Lazy-loaded pages for code splitting
const Home = lazy(() => import('@/pages/Home'));
const Flashcards = lazy(() => import('@/pages/Flashcards'));
const Archive = lazy(() => import('@/pages/Archive'));
const Tutor = lazy(() => import('@/pages/Tutor'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Syllabus = lazy(() => import('@/pages/Syllabus'));
const Practice = lazy(() => import('@/pages/Practice'));
const MockTests = lazy(() => import('@/pages/MockTests'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Signup = lazy(() => import('@/pages/auth/Signup'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        {/* Public auth routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Main app — Home and Archive are public (SEO); others need auth */}
        <Route path="/" element={<AppLayout><Home /></AppLayout>} />
        <Route path="/archive" element={<AppLayout><Archive /></AppLayout>} />
        <Route path="/syllabus" element={<AppLayout><Syllabus /></AppLayout>} />

        {/* Protected routes */}
        <Route path="/flashcards" element={<ProtectedRoute><AppLayout><Flashcards /></AppLayout></ProtectedRoute>} />
        <Route path="/practice" element={<ProtectedRoute><AppLayout><Practice /></AppLayout></ProtectedRoute>} />
        <Route path="/mock-tests" element={<ProtectedRoute><AppLayout><MockTests /></AppLayout></ProtectedRoute>} />
        <Route path="/tutor" element={<ProtectedRoute><AppLayout><Tutor /></AppLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster position="top-center" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
