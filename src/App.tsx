import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { PINAuth } from './components/PINAuth';
import { UserProfile } from './types';
import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
  };

  const handleLogout = () => {
    localStorage.removeItem('alupar_session');
    localStorage.removeItem('activeTab');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" richColors />
      <PINAuth 
        key={user ? 'authenticated' : 'login'}
        onSuccess={handleAuthSuccess} 
        onLogout={handleLogout}
        isAuthenticated={!!user}
      >
        {user && <Dashboard user={user} onLogout={handleLogout} />}
      </PINAuth>
    </div>
  );
}
