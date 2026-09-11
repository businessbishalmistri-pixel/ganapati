import React, { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';

export function AdminApp({ onNavigateToStore }) {
  // Preserve admin login authentication across page refreshes
  const [session, setSession] = useState(() => {
    try {
      const saved = localStorage.getItem('ganapati_admin_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not read admin session', e);
    }
    return null;
  });

  const handleLoginSuccess = (newSession) => {
    try {
      localStorage.setItem('ganapati_admin_session', JSON.stringify(newSession));
    } catch (e) {
      console.warn(e);
    }
    setSession(newSession);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('ganapati_admin_session');
    } catch (e) {
      console.warn(e);
    }
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
