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
  apiKey:        "AIzaSyAiY5ThKPC7JTzZmsO495zdYLqQIZCBopY",
  authDomain:    "tableau-de-bord-46c49.firebaseapp.com",
  databaseURL:   "https://tableau-de-bord-46c49-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:     "tableau-de-bord-46c49",
  storageBucket: "tableau-de-bord-46c49.firebasestorage.app",
  messagingSenderId: "34645571738",
  appId:         "1:34645571738:web:15e26009696b45f8a78723"
};

// Ville affichée pour la météo (laisse vide pour utiliser ta position GPS si autorisée)
const WEATHER_CITY = "Paris";
