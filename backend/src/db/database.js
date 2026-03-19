const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    await seedIfEmpty();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

async function seedIfEmpty() {
  const Employee   = require('../models/Employee');
  const Department = require('../models/Department');
  const Attendance = require('../models/Attendance');
  const Leave      = require('../models/Leave');
  const SalarySlip = require('../models/SalarySlip');

  const count = await Employee.countDocuments();
  if (count > 0) {
    console.log(`✅ Database already has ${count} staff records — skipping seed`);
    return;
  }

  console.log('📦 Seeding hospital data...');

  // Departments
  const deptData = [
    { name:'Emergency & Trauma',       description:'24x7 emergency care, trauma and critical interventions' },
    { name:'General Medicine',          description:'Diagnosis and treatment of adult diseases and conditions' },
    { name:'Surgery',                   description:'General and laparoscopic surgical procedures' },
    { name:'Obstetrics & Gynaecology',  description:'Maternity care, labour ward and gynaecological procedures' },
    { name:'Paediatrics',               description:'Medical care for infants, children and adolescents' },
    { name:'Orthopaedics',              description:'Bone, joint and musculoskeletal conditions and surgeries' },
    { name:'Cardiology',                description:'Heart disease diagnosis, ECG, echocardiography and ICU' },
    { name:'Radiology & Imaging',       description:'X-Ray, CT scan, MRI, ultrasound and diagnostics' },
    { name:'Pathology & Laboratory',    description:'Blood tests, biopsies, culture reports and diagnostics' },
    { name:'Pharmacy',                  description:'In-house dispensing, drug store and patient medication' },
    { name:'Nursing Administration',    description:'Nursing staff management, ward assignments and duty rosters' },
    { name:'Hospital Administration',   description:'HR, billing, records management and facility operations' },
  ];

  const departments = await Department.insertMany(deptData);
  const deptMap = {};
  departments.forEach(d => { deptMap[d.name] = d._id; });

  // Employees
  const rawStaff = [
    { emp_code:'HMS001', first_name:'Suresh',     last_name:'Nair',      email:'admin@cityhospital.in',           plain:'admin123',   phone:'9810012301', dept:'Hospital Administration',  role:'admin',    designation:'Hospital Administrator',         join_date:'2018-04-01', salary:180000, avatar_color:'#6366f1', employee_type:'Non-Clinical', shift:'General'  },
    { emp_code:'HMS002', first_name:'Meena',      last_name:'Krishnan',  email:'meena.krishnan@cityhospital.in',  plain:'manager123', phone:'9810012302', dept:'Nursing Administration',   role:'manager',  designation:'Chief Nursing Officer',          join_date:'2019-01-15', salary:120000, avatar_color:'#ec4899', employee_type:'Nursing',      shift:'General'  },
    { emp_code:'HMS003', first_name:'Dr. Arvind', last_name:'Chaudhary', email:'arvind.chaudhary@cityhospital.in',plain:'manager456', phone:'9810012303', dept:'Emergency & Trauma',       role:'manager',  designation:'HOD - Emergency Medicine',       join_date:'2017-07-01', salary:250000, avatar_color:'#ef4444', employee_type:'Doctor',       shift:'Rotating' },
    { emp_code:'HMS004', first_name:'Lata',       last_name:'Pillai',    email:'lata.pillai@cityhospital.in',     plain:'emp123',     phone:'9810012304', dept:'Nursing Administration',   role:'employee', designation:'Senior Staff Nurse',             join_date:'2020-03-10', salary:45000,  avatar_color:'#06b6d4', employee_type:'Nursing',      shift:'Morning'  },
    { emp_code:'HMS005', first_name:'Dr. Rekha',  last_name:'Iyer',      email:'rekha.iyer@cityhospital.in',      plain:'manager456', phone:'9810012305', dept:'General Medicine',          role:'manager',  designation:'HOD - General Medicine',         join_date:'2016-08-01', salary:280000, avatar_color:'#8b5cf6', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS006', first_name:'Pooja',      last_name:'Menon',     email:'pooja.menon@cityhospital.in',     plain:'emp123',     phone:'9810012306', dept:'Nursing Administration',   role:'employee', designation:'Staff Nurse',                    join_date:'2022-06-01', salary:38000,  avatar_color:'#f59e0b', employee_type:'Nursing',      shift:'Evening'  },
    { emp_code:'HMS007', first_name:'Dr. Vikash', last_name:'Sharma',    email:'vikash.sharma@cityhospital.in',   plain:'manager456', phone:'9810012307', dept:'Surgery',                  role:'manager',  designation:'HOD - General Surgery',          join_date:'2015-05-01', salary:320000, avatar_color:'#10b981', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS008', first_name:'Anita',      last_name:'Thomas',    email:'anita.thomas@cityhospital.in',    plain:'emp123',     phone:'9810012308', dept:'Nursing Administration',   role:'employee', designation:'ICU Staff Nurse',                join_date:'2021-01-20', salary:52000,  avatar_color:'#3b82f6', employee_type:'Nursing',      shift:'Night'    },
    { emp_code:'HMS009', first_name:'Dr. Sunita', last_name:'Batra',     email:'sunita.batra@cityhospital.in',    plain:'manager456', phone:'9810012309', dept:'Obstetrics & Gynaecology', role:'manager',  designation:'HOD - Obstetrics & Gynaecology', join_date:'2018-02-14', salary:290000, avatar_color:'#f97316', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS010', first_name:'Kavitha',    last_name:'Nair',      email:'kavitha.nair@cityhospital.in',    plain:'emp123',     phone:'9810012310', dept:'Nursing Administration',   role:'employee', designation:'OT Scrub Nurse',                 join_date:'2020-09-01', salary:48000,  avatar_color:'#84cc16', employee_type:'Nursing',      shift:'Morning'  },
    { emp_code:'HMS011', first_name:'Dr. Ramesh', last_name:'Kulkarni',  email:'ramesh.kulkarni@cityhospital.in', plain:'manager456', phone:'9810012311', dept:'Paediatrics',              role:'manager',  designation:'HOD - Paediatrics',              join_date:'2019-06-01', salary:260000, avatar_color:'#6366f1', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS012', first_name:'Dr. Priya',  last_name:'Verma',     email:'priya.verma@cityhospital.in',     plain:'emp123',     phone:'9810012312', dept:'General Medicine',          role:'employee', designation:'Resident Medical Officer',       join_date:'2023-01-10', salary:85000,  avatar_color:'#ec4899', employee_type:'Doctor',       shift:'Rotating' },
    { emp_code:'HMS013', first_name:'Dr. Arun',   last_name:'Pillai',    email:'arun.pillai@cityhospital.in',     plain:'emp123',     phone:'9810012313', dept:'Emergency & Trauma',       role:'employee', designation:'Emergency Medical Officer',      join_date:'2022-04-01', salary:90000,  avatar_color:'#f59e0b', employee_type:'Doctor',       shift:'Night'    },
    { emp_code:'HMS014', first_name:'Dr. Neha',   last_name:'Gupta',     email:'neha.gupta@cityhospital.in',      plain:'emp123',     phone:'9810012314', dept:'Cardiology',               role:'employee', designation:'Cardiologist',                   join_date:'2021-08-01', salary:220000, avatar_color:'#10b981', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS015', first_name:'Dr. Sanjay', last_name:'Mehta',     email:'sanjay.mehta@cityhospital.in',    plain:'emp123',     phone:'9810012315', dept:'Orthopaedics',             role:'employee', designation:'Orthopaedic Surgeon',            join_date:'2020-11-01', salary:240000, avatar_color:'#8b5cf6', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS016', first_name:'Rohit',      last_name:'Yadav',     email:'rohit.yadav@cityhospital.in',     plain:'emp123',     phone:'9810012316', dept:'Radiology & Imaging',      role:'employee', designation:'Radiographer',                   join_date:'2021-05-15', salary:42000,  avatar_color:'#ef4444', employee_type:'Paramedical',  shift:'Morning'  },
    { emp_code:'HMS017', first_name:'Sunita',     last_name:'Sharma',    email:'sunita.sharma@cityhospital.in',   plain:'emp123',     phone:'9810012317', dept:'Pathology & Laboratory',   role:'employee', designation:'Lab Technician',                 join_date:'2022-02-01', salary:38000,  avatar_color:'#06b6d4', employee_type:'Paramedical',  shift:'Morning'  },
    { emp_code:'HMS018', first_name:'Deepak',     last_name:'Singh',     email:'deepak.singh@cityhospital.in',    plain:'emp123',     phone:'9810012318', dept:'Pharmacy',                 role:'employee', designation:'Pharmacist',                     join_date:'2023-03-01', salary:35000,  avatar_color:'#84cc16', employee_type:'Paramedical',  shift:'General'  },
    { emp_code:'HMS019', first_name:'Anjali',     last_name:'Dubey',     email:'anjali.dubey@cityhospital.in',    plain:'emp123',     phone:'9810012319', dept:'Hospital Administration',  role:'employee', designation:'Medical Records Officer',        join_date:'2021-09-01', salary:32000,  avatar_color:'#f97316', employee_type:'Non-Clinical', shift:'General'  },
    { emp_code:'HMS020', first_name:'Ravi',       last_name:'Pandey',    email:'ravi.pandey@cityhospital.in',     plain:'emp123',     phone:'9810012320', dept:'Hospital Administration',  role:'employee', designation:'Hospital Billing Executive',     join_date:'2022-08-15', salary:30000,  avatar_color:'#3b82f6', employee_type:'Non-Clinical', shift:'General'  },
    { emp_code:'HMS021', first_name:'Geeta',      last_name:'Rawat',     email:'geeta.rawat@cityhospital.in',     plain:'emp123',     phone:'9810012321', dept:'Nursing Administration',   role:'employee', designation:'Ward Nurse',                     join_date:'2023-06-01', salary:36000,  avatar_color:'#ec4899', employee_type:'Nursing',      shift:'Evening'  },
    { emp_code:'HMS022', first_name:'Dr. Fatima', last_name:'Sheikh',    email:'fatima.sheikh@cityhospital.in',   plain:'emp123',     phone:'9810012322', dept:'Obstetrics & Gynaecology', role:'employee', designation:'Gynaecologist',                  join_date:'2022-10-01', salary:200000, avatar_color:'#f59e0b', employee_type:'Doctor',       shift:'General'  },
    { emp_code:'HMS023', first_name:'Mahesh',     last_name:'Kumar',     email:'mahesh.kumar@cityhospital.in',    plain:'emp123',     phone:'9810012323', dept:'Hospital Administration',  role:'employee', designation:'Biomedical Engineer',            join_date:'2020-07-01', salary:55000,  avatar_color:'#10b981', employee_type:'Technical',    shift:'General'  },
  ];

  console.log('🔐 Hashing passwords...');
  const employeeDocs = rawStaff.map(({ plain, dept, ...rest }) => ({
    ...rest,
    department_id: deptMap[dept] || null,
    password_hash: bcrypt.hashSync(plain, 10),
    status: 'active',
  }));

  const employees = await Employee.insertMany(employeeDocs);
  console.log(`✅ ${employees.length} staff created`);

  // Update department managers
  const empMap = {};
  employees.forEach(e => { empMap[e.emp_code] = e._id; });

  await Department.findByIdAndUpdate(deptMap['Emergency & Trauma'],       { manager_id: empMap['HMS003'] });
  await Department.findByIdAndUpdate(deptMap['General Medicine'],          { manager_id: empMap['HMS005'] });
  await Department.findByIdAndUpdate(deptMap['Surgery'],                   { manager_id: empMap['HMS007'] });
  await Department.findByIdAndUpdate(deptMap['Obstetrics & Gynaecology'],  { manager_id: empMap['HMS009'] });
  await Department.findByIdAndUpdate(deptMap['Paediatrics'],               { manager_id: empMap['HMS011'] });
  await Department.findByIdAndUpdate(deptMap['Nursing Administration'],    { manager_id: empMap['HMS002'] });
  await Department.findByIdAndUpdate(deptMap['Hospital Administration'],   { manager_id: empMap['HMS001'] });

  // Attendance - last 30 working days
  const attendanceDocs = [];
  const now = new Date();
  for (let i = 1; i <= 35; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    employees.forEach(emp => {
      const r = Math.random();
      let rec = { employee_id: emp._id, date: dateStr };
      if (r < 0.84) {
        let baseIn = 8;
        if (emp.shift === 'Evening')  baseIn = 14;
        if (emp.shift === 'Night')    baseIn = 21;
        if (emp.shift === 'Rotating') baseIn = 7 + Math.floor(Math.random() * 8);
        const ci = `${String(baseIn).padStart(2,'0')}:${String(Math.floor(Math.random()*30)).padStart(2,'0')}`;
        const coH = (baseIn + 8) % 24;
        const co  = `${String(coH).padStart(2,'0')}:${String(30 + Math.floor(Math.random()*15)).padStart(2,'0')}`;
        const [ih,im] = ci.split(':').map(Number);
        let   [oh,om] = co.split(':').map(Number);
        if (oh < ih) oh += 24;
        rec = { ...rec, check_in:ci, check_out:co, status:'present', hours_worked:Math.round(((oh*60+om)-(ih*60+im))/60*10)/10 };
      } else if (r < 0.91) {
        rec = { ...rec, check_in:null, check_out:null, status:'absent', hours_worked:0 };
      } else {
        rec = { ...rec, check_in:`08:00`, check_out:null, status:'half_day', hours_worked:4 };
      }
      attendanceDocs.push(rec);
    });
  }
  await Attendance.insertMany(attendanceDocs);
  console.log(`✅ ${attendanceDocs.length} attendance records created`);

  // Leave requests
  const leaveData = [
    { employee_id:employees[3]._id,  leave_type:'casual',    start_date:'2024-12-23', end_date:'2024-12-24', days:2,  reason:'Personal work',              status:'approved', approved_by:employees[1]._id, approved_at:new Date('2024-12-20') },
    { employee_id:employees[11]._id, leave_type:'sick',       start_date:'2025-01-06', end_date:'2025-01-07', days:2,  reason:'Viral fever',                status:'approved', approved_by:employees[4]._id, approved_at:new Date('2025-01-05') },
    { employee_id:employees[15]._id, leave_type:'earned',     start_date:'2025-01-20', end_date:'2025-01-25', days:6,  reason:'Annual family trip',         status:'pending',  approved_by:null, approved_at:null },
    { employee_id:employees[12]._id, leave_type:'casual',     start_date:'2025-02-05', end_date:'2025-02-05', days:1,  reason:'Bank work',                  status:'rejected', approved_by:employees[2]._id, approved_at:new Date('2025-02-03') },
    { employee_id:employees[16]._id, leave_type:'sick',       start_date:'2025-02-12', end_date:'2025-02-13', days:2,  reason:'Dengue fever',               status:'approved', approved_by:employees[0]._id, approved_at:new Date('2025-02-11') },
    { employee_id:employees[5]._id,  leave_type:'maternity',  start_date:'2025-03-01', end_date:'2025-05-29', days:90, reason:'Maternity leave',            status:'approved', approved_by:employees[1]._id, approved_at:new Date('2025-02-20') },
    { employee_id:employees[7]._id,  leave_type:'casual',     start_date:'2025-03-10', end_date:'2025-03-11', days:2,  reason:'Attending wedding',          status:'pending',  approved_by:null, approved_at:null },
    { employee_id:employees[19]._id, leave_type:'casual',     start_date:'2025-03-18', end_date:'2025-03-18', days:1,  reason:'Medical check-up',           status:'pending',  approved_by:null, approved_at:null },
    { employee_id:employees[21]._id, leave_type:'earned',     start_date:'2025-04-07', end_date:'2025-04-11', days:5,  reason:'Eid holidays',               status:'pending',  approved_by:null, approved_at:null },
    { employee_id:employees[13]._id, leave_type:'conference', start_date:'2025-04-14', end_date:'2025-04-16', days:3,  reason:'Cardiology CME, Mumbai',     status:'approved', approved_by:employees[0]._id, approved_at:new Date('2025-04-01') },
  ];
  await Leave.insertMany(leaveData);
  console.log(`✅ ${leaveData.length} leave requests created`);

  // Salary slips
  const slipDocs = [];
  for (const { month, year } of [{month:12,year:2024},{month:1,year:2025},{month:2,year:2025}]) {
    for (const emp of employees) {
      const basic=Math.round(emp.salary*0.5), hra=Math.round(emp.salary*0.2);
      const transport=1600, medical=1250, special=Math.round(emp.salary*0.08);
      const gross=basic+hra+transport+medical+special;
      const pf=Math.round(basic*0.12), esi=gross<=21000?Math.round(gross*0.0075):0;
      const pt=gross>15000?200:0, tds=Math.round(gross*0.05);
      slipDocs.push({
        employee_id:emp._id, month, year,
        basic_salary:basic, hra, transport_allowance:transport,
        medical_allowance:medical, other_allowance:special,
        pf_deduction:pf, esi_deduction:esi, professional_tax:pt,
        tax_deduction:tds, other_deduction:0,
        gross_salary:gross, net_salary:gross-pf-esi-pt-tds,
        working_days:26, present_days:20+Math.floor(Math.random()*4),
      });
    }
  }
  await SalarySlip.insertMany(slipDocs);
  console.log(`✅ ${slipDocs.length} salary slips created`);
  console.log('🏥 Hospital seed complete!');
}

module.exports = { connectDb };
