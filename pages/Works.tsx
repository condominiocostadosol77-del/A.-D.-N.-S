import React, { useState, useEffect } from 'react';
import { 
  Hammer, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Calendar,
  AlertTriangle,
  MapPin,
  X,
  FileText,
  DollarSign,
  Clock,
  Loader2,
  Paperclip,
  Edit2,
  CheckSquare,
  Square,
  Image as ImageIcon,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { WorkProject, Sector, WorkStatus, WorkCategory } from '../types';
import * as storage from '../services/storage';
import { GoogleGenAI } from "@google/genai";

interface WorksProps {
  currentSector: string;
  sectors: Sector[];
}

const Works: React.FC<WorksProps> = ({ currentSector, sectors }) => {
  const [works, setWorks] = useState<WorkProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Minute Mode State
  const [isMinuteMode, setIsMinuteMode] = useState(false);

  const [formData, setFormData] = useState<Partial<WorkProject>>({
    status: WorkStatus.PLANNING,
    category: WorkCategory.MATERIAL_PURCHASE,
    startDate: new Date().toISOString().split('T')[0],
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
    totalCost: 0,
    receiptUrls: []
  });

  useEffect(() => {
    loadWorks();
  }, []);

  const loadWorks = async () => {
    const data = await storage.getWorks();
    setWorks(data);
  };

  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  const handleEdit = (work: WorkProject) => {
    setEditingId(work.id);
    // Compatibilidade: se tiver receiptUrl antigo e não tiver lista, cria lista
    const images = work.receiptUrls || (work.receiptUrl ? [work.receiptUrl] : []);
    setFormData({ ...work, receiptUrls: images });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
        status: WorkStatus.PLANNING,
        category: WorkCategory.MATERIAL_PURCHASE,
        startDate: new Date().toISOString().split('T')[0],
        sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
        totalCost: 0,
        title: '',
        description: '',
        responsible: '',
        receiptUrl: undefined,
        receiptUrls: [],
        endDate: undefined
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({ 
                ...prev, 
                receiptUrls: [...(prev.receiptUrls || []), reader.result as string] 
            }));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
      setFormData(prev => ({
          ...prev,
          receiptUrls: prev.receiptUrls?.filter((_, i) => i !== index)
      }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Informe o título da obra ou compra.');
      return;
    }

    setIsSaving(true);

    const newWork: WorkProject = {
      id: editingId ? editingId : crypto.randomUUID(),
      title: formData.title!,
      description: formData.description || '',
      startDate: formData.startDate!,
      endDate: formData.endDate,
      status: formData.status || WorkStatus.PLANNING,
      category: formData.category || WorkCategory.MATERIAL_PURCHASE,
      totalCost: Number(formData.totalCost) || 0,
      sector: formData.sector || 'SEDE',
      responsible: formData.responsible,
      receiptUrl: formData.receiptUrls?.[0], // Legado: salva a primeira imagem no campo antigo
      receiptUrls: formData.receiptUrls || [], // Novo: salva todas
      createdAt: editingId && formData.createdAt ? formData.createdAt : new Date().toISOString()
    };

    try {
        await storage.saveWork(newWork);
        closeModal();
        loadWorks();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar registro. Verifique sua conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCorrectSpelling = async (field: 'description', value: string) => {
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

  const confirmDelete = async () => {
    if (deleteId) {
      setWorks(prev => prev.filter(w => w.id !== deleteId));
      await storage.deleteWork(deleteId);
      setDeleteId(null);
    }
  };

  // Selection Logic
  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedIds);
      if (newSet.has(id)) {
          newSet.delete(id);
      } else {
          newSet.add(id);
      }
      setSelectedIds(newSet);
  };

  const toggleAll = () => {
      if (selectedIds.size === displayedWorks.length) {
          setSelectedIds(new Set());
      } else {
          setSelectedIds(new Set(displayedWorks.map(w => w.id)));
      }
  };

  const handlePrint = () => {
    if (isSelectionMode && selectedIds.size === 0) {
        alert("Selecione pelo menos um registro para imprimir.");
        return;
    }
    window.print();
  };

  const filteredWorks = works
    .filter(w => currentSector === 'ALL' || w.sector === currentSector)
    .filter(w => w.title.toLowerCase().includes(searchTerm.toLowerCase()));

  // Items to display (or print in minute/report)
  const displayedWorks = filteredWorks;
  
  // Logic updated: worksToRender determines what is shown in the list.
  // If selection mode is ON and items are selected, show only those.
  // Otherwise show all filtered items.
  const worksToRender = isSelectionMode && selectedIds.size > 0 
      ? displayedWorks.filter(w => selectedIds.has(w.id))
      : displayedWorks;

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.PLANNING: return 'bg-blue-100 text-blue-700';
      case WorkStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700';
      case WorkStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700';
      case WorkStatus.PAUSED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getLongDate = () => {
    return new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      
      {/* Print Header for Report (Not Minute) */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório de Obras e Compras - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-amber-600" />
            Obras, Reformas e Compras
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Controle de projetos e aquisição de materiais de construção.
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
                    Gerar Ata de Reunião
                </button>
                
                <button 
                    onClick={() => {
                        closeModal();
                        setIsModalOpen(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Novo Lançamento
                </button>
                </>
            )}
            
            {isMinuteMode && (
                <button 
                    onClick={() => window.print()}
                    className="bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-900 transition-colors shadow-sm"
                >
                    <Printer className="w-4 h-4" />
                    Imprimir Ata
                </button>
            )}
        </div>
      </div>

      {/* MINUTE VIEW (ATA) */}
      {isMinuteMode ? (
          <div className="bg-white shadow-lg mx-auto p-12 md:p-16 print:p-8 max-w-[210mm] w-full min-h-[297mm] text-justify relative animate-fade-in print:shadow-none print:m-0 print:border-none">
             <div className="text-center mb-8 print:mb-6">
                <h1 className="text-xl font-bold font-serif uppercase tracking-widest text-slate-900 mb-2">
                   A. D. NATIVIDADE DA SERRA
                </h1>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                   Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra
                </p>
                <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">
                   {currentSector === 'ALL' ? 'DIRETORIA GERAL' : getSectorName(currentSector)}
                </p>
                <div className="w-24 h-1 bg-slate-800 mx-auto mt-4 mb-2"></div>
                <h2 className="text-lg font-bold uppercase underline mt-6">
                   ATA DE REUNIÃO DE OBRAS E PATRIMÔNIO
                </h2>
             </div>

             <div className="font-serif leading-loose text-slate-800 space-y-6 print:text-sm print:leading-normal">
                <p>
                    Aos <span className="font-bold">{getLongDate()}</span>, reuniu-se a Diretoria e o Conselho de Obras da Igreja Evangélica Assembleia de Deus – Ministério Taubaté – Setor Natividade da Serra, 
                    sob a direção do Pastor e demais membros oficiais, para tratar de assuntos referentes ao andamento das obras, 
                    reformas e aquisição de materiais de construção e manutenção predial desta instituição.
                </p>
                
                <p>
                    Após a oração inicial e leitura da palavra de Deus, passou-se à apresentação dos relatórios de despesas e status dos projetos em andamento. 
                    Ficam registrados em ata os seguintes itens deliberados, conferidos e aprovados nesta reunião:
                </p>

                <div className="my-6">
                    {/* Tabela de Itens para Ata */}
                    <table className="w-full border-collapse border border-slate-800 text-sm print:text-xs table-fixed">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-600 px-2 py-1 text-left w-[15%]">Categoria</th>
                                <th className="border border-slate-600 px-2 py-1 text-left w-[55%]">Descrição / Detalhes</th>
                                <th className="border border-slate-600 px-2 py-1 text-center w-[15%]">Data</th>
                                <th className="border border-slate-600 px-2 py-1 text-right w-[15%]">Custo Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {worksToRender.map(work => (
                                <tr key={work.id} className="break-inside-avoid">
                                    <td className="border border-slate-600 px-2 py-1 font-bold align-top break-words">{work.category || WorkCategory.CONSTRUCTION}</td>
                                    <td className="border border-slate-600 px-2 py-1 align-top break-words">
                                        <span className="uppercase font-semibold block">{work.title}</span>
                                        <span className="block text-justify mt-1 text-slate-700 whitespace-pre-wrap break-words">{work.description}</span>
                                        {work.responsible && <span className="block text-xs italic mt-1 text-slate-500">Resp: {work.responsible}</span>}
                                    </td>
                                    <td className="border border-slate-600 px-2 py-1 text-center align-top">{new Date(work.startDate).toLocaleDateString('pt-BR')}</td>
                                    <td className="border border-slate-600 px-2 py-1 text-right align-top font-bold">R$ {work.totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                             <tr className="bg-slate-100 font-bold break-inside-avoid">
                                 <td colSpan={3} className="border border-slate-600 px-2 py-1 text-right">TOTAL APROVADO:</td>
                                 <td className="border border-slate-600 px-2 py-1 text-right">
                                     R$ {worksToRender.reduce((acc, curr) => acc + curr.totalCost, 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                 </td>
                             </tr>
                        </tfoot>
                    </table>
                </div>

                <p>
                    Os itens acima descritos (compras de materiais e serviços) foram devidamente conferidos mediante notas e recibos arquivados na tesouraria. 
                    As obras em andamento seguem o cronograma estipulado, e as concluídas foram vistoriadas pelo responsável.
                </p>

                <p>
                    Nada mais havendo a tratar, encerra-se a presente ata, que vai assinada por mim, secretário(a), pelo Pastor e demais membros da comissão de obras presentes.
                </p>

                <div className="mt-16 print:mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center text-sm font-sans break-inside-avoid">
                   <div className="order-1 md:order-2">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">Pastor</div>
                   </div>
                   <div className="order-2 md:order-1">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">1º Secretário(a)</div>
                   </div>
                   <div className="order-3 md:order-3">
                       <div className="border-t border-black pt-2 mb-1 uppercase font-bold">2º Secretário(a)</div>
                   </div>
                </div>
             </div>
          </div>
      ) : (
      <>
        {/* NORMAL VIEW (LIST) */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print flex gap-4 items-center print:hidden">
            {isSelectionMode && (
                <button 
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                    {selectedIds.size === displayedWorks.length && displayedWorks.length > 0 ? (
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
                placeholder="Buscar obra, material ou serviço..." 
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>
        </div>

        {/* Grid de Obras - Layout otimizado para impressão de Relatório (Tela Inicial) */}
        <div className="grid grid-cols-1 gap-6">
            {worksToRender.length > 0 ? (
            worksToRender.map((work) => {
                // Compatibilidade com legado
                const images = work.receiptUrls && work.receiptUrls.length > 0 
                    ? work.receiptUrls 
                    : (work.receiptUrl ? [work.receiptUrl] : []);
                
                return (
                <div 
                    key={work.id} 
                    className={`
                        bg-white rounded-xl shadow-sm border p-6 
                        flex flex-col md:flex-row gap-6 
                        hover:shadow-md transition-shadow 
                        ${isSelectionMode && selectedIds.has(work.id) ? 'border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50/10' : 'border-slate-100'}
                        break-inside-avoid page-break-inside-avoid
                    `}
                >
                    {isSelectionMode && (
                        <div className="no-print flex items-start pt-1">
                            <button onClick={() => toggleSelection(work.id)}>
                                {selectedIds.has(work.id) ? (
                                    <CheckSquare className="w-6 h-6 text-emerald-600" />
                                ) : (
                                    <Square className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                                )}
                            </button>
                        </div>
                    )}

                    <div className="flex-1 space-y-3 min-w-0">
                    <div className="flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
                                    {work.category || WorkCategory.CONSTRUCTION}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 break-words">{work.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide no-print ${getStatusColor(work.status)}`}>
                                    {work.status}
                                </span>
                                {/* Texto simples para impressão */}
                                <span className="hidden print:inline text-xs font-bold uppercase border border-slate-300 px-1 rounded">{work.status}</span>
                                
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <MapPin className="w-3 h-3" /> {getSectorName(work.sector)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap break-words max-w-full">
                        <strong className="block text-xs text-slate-400 uppercase mb-1">Descrição / Materiais</strong>
                        {work.description}
                    </div>

                    {images.length > 0 && (
                        <div className="mt-4 pt-2 border-t border-dashed border-slate-300">
                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase flex items-center gap-2">
                                <ImageIcon className="w-4 h-4" /> Anexos ({images.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {images.map((img, idx) => (
                                    <div key={idx} className="relative w-24 h-24 border border-slate-200 rounded bg-white">
                                        <img src={img} alt={`Anexo ${idx + 1}`} className="w-full h-full object-cover p-1" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>

                    <div className="md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                        <div>
                                <p className="text-xs text-slate-500 mb-1">Custo Total</p>
                                <p className="text-2xl font-bold text-slate-800">R$ {work.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4 text-amber-500" />
                                <span>Início: {new Date(work.startDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span>Fim: {work.endDate ? new Date(work.endDate).toLocaleDateString('pt-BR') : '...'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <FileText className="w-4 h-4 text-amber-500" />
                                <span className="truncate">Resp: {work.responsible || '-'}</span>
                            </div>
                        </div>

                        <div className="mt-auto pt-2 flex justify-end no-print gap-1">
                            <button 
                                onClick={() => handleEdit(work)}
                                className="text-slate-400 hover:text-emerald-600 text-sm flex items-center gap-1 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                            >
                                <Edit2 className="w-4 h-4" /> Editar
                            </button>
                            <button 
                                onClick={() => setDeleteId(work.id)} 
                                className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" /> Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )})
            ) : (
            <div className="bg-white p-12 rounded-xl text-center text-slate-400 border border-slate-100">
                <Hammer className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>Nenhuma obra, reforma ou compra encontrada.</p>
            </div>
            )}
        </div>
      </>
      )}

      {/* MODAL DE EXCLUSÃO */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Excluir Registro</h3>
                </div>
                <p className="text-slate-600 mb-6">Deseja realmente excluir este registro?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
               <button onClick={closeModal}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSave} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   
                   {/* Seleção de Categoria */}
                   <div className="col-span-2">
                       <label className="block text-sm font-medium text-slate-700 mb-1">Categoria do Registro</label>
                       <div className="flex flex-wrap gap-2">
                           {Object.values(WorkCategory).map(cat => (
                               <button
                                type="button"
                                key={cat}
                                onClick={() => setFormData({...formData, category: cat})}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${formData.category === cat ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                               >
                                   {cat}
                               </button>
                           ))}
                       </div>
                   </div>

                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Título / Item Principal</label>
                      <input required type="text" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        placeholder={formData.category === WorkCategory.MATERIAL_PURCHASE ? "Ex: Compra de Cimento e Areia" : "Ex: Reforma do Telhado"}
                        value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                       <select className="w-full p-2 border rounded-lg focus:ring-amber-500"
                         value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as WorkStatus})}>
                         {Object.values(WorkStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                   </div>
                   
                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                       <select className="w-full p-2 border rounded-lg focus:ring-amber-500"
                         value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})}>
                         {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Custo Total (Gasto)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input required type="number" step="0.01" className="w-full pl-9 p-2 border rounded-lg focus:ring-amber-500"
                            value={formData.totalCost || 0} onChange={e => setFormData({...formData, totalCost: Number(e.target.value)})} />
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Responsável / Comprador</label>
                       <input type="text" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        placeholder="Nome do encarregado"
                        value={formData.responsible || ''} onChange={e => setFormData({...formData, responsible: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Data Início / Compra</label>
                       <input type="date" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Data Conclusão</label>
                       <input type="date" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                   </div>
                    
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Anexar Recibos, Notas e Fotos (Múltiplos)</label>
                      <div className="flex items-center gap-3">
                        <label className="cursor-pointer bg-amber-50 text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-100 transition-colors flex items-center gap-2 text-sm font-medium border border-amber-200">
                            <Plus className="w-4 h-4" /> Adicionar Arquivos
                            <input 
                                type="file" 
                                accept="image/*"
                                multiple
                                onChange={handleFileUpload} 
                                className="hidden"
                            />
                        </label>
                        <span className="text-xs text-slate-400">Suporta múltiplas imagens.</span>
                      </div>
                      
                      {/* Galeria de imagens selecionadas no formulário */}
                      {formData.receiptUrls && formData.receiptUrls.length > 0 && (
                          <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-3">
                              {formData.receiptUrls.map((url, index) => (
                                  <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                      <img src={url} alt={`Anexo ${index}`} className="w-full h-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remover imagem"
                                      >
                                          <X className="w-3 h-3" />
                                      </button>
                                  </div>
                              ))}
                          </div>
                      )}
                   </div>

                   <div className="col-span-2">
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-slate-700">
                            {formData.category === WorkCategory.MATERIAL_PURCHASE ? "Descrição dos Materiais (Para Ata)" : "Descrição da Obra (Para Ata)"}
                        </label>
                        <button 
                            type="button"
                            onClick={() => handleCorrectSpelling('description', formData.description || '')}
                            disabled={isCorrecting || !formData.description}
                            className="text-xs text-emerald-600 hover:text-emerald-800 flex items-center gap-1 disabled:opacity-50"
                        >
                            <Sparkles className="w-3 h-3" />
                            {isCorrecting ? 'Corrigindo...' : 'Corrigir Ortografia'}
                        </button>
                      </div>
                      <textarea className="w-full p-2 border rounded-lg focus:ring-amber-500 font-mono text-sm" rows={6}
                        placeholder={formData.category === WorkCategory.MATERIAL_PURCHASE ? "Ex: 10 sacos de cimento Votoran, 2 metros de areia média..." : "Liste o andamento da obra, materiais e serviços..."}
                        value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm flex items-center gap-2"
                   >
                     {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                     {isSaving ? 'Salvando...' : (editingId ? 'Atualizar' : 'Salvar')}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Works;