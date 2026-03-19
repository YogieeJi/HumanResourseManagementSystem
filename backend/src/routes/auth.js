const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Employee   = require('../models/Employee');
const Department = require('../models/Department');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

async function safeUser(emp) {
  const dept = emp.department_id ? await Department.findById(emp.department_id) : null;
  const { password_hash, __v, ...rest } = emp.toObject();
  return { ...rest, id: emp._id, department_name: dept ? dept.name : null };
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success:false, message:'Email and password required' });
    const emp = await Employee.findOne({ email: email.toLowerCase(), status:'active' });
    if (!emp)
      return res.status(401).json({ success:false, message:'No active account found with this email' });
    if (!bcrypt.compareSync(password, emp.password_hash))
      return res.status(401).json({ success:false, message:'Incorrect password' });
    const token = jwt.sign(
      { id: emp._id, email: emp.email, role: emp.role, emp_code: emp.emp_code },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ success:true, token, user: await safeUser(emp) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success:false, message:'Server error: ' + err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const emp = await Employee.findById(req.user.id);
    if (!emp) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, user: await safeUser(emp) });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const emp = await Employee.findById(req.user.id);
    if (!bcrypt.compareSync(currentPassword, emp.password_hash))
      return res.status(400).json({ success:false, message:'Current password is incorrect' });
    emp.password_hash = bcrypt.hashSync(newPassword, 10);
    await emp.save();
    res.json({ success:true, message:'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success:false, message: err.message });
  }
});

module.exports = router;
