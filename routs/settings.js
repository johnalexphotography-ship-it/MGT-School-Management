const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all settings
router.get('/', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all();
    const obj = {};
    rows.forEach(r => { obj[r.key] = r.value; });
    res.json(obj);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update settings (bulk)
router.put('/', authenticateToken, isAdmin, (req, res) => {
  try {
    const updates = req.body; // { school_name: "...", school_phone: "..." }
    const stmt = db.prepare('INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)');
    const tx = db.transaction((obj) => {
      for (const [key, value] of Object.entries(obj)) {
        stmt.run(key, String(value ?? ''));
      }
    });
    tx(updates);
    res.json({ message: 'ဆက်တင် သိမ်းပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.post('/change-password', authenticateToken, async (req, res) => {
  const { old_password, new_password } = req.body;
  if (!old_password || !new_password) {
    return res.status(400).json({ error: 'old_password, new_password လိုအပ်ပါတယ်' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'Password အနည်းဆုံး ၆ လုံး ရှိရပါမယ်' });
  }
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User မတွေ့ပါ' });
    const ok = await bcrypt.compare(old_password, user.password);
    if (!ok) return res.status(400).json({ error: 'Password အဟောင်း မှားနေပါတယ်' });
    const hash = await bcrypt.hash(new_password, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, req.user.id);
    res.json({ message: 'Password ပြောင်းပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backup (download db file as base64)
router.get('/backup', authenticateToken, isAdmin, (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.resolve(__dirname, '..', 'database', 'school.db');
    const buf = fs.readFileSync(dbPath);
    res.json({
      filename: `school-backup-${new Date().toISOString().split('T')[0]}.db`,
      data: buf.toString('base64'),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;