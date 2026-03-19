const express = require('express');
const bcrypt   = require('bcryptjs');
const Employee   = require('../models/Employee');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

const COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316'];

async function enrich(emp) {
  const dept = emp.department_id ? await Department.findById(emp.department_id) : null;
  const { password_hash, __v, ...rest } = emp.toObject ? emp.toObject() : emp;
  return { ...rest, id: emp._id || emp.id, department_name: dept ? dept.name : null };
}

router.get('/stats/overview', requireRole('admin','manager'), async (req, res) => {
  try {
    const total = await Employee.countDocuments({ status:'active' });
    const depts = await Department.find();
    const byDept = await Promise.all(depts.map(async d => ({
      name: d.name,
      count: await Employee.countDocuments({ department_id: d._id, status:'active' })
    })));
    const thisMonth = new Date().toISOString().slice(0,7);
    const newThisMonth = await Employee.countDocuments({ join_date: { $regex: `^${thisMonth}` }, status:'active' });
    res.json({ success:true, data:{ total, byDept, newThisMonth } });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { search, department, status, role } = req.query;
    const query = {};
    if (req.user.role === 'employee') query._id = req.user.id;
    if (search) query.$or = [
      { first_name: new RegExp(search,'i') }, { last_name: new RegExp(search,'i') },
      { email: new RegExp(search,'i') },      { emp_code: new RegExp(search,'i') },
      { designation: new RegExp(search,'i') }
    ];
    if (department) query.department_id = department;
    if (status)     query.status = status;
    if (role)       query.role = role;
    const emps = await Employee.find(query).sort({ first_name:1 });
    const data = await Promise.all(emps.map(enrich));
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee' && req.user.id !== req.params.id)
      return res.status(403).json({ success:false, message:'Forbidden' });
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: await enrich(emp) });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', requireRole('admin','manager'), async (req, res) => {
  try {
    const { first_name, last_name, email, password, phone, department_id, role, designation, join_date, salary, address, avatar_color, employee_type, shift } = req.body;
    if (!first_name || !last_name || !email || !password)
      return res.status(400).json({ success:false, message:'Required fields missing' });
    if (['admin','manager'].includes(role) && req.user.role !== 'admin')
      return res.status(403).json({ success:false, message:'Only admin can assign elevated roles' });
    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success:false, message:'Email already exists' });
    const lastEmp = await Employee.findOne().sort({ emp_code:-1 });
    const lastNum = lastEmp ? parseInt(lastEmp.emp_code.replace('HMS','')) : 0;
    const emp_code = `HMS${String(lastNum+1).padStart(3,'0')}`;
    const emp = await Employee.create({
      emp_code, first_name, last_name, email: email.toLowerCase(),
      password_hash: bcrypt.hashSync(password, 10),
      phone: phone||'', department_id: department_id||null,
      role: role||'employee', designation: designation||'',
      employee_type: employee_type||'Non-Clinical', shift: shift||'General',
      join_date: join_date||'', salary: salary||0, address: address||'',
      avatar_color: avatar_color||COLORS[Math.floor(Math.random()*COLORS.length)],
    });
    res.status(201).json({ success:true, data: await enrich(emp), message:'Staff created' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee' && req.user.id !== req.params.id)
      return res.status(403).json({ success:false, message:'Forbidden' });
    const allowed = ['first_name','last_name','phone','address','avatar_color'];
    if (req.user.role !== 'employee') allowed.push('department_id','designation','join_date','salary','status','employee_type','shift');
    if (req.user.role === 'admin') allowed.push('role');
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const emp = await Employee.findByIdAndUpdate(req.params.id, updates, { new:true });
    if (!emp) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: await enrich(emp), message:'Updated' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    await Employee.findByIdAndUpdate(req.params.id, { status:'inactive' });
    res.json({ success:true, message:'Staff deactivated' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
