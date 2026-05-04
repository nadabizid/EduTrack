# EduTrack v3 — Guide de démarrage

## Démarrage en 3 étapes

### 1. Créer la base de données
```powershell
psql -U postgres -c "CREATE DATABASE edutrack3;"
```

### 2. Backend
```powershell
cd backend
npm install
```
Éditez `.env` → mettez votre mot de passe PostgreSQL :
```
DB_PASSWORD=votre_mot_de_passe
```
Initialisez DB + seed :
```powershell
node setup-db.js
```
Démarrez :
```powershell
npm run dev
```

### 3. Frontend
```powershell
cd frontend
npm install
npm run dev
```
Ouvrez **http://localhost:5173**

---

## Comptes démo (mot de passe : password123)

| Rôle       | Email             | Filière |
|------------|-------------------|---------|
| Enseignant | karim@issat.tn    | —       |
| Enseignant | leila@issat.tn    | —       |
| Étudiant   | ahmed@issat.tn    | ING-A1  |
| Étudiant   | yassine@issat.tn  | ING-A1  |
| Étudiant   | sara@issat.tn     | ING-A1  |
| Étudiant   | rania@issat.tn    | ING-A1  |
| Étudiant   | sami@issat.tn     | ING-A1  |
| Étudiant   | nour@issat.tn     | ING-A2  |
| Étudiant   | tarek@issat.tn    | ING-A2  |
| Étudiant   | ines@issat.tn     | ING-A2  |
| Étudiant   | mariem@issat.tn   | ING-A3  |
| Étudiant   | khalil@issat.tn   | ING-A3  |
