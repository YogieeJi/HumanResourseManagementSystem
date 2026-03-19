const express    = require('express');
const Leave      = require('../models/Leave');
const Employee   = require('../models/Employee');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function calcDays(start, end) {
  let days = 0;
  for (let d = new Date(start); d <= new Date(end); d.setDate(d.getDate()+1))
    if (d.getDay()!==0 && d.getDay()!==6) days++;
  return days;
}

async function enrichLeave(l) {
  const emp  = await Employee.findById(l.employee_id);
  const dept = emp?.department_id ? await Department.findById(emp.department_id) : null;
  const appr = l.approved_by ? await Employee.findById(l.approved_by) : null;
  return {
    ...l.toObject(), id: l._id,
    first_name: emp?.first_name, last_name: emp?.last_name,
    emp_code: emp?.emp_code, avatar_color: emp?.avatar_color,
    department_name: dept?.name,
    approver_first_name: appr?.first_name, approver_last_name: appr?.last_name
  };
}

router.get('/balance/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    if (req.user.role === 'employee' && req.user.id !== employeeId)
      return res.status(403).json({ success:false, message:'Forbidden' });
    const year = String(new Date().getFullYear());
    const approved = await Leave.find({ employee_id: employeeId, status:'approved', start_date: { $regex:`^${year}` } });
    const entitlement = { casual:12, sick:12, earned:21, maternity:182, paternity:7, conference:5, other:5 };
    const balance = {};
    Object.keys(entitlement).forEach(type => {
      const used = approved.filter(l=>l.leave_type===type).reduce((s,l)=>s+l.days,0);
      balance[type] = { entitled:entitlement[type], used, available:Math.max(0,entitlement[type]-used) };
    });
    res.json({ success:true, data:balance });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/', async (req, res) => {
  try {
    const query = {};
    if (req.user.role === 'employee') query.employee_id = req.user.id;
    else if (req.query.employee_id) query.employee_id = req.query.employee_id;
    if (req.query.status) query.status = req.query.status;
    if (req.query.year) query.start_date = { $regex:`^${req.query.year}` };
    const leaves = await Leave.find(query).sort({ createdAt:-1 });
    const data = await Promise.all(leaves.map(enrichLeave));
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;
    if (!leave_type||!start_date||!end_date)
      return res.status(400).json({ success:false, message:'Required fields missing' });
    if (new Date(end_date)<new Date(start_date))
      return res.status(400).json({ success:false, message:'End date must be after start date' });
    const days = calcDays(start_date, end_date);
    const leave = await Leave.create({ employee_id:req.user.id, leave_type, start_date, end_date, days, reason:reason||'' });
    res.status(201).json({ success:true, data: await enrichLeave(leave), message:'Leave request submitted' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.put('/:id/approve', requireRole('admin','manager'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved','rejected'].includes(status))
      return res.status(400).json({ success:false, message:'Invalid status' });
    const leave = await Leave.findByIdAndUpdate(req.params.id,
      { status, approved_by: req.user.id, approved_at: new Date() }, { new:true });
    if (!leave) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: await enrichLeave(leave), message:`Leave ${status}` });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success:false, message:'Not found' });
    if (leave.status !== 'pending') return res.status(400).json({ success:false, message:'Can only cancel pending requests' });
    if (leave.employee_id.toString() !== req.user.id && req.user.role === 'employee')
      return res.status(403).json({ success:false, message:'Forbidden' });
    await leave.deleteOne();
    res.json({ success:true, message:'Cancelled' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
