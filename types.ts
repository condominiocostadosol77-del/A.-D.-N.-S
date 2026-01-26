
export interface Sector {
  id: string;
  name: string;
}

export enum Role {
  PASTOR = 'Pastor',
  CO_PASTOR = 'Co-pastor',
  ELDER = 'Presbítero',
  EVANGELIST = 'Evangelista',
  DEACON = 'Diácono',
  WORKER = 'Cooperador',
  COORDINATOR = 'Coordenador(a)',
  TEACHER = 'Professor',
  CONDUCTOR = 'Maestro',
  REGENT = 'Regente',
  MUSICIAN = 'Músico',
  MEMBER = 'Membro'
}

export interface Member {
  id: string;
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  address: string;
  baptismDate?: string;
  isBaptized?: boolean; // Novo campo
  role: Role;
  isTither: boolean;
  sector: string; 
  photoUrl?: string;
  createdAt: string;
}

export interface Discipline {
  id: string;
  memberId: string;
  reason: string;
  startDate: string;
  endDate: string;
  sector: string;
  createdAt: string;
}

export enum TransactionType {
  TITHE = 'Dízimo',
  TITHE_RECORD = 'Registro de Dízimo',
  OFFERING = 'Oferta',
  SPECIAL_OFFERING = 'Oferta Especial',
  EXPENSE = 'Saída'
}

export enum ExpenseCategory {
  MAINTENANCE = 'Manutenção',
  EVENTS = 'Eventos',
  SALARY = 'Salários',
  MISSIONS = 'Missões',
  UTILITIES = 'Contas (Água/Luz)',
  OTHER = 'Outros'
}

export enum PaymentMethod {
  CASH = 'Dinheiro',
  PIX = 'Pix',
  CARD = 'Cartão',
  TRANSFER = 'Transferência'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  date: string;
  amount: number;
  memberId?: string;
  description?: string;
  category?: ExpenseCategory;
  receiptUrl?: string;
  responsible?: string;
  paymentMethod?: PaymentMethod;
  pixDestination?: string;
  sector: string;
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
}

// --- NEW TYPES FOR ASSETS & WORKS ---

export enum AssetCondition {
  NEW = 'Novo',
  GOOD = 'Bom',
  FAIR = 'Regular',
  POOR = 'Ruim/Danificado',
  DISCARDED = 'Baixado/Descartado'
}

export interface Asset {
  id: string;
  name: string;
  description?: string;
  acquisitionDate: string;
  value: number;
  quantity: number;
  condition: AssetCondition;
  location: string; // Specific room or detail within sector
  sector: string;
  photoUrl?: string;
  createdAt: string;
}

export enum WorkStatus {
  PLANNING = 'Planejamento',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída',
  PAUSED = 'Paralisada'
}

export interface WorkProject {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  status: WorkStatus;
  totalCost: number;
  sector: string;
  responsible?: string;
  receiptUrl?: string; // Mantido para legado
  receiptUrls?: string[]; // Novo campo para múltiplos anexos
  createdAt: string;
}