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
    // Inicialização do Firestore
    db = getFirestore(app);
    isFirebaseInitialized = true;
    console.log("Firebase conectado.");
} catch (error: any) {
  // Se o Firebase falhar (config inválida ou erro de importação),
  // o app continuará funcionando via LocalStorage (modo offline/fallback).
  console.warn("Aviso: Firebase não pôde ser inicializado. Usando armazenamento local (Offline Mode).");
  console.warn("Detalhes do erro:", error.message || error);
  isFirebaseInitialized = false;
  db = null;
}

export { db, isFirebaseInitialized };