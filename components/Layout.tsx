import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  LogOut, 
  Menu,
  X,
  Church,
  MapPin,
  Settings,
  Gavel
} from 'lucide-react';
import { Sector } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  userEmail: string;
  currentSector: string;
  setCurrentSector: (sector: string) => void;
  sectors: Sector[];
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeTab, 
  setActiveTab, 
  onLogout, 
  userEmail,
  currentSector,
  setCurrentSector,
  sectors
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'members', label: 'Membros', icon: Users },
    { id: 'disciplines', label: 'Disciplina', icon: Gavel },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  const handleSectorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentSector(e.target.value);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col md:flex-row overflow-hidden print:h-auto print:overflow-visible">
      {/* Mobile Header */}
      <div className="md:hidden bg-emerald-700 text-white p-4 flex justify-between items-center shadow-md z-50 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <Church className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <span className="font-bold text-sm truncate uppercase tracking-wide">A. D. NATIVIDADE DA SERRA</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex-shrink-0 ml-2">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition duration-200 ease-in-out
        bg-emerald-800 text-white w-64 flex-shrink-0 flex flex-col shadow-xl z-40
        h-full overflow-y-auto print:hidden
      `}>
        <div className="p-6 flex items-center gap-3 border-b border-emerald-700/50 flex-shrink-0">
          <div className="bg-amber-500 p-2 rounded-full flex-shrink-0">
            <Church className="w-6 h-6 text-emerald-900" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold font-serif tracking-wide uppercase leading-tight">
              A. D. NATIVIDADE DA SERRA
            </h1>
            <p className="text-[10px] text-emerald-300 mt-1">Gestão Eclesiástica</p>
          </div>
        </div>

        {/* Sector Selector */}
        <div className="px-4 py-4 border-b border-emerald-700/50 flex-shrink-0">
          <label className="text-xs text-emerald-300 uppercase font-semibold mb-2 block flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Localização / Setor
          </label>
          <select 
            value={currentSector}
            onChange={handleSectorChange}
            className="w-full bg-emerald-900 text-white text-sm rounded-lg border border-emerald-600 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 p-2 outline-none"
          >
            <option value="ALL">Visão Geral (Todos)</option>
            {sectors.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left border-l-4
                ${activeTab === item.id 
                  ? 'bg-emerald-700 text-amber-400 shadow-sm border-amber-400' 
                  : 'text-emerald-100 hover:bg-emerald-700/50 hover:text-white border-transparent'}
              `}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-emerald-700/50 bg-emerald-900/30 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-sm font-medium truncate">{userEmail}</p>
              <p className="text-xs text-emerald-400">Administrador</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-2 text-emerald-200 hover:text-red-300 px-2 py-2 text-sm transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50 relative print:overflow-visible print:h-auto print:w-full">
        <div className="max-w-7xl mx-auto print:max-w-none">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;