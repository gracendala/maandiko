# Régie de Projection Pro - Prédications & Brochures

Application de régie de projection de sermons et brochures avec gestion de fichiers individuels dédiés (`.sermon`).

---

## 📁 Structure du projet et dossier `sermons_data`

Lorsque vous téléchargez le code source (ZIP) depuis Google AI Studio, **le dossier `sermons_data` n'existe pas encore** dans l'archive du code car il s'agit d'un dossier de stockage de données généré au moment de l'exécution de l'application.

### Comment le dossier `sermons_data` est créé :
1. Dès que vous lancez l'application en local avec `npm run dev` (ou `npm start`), le serveur crée automatiquement le dossier `sermons_data` s'il n'existe pas encore.
2. Si vous possédez déjà des fichiers `.sermon`, placez-les simplement à la racine du projet dans un dossier nommé `sermons_data`.
3. Vous pouvez également télécharger toutes les brochures actuelles de la version en ligne en cliquant sur le bouton **Base de Données** dans l'application, puis sur **"Télécharger toutes_les_brochures_sermons.zip"**, puis en décompressant ce ZIP dans `sermons_data`.

---

## 🚀 Guide d'installation et d'exécution en local

### 1. Prérequis
- **Node.js** (version 18 ou supérieure recommandée)
- **npm** (installé automatiquement avec Node.js)

### 2. Installation des dépendances
Ouvrez une fenêtre de terminal / invite de commandes dans le dossier du projet (`D:\régie-de-projection-pro`) et exécutez :

```bash
npm install
```

### 3. Lancement en mode Développement
Pour démarrer l'application :

```bash
npm run dev
```

L'application sera accessible dans votre navigateur web à l'adresse :
👉 **`http://localhost:3000`**

### 4. Lancement en mode Production (Optionnel)
Pour compiler et démarrer l'application optimisée :

```bash
npm run build
npm start
```

---

## 💻 Génération de l'application Windows Executable (`.exe`)

L'application est préconfigurée pour être encapsulée dans **Electron** et générer des exécuteurs **Windows (.exe)** autonomes (Installeur complet et version Portable).

### Pour générer le fichier `.exe` :
1. Dans votre terminal à la racine du projet, exécutez la commande :
```bash
npm run dist
```

2. Le processus va compiler le frontend, le serveur Express d'arrière-plan et créer un dossier nommé **`release/`** à la racine du projet.

3. Dans le dossier **`release/`**, vous trouverez :
   - 📦 **`ProText Live Setup 1.0.0.exe`** : L'installeur Windows complet avec raccourci bureau et menu démarrer.
   - 🚀 **`ProText Live 1.0.0.exe`** : La version portable exécutable directement sans installation.

---

## 🗄️ Avantages du stockage par brochure individuelle (`.sermon`)

- **Sécurité maximale** : Chaque brochure est sauvegardée dans son propre fichier JSON structuré dans `/sermons_data/<ID_BROCHURE>.sermon`.
- **Indépendance** : En cas d'erreur ou de corruption sur une brochure particulière, seule cette brochure est concernée. Vous pouvez éditer ou remplacer son fichier individuel sans impacter vos autres brochures.
- **Synchronisation automatique** : Au démarrage du serveur, toutes les brochures du dossier `sermons_data` sont automatiquement lues et synchronisées.
