require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { initDb, getDb } = require('./db/database');

const app = express();

// Allow all origins — fine for a demo
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Seed on startup
initDb();

app.use('/api/auth',        require('./routes/auth'));
app.use('/api/employees',   require('./routes/employees'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/leave',       require('./routes/leave'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/payroll',     require('./routes/payroll'));

app.get('/api/dashboard', require('./middleware/auth').authMiddleware, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const active = db.employees.filter(e => e.status === 'active');
  const presentToday  = db.attendance.filter(a => a.date === today && a.status === 'present').length;
  const pendingLeaves = db.leave_requests.filter(l => l.status === 'pending').length;
  const m = new Date().getMonth() + 1, y = new Date().getFullYear();
  const monthlyPayroll = db.salary_slips.filter(s => s.month === m && s.year === y).reduce((s,x) => s + x.net_salary, 0);

  const recentLeaves = [...db.leave_requests]
    .sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,5)
    .map(l => { const e = db.employees.find(x => x.id === l.employee_id) || {}; return { ...l, first_name:e.first_name, last_name:e.last_name, avatar_color:e.avatar_color, emp_code:e.emp_code }; });

  const recentEmployees = [...active].sort((a,b) => b.id - a.id).slice(0,5)
    .map(({ password_hash, ...e }) => { const d = db.departments.find(x => x.id === e.department_id) || {}; return { ...e, department_name:d.name }; });

  const attMap = {};
  db.attendance.forEach(a => {
    if (!attMap[a.date]) attMap[a.date] = { date:a.date, present:0, absent:0, half_day:0 };
    attMap[a.date][a.status] = (attMap[a.date][a.status] || 0) + 1;
  });
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 14);
  const attendanceTrend = Object.values(attMap).filter(x => new Date(x.date) >= cutoff).sort((a,b) => a.date.localeCompare(b.date));
  const deptDistribution = db.departments.map(d => ({ name:d.name, count:active.filter(e => e.department_id === d.id).length }));

  res.json({ success:true, data:{ stats:{ totalEmployees:active.length, presentToday, pendingLeaves, monthlyPayroll }, recentLeaves, recentEmployees, attendanceTrend, deptDistribution } });
});

app.get('/api/health', (_, res) => res.json({ status:'ok', timestamp:new Date().toISOString(), staff: getDb()?.employees?.length }));

// Keep-alive ping for Render free tier (prevents spin-down)
app.get('/', (_, res) => res.send('City Hospital HRMS API is running ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥 City Hospital HRMS Backend → port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});
