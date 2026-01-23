import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
  initializeFirestore, 
  CACHE_SIZE_UNLIMITED 
} from "firebase/firestore";

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyB-Bqjgo90RSPEB-uXBaKO6-_u8pWFk4B4",
  authDomain: "a-d-n-t-s.firebaseapp.com",
  projectId: "a-d-n-t-s",
  storageBucket: "a-d-n-t-s.firebasestorage.app",
  messagingSenderId: "175094061920",
  appId: "1:175094061920:web:f55e33e067b7d31a119c05"
};

let db: any = null;
let isFirebaseInitialized = false;

try {
    const app = initializeApp(firebaseConfig);
    
    // Inicializa o Firestore com configurações de cache ilimitado para melhor suporte offline
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });

    // Habilita persistência offline (funciona como o LocalStorage, mas sincroniza quando tem internet)
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code == 'failed-precondition') {
           // Múltiplas abas abertas podem bloquear a persistência
           console.warn('Persistência offline falhou: Múltiplas abas abertas. Feche outras abas do app.');
        } else if (err.code == 'unimplemented') {
           console.warn('O navegador atual não suporta persistência offline.');
        }
      });
      
    isFirebaseInitialized = true;
    console.log("Firebase conectado com sucesso!");
    
} catch (error) {
  console.error("Erro ao inicializar Firebase:", error);
  // O app continuará funcionando, mas cairá no fallback de LocalStorage definido no storage.ts
}

export { db, isFirebaseInitialized };