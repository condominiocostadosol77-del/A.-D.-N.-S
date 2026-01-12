import React, { useState, useEffect } from 'react';
import { Sector, User } from '../types';
import * as storage from '../services/storage';
import { Save, Plus, Trash2, MapPin, Settings as SettingsIcon, CheckCircle, AlertCircle, Users, Shield, AlertTriangle } from 'lucide-react';

interface SettingsProps {
  sectors: Sector[];
  onUpdateSectors: (newSectors: Sector[]) => void;
  currentUserEmail: string;
}

const Settings: React.FC<SettingsProps> = ({ sectors, onUpdateSectors, currentUserEmail }) => {
  const [localSectors, setLocalSectors] = useState<Sector[]>([]);
  const [newSectorName, setNewSectorName] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [statusMessage, setStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  // Initialize local state
  useEffect(() => {
    loadData();
  }, [sectors]);

  const loadData = async () => {
    if (sectors.length > 0) {
        setLocalSectors(JSON.parse(JSON.stringify(sectors)));
    }
    const loadedUsers = await storage.getUsers();
    setUsers(loadedUsers);
  };

  const handleNameChange = (id: string, newName: string) => {
    setLocalSectors(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleAddSector = () => {
    if (!newSectorName.trim()) return;
    
    // Generate a simple ID
    const newId = `SETOR_${Date.now()}`;
    const newSector: Sector = { id: newId, name: newSectorName };
    
    setLocalSectors(prev => [...prev, newSector]);
    setNewSectorName('');
  };

  const handleDeleteSector = (id: string) => {
    if (id === 'SEDE') {
      setStatusMessage({ type: 'error', text: 'A Sede Principal não pode ser excluída.' });
      setTimeout(() => setStatusMessage(null), 3000);
      return;
    }
    setLocalSectors(prev => prev.filter(s => s.id !== id));
  };

  const initiateDeleteUser = (email: string) => {
     if (email === currentUserEmail) {
        setStatusMessage({ type: 'error', text: 'Você não pode excluir seu próprio usuário.' });
        setTimeout(() => setStatusMessage(null), 3000);
        return;
     }
     setUserToDelete(email);
  };

  const confirmDeleteUser = async () => {
     if (!userToDelete) return;

     try {
        await storage.deleteUser(userToDelete);
        setUsers(prev => prev.filter(u => u.email !== userToDelete));
        setStatusMessage({ type: 'success', text: 'Administrador removido com sucesso.' });
     } catch (error) {
        setStatusMessage({ type: 'error', text: 'Erro ao remover administrador.' });
     } finally {
        setUserToDelete(null);
        setTimeout(() => setStatusMessage(null), 3000);
     }
  };

  const handleSave = async () => {
    try {
      await storage.saveSectors(localSectors);
      onUpdateSectors(localSectors);
      
      // Show success message
      setStatusMessage({ type: 'success', text: 'Alterações salvas e sistema atualizado com sucesso!' });
      
      // Scroll to top to see message
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Hide message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      setStatusMessage({ type: 'error', text: 'Ocorreu um erro ao salvar.' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-10">
      <div>
        <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-200 rounded-full">
                <SettingsIcon className="w-6 h-6 text-slate-700" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
                <p className="text-slate-500">Gerencie as filiais e administradores da igreja.</p>
            </div>
        </div>
      </div>

      {/* Status Message Banner */}
      {statusMessage && (
        <div className={`p-4 rounded-lg flex items-center gap-3 animate-fade-in ${
          statusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* Sectors Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Gerenciar Setores e Congregações
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Adicione ou remova congregações. Lembre-se de clicar em <strong>Salvar Alterações</strong> para confirmar.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* List of existing sectors */}
          <div className="space-y-4">
            {localSectors.map((sector) => (
              <div key={sector.id} className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="w-32 text-xs text-slate-400 font-mono hidden sm:block pl-2">
                   {sector.id === 'SEDE' ? 'PRINCIPAL' : 'FILIAL'}
                </div>
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={sector.name}
                    onChange={(e) => handleNameChange(sector.id, e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Nome do Setor"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => handleDeleteSector(sector.id)}
                  disabled={sector.id === 'SEDE'}
                  className={`p-2 rounded-lg transition-colors ${sector.id === 'SEDE' ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 shadow-sm'}`}
                  title={sector.id === 'SEDE' ? 'A Sede não pode ser removida' : 'Remover Setor'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Sector */}
          <div className="pt-6 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Adicionar Nova Congregação</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newSectorName}
                onChange={(e) => setNewSectorName(e.target.value)}
                placeholder="Ex: Congregação Vale da Bênção"
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddSector()}
              />
              <button 
                type="button"
                onClick={handleAddSector}
                disabled={!newSectorName.trim()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-5 h-5" />
                Adicionar
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-500 italic">
               Total de setores: {localSectors.length}
            </p>
            <button 
                type="button"
                onClick={handleSave}
                className="px-6 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium transform hover:-translate-y-0.5"
            >
                <Save className="w-4 h-4" />
                Salvar Alterações
            </button>
        </div>
      </div>

      {/* Admin Management */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-600" />
            Gerenciar Administradores
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            Contas com acesso administrativo ao sistema.
          </p>
        </div>
        <div className="p-6">
            <div className="space-y-3">
                {users.map((user) => (
                    <div key={user.email} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-200 p-2 rounded-full">
                                <Users className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                                <p className="font-medium text-slate-800">{user.name}</p>
                                <p className="text-xs text-slate-500">{user.email}</p>
                            </div>
                        </div>
                        {user.email !== currentUserEmail ? (
                            <button 
                                type="button"
                                onClick={() => initiateDeleteUser(user.email)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Remover acesso deste administrador"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        ) : (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                Você
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Remover Admin</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja remover este administrador? Ele perderá o acesso ao sistema imediatamente.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={confirmDeleteUser}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
              >
                Sim, Remover
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;