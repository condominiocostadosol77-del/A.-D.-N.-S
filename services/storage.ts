import { Member, Transaction, User, Sector, Discipline } from '../types';
import { supabase } from './supabase';

// --- CACHE SYSTEM ---
// Armazena dados em memória para evitar requisições repetidas ao Supabase
const CACHE = {
  members: null as Member[] | null,
  transactions: null as Transaction[] | null,
  disciplines: null as Discipline[] | null,
  sectors: null as Sector[] | null,
  users: null as User[] | null,
  timestamp: 0
};

// Tempo de vida do cache em milissegundos (ex: 5 minutos)
// Se passar desse tempo, ele força uma nova busca no fundo
const CACHE_TTL = 5 * 60 * 1000; 

const isCacheValid = (key: keyof typeof CACHE) => {
  const now = Date.now();
  return CACHE[key] !== null && (now - CACHE.timestamp) < CACHE_TTL;
};

// Limpa o cache (usado no logout)
export const clearCache = () => {
  CACHE.members = null;
  CACHE.transactions = null;
  CACHE.disciplines = null;
  CACHE.sectors = null;
  CACHE.users = null;
  CACHE.timestamp = 0;
};

// --- Helpers for Type Mapping ---

const mapMemberFromDB = (m: any): Member => ({
  id: m.id,
  fullName: m.full_name,
  birthDate: m.birth_date,
  phone: m.phone,
  email: m.email,
  address: m.address,
  baptismDate: m.baptism_date,
  role: m.role,
  isTither: m.is_tither,
  sector: m.sector || 'SEDE',
  photoUrl: m.photo_url,
  createdAt: m.created_at
});

const mapMemberToDB = (m: Member) => ({
  id: m.id,
  full_name: m.fullName,
  birth_date: m.birthDate,
  phone: m.phone,
  email: m.email,
  address: m.address,
  baptism_date: m.baptismDate,
  role: m.role,
  is_tither: m.isTither,
  sector: m.sector,
  photo_url: m.photoUrl,
  created_at: m.createdAt
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t.id,
  type: t.type,
  date: t.date,
  amount: t.amount,
  memberId: t.member_id,
  description: t.description,
  category: t.category,
  receiptUrl: t.receipt_url,
  paymentMethod: t.payment_method,
  pixDestination: t.pix_destination,
  sector: t.sector || 'SEDE',
  responsible: t.responsible,
  createdAt: t.created_at
});

const mapTransactionToDB = (t: Transaction) => ({
  id: t.id,
  type: t.type,
  date: t.date,
  amount: t.amount,
  member_id: t.memberId || null,
  description: t.description || null,
  category: t.category || null,
  receipt_url: t.receiptUrl || null,
  payment_method: t.paymentMethod || null,
  pix_destination: t.pixDestination || null,
  sector: t.sector,
  created_at: t.createdAt
});

const mapDisciplineFromDB = (d: any): Discipline => ({
    id: d.id,
    memberId: d.member_id,
    reason: d.reason,
    startDate: d.start_date,
    endDate: d.end_date,
    sector: d.sector,
    createdAt: d.created_at
});

const mapDisciplineToDB = (d: Discipline) => ({
    id: d.id,
    member_id: d.memberId,
    reason: d.reason,
    start_date: d.startDate,
    end_date: d.endDate,
    sector: d.sector,
    created_at: d.createdAt
});

// --- Auth & Users ---

export const registerUser = async (user: User & { password: string }): Promise<boolean> => {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: { data: { full_name: user.name } }
    });

    if (authError && authError.message.includes("already registered")) {
        const loggedUser = await loginUser(user.email, user.password);
        return !!loggedUser;
    }

    if (authError) return false;

    if (authData.user) {
        await supabase.from('app_users').upsert({
            id: authData.user.id,
            email: user.email,
            name: user.name
        });
        return true;
    }
    return false;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return null;

    let { data: profile } = await supabase
      .from('app_users')
      .select('name')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
        const userName = data.user.user_metadata?.full_name || 'Administrador';
        await supabase.from('app_users').upsert({
            id: data.user.id,
            email: data.user.email,
            name: userName
        });
        profile = { name: userName };
    }

    return { email: data.user.email || email, name: profile?.name || 'Administrador' };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const logoutUser = async () => {
    clearCache(); // Limpa cache ao sair
    await supabase.auth.signOut();
}

export const getCurrentSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export const getUsers = async (): Promise<User[]> => {
  // Usuários raramente mudam, podemos confiar no cache se válido
  if (isCacheValid('users')) return CACHE.users!;

  const { data, error } = await supabase.from('app_users').select('*');
  if (error) return [];
  
  const users = data.map((u: any) => ({ email: u.email, name: u.name }));
  CACHE.users = users;
  return users;
};

export const deleteUser = async (email: string): Promise<void> => {
  await supabase.from('app_users').delete().eq('email', email);
  if (CACHE.users) {
      CACHE.users = CACHE.users.filter(u => u.email !== email);
  }
};

// --- Sectors CRUD ---

export const getSectors = async (): Promise<Sector[]> => {
  if (isCacheValid('sectors')) return CACHE.sectors!;

  const { data, error } = await supabase.from('sectors').select('*');
  if (error) return [];
  
  CACHE.sectors = data;
  CACHE.timestamp = Date.now(); // Atualiza timestamp global ao buscar algo importante
  return data;
};

export const saveSectors = async (sectors: Sector[]): Promise<void> => {
  const { error } = await supabase.from('sectors').upsert(sectors);
  if (error) console.error(error);
  CACHE.sectors = sectors; // Atualiza cache imediatamente
};

// --- Members CRUD ---

export const getMembers = async (forceRefresh = false): Promise<Member[]> => {
  if (!forceRefresh && isCacheValid('members')) return CACHE.members!;

  const { data, error } = await supabase.from('members').select('*');
  if (error) return [];
  
  const mapped = data.map(mapMemberFromDB);
  CACHE.members = mapped;
  CACHE.timestamp = Date.now();
  return mapped;
};

export const saveMember = async (member: Member): Promise<Member> => {
  const dbMember = mapMemberToDB(member);
  
  // Atualiza cache localmente ANTES do banco (Optimistic UI)
  if (CACHE.members) {
      const index = CACHE.members.findIndex(m => m.id === member.id);
      if (index >= 0) CACHE.members[index] = member;
      else CACHE.members.push(member);
  } else {
      CACHE.members = [member];
  }

  const { error } = await supabase.from('members').upsert(dbMember);
  if (error) throw error;
  
  return member;
};

export const deleteMember = async (id: string): Promise<void> => {
  // Remove do cache instantaneamente
  if (CACHE.members) {
      CACHE.members = CACHE.members.filter(m => m.id !== id);
  }

  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Disciplines CRUD ---

export const getDisciplines = async (): Promise<Discipline[]> => {
  if (isCacheValid('disciplines')) return CACHE.disciplines!;

  const { data, error } = await supabase.from('disciplines').select('*');
  if (error) return [];
  
  const mapped = data.map(mapDisciplineFromDB);
  CACHE.disciplines = mapped;
  return mapped;
};

export const saveDiscipline = async (discipline: Discipline): Promise<Discipline> => {
  if (CACHE.disciplines) {
      const index = CACHE.disciplines.findIndex(d => d.id === discipline.id);
      if (index >= 0) CACHE.disciplines[index] = discipline;
      else CACHE.disciplines.push(discipline);
  }

  const dbDisc = mapDisciplineToDB(discipline);
  const { error } = await supabase.from('disciplines').upsert(dbDisc);
  if (error) throw error;
  return discipline;
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  if (CACHE.disciplines) {
      CACHE.disciplines = CACHE.disciplines.filter(d => d.id !== id);
  }
  const { error } = await supabase.from('disciplines').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Transactions CRUD ---

export const getTransactions = async (forceRefresh = false): Promise<Transaction[]> => {
  if (!forceRefresh && isCacheValid('transactions')) return CACHE.transactions!;

  // Limitando a 2000 últimas transações para performance inicial se crescer muito
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(2000);
  
  if (error) return [];
  const mapped = data.map(mapTransactionFromDB);
  
  CACHE.transactions = mapped;
  CACHE.timestamp = Date.now();
  return mapped;
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction> => {
  // Atualiza cache local
  if (CACHE.transactions) {
      const index = CACHE.transactions.findIndex(t => t.id === transaction.id);
      if (index >= 0) CACHE.transactions[index] = transaction;
      else {
          CACHE.transactions.push(transaction);
          // Reordena por data para manter consistência visual
          CACHE.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }
  }

  const dbTx = mapTransactionToDB(transaction);
  const { error } = await supabase.from('transactions').upsert(dbTx);
  if (error) throw error;
  return transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  if (CACHE.transactions) {
      CACHE.transactions = CACHE.transactions.filter(t => t.id !== id);
  }
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Helpers ---

export const getMemberById = async (id: string): Promise<Member | undefined> => {
  // Tenta achar no cache primeiro
  if (CACHE.members) {
      const found = CACHE.members.find(m => m.id === id);
      if (found) return found;
  }

  const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapMemberFromDB(data);
};

export const seedDatabase = async () => {
  const sectors = await getSectors();
  if (sectors.length === 0) {
    const defaultSectors: Sector[] = [
      { id: 'SEDE', name: 'Sede Principal' },
      { id: 'SETOR_1', name: 'Setor 1' },
      { id: 'SETOR_2', name: 'Setor 2' }
    ];
    await saveSectors(defaultSectors);
  }
};