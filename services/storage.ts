import { Member, Transaction, User, Sector, Discipline, Asset, WorkProject } from '../types';

// Simula um pequeno delay de rede para parecer mais natural
const DELAY = 300;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- LocalStorage Keys ---
const KEYS = {
  MEMBERS: 'app_members',
  TRANSACTIONS: 'app_transactions',
  DISCIPLINES: 'app_disciplines',
  SECTORS: 'app_sectors',
  USERS: 'app_users',
  SESSION: 'app_session',
  ASSETS: 'app_assets',     // NEW
  WORKS: 'app_works'        // NEW
};

// --- Helpers ---
const getList = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

const saveList = (key: string, list: any[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

// --- Auth ---

export const registerUser = async (user: User & { password: string }): Promise<boolean> => {
  await sleep(DELAY);
  const users = getList<User & { password: string }>(KEYS.USERS);
  
  if (users.find(u => u.email === user.email)) return false;
  
  users.push(user);
  saveList(KEYS.USERS, users);
  
  // Auto login
  localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: { email: user.email, name: user.name } }));
  return true;
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  await sleep(DELAY);
  const users = getList<User & { password: string }>(KEYS.USERS);
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    const sessionUser = { email: user.email, name: user.name };
    localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: sessionUser }));
    return sessionUser;
  }
  return null;
};

export const logoutUser = async () => {
  localStorage.removeItem(KEYS.SESSION);
};

export const getCurrentSession = async () => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const getUsers = async (): Promise<User[]> => {
    return getList<User>(KEYS.USERS).map(u => ({ name: u.name, email: u.email }));
}

export const deleteUser = async (email: string): Promise<void> => {
    const users = getList<User>(KEYS.USERS);
    saveList(KEYS.USERS, users.filter(u => u.email !== email));
}

// --- Sectors ---

export const getSectors = async (): Promise<Sector[]> => {
  await sleep(DELAY);
  return getList<Sector>(KEYS.SECTORS);
};

export const saveSectors = async (sectors: Sector[]): Promise<void> => {
  await sleep(DELAY);
  saveList(KEYS.SECTORS, sectors);
};

// --- Members ---

export const getMembers = async (): Promise<Member[]> => {
  await sleep(DELAY);
  return getList<Member>(KEYS.MEMBERS);
};

export const saveMember = async (member: Member): Promise<Member> => {
  await sleep(DELAY);
  const members = getList<Member>(KEYS.MEMBERS);
  const index = members.findIndex(m => m.id === member.id);
  
  if (index >= 0) members[index] = member;
  else members.push(member);
  
  saveList(KEYS.MEMBERS, members);
  return member;
};

export const deleteMember = async (id: string): Promise<void> => {
  await sleep(DELAY);
  const members = getList<Member>(KEYS.MEMBERS);
  saveList(KEYS.MEMBERS, members.filter(m => m.id !== id));
};

// --- Disciplines ---

export const getDisciplines = async (): Promise<Discipline[]> => {
  await sleep(DELAY);
  return getList<Discipline>(KEYS.DISCIPLINES);
};

export const saveDiscipline = async (discipline: Discipline): Promise<Discipline> => {
  await sleep(DELAY);
  const list = getList<Discipline>(KEYS.DISCIPLINES);
  const index = list.findIndex(d => d.id === discipline.id);
  
  if (index >= 0) list[index] = discipline;
  else list.push(discipline);
  
  saveList(KEYS.DISCIPLINES, list);
  return discipline;
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  await sleep(DELAY);
  const list = getList<Discipline>(KEYS.DISCIPLINES);
  saveList(KEYS.DISCIPLINES, list.filter(d => d.id !== id));
};

// --- Transactions ---

export const getTransactions = async (): Promise<Transaction[]> => {
  await sleep(DELAY);
  return getList<Transaction>(KEYS.TRANSACTIONS);
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction> => {
  await sleep(DELAY);
  const list = getList<Transaction>(KEYS.TRANSACTIONS);
  const index = list.findIndex(t => t.id === transaction.id);
  
  if (index >= 0) list[index] = transaction;
  else list.push(transaction);
  
  saveList(KEYS.TRANSACTIONS, list);
  return transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  await sleep(DELAY);
  const list = getList<Transaction>(KEYS.TRANSACTIONS);
  saveList(KEYS.TRANSACTIONS, list.filter(t => t.id !== id));
};

// --- Assets (Patrimônio) ---

export const getAssets = async (): Promise<Asset[]> => {
  await sleep(DELAY);
  return getList<Asset>(KEYS.ASSETS);
};

export const saveAsset = async (asset: Asset): Promise<Asset> => {
  await sleep(DELAY);
  const list = getList<Asset>(KEYS.ASSETS);
  const index = list.findIndex(a => a.id === asset.id);
  
  if (index >= 0) list[index] = asset;
  else list.push(asset);
  
  saveList(KEYS.ASSETS, list);
  return asset;
};

export const deleteAsset = async (id: string): Promise<void> => {
  await sleep(DELAY);
  const list = getList<Asset>(KEYS.ASSETS);
  saveList(KEYS.ASSETS, list.filter(a => a.id !== id));
};

// --- Works (Obras) ---

export const getWorks = async (): Promise<WorkProject[]> => {
  await sleep(DELAY);
  return getList<WorkProject>(KEYS.WORKS);
};

export const saveWork = async (work: WorkProject): Promise<WorkProject> => {
  await sleep(DELAY);
  const list = getList<WorkProject>(KEYS.WORKS);
  const index = list.findIndex(w => w.id === work.id);
  
  if (index >= 0) list[index] = work;
  else list.push(work);
  
  saveList(KEYS.WORKS, list);
  return work;
};

export const deleteWork = async (id: string): Promise<void> => {
  await sleep(DELAY);
  const list = getList<WorkProject>(KEYS.WORKS);
  saveList(KEYS.WORKS, list.filter(w => w.id !== id));
};

// --- Seed ---

export const seedDatabase = async () => {
  const sectors = getList<Sector>(KEYS.SECTORS);
  if (sectors.length === 0) {
    const defaultSectors: Sector[] = [
      { id: 'SEDE', name: 'Sede Principal' },
      { id: 'SETOR_1', name: 'Setor 1' },
      { id: 'SETOR_2', name: 'Setor 2' }
    ];
    saveList(KEYS.SECTORS, defaultSectors);
  }
  
  // Create default admin if none exists
  const users = getList(KEYS.USERS);
  if (users.length === 0) {
      const defaultAdmin = {
          name: 'Administrador',
          email: 'admin@igreja.com',
          password: 'admin' 
      };
      saveList(KEYS.USERS, [defaultAdmin]);
  }
};
