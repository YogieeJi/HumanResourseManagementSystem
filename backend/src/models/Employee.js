const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  emp_code:      { type: String, required: true, unique: true },
  first_name:    { type: String, required: true },
  last_name:     { type: String, required: true },
  email:         { type: String, required: true, unique: true, lowercase: true },
  password_hash: { type: String, required: true },
  phone:         { type: String, default: '' },
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  role:          { type: String, enum: ['admin','manager','employee'], default: 'employee' },
  designation:   { type: String, default: '' },
  employee_type: { type: String, default: 'Non-Clinical' },
  shift:         { type: String, default: 'General' },
  join_date:     { type: String, default: '' },
  status:        { type: String, enum: ['active','inactive'], default: 'active' },
  salary:        { type: Number, default: 0 },
  address:       { type: String, default: '' },
  avatar_color:  { type: String, default: '#6366f1' },
}, { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);
