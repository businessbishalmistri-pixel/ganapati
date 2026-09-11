import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function AdminApp({ onNavigateToStore }) {
  // Admin session is kept strictly in React memory — never stored on browser disk/storage
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Purge any legacy admin session from browser storage
    try {
      localStorage.removeItem('ganapati_admin_session');
    } catch (e) {
      // ignore
    }
  }, []);

  const handleLoginSuccess = (newSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

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
