const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const pool = require('../db');        // ← correction : pas de '/pool'
const auth = require('../middleware/auth');

// Configuration multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const isTeacher = (req, res, next) => {
    if (req.user.role !== 'teacher') return res.status(403).json({ error: 'Accès réservé aux enseignants' });
    next();
};

// Upload d’un support
router.post('/upload', auth, isTeacher, upload.single('file'), async (req, res) => {
    try {
        const { title, description, subject } = req.body;
        if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
        const filePath = req.file.path;
        const result = await pool.query(
            `INSERT INTO course_materials (title, description, file_path, subject, uploaded_by)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [title, description, filePath, subject, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de l’upload' });
    }
});

// Liste des supports (correction : u.email au lieu de u.name)
router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT cm.*, u.email AS teacher_name
             FROM course_materials cm
             JOIN users u ON cm.uploaded_by = u.id
             ORDER BY cm.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors du chargement des supports' });
    }
});

// Téléchargement d’un fichier
router.get('/download/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT file_path FROM course_materials WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Fichier non trouvé' });
        res.download(result.rows[0].file_path);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors du téléchargement' });
    }
});

module.exports = router;