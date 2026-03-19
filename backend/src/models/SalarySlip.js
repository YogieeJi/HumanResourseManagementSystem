const mongoose = require('mongoose');

const salarySlipSchema = new mongoose.Schema({
  employee_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  month:               { type: Number, required: true },
  year:                { type: Number, required: true },
  basic_salary:        { type: Number, default: 0 },
  hra:                 { type: Number, default: 0 },
  transport_allowance: { type: Number, default: 0 },
  medical_allowance:   { type: Number, default: 0 },
  other_allowance:     { type: Number, default: 0 },
  pf_deduction:        { type: Number, default: 0 },
  esi_deduction:       { type: Number, default: 0 },
  professional_tax:    { type: Number, default: 0 },
  tax_deduction:       { type: Number, default: 0 },
  other_deduction:     { type: Number, default: 0 },
  gross_salary:        { type: Number, default: 0 },
  net_salary:          { type: Number, default: 0 },
  working_days:        { type: Number, default: 26 },
  present_days:        { type: Number, default: 0 },
  generated_at:        { type: Date, default: Date.now },
}, { timestamps: true });

salarySlipSchema.index({ employee_id: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SalarySlip', salarySlipSchema);
