import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { supabase } from '../../services/supabaseStore';

export function AdminApp({ onNavigateToStore }) {
  // Only a real Supabase Auth session counts as signed in.
  const [session, setSession] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data?.session || null);
      setIsCheckingSession(false);
    }).catch(() => {
      setIsCheckingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <AdminLogin
        onLoginSuccess={handleLoginSuccess}
        onBackToStore={onNavigateToStore}
      />
    );
  }

  return (
    <AdminDashboard
      session={session}
      onLogout={handleLogout}
      onVisitStore={onNavigateToStore}
    />
  );
}
