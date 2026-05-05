const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const pool = require('../db');
const auth = require('../middleware/auth');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function extractTextFromPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    return pdfData.text;
}

router.post('/generate-quiz/:materialId', auth, async (req, res) => {
    try {
        const { materialId } = req.params;
        const { numQuestions = 5 } = req.body || {};

        const result = await pool.query(
            'SELECT file_path, title FROM course_materials WHERE id = $1',
            [materialId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Support non trouvé' });
        }
        const filePath = result.rows[0].file_path;
        const title = result.rows[0].title;

        let content = '';
        if (filePath.endsWith('.pdf')) {
            content = await extractTextFromPDF(filePath);
        } else if (filePath.endsWith('.txt')) {
            content = fs.readFileSync(filePath, 'utf-8');
        } else {
            return res.status(400).json({ error: 'Format non supporté (utilisez PDF ou TXT)' });
        }

        if (content.length === 0) {
            return res.status(400).json({ error: 'Fichier vide ou illisible' });
        }
        if (content.length > 10000) content = content.substring(0, 10000);

        const prompt = `Tu es un professeur. À partir du texte suivant (issu du cours "${title}"), génère ${numQuestions} questions à choix multiples (QCM). Chaque question doit avoir 4 options (A, B, C, D) et indiquer la lettre de la bonne réponse. Ta réponse doit être UNIQUEMENT un tableau JSON valide, sans aucun texte avant ou après, au format suivant :
[
  {
    "question": "texte de la question",
    "options": ["option A", "option B", "option C", "option D"],
    "correct": "A"
  }
]
Texte : ${content}`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: 'llama-3.1-8b-instant',
            temperature: 0.3,
        });

        let responseText = chatCompletion.choices[0]?.message?.content || '';
        console.log("Réponse brute de l'IA:", responseText);

        // Nettoyer et extraire le JSON
        responseText = responseText.trim();
        responseText = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        const firstBracket = responseText.indexOf('[');
        const lastBracket = responseText.lastIndexOf(']');
        if (firstBracket === -1 || lastBracket === -1) {
            throw new Error('Aucun tableau JSON trouvé dans la réponse');
        }
        const jsonString = responseText.substring(firstBracket, lastBracket + 1);
        const quiz = JSON.parse(jsonString);
        res.json(quiz);
    } catch (err) {
        console.error('Erreur génération quiz:', err);
        res.status(500).json({ error: 'Erreur génération quiz : ' + err.message });
    }
});

module.exports = router;