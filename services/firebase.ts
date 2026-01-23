import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

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
    // Inicialização simples e robusta do Firestore
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase inicializado com sucesso.");
} catch (error) {
  console.error("ERRO CRÍTICO: Falha ao conectar no Firebase:", error);
  // O app continuará funcionando via LocalStorage se o Firebase falhar
}

export { db, isFirebaseInitialized };