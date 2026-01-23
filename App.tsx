import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Settings from './pages/Settings';
import Disciplines from './pages/Disciplines';
import Assets from './pages/Assets';
import Works from './pages/Works';
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
        try {
            // Check session
            const session = await storage.getCurrentSession();
            if (session && session.user) {
              setUserEmail(session.user.email || '');
              setIsAuthenticated(true);
            }

            // Seed if necessary (checks empty tables)
            await storage.seedDatabase();
            
            // Load sectors
            const loadedSectors = await storage.getSectors();
            setSectors(loadedSectors);
        } catch (error) {
            console.error("Erro na inicialização:", error);
        } finally {
            setLoading(false);
        }
    }
    init();
  }, [isAuthenticated]);

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

  if (loading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-3">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-emerald-700 font-medium animate-pulse">Iniciando sistema...</p>
          </div>
      );
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard currentSector={currentSector} sectors={sectors} />;
      case 'members': return <Members currentSector={currentSector} sectors={sectors} />;
      case 'disciplines': return <Disciplines currentSector={currentSector} sectors={sectors} />;
      case 'assets': return <Assets currentSector={currentSector} sectors={sectors} />;
      case 'works': return <Works currentSector={currentSector} sectors={sectors} />;
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