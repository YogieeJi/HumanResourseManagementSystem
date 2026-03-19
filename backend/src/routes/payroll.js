const express    = require('express');
const SalarySlip = require('../models/SalarySlip');
const Employee   = require('../models/Employee');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function enrich(slip) {
  const emp  = await Employee.findById(slip.employee_id);
  const dept = emp?.department_id ? await Department.findById(emp.department_id) : null;
  return { ...slip.toObject(), id: slip._id, first_name:emp?.first_name, last_name:emp?.last_name,
    emp_code:emp?.emp_code, designation:emp?.designation, avatar_color:emp?.avatar_color,
    employee_type:emp?.employee_type, shift:emp?.shift, department_name:dept?.name };
}

router.get('/slips', async (req, res) => {
  try {
    const { employee_id, month, year } = req.query;
    const query = {};
    if (req.user.role === 'employee') query.employee_id = req.user.id;
    else if (employee_id) query.employee_id = employee_id;
    if (month) query.month = parseInt(month);
    if (year)  query.year  = parseInt(year);
    const slips = await SalarySlip.find(query).sort({ year:-1, month:-1 });
    const data  = await Promise.all(slips.map(enrich));
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/slips/:id', async (req, res) => {
  try {
    const slip = await SalarySlip.findById(req.params.id);
    if (!slip) return res.status(404).json({ success:false, message:'Not found' });
    if (req.user.role === 'employee' && slip.employee_id.toString() !== req.user.id)
      return res.status(403).json({ success:false, message:'Forbidden' });
    res.json({ success:true, data: await enrich(slip) });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/generate', requireRole('admin'), async (req, res) => {
  try {
    const { month, year } = req.body;
    if (!month || !year) return res.status(400).json({ success:false, message:'Month and year required' });
    const m = parseInt(month), y = parseInt(year);
    const employees = await Employee.find({ status:'active' });
    const generated = [];
    for (const emp of employees) {
      const basic=Math.round(emp.salary*0.5), hra=Math.round(emp.salary*0.2);
      const transport=1600, medical=1250, special=Math.round(emp.salary*0.08);
      const gross=basic+hra+transport+medical+special;
      const pf=Math.round(basic*0.12), esi=gross<=21000?Math.round(gross*0.0075):0;
      const pt=gross>15000?200:0, tds=Math.round(gross*0.05);
      const net=gross-pf-esi-pt-tds;
      const mStr = String(m).padStart(2,'0');
      const presentDays = await Attendance.countDocuments({
        employee_id: emp._id, status:'present', date: { $regex:`^${y}-${mStr}` }
      }) || 22;
      await SalarySlip.findOneAndUpdate(
        { employee_id:emp._id, month:m, year:y },
        { employee_id:emp._id, month:m, year:y, basic_salary:basic, hra, transport_allowance:transport,
          medical_allowance:medical, other_allowance:special, pf_deduction:pf, esi_deduction:esi,
          professional_tax:pt, tax_deduction:tds, other_deduction:0, gross_salary:gross,
          net_salary:net, working_days:26, present_days:presentDays, generated_at:new Date() },
        { upsert:true, new:true }
      );
      generated.push({ emp_code:emp.emp_code, net_salary:net });
    }
    res.json({ success:true, data:generated, message:`Generated ${generated.length} pay slips` });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/summary', requireRole('admin','manager'), async (req, res) => {
  try {
    const m = parseInt(req.query.month || new Date().getMonth()+1);
    const y = parseInt(req.query.year  || new Date().getFullYear());
    const slips = await SalarySlip.find({ month:m, year:y });
    const summary = slips.length === 0 ? null : {
      total_slips: slips.length,
      total_gross: slips.reduce((s,x)=>s+x.gross_salary,0),
      total_net:   slips.reduce((s,x)=>s+x.net_salary,0),
      total_pf:    slips.reduce((s,x)=>s+x.pf_deduction,0),
      total_esi:   slips.reduce((s,x)=>s+(x.esi_deduction||0),0),
      avg_salary:  Math.round(slips.reduce((s,x)=>s+x.net_salary,0)/slips.length),
    };
    const depts = await Department.find();
    const byDept = await Promise.all(depts.map(async d => {
      const emps = await Employee.find({ department_id:d._id });
      const empIds = emps.map(e=>e._id.toString());
      const dSlips = slips.filter(s=>empIds.includes(s.employee_id.toString()));
      return { name:d.name, count:dSlips.length, total:dSlips.reduce((s,x)=>s+x.net_salary,0) };
    }));
    res.json({ success:true, data:{ summary, byDept, month:m, year:y } });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
