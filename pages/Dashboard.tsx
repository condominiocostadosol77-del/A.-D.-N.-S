import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  AlertCircle,
  MapPin,
  Printer,
  PieChart as PieChartIcon,
  CheckCircle2
} from 'lucide-react';
import { 
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Member, Transaction, TransactionType, Sector, Discipline } from '../types';
import * as storage from '../services/storage';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

interface DashboardProps {
  currentSector: string;
  sectors: Sector[];
}

const Dashboard: React.FC<DashboardProps> = ({ currentSector, sectors }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (members.length === 0) setLoading(true);
      
      const [mems, discs, txs] = await Promise.all([
        storage.getMembers(),
        storage.getDisciplines(),
        storage.getTransactions()
      ]);
      setMembers(mems);
      setDisciplines(discs);
      setTransactions(txs);
      setLoading(false);
    };
    fetchData();
  }, []); 

  // --- Optimization: Memoize computations ---
  
  const { 
      filteredMembers, 
      activeDisciplinesCount,
      totalTithers,
      tithersCheckedThisMonth
  } = useMemo(() => {
      // Filter Members
      const fMembers = currentSector === 'ALL' 
            ? members 
            : members.filter(m => m.sector === currentSector);

      // Active Disciplines
      const now = new Date();
      now.setHours(0,0,0,0);
      const activeDiscs = disciplines.filter(d => {
          const end = new Date(d.endDate);
          return (currentSector === 'ALL' || d.sector === currentSector) && end >= now;
      });

      // Tithers Logic (Checkbox based)
      const tithers = fMembers.filter(m => m.isTither);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      const checkedIds = new Set(
          transactions
          .filter(t => {
              const d = new Date(t.date);
              // Consider legacy TITHE or new TITHE_RECORD
              const isTithe = t.type === TransactionType.TITHE || t.type === TransactionType.TITHE_RECORD;
              return isTithe && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .map(t => t.memberId)
      );
      
      const checkedCount = tithers.filter(m => checkedIds.has(m.id)).length;

      return {
          filteredMembers: fMembers,
          activeDisciplinesCount: activeDiscs.length,
          totalTithers: tithers.length,
          tithersCheckedThisMonth: checkedCount
      };
  }, [members, disciplines, transactions, currentSector]);

  // Chart Data: Roles Distribution
  const roleData = useMemo(() => {
      const counts: Record<string, number> = {};
      filteredMembers.forEach(m => {
          counts[m.role] = (counts[m.role] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a,b) => b.value - a.value); // Sort descending
  }, [filteredMembers]);

  // Helper to safely get sector name
  const getSectorName = (id: string) => {
    if (id === 'ALL') return 'Todos os Setores';
    return sectors.find(s => s.id === id)?.name || id;
  };

  if (loading) return <div className="flex justify-center p-12 text-emerald-600 animate-pulse">Carregando dados...</div>;

  const Card = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className={`text-3xl font-bold ${color}`}>
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100').replace('700', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {subtext && <div className="mt-3 pt-3 border-t border-slate-50 text-sm text-slate-500">{subtext}</div>}
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Visão Geral - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
              {getSectorName(currentSector)}
            </span>
          </div>
          <p className="text-slate-500">Resumo de membros e atividades eclesiásticas.</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm no-print"
        >
          <Printer className="w-4 h-4" />
          Imprimir Relatório
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card 
          title="Total de Membros" 
          value={filteredMembers.length} 
          icon={Users} 
          color="text-blue-600"
          subtext="Membros cadastrados nesta congregação"
        />
        <Card 
          title="Membros em Disciplina" 
          value={activeDisciplinesCount} 
          icon={AlertCircle} 
          color="text-red-500" 
          subtext="Membros sob disciplina eclesiástica ativa"
        />
        <Card 
          title="Dizimistas Confirmados (Mês)" 
          value={`${tithersCheckedThisMonth} / ${totalTithers}`} 
          icon={CheckCircle2} 
          color="text-emerald-600"
          subtext={
            <div className="flex items-center gap-2">
                <div className="w-full bg-slate-100 rounded-full h-1.5 flex-1">
                    <div 
                        className="bg-emerald-500 h-1.5 rounded-full" 
                        style={{ width: `${totalTithers > 0 ? (tithersCheckedThisMonth / totalTithers) * 100 : 0}%` }}
                    ></div>
                </div>
                <span className="text-xs font-bold text-emerald-700">
                    {totalTithers > 0 ? Math.round((tithersCheckedThisMonth / totalTithers) * 100) : 0}%
                </span>
            </div>
          } 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Members by Role Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 break-inside-avoid">
          <div className="flex items-center gap-2 mb-4">
              <PieChartIcon className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-slate-800">Distribuição por Cargos</h3>
          </div>
          <div className="h-72 w-full">
            {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={roleData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={2}
                        dataKey="value"
                    >
                        {roleData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(val: number) => [`${val} membros`, 'Quantidade']}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                        layout="vertical" 
                        align="right" 
                        verticalAlign="middle" 
                        wrapperStyle={{ fontSize: '12px' }}
                        formatter={(value, entry: any) => {
                          const { payload } = entry;
                          return <span className="text-slate-600">{value} <strong className="ml-1 text-slate-800">({payload.value})</strong></span>;
                        }}
                    />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                    Sem dados para exibir
                </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Alert List */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Pendências de Dízimo
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-72 p-0">
                {totalTithers - tithersCheckedThisMonth > 0 ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-500 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 font-medium">Nome</th>
                                <th className="px-6 py-3 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {filteredMembers
                             .filter(m => m.isTither) // Only tithers
                             .filter(m => {
                                // Filter those NOT in the checked list
                                const checkedIds = new Set(
                                    transactions
                                    .filter(t => {
                                        const d = new Date(t.date);
                                        const currentMonth = new Date().getMonth();
                                        const currentYear = new Date().getFullYear();
                                        return (t.type === TransactionType.TITHE || t.type === TransactionType.TITHE_RECORD) && 
                                               d.getMonth() === currentMonth && 
                                               d.getFullYear() === currentYear;
                                    })
                                    .map(t => t.memberId)
                                );
                                return !checkedIds.has(m.id);
                             })
                             .slice(0, 10) // Limit to top 10
                             .map(m => (
                               <tr key={m.id} className="hover:bg-slate-50">
                                   <td className="px-6 py-3 text-slate-700">{m.fullName}</td>
                                   <td className="px-6 py-3 text-right">
                                       <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full font-medium">Pendente</span>
                                   </td>
                               </tr>
                             ))
                           }
                        </tbody>
                    </table>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-400">
                        <CheckCircle2 className="w-10 h-10 text-emerald-200 mb-2" />
                        <p>Todos os dizimistas estão em dia este mês!</p>
                    </div>
                )}
            </div>
            {totalTithers - tithersCheckedThisMonth > 10 && (
                <div className="p-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                    E mais {totalTithers - tithersCheckedThisMonth - 10} pendentes...
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;