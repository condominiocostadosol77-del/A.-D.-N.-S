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
  Edit2,
  CheckSquare,
  Square,
  FileText,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { Member, Sector, Discipline } from '../types';
import * as storage from '../services/storage';
import { GoogleGenAI } from "@google/genai";

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
  const [isCorrecting, setIsCorrecting] = useState(false);
  
  // State for Edit/Delete
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection Mode
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Minute Mode State
  const [isMinuteMode, setIsMinuteMode] = useState(false);

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

  const handleCorrectSpelling = async (field: 'reason', value: string) => {
      if (!value) return;
      setIsCorrecting(true);
      try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (!apiKey) {
              alert("Chave de API não configurada");
              return;
          }
          
          const ai = new GoogleGenAI({ apiKey });
          const model = ai.models.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          const prompt = `Corrija a ortografia e gramática do seguinte texto, mantendo o sentido original: "${value}"`;
          
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          
          setFormData(prev => ({ ...prev, [field]: text.trim() }));
      } catch (error) {
          console.error("Erro na correção:", error);
          alert("Erro ao corrigir texto.");
      } finally {
          setIsCorrecting(false);
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

  // Selection Logic
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === displayedDisciplines.length) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(displayedDisciplines.map(d => d.id)));
    }
  };

  const handlePrint = () => {
    if (isSelectionMode && selectedIds.size === 0) {
        alert("Selecione pelo menos um registro para imprimir.");
        return;
    }
    window.print();
  };

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

  const displayedDisciplines = filteredDisciplines;
  const itemsForMinute = isSelectionMode && selectedIds.size > 0 
      ? displayedDisciplines.filter(d => selectedIds.has(d.id))
      : displayedDisciplines;

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

  const getLongDate = () => {
    return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Print Header for Reports */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório de Disciplina Eclesiástica - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gavel className="w-6 h-6 text-emerald-700" />
            Disciplina Eclesiástica
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Visualizando: <span className="font-semibold text-emerald-600">{currentSector === 'ALL' ? 'Todos os Setores' : getSectorName(currentSector)}</span>
          </p>
        </div>
        <div className="flex gap-2">
            {isMinuteMode ? (
                <button 
                    onClick={() => setIsMinuteMode(false)}
                    className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                </button>
            ) : (
                <>
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
                            className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2"
                        >
                            <Printer className="w-4 h-4" /> Imprimir ({selectedIds.size})
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={() => setIsSelectionMode(true)}
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <CheckSquare className="w-4 h-4" />
                        Selecionar
                    </button>
                )}
                
                {!isSelectionMode && (
                    <button 
                        onClick={() => window.print()} 
                        className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir Relatório
                    </button>
                )}
                
                <button 
                    onClick={() => setIsMinuteMode(true)}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
                >
                    <FileText className="w-4 h-4" />
                    Gerar Ata de Conselho
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
                </>
            )}

            {isMinuteMode && (
                <button 
                    onClick={() => window.print()} 
                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    Imprimir Ata
                </button>
            )}
        </div>
      </div>

      {/* MINUTE VIEW (ATA) */}
      {isMinuteMode ? (
         <div className="bg-white shadow-lg mx-auto p-12 md:p-16 max-w-[210mm] min-h-[297mm] text-justify relative animate-fade-in print:shadow-none print:w-full print:m-0">
             <div className="text-center mb-10">
                <h1 className="text-xl font-bold font-serif uppercase tracking-widest text-slate-900 mb-2">
                   A. D. NATIVIDADE DA SERRA
                </h1>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                   Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra
                </p>
                <p className="text-sm font-medium text-slate-500 mt-1 uppercase">
                   {currentSector === 'ALL' ? 'CONSELHO DE ÉTICA E DISCIPLINA GERAL' : getSectorName(currentSector)}
                </p>
                <div className="w-24 h-1 bg-slate-800 mx-auto mt-4 mb-2"></div>
                <h2 className="text-lg font-bold uppercase underline mt-6">
                   ATA DE REUNIÃO DE CONSELHO DISCIPLINAR
                </h2>
             </div>

             <div className="font-serif leading-loose text-slate-800 space-y-6">
                <p>
                    Aos <span className="font-bold">{getLongDate()}</span>, reuniu-se o Conselho de Ética e Disciplina Eclesiástica da Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra, 
                    sob a presidência do Pastor Local e com a presença dos obreiros auxiliares, para deliberar sobre assuntos referentes à conduta e comunhão dos membros desta congregação.
                </p>
                
                <p>
                    Considerando os princípios bíblicos e o regimento interno desta instituição, ficam registrados os seguintes casos disciplinares, 
                    tendo sido oferecida a oportunidade de esclarecimento e orientação pastoral aos envolvidos:
                </p>

                <div className="my-8">
                    {itemsForMinute.map((d, index) => {
                         const member = members.find(m => m.id === d.memberId);
                         return (
                            <div key={d.id} className="mb-6 p-4 border border-slate-300 rounded bg-slate-50 print:border-slate-800 print:bg-transparent">
                                <p className="mb-2"><span className="font-bold">{index + 1}. Membro:</span> <span className="uppercase">{member?.fullName || 'Desconhecido'}</span></p>
                                <p className="mb-2 text-justify"><span className="font-bold">Motivo/Fundamentação:</span> {d.reason}</p>
                                <p><span className="font-bold">Período de Disciplina:</span> De {formatDate(d.startDate)} até {formatDate(d.endDate)}.</p>
                                <p className="text-xs italic mt-2">Status atual: {isDisciplineActive(d.endDate) ? 'Em curso' : 'Cumprida'}</p>
                            </div>
                         );
                    })}
                </div>

                <p>
                    Fica estabelecido que, durante o período mencionado, os membros acima citados estarão suspensos de suas funções eclesiásticas e da comunhão (Santa Ceia), 
                    devendo manter a frequência aos cultos e submissão à liderança para restauração espiritual.
                </p>

                <p>
                    Nada mais havendo a tratar, encerra-se a presente ata, que vai assinada por mim, secretário(a), pelo Pastor e demais membros do conselho presentes.
                </p>

                <div className="mt-20 grid grid-cols-2 gap-16 text-center text-sm font-sans">
                   <div>
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">Pastor</div>
                   </div>
                   <div>
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">Secretário(a) do Conselho</div>
                   </div>
                   <div className="col-span-2 w-1/2 mx-auto mt-4">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">Testemunha / Obreiro</div>
                   </div>
                </div>
             </div>
         </div>
      ) : (
      <>
        {/* NORMAL VIEW (TABLE) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print flex items-center gap-3">
            {isSelectionMode && (
                <button 
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                    {selectedIds.size === displayedDisciplines.length && displayedDisciplines.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                    )}
                    Todos
                </button>
            )}
            <div className="relative flex-1">
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
                    {isSelectionMode && <th className="px-6 py-3 w-10 no-print">#</th>}
                    <th className="px-6 py-3">Membro</th>
                    {currentSector === 'ALL' && <th className="px-6 py-3">Setor</th>}
                    <th className="px-6 py-3">Motivo</th>
                    <th className="px-6 py-3">Período</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right no-print">Ações</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {itemsForMinute.length > 0 ? (
                    itemsForMinute.map((d) => {
                    const member = members.find(m => m.id === d.memberId);
                    const isActive = isDisciplineActive(d.endDate);
                    
                    return (
                        <tr key={d.id} className={`hover:bg-slate-50 ${isSelectionMode && selectedIds.has(d.id) ? 'bg-emerald-50' : ''}`}>
                        {isSelectionMode && (
                            <td className="px-6 py-3 no-print">
                                <button onClick={() => toggleSelection(d.id)}>
                                    {selectedIds.has(d.id) ? (
                                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                        <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                                    )}
                                </button>
                            </td>
                        )}
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
                    <td colSpan={isSelectionMode ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
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
      </>
      )}

      {/* Modals unchanged */}
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
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">Motivo</label>
                    <button 
                        type="button"
                        onClick={() => handleCorrectSpelling('reason', formData.reason || '')}
                        disabled={isCorrecting || !formData.reason}
                        className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
                    >
                        <Sparkles className="w-3 h-3" />
                        {isCorrecting ? 'Corrigindo...' : 'Corrigir Ortografia'}
                    </button>
                </div>
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