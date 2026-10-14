import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Cole suas credenciais do Firebase aqui
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO-default-rtdb.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "000000000000",
  appId: "SEU_APP_ID",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
