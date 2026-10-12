const express = require('express');
const db = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const router = express.Router();

// Fees list
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, status, month } = req.query;
    let query = `
      SELECT f.*, s.name as student_name, s.student_id as student_code
      FROM fees f
      LEFT JOIN students s ON f.student_id = s.id
      WHERE 1=1
    `;
    const params = [];
    if (search) { query += ' AND (s.name LIKE ? OR s.student_id LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (status) { query += ' AND f.status = ?'; params.push(status); }
    if (month) { query += ' AND f.month = ?'; params.push(month); }
    query += ' ORDER BY f.id DESC';
    res.json(db.prepare(query).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const total = db.prepare('SELECT COALESCE(SUM(amount),0) as s FROM fees').get().s;
    const paid = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM fees WHERE status = 'Paid'").get().s;
    const pending = db.prepare("SELECT COALESCE(SUM(amount),0) as s FROM fees WHERE status = 'Pending'").get().s;
    res.json({ total, paid, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create
router.post('/', authenticateToken, isAdmin, (req, res) => {
  const { student_id, fee_type, amount, month, year, due_date, paid_date, status, payment_method, remarks } = req.body;
  if (!student_id || !fee_type || !amount) {
    return res.status(400).json({ error: 'student_id, fee_type, amount လိုအပ်ပါတယ်' });
  }
  try {
    const r = db.prepare(`
      INSERT INTO fees (student_id, fee_type, amount, month, year, due_date, paid_date, status, payment_method, remarks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(student_id, fee_type, amount, month || null, year || null,
      due_date || null, paid_date || null, status || 'Pending',
      payment_method || null, remarks || null);
    res.status(201).json({ message: 'ကျောင်းလခ မှတ်ပြီးပါပြီ', id: r.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update
router.put('/:id', authenticateToken, isAdmin, (req, res) => {
  const { student_id, fee_type, amount, month, year, due_date, paid_date, status, payment_method, remarks } = req.body;
  try {
    const r = db.prepare(`
      UPDATE fees SET student_id=?, fee_type=?, amount=?, month=?, year=?,
        due_date=?, paid_date=?, status=?, payment_method=?, remarks=? WHERE id=?
    `).run(student_id, fee_type, amount, month, year, due_date, paid_date, status, payment_method, remarks, req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ပြင်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark as paid
router.post('/:id/pay', authenticateToken, isAdmin, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { payment_method } = req.body;
  try {
    const r = db.prepare("UPDATE fees SET status='Paid', paid_date=?, payment_method=? WHERE id=?")
      .run(today, payment_method || 'Cash', req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ပေးချေပြီးအဖြစ် မှတ်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete
router.delete('/:id', authenticateToken, isAdmin, (req, res) => {
  try {
    const r = db.prepare('DELETE FROM fees WHERE id = ?').run(req.params.id);
    if (r.changes === 0) return res.status(404).json({ error: 'မတွေ့ပါ' });
    res.json({ message: 'ဖျက်ပြီးပါပြီ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;