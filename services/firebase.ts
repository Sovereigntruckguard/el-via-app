// services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Configuración de Firebase para EL-VÍA
const firebaseConfig = {
  apiKey: "AIzaSyC0C9RUyqx-aahYp9K4JCw9l6x6kRxeGi8",
  authDomain: "el-via.firebaseapp.com",
  projectId: "el-via",
  storageBucket: "el-via.firebasestorage.app",
  messagingSenderId: "1053251233326",
  appId: "1:1053251233326:web:928ef0e5c26df1ee4c21bf",
  // measurementId no es necesario en React Native
};

// Inicializar la app de Firebase (una sola vez)
const app = initializeApp(firebaseConfig);

// Obtener instancia de Auth tipada
const auth: Auth = getAuth(app);

export { app, auth };

