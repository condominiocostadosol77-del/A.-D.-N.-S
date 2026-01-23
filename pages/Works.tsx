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
  Loader2
} from 'lucide-react';
import { WorkProject, Sector, WorkStatus } from '../types';
import * as storage from '../services/storage';

interface WorksProps {
  currentSector: string;
  sectors: Sector[];
}

const Works: React.FC<WorksProps> = ({ currentSector, sectors }) => {
  const [works, setWorks] = useState<WorkProject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<WorkProject>>({
    status: WorkStatus.PLANNING,
    startDate: new Date().toISOString().split('T')[0],
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
    totalCost: 0
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Informe o título da obra.');
      return;
    }

    setIsSaving(true);

    const newWork: WorkProject = {
      id: crypto.randomUUID(),
      title: formData.title!,
      description: formData.description || '',
      startDate: formData.startDate!,
      endDate: formData.endDate,
      status: formData.status || WorkStatus.PLANNING,
      totalCost: Number(formData.totalCost) || 0,
      sector: formData.sector || 'SEDE',
      responsible: formData.responsible,
      createdAt: new Date().toISOString()
    };

    try {
        await storage.saveWork(newWork);
        setFormData({
            status: WorkStatus.PLANNING,
            startDate: new Date().toISOString().split('T')[0],
            sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
            totalCost: 0,
            title: '',
            description: '',
            responsible: ''
        });
        setIsModalOpen(false);
        loadWorks();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar obra. Verifique sua conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setWorks(prev => prev.filter(w => w.id !== deleteId));
      await storage.deleteWork(deleteId);
      setDeleteId(null);
    }
  };

  const filteredWorks = works
    .filter(w => currentSector === 'ALL' || w.sector === currentSector)
    .filter(w => w.title.toLowerCase().includes(searchTerm.toLowerCase()));

  const getStatusColor = (status: WorkStatus) => {
    switch (status) {
      case WorkStatus.PLANNING: return 'bg-blue-100 text-blue-700';
      case WorkStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700';
      case WorkStatus.COMPLETED: return 'bg-emerald-100 text-emerald-700';
      case WorkStatus.PAUSED: return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório de Obras e Reformas - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Hammer className="w-6 h-6 text-amber-600" />
            Obras e Reformas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Catalogação de reformas, construções e manutenção predial.
          </p>
        </div>
        <div className="flex gap-2 no-print">
            <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4" />
                Imprimir Relatório
            </button>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                Nova Obra
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar obra por título..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredWorks.length > 0 ? (
           filteredWorks.map(work => (
             <div key={work.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow break-inside-avoid">
                <div className="flex-1 space-y-3">
                   <div className="flex items-start justify-between">
                       <div>
                           <h3 className="text-xl font-bold text-slate-800">{work.title}</h3>
                           <div className="flex items-center gap-2 mt-1">
                               <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(work.status)}`}>
                                   {work.status}
                               </span>
                               <span className="text-xs text-slate-400 flex items-center gap-1">
                                   <MapPin className="w-3 h-3" /> {getSectorName(work.sector)}
                               </span>
                           </div>
                       </div>
                   </div>
                   
                   <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                       <strong className="block text-xs text-slate-400 uppercase mb-1">Descrição / Detalhes (Ata)</strong>
                       {work.description}
                   </div>
                </div>

                <div className="md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6 pt-4 md:pt-0">
                    <div>
                        <p className="text-xs text-slate-500 mb-1">Custo Total (Gasto)</p>
                        <p className="text-2xl font-bold text-slate-800">R$ {work.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                             <Calendar className="w-4 h-4 text-amber-500" />
                             <span>Início: {new Date(work.startDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                             <Clock className="w-4 h-4 text-amber-500" />
                             <span>Fim: {work.endDate ? new Date(work.endDate).toLocaleDateString('pt-BR') : 'Em andamento'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-600">
                             <FileText className="w-4 h-4 text-amber-500" />
                             <span>Resp: {work.responsible || 'Não informado'}</span>
                        </div>
                    </div>

                    <div className="mt-auto pt-2 flex justify-end no-print">
                        <button 
                            onClick={() => setDeleteId(work.id)} 
                            className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                            <Trash2 className="w-4 h-4" /> Excluir
                        </button>
                    </div>
                </div>
             </div>
           ))
        ) : (
           <div className="bg-white p-12 rounded-xl text-center text-slate-400 border border-slate-100">
               <Hammer className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>Nenhuma obra ou reforma registrada.</p>
           </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Excluir Obra</h3>
                </div>
                <p className="text-slate-600 mb-6">Deseja realmente excluir este registro de obra?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button>
                </div>
            </div>
        </div>
      )}

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
             <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
               <h3 className="text-xl font-bold text-slate-800">Registrar Obra/Reforma</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSave} className="p-6 space-y-4">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Título da Obra</label>
                      <input required type="text" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        placeholder="Ex: Reforma do Telhado, Construção do Muro..."
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
                       <label className="block text-sm font-medium text-slate-700 mb-1">Responsável</label>
                       <input type="text" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        placeholder="Nome do encarregado"
                        value={formData.responsible || ''} onChange={e => setFormData({...formData, responsible: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
                       <input type="date" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Data Conclusão (Real ou Prevista)</label>
                       <input type="date" className="w-full p-2 border rounded-lg focus:ring-amber-500"
                        value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                   </div>

                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada (Materiais, Serviços...)</label>
                      <textarea className="w-full p-2 border rounded-lg focus:ring-amber-500 font-mono text-sm" rows={6}
                        placeholder="Liste aqui os materiais comprados e serviços contratados para constar em ata..."
                        value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm flex items-center gap-2"
                   >
                     {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                     {isSaving ? 'Salvando...' : 'Salvar Registro'}
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