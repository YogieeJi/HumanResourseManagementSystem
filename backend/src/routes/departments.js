const express    = require('express');
const Department = require('../models/Department');
const Employee   = require('../models/Employee');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

async function enrich(dept) {
  const count = await Employee.countDocuments({ department_id: dept._id, status:'active' });
  const mgr   = dept.manager_id ? await Employee.findById(dept.manager_id) : null;
  return { ...dept.toObject(), id: dept._id, employee_count: count, manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : null };
}

router.get('/', async (req, res) => {
  try {
    const depts = await Department.find().sort({ name:1 });
    const data  = await Promise.all(depts.map(enrich));
    res.json({ success:true, data });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success:false, message:'Not found' });
    const members = await Employee.find({ department_id: dept._id, status:'active' })
      .select('-password_hash -__v');
    const enriched = await enrich(dept);
    res.json({ success:true, data:{ ...enriched, members } });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    if (!name) return res.status(400).json({ success:false, message:'Name required' });
    const dept = await Department.create({ name, description:description||'', manager_id:manager_id||null });
    res.status(201).json({ success:true, data: await enrich(dept), message:'Department created' });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ success:false, message:'Department name must be unique' });
    res.status(500).json({ success:false, message:err.message });
  }
});

router.put('/:id', requireRole('admin','manager'), async (req, res) => {
  try {
    const { name, description, manager_id } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (manager_id !== undefined) updates.manager_id = manager_id || null;
    const dept = await Department.findByIdAndUpdate(req.params.id, updates, { new:true });
    if (!dept) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, data: await enrich(dept), message:'Updated' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const active = await Employee.countDocuments({ department_id: req.params.id, status:'active' });
    if (active > 0) return res.status(400).json({ success:false, message:'Cannot delete department with active staff' });
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success:true, message:'Deleted' });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
