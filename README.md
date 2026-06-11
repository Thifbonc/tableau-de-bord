# Notre tableau de bord partagé

Une page d'accueil dans l'esprit de **start.me** : un agenda commun (modifiable par tous),
des notes/to-do partagées, des liens, une horloge et la météo.

- **Agenda** : créer un créneau (clique-glisse), le déplacer, le redimensionner, le renommer, le supprimer.
- **Partage temps réel** : tout le monde voit et modifie le même contenu, instantanément (via Firebase).
- **Hébergement gratuit** : GitHub Pages.
- **Fonctionne sans rien installer** : tant que Firebase n'est pas configuré, le site marche en *mode local* (données stockées sur ton appareil uniquement).

---

## 1. Tester tout de suite (mode local)

Double-clique sur `index.html` (ou ouvre-le dans ton navigateur).
Tout fonctionne, mais **rien n'est partagé** : c'est juste pour voir le rendu.

---

## 2. Activer le partage en temps réel (Firebase) — gratuit

1. Va sur https://console.firebase.google.com → **Ajouter un projet** (donne-lui un nom, le reste par défaut).
2. Dans le menu de gauche : **Créer (Build) → Realtime Database → Créer une base de données**.
   - Choisis un emplacement (Europe de préférence).
   - Démarre en **mode test** (on durcira après).
3. En haut à gauche, l'icône ⚙️ → **Paramètres du projet → Vos applications → icône Web `</>`**.
   - Donne un surnom, **enregistre l'app**.
   - Firebase affiche un objet `firebaseConfig` : **copie ces valeurs**.
4. Ouvre `config.js` dans ce dossier et remplace les `"REMPLACE_MOI"` par tes valeurs.
   - ⚠️ Vérifie bien la ligne `databaseURL` (visible dans l'onglet *Realtime Database*, ressemble à `https://xxxx-default-rtdb.europe-west1.firebasedatabase.app`).
5. Recharge la page → la bannière indique **« Mode partagé activé »**. 🎉

### Règles de sécurité de la base

Le **mode test** expire au bout de 30 jours. Comme tu veux que *tout le monde* puisse lire et écrire,
va dans **Realtime Database → Règles** et mets :

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

> ⚠️ Avec ces règles, n'importe qui ayant l'URL peut tout modifier (c'est voulu ici).
> Ne mets aucune donnée sensible. Si tu veux protéger l'accès plus tard, on pourra ajouter
> un mot de passe ou une authentification Firebase.

---

## 3. Mettre en ligne sur GitHub Pages

1. Crée un dépôt sur GitHub (ex. `tableau-de-bord`).
2. Envoie les fichiers de ce dossier dans le dépôt :

   ```bash
   cd mon-dashboard
   git init
   git add .
   git commit -m "Premier tableau de bord partagé"
   git branch -M main
   git remote add origin https://github.com/TON-PSEUDO/tableau-de-bord.git
   git push -u origin main
   ```

3. Sur GitHub : **Settings → Pages → Source = `main` / `/root` → Save**.
4. Au bout d'une minute, ton site est en ligne à :
   `https://TON-PSEUDO.github.io/tableau-de-bord/`

Partage ce lien : tout le monde pourra voir et modifier l'agenda en commun.

---

## Fichiers

| Fichier       | Rôle                                            |
|---------------|-------------------------------------------------|
| `index.html`  | Structure de la page                            |
| `style.css`   | Apparence (thème sombre)                        |
| `config.js`   | **Tes clés Firebase** + ville météo             |
| `app.js`      | Toute la logique (agenda, notes, liens, météo)  |

## Personnaliser

- **Ville météo** : change `WEATHER_CITY` dans `config.js`.
- **Couleurs** : modifie les variables `--accent`, `--bg`, etc. en haut de `style.css`.
- **Titre** : change le `<h1>` dans `index.html`.
