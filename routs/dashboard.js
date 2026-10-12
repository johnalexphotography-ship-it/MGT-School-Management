const express = require('express');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Dashboard Overview Stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Students
    const totalStudents = db.prepare('SELECT COUNT(*) as c FROM students').get().c;
    const activeStudents = db.prepare("SELECT COUNT(*) as c FROM students WHERE status = 'Active'").get().c;
    const maleStudents = db.prepare("SELECT COUNT(*) as c FROM students WHERE gender = 'Male'").get().c;
    const femaleStudents = db.prepare("SELECT COUNT(*) as c FROM students WHERE gender = 'Female'").get().c;

    // Teachers
    const totalTeachers = db.prepare('SELECT COUNT(*) as c FROM teachers').get().c;
    const activeTeachers = db.prepare("SELECT COUNT(*) as c FROM teachers WHERE status = 'Active'").get().c;

    // Classes
    const totalClasses = db.prepare('SELECT COUNT(*) as c FROM classes').get().c;
    const activeClasses = db.prepare("SELECT COUNT(*) as c FROM classes WHERE status = 'Active'").get().c;

    // Today's attendance
    const todayPresent = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Present'").get(today).c;
    const todayAbsent = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Absent'").get(today).c;
    const todayLate = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ? AND status = 'Late'").get(today).c;
    const todayTotal = db.prepare("SELECT COUNT(*) as c FROM attendance WHERE date = ?").get(today).c;
    const attendanceRate = todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0;

    // Fees
    const feesTotal = db.prepare('SELECT COALESCE(SUM(amount), 0) as s FROM fees').get().s;
    const feesPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM fees WHERE status = 'Paid'").get().s;
    const feesPending = db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM fees WHERE status = 'Pending'").get().s;

    // Upcoming exams
    const upcomingExams = db.prepare(`
      SELECT e.*, c.class_name 
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      WHERE e.exam_date >= ? AND e.status = 'Scheduled'
      ORDER BY e.exam_date ASC
      LIMIT 5
    `).all(today);

    // Recent students (last 5)
    const recentStudents = db.prepare(`
      SELECT id, student_id, name, grade, section, created_at
      FROM students
      ORDER BY id DESC
      LIMIT 5
    `).all();

    // Grade distribution
    const gradeDistribution = db.prepare(`
      SELECT grade, COUNT(*) as count
      FROM students
      WHERE grade IS NOT NULL AND grade != ''
      GROUP BY grade
      ORDER BY grade
    `).all();

    res.json({
      students: {
        total: totalStudents,
        active: activeStudents,
        male: maleStudents,
        female: femaleStudents,
      },
      teachers: {
        total: totalTeachers,
        active: activeTeachers,
      },
      classes: {
        total: totalClasses,
        active: activeClasses,
      },
      attendance: {
        date: today,
        present: todayPresent,
        absent: todayAbsent,
        late: todayLate,
        total: todayTotal,
        rate: attendanceRate,
      },
      fees: {
        total: feesTotal,
        paid: feesPaid,
        pending: feesPending,
      },
      upcomingExams,
      recentStudents,
      gradeDistribution,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;