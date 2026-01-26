import React, { useEffect, useState, useMemo } from 'react';
import { 
  Users, 
  AlertCircle,
  Printer,
  PieChart as PieChartIcon,
  Cake,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';
import { Member, Sector, Discipline } from '../types';
import * as storage from '../services/storage';

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

interface DashboardProps {
  currentSector: string;
  sectors: Sector[];
}

const Dashboard: React.FC<DashboardProps> = ({ currentSector, sectors }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Month State for Birthdays (0-11)
  const [birthdayMonth, setBirthdayMonth] = useState(new Date().getMonth());

  useEffect(() => {
    const fetchData = async () => {
      if (members.length === 0) setLoading(true);
      
      const [mems, discs] = await Promise.all([
        storage.getMembers(),
        storage.getDisciplines()
      ]);
      setMembers(mems);
      setDisciplines(discs);
      setLoading(false);
    };
    fetchData();
  }, []); 

  // --- Optimization: Memoize computations ---
  
  const { 
      filteredMembers, 
      activeDisciplinesCount,
      birthdays
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

      // Filter Birthdays for selected month
      const bdays = fMembers.filter(m => {
          if (!m.birthDate) return false;
          // Split date string YYYY-MM-DD to convert safely
          const parts = m.birthDate.split('-');
          if (parts.length !== 3) return false;
          // parts[1] is month (01-12), convert to 0-11
          const monthIndex = parseInt(parts[1], 10) - 1;
          return monthIndex === birthdayMonth;
      }).sort((a, b) => {
          // Sort by day of month
          const dayA = parseInt(a.birthDate.split('-')[2], 10);
          const dayB = parseInt(b.birthDate.split('-')[2], 10);
          return dayA - dayB;
      });

      return {
          filteredMembers: fMembers,
          activeDisciplinesCount: activeDiscs.length,
          birthdays: bdays
      };
  }, [members, disciplines, currentSector, birthdayMonth]);

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

  // Helper for Month Name
  const getMonthName = (monthIndex: number) => {
      const date = new Date();
      date.setMonth(monthIndex);
      return date.toLocaleString('pt-BR', { month: 'long' });
  };

  const handlePrevMonth = () => {
      setBirthdayMonth(prev => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
      setBirthdayMonth(prev => (prev === 11 ? 0 : prev + 1));
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 break-inside-avoid">
          {/* Members by Role Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                  <PieChartIcon className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Distribuição por Cargos</h3>
              </div>
              <div className="h-80 w-full">
                {roleData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                        <Pie
                            data={roleData}
                            cx="50%"
                            cy="50%"
                            innerRadius={80}
                            outerRadius={120}
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
                            wrapperStyle={{ fontSize: '13px' }}
                            formatter={(value, entry: any) => {
                              const { payload } = entry;
                              return <span className="text-slate-600 ml-2">{value} <strong className="ml-1 text-slate-800">({payload.value})</strong></span>;
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

          {/* Birthdays Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-[400px]">
              <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                      <Cake className="w-5 h-5 text-pink-500" />
                      <h3 className="text-lg font-semibold text-slate-800">Aniversariantes</h3>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      <button onClick={handlePrevMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="w-24 text-center text-sm font-bold text-slate-700 capitalize select-none">
                          {getMonthName(birthdayMonth)}
                      </span>
                      <button onClick={handleNextMonth} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all">
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                      </button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {birthdays.length > 0 ? (
                      <div className="space-y-3">
                          {birthdays.map((member) => {
                              const day = member.birthDate.split('-')[2];
                              return (
                                  <div key={member.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-100 hover:bg-pink-50/50 transition-colors">
                                      <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex flex-col items-center justify-center font-bold shadow-sm">
                                          <span className="text-xs uppercase leading-none">Dia</span>
                                          <span className="text-lg leading-none">{day}</span>
                                      </div>
                                      <div>
                                          <p className="font-medium text-slate-800">{member.fullName}</p>
                                          <p className="text-xs text-slate-500">{member.role} • {getSectorName(member.sector)}</p>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <Cake className="w-12 h-12 mb-3 opacity-20" />
                          <p>Nenhum aniversariante em <span className="capitalize">{getMonthName(birthdayMonth)}</span>.</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;