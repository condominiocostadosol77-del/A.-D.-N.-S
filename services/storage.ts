import { Member, Transaction, User, Sector, Discipline } from '../types';
import { supabase } from './supabase';

// --- Helpers for Type Mapping ---

// Mapper function to convert snake_case DB fields to camelCase TS interfaces
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
  member_id: t.memberId,
  description: t.description,
  category: t.category,
  receipt_url: t.receiptUrl,
  payment_method: t.paymentMethod,
  pix_destination: t.pixDestination,
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
    // 1. Create Auth User
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
    });

    if (authError || !authData.user) {
      console.error('Auth Error:', authError);
      return false;
    }

    // 2. Create Public Profile
    const { error: profileError } = await supabase.from('app_users').insert({
      id: authData.user.id,
      email: user.email,
      name: user.name
    });

    if (profileError) {
      console.error('Profile Error:', profileError);
      return false;
    }

    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) return null;

    // Get user profile for the name
    const { data: profile } = await supabase
      .from('app_users')
      .select('name')
      .eq('id', data.user.id)
      .single();

    return {
      email: data.user.email || email,
      name: profile?.name || 'Administrador'
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const logoutUser = async () => {
    await supabase.auth.signOut();
}

export const getCurrentSession = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session;
}

export const getUsers = async (): Promise<User[]> => {
  const { data, error } = await supabase.from('app_users').select('*');
  if (error) {
      console.error(error);
      return [];
  }
  return data.map((u: any) => ({
    email: u.email,
    name: u.name
  }));
};

export const deleteUser = async (email: string): Promise<void> => {
  // Nota: Deletar usuário do Supabase Auth exige Service Role Key (backend).
  // Do client-side, podemos apenas remover da tabela 'app_users', o que remove acesso visual,
  // mas o login ainda funcionaria. Para uma app completa, isso deveria ser uma Edge Function.
  // Por enquanto, deletaremos da tabela de referência.
  await supabase.from('app_users').delete().eq('email', email);
};

// --- Sectors CRUD ---

export const getSectors = async (): Promise<Sector[]> => {
  const { data, error } = await supabase.from('sectors').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data;
};

export const saveSectors = async (sectors: Sector[]): Promise<void> => {
  // Upsert all sectors
  const { error } = await supabase.from('sectors').upsert(sectors);
  if (error) console.error(error);
};

// --- Members CRUD ---

export const getMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase.from('members').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data.map(mapMemberFromDB);
};

export const saveMember = async (member: Member): Promise<Member> => {
  const dbMember = mapMemberToDB(member);
  const { error } = await supabase.from('members').upsert(dbMember);
  if (error) {
      console.error(error);
      throw error;
  }
  return member;
};

export const deleteMember = async (id: string): Promise<void> => {
  const { error } = await supabase.from('members').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Disciplines CRUD ---

export const getDisciplines = async (): Promise<Discipline[]> => {
  const { data, error } = await supabase.from('disciplines').select('*');
  if (error) {
      console.error(error);
      return [];
  }
  return data.map(mapDisciplineFromDB);
};

export const saveDiscipline = async (discipline: Discipline): Promise<Discipline> => {
  const dbDisc = mapDisciplineToDB(discipline);
  const { error } = await supabase.from('disciplines').upsert(dbDisc);
  if (error) {
      console.error(error);
      throw error;
  }
  return discipline;
};

export const deleteDiscipline = async (id: string): Promise<void> => {
  const { error } = await supabase.from('disciplines').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Transactions CRUD ---

export const getTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*');
  if (error) {
    console.error(error);
    return [];
  }
  return data.map(mapTransactionFromDB);
};

export const saveTransaction = async (transaction: Transaction): Promise<Transaction> => {
  const dbTx = mapTransactionToDB(transaction);
  const { error } = await supabase.from('transactions').upsert(dbTx);
  if (error) {
      console.error(error);
      throw error;
  }
  return transaction;
};

export const deleteTransaction = async (id: string): Promise<void> => {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error(error);
};

// --- Helpers ---

export const getMemberById = async (id: string): Promise<Member | undefined> => {
  const { data, error } = await supabase.from('members').select('*').eq('id', id).single();
  if (error || !data) return undefined;
  return mapMemberFromDB(data);
};

export const seedDatabase = async () => {
  // Check if sectors exist
  const sectors = await getSectors();
  if (sectors.length === 0) {
    const defaultSectors: Sector[] = [
      { id: 'SEDE', name: 'Sede Principal' },
      { id: 'SETOR_1', name: 'Setor 1' },
      { id: 'SETOR_2', name: 'Setor 2' }
    ];
    await saveSectors(defaultSectors);
    console.log('Database seeded with default sectors');
  }
};