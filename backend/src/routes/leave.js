const express = require('express');
const { getDb, saveDb, nextId } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function enrich(l, db) {
  const emp  = db.employees.find(e => e.id === l.employee_id) || {};
  const dept = db.departments.find(d => d.id === emp.department_id) || {};
  const appr = l.approved_by ? (db.employees.find(e => e.id === l.approved_by) || {}) : {};
  return { ...l, first_name:emp.first_name, last_name:emp.last_name, emp_code:emp.emp_code,
    avatar_color:emp.avatar_color, department_name:dept.name,
    approver_first_name:appr.first_name, approver_last_name:appr.last_name };
}

function calcDays(start, end) {
  let days = 0;
  for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate() + 1))
    if (d.getDay() !== 0 && d.getDay() !== 6) days++;
  return days;
}

router.get('/balance/:employeeId', (req, res) => {
  const db = getDb();
  const empId = parseInt(req.params.employeeId);
  if (req.user.role === 'employee' && req.user.id !== empId)
    return res.status(403).json({ success:false, message:'Forbidden' });
  const year = String(new Date().getFullYear());
  const approved = db.leave_requests.filter(l => l.employee_id === empId && l.status === 'approved' && l.start_date.startsWith(year));
  const emp = db.employees.find(e => e.id === empId) || {};
  const entitlement = { casual:12, sick:12, earned:21, maternity: emp.employee_type === 'Nursing' || emp.employee_type === 'Doctor' ? 182 : 182, conference:5, other:5 };
  const balance = {};
  Object.keys(entitlement).forEach(type => {
    const used = approved.filter(l => l.leave_type === type).reduce((s,l) => s + l.days, 0);
    balance[type] = { entitled:entitlement[type], used, available: Math.max(0, entitlement[type] - used) };
  });
  res.json({ success:true, data:balance });
});

router.get('/', (req, res) => {
  const db = getDb();
  let list = db.leave_requests;
  if (req.user.role === 'employee') list = list.filter(l => l.employee_id === req.user.id);
  else if (req.query.employee_id) list = list.filter(l => l.employee_id === parseInt(req.query.employee_id));
  if (req.query.status) list = list.filter(l => l.status === req.query.status);
  if (req.query.year) list = list.filter(l => l.start_date.startsWith(req.query.year));
  list = [...list].sort((a,b) => b.created_at.localeCompare(a.created_at));
  res.json({ success:true, data: list.map(l => enrich(l, db)) });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { leave_type, start_date, end_date, reason } = req.body;
  if (!leave_type || !start_date || !end_date)
    return res.status(400).json({ success:false, message:'Required fields missing' });
  if (new Date(end_date) < new Date(start_date))
    return res.status(400).json({ success:false, message:'End date must be after start date' });
  const days = calcDays(start_date, end_date);
  const newLeave = { id:nextId(db.leave_requests), employee_id:req.user.id, leave_type, start_date, end_date, days,
    reason:reason||'', status:'pending', approved_by:null, approved_at:null, created_at:new Date().toISOString() };
  db.leave_requests.push(newLeave);
  saveDb(db);
  res.status(201).json({ success:true, data:enrich(newLeave, db), message:'Leave request submitted' });
});

router.put('/:id/approve', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!['approved','rejected'].includes(status))
    return res.status(400).json({ success:false, message:'Invalid status' });
  const leave = db.leave_requests.find(l => l.id === id);
  if (!leave) return res.status(404).json({ success:false, message:'Not found' });
  leave.status = status; leave.approved_by = req.user.id; leave.approved_at = new Date().toISOString();
  saveDb(db);
  res.json({ success:true, data:enrich(leave, db), message:`Leave ${status}` });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const idx = db.leave_requests.findIndex(l => l.id === id);
  if (idx === -1) return res.status(404).json({ success:false, message:'Not found' });
  if (db.leave_requests[idx].status !== 'pending')
    return res.status(400).json({ success:false, message:'Can only cancel pending requests' });
  if (db.leave_requests[idx].employee_id !== req.user.id && req.user.role === 'employee')
    return res.status(403).json({ success:false, message:'Forbidden' });
  db.leave_requests.splice(idx, 1);
  saveDb(db);
  res.json({ success:true, message:'Cancelled' });
});

module.exports = router;
