import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Members from './pages/Members';
import Financials from './pages/Financials';
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
        // Check local session
        const storedUser = localStorage.getItem('ecclesia_user');
        if (storedUser) {
          setUserEmail(storedUser);
          setIsAuthenticated(true);
        }
        // Seed data if first run
        storage.seedDatabase();
        
        // Load sectors
        const loadedSectors = await storage.getSectors();
        setSectors(loadedSectors);
        
        setLoading(false);
    }
    init();
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem('ecclesia_user', email);
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('ecclesia_user');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  const handleUpdateSectors = (newSectors: Sector[]) => {
      setSectors(newSectors);
  }

  if (loading) return null;

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard currentSector={currentSector} sectors={sectors} />;
      case 'members': return <Members currentSector={currentSector} sectors={sectors} />;
      case 'disciplines': return <Disciplines currentSector={currentSector} sectors={sectors} />;
      case 'financial': return <Financials currentSector={currentSector} sectors={sectors} />;
      case 'settings': return <Settings sectors={sectors} onUpdateSectors={handleUpdateSectors} />;
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