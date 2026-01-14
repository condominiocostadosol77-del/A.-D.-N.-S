import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Search,
  Calendar
} from 'lucide-react';
import { Member, Sector, TransactionType } from '../types';
import * as storage from '../services/storage';

interface TithersControlProps {
  currentSector: string;
  sectors: Sector[];
}

const TithersControl: React.FC<TithersControlProps> = ({ currentSector, sectors }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Helper to get Sector Name
  const getSectorName = (id: string) => {
    return sectors.find(s => s.id === id)?.name || id;
  };

  useEffect(() => {
    loadData();
  }, [currentSector]);

  const loadData = async () => {
    setLoading(true);
    const [mems, txs] = await Promise.all([
      storage.getMembers(),
      storage.getTransactions()
    ]);
    setMembers(mems);
    setTransactions(txs);
    setLoading(false);
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isTitherChecked = (memberId: string) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    return transactions.some(t => {
      const tDate = new Date(t.date);
      // Check legacy TITHE type OR new TITHE_RECORD type
      return (t.type === TransactionType.TITHE || t.type === TransactionType.TITHE_RECORD) &&
             t.memberId === memberId &&
             tDate.getMonth() === month &&
             tDate.getFullYear() === year;
    });
  };

  const toggleTitherStatus = async (memberId: string, isChecked: boolean) => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    if (isChecked) {
      // Uncheck: Remove the record
      const recordToDelete = transactions.find(t => {
        const tDate = new Date(t.date);
        return (t.type === TransactionType.TITHE || t.type === TransactionType.TITHE_RECORD) &&
               t.memberId === memberId &&
               tDate.getMonth() === month &&
               tDate.getFullYear() === year;
      });

      if (recordToDelete) {
        // Optimistic Update
        setTransactions(prev => prev.filter(t => t.id !== recordToDelete.id));
        await storage.deleteTransaction(recordToDelete.id);
      }
    } else {
      // Check: Create new record
      // We set the date to the 10th of the selected month by default, or today if same month
      let recordDate = new Date(year, month, 10);
      const now = new Date();
      if (month === now.getMonth() && year === now.getFullYear()) {
          recordDate = now;
      }

      // Format YYYY-MM-DD manually to avoid timezone issues
      const dateStr = `${recordDate.getFullYear()}-${String(recordDate.getMonth() + 1).padStart(2, '0')}-${String(recordDate.getDate()).padStart(2, '0')}`;

      const newTx = {
        id: crypto.randomUUID(),
        type: TransactionType.TITHE_RECORD,
        date: dateStr,
        amount: 0, // Zero amount as requested
        memberId: memberId,
        sector: currentSector === 'ALL' ? 'SEDE' : currentSector, // Ideally matches member sector
        createdAt: new Date().toISOString()
      };

      // Optimistic Update
      setTransactions(prev => [...prev, newTx]);
      await storage.saveTransaction(newTx as any);
    }
  };

  const filteredMembers = members
    .filter(m => m.isTither) // Only show tithers
    .filter(m => currentSector === 'ALL' || m.sector === currentSector)
    .filter(m => m.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

  // Stats for the current view
  const totalTithers = filteredMembers.length;
  const checkedTithers = filteredMembers.filter(m => isTitherChecked(m.id)).length;
  const percentage = totalTithers > 0 ? Math.round((checkedTithers / totalTithers) * 100) : 0;

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Controle de Dizimistas - {monthName}</p>
        <p>{getSectorName(currentSector)}</p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <CheckCircle2 className="w-6 h-6 text-emerald-600" />
             Controle de Dizimistas
          </h2>
          <p className="text-sm text-slate-500 mt-1">
             Gerencie a frequência dos dizimistas sem valores.
          </p>
        </div>
        <div className="no-print">
            <button 
                onClick={() => window.print()} 
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Printer className="w-4 h-4" />
                Imprimir Relatório
            </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 break-inside-avoid">
         
         {/* Month Navigator */}
         <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex items-center gap-2 min-w-[140px] justify-center font-bold text-slate-700 capitalize">
                <Calendar className="w-4 h-4 text-emerald-600" />
                {monthName}
            </div>
            <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
         </div>

         {/* Search */}
         <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
                type="text" 
                placeholder="Buscar membro..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
         </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 break-inside-avoid">
         <div className="flex justify-between items-end mb-2">
            <div>
                <span className="text-sm font-medium text-slate-500">Adesão neste mês</span>
                <div className="text-2xl font-bold text-slate-800">{checkedTithers} <span className="text-sm text-slate-400 font-normal">de {totalTithers} dizimistas</span></div>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{percentage}%</span>
         </div>
         <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
         </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Nome do Dizimista</th>
                        {currentSector === 'ALL' && <th className="px-6 py-4">Congregação</th>}
                        <th className="px-6 py-4 text-center w-32">Status</th>
                        <th className="px-6 py-4 text-right w-32 no-print">Ação</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredMembers.length > 0 ? (
                        filteredMembers.map(member => {
                            const isChecked = isTitherChecked(member.id);
                            return (
                                <tr key={member.id} className={`hover:bg-slate-50 transition-colors ${isChecked ? 'bg-emerald-50/30' : ''}`}>
                                    <td className="px-6 py-4 font-medium text-slate-700">
                                        {member.fullName}
                                        <div className="text-xs text-slate-400 font-normal">{member.role}</div>
                                    </td>
                                    {currentSector === 'ALL' && (
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {getSectorName(member.sector)}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center">
                                        {isChecked ? (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                                <CheckCircle2 className="w-3 h-3" /> CONFIRMADO
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                                                PENDENTE
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right no-print">
                                        <button
                                            onClick={() => toggleTitherStatus(member.id, isChecked)}
                                            className={`
                                                px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm
                                                ${isChecked 
                                                    ? 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600' 
                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700'}
                                            `}
                                        >
                                            {isChecked ? 'Desmarcar' : 'Confirmar'}
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={currentSector === 'ALL' ? 4 : 3} className="px-6 py-12 text-center text-slate-400">
                                <p>Nenhum membro dizimista encontrado para este filtro.</p>
                                <p className="text-xs mt-1">Certifique-se que os membros estão marcados como "Dizimista" no cadastro.</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default TithersControl;