const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  employee_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leave_type:   { type: String, required: true },
  start_date:   { type: String, required: true },
  end_date:     { type: String, required: true },
  days:         { type: Number, required: true },
  reason:       { type: String, default: '' },
  status:       { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  approved_by:  { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },
  approved_at:  { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
