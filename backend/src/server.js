require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { connectDb } = require('./db/database');
const { authMiddleware } = require('./middleware/auth');
const Employee   = require('./models/Employee');
const Attendance = require('./models/Attendance');
const Leave      = require('./models/Leave');
const SalarySlip = require('./models/SalarySlip');
const Department = require('./models/Department');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Connect MongoDB and seed
connectDb();

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/employees',   require('./routes/employees'));
app.use('/api/attendance',  require('./routes/attendance'));
app.use('/api/leave',       require('./routes/leave'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/payroll',     require('./routes/payroll'));

// Dashboard
app.get('/api/dashboard', authMiddleware, async (req, res) => {
  try {
    const today  = new Date().toISOString().split('T')[0];
    const active = await Employee.countDocuments({ status:'active' });
    const presentToday  = await Attendance.countDocuments({ date:today, status:'present' });
    const pendingLeaves = await Leave.countDocuments({ status:'pending' });
    const m = new Date().getMonth()+1, y = new Date().getFullYear();
    const slips = await SalarySlip.find({ month:m, year:y });
    const monthlyPayroll = slips.reduce((s,x)=>s+x.net_salary,0);

    const recentLeaveDocs = await Leave.find().sort({ createdAt:-1 }).limit(5);
    const recentLeaves = await Promise.all(recentLeaveDocs.map(async l => {
      const e = await Employee.findById(l.employee_id);
      return { ...l.toObject(), id:l._id, first_name:e?.first_name, last_name:e?.last_name, avatar_color:e?.avatar_color, emp_code:e?.emp_code };
    }));

    const recentEmpDocs = await Employee.find({ status:'active' }).sort({ createdAt:-1 }).limit(5);
    const recentEmployees = await Promise.all(recentEmpDocs.map(async e => {
      const d = e.department_id ? await Department.findById(e.department_id) : null;
      const { password_hash, __v, ...rest } = e.toObject();
      return { ...rest, id:e._id, department_name:d?.name };
    }));

    // Attendance trend last 14 days
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-14);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const attRecs = await Attendance.find({ date:{ $gte:cutoffStr } });
    const attMap = {};
    attRecs.forEach(a => {
      if (!attMap[a.date]) attMap[a.date] = { date:a.date, present:0, absent:0, half_day:0 };
      attMap[a.date][a.status] = (attMap[a.date][a.status]||0)+1;
    });
    const attendanceTrend = Object.values(attMap).sort((a,b)=>a.date.localeCompare(b.date));

    const depts = await Department.find();
    const deptDistribution = await Promise.all(depts.map(async d => ({
      name: d.name,
      count: await Employee.countDocuments({ department_id:d._id, status:'active' })
    })));

    res.json({ success:true, data:{ stats:{ totalEmployees:active, presentToday, pendingLeaves, monthlyPayroll }, recentLeaves, recentEmployees, attendanceTrend, deptDistribution } });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

app.get('/api/health', (_, res) => res.json({ status:'ok', timestamp:new Date().toISOString() }));
app.get('/', (_, res) => res.send('City Hospital HRMS API ✅'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🏥 City Hospital HRMS → port ${PORT}`);
  console.log(`📋 Admin: admin@cityhospital.in / admin123\n`);
});
