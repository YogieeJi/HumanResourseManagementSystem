const express = require('express');
const { getDb, saveDb, nextId } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function enrich(d, db) {
  const active = db.employees.filter(e => e.department_id===d.id && e.status==='active');
  const mgr = d.manager_id ? db.employees.find(e=>e.id===d.manager_id) : null;
  return { ...d, employee_count:active.length, manager_name: mgr ? `${mgr.first_name} ${mgr.last_name}` : null };
}

router.get('/', (req, res) => {
  const db = getDb();
  res.json({ success:true, data: db.departments.map(d=>enrich(d,db)).sort((a,b)=>a.name.localeCompare(b.name)) });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const dept = db.departments.find(d=>d.id===parseInt(req.params.id));
  if (!dept) return res.status(404).json({ success:false, message:'Not found' });
  const members = db.employees.filter(e=>e.department_id===dept.id && e.status==='active')
    .map(({password_hash,...e})=>e);
  res.json({ success:true, data:{ ...enrich(dept,db), members } });
});

router.post('/', requireRole('admin'), (req, res) => {
  const db = getDb();
  const { name, description, manager_id } = req.body;
  if (!name) return res.status(400).json({ success:false, message:'Name required' });
  if (db.departments.find(d=>d.name.toLowerCase()===name.toLowerCase()))
    return res.status(400).json({ success:false, message:'Department name must be unique' });
  const dept = { id:nextId(db.departments), name, description:description||'', manager_id:manager_id?parseInt(manager_id):null };
  db.departments.push(dept);
  saveDb(db);
  res.status(201).json({ success:true, data:enrich(dept,db), message:'Department created' });
});

router.put('/:id', requireRole('admin','manager'), (req, res) => {
  const db = getDb();
  const dept = db.departments.find(d=>d.id===parseInt(req.params.id));
  if (!dept) return res.status(404).json({ success:false, message:'Not found' });
  const { name, description, manager_id } = req.body;
  if (name) dept.name = name;
  if (description!==undefined) dept.description = description;
  if (manager_id!==undefined) dept.manager_id = manager_id ? parseInt(manager_id) : null;
  saveDb(db);
  res.json({ success:true, data:enrich(dept,db), message:'Updated' });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const active = db.employees.filter(e=>e.department_id===id && e.status==='active').length;
  if (active>0) return res.status(400).json({ success:false, message:'Cannot delete department with active employees' });
  const idx = db.departments.findIndex(d=>d.id===id);
  if (idx!==-1) { db.departments.splice(idx,1); saveDb(db); }
  res.json({ success:true, message:'Deleted' });
});

module.exports = router;
