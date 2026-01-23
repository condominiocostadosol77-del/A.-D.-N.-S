import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Tag,
  DollarSign,
  Calendar,
  AlertTriangle,
  MapPin,
  X,
  Camera,
  Loader2
} from 'lucide-react';
import { Asset, Sector, AssetCondition } from '../types';
import * as storage from '../services/storage';

interface AssetsProps {
  currentSector: string;
  sectors: Sector[];
}

const Assets: React.FC<AssetsProps> = ({ currentSector, sectors }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Asset>>({
    quantity: 1,
    condition: AssetCondition.GOOD,
    acquisitionDate: new Date().toISOString().split('T')[0],
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    const data = await storage.getAssets();
    setAssets(data);
  };

  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.value) {
      alert('Preencha nome e valor.');
      return;
    }

    setIsSaving(true);

    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: formData.name!,
      description: formData.description || '',
      acquisitionDate: formData.acquisitionDate || new Date().toISOString(),
      value: Number(formData.value),
      quantity: Number(formData.quantity) || 1,
      condition: formData.condition || AssetCondition.GOOD,
      location: formData.location || '',
      sector: formData.sector || 'SEDE',
      photoUrl: formData.photoUrl,
      createdAt: new Date().toISOString()
    };

    try {
        await storage.saveAsset(newAsset);
        setFormData({
            quantity: 1,
            condition: AssetCondition.GOOD,
            acquisitionDate: new Date().toISOString().split('T')[0],
            sector: currentSector === 'ALL' ? 'SEDE' : currentSector,
            name: '',
            value: 0,
            description: '',
            location: ''
        });
        setIsModalOpen(false);
        loadAssets();
    } catch (error) {
        console.error(error);
        alert("Erro ao salvar patrimônio. Verifique sua conexão.");
    } finally {
        setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setAssets(prev => prev.filter(a => a.id !== deleteId));
      await storage.deleteAsset(deleteId);
      setDeleteId(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Size limit removed as requested
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredAssets = assets
    .filter(a => currentSector === 'ALL' || a.sector === currentSector)
    .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                 a.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalValue = filteredAssets.reduce((acc, curr) => acc + (curr.value * curr.quantity), 0);

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório de Patrimônio - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Bens e Patrimônio
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Inventário de bens da igreja. Valor Total Estimado: <strong className="text-emerald-600">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus className="w-4 h-4" />
                Novo Item
            </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Buscar item, descrição..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Item</th>
                <th className="px-6 py-3">Local/Setor</th>
                <th className="px-6 py-3">Aquisição</th>
                <th className="px-6 py-3">Condição</th>
                <th className="px-6 py-3">Qtd</th>
                <th className="px-6 py-3">Valor Unit.</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3 text-right no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {filteredAssets.length > 0 ? (
                 filteredAssets.map(asset => (
                   <tr key={asset.id} className="hover:bg-slate-50">
                     <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                           {asset.photoUrl ? (
                               <img src={asset.photoUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                           ) : (
                               <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                   <Tag className="w-5 h-5 text-slate-400" />
                               </div>
                           )}
                           <div>
                               <p className="font-medium text-slate-800">{asset.name}</p>
                               <p className="text-xs text-slate-400 truncate max-w-[150px]">{asset.description}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-6 py-3">
                        <div className="text-xs">
                            <span className="font-medium text-slate-700">{getSectorName(asset.sector)}</span>
                            {asset.location && <div className="text-slate-400">{asset.location}</div>}
                        </div>
                     </td>
                     <td className="px-6 py-3">
                         {new Date(asset.acquisitionDate).toLocaleDateString('pt-BR')}
                     </td>
                     <td className="px-6 py-3">
                         <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${asset.condition === AssetCondition.NEW ? 'bg-emerald-100 text-emerald-700' : 
                              asset.condition === AssetCondition.GOOD ? 'bg-blue-100 text-blue-700' :
                              asset.condition === AssetCondition.FAIR ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {asset.condition}
                         </span>
                     </td>
                     <td className="px-6 py-3 font-medium">{asset.quantity}</td>
                     <td className="px-6 py-3">R$ {asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                     <td className="px-6 py-3 font-bold text-slate-800">
                         R$ {(asset.value * asset.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                     </td>
                     <td className="px-6 py-3 text-right no-print">
                        <button 
                           onClick={() => setDeleteId(asset.id)}
                           className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                     </td>
                   </tr>
                 ))
               ) : (
                 <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        Nenhum bem cadastrado.
                    </td>
                 </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
            <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                <div className="flex items-center gap-3 text-red-600 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Excluir Item</h3>
                </div>
                <p className="text-slate-600 mb-6">Confirma a exclusão deste item do patrimônio?</p>
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
               <h3 className="text-xl font-bold text-slate-800">Novo Item de Patrimônio</h3>
               <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6 text-slate-400" /></button>
             </div>
             
             <form onSubmit={handleSave} className="p-6 space-y-4">
                <div className="flex justify-center mb-4">
                   <div className="relative group cursor-pointer w-24 h-24 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                      {formData.photoUrl ? (
                          <img src={formData.photoUrl} className="w-full h-full object-cover" />
                      ) : (
                          <Camera className="w-8 h-8 text-slate-400" />
                      )}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Bem/Item</label>
                      <input required type="text" className="w-full p-2 border rounded-lg focus:ring-blue-500"
                        placeholder="Ex: Projetor Epson, Banco de Madeira, Microfone..."
                        value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                   </div>
                   
                   <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Descrição Detalhada (Para Ata)</label>
                      <textarea className="w-full p-2 border rounded-lg focus:ring-blue-500" rows={2}
                        placeholder="Ex: Cor preta, modelo X, número de série Y..."
                        value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Valor Unitário (R$)</label>
                       <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input required type="number" step="0.01" className="w-full pl-9 p-2 border rounded-lg focus:ring-blue-500"
                            value={formData.value || 0} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                       </div>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Quantidade</label>
                       <input required type="number" min="1" className="w-full p-2 border rounded-lg focus:ring-blue-500"
                        value={formData.quantity || 1} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Condição</label>
                       <select className="w-full p-2 border rounded-lg focus:ring-blue-500"
                         value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as AssetCondition})}>
                         {Object.values(AssetCondition).map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Data Aquisição</label>
                       <input type="date" className="w-full p-2 border rounded-lg focus:ring-blue-500"
                        value={formData.acquisitionDate} onChange={e => setFormData({...formData, acquisitionDate: e.target.value})} />
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Setor</label>
                       <select className="w-full p-2 border rounded-lg focus:ring-blue-500"
                         value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})}>
                         {sectors.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                       </select>
                   </div>

                   <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Local Específico (Opcional)</label>
                       <input type="text" className="w-full p-2 border rounded-lg focus:ring-blue-500"
                        placeholder="Ex: Sala das Crianças, Altar..."
                        value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} />
                   </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                   <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                   <button 
                     type="submit" 
                     disabled={isSaving}
                     className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center gap-2"
                   >
                     {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                     {isSaving ? 'Salvando...' : 'Salvar Bem'}
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;