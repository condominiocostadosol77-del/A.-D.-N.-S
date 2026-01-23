import { Member, Transaction, User, Sector, Discipline, Asset, WorkProject } from '../types';
import { db, isFirebaseInitialized } from './firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  query,
  where
} from 'firebase/firestore';

// Delay simulado apenas para LocalStorage para UX consistente
const DELAY = 300;
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- LocalStorage Keys (Fallback) ---
const KEYS = {
  MEMBERS: 'app_members',
  TRANSACTIONS: 'app_transactions',
  DISCIPLINES: 'app_disciplines',
  SECTORS: 'app_sectors',
  USERS: 'app_users',
  SESSION: 'app_session',
  ASSETS: 'app_assets',
  WORKS: 'app_works'
};

// --- Helpers para LocalStorage ---
const getListLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) { return []; }
};

const saveListLocal = (key: string, list: any[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

// ==========================================
// MÉTODOS DE ARMAZENAMENTO (HÍBRIDO)
// ==========================================

// --- Auth ---

export const registerUser = async (user: User & { password: string }): Promise<boolean> => {
  if (isFirebaseInitialized) {
     try {
         const q = query(collection(db, 'users'), where("email", "==", user.email));
         const querySnapshot = await getDocs(q);
         if (!querySnapshot.empty) return false;

         await addDoc(collection(db, 'users'), user);
         localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: { email: user.email, name: user.name } }));
         return true;
     } catch (e) {
         console.error("Erro ao registrar usuário no Firebase:", e);
         return false;
     }
  } else {
    await sleep(DELAY);
    const users = getListLocal<User & { password: string }>(KEYS.USERS);
    if (users.find(u => u.email === user.email)) return false;
    users.push(user);
    saveListLocal(KEYS.USERS, users);
    localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: { email: user.email, name: user.name } }));
    return true;
  }
};

export const loginUser = async (email: string, password: string): Promise<User | null> => {
  if (isFirebaseInitialized) {
      try {
          const q = query(collection(db, 'users'), where("email", "==", email), where("password", "==", password));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const userData = querySnapshot.docs[0].data() as User;
              const sessionUser = { email: userData.email, name: userData.name };
              localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: sessionUser }));
              return sessionUser;
          }
          return null;
      } catch (e) {
          console.error("Erro no login Firebase:", e);
          return null;
      }
  } else {
    await sleep(DELAY);
    const users = getListLocal<User & { password: string }>(KEYS.USERS);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const sessionUser = { email: user.email, name: user.name };
      localStorage.setItem(KEYS.SESSION, JSON.stringify({ user: sessionUser }));
      return sessionUser;
    }
    return null;
  }
};

export const logoutUser = async () => {
  localStorage.removeItem(KEYS.SESSION);
};

export const getCurrentSession = async () => {
  const session = localStorage.getItem(KEYS.SESSION);
  return session ? JSON.parse(session) : null;
};

export const getUsers = async (): Promise<User[]> => {
    if (isFirebaseInitialized) {
        try {
            const snapshot = await getDocs(collection(db, 'users'));
            return snapshot.docs.map(d => ({ name: d.data().name, email: d.data().email }));
        } catch (e) {
            console.error("Erro ao buscar usuários:", e);
            return [];
        }
    } else {
        return getListLocal<User>(KEYS.USERS).map(u => ({ name: u.name, email: u.email }));
    }
}

export const deleteUser = async (email: string): Promise<void> => {
    if (isFirebaseInitialized) {
        const q = query(collection(db, 'users'), where("email", "==", email));
        const snapshot = await getDocs(q);
        snapshot.forEach(async (d) => await deleteDoc(doc(db, 'users', d.id)));
    } else {
        const users = getListLocal<User>(KEYS.USERS);
        saveListLocal(KEYS.USERS, users.filter(u => u.email !== email));
    }
}

// --- Generic Helpers for Collections ---

const getCollection = async <T>(collectionName: string, localKey: string): Promise<T[]> => {
    if (isFirebaseInitialized) {
        try {
            const snapshot = await getDocs(collection(db, collectionName));
            return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as unknown as T[];
        } catch (e) {
            console.error(`Erro ao buscar coleção ${collectionName}:`, e);
            return [];
        }
    } else {
        await sleep(DELAY);
        return getListLocal<T>(localKey);
    }
}

const saveItem = async <T extends { id: string }>(collectionName: string, localKey: string, item: T): Promise<T> => {
    if (isFirebaseInitialized) {
        try {
            // Use setDoc with the specific ID to ensure IDs are consistent or update existing
            await setDoc(doc(db, collectionName, item.id), item);
            return item;
        } catch (e) {
            console.error(`Erro ao salvar em ${collectionName}:`, e);
            throw e; // Propagate error so UI knows it failed
        }
    } else {
        await sleep(DELAY);
        const list = getListLocal<T>(localKey);
        const index = list.findIndex((i: any) => i.id === item.id);
        if (index >= 0) list[index] = item;
        else list.push(item);
        saveListLocal(localKey, list);
        return item;
    }
}

const deleteItem = async (collectionName: string, localKey: string, id: string): Promise<void> => {
    if (isFirebaseInitialized) {
        try {
            await deleteDoc(doc(db, collectionName, id));
        } catch (e) {
            console.error(`Erro ao deletar de ${collectionName}:`, e);
        }
    } else {
        await sleep(DELAY);
        const list = getListLocal<any>(localKey);
        saveListLocal(localKey, list.filter(i => i.id !== id));
    }
}

// --- Specific Entity Implementations ---

// Sectors
export const getSectors = () => getCollection<Sector>('sectors', KEYS.SECTORS);
export const saveSectors = async (sectors: Sector[]) => {
    if (isFirebaseInitialized) {
        // Simplified: Save all current.
        for (const s of sectors) {
            await setDoc(doc(db, 'sectors', s.id), s);
        }
    } else {
        await sleep(DELAY);
        saveListLocal(KEYS.SECTORS, sectors);
    }
};

// Members
export const getMembers = () => getCollection<Member>('members', KEYS.MEMBERS);
export const saveMember = (m: Member) => saveItem('members', KEYS.MEMBERS, m);
export const deleteMember = (id: string) => deleteItem('members', KEYS.MEMBERS, id);

// Disciplines
export const getDisciplines = () => getCollection<Discipline>('disciplines', KEYS.DISCIPLINES);
export const saveDiscipline = (d: Discipline) => saveItem('disciplines', KEYS.DISCIPLINES, d);
export const deleteDiscipline = (id: string) => deleteItem('disciplines', KEYS.DISCIPLINES, id);

// Transactions
export const getTransactions = () => getCollection<Transaction>('transactions', KEYS.TRANSACTIONS);
export const saveTransaction = (t: Transaction) => saveItem('transactions', KEYS.TRANSACTIONS, t);
export const deleteTransaction = (id: string) => deleteItem('transactions', KEYS.TRANSACTIONS, id);

// Assets
export const getAssets = () => getCollection<Asset>('assets', KEYS.ASSETS);
export const saveAsset = (a: Asset) => saveItem('assets', KEYS.ASSETS, a);
export const deleteAsset = (id: string) => deleteItem('assets', KEYS.ASSETS, id);

// Works
export const getWorks = () => getCollection<WorkProject>('works', KEYS.WORKS);
export const saveWork = (w: WorkProject) => saveItem('works', KEYS.WORKS, w);
export const deleteWork = (id: string) => deleteItem('works', KEYS.WORKS, id);

// --- Seed ---

export const seedDatabase = async () => {
  const sectors = await getSectors();
  
  if (sectors.length === 0) {
    const defaultSectors: Sector[] = [
      { id: 'SEDE', name: 'Sede Principal' },
      { id: 'SETOR_1', name: 'Setor 1' },
      { id: 'SETOR_2', name: 'Setor 2' }
    ];
    
    if (isFirebaseInitialized) {
        for (const s of defaultSectors) await setDoc(doc(db, 'sectors', s.id), s);
    } else {
        saveListLocal(KEYS.SECTORS, defaultSectors);
    }
  }
  
  const users = await getUsers();
  if (users.length === 0) {
      const defaultAdmin = {
          name: 'Administrador',
          email: 'admin@igreja.com',
          password: 'admin' 
      };
      if (isFirebaseInitialized) {
          try {
             await addDoc(collection(db, 'users'), defaultAdmin);
          } catch(e) { console.error("Erro no seed de usuário", e); }
      } else {
          saveListLocal(KEYS.USERS, [defaultAdmin]);
      }
  }
};