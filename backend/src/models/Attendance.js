const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date:         { type: String, required: true },
  check_in:     { type: String, default: null },
  check_out:    { type: String, default: null },
  status:       { type: String, enum: ['present','absent','half_day'], default: 'present' },
  hours_worked: { type: Number, default: 0 },
}, { timestamps: true });

attendanceSchema.index({ employee_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
