const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  const h = req.headers['authorization'];
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token manquant' });
  try {
    req.user = jwt.verify(h.slice(7), process.env.JWT_SECRET || 'edutrack3_secret');
    next();
  } catch { res.status(401).json({ error: 'Token invalide' }); }
};
