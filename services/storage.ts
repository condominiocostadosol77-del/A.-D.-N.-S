import { Member, Transaction, TransactionType, User, Sector, Discipline } from '../types';

// Keys for LocalStorage
const MEMBERS_KEY = 'ecclesia_members';
const TRANSACTIONS_KEY = 'ecclesia_transactions';
const USERS_KEY = 'ecclesia_users';
const SECTORS_KEY = 'ecclesia_sectors';
const DISCIPLINES_KEY = 'ecclesia_disciplines';

// Simulation of a delay to mimic network requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Auth & Users ---

export const registerUser = async (user: User & { password: string }): Promise<boolean> => {
  await delay(500);
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  // Check if email already exists
  if (users.find((u: any) => u.email === user.email)) {
    return false;
  }
  
  users.push(user);
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  return true;
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  await delay(500);
  const usersStr = localStorage.getItem(USERS_KEY);
  const users = usersStr ? JSON.parse(usersStr) : [];
  
  const user = users.find((u: any) => u.email === email && u.password === password);
  
  if (user) {
    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
  }
  return null;
};

export const getUsers = async (): Promise<User[]> => {
  await delay(300);
  const usersStr = localStorage.getItem(USERS_KEY);
  if (!usersStr) return [];
  const users = JSON.parse(usersStr);
  // Return users without passwords
  return users.map((u: any) => {
    const { password: _, ...safeUser } = u;
    return safeUser;
  });
};

export const deleteUser = async (email: string): Promise<void> => {
  await delay(300);
  const usersStr = localStorage.getItem(USERS_KEY);
  if (!usersStr) return;
  const users = JSON.parse(usersStr);
  const newUsers = users.filter((u: any) => u.email !== email);
  localStorage.setItem(USERS_KEY, JSON.stringify(newUsers));
};

// --- Sectors CRUD ---

export const getSectors = async (): Promise<Sector[]> => {
  // No delay here for UI responsiveness on load
  const data = localStorage.getItem(SECTORS_KEY);
  if (!data) return [];
  return JSON.parse(data);
};

export const saveSectors = async (sectors: Sector[]): Promise<void> => {
  localStorage.setItem(SECTORS_KEY, JSON.stringify(sectors));
};

// --- Members CRUD ---

export const getMembers = async (): Promise<Member[]> => {
  await delay(300);
  const data = localStorage.getItem(MEMBERS_KEY);
  // Migration fallback: if sector is missing, default to SEDE
  const members = data ? JSON.parse(data) : [];
  return members.map((m: any) => ({ ...m, sector: m.sector || 'SEDE' }));
};

export const saveMember = async (member: Member): Promise<Member> => {
  await delay(300);
  const members = await getMembers();
  const existingIndex = members.findIndex(m => m.id === member.id);
  
  let newMembers;
  if (existingIndex >= 0) {
    newMembers = [...members];
    newMembers[existingIndex] = member;
  } else {
    newMembers = [...members, member];
  }
  
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
  return member;
};

export const deleteMember = async (id: string): Promise<void> => {
  await delay(300);
  const members = await getMembers();
  const newMembers = members.filter(m => m.id !== id);
  localStorage.setItem(MEMBERS_KEY, JSON.stringify(newMembers));
};

// --- Disciplines CRUD ---

export const getDisciplines = async (): Promise<Discipline[]> => {
  await delay(300);
  const data = localStorage.getItem(DISCIPLINES_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveDiscipline = async (discipline: Discipline): Promise<Discipline> => {
  await delay(300);
  const disciplines = await getDisciplines();
  const existingIndex = disciplines.findIndex(d => d.id === discipline.id);

  let newDisciplines;
  if (existingIndex >= 0) {
    newDisciplines = [...disciplines];
    newDisciplines[existingIndex] = discipline;
  } else {
    newDisciplines = [...disciplines, discipline];
  }

  localStorage.setItem(DISCIPLINES_KEY, JSON.stringify(newDisciplines));
  return discipline;
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  await delay(300);
  const disciplines = await getDisciplines();
  const newDisciplines = disciplines.filter(d => d.id !== id);
  localStorage.setItem(DISCIPLINES_KEY, JSON.stringify(newDisciplines));
};

// --- Transactions CRUD ---

export const getTransactions = async (): Promise<Transaction[]> => {
  await delay(300);
  const data = localStorage.getItem(TRANSACTIONS_KEY);
  // Migration fallback
  const txs = data ? JSON.parse(data) : [];
  return txs.map((t: any) => ({ ...t, sector: t.sector || 'SEDE' }));
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction> => {
  await delay(300);
  const transactions = await getTransactions();
  const existingIndex = transactions.findIndex(t => t.id === transaction.id);

  let newTransactions;
  if (existingIndex >= 0) {
    newTransactions = [...transactions];
    newTransactions[existingIndex] = transaction;
  } else {
    newTransactions = [...transactions, transaction];
  }

  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
  return transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await delay(300);
  const transactions = await getTransactions();
  const newTransactions = transactions.filter(t => t.id !== id);
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
};

// --- Helpers ---

export const getMemberById = async (id: string): Promise<Member | undefined> => {
  const members = await getMembers();
  return members.find(m => m.id === id);
};

export const seedDatabase = () => {
  // Seed Sectors
  if (!localStorage.getItem(SECTORS_KEY)) {
    const defaultSectors: Sector[] = [
      { id: 'SEDE', name: 'Sede Principal' },
      { id: 'SETOR_1', name: 'Setor 1' },
      { id: 'SETOR_2', name: 'Setor 2' }
    ];
    localStorage.setItem(SECTORS_KEY, JSON.stringify(defaultSectors));
  }

  // Seed Members
  if (!localStorage.getItem(MEMBERS_KEY)) {
    const dummyMembers: Member[] = [
      {
        id: '1',
        fullName: 'João Silva',
        birthDate: '1980-05-15',
        phone: '(11) 99999-9999',
        email: 'joao@example.com',
        address: 'Rua das Flores, 123',
        role: 'Diácono' as any,
        isTither: true,
        sector: 'SEDE',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        fullName: 'Maria Souza',
        birthDate: '1992-10-20',
        phone: '(11) 98888-8888',
        email: 'maria@example.com',
        address: 'Av. Paulista, 1000',
        role: 'Músico' as any,
        isTither: true,
        sector: 'SETOR_1',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        fullName: 'Pedro Rocha',
        birthDate: '2000-01-05',
        phone: '(21) 97777-7777',
        email: 'pedro@example.com',
        address: 'Rua Augusta, 500',
        role: 'Membro' as any,
        isTither: false,
        sector: 'SETOR_2',
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(MEMBERS_KEY, JSON.stringify(dummyMembers));
  }
};