// ============================================================
//  CONFIGURATION FIREBASE
// ------------------------------------------------------------
//  1. Va sur https://console.firebase.google.com
//  2. Crée un projet (gratuit) → "Realtime Database" → "Créer une base"
//     (choisis le mode "test" pour commencer, ou voir le README pour les règles)
//  3. Project Settings (⚙️) → "Vos applications" → ajoute une app Web (</>)
//  4. Copie l'objet de config ici-dessous (remplace les valeurs).
//
//  ⚠️ N'oublie pas "databaseURL" (visible dans l'onglet Realtime Database).
// ============================================================

const firebaseConfig = {
  apiKey:        "REMPLACE_MOI",
  authDomain:    "REMPLACE_MOI.firebaseapp.com",
  databaseURL:   "https://REMPLACE_MOI-default-rtdb.firebaseio.com",
  projectId:     "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId:         "REMPLACE_MOI"
};

// Ville affichée pour la météo (laisse vide pour utiliser ta position GPS si autorisée)
const WEATHER_CITY = "Paris";
