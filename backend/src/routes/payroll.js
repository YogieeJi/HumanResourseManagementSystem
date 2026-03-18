const express = require('express');
const { getDb, saveDb, nextId } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function enrich(slip, db) {
  const emp  = db.employees.find(e => e.id === slip.employee_id) || {};
  const dept = db.departments.find(d => d.id === emp.department_id) || {};
  return { ...slip, first_name:emp.first_name, last_name:emp.last_name, emp_code:emp.emp_code,
    designation:emp.designation, avatar_color:emp.avatar_color, department_name:dept.name,
    employee_type: emp.employee_type, shift: emp.shift };
}

router.get('/slips', (req, res) => {
  const db = getDb();
  const { employee_id, month, year } = req.query;
  let list = db.salary_slips;
  const empId = req.user.role === 'employee' ? req.user.id : (employee_id ? parseInt(employee_id) : null);
  if (empId) list = list.filter(s => s.employee_id === empId);
  if (month) list = list.filter(s => s.month === parseInt(month));
  if (year)  list = list.filter(s => s.year  === parseInt(year));
  list = [...list].sort((a,b) => b.year !== a.year ? b.year - a.year : b.month - a.month);
  res.json({ success:true, data: list.map(s => enrich(s, db)) });
});

router.get('/slips/:id', (req, res) => {
  const db = getDb();
  const slip = db.salary_slips.find(s => s.id === parseInt(req.params.id));
  if (!slip) return res.status(404).json({ success:false, message:'Not found' });
  if (req.user.role === 'employee' && slip.employee_id !== req.user.id)
    return res.status(403).json({ success:false, message:'Forbidden' });
  res.json({ success:true, data: enrich(slip, db) });
});

router.post('/generate', requireRole('admin'), (req, res) => {
  const db = getDb();
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ success:false, message:'Month and year required' });
  const m = parseInt(month), y = parseInt(year);
  const emps = db.employees.filter(e => e.status === 'active');
  const generated = [];
  emps.forEach(emp => {
    const basic     = Math.round(emp.salary * 0.5);
    const hra       = Math.round(emp.salary * 0.2);
    const transport = 1600;
    const medical   = 1250;
    const special   = Math.round(emp.salary * 0.08);
    const gross     = basic + hra + transport + medical + special;
    const pf        = Math.round(basic * 0.12);
    const esi       = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const pt        = gross > 15000 ? 200 : 0;
    const tds       = Math.round(gross * 0.05);
    const net       = gross - pf - esi - pt - tds;
    const presentDays = db.attendance.filter(a => {
      const [ay,am] = a.date.split('-');
      return a.employee_id === emp.id && parseInt(am) === m && parseInt(ay) === y && a.status === 'present';
    }).length || 22;
    const oldIdx = db.salary_slips.findIndex(s => s.employee_id === emp.id && s.month === m && s.year === y);
    if (oldIdx !== -1) db.salary_slips.splice(oldIdx, 1);
    const slip = { id:nextId(db.salary_slips), employee_id:emp.id, month:m, year:y,
      basic_salary:basic, hra, transport_allowance:transport, medical_allowance:medical,
      other_allowance:special, pf_deduction:pf, esi_deduction:esi, professional_tax:pt,
      tax_deduction:tds, other_deduction:0, gross_salary:gross, net_salary:net,
      working_days:26, present_days:presentDays, generated_at:new Date().toISOString() };
    db.salary_slips.push(slip);
    generated.push({ employee_id:emp.id, emp_code:emp.emp_code, net_salary:net });
  });
  saveDb(db);
  res.json({ success:true, data:generated, message:`Generated ${generated.length} salary slips` });
});

router.get('/summary', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const m = parseInt(req.query.month || new Date().getMonth() + 1);
  const y = parseInt(req.query.year  || new Date().getFullYear());
  const slips = db.salary_slips.filter(s => s.month === m && s.year === y);
  const summary = slips.length === 0 ? null : {
    total_slips: slips.length,
    total_gross: slips.reduce((s,x) => s + x.gross_salary, 0),
    total_net:   slips.reduce((s,x) => s + x.net_salary,   0),
    total_pf:    slips.reduce((s,x) => s + x.pf_deduction, 0),
    total_esi:   slips.reduce((s,x) => s + (x.esi_deduction||0), 0),
    avg_salary:  Math.round(slips.reduce((s,x) => s + x.net_salary, 0) / slips.length),
  };
  const byDept = db.departments.map(d => {
    const deptSlips = slips.filter(s => { const emp = db.employees.find(e => e.id === s.employee_id); return emp && emp.department_id === d.id; });
    return { name:d.name, count:deptSlips.length, total:deptSlips.reduce((s,x)=>s+x.net_salary,0) };
  });
  res.json({ success:true, data:{ summary, byDept, month:m, year:y } });
});

module.exports = router;
