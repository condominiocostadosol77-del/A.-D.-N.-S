import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Settings from './pages/Settings';
import Disciplines from './pages/Disciplines';
import * as storage from './services/storage';
import { Sector } from './types';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentSector, setCurrentSector] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<Sector[]>([]);

  useEffect(() => {
    const init = async () => {
        // Check Supabase session
        const session = await storage.getCurrentSession();
        if (session && session.user) {
          setUserEmail(session.user.email || '');
          setIsAuthenticated(true);
        }

        // Seed if necessary (checks empty tables)
        await storage.seedDatabase();
        
        // Load sectors if authenticated
        if (session) {
            const loadedSectors = await storage.getSectors();
            setSectors(loadedSectors);
        }
        
        setLoading(false);
    }
    init();
  }, [isAuthenticated]); // Reload when auth state changes

  const handleLogin = async (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    // Reload sectors after login
    const loadedSectors = await storage.getSectors();
    setSectors(loadedSectors);
  };

  const handleLogout = async () => {
    await storage.logoutUser();
    setIsAuthenticated(false);
    setUserEmail('');
  };

  const handleUpdateSectors = (newSectors: Sector[]) => {
      setSectors(newSectors);
  }

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-emerald-600 font-medium">Carregando sistema...</div>;

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard currentSector={currentSector} sectors={sectors} />;
      case 'members': return <Members currentSector={currentSector} sectors={sectors} />;
      case 'disciplines': return <Disciplines currentSector={currentSector} sectors={sectors} />;
      case 'settings': return <Settings sectors={sectors} onUpdateSectors={handleUpdateSectors} currentUserEmail={userEmail} />;
      default: return <Dashboard currentSector={currentSector} sectors={sectors} />;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      userEmail={userEmail}
      currentSector={currentSector}
      setCurrentSector={setCurrentSector}
      sectors={sectors}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;