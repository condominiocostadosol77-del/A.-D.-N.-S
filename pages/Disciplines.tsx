import React, { useState, useEffect, useRef } from 'react';
import { 
  Gavel, 
  Plus, 
  Search, 
  Trash2, 
  AlertTriangle,
  Calendar,
  User,
  CheckCircle2,
  X,
  Printer,
  ChevronDown,
  Loader2,
  Edit2
} from 'lucide-react';
import { Member, Sector, Discipline } from '../types';
import * as storage from '../services/storage';

interface DisciplinesProps {
  currentSector: string;
  sectors: Sector[];
}

const Disciplines: React.FC<DisciplinesProps> = ({ currentSector, sectors }) => {
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for Edit/Delete
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Discipline>>({
    startDate: new Date().toISOString().split('T')[0],
  });

  // Smart Search States for Modal
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [showMemberSuggestions, setShowMemberSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  useEffect(() => {
    loadData();
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMemberSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    const [loadedDisciplines, loadedMembers] = await Promise.all([
      storage.getDisciplines(),
      storage.getMembers()
    ]);
    setDisciplines(loadedDisciplines.sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
    setMembers(loadedMembers);
  };

  const handleEdit = (d: Discipline) => {
    const member = members.find(m => m.id === d.memberId);
    setFormData(d);
    setEditingId(d.id);
    if (member) {
      setMemberSearchQuery(member.fullName);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.memberId || !formData.reason || !formData.startDate || !formData.endDate) {
      alert('Preencha todos os campos obrigatórios e selecione um membro válido.');
      return;
    }

    setIsSaving(true);

    const selectedMember = members.find(m => m.id === formData.memberId);

    const newDiscipline: Discipline = {
      id: editingId ? editingId : crypto.randomUUID(),
      memberId: formData.memberId,
      reason: formData.reason,
      startDate: formData.startDate,
      endDate: formData.endDate,
      sector: selectedMember ? selectedMember.sector : 'SEDE',
      createdAt: editingId && formData.createdAt ? formData.createdAt : new Date().toISOString()
    };

    try {
        await storage.saveDiscipline(newDiscipline);
        closeModal();
        loadData();
    } catch (error) {
        console.error(error);
        alert("Erro ao registrar disciplina. Verifique sua conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ startDate: new Date().toISOString().split('T')[0] });
    setMemberSearchQuery('');
    setShowMemberSuggestions(false);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setDisciplines(prev => prev.filter(d => d.id !== deleteId));
      await storage.deleteDiscipline(deleteId);
      setDeleteId(null);
      loadData();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const isDisciplineActive = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    // Reset time for fair comparison
    now.setHours(0,0,0,0);
    return end >= now;
  };

  // Filter based on Sector AND Search (Main List)
  const filteredDisciplines = disciplines
    .filter(d => currentSector === 'ALL' || d.sector === currentSector)
    .filter(d => {
      const member = members.find(m => m.id === d.memberId);
      const memberName = member ? member.fullName.toLowerCase() : '';
      const term = searchTerm.toLowerCase();
      
      return (
        memberName.includes(term) ||
        d.reason.toLowerCase().includes(term)
      );
    });

  // Filter members for the modal dropdown
  const availableMembers = members.filter(m => currentSector === 'ALL' || m.sector === currentSector);
  
  const filteredModalMembers = availableMembers.filter(m => 
    m.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase())
  );

  const handleSelectMember = (member: Member) => {
    setFormData({ ...formData, memberId: member.id });
    setMemberSearchQuery(member.fullName);
    setShowMemberSuggestions(false);
  };

  return (
    <div className="space-y-6">
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório Disciplinar - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gavel className="w-6 h-6 text-emerald-700" />
            Disciplina Eclesiástica
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Visualizando: <span className="font-semibold text-emerald-600">{currentSector === 'ALL' ? 'Todos os Setores' : getSectorName(currentSector)}</span>
          </p>
        </div>
        <div className="flex gap-2 no-print">
            <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4" />
                Imprimir / PDF
            </button>
            <button 
            onClick={() => {
                closeModal();
                setIsModalOpen(true);
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
            <Plus className="w-4 h-4" />
            Nova Disciplina
            </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome do membro ou motivo..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Membro</th>
                {currentSector === 'ALL' && <th className="px-6 py-3">Setor</th>}
                <th className="px-6 py-3">Motivo</th>
                <th className="px-6 py-3">Período</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDisciplines.length > 0 ? (
                filteredDisciplines.map((d) => {
                  const member = members.find(m => m.id === d.memberId);
                  const isActive = isDisciplineActive(d.endDate);
                  
                  return (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="font-medium text-slate-800">
                            {member ? member.fullName : 'Membro Excluído'}
                          </div>
                        </div>
                      </td>
                      {currentSector === 'ALL' && (
                        <td className="px-6 py-3">
                           <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                             {getSectorName(d.sector)}
                           </span>
                        </td>
                      )}
                      <td className="px-6 py-3 max-w-xs truncate" title={d.reason}>
                        {d.reason}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col text-xs">
                           <span className="flex items-center gap-1">Início: <span className="font-medium">{formatDate(d.startDate)}</span></span>
                           <span className="flex items-center gap-1">Fim: <span className="font-medium">{formatDate(d.endDate)}</span></span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle className="w-3 h-3" /> Em Disciplina
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> Concluído
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right no-print">
                         <div className="flex items-center justify-end gap-1">
                             <button 
                                onClick={() => handleEdit(d)}
                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                                title="Editar Disciplina"
                             >
                               <Edit2 className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => setDeleteId(d.id)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Remover Registro"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={currentSector === 'ALL' ? 6 : 5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-8 h-8 opacity-20 text-emerald-500" />
                      <p>Nenhum membro em disciplina encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Excluir Registro</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja apagar este histórico de disciplina?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-sm"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="relative" ref={dropdownRef}>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Membro</label>
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none ${!formData.memberId ? 'border-slate-300' : 'border-emerald-500 bg-emerald-50'}`}
                      placeholder="Digite o nome do membro..."
                      value={memberSearchQuery}
                      onChange={(e) => {
                        setMemberSearchQuery(e.target.value);
                        setFormData({ ...formData, memberId: '' }); 
                        setShowMemberSuggestions(true);
                      }}
                      onFocus={() => setShowMemberSuggestions(true)}
                    />
                    {formData.memberId && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                 </div>
                 
                 {showMemberSuggestions && (
                   <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                     {filteredModalMembers.length > 0 ? (
                       <ul>
                         {filteredModalMembers.map(member => (
                           <li 
                             key={member.id}
                             className="px-4 py-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                             onClick={() => handleSelectMember(member)}
                           >
                             <div>
                               <p className="text-sm font-medium text-slate-700">{member.fullName}</p>
                               <p className="text-xs text-slate-500">{getSectorName(member.sector)}</p>
                             </div>
                             {member.id === formData.memberId && (
                               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                             )}
                           </li>
                         ))}
                       </ul>
                     ) : (
                       <div className="p-4 text-center text-sm text-slate-500">
                         Nenhum membro encontrado.
                       </div>
                     )}
                   </div>
                 )}
                 {formData.memberId && !showMemberSuggestions && (
                   <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                     <CheckCircle2 className="w-3 h-3" /> Membro selecionado
                   </p>
                 )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Motivo</label>
                <textarea 
                  required 
                  className="w-full p-2 border rounded-lg focus:ring-emerald-500 min-h-[80px]"
                  placeholder="Descreva o motivo da disciplina..."
                  value={formData.reason || ''} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    value={formData.startDate || ''} 
                    onChange={e => setFormData({...formData, startDate: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data Término</label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    value={formData.endDate || ''} 
                    onChange={e => setFormData({...formData, endDate: e.target.value})} 
                  />
                </div>
              </div>
              
              <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
                 <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
                 <p>O membro ficará marcado como "Em Disciplina" até a data de término informada.</p>
              </div>

              <button 
                type="submit" 
                disabled={isSaving}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium shadow-sm transition-colors mt-4 flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSaving ? 'Salvando...' : (editingId ? 'Atualizar Disciplina' : 'Registrar Disciplina')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disciplines;