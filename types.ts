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
  role: Role;
  isTither: boolean;
  sector: string; // Changed to string to support dynamic IDs
  photoUrl?: string;
  createdAt: string;
}

export interface Discipline {
  id: string;
  memberId: string;
  reason: string;
  startDate: string;
  endDate: string;
  sector: string; // To filter by sector
  createdAt: string;
}

export enum TransactionType {
  TITHE = 'Dízimo', // Legacy (kept for safety)
  TITHE_RECORD = 'Registro de Dízimo', // New checkbox type
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
  sector: string; // Changed to string to support dynamic IDs
  createdAt: string;
}

export interface User {
  email: string;
  name: string;
}