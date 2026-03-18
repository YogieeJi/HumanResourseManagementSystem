const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb, saveDb, nextId } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316'];

function enrich(emp, db) {
  const dept = db.departments.find(d => d.id === emp.department_id);
  const { password_hash, ...safe } = emp;
  return { ...safe, department_name: dept ? dept.name : null };
}

router.get('/', (req, res) => {
  const db = getDb();
  const { search, department, status, role } = req.query;
  let list = db.employees;
  if (req.user.role === 'employee') list = list.filter(e => e.id === req.user.id);
  if (search) {
    const s = search.toLowerCase();
    list = list.filter(e => `${e.first_name} ${e.last_name} ${e.email} ${e.emp_code}`.toLowerCase().includes(s));
  }
  if (department) list = list.filter(e => e.department_id === parseInt(department));
  if (status) list = list.filter(e => e.status === status);
  if (role) list = list.filter(e => e.role === role);
  res.json({ success:true, data: list.map(e => enrich(e, db)) });
});

router.get('/stats/overview', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const active = db.employees.filter(e => e.status === 'active');
  const byDept = db.departments.map(d => ({ name: d.name, count: active.filter(e => e.department_id === d.id).length }));
  const thisMonth = new Date().toISOString().slice(0,7);
  const newThisMonth = active.filter(e => e.join_date && e.join_date.slice(0,7) === thisMonth).length;
  res.json({ success:true, data:{ total: active.length, byDept, newThisMonth } });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (req.user.role === 'employee' && req.user.id !== id) return res.status(403).json({ success:false, message:'Forbidden' });
  const emp = db.employees.find(e => e.id === id);
  if (!emp) return res.status(404).json({ success:false, message:'Not found' });
  res.json({ success:true, data: enrich(emp, db) });
});

router.post('/', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const { first_name, last_name, email, password, phone, department_id, role, designation, join_date, salary, address, avatar_color } = req.body;
  if (!first_name || !last_name || !email || !password)
    return res.status(400).json({ success:false, message:'Required fields missing' });
  if (db.employees.find(e => e.email === email))
    return res.status(400).json({ success:false, message:'Email already exists' });
  if (['admin','manager'].includes(role) && req.user.role !== 'admin')
    return res.status(403).json({ success:false, message:'Only admin can assign elevated roles' });

  const lastCode = db.employees.reduce((max, e) => Math.max(max, parseInt(e.emp_code.replace('EMP',''))), 0);
  const emp_code = `EMP${String(lastCode+1).padStart(3,'0')}`;
  const newEmp = {
    id: nextId(db.employees), emp_code, first_name, last_name, email,
    password_hash: bcrypt.hashSync(password, 10),
    phone: phone||'', department_id: department_id ? parseInt(department_id) : null,
    role: role||'employee', designation: designation||'', join_date: join_date||'',
    status:'active', salary: salary ? parseFloat(salary) : 0,
    address: address||'', avatar_color: avatar_color||COLORS[Math.floor(Math.random()*COLORS.length)],
  };
  db.employees.push(newEmp);
  saveDb(db);
  res.status(201).json({ success:true, data: enrich(newEmp, db), message:'Employee created' });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  if (req.user.role === 'employee' && req.user.id !== id) return res.status(403).json({ success:false, message:'Forbidden' });
  const idx = db.employees.findIndex(e => e.id === id);
  if (idx === -1) return res.status(404).json({ success:false, message:'Not found' });
  const { first_name, last_name, phone, department_id, role, designation, join_date, salary, address, status, avatar_color } = req.body;
  const emp = db.employees[idx];
  if (first_name) emp.first_name = first_name;
  if (last_name) emp.last_name = last_name;
  if (phone !== undefined) emp.phone = phone;
  if (address !== undefined) emp.address = address;
  if (avatar_color) emp.avatar_color = avatar_color;
  if (req.user.role !== 'employee') {
    if (department_id) emp.department_id = parseInt(department_id);
    if (designation) emp.designation = designation;
    if (join_date) emp.join_date = join_date;
    if (salary !== undefined) emp.salary = parseFloat(salary);
    if (status) emp.status = status;
    if (role && req.user.role === 'admin') emp.role = role;
  }
  db.employees[idx] = emp;
  saveDb(db);
  res.json({ success:true, data: enrich(emp, db), message:'Updated' });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  const emp = db.employees.find(e => e.id === parseInt(req.params.id));
  if (emp) { emp.status = 'inactive'; saveDb(db); }
  res.json({ success:true, message:'Deactivated' });
});

module.exports = router;
