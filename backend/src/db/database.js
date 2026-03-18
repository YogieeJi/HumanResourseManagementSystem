/**
 * In-memory data store — seeded fresh on server start.
 * Works on any host (Render, Railway, Fly) with zero filesystem deps.
 * Data persists while the server is running; resets on restart/redeploy.
 */
const bcrypt = require('bcryptjs');

let DB = null;

function nextId(arr) {
  return arr.length === 0 ? 1 : Math.max(...arr.map(x => x.id)) + 1;
}

function buildSeed() {
  const departments = [
    { id:1,  name:'Emergency & Trauma',       description:'24x7 emergency care, trauma and critical interventions',          manager_id:3  },
    { id:2,  name:'General Medicine',          description:'Diagnosis and treatment of adult diseases and conditions',        manager_id:5  },
    { id:3,  name:'Surgery',                   description:'General and laparoscopic surgical procedures',                    manager_id:7  },
    { id:4,  name:'Obstetrics & Gynaecology',  description:'Maternity care, labour ward and gynaecological procedures',      manager_id:9  },
    { id:5,  name:'Paediatrics',               description:'Medical care for infants, children and adolescents',             manager_id:11 },
    { id:6,  name:'Orthopaedics',              description:'Bone, joint and musculoskeletal conditions and surgeries',       manager_id:null },
    { id:7,  name:'Cardiology',                description:'Heart disease diagnosis, ECG, echocardiography and ICU',        manager_id:null },
    { id:8,  name:'Radiology & Imaging',       description:'X-Ray, CT scan, MRI, ultrasound and diagnostics',               manager_id:null },
    { id:9,  name:'Pathology & Laboratory',    description:'Blood tests, biopsies, culture reports and diagnostics',        manager_id:null },
    { id:10, name:'Pharmacy',                  description:'In-house dispensing, drug store and patient medication',         manager_id:null },
    { id:11, name:'Nursing Administration',    description:'Nursing staff management, ward assignments and duty rosters',   manager_id:2  },
    { id:12, name:'Hospital Administration',   description:'HR, billing, records management and facility operations',       manager_id:1  },
  ];

  const raw = [
    { id:1,  emp_code:'HMS001', first_name:'Suresh',     last_name:'Nair',      email:'admin@cityhospital.in',           plain:'admin123',   phone:'9810012301', department_id:12, role:'admin',    designation:'Hospital Administrator',         join_date:'2018-04-01', status:'active', salary:180000, address:'Sector 12, Rohini, Delhi',          avatar_color:'#6366f1', employee_type:'Non-Clinical', shift:'General'  },
    { id:2,  emp_code:'HMS002', first_name:'Meena',      last_name:'Krishnan',  email:'meena.krishnan@cityhospital.in',  plain:'manager123', phone:'9810012302', department_id:11, role:'manager',  designation:'Chief Nursing Officer',          join_date:'2019-01-15', status:'active', salary:120000, address:'Dwarka Sector 6, Delhi',            avatar_color:'#ec4899', employee_type:'Nursing',      shift:'General'  },
    { id:3,  emp_code:'HMS003', first_name:'Dr. Arvind', last_name:'Chaudhary', email:'arvind.chaudhary@cityhospital.in',plain:'manager456', phone:'9810012303', department_id:1,  role:'manager',  designation:'HOD - Emergency Medicine',       join_date:'2017-07-01', status:'active', salary:250000, address:'Vasant Kunj, Delhi',                avatar_color:'#ef4444', employee_type:'Doctor',       shift:'Rotating' },
    { id:4,  emp_code:'HMS004', first_name:'Lata',       last_name:'Pillai',    email:'lata.pillai@cityhospital.in',     plain:'emp123',     phone:'9810012304', department_id:11, role:'employee', designation:'Senior Staff Nurse',             join_date:'2020-03-10', status:'active', salary:45000,  address:'Janakpuri, Delhi',                  avatar_color:'#06b6d4', employee_type:'Nursing',      shift:'Morning'  },
    { id:5,  emp_code:'HMS005', first_name:'Dr. Rekha',  last_name:'Iyer',      email:'rekha.iyer@cityhospital.in',      plain:'manager456', phone:'9810012305', department_id:2,  role:'manager',  designation:'HOD - General Medicine',         join_date:'2016-08-01', status:'active', salary:280000, address:'Greater Kailash, Delhi',            avatar_color:'#8b5cf6', employee_type:'Doctor',       shift:'General'  },
    { id:6,  emp_code:'HMS006', first_name:'Pooja',      last_name:'Menon',     email:'pooja.menon@cityhospital.in',     plain:'emp123',     phone:'9810012306', department_id:11, role:'employee', designation:'Staff Nurse',                    join_date:'2022-06-01', status:'active', salary:38000,  address:'Uttam Nagar, Delhi',                avatar_color:'#f59e0b', employee_type:'Nursing',      shift:'Evening'  },
    { id:7,  emp_code:'HMS007', first_name:'Dr. Vikash', last_name:'Sharma',    email:'vikash.sharma@cityhospital.in',   plain:'manager456', phone:'9810012307', department_id:3,  role:'manager',  designation:'HOD - General Surgery',          join_date:'2015-05-01', status:'active', salary:320000, address:'South Extension, Delhi',            avatar_color:'#10b981', employee_type:'Doctor',       shift:'General'  },
    { id:8,  emp_code:'HMS008', first_name:'Anita',      last_name:'Thomas',    email:'anita.thomas@cityhospital.in',    plain:'emp123',     phone:'9810012308', department_id:11, role:'employee', designation:'ICU Staff Nurse',                join_date:'2021-01-20', status:'active', salary:52000,  address:'Lajpat Nagar, Delhi',               avatar_color:'#3b82f6', employee_type:'Nursing',      shift:'Night'    },
    { id:9,  emp_code:'HMS009', first_name:'Dr. Sunita', last_name:'Batra',     email:'sunita.batra@cityhospital.in',    plain:'manager456', phone:'9810012309', department_id:4,  role:'manager',  designation:'HOD - Obstetrics & Gynaecology', join_date:'2018-02-14', status:'active', salary:290000, address:'Saket, Delhi',                      avatar_color:'#f97316', employee_type:'Doctor',       shift:'General'  },
    { id:10, emp_code:'HMS010', first_name:'Kavitha',    last_name:'Nair',      email:'kavitha.nair@cityhospital.in',    plain:'emp123',     phone:'9810012310', department_id:11, role:'employee', designation:'OT Scrub Nurse',                 join_date:'2020-09-01', status:'active', salary:48000,  address:'Patparganj, Delhi',                 avatar_color:'#84cc16', employee_type:'Nursing',      shift:'Morning'  },
    { id:11, emp_code:'HMS011', first_name:'Dr. Ramesh', last_name:'Kulkarni',  email:'ramesh.kulkarni@cityhospital.in', plain:'manager456', phone:'9810012311', department_id:5,  role:'manager',  designation:'HOD - Paediatrics',              join_date:'2019-06-01', status:'active', salary:260000, address:'Mayur Vihar, Delhi',                avatar_color:'#6366f1', employee_type:'Doctor',       shift:'General'  },
    { id:12, emp_code:'HMS012', first_name:'Dr. Priya',  last_name:'Verma',     email:'priya.verma@cityhospital.in',     plain:'emp123',     phone:'9810012312', department_id:2,  role:'employee', designation:'Resident Medical Officer',       join_date:'2023-01-10', status:'active', salary:85000,  address:'Rohini Sector 3, Delhi',            avatar_color:'#ec4899', employee_type:'Doctor',       shift:'Rotating' },
    { id:13, emp_code:'HMS013', first_name:'Dr. Arun',   last_name:'Pillai',    email:'arun.pillai@cityhospital.in',     plain:'emp123',     phone:'9810012313', department_id:1,  role:'employee', designation:'Emergency Medical Officer',      join_date:'2022-04-01', status:'active', salary:90000,  address:'Dwarka Sector 10, Delhi',           avatar_color:'#f59e0b', employee_type:'Doctor',       shift:'Night'    },
    { id:14, emp_code:'HMS014', first_name:'Dr. Neha',   last_name:'Gupta',     email:'neha.gupta@cityhospital.in',      plain:'emp123',     phone:'9810012314', department_id:7,  role:'employee', designation:'Cardiologist',                   join_date:'2021-08-01', status:'active', salary:220000, address:'Vasant Vihar, Delhi',               avatar_color:'#10b981', employee_type:'Doctor',       shift:'General'  },
    { id:15, emp_code:'HMS015', first_name:'Dr. Sanjay', last_name:'Mehta',     email:'sanjay.mehta@cityhospital.in',    plain:'emp123',     phone:'9810012315', department_id:6,  role:'employee', designation:'Orthopaedic Surgeon',            join_date:'2020-11-01', status:'active', salary:240000, address:'Hauz Khas, Delhi',                  avatar_color:'#8b5cf6', employee_type:'Doctor',       shift:'General'  },
    { id:16, emp_code:'HMS016', first_name:'Rohit',      last_name:'Yadav',     email:'rohit.yadav@cityhospital.in',     plain:'emp123',     phone:'9810012316', department_id:8,  role:'employee', designation:'Radiographer',                   join_date:'2021-05-15', status:'active', salary:42000,  address:'Shahdara, Delhi',                   avatar_color:'#ef4444', employee_type:'Paramedical',  shift:'Morning'  },
    { id:17, emp_code:'HMS017', first_name:'Sunita',     last_name:'Sharma',    email:'sunita.sharma@cityhospital.in',   plain:'emp123',     phone:'9810012317', department_id:9,  role:'employee', designation:'Lab Technician',                 join_date:'2022-02-01', status:'active', salary:38000,  address:'Sarojini Nagar, Delhi',             avatar_color:'#06b6d4', employee_type:'Paramedical',  shift:'Morning'  },
    { id:18, emp_code:'HMS018', first_name:'Deepak',     last_name:'Singh',     email:'deepak.singh@cityhospital.in',    plain:'emp123',     phone:'9810012318', department_id:10, role:'employee', designation:'Pharmacist',                     join_date:'2023-03-01', status:'active', salary:35000,  address:'Uttam Nagar, Delhi',                avatar_color:'#84cc16', employee_type:'Paramedical',  shift:'General'  },
    { id:19, emp_code:'HMS019', first_name:'Anjali',     last_name:'Dubey',     email:'anjali.dubey@cityhospital.in',    plain:'emp123',     phone:'9810012319', department_id:12, role:'employee', designation:'Medical Records Officer',        join_date:'2021-09-01', status:'active', salary:32000,  address:'Kirti Nagar, Delhi',                avatar_color:'#f97316', employee_type:'Non-Clinical', shift:'General'  },
    { id:20, emp_code:'HMS020', first_name:'Ravi',       last_name:'Pandey',    email:'ravi.pandey@cityhospital.in',     plain:'emp123',     phone:'9810012320', department_id:12, role:'employee', designation:'Hospital Billing Executive',     join_date:'2022-08-15', status:'active', salary:30000,  address:'Tilak Nagar, Delhi',                avatar_color:'#3b82f6', employee_type:'Non-Clinical', shift:'General'  },
    { id:21, emp_code:'HMS021', first_name:'Geeta',      last_name:'Rawat',     email:'geeta.rawat@cityhospital.in',     plain:'emp123',     phone:'9810012321', department_id:11, role:'employee', designation:'Ward Nurse',                     join_date:'2023-06-01', status:'active', salary:36000,  address:'Pitampura, Delhi',                  avatar_color:'#ec4899', employee_type:'Nursing',      shift:'Evening'  },
    { id:22, emp_code:'HMS022', first_name:'Dr. Fatima', last_name:'Sheikh',    email:'fatima.sheikh@cityhospital.in',   plain:'emp123',     phone:'9810012322', department_id:4,  role:'employee', designation:'Gynaecologist',                  join_date:'2022-10-01', status:'active', salary:200000, address:'Okhla, Delhi',                      avatar_color:'#f59e0b', employee_type:'Doctor',       shift:'General'  },
    { id:23, emp_code:'HMS023', first_name:'Mahesh',     last_name:'Kumar',     email:'mahesh.kumar@cityhospital.in',    plain:'emp123',     phone:'9810012323', department_id:12, role:'employee', designation:'Biomedical Engineer',            join_date:'2020-07-01', status:'active', salary:55000,  address:'Janakpuri Block C, Delhi',          avatar_color:'#10b981', employee_type:'Technical',    shift:'General'  },
  ];

  console.log('🔐 Hashing passwords...');
  const employees = raw.map(({ plain, ...emp }) => ({
    ...emp,
    password_hash: bcrypt.hashSync(plain, 10)
  }));

  // Attendance - last 30 working days
  const attendance = [];
  let attId = 1;
  const now = new Date();
  for (let i = 1; i <= 35; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    const dateStr = d.toISOString().split('T')[0];
    employees.forEach(emp => {
      const r = Math.random();
      let rec = { id: attId++, employee_id: emp.id, date: dateStr };
      if (r < 0.84) {
        let baseIn = 8;
        if (emp.shift === 'Evening')  baseIn = 14;
        if (emp.shift === 'Night')    baseIn = 21;
        if (emp.shift === 'Rotating') baseIn = 7 + Math.floor(Math.random() * 8);
        const ci = `${String(baseIn).padStart(2,'0')}:${String(Math.floor(Math.random()*30)).padStart(2,'0')}`;
        const coH = (baseIn + 8) % 24;
        const co  = `${String(coH).padStart(2,'0')}:${String(Math.floor(Math.random()*30)+15).padStart(2,'0')}`;
        const [ih,im] = ci.split(':').map(Number);
        let   [oh,om] = co.split(':').map(Number);
        if (oh < ih) oh += 24;
        rec = { ...rec, check_in:ci, check_out:co, status:'present', hours_worked:Math.round(((oh*60+om)-(ih*60+im))/60*10)/10 };
      } else if (r < 0.91) {
        rec = { ...rec, check_in:null, check_out:null, status:'absent', hours_worked:0 };
      } else {
        rec = { ...rec, check_in:`08:${String(Math.floor(Math.random()*30)).padStart(2,'0')}`, check_out:null, status:'half_day', hours_worked:4 };
      }
      attendance.push(rec);
    });
  }

  // Salary slips
  const salary_slips = [];
  let slipId = 1;
  [{month:12,year:2024},{month:1,year:2025},{month:2,year:2025}].forEach(({month,year}) => {
    employees.forEach(emp => {
      const basic=Math.round(emp.salary*0.5), hra=Math.round(emp.salary*0.2);
      const transport=1600, medical=1250, special=Math.round(emp.salary*0.08);
      const gross=basic+hra+transport+medical+special;
      const pf=Math.round(basic*0.12), esi=gross<=21000?Math.round(gross*0.0075):0;
      const pt=gross>15000?200:0, tds=Math.round(gross*0.05);
      salary_slips.push({ id:slipId++, employee_id:emp.id, month, year,
        basic_salary:basic, hra, transport_allowance:transport, medical_allowance:medical, other_allowance:special,
        pf_deduction:pf, esi_deduction:esi, professional_tax:pt, tax_deduction:tds, other_deduction:0,
        gross_salary:gross, net_salary:gross-pf-esi-pt-tds,
        working_days:26, present_days:20+Math.floor(Math.random()*4),
        generated_at:new Date().toISOString() });
    });
  });

  return {
    departments, employees, attendance,
    leave_requests: [
      { id:1,  employee_id:4,  leave_type:'casual',    start_date:'2024-12-23', end_date:'2024-12-24', days:2,  reason:'Personal work at home',              status:'approved', approved_by:2,    approved_at:'2024-12-20T10:00:00Z', created_at:'2024-12-18T09:00:00Z' },
      { id:2,  employee_id:12, leave_type:'sick',       start_date:'2025-01-06', end_date:'2025-01-07', days:2,  reason:'Viral fever, medical certificate attached', status:'approved', approved_by:5, approved_at:'2025-01-05T08:00:00Z', created_at:'2025-01-05T07:30:00Z' },
      { id:3,  employee_id:16, leave_type:'earned',     start_date:'2025-01-20', end_date:'2025-01-25', days:6,  reason:'Annual family trip to Haridwar',      status:'pending',  approved_by:null, approved_at:null,                   created_at:'2025-01-12T11:00:00Z' },
      { id:4,  employee_id:13, leave_type:'casual',     start_date:'2025-02-05', end_date:'2025-02-05', days:1,  reason:'Bank work',                          status:'rejected', approved_by:3,    approved_at:'2025-02-03T14:00:00Z', created_at:'2025-02-01T16:00:00Z' },
      { id:5,  employee_id:17, leave_type:'sick',       start_date:'2025-02-12', end_date:'2025-02-13', days:2,  reason:'Dengue fever, doctor advised rest',  status:'approved', approved_by:1,    approved_at:'2025-02-11T09:00:00Z', created_at:'2025-02-11T08:00:00Z' },
      { id:6,  employee_id:6,  leave_type:'maternity',  start_date:'2025-03-01', end_date:'2025-05-29', days:90, reason:'Maternity leave',                    status:'approved', approved_by:2,    approved_at:'2025-02-20T10:00:00Z', created_at:'2025-02-15T10:00:00Z' },
      { id:7,  employee_id:8,  leave_type:'casual',     start_date:'2025-03-10', end_date:'2025-03-11', days:2,  reason:'Attending relative wedding',         status:'pending',  approved_by:null, approved_at:null,                   created_at:'2025-03-05T09:00:00Z' },
      { id:8,  employee_id:20, leave_type:'casual',     start_date:'2025-03-18', end_date:'2025-03-18', days:1,  reason:'Medical check-up',                   status:'pending',  approved_by:null, approved_at:null,                   created_at:'2025-03-16T11:00:00Z' },
      { id:9,  employee_id:22, leave_type:'earned',     start_date:'2025-04-07', end_date:'2025-04-11', days:5,  reason:'Eid holidays + family visit',        status:'pending',  approved_by:null, approved_at:null,                   created_at:'2025-03-25T10:00:00Z' },
      { id:10, employee_id:14, leave_type:'conference', start_date:'2025-04-14', end_date:'2025-04-16', days:3,  reason:'Cardiology CME Conference, Mumbai',  status:'approved', approved_by:1,    approved_at:'2025-04-01T10:00:00Z', created_at:'2025-03-28T10:00:00Z' },
    ],
    salary_slips
  };
}

function initDb() {
  if (DB) return;
  console.log('📦 Seeding in-memory database...');
  DB = buildSeed();
  console.log(`✅ Ready — ${DB.employees.length} staff, ${DB.attendance.length} attendance records`);
}

function getDb()      { return DB; }
function saveDb(data) { DB = data; }  // in-memory write — instant

module.exports = { initDb, getDb, saveDb, nextId };
