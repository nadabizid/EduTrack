require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const app     = express();

app.use(cors({ origin: process.env.FRONTEND_URL||'http://localhost:5173', credentials:true }));
app.use(express.json());
app.use(express.urlencoded({ extended:true }));
app.use('/uploads', express.static(path.join(__dirname,'uploads')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/projects',      require('./routes/projects'));
app.use('/api/groups',        require('./routes/groups'));
app.use('/api/soutenances',   require('./routes/soutenances'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/api/health', (_,res) => res.json({ status:'ok', time:new Date() }));
app.use((req,res) => res.status(404).json({ error:`${req.method} ${req.path} introuvable` }));
app.use((err,req,res,next) => { console.error(err); res.status(500).json({ error:'Erreur interne' }); });

const PORT = process.env.PORT||3001;
app.listen(PORT, () => console.log(`🚀 EduTrack v3 → http://localhost:${PORT}`));
