const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Attendance List (Date/Class filter)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { date, class_id, student_id } = req.query;
    let query = `
      SELECT a.*, s.name as student_name, s.student_id as student_code,
             c.class_name
      FROM attendance a
      LEFT JOIN students s ON a.student_id = s.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (date) { query += ' AND a.date = ?'; params.push(date); }
    if (class_id) { query += ' AND a.class_id = ?'; params.push(class_id); }
    if (student_id) { query += ' AND a.student_id = ?'; params.push(student_id); }
    query += ' ORDER BY a.date DESC, a.id DESC';
    const rows = db.prepare(query).all(...params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats for today
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const total = db.prepare('SELECT COUNT(*) as c FROM attendance WHERE date = ?').get(today).c;
    const present = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Present'").get(today).c;
    const absent = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Absent'").get(today).c;
    const late = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Late'").get(today).c;
    res.json({ date: today, total, present, absent, late });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add single attendance
router.post('/', authenticateToken, (req, res) => {
  const { student_id, class_id, date, status, remarks } = req.body;
  if (!student_id || !date || !status) {
    return res.status(400).json({ error: 'student_id, date, status လိုအပ်ပါတယ်' });
  }
  try {
    const existing = db.prepare('SELECT id FROM attendance WHERE student_id = ? AND date = ?').get(student_id, date);
    if (existing) {
      db.prepare('UPDATE attendance SET status = ?, remarks = ?, class_id = ? WHERE id = ?')
        .run(status, remarks || null, class_id || null, existing.id);
      return res.json({ message: 'တက်ရောက်မှု Update ပြီးပါပြီ' });
    }
    const result = db.prepare(`
      INSERT INTO attendance (student_id, class_id, date, status, remarks, marked_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(student_id, class_id || null, date, status, remarks || null, req.user.id);
    res.status(201).json({ message: 'တက်ရောက်မှု မှတ်ပြီးပါပြီ', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk mark (multiple students at once)
router.post('/bulk', authenticateToken, (req, res) => {
  const { date, class_id, records } = req.body; // records = [{student_id, status, remarks}]
  if (!date || !Array.isArray(records)) {
    return res.status(400).json({ error: 'date နဲ့ records လိုအပ်ပါတယ်' });
  }
  try {
    const tx = db.transaction((items) => {
      for (const r of items) {
        const existing = db.prepare('SELECT id FROM attendance WHERE student_id = ? AND date = ?').get(r.student_id, date);
        if (existing) {
          db.prepare('UPDATE attendance SET status = ?, remarks = ?, class_id = ? WHERE id = ?')
            .run(r.status, r.remarks || null, class_id || null, existing.id);
        } else {
          db.prepare(`
            INSERT INTO attendance (student_id, class_id, date, status, remarks, marked_by)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(r.student_id, class_id || null, date, r.status, r.remarks || null, req.user.id);
        }
      }
    });
    tx(records);
    res.json({ message: `${records.length} ယောက် တက်ရောက်မှု မှတ်ပြီးပါပြီ` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const r = db.prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ဖျက်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;