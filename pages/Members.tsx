import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  User, 
  Check, 
  X,
  Camera,
  AlertTriangle,
  MapPin,
  Printer,
  Eye,
  Calendar,
  Phone,
  Mail,
  Home,
  Droplets,
  Loader2,
  CheckSquare,
  Square
} from 'lucide-react';
import { Member, Role, Sector } from '../types';
import * as storage from '../services/storage';

interface MembersProps {
  currentSector: string;
  sectors: Sector[];
}

const Members: React.FC<MembersProps> = ({ currentSector, sectors }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Form State
  const [formData, setFormData] = useState<Partial<Member>>({
    role: Role.MEMBER,
    isTither: false,
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector
  });

  // Helper to get Sector Name
  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  // Helper to format Date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Update default form sector if global sector changes
  useEffect(() => {
    if (!isModalOpen && !editingMember) {
      setFormData(prev => ({
        ...prev,
        sector: currentSector === 'ALL' ? 'SEDE' : currentSector
      }));
    }
  }, [currentSector, isModalOpen, editingMember]);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    const data = await storage.getMembers();
    setMembers(data);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    setFormData(member);
    setIsModalOpen(true);
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent clicks from bubbling up
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      // Optimistic update for instant feedback
      setMembers(prev => prev.filter(m => m.id !== deleteId));
      await storage.deleteMember(deleteId);
      setDeleteId(null);
      // Reload to ensure sync
      loadMembers();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email) {
      alert('Preencha os campos obrigatórios');
      return;
    }

    setIsSaving(true);

    const memberToSave: Member = {
      id: editingMember ? editingMember.id : crypto.randomUUID(),
      fullName: formData.fullName!,
      birthDate: formData.birthDate || '',
      phone: formData.phone || '',
      email: formData.email!,
      address: formData.address || '',
      baptismDate: formData.baptismDate,
      role: formData.role || Role.MEMBER,
      isTither: formData.isTither || false,
      sector: formData.sector || 'SEDE', 
      photoUrl: formData.photoUrl,
      createdAt: editingMember ? editingMember.createdAt : new Date().toISOString()
    };

    try {
        await storage.saveMember(memberToSave);
        setIsModalOpen(false);
        setEditingMember(null);
        setFormData({ 
          role: Role.MEMBER, 
          isTither: false,
          sector: currentSector === 'ALL' ? 'SEDE' : currentSector
        });
        loadMembers();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar membro. Verifique sua conexão ou contate o suporte.");
    } finally {
        setIsSaving(false);
    }
  };

  // Selection Logic
  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === displayedMembers.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(displayedMembers.map(m => m.id)));
    }
  };

  const handlePrint = () => {
    if (isSelectionMode && selectedIds.size === 0) {
        alert("Selecione pelo menos um membro para imprimir.");
        return;
    }
    window.print();
  };

  // Filter based on Sector AND Search
  const filteredMembers = members
    .filter(m => currentSector === 'ALL' || m.sector === currentSector)
    .filter(m => {
        const term = searchTerm.toLowerCase();
        if (!term) return true;
        
        // Include "dizimista" string in search check if member is a tither
        const titherString = m.isTither ? 'dizimista' : '';
        
        return (
            m.fullName.toLowerCase().includes(term) ||
            m.role.toLowerCase().includes(term) ||
            m.email.toLowerCase().includes(term) ||
            titherString.includes(term)
        );
    });

  // Mantém todos na tela, filtra apenas via CSS na impressão
  const displayedMembers = filteredMembers;

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Lista de Membros - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Cadastro de Membros</h2>
          <p className="text-sm text-slate-500 mt-1">
             Visualizando: <span className="font-semibold text-emerald-600">{currentSector === 'ALL' ? 'Todos os Setores' : getSectorName(currentSector)}</span>
          </p>
        </div>
        <div className="flex gap-2 no-print">
            {isSelectionMode ? (
                <>
                    <button 
                        onClick={() => {
                            setIsSelectionMode(false);
                            setSelectedIds(new Set());
                        }}
                        className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Selecionados ({selectedIds.size})
                    </button>
                </>
            ) : (
                <button 
                    onClick={() => setIsSelectionMode(true)}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors"
                >
                    <CheckSquare className="w-4 h-4" />
                    Selecionar para Imprimir
                </button>
            )}
            
            {!isSelectionMode && (
                <button 
                onClick={() => {
                    setEditingMember(null);
                    setFormData({ 
                    role: Role.MEMBER, 
                    isTither: false,
                    sector: currentSector === 'ALL' ? 'SEDE' : currentSector
                    });
                    setIsModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                <Plus className="w-4 h-4" />
                Novo Membro
                </button>
            )}
        </div>
      </div>

      {/* Search Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print flex items-center gap-4">
        {isSelectionMode && (
            <button 
                onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
            >
                {selectedIds.size === displayedMembers.length && displayedMembers.length > 0 ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                )}
                Selecionar Todos
            </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar por nome, cargo ou 'dizimista'..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Members List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedMembers.map((member) => (
          <div key={member.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow break-inside-avoid ${isSelectionMode && selectedIds.has(member.id) ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-100'} ${isSelectionMode && !selectedIds.has(member.id) ? 'print:hidden' : ''}`}>
            <div className="p-6 flex items-start gap-4 cursor-pointer" onClick={() => !isSelectionMode && setViewingMember(member)}>
              
              {isSelectionMode && (
                <div onClick={(e) => toggleSelection(e, member.id)} className="pt-1 no-print">
                    {selectedIds.has(member.id) ? (
                        <CheckSquare className="w-6 h-6 text-emerald-600" />
                    ) : (
                        <Square className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                    )}
                </div>
              )}

              <div className="flex-shrink-0">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt={member.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-100" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                    <User className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-800 truncate">{member.fullName}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="inline-block bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-medium">
                    {member.role}
                  </span>
                  {currentSector === 'ALL' && (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-medium">
                      <MapPin className="w-3 h-3" />
                      {getSectorName(member.sector)}
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-slate-500 space-y-1">
                  <p>{member.phone}</p>
                  <p className="truncate">{member.email}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center no-print">
              <div className="flex gap-2">
                 {member.isTither && (
                   <span className="text-xs text-amber-600 font-medium flex items-center gap-1" title="Dizimista">
                     <Check className="w-3 h-3" /> Dizimista
                   </span>
                 )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setViewingMember(member)}
                  className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Ver Detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleEdit(member)} 
                  className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => requestDelete(e, member.id)} 
                  className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* Show tither status for print only */}
            <div className="hidden print:block px-6 pb-2 text-xs text-gray-500">
                 {member.isTither ? 'Dizimista' : 'Não Dizimista'} | Batismo: {member.baptismDate ? formatDate(member.baptismDate) : '-'}
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Excluir Membro</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja remover este membro? Todos os dados associados serão perdidos.
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

      {/* View Details Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">Detalhes do Membro</h3>
              <button 
                onClick={() => setViewingMember(null)} 
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex flex-col items-center mb-8">
                 <div className="w-24 h-24 rounded-full border-4 border-emerald-100 overflow-hidden mb-4 shadow-sm">
                    {viewingMember.photoUrl ? (
                      <img src={viewingMember.photoUrl} alt={viewingMember.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                 </div>
                 <h2 className="text-2xl font-bold text-slate-800 text-center">{viewingMember.fullName}</h2>
                 <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium mt-2">
                    {viewingMember.role}
                 </span>
              </div>

              <div className="space-y-4">
                 {/* Contact Info */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contato e Endereço</h4>
                    <div className="flex items-center gap-3">
                       <Mail className="w-4 h-4 text-emerald-600" />
                       <span className="text-slate-700 text-sm">{viewingMember.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Phone className="w-4 h-4 text-emerald-600" />
                       <span className="text-slate-700 text-sm">{viewingMember.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <Home className="w-4 h-4 text-emerald-600" />
                       <span className="text-slate-700 text-sm">{viewingMember.address || 'Não informado'}</span>
                    </div>
                 </div>

                 {/* Church Info */}
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dados Eclesiásticos</h4>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> Congregação</p>
                          <p className="text-sm font-medium text-slate-800">{getSectorName(viewingMember.sector)}</p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Nascimento</p>
                          <p className="text-sm font-medium text-slate-800">{formatDate(viewingMember.birthDate)}</p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Droplets className="w-3 h-3" /> Batismo</p>
                          <p className="text-sm font-medium text-slate-800">{formatDate(viewingMember.baptismDate)}</p>
                       </div>
                       <div>
                          <p className="text-xs text-slate-500 mb-1 flex items-center gap-1"><Check className="w-3 h-3" /> Dizimista</p>
                          <p className={`text-sm font-medium ${viewingMember.isTither ? 'text-emerald-600' : 'text-slate-500'}`}>
                             {viewingMember.isTither ? 'Sim' : 'Não'}
                          </p>
                       </div>
                    </div>
                 </div>

                 <div className="text-center pt-2">
                    <p className="text-xs text-slate-400">
                       Cadastrado em {new Date(viewingMember.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                 </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setViewingMember(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 font-medium text-sm"
              >
                Fechar Detalhes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingMember ? 'Editar Membro' : 'Novo Membro'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              {/* Photo Upload */}
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-dashed border-slate-300">
                    {formData.photoUrl ? (
                       <img src={formData.photoUrl} className="w-full h-full object-cover" />
                    ) : (
                       <Camera className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    onChange={handleImageUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <p className="text-xs text-center mt-2 text-slate-500">Clique para foto</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome Completo *</label>
                  <input required type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.fullName || ''} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Setor / Localização *</label>
                  <select 
                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                    value={formData.sector} 
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                  >
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email *</label>
                  <input required type="email" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <input type="tel" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data de Nascimento</label>
                  <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.birthDate || ''} onChange={e => setFormData({...formData, birthDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Cargo</label>
                  <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as Role})}>
                    {Object.values(Role).map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data Batismo</label>
                  <input type="date" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.baptismDate || ''} onChange={e => setFormData({...formData, baptismDate: e.target.value})} />
                </div>
                <div className="col-span-full space-y-2">
                  <label className="text-sm font-medium text-slate-700">Endereço</label>
                  <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-emerald-500" 
                    value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="col-span-full flex items-center gap-2">
                  <input type="checkbox" id="tither" className="w-4 h-4 text-emerald-600 rounded"
                    checked={formData.isTither || false} onChange={e => setFormData({...formData, isTither: e.target.checked})} />
                  <label htmlFor="tither" className="text-sm font-medium text-slate-700">Membro é dizimista ativo?</label>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-slate-400 flex items-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSaving ? 'Salvando...' : 'Salvar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;