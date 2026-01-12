import React, { useEffect, useState, useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  AlertCircle,
  FileText,
  CreditCard,
  MapPin,
  Printer,
  Calendar
} from 'lucide-react';
import { Member, Transaction, TransactionType, PaymentMethod, Sector } from '../types';
import * as storage from '../services/storage';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

interface DashboardProps {
  currentSector: string;
  sectors: Sector[];
}

const Dashboard: React.FC<DashboardProps> = ({ currentSector, sectors }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Don't set loading to true if we already have data (prevents flash on re-focus)
      if (transactions.length === 0) setLoading(true);
      
      const [txs, mems] = await Promise.all([
        storage.getTransactions(),
        storage.getMembers()
      ]);
      setTransactions(txs);
      setMembers(mems);
      setLoading(false);
    };
    fetchData();
  }, []); 

  // --- Optimization: Memoize computations ---
  
  // 1. Filter Data
  const { filteredTransactions, filteredMembers } = useMemo(() => {
      return {
          filteredTransactions: currentSector === 'ALL' 
            ? transactions 
            : transactions.filter(t => t.sector === currentSector),
          filteredMembers: currentSector === 'ALL'
            ? members
            : members.filter(m => m.sector === currentSector)
      };
  }, [transactions, members, currentSector]);

  // Helper to safely get sector name
  const getSectorName = (id: string) => {
    if (id === 'ALL') return 'Todos os Setores';
    return sectors.find(s => s.id === id)?.name || id;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // 2. Compute Dashboard Metrics (Heavy Logic)
  const metrics = useMemo(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      // Helper for date checking
      const isInMonth = (dateString: string, targetMonthIndex: number, targetYear: number) => {
        if (!dateString) return false;
        const [y, m] = dateString.split('-').map(Number);
        return (m - 1) === targetMonthIndex && y === targetYear;
      };

      const currentMonthTransactions = filteredTransactions.filter(t => 
        isInMonth(t.date, currentMonth, currentYear)
      );

      const incomeTransactions = currentMonthTransactions
        .filter(t => t.type !== TransactionType.EXPENSE)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalTithes = currentMonthTransactions
        .filter(t => t.type === TransactionType.TITHE)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalOfferings = currentMonthTransactions
        .filter(t => t.type === TransactionType.OFFERING)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalSpecial = currentMonthTransactions
        .filter(t => t.type === TransactionType.SPECIAL_OFFERING)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = currentMonthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((sum, t) => sum + t.amount, 0);

      const totalIncome = totalTithes + totalOfferings + totalSpecial;
      const balance = totalIncome - totalExpenses;

      // Tithers Logic
      const tithers = filteredMembers.filter(m => m.isTither);
      const paidTitherIds = new Set(
        currentMonthTransactions
          .filter(t => t.type === TransactionType.TITHE && t.memberId)
          .map(t => t.memberId!)
      );
      const unpaidTithers = tithers.filter(m => !paidTitherIds.has(m.id));

      return {
          currentMonthTransactions,
          incomeTransactions,
          totalTithes,
          totalOfferings,
          totalSpecial,
          totalExpenses,
          totalIncome,
          balance,
          tithersCount: tithers.length,
          unpaidTithers
      };
  }, [filteredTransactions, filteredMembers]);

  // 3. Compute Chart Data
  const chartsData = useMemo(() => {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const isInMonth = (dateString: string, targetMonthIndex: number, targetYear: number) => {
        if (!dateString) return false;
        const [y, m] = dateString.split('-').map(Number);
        return (m - 1) === targetMonthIndex && y === targetYear;
      };

      // Pie Chart Data
      const expenseByCategory = metrics.currentMonthTransactions
        .filter(t => t.type === TransactionType.EXPENSE)
        .reduce((acc, t) => {
          const cat = t.category || 'Outros';
          acc[cat] = (acc[cat] || 0) + t.amount;
          return acc;
        }, {} as Record<string, number>);

      const pieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

      // Monthly Evolution (Last 6 months)
      const monthlyEvolution = [0, 1, 2, 3, 4, 5].map(i => {
        let targetMonth = currentMonth - (5 - i);
        let targetYear = currentYear;
        
        while (targetMonth < 0) {
          targetMonth += 12;
          targetYear -= 1;
        }

        // We use 'transactions' (raw) here but filter by sector manually to ensure we catch past months correctly
        const monthTxs = transactions.filter(t => 
          isInMonth(t.date, targetMonth, targetYear) && 
          (currentSector === 'ALL' || t.sector === currentSector)
        );

        const income = monthTxs
          .filter(t => t.type !== TransactionType.EXPENSE)
          .reduce((s, t) => s + t.amount, 0);
          
        const expense = monthTxs
          .filter(t => t.type === TransactionType.EXPENSE)
          .reduce((s, t) => s + t.amount, 0);

        return {
          name: `${targetMonth + 1}/${targetYear}`,
          Receitas: income,
          Despesas: expense
        };
      });

      // Daily Evolution
      const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
      
      const dailyEvolution = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const dayTxs = metrics.currentMonthTransactions.filter(t => {
          const [y, m, d] = t.date.split('-').map(Number);
          return d === day;
        });

        const income = dayTxs.filter(t => t.type !== TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
        const expense = dayTxs.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);

        return { name: `${day}`, Receitas: income, Despesas: expense };
      });

      return { pieData, monthlyEvolution, dailyEvolution };
  }, [metrics.currentMonthTransactions, transactions, currentSector]);


  if (loading) return <div className="flex justify-center p-12 text-emerald-600 animate-pulse">Carregando dados...</div>;

  const Card = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow h-full flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className={`text-2xl font-bold ${color}`}>
            R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('600', '100').replace('500', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      {subtext && <div className="mt-3 pt-3 border-t border-slate-50">{subtext}</div>}
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      {/* Print Header */}
      <div className="print-header hidden">
        <h1 className="text-2xl font-bold uppercase">A. D. NATIVIDADE DA SERRA</h1>
        <p>Relatório Geral - {getSectorName(currentSector)}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm font-medium rounded-full">
              {getSectorName(currentSector)}
            </span>
          </div>
          <p className="text-slate-500">Resumo financeiro de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm no-print"
        >
          <Printer className="w-4 h-4" />
          Imprimir / PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          title="Entradas Totais" 
          value={metrics.totalIncome} 
          icon={TrendingUp} 
          color="text-emerald-600"
          subtext={
            <div className="flex flex-col gap-1 text-xs text-slate-500">
               <div className="flex justify-between items-center">
                 <span>Dízimos:</span>
                 <span className="font-semibold text-slate-700">R$ {metrics.totalTithes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span>Ofertas:</span>
                 <span className="font-semibold text-slate-700">R$ {metrics.totalOfferings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between items-center bg-purple-50 px-1.5 py-0.5 -mx-1.5 rounded">
                 <span className="text-purple-700 font-medium">Ofertas Especiais:</span>
                 <span className="font-bold text-purple-700">R$ {metrics.totalSpecial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
               </div>
            </div>
          }
        />
        <Card 
          title="Saídas Totais" 
          value={metrics.totalExpenses} 
          icon={TrendingDown} 
          color="text-red-500" 
          subtext={
            <div className="text-xs text-slate-400 mt-1">
              Despesas e contas pagas no mês
            </div>
          }
        />
        <Card 
          title="Saldo do Mês" 
          value={metrics.balance} 
          icon={DollarSign} 
          color={metrics.balance >= 0 ? "text-blue-600" : "text-red-600"}
          subtext={
            <div className="text-xs text-slate-400 mt-1">
              Balanço final (Entradas - Saídas)
            </div>
          } 
        />
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col justify-between" onClick={() => document.getElementById('unpaid-list')?.scrollIntoView({behavior:'smooth'})}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Dizimistas Pendentes</p>
              <h3 className="text-2xl font-bold text-amber-500">
                {metrics.unpaidTithers.length} / {metrics.tithersCount}
              </h3>
            </div>
            <div className="p-3 rounded-full bg-amber-100">
              <Users className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-50 text-xs text-slate-400">
            Acompanhamento mensal
          </div>
        </div>
      </div>

      {/* Daily Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 break-inside-avoid">
        <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-slate-800">Fluxo Diário (Mês Atual)</h3>
        </div>
        <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartsData.dailyEvolution}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val}`} />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                formatter={(val: number) => `R$ ${val.toLocaleString()}`}
                labelFormatter={(label) => `Dia ${label}`}
            />
            <Legend />
            <Bar dataKey="Receitas" fill="#10b981" radius={[2, 2, 0, 0]} />
            <Bar dataKey="Despesas" fill="#ef4444" radius={[2, 2, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 break-inside-avoid">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Evolução Financeira (Últimos 6 Meses)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartsData.monthlyEvolution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(val: number) => `R$ ${val.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 break-inside-avoid">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Saídas por Categoria</h3>
          <div className="h-64 flex justify-center items-center">
            {chartsData.pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartsData.pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => `R$ ${val.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-400 text-sm">Nenhuma saída registrada este mês</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Income List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden break-inside-avoid">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <FileText className="text-emerald-600 w-5 h-5" />
            <h3 className="text-lg font-semibold text-slate-800">Detalhamento de Entradas (Mês Atual)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-6 py-3">Data</th>
                  {currentSector === 'ALL' && <th className="px-6 py-3">Setor</th>}
                  <th className="px-6 py-3">Descrição / Membro</th>
                  <th className="px-6 py-3">Método</th>
                  <th className="px-6 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.incomeTransactions.length > 0 ? (
                  metrics.incomeTransactions.map((tx) => {
                    const memberName = tx.memberId ? members.find(m => m.id === tx.memberId)?.fullName : null;
                    const displayDescription = tx.type === TransactionType.TITHE 
                      ? `Dízimo de ${memberName || 'Desconhecido'}` 
                      : (tx.description || memberName || 'Oferta');
                    
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="px-6 py-3">{formatDate(tx.date)}</td>
                        {currentSector === 'ALL' && (
                          <td className="px-6 py-3">
                             <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                               {getSectorName(tx.sector)}
                             </span>
                          </td>
                        )}
                        <td className="px-6 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">{displayDescription}</span>
                            <span className="text-xs text-emerald-600 font-medium">{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-3 h-3 text-slate-400" />
                            <span>{tx.paymentMethod || 'Dinheiro'}</span>
                            {tx.paymentMethod === PaymentMethod.PIX && (
                               <span className="text-xs bg-slate-100 px-1 rounded text-slate-500">Pix</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right font-medium text-emerald-600">
                          R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={currentSector === 'ALL' ? 5 : 4} className="px-6 py-8 text-center text-slate-500">
                      Nenhuma entrada registrada neste mês.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unpaid Tithers Alert List */}
        <div id="unpaid-list" className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden h-fit break-inside-avoid">
          <div className="p-6 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="text-amber-500 w-5 h-5" />
            <h3 className="text-lg font-semibold text-slate-800">Dizimistas Pendentes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  {currentSector === 'ALL' && <th className="px-4 py-3">Setor</th>}
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.unpaidTithers.length > 0 ? (
                  metrics.unpaidTithers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{member.fullName}</div>
                        <div className="text-xs text-slate-400">{member.role}</div>
                      </td>
                      {currentSector === 'ALL' && (
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {getSectorName(member.sector)}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Pendente
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={currentSector === 'ALL' ? 3 : 2} className="px-4 py-8 text-center text-slate-500 text-xs">
                      Todos os dizimistas estão em dia!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;