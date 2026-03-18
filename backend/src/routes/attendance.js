const express = require('express');
const { getDb, saveDb, nextId } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function enrich(rec, db) {
  const emp = db.employees.find(e => e.id === rec.employee_id) || {};
  const dept = db.departments.find(d => d.id === emp.department_id) || {};
  return { ...rec, first_name:emp.first_name, last_name:emp.last_name, emp_code:emp.emp_code, avatar_color:emp.avatar_color, department_name:dept.name };
}

function calcHours(ci, co) {
  if (!ci || !co) return 0;
  const [ih,im]=ci.split(':').map(Number),[oh,om]=co.split(':').map(Number);
  return Math.round(((oh*60+om)-(ih*60+im))/60*10)/10;
}

router.get('/today-status', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const rec = db.attendance.find(a => a.employee_id === req.user.id && a.date === today);
  res.json({ success:true, data: rec||null });
});

router.get('/summary/:employeeId', (req, res) => {
  const db = getDb();
  const empId = parseInt(req.params.employeeId);
  if (req.user.role === 'employee' && req.user.id !== empId) return res.status(403).json({ success:false, message:'Forbidden' });
  let recs = db.attendance.filter(a => a.employee_id === empId);
  const { month, year } = req.query;
  if (month && year) recs = recs.filter(a => { const [y,m] = a.date.split('-'); return parseInt(m)===parseInt(month) && y===year; });
  const present = recs.filter(a=>a.status==='present').length;
  const absent  = recs.filter(a=>a.status==='absent').length;
  const half_day= recs.filter(a=>a.status==='half_day').length;
  const total_hours = Math.round(recs.reduce((s,a)=>s+(a.hours_worked||0),0)*10)/10;
  res.json({ success:true, data:{ present, absent, half_day, total_hours, total_records:recs.length } });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { employee_id, month, year, date } = req.query;
  let recs = db.attendance;
  const empId = req.user.role === 'employee' ? req.user.id : (employee_id ? parseInt(employee_id) : null);
  if (empId) recs = recs.filter(a => a.employee_id === empId);
  if (date) recs = recs.filter(a => a.date === date);
  if (month && year) recs = recs.filter(a => { const [y,m]=a.date.split('-'); return parseInt(m)===parseInt(month)&&y===String(year); });
  recs = [...recs].sort((a,b) => b.date.localeCompare(a.date));
  res.json({ success:true, data: recs.map(r => enrich(r, db)) });
});

router.post('/check-in', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().slice(0,5);
  const empId = req.user.role === 'employee' ? req.user.id : (req.body.employee_id ? parseInt(req.body.employee_id) : req.user.id);
  const existing = db.attendance.find(a => a.employee_id === empId && a.date === today);
  if (existing && existing.check_in) return res.status(400).json({ success:false, message:'Already checked in today' });
  if (existing) { existing.check_in = time; existing.status = 'present'; }
  else db.attendance.push({ id:nextId(db.attendance), employee_id:empId, date:today, check_in:time, check_out:null, status:'present', hours_worked:0 });
  saveDb(db);
  res.json({ success:true, message:`Checked in at ${time}`, time });
});

router.post('/check-out', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const time = new Date().toTimeString().slice(0,5);
  const empId = req.user.role === 'employee' ? req.user.id : (req.body.employee_id ? parseInt(req.body.employee_id) : req.user.id);
  const rec = db.attendance.find(a => a.employee_id === empId && a.date === today);
  if (!rec || !rec.check_in) return res.status(400).json({ success:false, message:'Please check in first' });
  if (rec.check_out) return res.status(400).json({ success:false, message:'Already checked out' });
  rec.check_out = time;
  rec.hours_worked = calcHours(rec.check_in, time);
  saveDb(db);
  res.json({ success:true, message:`Checked out at ${time}. Hours: ${rec.hours_worked}`, time, hours:rec.hours_worked });
});

router.post('/', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const { employee_id, date, check_in, check_out, status } = req.body;
  const hours = calcHours(check_in, check_out);
  const existing = db.attendance.find(a => a.employee_id === parseInt(employee_id) && a.date === date);
  if (existing) { existing.check_in=check_in; existing.check_out=check_out; existing.status=status||'present'; existing.hours_worked=hours; }
  else db.attendance.push({ id:nextId(db.attendance), employee_id:parseInt(employee_id), date, check_in:check_in||null, check_out:check_out||null, status:status||'present', hours_worked:hours });
  saveDb(db);
  res.json({ success:true, message:'Attendance recorded' });
});

module.exports = router;
