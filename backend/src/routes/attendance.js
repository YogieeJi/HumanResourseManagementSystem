const express    = require('express');
const Attendance = require('../models/Attendance');
const Employee   = require('../models/Employee');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function calcHours(ci, co) {
  if (!ci || !co) return 0;
  const [ih,im]=ci.split(':').map(Number), [oh,om]=co.split(':').map(Number);
  let diff = (oh*60+om) - (ih*60+im);
  if (diff < 0) diff += 24*60;
  return Math.round(diff/60*10)/10;
}

async function enrichRec(rec) {
  const emp  = await Employee.findById(rec.employee_id);
  const dept = emp?.department_id ? await Department.findById(emp.department_id) : null;
  return {
    ...rec.toObject(), id: rec._id,
    first_name: emp?.first_name, last_name: emp?.last_name,
    emp_code: emp?.emp_code, avatar_color: emp?.avatar_color,
    department_name: dept?.name
  };
}

router.get('/today-status', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const rec = await Attendance.findOne({ employee_id: req.user.id, date: today });
    res.json({ success:true, data: rec || null });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/summary/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (req.user.role === 'employee' && req.user.id !== employeeId)
      return res.status(403).json({ success:false, message:'Forbidden' });
    const { month, year } = req.query;
    const query = { employee_id: employeeId };
    if (month && year) {
      const m = String(month).padStart(2,'0');
      query.date = { $regex: `^${year}-${m}` };
    }
    const recs = await Attendance.find(query);
    res.json({ success:true, data:{
      present:     recs.filter(r=>r.status==='present').length,
      absent:      recs.filter(r=>r.status==='absent').length,
      half_day:    recs.filter(r=>r.status==='half_day').length,
      total_hours: Math.round(recs.reduce((s,r)=>s+(r.hours_worked||0),0)*10)/10,
      total_records: recs.length
    }});
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const { employee_id, month, year, date } = req.query;
    const query = {};
    if (req.user.role === 'employee') query.employee_id = req.user.id;
    else if (employee_id) query.employee_id = employee_id;
    if (date) query.date = date;
    if (month && year) query.date = { $regex: `^${year}-${String(month).padStart(2,'0')}` };
    const recs = await Attendance.find(query).sort({ date:-1 });
    const data = await Promise.all(recs.map(enrichRec));
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/check-in', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const time  = new Date().toTimeString().slice(0,5);
    const empId = req.user.role === 'employee' ? req.user.id : (req.body.employee_id || req.user.id);
    const existing = await Attendance.findOne({ employee_id: empId, date: today });
    if (existing?.check_in) return res.status(400).json({ success:false, message:'Already checked in today' });
    if (existing) { existing.check_in = time; existing.status = 'present'; await existing.save(); }
    else await Attendance.create({ employee_id:empId, date:today, check_in:time, status:'present' });
    res.json({ success:true, message:`Checked in at ${time}`, time });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/check-out', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const time  = new Date().toTimeString().slice(0,5);
    const empId = req.user.role === 'employee' ? req.user.id : (req.body.employee_id || req.user.id);
    const rec = await Attendance.findOne({ employee_id: empId, date: today });
    if (!rec?.check_in) return res.status(400).json({ success:false, message:'Please check in first' });
    if (rec.check_out) return res.status(400).json({ success:false, message:'Already checked out' });
    rec.check_out = time;
    rec.hours_worked = calcHours(rec.check_in, time);
    await rec.save();
    res.json({ success:true, message:`Checked out at ${time}. Hours: ${rec.hours_worked}`, time, hours:rec.hours_worked });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', requireRole('admin','manager'), async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out, status } = req.body;
    const hours = calcHours(check_in, check_out);
    await Attendance.findOneAndUpdate(
      { employee_id, date },
      { employee_id, date, check_in:check_in||null, check_out:check_out||null, status:status||'present', hours_worked:hours },
      { upsert:true, new:true }
    );
    res.json({ success:true, message:'Attendance recorded' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
