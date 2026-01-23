import React, { useState, useEffect } from 'react';
import { 
  Transaction, 
  Member, 
  TransactionType, 
  ExpenseCategory,
  PaymentMethod,
  Sector
} from '../types';
import * as storage from '../services/storage';
import { Plus, Trash2, FileText, Download, Search, AlertTriangle, MapPin, Printer, Loader2 } from 'lucide-react';

interface FinancialsProps {
  currentSector: string;
  sectors: Sector[];
}

const Financials: React.FC<FinancialsProps> = ({ currentSector, sectors }) => {
  const [activeTab, setActiveTab] = useState<'tithes' | 'offerings' | 'special' | 'expenses'>('tithes');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for save button
  
  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form Data
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    paymentMethod: PaymentMethod.CASH,
    sector: currentSector === 'ALL' ? 'SEDE' : currentSector
  });

  // Helper to get Sector Name
  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  const getTabLabel = () => {
    switch(activeTab) {
      case 'tithes': return 'Relatório de Dízimos';
      case 'offerings': return 'Relatório de Ofertas Gerais';
      case 'special': return 'Relatório de Ofertas Especiais';
      case 'expenses': return 'Relatório de Saídas';
      default: return 'Relatório Financeiro';
    }
  };

  // Update form default if sector changes
  useEffect(() => {
    if(!isModalOpen) {
      setFormData(prev => ({
        ...prev,
        sector: currentSector === 'ALL' ? 'SEDE' : currentSector
      }));
    }
  }, [currentSector, isModalOpen]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    const [txs, mems] = await Promise.all([
      storage.getTransactions(),
      storage.getMembers()
    ]);
    setTransactions(txs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setMembers(mems);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      alert('Insira um valor válido maior que zero.');
      return;
    }

    setIsSubmitting(true);

    try {
        let type: TransactionType;
        if (activeTab === 'tithes') type = TransactionType.TITHE;
        else if (activeTab === 'offerings') type = TransactionType.OFFERING;
        else if (activeTab === 'special') type = TransactionType.SPECIAL_OFFERING;
        else type = TransactionType.EXPENSE;

        const newTx: Transaction = {
          id: crypto.randomUUID(),
          type,
          date: formData.date!,
          amount: Number(formData.amount),
          // Ensure optional fields are undefined if not used, so they don't send garbage
          memberId: (activeTab !== 'expenses' && formData.memberId) ? formData.memberId : undefined,
          description: formData.description || undefined,
          category: (activeTab === 'expenses') ? formData.category : undefined,
          receiptUrl: formData.receiptUrl || undefined,
          paymentMethod: (activeTab !== 'expenses') ? formData.paymentMethod : undefined,
          pixDestination: (formData.paymentMethod === PaymentMethod.PIX) ? formData.pixDestination : undefined,
          sector: formData.sector || 'SEDE',
          createdAt: new Date().toISOString()
        };

        await storage.saveTransaction(newTx);
        
        // Success
        setIsModalOpen(false);
        // Reset form but keep date and current sector
        setFormData({ 
          date: formData.date, 
          amount: 0, 
          paymentMethod: PaymentMethod.CASH,
          description: '',
          pixDestination: '',
          memberId: '',
          sector: currentSector === 'ALL' ? 'SEDE' : currentSector
        });
        loadData();

    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Ocorreu um erro ao salvar o registro.\n\nVerifique se as tabelas do banco de dados foram criadas corretamente (Execute o código SQL no Supabase).");
    } finally {
        setIsSubmitting(false);
    }
  };

  const requestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      setTransactions(prev => prev.filter(t => t.id !== deleteId));
      await storage.deleteTransaction(deleteId);
      setDeleteId(null);
      loadData();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Size check removed as requested
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, receiptUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filter based on active tab, search term, AND SECTOR
  const displayedTransactions = transactions
    .filter(t => currentSector === 'ALL' || t.sector === currentSector) // Sector filter
    .filter(t => {
      let matchesTab = false;
      if (activeTab === 'tithes') matchesTab = t.type === TransactionType.TITHE;
      else if (activeTab === 'offerings') matchesTab = t.type === TransactionType.OFFERING;
      else if (activeTab === 'special') matchesTab = t.type === TransactionType.SPECIAL_OFFERING;
      else matchesTab = t.type === TransactionType.EXPENSE;

      if (!matchesTab) return false;

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const memberName = t.memberId ? members.find(m => m.id === t.memberId)?.fullName.toLowerCase() : '';
        const desc = t.description?.toLowerCase() || '';
        const date = formatDate(t.date);
        return memberName.includes(term) || desc.includes(term) || date.includes(term);
      }
      
      return true;
    });

  const availableMembersForForm = members.filter(m => m.sector === formData.sector);

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>{getTabLabel()} - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Controle Financeiro</h2>
          <p className="text-sm text-slate-500 mt-1">
             Visualizando: <span className="font-semibold text-emerald-600">{currentSector === 'ALL' ? 'Todos os Setores' : getSectorName(currentSector)}</span>
          </p>
        </div>
        <div className="flex gap-2 no-print">
           <button onClick={() => window.print()} className="px-3 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-2">
             <Printer className="w-4 h-4" /> <span className="hidden sm:inline">Imprimir / PDF</span>
           </button>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm"
           >
             <Plus className="w-4 h-4" />
             Novo Lançamento
           </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-print">
        <button 
          onClick={() => setActiveTab('tithes')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'tithes' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Dízimos
          {activeTab === 'tithes' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('offerings')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'offerings' ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ofertas Gerais
          {activeTab === 'offerings' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('special')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'special' ? 'text-purple-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Ofertas Especiais
          {activeTab === 'special' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('expenses')}
          className={`px-6 py-3 font-medium text-sm transition-colors relative whitespace-nowrap ${activeTab === 'expenses' ? 'text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Saídas e Despesas
          {activeTab === 'expenses' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-600"></div>}
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 flex items-center gap-3 no-print">
        <Search className="text-slate-400 w-5 h-5" />
        <input 
          type="text" 
          placeholder={activeTab === 'tithes' ? "Buscar por membro ou data..." : "Buscar por descrição, membro ou data..."}
          className="flex-1 outline-none text-slate-600"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Data</th>
                {currentSector === 'ALL' && <th className="px-6 py-3">Setor</th>}
                <th className="px-6 py-3">Valor</th>
                {activeTab !== 'expenses' ? (
                  <>
                    <th className="px-6 py-3">Membro / Descrição</th>
                    <th className="px-6 py-3">Pagamento & Detalhes</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3">Categoria</th>
                    <th className="px-6 py-3">Descrição</th>
                    <th className="px-6 py-3">Comprovante</th>
                  </>
                )}
                <th className="px-6 py-3 w-10 no-print">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedTransactions.length > 0 ? (
                displayedTransactions.map((tx) => {
                  const memberName = tx.memberId ? members.find(m => m.id === tx.memberId)?.fullName : '-';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3">{formatDate(tx.date)}</td>
                      {currentSector === 'ALL' && (
                        <td className="px-6 py-3">
                           <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                             {getSectorName(tx.sector)}
                           </span>
                        </td>
                      )}
                      <td className={`px-6 py-3 font-medium ${activeTab === 'expenses' ? 'text-red-600' : 'text-emerald-600'}`}>
                        R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      {activeTab !== 'expenses' ? (
                         <>
                           <td className="px-6 py-3">
                             {activeTab === 'tithes' ? (
                               <span className="font-medium text-slate-800 text-base">{memberName}</span>
                             ) : (
                               <div className="flex flex-col">
                                 <span className="font-medium text-slate-800">{tx.description || 'Sem descrição'}</span>
                                 {memberName !== '-' && <span className="text-xs text-slate-400">Membro: {memberName}</span>}
                               </div>
                             )}
                           </td>
                           <td className="px-6 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="inline-flex items-center gap-1 w-fit px-2 py-1 rounded bg-slate-100 text-xs font-semibold uppercase tracking-wider">
                                  {tx.paymentMethod || 'Dinheiro'}
                                </span>
                                {tx.paymentMethod === PaymentMethod.PIX && tx.pixDestination && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Destino: {tx.pixDestination}
                                  </span>
                                )}
                              </div>
                           </td>
                         </>
                      ) : (
                        <>
                          <td className="px-6 py-3">
                            <span className="px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                              {tx.category}
                            </span>
                          </td>
                          <td className="px-6 py-3 truncate max-w-xs" title={tx.description}>{tx.description}</td>
                          <td className="px-6 py-3">
                            {tx.receiptUrl ? (
                              <a href={tx.receiptUrl} download={`recibo-${tx.id}`} className="text-blue-500 hover:underline flex items-center gap-1">
                                <FileText className="w-3 h-3" /> Ver
                              </a>
                            ) : <span className="text-slate-400">-</span>}
                          </td>
                        </>
                      )}
                      <td className="px-6 py-3 text-right no-print">
                         <button 
                            onClick={(e) => requestDelete(e, tx.id)} 
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Excluir Lançamento"
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={currentSector === 'ALL' ? 7 : 6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="w-8 h-8 opacity-20" />
                      <p>Nenhum registro encontrado.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 animate-fade-in no-print">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Excluir Lançamento</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Tem certeza que deseja excluir este registro financeiro?
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

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 no-print">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold text-slate-800">
                {activeTab === 'tithes' && 'Novo Dízimo'}
                {activeTab === 'offerings' && 'Nova Oferta Geral'}
                {activeTab === 'special' && 'Nova Oferta Especial'}
                {activeTab === 'expenses' && 'Nova Despesa'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              {/* Sector Selection (Always visible, defaults to current view context) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Setor / Localização</label>
                <select 
                  className="w-full p-2 border rounded-lg focus:ring-emerald-500 bg-slate-50"
                  value={formData.sector} 
                  onChange={e => setFormData({...formData, sector: e.target.value})}
                >
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data</label>
                  <input type="date" required className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input type="number" step="0.01" required className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
                </div>
              </div>

              {/* Transaction specific fields */}
              {activeTab !== 'expenses' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Método de Pagamento</label>
                    <select 
                      className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                      value={formData.paymentMethod}
                      onChange={e => setFormData({...formData, paymentMethod: e.target.value as PaymentMethod})}
                    >
                      {Object.values(PaymentMethod).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {formData.paymentMethod === PaymentMethod.PIX && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Qual chave/conta Pix recebeu?</label>
                      <input 
                        type="text" 
                        placeholder="Ex: CNPJ da Igreja, Email..." 
                        className="w-full p-2 border rounded bg-white focus:ring-emerald-500 text-sm"
                        value={formData.pixDestination || ''} 
                        onChange={e => setFormData({...formData, pixDestination: e.target.value})} 
                      />
                    </div>
                  )}
                </>
              )}

              {activeTab === 'tithes' && (
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Membro Dizimista</label>
                   <select required className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    value={formData.memberId || ''} onChange={e => setFormData({...formData, memberId: e.target.value})}>
                     <option value="">Selecione o membro...</option>
                     {availableMembersForForm.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                   </select>
                   <p className="text-xs text-slate-500 mt-1">
                     * Mostrando apenas membros do setor selecionado acima.
                   </p>
                </div>
              )}

              {activeTab === 'offerings' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição / Doador (Opcional)</label>
                  <input type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                    placeholder="Ex: Oferta de visitante"
                    value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
              )}

              {activeTab === 'special' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo da Oferta</label>
                    <input type="text" required className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                      placeholder="Ex: Missões África, Construção, Campanha..."
                      value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Membro (Opcional)</label>
                     <select className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                      value={formData.memberId || ''} onChange={e => setFormData({...formData, memberId: e.target.value})}>
                       <option value="">Anônimo / Não identificado</option>
                       {availableMembersForForm.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
                     </select>
                  </div>
                </>
              )}

              {activeTab === 'expenses' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                    <select required className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                      value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}>
                      <option value="">Selecione...</option>
                      {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo/Descrição</label>
                    <input required type="text" className="w-full p-2 border rounded-lg focus:ring-emerald-500"
                      value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Comprovante</label>
                    <input type="file" onChange={handleFileUpload} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                </>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full text-white py-3 rounded-lg font-medium shadow-sm transition-colors mt-6 flex justify-center items-center gap-2
                  ${isSubmitting ? 'bg-slate-400 cursor-not-allowed' : (
                      activeTab === 'expenses' ? 'bg-red-600 hover:bg-red-700' : 
                      activeTab === 'special' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  )}
                `}
              >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Salvando...
                    </>
                ) : 'Salvar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Financials;