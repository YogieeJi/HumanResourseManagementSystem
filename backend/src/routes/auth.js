const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb, saveDb } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

function safe(emp, db) {
  const dept = db.departments.find(d => d.id === emp.department_id);
  const { password_hash, ...rest } = emp;
  return { ...rest, department_name: dept ? dept.name : null };
}

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success:false, message:'Email and password are required' });

    const db  = getDb();
    if (!db)
      return res.status(500).json({ success:false, message:'Database not initialised. Please restart the server.' });

    const emp = db.employees.find(e => e.email.toLowerCase() === email.toLowerCase() && e.status === 'active');
    if (!emp)
      return res.status(401).json({ success:false, message:'No active account found with this email' });

    if (!emp.password_hash || emp.password_hash === 'REHASH_NEEDED')
      return res.status(500).json({ success:false, message:'Password not set. Delete data.json and restart the server to re-seed.' });

    const match = bcrypt.compareSync(password, emp.password_hash);
    if (!match)
      return res.status(401).json({ success:false, message:'Incorrect password' });

    const token = jwt.sign(
      { id:emp.id, email:emp.email, role:emp.role, emp_code:emp.emp_code },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ success:true, token, user: safe(emp, db) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success:false, message:'Server error during login: ' + err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const db  = getDb();
  const emp = db.employees.find(e => e.id === req.user.id);
  if (!emp) return res.status(404).json({ success:false, message:'User not found' });
  res.json({ success:true, user: safe(emp, db) });
});

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const db  = getDb();
  const emp = db.employees.find(e => e.id === req.user.id);
  if (!bcrypt.compareSync(currentPassword, emp.password_hash))
    return res.status(400).json({ success:false, message:'Current password is incorrect' });
  emp.password_hash = bcrypt.hashSync(newPassword, 10);
  saveDb(db);
  res.json({ success:true, message:'Password changed successfully' });
});

module.exports = router;
