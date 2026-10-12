const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Exams List
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, class_id, exam_type } = req.query;
    let query = `
      SELECT e.*, c.class_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      WHERE 1=1
    `;
    const params = [];
    if (search) { query += ' AND (e.exam_name LIKE ? OR e.subject LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (class_id) { query += ' AND e.class_id = ?'; params.push(class_id); }
    if (exam_type) { query += ' AND e.exam_type = ?'; params.push(exam_type); }
    query += ' ORDER BY e.exam_date DESC, e.id DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single exam
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const e = db.prepare('SELECT * FROM exams WHERE id = ?').get(req.params.id);
    if (!e) return res.status(404).json({ error: 'စာမေးပွဲ မတွေ့ပါ' });
    res.json(e);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create exam
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { exam_name, exam_type, class_id, subject, exam_date, total_marks, pass_marks, status } = req.body;
  if (!exam_name) return res.status(400).json({ error: 'exam_name လိုအပ်ပါတယ်' });
  try {
    const r = db.prepare(`
      INSERT INTO exams (exam_name, exam_type, class_id, subject, exam_date, total_marks, pass_marks, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(exam_name, exam_type || null, class_id || null, subject || null, exam_date || null,
      total_marks || 100, pass_marks || 40, status || 'Scheduled');
    res.status(201).json({ message: 'စာမေးပွဲ ထည့်ပြီးပါပြီ', id: r.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { exam_name, exam_type, class_id, subject, exam_date, total_marks, pass_marks, status } = req.body;
  try {
    const r = db.prepare(`
      UPDATE exams SET exam_name=?, exam_type=?, class_id=?, subject=?, exam_date=?,
        total_marks=?, pass_marks=?, status=? WHERE id=?
    `).run(exam_name, exam_type, class_id, subject, exam_date, total_marks, pass_marks, status, req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ပြင်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM exam_results WHERE exam_id = ?').run(req.params.id);
    const r = db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ဖျက်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get results for exam
router.get('/:id/results', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT r.*, s.name as student_name, s.student_id as student_code
      FROM exam_results r
      LEFT JOIN students s ON r.student_id = s.id
      WHERE r.exam_id = ?
      ORDER BY r.marks DESC
    `).all(req.params.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk save results
router.post('/:id/results', authenticateToken, isAdmin, (req, res) => {
  const examId = req.params.id;
  const { records } = req.body; // [{student_id, marks, grade, remarks}]
  if (!Array.isArray(records)) return res.status(400).json({ error: 'records လိုအပ်ပါတယ်' });
  try {
    const tx = db.transaction((items) => {
      for (const r of items) {
        const existing = db.prepare('SELECT id FROM exam_results WHERE exam_id = ? AND student_id = ?')
          .get(examId, r.student_id);
        if (existing) {
          db.prepare('UPDATE exam_results SET marks=?, grade=?, remarks=? WHERE id=?')
            .run(r.marks, r.grade || null, r.remarks || null, existing.id);
        } else {
          db.prepare('INSERT INTO exam_results (exam_id, student_id, marks, grade, remarks) VALUES (?, ?, ?, ?, ?)')
            .run(examId, r.student_id, r.marks, r.grade || null, r.remarks || null);
        }
      }
    });
    tx(records);
    res.json({ message: 'အမှတ်စာရင်း သိမ်းပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;