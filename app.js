/* ================================================================
   ALUMNITRACK — app.js  (v3.0 Firebase Edition)
   ================================================================

   DEMO ACCOUNTS
   ─────────────────────────────────────────────────────────────
   Admin  : admin@school.edu  /  admin123
   Alumni : maria@alumni.edu  /  alumni123
   ─────────────────────────────────────────────────────────────

   MODULE MAP
   ─────────────────────────────────────────────────────────────
   AUTH        — Login, register, logout, launch routing
   NAV         — Admin-side page routing + sidebar toggle
   ALUMNI_SPA  — Alumni single-page controller (3 tabs)
   ADMIN_DASH  — Admin dashboard KPIs, charts, history
   PROFILE     — Profile save/upload for both admin + alumni
   ALUMNI      — Directory, career tracking, add/edit/delete
   EVENTS      — Calendar, upcoming/history split, RSVP, admin CRUD
   DONATIONS   — Record donations, file upload, admin + alumni views
   REPORTS     — Charts (employment, industry, batch), export
   TOAST       — Success / error notifications
   HELPERS     — ge, gv, sv, countUp, etc.
   ─────────────────────────────────────────────────────────────
*/

/* ================================================================
   FIREBASE SETUP
   ================================================================
     PASTE YOUR CONFIG FROM:
       Firebase Console → Project Settings → Your apps → SDK setup
   ================================================================ */

import { initializeApp }        from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection, doc,
  getDocs, getDoc,
  addDoc, setDoc,
  updateDoc, deleteDoc,
  query, where, orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA71USklVBF-TW7bE7lGw-fiWPx9p9yzv4",
  authDomain: "alumnitrack-17c0c.firebaseapp.com",
  projectId: "alumnitrack-17c0c",
  storageBucket: "alumnitrack-17c0c.firebasestorage.app",
  messagingSenderId: "270809551844",
  appId: "1:270809551844:web:fc91afad87fb7f7bfe6df1",
  measurementId: "G-F0DH81KHH9"
};
// ─────────────────────────────────────────────────────────────────

const fbApp = initializeApp(firebaseConfig);
const db    = getFirestore(fbApp);

/* Firestore collection references */
const COL = {
  alumni:        collection(db, 'alumni'),
  events:        collection(db, 'events'),
  donations:     collection(db, 'donations'),
  activity:      collection(db, 'activity'),
  announcements: collection(db, 'announcements'),
  users:         collection(db, 'users'),         // for login/register
};


/* ================================================================
   CONSTANTS
   ================================================================ */

const DEMO_ACCOUNTS = [
  { email:'admin@school.edu',  password:'admin123',  role:'admin',  fn:'Admin', ln:'User',   batch:null,   course:null,   docId:'demo-admin' },
  { email:'maria@alumni.edu',  password:'alumni123', role:'alumni', fn:'Maria', ln:'Santos', batch:'2022', course:'BSIT', docId:'demo-maria' },
];

const COURSES = [
  { val:'BACJ', label:'Bachelor in Arts, Communication, and Journalism (BACJ)' },
  { val:'BSA',  label:'Bachelor of Science in Accountancy (BSA)' },
  { val:'BSBA', label:'Bachelor of Science in Business Administration (BSBA)' },
  { val:'BSE',  label:'Bachelor of Science in Entrepreneurship (BSE)' },
  { val:'BSIT', label:'Bachelor of Science in Information Technology (BSIT)' },
  { val:'BSP',  label:'Bachelor of Science in Psychology (BSP)' },
  { val:'TEP',  label:'Teacher Education Program (TEP)' },
];

function courseOptions(selected) {
  return COURSES.map(c =>
    `<option value="${c.val}"${selected === c.val ? ' selected' : ''}>${c.label}</option>`
  ).join('');
}

function batchOptions(selected) {
  let html = '';
  for (let y = new Date().getFullYear(); y >= 2000; y--) {
    html += `<option${selected == y ? ' selected' : ''}>${y}</option>`;
  }
  return html;
}

/* Currently logged-in user */
let CU = null;

/* Chart.js instances */
const CHARTS = {};

/* Calendar state */
let CAL = { year: new Date().getFullYear(), month: new Date().getMonth(), selectedDay: null };

/* Pending delete callback */
let _deletePending = null;


/* ================================================================
   SEED  — runs once if Firestore collections are empty
   Seeds the demo data you had in DB so the app starts with data.
   ================================================================ */
async function seedIfEmpty() {
  // Check if alumni collection already has docs
  const snap = await getDocs(COL.alumni);
  if (!snap.empty) return; // already seeded

  TOAST.ok('Setting up database for first time…');

  // ── Seed alumni ──────────────────────────────────────────────
  const alumniData = [
    { fn:'Maria',   ln:'Santos',     batch:'2022', course:'BSIT', email:'maria@alumni.edu',  phone:'09171234567', addr:'Quezon City',  status:'Employed',   co:'Accenture PH',         jt:'Software Developer',  ind:'Technology', yoe:2, av:null },
    { fn:'Juan',    ln:'Dela Cruz',  batch:'2021', course:'BSBA', email:'juan@email.com',    phone:'09181234567', addr:'Pasig City',    status:'Employed',   co:'BDO Unibank',           jt:'Systems Analyst',     ind:'Finance',    yoe:3, av:null },
    { fn:'Ana',     ln:'Reyes',      batch:'2023', course:'BSA',  email:'ana@email.com',     phone:'09191234567', addr:'Manila',        status:'Employed',   co:'Philippine Gen. Hosp.',jt:'Staff Nurse',         ind:'Healthcare', yoe:1, av:null },
    { fn:'Carlo',   ln:'Mendoza',    batch:'2020', course:'BSBA', email:'carlo@email.com',   phone:'09201234567', addr:'Makati',        status:'Unemployed', co:'',                      jt:'',                    ind:'',           yoe:0, av:null },
    { fn:'Liza',    ln:'Garcia',     batch:'2022', course:'TEP',  email:'liza@email.com',    phone:'09211234567', addr:'Caloocan',      status:'Studying',   co:'UP Diliman',            jt:'MA Education',        ind:'Education',  yoe:0, av:null },
    { fn:'Marco',   ln:'Villanueva', batch:'2021', course:'BSIT', email:'marco@email.com',   phone:'09221234567', addr:'Marikina',      status:'Employed',   co:'Globe Telecom',         jt:'Network Engineer',    ind:'Technology', yoe:3, av:null },
    { fn:'Sofia',   ln:'Cruz',       batch:'2023', course:'BSP',  email:'sofia@email.com',   phone:'09231234567', addr:'Taguig',        status:'Employed',   co:'Concentrix',            jt:'HR Specialist',       ind:'BPO',        yoe:1, av:null },
    { fn:'Paolo',   ln:'Ramos',      batch:'2019', course:'BSBA', email:'paolo@email.com',   phone:'09241234567', addr:'Paranaque',     status:'Employed',   co:'DBM',                   jt:'Project Manager',     ind:'Government', yoe:5, av:null },
    { fn:'Jasmine', ln:'Torres',     batch:'2020', course:'BSA',  email:'jasmine@email.com', phone:'09251234567', addr:'Las Pinas',     status:'Employed',   co:"St. Luke's Medical",   jt:'Finance Officer',     ind:'Healthcare', yoe:4, av:null },
    { fn:'Ryan',    ln:'Bautista',   batch:'2018', course:'BSBA', email:'ryan@email.com',    phone:'09261234567', addr:'Mandaluyong',   status:'Employed',   co:'Jollibee Foods Corp',  jt:'Operations Manager',  ind:'Finance',    yoe:6, av:null },
    { fn:'Nicole',  ln:'Fernandez',  batch:'2024', course:'BSIT', email:'nicole@email.com',  phone:'09271234567', addr:'Valenzuela',    status:'Unemployed', co:'',                      jt:'',                    ind:'',           yoe:0, av:null },
    { fn:'Kevin',   ln:'Lopez',      batch:'2022', course:'BACJ', email:'kevin@email.com',   phone:'09281234567', addr:'Malabon',       status:'Studying',   co:'AIM',                   jt:'MBA Program',         ind:'Education',  yoe:2, av:null },
  ];
  for (const a of alumniData) await addDoc(COL.alumni, a);

  // ── Seed events ──────────────────────────────────────────────
  const eventsData = [
    { title:'Alumni Grand Reunion 2024',            desc:'Annual gathering of all alumni batches.',               date:'2024-08-15', time:'10:00', venue:'University Gymnasium',        type:'Reunion',    customType:'', max:500, rsvps:['maria@alumni.edu','juan@email.com','ana@email.com'], completed:true },
    { title:'Tech Career Fair 2024',                desc:'Connected graduates with top tech companies.',          date:'2024-07-20', time:'09:00', venue:'Conference Hall A',            type:'Job Fair',   customType:'', max:200, rsvps:['maria@alumni.edu','marco@email.com'], completed:true },
    { title:'Leadership & Entrepreneurship Seminar',desc:'Inspiring talks from alumni entrepreneurs.',           date:'2024-06-10', time:'13:00', venue:'Online / Zoom',               type:'Seminar',    customType:'', max:300, rsvps:['sofia@email.com','liza@email.com'], completed:true },
    { title:'Scholarship Fundraiser Gala 2024',     desc:'Raised funds for incoming scholars.',                   date:'2024-09-05', time:'18:00', venue:'Grand Ballroom, Hotel Manila', type:'Fundraiser', customType:'', max:150, rsvps:['ryan@email.com','jasmine@email.com'], completed:true },
    { title:'Homecoming Night 2023',                desc:'A night of nostalgia and reconnection for all batches.',date:'2023-12-02', time:'19:00', venue:'School Quadrangle',          type:'Reunion',    customType:'', max:400, rsvps:['juan@email.com','carlo@email.com'], completed:true },
    { title:'Career Guidance Seminar 2023',         desc:'Alumni shared real-world career insights.',             date:'2023-03-18', time:'10:00', venue:'AVR Building B',              type:'Seminar',    customType:'', max:200, rsvps:['nicole@email.com'], completed:true },
  ];
  for (const e of eventsData) await addDoc(COL.events, e);

  // ── Seed donations ───────────────────────────────────────────
  const donationsData = [
    { name:'Ryan Bautista',  amount:5000,  purpose:'Scholarship Fund', date:'2024-01-15', status:'Paid',    notes:'Batch 2018 contribution', file:null, fileName:'' },
    { name:'Paolo Ramos',    amount:3000,  purpose:'Events',           date:'2024-02-01', status:'Paid',    notes:'',                        file:null, fileName:'' },
    { name:'Anonymous',      amount:10000, purpose:'General Fund',     date:'2024-03-10', status:'Paid',    notes:'Anonymous donor',         file:null, fileName:'' },
    { name:'Jasmine Torres', amount:2500,  purpose:'Scholarship Fund', date:'2024-04-05', status:'Pending', notes:'',                        file:null, fileName:'' },
  ];
  for (const d of donationsData) await addDoc(COL.donations, d);

  // ── Seed activity ────────────────────────────────────────────
  const activityData = [
    { txt:'Maria Santos updated her career info',       time:'2 mins ago',  ts: Date.now()-120000 },
    { txt:'New alumni registered: Nicole Fernandez',    time:'1 hr ago',    ts: Date.now()-3600000 },
    { txt:'Juan Dela Cruz RSVPed for Tech Fair',        time:'3 hrs ago',   ts: Date.now()-10800000 },
    { txt:'Donation recorded: ₱10,000 from Anonymous', time:'Yesterday',   ts: Date.now()-86400000 },
    { txt:'Admin updated alumni directory',             time:'2 days ago',  ts: Date.now()-172800000 },
  ];
  for (const a of activityData) await addDoc(COL.activity, a);

  // ── Seed announcements ───────────────────────────────────────
  const announcementsData = [
    { date:'Apr 2025', title:'Homecoming 2025 Save the Date!',       desc:'Mark your calendars — this year\'s alumni homecoming is coming in November. More details soon.' },
    { date:'Mar 2025', title:'New Scholarship Applications Open',    desc:'The PCC Alumni Foundation is accepting nominations for the next batch of scholars. Help a deserving student today.' },
    { date:'Feb 2025', title:'Career Fair Coming in Q2',             desc:'We are organizing a career fair. Alumni companies interested in participating may reach out to the alumni office.' },
  ];
  for (const a of announcementsData) await addDoc(COL.announcements, a);

  // ── Seed demo users ──────────────────────────────────────────
  await setDoc(doc(db, 'users', 'demo-admin'), {
    email:'admin@school.edu', password:'admin123', role:'admin',
    fn:'Admin', ln:'User', batch:null, course:null, av:null,
    phone:'', addr:'', status:'N/A', co:'', jt:'', ind:'', yoe:0
  });
  await setDoc(doc(db, 'users', 'demo-maria'), {
    email:'maria@alumni.edu', password:'alumni123', role:'alumni',
    fn:'Maria', ln:'Santos', batch:'2022', course:'BSIT', av:null,
    phone:'09171234567', addr:'Quezon City', status:'Employed',
    co:'Accenture PH', jt:'Software Developer', ind:'Technology', yoe:2
  });

  TOAST.ok('Database ready! Loading data…');
}


/* ================================================================
   MODULE: AUTH
   ================================================================ */
const AUTH = {

  async login() {
    const email = gv('l-email').trim().toLowerCase();
    const pass  = gv('l-pass');
    const role  = gv('l-role');

    if (!email) { TOAST.err('Email is required.');    return; }
    if (!pass)  { TOAST.err('Password is required.'); return; }

    try {
      // Query Firestore users collection for matching credentials
      const q    = query(COL.users, where('email','==',email), where('password','==',pass), where('role','==',role));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const userDoc = snap.docs[0];
        CU = { docId: userDoc.id, ...userDoc.data() };

        // If alumni, also pull their alumni record for full career data
        if (CU.role === 'alumni') {
          const alumQ    = query(COL.alumni, where('email','==',email));
          const alumSnap = await getDocs(alumQ);
          if (!alumSnap.empty) {
            const alumDoc = alumSnap.docs[0];
            CU.alumniDocId = alumDoc.id;
            const a = alumDoc.data();
            CU.phone  = CU.phone  || a.phone  || '';
            CU.addr   = CU.addr   || a.addr   || '';
            CU.status = CU.status || a.status || 'Unemployed';
            CU.co     = CU.co     || a.co     || '';
            CU.jt     = CU.jt     || a.jt     || '';
            CU.ind    = CU.ind    || a.ind     || '';
            CU.yoe    = CU.yoe    || a.yoe     || 0;
            CU.av     = CU.av     || a.av      || null;
          }
        }
        this._launch();
        return;
      }

      // Fallback: any email+pass combo creates a guest session (not stored)
      CU = {
        docId: null,
        email, role,
        fn:     role === 'admin' ? 'Admin' : 'Alumni',
        ln:     'User',
        batch:  role === 'alumni' ? String(new Date().getFullYear() - 2) : null,
        course: role === 'alumni' ? 'BSIT' : null,
        status: role === 'alumni' ? 'Unemployed' : 'N/A',
        co:'', jt:'', ind:'', yoe:0, phone:'', addr:'', av:null,
        alumniDocId: null,
      };
      this._launch();

    } catch(e) {
      console.error(e);
      TOAST.err('Login failed. Check your connection.');
    }
  },

  async register() {
    const fn     = gv('r-fn').trim();
    const ln     = gv('r-ln').trim();
    const email  = gv('r-em').trim().toLowerCase();
    const pass   = gv('r-pw');
    const batch  = gv('r-batch');
    const course = gv('r-course');
    const role   = gv('r-role');

    if (!fn || !ln)               { TOAST.err('First and last name are required.'); return; }
    if (!email)                   { TOAST.err('Email is required.'); return; }
    if (!pass || pass.length < 6) { TOAST.err('Password must be at least 6 characters.'); return; }
    if (!batch)                   { TOAST.err('Please select your batch year.'); return; }
    if (!course)                  { TOAST.err('Please select your course.'); return; }

    try {
      // Check if email already exists
      const existing = await getDocs(query(COL.users, where('email','==',email)));
      if (!existing.empty) { TOAST.err('An account with this email already exists.'); return; }

      const userData = {
        email, password:pass, role, fn, ln, batch, course,
        phone:'', addr:'', status:'Unemployed', co:'', jt:'', ind:'', yoe:0, av:null
      };

      // Save to users collection
      const userRef = await addDoc(COL.users, userData);

      // Also add to alumni collection if alumni role
      let alumniDocId = null;
      if (role === 'alumni') {
        const alumRef = await addDoc(COL.alumni, { fn, ln, batch, course, email, phone:'', addr:'', status:'Unemployed', co:'', jt:'', ind:'', yoe:0, av:null });
        alumniDocId = alumRef.id;
        await addActivityLog(`New alumni registered: ${fn} ${ln}`);
      }

      CU = { docId: userRef.id, alumniDocId, ...userData };
      this._launch();

    } catch(e) {
      console.error(e);
      TOAST.err('Registration failed. Please try again.');
    }
  },

  logout() {
    CU = null;
    Object.keys(CHARTS).forEach(k => { if (CHARTS[k]) { CHARTS[k].destroy(); CHARTS[k] = null; } });
    ge('app').classList.add('d-none');
    ge('auth-screen').classList.remove('d-none');
    this.showLogin();
  },

  showLogin()    { ge('login-page').classList.remove('d-none');   ge('register-page').classList.add('d-none'); },
  showRegister() { ge('register-page').classList.remove('d-none'); ge('login-page').classList.add('d-none'); },

  _launch() {
    ge('auth-screen').classList.add('d-none');
    ge('app').classList.remove('d-none');

    if (CU.role === 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = '');
      document.querySelectorAll('.alumni-only').forEach(el => el.style.display = 'none');
      updateEl('sb-av',    CU.fn[0]);
      updateEl('sb-uname', CU.fn);
      updateEl('sb-urole', 'Administrator');
      updateEl('tb-av',    CU.fn[0]);
      updateEl('tb-uname', CU.fn);
      ge('tb-date').textContent = new Date().toLocaleDateString('en-PH',
        { weekday:'long', month:'long', day:'numeric', year:'numeric' });
      NAV.go('dashboard');
    } else {
      document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.alumni-only').forEach(el => el.style.display = '');
      ge('alumni-topbar').classList.remove('d-none');
      document.querySelectorAll('.page').forEach(p => p.classList.add('d-none'));
      ge('pg-alumni-spa').classList.remove('d-none');
      ALUMNI_SPA.init();
    }
  }
};


/* ================================================================
   MODULE: NAV  (Admin only)
   ================================================================ */
const NAV = {

  go(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('d-none'));
    document.querySelectorAll('.sb-item').forEach(l => l.classList.toggle('active', l.dataset.page === page));

    const labels = {
      dashboard:'Dashboard', alumni:'Alumni Directory', events:'Events',
      donations:'Donations', reports:'Reports & Analytics', profile:'My Profile',
    };
    ge('tb-title').textContent = labels[page] || page;

    if (page === 'dashboard') {
      ge('pg-admin-dash').classList.remove('d-none');
      ADMIN_DASH.load();
    } else {
      const el = ge('pg-' + page);
      if (el) el.classList.remove('d-none');
      const loaders = {
        alumni:    () => ALUMNI.render(),
        events:    () => EVENTS.load(),
        donations: () => DONATIONS.load(),
        reports:   () => REPORTS.load(),
        profile:   () => PROFILE.loadAdmin(),
      };
      loaders[page]?.();
    }
  },

  toggleSidebar() {
    ge('sidebar').classList.toggle('collapsed');
    this._updateTooltipPositions();
  },

  _updateTooltipPositions() {
    document.querySelectorAll('.sb-item').forEach(item => {
      const tip = item.querySelector('.sb-tooltip');
      if (!tip) return;
      const rect = item.getBoundingClientRect();
      tip.style.top  = (rect.top + rect.height / 2) + 'px';
      tip.style.left = (rect.right + 12) + 'px';
      tip.style.transform = 'translateY(-50%)';
    });
  },
};

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('mouseover', e => {
    const item = e.target.closest('.sb-item');
    if (!item) return;
    const tip = item.querySelector('.sb-tooltip');
    if (!tip) return;
    const rect = item.getBoundingClientRect();
    tip.style.top  = (rect.top + rect.height / 2) + 'px';
    tip.style.left = (rect.right + 12) + 'px';
    tip.style.transform = 'translateY(-50%)';
  });
});


/* ================================================================
   MODULE: ALUMNI_SPA
   ================================================================ */
const ALUMNI_SPA = {

  async init() {
    this.switchTab('profile');
    await this.renderAnnouncements();
  },

  async switchTab(tab) {
    document.querySelectorAll('.atn-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.target === tab);
    });
    ge('spa-sec-profile').classList.toggle('d-none', tab !== 'profile');
    ge('spa-sec-events').classList.toggle('d-none',  tab !== 'events');
    ge('spa-sec-donate').classList.toggle('d-none',  tab !== 'donate');

    if (tab === 'profile')  await this._loadProfile();
    if (tab === 'events')   await this.renderEvents();
    if (tab === 'donate')   await this._loadDonateHistory();
  },

  async _loadProfile() {
    const h     = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    ge('alm-hello').textContent = greet + '!';
    ge('alm-name').textContent  = `${CU.fn} ${CU.ln}`;
    ge('alm-meta').textContent  = CU.batch && CU.course
      ? `Batch ${CU.batch} · ${CU.course}`
      : 'Complete your profile';

    const avEl = ge('alm-av');
    avEl.textContent = CU.fn[0];
    if (CU.av) avEl.innerHTML = `<img src="${CU.av}"/>`;

    updateEl('alm-status', CU.status  || '—');
    updateEl('alm-co',     CU.co      || 'Not listed');
    updateEl('alm-jt',     CU.jt      || 'Not listed');

    // Count RSVPed events from Firestore
    const evSnap = await getDocs(COL.events);
    const rsvpCount = evSnap.docs.filter(d => (d.data().rsvps || []).includes(CU.email)).length;
    updateEl('alm-evjoined', rsvpCount);

    PROFILE.loadAlumni();
    this._renderCompletion();
  },

  async renderEvents() {
    const col = ge('alm-spa-events-list');
    const now = new Date(); now.setHours(0,0,0,0);

    const snap = await getDocs(COL.events);
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    const upcoming = all.filter(e => !e.completed && new Date(e.date) >= now);
    const history  = all.filter(e =>  e.completed || new Date(e.date) <  now);

    let html = `<div class="ev-section-hd upcoming-hd">
      <i class="bi bi-calendar-check-fill"></i> Upcoming Events
      <span class="ev-section-badge ev-badge-upcoming">${upcoming.length}</span>
    </div>`;
    if (upcoming.length) {
      html += upcoming.map(e => this._eventCardHTML(e, false)).join('');
    } else {
      html += `<div class="panel ev-empty-panel">
        <div class="ev-empty-title">No upcoming events yet</div>
        <div class="ev-empty-sub">Check back soon — events will appear here when scheduled.</div>
      </div>`;
    }

    html += `<div class="ev-section-hd history-hd mt-4">
      <i class="bi bi-clock-history"></i> Past Events
      <span class="ev-section-badge ev-badge-history">${history.length}</span>
    </div>`;
    if (history.length) {
      html += history.map(e => this._eventCardHTML(e, true)).join('');
    } else {
      html += `<p style="color:var(--gray-5);font-size:14px;padding:8px 0">No past events on record.</p>`;
    }

    col.innerHTML = html;
  },

  _eventCardHTML(e, isPast) {
    const d      = new Date(e.date);
    const joined = (e.rsvps || []).includes(CU.email);
    const label  = e.type === 'Others' && e.customType ? e.customType : e.type;
    const stripe = { Reunion:'ev-s-reunion', Seminar:'ev-s-seminar', 'Job Fair':'ev-s-jobfair', Fundraiser:'ev-s-fundraiser', Others:'ev-s-others' }[e.type] || 'ev-s-others';
    return `
      <div class="ev-card ${isPast ? 'ev-card-past' : ''}" style="margin-bottom:12px">
        <div class="ev-stripe ${stripe}"></div>
        <div class="ev-header">
          <div class="ev-header-left">
            <div class="ev-type-tag">${label}${isPast ? ' <span class="ev-past-tag">Past</span>' : ''}</div>
            <div class="ev-title">${e.title}</div>
          </div>
          <i class="bi bi-chevron-down ev-expand-icon"></i>
        </div>
        <div class="ev-body">
          <div class="ev-meta">
            <span><i class="bi bi-calendar3"></i>${d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</span>
            <span><i class="bi bi-clock"></i>${fmtTime(e.time)}</span>
            <span><i class="bi bi-geo-alt-fill"></i>${e.venue}</span>
          </div>
          ${e.desc ? `<p style="font-size:14px;color:var(--gray-7);margin-bottom:12px">${e.desc}</p>` : ''}
          <div class="ev-footer">
            <span class="ev-going"><i class="bi bi-people"></i> ${(e.rsvps||[]).length} going</span>
            ${!isPast ? `
            <button class="rsvp-btn ${joined?'rsvp-on':'rsvp-off'}" onclick="ALUMNI_SPA.toggleRSVP('${e.id}')">
              ${joined ? '✓ Going' : 'RSVP'}
            </button>` : `<span class="ev-done-tag"><i class="bi bi-check-circle-fill"></i> Completed</span>`}
          </div>
        </div>
      </div>`;
  },

  async toggleRSVP(docId) {
    try {
      const evRef  = doc(db, 'events', docId);
      const evSnap = await getDoc(evRef);
      if (!evSnap.exists()) return;

      const data  = evSnap.data();
      const rsvps = data.rsvps || [];
      const idx   = rsvps.indexOf(CU.email);

      let newRsvps;
      if (idx === -1) {
        newRsvps = [...rsvps, CU.email];
        await addActivityLog(`${CU.fn} RSVPed for: ${data.title}`);
        TOAST.ok('RSVP confirmed! 🎉');
      } else {
        newRsvps = rsvps.filter(e => e !== CU.email);
        TOAST.ok('RSVP cancelled.');
      }

      await updateDoc(evRef, { rsvps: newRsvps });

      // Refresh event count stat
      const allSnap = await getDocs(COL.events);
      const count   = allSnap.docs.filter(d => (d.data().rsvps||[]).includes(CU.email)).length;
      updateEl('alm-evjoined', count);

      await this.renderEvents();
    } catch(e) {
      console.error(e);
      TOAST.err('Could not update RSVP.');
    }
  },

  async _loadDonateHistory() {
    const tbody = ge('alm-spa-don-history');
    const empty = ge('alm-don-empty-msg');

    const snap   = await getDocs(COL.donations);
    const myDons = snap.docs
      .map(d => ({ id:d.id, ...d.data() }))
      .filter(d =>
        d.name.toLowerCase().includes(CU.fn.toLowerCase()) ||
        d.name.toLowerCase().includes(CU.ln.toLowerCase())
      );

    if (!myDons.length) {
      tbody.innerHTML = '';
      empty.classList.remove('d-none');
      return;
    }
    empty.classList.add('d-none');
    tbody.innerHTML = myDons.map(d => `
      <tr>
        <td>${d.date}</td>
        <td>₱${d.amount.toLocaleString()}</td>
        <td>${d.purpose}</td>
        <td><span class="${d.status === 'Paid' ? 'tpaid' : 'tpending'}">${d.status}</span></td>
      </tr>`).join('');
  },

  async renderAnnouncements() {
    const snap = await getDocs(COL.announcements);
    ge('spa-announcements').innerHTML = snap.docs.map(d => {
      const a = d.data();
      return `<div class="ann-item">
        <div class="ann-date">${a.date}</div>
        <div class="ann-title">${a.title}</div>
        <p class="ann-desc">${a.desc}</p>
      </div>`;
    }).join('');
  },

  _renderCompletion() {
    const checks = [
      { label:'Full name',     done: !!(CU.fn && CU.ln) },
      { label:'Email address', done: !!CU.email },
      { label:'Phone number',  done: !!CU.phone },
      { label:'Home address',  done: !!CU.addr },
      { label:'Career status', done: CU.status !== 'Unemployed' || !!CU.co },
      { label:'Industry',      done: !!CU.ind },
    ];
    const pct = Math.round(checks.filter(c => c.done).length / checks.length * 100);
    ge('prof-completion').innerHTML = `
      <div class="cmp-pct">${pct}%</div>
      <p style="font-size:13.5px;color:var(--gray-5);text-align:center;margin-bottom:12px">Profile Complete</p>
      <div class="cmp-bar-bg"><div class="cmp-bar" style="width:${pct}%"></div></div>
      <div class="cmp-items mt-3">
        ${checks.map(c => `<div class="cmp-row"><i class="bi ${c.done ? 'bi-check-circle-fill ci-done' : 'bi-circle ci-miss'}"></i>
          <span style="${c.done ? '' : 'color:var(--gray-5)'}">${c.label}</span></div>`).join('')}
      </div>
      ${pct < 100 ? `<button class="btn-red mt-3" style="width:100%;justify-content:center" onclick="ALUMNI_SPA.switchTab('profile')">
        <i class="bi bi-pencil-fill"></i> Complete Profile</button>` : ''}`;
  },
};


/* ================================================================
   MODULE: ADMIN_DASH
   ================================================================ */
const ADMIN_DASH = {

async load() {
    const h     = new Date().getHours();
    const greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    ge('admin-greet').textContent = `${greet}, Admin!`;

    const now = new Date(); now.setHours(0,0,0,0);

    // FETCH ALL DATA
    const [alumniSnap, eventsSnap, donSnap, actSnap] = await Promise.all([
      getDocs(COL.alumni),
      getDocs(COL.events),
      getDocs(COL.donations),
      getDocs(COL.activity)
    ]);

    const alumni     = alumniSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    const events     = eventsSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    const donations  = donSnap.docs.map(d => ({ id:d.id, ...d.data() }));
    const activities = actSnap.docs.map(d => d.data());

    // FIX 1: Cache the alumni data in the system's memory so filtering is instant!
    this._cachedAlumni = alumni;

    // FIX 2: Force the HTML dropdown to reset back to "all" every time you visit the page
    sv('emp-filter', 'all');

    // CALCULATE KPIs
    const total = alumni.length;
    const emp   = alumni.filter(a => a.status === 'Employed').length;
    const don   = donations.filter(d => d.status === 'Paid').reduce((s,d) => s + d.amount, 0);

    // UPDATE DASHBOARD NUMBERS
    countUp('a-total',  total);
    ge('a-emprate').textContent = total ? Math.round(emp / total * 100) + '%' : '0%';
    ge('a-don').textContent = '₱' + don.toLocaleString();

    // RENDER COMPONENTS
    this._renderUpcomingStrip(now, events);
    this._renderNotificationsAndApprovals(donations, activities);
    this._renderActivityLogs(activities);
    this._drawEmpChart('all', alumni);
  },

  // Notice we removed the "async" keyword here. It no longer waits for the internet!
  filterChart(filter) {
    // Pull the data directly from our lightning-fast cache
    const alumni = this._cachedAlumni || [];
    this._drawEmpChart(filter, alumni);
  },

_drawEmpChart(filter, alumni) {
    const ctx = ge('ch-emp');
    const emptyState = ge('emp-empty-state');
    if (!ctx || !emptyState) return;

    if (CHARTS.emp) { CHARTS.emp.destroy(); CHARTS.emp = null; }

    const data  = filter === 'all' ? alumni : alumni.filter(a => a.batch === filter);

    // EMPTY STATE LOGIC
    if (data.length === 0) {
      // Fix: Force hide the canvas using JS !important to override the CSS
      ctx.style.setProperty('display', 'none', 'important');
      emptyState.classList.remove('d-none');
      return; 
    }

    // Fix: Force show the canvas again when there is data
    ctx.style.setProperty('display', 'block', 'important');
    emptyState.classList.add('d-none');

    const emp   = data.filter(a => a.status === 'Employed').length;
    const unemp = data.filter(a => a.status === 'Unemployed').length;
    const study = data.filter(a => a.status === 'Studying').length;

    CHARTS.emp = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Employed', 'Unemployed', 'Studying'],
        datasets: [{ data:[emp, unemp, study], backgroundColor:['#C00000','#1e1e1e','#b0b0b0'], borderWidth:0, hoverOffset:5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'right', labels:{ usePointStyle:true, padding:16, font:{ family:'Inter', size:13 } } } },
        cutout: '68%',
      }
    });
  },

  // HANDLES BOTH DASHBOARD LIST AND NOTIFICATION MODAL
  _renderNotificationsAndApprovals(donations, activities) {
    const pending = donations.filter(d => d.status === 'Pending');
    const listEl  = ge('a-pending-approvals');
    const modalEl = ge('notif-modal-list');
    const bellBadge = ge('admin-bell-badge');

    // 1. Find crucial informational alerts (e.g., Profile updates, Registrations)
    // In Phase 3, we will add specific "Employment Status" logs here.
    const crucialLogs = activities.filter(a => 
      a.txt.includes('updated their profile') || 
      a.txt.includes('registered') ||
      a.txt.includes('career info')
    ).sort((a,b) => (b.ts||0) - (a.ts||0)).slice(0, 5); 

    // 2. Toggle Red Dot (Only if there are Actionable items)
    if (bellBadge) {
      if (pending.length > 0) bellBadge.classList.remove('d-none');
      else bellBadge.classList.add('d-none');
    }

    // 3. Render Dashboard Card (Actionable Items ONLY)
    if (listEl) {
      if (pending.length === 0) {
         listEl.innerHTML = `<div style="text-align:center; padding: 20px; color: var(--gray-5); font-size: 13.5px;">
           <i class="bi bi-check-circle" style="font-size: 24px; color: #2e7d32; display:block; margin-bottom:8px;"></i>
           All caught up! No pending approvals.
         </div>`;
      } else {
         listEl.innerHTML = pending.map(d => `
          <div style="display: flex; justify-content: space-between; align-items: center; background: #fff8e1; border-left: 3px solid #f57c00; padding: 10px 12px; border-radius: 6px;">
            <div>
              <div style="font-size: 13.5px; font-weight: 700; color: var(--black);">${d.name}</div>
              <div style="font-size: 12px; color: var(--gray-7);">Pledged ₱${d.amount.toLocaleString()}</div>
            </div>
            <button class="btn-outline" style="font-size: 12px; padding: 4px 10px; border-color: #f57c00; color: #f57c00;" onclick="NAV.go('donations')">Review</button>
          </div>
        `).join('');
      }
    }

    // 4. Render Modal Content (Actionable + Informational)
    if (modalEl) {
      let modalHTML = '';

      // Actionable Section
      if (pending.length > 0) {
        modalHTML += `<div style="padding: 12px 16px; background: var(--gray-1); font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--gray-5); border-bottom: 1px solid var(--gray-3);">Action Required</div>`;
        modalHTML += pending.map(d => `
          <div style="padding: 16px; border-bottom: 1px solid var(--gray-3); display: flex; gap: 12px; align-items: center; transition: background 0.2s;" class="notif-item">
            <div style="width: 40px; height: 40px; background: #fff8e1; color: #f57c00; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;"><i class="bi bi-cash-stack"></i></div>
            <div style="flex: 1;">
              <div style="font-size: 14px; font-weight: 600; color: var(--black);">${d.name} pledged ₱${d.amount.toLocaleString()}</div>
              <div style="font-size: 12.5px; color: var(--gray-5);">${d.date} • ${d.purpose}</div>
            </div>
            <button class="btn-outline" style="font-size: 12px; padding: 5px 12px;" onclick="bootstrap.Modal.getInstance(document.getElementById('m-notifications')).hide(); NAV.go('donations');">View</button>
          </div>
        `).join('');
      }

      // Informational Section
      if (crucialLogs.length > 0) {
        modalHTML += `<div style="padding: 12px 16px; background: var(--gray-1); font-size: 12px; font-weight: 700; text-transform: uppercase; color: var(--gray-5); border-bottom: 1px solid var(--gray-3); border-top: ${pending.length > 0 ? 'none' : '1px solid var(--gray-3)'}">Recent Updates</div>`;
        modalHTML += crucialLogs.map(a => `
          <div style="padding: 16px; border-bottom: 1px solid var(--gray-3); display: flex; gap: 12px; align-items: center;">
            <div style="width: 40px; height: 40px; background: #e8f2fd; color: #1565c0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;"><i class="bi bi-info-circle-fill"></i></div>
            <div>
              <div style="font-size: 14px; font-weight: 500; color: var(--black);">${a.txt}</div>
              <div style="font-size: 12px; color: var(--gray-5);">${a.time}</div>
            </div>
          </div>
        `).join('');
      }

      // Empty State
      if (pending.length === 0 && crucialLogs.length === 0) {
        modalHTML = `<div style="padding: 40px 20px; text-align: center; color: var(--gray-5);">
          <i class="bi bi-bell-slash" style="font-size: 32px; color: var(--gray-3); margin-bottom: 10px; display: inline-block;"></i>
          <p style="font-size: 14px;">No new notifications</p>
        </div>`;
      }

      modalEl.innerHTML = modalHTML;
    }
  },

  // THE GENERAL LOGS AT THE BOTTOM OF DASHBOARD
  _renderActivityLogs(activities) {
    const acts = activities
      .sort((a,b) => (b.ts||0) - (a.ts||0))
      .slice(0, 6);

    ge('a-activity').innerHTML = acts.map(a =>
      `<div class="act-item"><div class="act-dot"></div><div class="act-text">${a.txt}</div><div class="act-time">${a.time}</div></div>`
    ).join('');
  },

  _renderUpcomingStrip(now, events) {
    const upcoming = events.filter(e => !e.completed && new Date(e.date) >= now).slice(0, 4);
    ge('a-uev').innerHTML = upcoming.length
      ? upcoming.map(e => {
          const d = new Date(e.date);
          return `<div class="uev-card">
            <div class="uev-date"><div class="uev-day">${d.getDate()}</div><div class="uev-mon">${d.toLocaleString('default',{month:'short'})}</div></div>
            <div><div class="uev-evtitle">${e.title}</div><div class="uev-venue"><i class="bi bi-geo-alt-fill" style="color:var(--red);font-size:11px"></i> ${e.venue}</div></div>
          </div>`;
        }).join('')
      : `<p style="color:var(--gray-5);font-size:14px;padding:8px 0">No upcoming events. <a onclick="NAV.go('events')" style="color:var(--red);font-weight:600;cursor:pointer">Create one →</a></p>`;
  }
};


/* ================================================================
   MODULE: PROFILE
   ================================================================ */
const PROFILE = {

loadAdmin() {
    sv('pf-fn', CU.fn || '');
    sv('pf-ln', CU.ln || '');
    sv('pf-em', CU.email || '');
    updateEl('prof-disp-name', `${CU.fn} ${CU.ln || ''}`.trim());
    updateEl('prof-role-tag',  'Administrator');
    const ph = ge('prof-photo');
    if (ph && !CU.av) ph.textContent = CU.fn[0];
    if (ph && CU.av)  ph.innerHTML = `<img src="${CU.av}"/>`;

    // FIX: Force the Topbar and Sidebar to use the uploaded image!
    if (CU.av) {
      const tb = ge('tb-av'), sb = ge('sb-av');
      if (tb) tb.innerHTML = `<img src="${CU.av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
      if (sb) sb.innerHTML = `<img src="${CU.av}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    }
  },

  async save() {
    CU.fn    = gv('pf-fn').trim();
    CU.ln    = gv('pf-ln').trim();
    CU.email = gv('pf-em').trim().toLowerCase();

    if (!CU.av) { updateEl('sb-av', CU.fn[0]); updateEl('tb-av', CU.fn[0]); }
    updateEl('sb-uname', CU.fn);
    updateEl('tb-uname', CU.fn);
    updateEl('prof-disp-name', `${CU.fn} ${CU.ln}`.trim());

    // Persist to Firestore if user has a doc
    if (CU.docId) {
      try {
        await updateDoc(doc(db, 'users', CU.docId), { fn:CU.fn, ln:CU.ln, email:CU.email });
      } catch(e) { console.error(e); }
    }

    await addActivityLog(`${CU.fn} ${CU.ln} updated their profile`);
    this.loadAdmin();
    TOAST.ok('Profile saved!');
  },

  uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      CU.av = ev.target.result;
      ['prof-photo','sb-av','tb-av'].forEach(id => {
        const el = ge(id);
        if (el) el.innerHTML = `<img src="${ev.target.result}"/>`;
      });
      if (CU.docId) {
        try { await updateDoc(doc(db, 'users', CU.docId), { av: ev.target.result }); } catch(e) { console.error(e); }
      }
      TOAST.ok('Photo updated!');
    };
    reader.readAsDataURL(file);
  },

  loadAlumni() {
    sv('apf-fn', CU.fn    || ''); sv('apf-ln', CU.ln   || '');
    sv('apf-em', CU.email || ''); sv('apf-ph', CU.phone || '');
    sv('apf-ad', CU.addr  || '');
    sv('apf-es', CU.status || 'Employed');
    sv('apf-co', CU.co || '');    sv('apf-jt', CU.jt || '');
    sv('apf-in', CU.ind || '');   sv('apf-ye', CU.yoe || 0);
    if (CU.batch)  sv('apf-bt', CU.batch);
    if (CU.course) sv('apf-cs', CU.course);
    const ph = ge('alm-prof-photo');
    if (ph && !CU.av) ph.textContent = CU.fn[0];
    if (ph && CU.av)  ph.innerHTML = `<img src="${CU.av}"/>`;
    
    // Ensure labels match their current status!
    if (window.ALUMNI) ALUMNI.toggleStudyLabels(CU.status, 'apf');
  },

  async saveAlumni() {
    CU.fn     = gv('apf-fn').trim();
    CU.ln     = gv('apf-ln').trim();
    CU.email  = gv('apf-em').trim().toLowerCase();
    CU.phone  = gv('apf-ph');
    CU.addr   = gv('apf-ad');
    CU.status = gv('apf-es');
    CU.co     = gv('apf-co');
    CU.jt     = gv('apf-jt');
    CU.ind    = gv('apf-in');
    CU.yoe    = parseInt(gv('apf-ye')) || 0;
    CU.batch  = gv('apf-bt');
    CU.course = gv('apf-cs');

    const alumniFields = { fn:CU.fn, ln:CU.ln, email:CU.email, phone:CU.phone, addr:CU.addr, status:CU.status, co:CU.co, jt:CU.jt, ind:CU.ind, yoe:CU.yoe, batch:CU.batch, course:CU.course };
    const userFields   = { fn:CU.fn, ln:CU.ln, email:CU.email, phone:CU.phone, addr:CU.addr, status:CU.status, co:CU.co, jt:CU.jt, ind:CU.ind, yoe:CU.yoe, batch:CU.batch, course:CU.course };

    try {
      // Update users collection
      if (CU.docId) await updateDoc(doc(db, 'users', CU.docId), userFields);

      // Update alumni collection record
      if (CU.alumniDocId) {
        await updateDoc(doc(db, 'alumni', CU.alumniDocId), alumniFields);
      } else {
        // Find by email and update
        const q    = query(COL.alumni, where('email','==', CU.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          await updateDoc(snap.docs[0].ref, alumniFields);
          CU.alumniDocId = snap.docs[0].id;
        }
      }

      await addActivityLog(`${CU.fn} ${CU.ln} updated their profile`);
      await ALUMNI_SPA._loadProfile();
      TOAST.ok('Profile saved!');
    } catch(e) {
      console.error(e);
      TOAST.err('Save failed. Check your connection.');
    }
  },

  uploadPhotoAlumni(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async ev => {
      CU.av = ev.target.result;
      ['alm-prof-photo','alm-av'].forEach(id => {
        const el = ge(id);
        if (el) el.innerHTML = `<img src="${ev.target.result}"/>`;
      });
      try {
        if (CU.docId)       await updateDoc(doc(db, 'users', CU.docId), { av: ev.target.result });
        if (CU.alumniDocId) await updateDoc(doc(db, 'alumni', CU.alumniDocId), { av: ev.target.result });
      } catch(e) { console.error(e); }
      TOAST.ok('Photo updated!');
    };
    reader.readAsDataURL(file);
  },
};


/* ================================================================
   MODULE: ALUMNI  (Admin side — directory, career tracking, CRUD)
   ================================================================ */
const ALUMNI = {

  async showTab(tab) {
    const dirView    = ge('alumni-dir-view');
    const careerView = ge('alumni-career-view');
    const btnCareer  = ge('btn-career-tab');
    const btnDir     = ge('btn-dir-tab');
    const btnAdd     = ge('btn-add-alumni');

    if (tab === 'career') {
      dirView.style.display    = 'none';
      careerView.style.display = '';
      btnCareer.style.display  = 'none';
      btnDir.style.display     = '';
      if (btnAdd) btnAdd.style.display = 'none';
      await this._renderCareerTracking();
    } else {
      dirView.style.display    = '';
      careerView.style.display = 'none';
      btnCareer.style.display  = '';
      btnDir.style.display     = 'none';
      if (btnAdd) btnAdd.style.display = '';
      await this.render();
    }
  },
  
  async render(list) {
    ge('alumni-dir-view').style.display    = '';
    ge('alumni-career-view').style.display = 'none';
    ge('btn-career-tab').style.display     = '';
    ge('btn-dir-tab').style.display        = 'none';

    try {
      let data = list;
      // If list is empty (fresh load), fetch everything AND clear all filters!
      if (!data) {
        const snap = await getDocs(COL.alumni);
        data = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        this._cachedAlumni = data; 
        
        const fStatus = ge('dir-filter-status');
        const fCourse = ge('dir-filter-course');
        const fSearch = ge('dir-search');
        if (fStatus) fStatus.selectedIndex = 0;
        if (fCourse) fCourse.selectedIndex = 0;
        if (fSearch) fSearch.value = '';
      }

      if (!list) this._cachedTotal = data.length;
      ge('dir-meta').textContent = `Showing ${data.length} of ${this._cachedTotal || data.length} alumni`;
      ge('alumni-grid').innerHTML = data.map(a => this._cardHTML(a)).join('');
    } catch (e) {
      console.error(e);
      TOAST.err('Error loading directory.');
    }
  },

  
  _cardHTML(a) {
    const imgUrl = a.av || `https://i.pravatar.cc/150?u=${a.id || a.fn}`;
    
    // SMART LOGIC: Change icons and hover text depending on status!
    const icon1  = a.status === 'Studying' ? 'bi-book-half' : (a.status === 'Unemployed' ? 'bi-search' : 'bi-briefcase');
    const title1 = a.status === 'Studying' ? 'Degree Program' : (a.status === 'Unemployed' ? 'Target Role' : 'Current Job');
    const title2 = a.status === 'Studying' ? 'Institution' : (a.status === 'Unemployed' ? 'Previous Company' : 'Company');
    
    return `
      <div class="alum-card" onclick="ALUMNI.openDetail('${a.id}')">
        <div class="ac-top">
          <div class="ac-av"><img src="${imgUrl}" alt="Profile" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${a.fn}+${a.ln}&background=random'"></div>
          <div class="ac-name-wrap">
            <div class="ac-name" title="${a.fn} ${a.ln}">${a.fn} ${a.ln}</div>
            <div class="ac-sub" title="Batch ${a.batch} · ${a.course}">Batch ${a.batch} · ${a.course}</div>
          </div>
        </div>
        <div class="ac-body">
          <div class="ac-row" title="${title1}: ${a.jt || '—'}"><i class="bi ${icon1}"></i> <span>${a.jt || '—'}</span></div>
          <div class="ac-row" title="${title2}: ${a.co || '—'}"><i class="bi bi-building"></i> <span>${a.co || '—'}</span></div>
          <div class="ac-status-row"><span class="stag ${stClass(a.status)}">${a.status}</span></div>
        </div>
      </div>`;
  },

  // ---> And I accidentally made you delete this! Restored! <---
  toggleCard(e, card, id) {
    if (e.target.closest('.ac-actions') || e.target.closest('button')) return;
    card.classList.toggle('alum-card-open');
  },

  // ---> Our new lightning-fast filter <---
  filter() {
    const q      = gv('dir-q').toLowerCase().trim();
    const batch  = gv('f-batch');
    const course = gv('f-course');
    const status = gv('f-status');
    const ind    = gv('f-ind');

    // Pull instantly from our local memory cache instead of Firebase
    const all = this._cachedAlumni || [];
    this._cachedTotal = all.length;

    const result = all.filter(a => {
      const name = `${a.fn} ${a.ln} ${a.batch} ${a.course}`.toLowerCase();
      return (!q      || name.includes(q))
          && (!batch  || a.batch  === batch)
          && (!course || a.course === course)
          && (!status || a.status === status)
          && (!ind    || a.ind    === ind);
    });
    
    this.render(result); 
  },

  // NEW: The Magic Label Flipper!
  toggleStudyLabels(status, prefix) {
    const lblCo = ge(`lbl-${prefix}-co`);
    const lblJt = ge(`lbl-${prefix}-jt`);
    const lblIn = ge(`lbl-${prefix}-in`);
    const inputCo = ge(`${prefix}-co`);
    const inputJt = ge(`${prefix}-jt`);
    const wrapIn  = ge(`wrap-${prefix}-in`);
    const wrapYe  = ge(`wrap-${prefix}-ye`);
    const wrapOther = ge(`${prefix}-in-other-wrap`);
    
    if (!lblCo || !lblJt) return;
    
    // Always show Industry and Experience by default before checking status
    if (wrapIn) wrapIn.style.display = '';
    if (wrapYe) wrapYe.style.display = '';
    
    if (status === 'Studying') {
      lblCo.innerHTML = 'University / School';
      lblJt.innerHTML = 'Degree Program';
      if (inputCo) inputCo.placeholder = 'e.g. UP Diliman';
      if (inputJt) inputJt.placeholder = 'e.g. Master of Science in IT';
      
      // Magically hide Industry and Experience fields for students!
      if (wrapIn) wrapIn.style.display = 'none';
      if (wrapYe) wrapYe.style.display = 'none';
      if (wrapOther) wrapOther.style.display = 'none';
      
    } else if (status === 'Unemployed') {
      lblCo.innerHTML = 'Previous Company <span style="font-size:11px; font-weight:400; color:var(--gray-5);">(Optional)</span>';
      lblJt.innerHTML = 'Target Role';
      if (lblIn) lblIn.innerHTML = 'Target Industry';
      if (inputCo) inputCo.placeholder = 'Where did you last work?';
      if (inputJt) inputJt.placeholder = 'e.g. Seeking Developer role...';
      
    } else {
      lblCo.innerHTML = prefix === 'am' ? 'Company' : 'Company / Institution';
      lblJt.innerHTML = prefix === 'am' ? 'Current Job' : 'Job Title';
      if (lblIn) lblIn.innerHTML = 'Industry';
      if (inputCo) inputCo.placeholder = 'Where do you work?';
      if (inputJt) inputJt.placeholder = prefix === 'am' ? 'e.g. Software Engineer' : '';
    }
  },

  openAddModal() {
    sv('m-alumni-id', '');
    ge('m-alumni-title').innerHTML = '<i class="bi bi-person-plus-fill text-danger me-2"></i>Add Alumni';
    ge('m-alumni-save').textContent = 'Save Alumni';
    
    ['am-fn','am-ln','am-em','am-ph','am-ad','am-co','am-jt','am-dob'].forEach(id => sv(id, ''));
    sv('am-bt', ''); sv('am-cs', ''); sv('am-es', ''); sv('am-in', ''); 
    sv('am-gen', ''); sv('am-civ', ''); sv('am-loc', 'Local (Philippines)'); sv('am-fs', 'None');
    sv('am-ye', 0);
    
    ge('am-file').value = '';
    ge('am-av-preview').innerHTML = '<i class="bi bi-person-fill"></i>';

    this.toggleStudyLabels('', 'am'); // Reset labels
    bootstrap.Modal.getOrCreateInstance(ge('m-alumni')).show();
  },

  async openEditModal(docId) {
    try {
      const snap = await getDoc(doc(db, 'alumni', docId));
      if (!snap.exists()) return;
      const a = snap.data();
      
      sv('m-alumni-id', docId);
      ge('m-alumni-title').innerHTML = '<i class="bi bi-pencil-fill text-danger me-2"></i>Edit Alumni';
      ge('m-alumni-save').textContent = 'Update Alumni';
      
      sv('am-fn', a.fn);  sv('am-ln', a.ln);
      sv('am-em', a.email); sv('am-ph', a.phone || '');
      sv('am-ad', a.addr  || ''); sv('am-dob', a.dob || '');
      sv('am-bt', a.batch); sv('am-cs', a.course);
      sv('am-es', a.status); sv('am-co', a.co || '');
      sv('am-jt', a.jt  || ''); sv('am-in', a.ind || '');
      sv('am-gen', a.gender || ''); sv('am-civ', a.civilStatus || '');
      sv('am-loc', a.location || 'Local (Philippines)'); sv('am-fs', a.furtherStudies || 'None');
      sv('am-ye', a.yoe || 0);

      ge('am-file').value = '';
      if (a.av) {
        ge('am-av-preview').innerHTML = `<img src="${a.av}" style="width:100%;height:100%;object-fit:cover;"/>`;
      } else {
        ge('am-av-preview').innerHTML = '<i class="bi bi-person-fill"></i>';
      }

      this.toggleStudyLabels(a.status, 'am'); // Set labels based on current status
      bootstrap.Modal.getOrCreateInstance(ge('m-alumni')).show();
    } catch(e) {
      console.error(e);
      TOAST.err('Could not load alumni data.');
    }
  },

  previewImage(e) {
    const file = e.target.files[0];
    if (!file) { ge('am-av-preview').innerHTML = '<i class="bi bi-person-fill"></i>'; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      ge('am-av-preview').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;"/>`;
    };
    reader.readAsDataURL(file);
  },

  async submitSave() {
    const fn = gv('am-fn').trim(); const ln = gv('am-ln').trim();
    const email = gv('am-em').trim().toLowerCase(); const phone = gv('am-ph').trim();
    const addr = gv('am-ad').trim(); const dob = gv('am-dob'); 
    const batch = gv('am-bt'); const course = gv('am-cs');
    const status = gv('am-es'); const co = gv('am-co').trim();
    const jt = gv('am-jt').trim();
    const gender = gv('am-gen'); const civilStatus = gv('am-civ');
    const location = gv('am-loc'); const furtherStudies = gv('am-fs');
    const yoe = parseInt(gv('am-ye')) || 0;
    const editId = gv('m-alumni-id');

    // NEW: Handle "Other" Industry box
    let ind = gv('am-in');
    if (ind === 'Other') ind = gv('am-in-other').trim();

    // VALIDATIONS
    if (!fn || !ln)  { TOAST.err('First and last name are required.'); return; }
    if (!email)      { TOAST.err('Email is required.'); return; }
    if (!batch)      { TOAST.err('Please select a batch year.'); return; }
    if (!course)     { TOAST.err('Please select a course.'); return; }
    if (!status)     { TOAST.err('Please select employment status.'); return; }
    if (ind === 'Other' && !gv('am-in-other').trim()) { TOAST.err('Please specify the industry.'); return; }
    
    // Validate Phone Number length (must be 10-15 digits if provided)
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 15) { TOAST.err('Please enter a valid phone number.'); return; }
    }

    const fileEl = ge('am-file');
    const file = fileEl?.files[0] || null;

    const finalizeSave = async (avData) => {
      // LAG KILLER: Hide modal instantly before doing database work!
      bootstrap.Modal.getInstance(ge('m-alumni'))?.hide();
      TOAST.ok(editId ? 'Updating alumni...' : 'Saving alumni...');

      const dataPayload = { fn, ln, email, phone, addr, dob, batch, course, status, co, jt, ind, gender, civilStatus, location, furtherStudies, yoe };
      if (avData !== undefined) dataPayload.av = avData;

      try {
        if (editId) {
          await updateDoc(doc(db, 'alumni', editId), dataPayload);
          const uSnap = await getDocs(query(COL.users, where('email','==',email)));
          if (!uSnap.empty) { await updateDoc(uSnap.docs[0].ref, { fn, ln, email, batch, course, av: dataPayload.av || uSnap.docs[0].data().av }); }
          await addActivityLog(`Admin updated alumni: ${fn} ${ln}`);
          TOAST.ok('Alumni updated successfully!');
        } else {
          dataPayload.av = avData || null;
          const alumRef = await addDoc(COL.alumni, dataPayload);
          await addDoc(COL.users, { email, password: 'alumni123', role: 'alumni', fn, ln, batch, course, av: dataPayload.av, alumniDocId: alumRef.id });
          await addActivityLog(`New alumni added: ${fn} ${ln}`);
          TOAST.ok('Alumni added & account created!');
        }
        
        // REFRESH DATA BUT KEEP EXACT FILTERS & TAB!
        const snap = await getDocs(COL.alumni);
        this._cachedAlumni = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        
        if (ge('alumni-career-view').style.display === '') {
          this._renderCareerTracking();
        } else {
          this.filter(); 
        }
      } catch(e) {
        console.error(e);
        TOAST.err('Save failed. Check your connection.');
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = ev => finalizeSave(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      await finalizeSave(undefined);
    }
  },

  async openDetail(docId) {
    // ... (This is exactly the same Phase 3 code we just finished!) ...
    try {
      const snap = await getDoc(doc(db, 'alumni', docId));
      if (!snap.exists()) return;
      const a = snap.data();
      const courseLabel = COURSES.find(c => c.val === a.course)?.label || a.course;
      const imgUrl = a.av || `https://i.pravatar.cc/150?u=${docId || a.fn}`;

      let ageText = '—';
      if (a.dob) {
        const bd = new Date(a.dob); const today = new Date();
        let age = today.getFullYear() - bd.getFullYear();
        const m = today.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) { age--; }
        ageText = `${age} yrs old`;
      }
      const locationText = a.location === 'Overseas' ? '<i class="bi bi-globe-americas text-primary me-1"></i> Overseas' : 'Local (Philippines)';

      ge('m-detail-body').innerHTML = `
        <div style="display:flex;align-items:center;gap:18px;margin-bottom:24px;border-bottom:1px solid var(--gray-3);padding-bottom:20px;">
          <div class="ac-av" style="width:76px;height:76px;flex-shrink:0;">
             <img src="${imgUrl}" alt="Profile" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" onerror="this.src='https://ui-avatars.com/api/?name=${a.fn}+${a.ln}&background=random'">
          </div>
          <div>
            <div style="font-size:22px;font-weight:700;font-family:var(--head);line-height:1.2;">${a.fn} ${a.ln}</div>
            <div style="color:var(--gray-5);font-size:14px;margin-top:4px;">Batch ${a.batch} · ${a.course}</div>
            <span class="stag ${stClass(a.status)}" style="margin-top:8px;display:inline-block">${a.status}</span>
          </div>
        </div>
        <div class="row g-4">
          <div class="col-md-6">
            <div class="fsec" style="color: var(--red); border-bottom-color: var(--red-pale); margin-bottom:12px;"><i class="bi bi-person-lines-fill me-2"></i>Personal Info</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:90px;display:inline-block">Age:</strong> ${ageText}</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:90px;display:inline-block">Gender:</strong> ${a.gender || '—'}</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:90px;display:inline-block">Status:</strong> ${a.civilStatus || '—'}</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:90px;display:inline-block">Location:</strong> ${locationText}</div>
            <div class="fsec" style="color: var(--red); border-bottom-color: var(--red-pale); margin-bottom:12px; margin-top:20px;"><i class="bi bi-telephone-fill me-2"></i>Contact</div>
            <div style="font-size:14px;line-height:2.2;word-break:break-all"><i class="bi bi-envelope-fill me-2" style="color:var(--gray-5)"></i>${a.email}</div>
            <div style="font-size:14px;line-height:2.2"><i class="bi bi-phone-fill me-2" style="color:var(--gray-5)"></i>${a.phone || '—'}</div>
            <div style="font-size:14px;line-height:2.2"><i class="bi bi-geo-alt-fill me-2" style="color:var(--gray-5)"></i>${a.addr || '—'}</div>
          </div>
          <div class="col-md-6">
            <div class="fsec" style="color: var(--red); border-bottom-color: var(--red-pale); margin-bottom:12px;"><i class="bi bi-mortarboard-fill me-2"></i>Education</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">Degree:</strong> <span title="${courseLabel}">${a.course}</span></div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">Post-Grad:</strong> ${a.furtherStudies || 'None'}</div>
            <div class="fsec" style="color: var(--red); border-bottom-color: var(--red-pale); margin-bottom:12px; margin-top:20px;">
              ${a.status === 'Studying' ? '<i class="bi bi-book-half me-2"></i>Current Studies' : 
               (a.status === 'Unemployed' ? '<i class="bi bi-search me-2"></i>Job Seeking' : '<i class="bi bi-briefcase-fill me-2"></i>Profession')}
            </div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">${a.status === 'Studying' ? 'Institution:' : (a.status === 'Unemployed' ? 'Prev. Company:' : 'Company:')}</strong> ${a.co || '—'}</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">${a.status === 'Studying' ? 'Program:' : (a.status === 'Unemployed' ? 'Target Role:' : 'Current Job:')}</strong> ${a.jt || '—'}</div>
            ${a.status === 'Studying' ? '' : `
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">${a.status === 'Unemployed' ? 'Target Ind.:' : 'Industry:'}</strong> ${a.ind || '—'}</div>
            <div style="font-size:14px;line-height:2.2"><strong style="color:var(--gray-7);width:110px;display:inline-block">Experience:</strong> ${a.yoe || 0} yr${a.yoe !== 1 ? 's' : ''}</div>
            `}
          </div>
        </div>`;

      const editBtn = ge('detail-edit-btn'); const deleteBtn = ge('detail-delete-btn');
      if (editBtn) { editBtn.style.display = ''; editBtn.onclick = () => { bootstrap.Modal.getInstance(ge('m-alumni-detail'))?.hide(); ALUMNI.openEditModal(docId); }; }
      if (deleteBtn) { deleteBtn.style.display = ''; deleteBtn.onclick = () => { bootstrap.Modal.getInstance(ge('m-alumni-detail'))?.hide(); ALUMNI.confirmDelete(docId); }; }
      bootstrap.Modal.getOrCreateInstance(ge('m-alumni-detail')).show();
    } catch(e) { console.error(e); TOAST.err('Could not load profile.'); }
  },

  async confirmDelete(docId) {
    try {
      const snap = await getDoc(doc(db, 'alumni', docId));
      if (!snap.exists()) return;
      const a = snap.data();
      updateEl('del-title', `Delete ${a.fn} ${a.ln}?`);
      updateEl('del-msg',   'This will permanently remove this alumni record. This action cannot be undone.');
      _deletePending = async () => {
        // LAG KILLER: Hide modal instantly
        bootstrap.Modal.getInstance(ge('m-delete-confirm'))?.hide();
        TOAST.ok('Deleting record...');

        await deleteDoc(doc(db, 'alumni', docId));
        const uSnap = await getDocs(query(COL.users, where('email','==',a.email)));
        if (!uSnap.empty) { await deleteDoc(uSnap.docs[0].ref); }
        
        await addActivityLog(`Alumni deleted: ${a.fn} ${a.ln}`);
        TOAST.ok('Alumni deleted.');
        
        // REFRESH DATA BUT KEEP EXACT FILTERS & TAB!
        const snap = await getDocs(COL.alumni);
        this._cachedAlumni = snap.docs.map(d => ({ id:d.id, ...d.data() }));
        
        if (ge('alumni-career-view').style.display === '') {
          this._renderCareerTracking();
        } else {
          this.filter(); 
        }
      };
      bootstrap.Modal.getOrCreateInstance(ge('m-delete-confirm')).show();
    } catch(e) { console.error(e); TOAST.err('Could not load data for deletion.'); }
  },

  // PHASE 4: THE UPDATED CAREER TRACKING RENDER
  async _renderCareerTracking() {
    const snap   = await getDocs(COL.alumni);
    const alumni = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    const total  = alumni.length;
    const emp    = alumni.filter(a => a.status === 'Employed').length;
    const unemp  = alumni.filter(a => a.status === 'Unemployed').length;
    const study  = alumni.filter(a => a.status === 'Studying').length;

    updateEl('ct-emp',   emp);
    updateEl('ct-unemp', unemp);
    updateEl('ct-study', study);
    updateEl('ct-rate',  total ? Math.round(emp / total * 100) + '%' : '0%');

    ge('ct-tbody').innerHTML = alumni.map(a => {
      return `
      <tr>
        <td style="font-weight:600; color:var(--black);">${a.fn} ${a.ln}</td>
        <td>${a.batch || '—'}</td>
        <td>${a.course || '—'}</td>
        <td>${a.furtherStudies || 'None'}</td>
        <td><span class="stag ${stClass(a.status)}">${a.status}</span></td>
        <td>${a.co  || '—'}</td>
        <td style="font-weight:500;">${a.jt  || '—'}</td>
        <td>${a.ind || '—'}</td>
        <td>${a.yoe || 0}</td>
      </tr>`;
    }).join('');
  },
};


/* ================================================================
   MODULE: EVENTS
   ================================================================ */
const EVENTS = {

  async load() {
    await this._drawCalendar();
    await this._renderList();
  },

  async _drawCalendar() {
    const months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
    ge('cal-lbl').textContent = `${months[CAL.month]} ${CAL.year}`;

    const firstDay = new Date(CAL.year, CAL.month, 1).getDay();
    const daysInMo = new Date(CAL.year, CAL.month + 1, 0).getDate();
    const today    = new Date();

    const snap = await getDocs(COL.events);
    const eventDates = new Set(
      snap.docs
        .filter(d => {
          const dt = new Date(d.data().date);
          return dt.getFullYear() === CAL.year && dt.getMonth() === CAL.month;
        })
        .map(d => new Date(d.data().date).getDate())
    );

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';
    for (let d = 1; d <= daysInMo; d++) {
      const isToday    = d === today.getDate() && CAL.month === today.getMonth() && CAL.year === today.getFullYear();
      const hasEvent   = eventDates.has(d);
      const isSelected = d === CAL.selectedDay;
      html += `<div class="cal-cell${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}${isSelected ? ' selected' : ''}" onclick="EVENTS.calSelectDay(${d})">${d}${hasEvent ? '<span class="cal-dot"></span>' : ''}</div>`;
    }
    ge('cal-grid').innerHTML = html;
    await this._renderCalRSVP();
  },

  async calSelectDay(d) {
    CAL.selectedDay = (CAL.selectedDay === d) ? null : d;
    await this._drawCalendar();
  },

  async _renderCalRSVP() {
    let panel = ge('cal-rsvp-panel');
    if (!panel) {
      const calPanel = document.querySelector('.cal-panel');
      if (!calPanel) return;
      panel = document.createElement('div');
      panel.id = 'cal-rsvp-panel';
      panel.style.cssText = 'margin-top:16px;border-top:1.5px solid var(--gray-3);padding-top:14px';
      calPanel.appendChild(panel);
    }

    if (!CAL.selectedDay) {
      panel.innerHTML = `<p style="font-size:13px;color:var(--gray-5);text-align:center">Click a day to see events &amp; RSVPs</p>`;
      return;
    }

    const mm      = String(CAL.month + 1).padStart(2, '0');
    const dd      = String(CAL.selectedDay).padStart(2, '0');
    const dateStr = `${CAL.year}-${mm}-${dd}`;

    const snap      = await getDocs(COL.events);
    const allEvents = snap.docs.map(d => ({ id:d.id, ...d.data() }));
    const dayEvents = allEvents.filter(e => e.date === dateStr);

    const alumniSnap = await getDocs(COL.alumni);
    const allAlumni  = alumniSnap.docs.map(d => d.data());

    const months   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayLabel = `${months[CAL.month]} ${CAL.selectedDay}, ${CAL.year}`;

    if (!dayEvents.length) {
      panel.innerHTML = `
        <div style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--gray-5);margin-bottom:8px">
          <i class="bi bi-calendar3" style="color:var(--red);margin-right:5px"></i>${dayLabel}
        </div>
        <p style="font-size:13px;color:var(--gray-5)">No events on this day.</p>`;
      return;
    }

    panel.innerHTML = `
      <div style="font-size:12.5px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--gray-5);margin-bottom:10px">
        <i class="bi bi-calendar3" style="color:var(--red);margin-right:5px"></i>${dayLabel}
      </div>
      ${dayEvents.map(ev => {
        const names = (ev.rsvps||[]).map(email => {
          const a = allAlumni.find(x => x.email === email);
          return a ? `${a.fn} ${a.ln}` : email;
        });
        return `
          <div style="margin-bottom:12px">
            <div style="font-size:13.5px;font-weight:700;color:var(--black);margin-bottom:4px">${ev.title}</div>
            <div style="font-size:12px;color:var(--gray-5);margin-bottom:6px">
              <i class="bi bi-clock" style="color:var(--red)"></i> ${ev.time || '—'} &nbsp;
              <i class="bi bi-geo-alt-fill" style="color:var(--red)"></i> ${ev.venue || '—'}
            </div>
            <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:var(--gray-5);margin-bottom:4px">
              <i class="bi bi-people" style="color:var(--red)"></i> RSVPs (${(ev.rsvps||[]).length})
            </div>
            <div style="font-size:13px;color:var(--gray-7);line-height:1.8">
              ${names.length ? names.map(n => `<span style="display:inline-block;background:var(--gray-1);border-radius:50px;padding:1px 10px;margin:2px 2px 2px 0;font-size:12px">${n}</span>`).join('') : '<span style="color:var(--gray-5)">None</span>'}
            </div>
          </div>`;
      }).join('<hr style="border-color:var(--gray-3);margin:8px 0"/>')}`;
  },

  async calShift(delta) {
    CAL.month += delta;
    if (CAL.month > 11) { CAL.month = 0;  CAL.year++; }
    if (CAL.month < 0)  { CAL.month = 11; CAL.year--; }
    CAL.selectedDay = null;
    await this._drawCalendar();
  },

  async _renderList() {
    const now  = new Date(); now.setHours(0,0,0,0);
    const snap = await getDocs(COL.events);
    const all  = snap.docs.map(d => ({ id:d.id, ...d.data() }));

    const upcoming = all.filter(e => !e.completed && new Date(e.date) >= now);
    const history  = all.filter(e =>  e.completed || new Date(e.date) <  now);

    let html = `<div class="ev-section-hd upcoming-hd">
      <i class="bi bi-calendar-check-fill"></i> Upcoming Events
      <span class="ev-section-badge ev-badge-upcoming">${upcoming.length}</span>
    </div>`;

    html += upcoming.length
      ? upcoming.map(e => this._adminCardHTML(e, false)).join('')
      : `<div class="panel ev-empty-panel">
          <div class="ev-empty-title">No upcoming events</div>
          <div class="ev-empty-sub">Hit <strong>+ Create Event</strong> to schedule one.</div>
        </div>`;

    html += `<div class="ev-section-hd history-hd mt-4">
      <i class="bi bi-clock-history"></i> Event History
      <span class="ev-section-badge ev-badge-history">${history.length}</span>
    </div>`;

    html += history.length
      ? history.map(e => this._adminCardHTML(e, true)).join('')
      : `<p style="color:var(--gray-5);font-size:14px;padding:8px 0">No past events on record.</p>`;

    ge('events-list').innerHTML = html;
  },

  _adminCardHTML(e, isPast) {
    const d      = new Date(e.date);
    const label  = e.type === 'Others' && e.customType ? e.customType : e.type;
    const stripe = { Reunion:'ev-s-reunion', Seminar:'ev-s-seminar', 'Job Fair':'ev-s-jobfair', Fundraiser:'ev-s-fundraiser', Others:'ev-s-others' }[e.type] || 'ev-s-others';
    return `
      <div class="ev-card ${isPast ? 'ev-card-past' : ''}" style="margin-bottom:12px">
        <div class="ev-stripe ${stripe}"></div>
        <div class="ev-header">
          <div class="ev-header-left">
            <div class="ev-type-tag">${label}${isPast ? ' <span class="ev-past-tag">Past</span>' : ''}</div>
            <div class="ev-title">${e.title}</div>
          </div>
          <i class="bi bi-chevron-down ev-expand-icon"></i>
        </div>
        <div class="ev-body">
          <div class="ev-meta">
            <span><i class="bi bi-calendar3"></i>${d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</span>
            <span><i class="bi bi-clock"></i>${fmtTime(e.time)}</span>
            <span><i class="bi bi-geo-alt-fill"></i>${e.venue || '—'}</span>
            <span><i class="bi bi-people"></i>${(e.rsvps||[]).length} / ${e.max} RSVPs</span>
          </div>
          ${e.desc ? `<p style="font-size:14px;color:var(--gray-7);margin-bottom:12px">${e.desc}</p>` : ''}
          <div class="ev-footer">
            ${!isPast
              ? `<button class="tbl-btn" style="font-size:12px;padding:5px 10px" onclick="EVENTS.markComplete('${e.id}')"><i class="bi bi-check2-circle"></i> Mark Complete</button>`
              : `<span class="ev-done-tag"><i class="bi bi-check-circle-fill"></i> Completed</span>`}
            <div style="display:flex;gap:8px">
              <button class="tbl-btn tbl-btn-edit"   onclick="EVENTS.openEditModal('${e.id}')"><i class="bi bi-pencil-fill"></i> Edit</button>
              <button class="tbl-btn tbl-btn-delete" onclick="EVENTS.confirmDelete('${e.id}')"><i class="bi bi-trash-fill"></i></button>
            </div>
          </div>
        </div>
      </div>`;
  },

  openCreateModal() {
    sv('ev-id', '');
    ge('m-event-title').innerHTML = '<i class="bi bi-calendar-plus-fill text-danger me-2"></i>Create Event';
    ge('m-event-save').textContent = 'Save Event';
    ['ev-title','ev-desc','ev-venue','ev-custom-type'].forEach(id => sv(id, ''));
    sv('ev-type', 'Reunion');
    sv('ev-max', 100);
    ge('ev-date').value = '';
    ge('ev-time').value = '';
    ge('ev-custom-type-wrap').style.display = 'none';
    bootstrap.Modal.getOrCreateInstance(ge('m-event')).show();
  },

  async openEditModal(docId) {
    try {
      const snap = await getDoc(doc(db, 'events', docId));
      if (!snap.exists()) return;
      const e = snap.data();
      sv('ev-id', docId);
      ge('m-event-title').innerHTML = '<i class="bi bi-pencil-fill text-danger me-2"></i>Edit Event';
      ge('m-event-save').textContent = 'Update Event';
      sv('ev-title', e.title);
      sv('ev-desc',  e.desc  || '');
      sv('ev-date',  e.date);
      sv('ev-time',  e.time  || '');
      sv('ev-venue', e.venue || '');
      sv('ev-type',  e.type);
      sv('ev-max',   e.max);
      sv('ev-custom-type', e.customType || '');
      ge('ev-custom-type-wrap').style.display = e.type === 'Others' ? '' : 'none';
      bootstrap.Modal.getOrCreateInstance(ge('m-event')).show();
    } catch(err) {
      console.error(err);
      TOAST.err('Could not load event data.');
    }
  },

  toggleCustomType(val) {
    ge('ev-custom-type-wrap').style.display = val === 'Others' ? '' : 'none';
  },

  async submitSave() {
    const title      = gv('ev-title').trim();
    const desc       = gv('ev-desc').trim();
    const date       = gv('ev-date');
    const time       = gv('ev-time');
    const venue      = gv('ev-venue').trim();
    const type       = gv('ev-type');
    const customType = gv('ev-custom-type').trim();
    const max        = parseInt(gv('ev-max')) || 100;
    const editId     = gv('ev-id');

    if (!title) { TOAST.err('Event title is required.'); return; }
    if (!date)  { TOAST.err('Event date is required.');  return; }
    if (type === 'Others' && !customType) { TOAST.err('Please specify the event type.'); return; }

    try {
      if (editId) {
        await updateDoc(doc(db, 'events', editId), { title, desc, date, time, venue, type, customType, max });
        await addActivityLog(`Event updated: ${title}`);
        TOAST.ok('Event updated!');
      } else {
        await addDoc(COL.events, { title, desc, date, time, venue, type, customType, max, rsvps:[], completed:false });
        await addActivityLog(`New event created: ${title}`);
        TOAST.ok('Event created!');
      }
      bootstrap.Modal.getInstance(ge('m-event'))?.hide();
      await this.load();
    } catch(e) {
      console.error(e);
      TOAST.err('Save failed. Check your connection.');
    }
  },

  async markComplete(docId) {
    try {
      const snap = await getDoc(doc(db, 'events', docId));
      if (!snap.exists()) return;
      await updateDoc(doc(db, 'events', docId), { completed: true });
      await addActivityLog(`Event marked complete: ${snap.data().title}`);
      TOAST.ok('Event marked as completed!');
      await this.load();
    } catch(e) {
      console.error(e);
      TOAST.err('Update failed.');
    }
  },

  async confirmDelete(docId) {
    try {
      const snap = await getDoc(doc(db, 'events', docId));
      if (!snap.exists()) return;
      const e = snap.data();
      updateEl('del-title', `Delete "${e.title}"?`);
      updateEl('del-msg',   'This will permanently remove this event. This action cannot be undone.');
      _deletePending = async () => {
        await deleteDoc(doc(db, 'events', docId));
        await addActivityLog(`Event deleted: ${e.title}`);
        TOAST.ok('Event deleted.');
        bootstrap.Modal.getInstance(ge('m-delete-confirm'))?.hide();
        await EVENTS.load();
      };
      bootstrap.Modal.getOrCreateInstance(ge('m-delete-confirm')).show();
    } catch(e) {
      console.error(e);
      TOAST.err('Could not load event for deletion.');
    }
  },
};


/* ================================================================
   MODULE: DONATIONS
   ================================================================ */
const DONATIONS = {

  async load() {
    const snap = await getDocs(COL.donations);
    const all  = snap.docs.map(d => ({ id:d.id, ...d.data() }));

    const paid   = all.filter(d => d.status === 'Paid');
    const total  = paid.reduce((s,d) => s + d.amount, 0);
    const year   = new Date().getFullYear().toString();
    const yearDon = paid.filter(d => d.date.startsWith(year)).reduce((s,d) => s + d.amount, 0);
    const donors = new Set(all.map(d => d.name.toLowerCase())).size;
    const avg    = paid.length ? Math.round(total / paid.length) : 0;

    ge('don-total').textContent  = '₱' + total.toLocaleString();
    ge('don-year').textContent   = '₱' + yearDon.toLocaleString();
    ge('don-donors').textContent = donors;
    ge('don-avg').textContent    = '₱' + avg.toLocaleString();

    this._renderTable(all);
  },

  _renderTable(all) {
    ge('don-tbody').innerHTML = all.map(d => `
      <tr>
        <td><strong>${d.name}</strong></td>
        <td>₱${d.amount.toLocaleString()}</td>
        <td>${d.purpose}</td>
        <td>${d.date}</td>
        <td>${d.fileName
          ? `<a href="#" onclick="DONATIONS.viewFile('${d.id}')" style="color:var(--red);font-size:13px"><i class="bi bi-file-earmark-fill"></i> ${d.fileName}</a>`
          : '<span style="color:var(--gray-4);font-size:13px">—</span>'}</td>
        <td><span class="${d.status === 'Paid' ? 'tpaid' : 'tpending'}">${d.status}</span></td>
        <td class="admin-only">
          <div style="display:flex;gap:6px">
            ${d.status === 'Pending'
              ? `<button class="tbl-btn" style="font-size:12px;padding:4px 9px" onclick="DONATIONS.markPaid('${d.id}')"><i class="bi bi-check2"></i> Paid</button>`
              : ''}
            <button class="tbl-btn tbl-btn-edit"   onclick="DONATIONS.openEditModal('${d.id}')"><i class="bi bi-pencil-fill"></i></button>
            <button class="tbl-btn tbl-btn-delete" onclick="DONATIONS.confirmDelete('${d.id}')"><i class="bi bi-trash-fill"></i></button>
          </div>
        </td>
      </tr>`).join('');
  },

  openAddModal() {
    sv('dn-id', '');
    sv('dn-name', CU.role === 'alumni' ? `${CU.fn} ${CU.ln}` : '');
    sv('dn-amount', '');
    sv('dn-date', new Date().toISOString().slice(0,10));
    sv('dn-purpose', '');
    sv('dn-notes', '');
    ge('dn-file-preview').classList.add('d-none');
    ge('dn-file-preview').innerHTML = '';
    ge('dn-file').value = '';
    bootstrap.Modal.getOrCreateInstance(ge('m-donation')).show();
  },

  async openEditModal(docId) {
    try {
      const snap = await getDoc(doc(db, 'donations', docId));
      if (!snap.exists()) return;
      const d = snap.data();
      sv('dn-id',      docId);
      sv('dn-name',    d.name);
      sv('dn-amount',  d.amount);
      sv('dn-date',    d.date);
      sv('dn-purpose', d.purpose);
      sv('dn-notes',   d.notes || '');
      ge('dn-file-preview').classList.add('d-none');
      ge('dn-file-preview').innerHTML = '';
      ge('dn-file').value = '';
      bootstrap.Modal.getOrCreateInstance(ge('m-donation')).show();
    } catch(e) {
      console.error(e);
      TOAST.err('Could not load donation data.');
    }
  },

  async submitSave() {
    const name    = gv('dn-name').trim();
    const amount  = parseFloat(gv('dn-amount'));
    const date    = gv('dn-date');
    const notes   = gv('dn-notes').trim();
    const editId  = gv('dn-id');

    // NEW: Handle "Other" Purpose
    let purpose = gv('dn-purpose');
    if (purpose === 'Other') purpose = gv('dn-purpose-other').trim();

    if (!name)                { TOAST.err('Donor name is required.');  return; }
    if (!amount || amount<=0) { TOAST.err('Please enter a valid amount.'); return; }
    if (!date)                { TOAST.err('Date is required.');        return; }
    if (!purpose)             { TOAST.err('Please select or specify a purpose.'); return; }
    if (!notes)               { TOAST.err('Notes are required.');      return; }

    const fileEl = ge('dn-file');
    const file   = fileEl?.files[0] || null;

    const saveWithFile = async (fileData, fileName) => {
      // LAG KILLER: Hide modal instantly
      bootstrap.Modal.getInstance(ge('m-donation'))?.hide();
      TOAST.ok(editId ? 'Updating donation...' : 'Recording donation...');

      try {
        if (editId) {
          const upd = { name, amount, date, purpose, notes };
          if (fileData) { upd.file = fileData; upd.fileName = fileName; }
          await updateDoc(doc(db, 'donations', editId), upd);
          await addActivityLog(`Donation updated: ₱${amount.toLocaleString()} from ${name}`);
          TOAST.ok('Donation updated successfully!');
        } else {
          await addDoc(COL.donations, { name, amount, date, purpose, notes, status:'Paid', file:fileData||null, fileName:fileName||'' });
          await addActivityLog(`Donation recorded: ₱${amount.toLocaleString()} from ${name}`);
          TOAST.ok('Donation recorded successfully!');
        }
        if (CU.role === 'admin') await this.load();
        else await ALUMNI_SPA._loadDonateHistory();
      } catch(e) {
        console.error(e);
        TOAST.err('Save failed. Check your connection.');
      }
    };

    if (file) {
      const reader = new FileReader();
      reader.onload = ev => saveWithFile(ev.target.result, file.name);
      reader.readAsDataURL(file);
    } else {
      await saveWithFile(null, null);
    }
  },

  handleFileSelect(e) {
    const file    = e.target.files[0];
    const preview = ge('dn-file-preview');
    if (!file) { preview.classList.add('d-none'); return; }
    preview.classList.remove('d-none');
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = ev => {
        preview.innerHTML = `<img src="${ev.target.result}" style="max-height:120px;border-radius:8px;margin-top:8px"/>
          <div style="font-size:12px;color:var(--gray-5);margin-top:4px">${file.name}</div>`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `<div style="font-size:13px;padding:8px 0"><i class="bi bi-file-earmark-pdf-fill" style="color:var(--red)"></i> ${file.name}</div>`;
    }
  },

  async viewFile(docId) {
    try {
      const snap = await getDoc(doc(db, 'donations', docId));
      if (!snap.exists() || !snap.data().file) return;
      const file = snap.data().file;
      const win  = window.open();
      if (file.startsWith('data:image')) {
        win.document.write(`<img src="${file}" style="max-width:100%"/>`);
      } else {
        win.document.write(`<iframe src="${file}" style="width:100%;height:100vh;border:none"></iframe>`);
      }
    } catch(e) {
      console.error(e);
    }
  },

  async markPaid(docId) {
    try {
      const snap = await getDoc(doc(db, 'donations', docId));
      if (!snap.exists()) return;
      await updateDoc(doc(db, 'donations', docId), { status:'Paid' });
      const d = snap.data();
      await addActivityLog(`Donation marked paid: ₱${d.amount.toLocaleString()} from ${d.name}`);
      TOAST.ok('Donation marked as paid!');
      await this.load();
    } catch(e) {
      console.error(e);
      TOAST.err('Update failed.');
    }
  },

  async confirmDelete(docId) {
    try {
      const snap = await getDoc(doc(db, 'donations', docId));
      if (!snap.exists()) return;
      const d = snap.data();
      updateEl('del-title', 'Delete this donation?');
      updateEl('del-msg',   `This will remove the ₱${d.amount.toLocaleString()} record from ${d.name}. This action cannot be undone.`);
      _deletePending = async () => {
        await deleteDoc(doc(db, 'donations', docId));
        TOAST.ok('Donation deleted.');
        bootstrap.Modal.getInstance(ge('m-delete-confirm'))?.hide();
        await DONATIONS.load();
      };
      bootstrap.Modal.getOrCreateInstance(ge('m-delete-confirm')).show();
    } catch(e) {
      console.error(e);
      TOAST.err('Could not load data for deletion.');
    }
  },
};


/* ================================================================
   MODULE: REPORTS
   ================================================================ */
const REPORTS = {

  async load() {
    const [alumniSnap, eventsSnap] = await Promise.all([
      getDocs(COL.alumni),
      getDocs(COL.events),
    ]);

    const alumni = alumniSnap.docs.map(d => d.data());
    const events = eventsSnap.docs.map(d => d.data());

    const total = alumni.length;
    const emp   = alumni.filter(a => a.status === 'Employed').length;
    const inds  = new Set(alumni.filter(a => a.ind).map(a => a.ind)).size;

    updateEl('rk-total', total);
    ge('rk-rate').textContent = total ? Math.round(emp / total * 100) + '%' : '0%';
    updateEl('rk-ind', inds);
    updateEl('rk-ev',  events.length);

    this._drawBatchChart(alumni);
    this._drawIndustryChart(alumni);
    this._drawDistChart(alumni);
    this._renderEmpTable(alumni);
  },

  _drawBatchChart(alumni) {
    const ctx = ge('ch-batch');
    if (!ctx) return;
    if (CHARTS.batch) { CHARTS.batch.destroy(); CHARTS.batch = null; }

    const batches = [...new Set(alumni.map(a => a.batch))].sort();
    const rates   = batches.map(b => {
      const group = alumni.filter(a => a.batch === b);
      const empd  = group.filter(a => a.status === 'Employed').length;
      return group.length ? Math.round(empd / group.length * 100) : 0;
    });

    CHARTS.batch = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: batches,
        datasets: [{
          label: 'Employment Rate (%)',
          data: rates,
          backgroundColor: '#C00000',
          borderRadius: 5,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } },
          x: { grid: { display: false } },
        }
      }
    });
  },

  _drawIndustryChart(alumni) {
    const ctx = ge('ch-ind');
    if (!ctx) return;
    if (CHARTS.ind) { CHARTS.ind.destroy(); CHARTS.ind = null; }

    const countMap = {};
    alumni.forEach(a => {
      if (!a.ind) return;
      countMap[a.ind] = (countMap[a.ind] || 0) + 1;
    });
    const labels = Object.keys(countMap);
    const data   = labels.map(l => countMap[l]);
    const colors = ['#C00000','#1e1e1e','#e05252','#555','#b0b0b0','#ff8080','#333'];

    CHARTS.ind = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors.slice(0, labels.length), borderWidth: 0, hoverOffset: 5 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position:'right', labels:{ usePointStyle:true, padding:14, font:{ family:'Inter', size:12 } } } },
        cutout: '60%',
      }
    });
  },

  _drawDistChart(alumni) {
    const ctx = ge('ch-dist');
    if (!ctx) return;
    if (CHARTS.dist) { CHARTS.dist.destroy(); CHARTS.dist = null; }

    const batches = [...new Set(alumni.map(a => a.batch))].sort();
    const counts  = batches.map(b => alumni.filter(a => a.batch === b).length);

    const minW = Math.max(600, batches.length * 60);
    ctx.style.width    = minW + 'px';
    ctx.style.minWidth = minW + 'px';

    CHARTS.dist = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: batches,
        datasets: [{
          label: 'Alumni Count',
          data: counts,
          backgroundColor: batches.map((_, i) => i % 2 === 0 ? '#C00000' : '#1e1e1e'),
          borderRadius: 4,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: false, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } },
          x: { grid: { display: false } },
        }
      }
    });
  },

  _renderEmpTable(alumni) {
    const emp = alumni.filter(a => a.status === 'Employed');
    ge('rpt-emp-tbody').innerHTML = emp.length
      ? emp.map(a => `
          <tr>
            <td>${a.fn} ${a.ln}</td>
            <td>${a.batch}</td>
            <td>${a.course}</td>
            <td>${a.co  || '—'}</td>
            <td>${a.jt  || '—'}</td>
            <td>${a.ind || '—'}</td>
            <td>${a.yoe} yr${a.yoe !== 1 ? 's' : ''}</td>
          </tr>`).join('')
      : `<tr><td colspan="7" style="text-align:center;color:var(--gray-5);padding:20px">No employed alumni on record.</td></tr>`;
  },

  exportPDF() {
    TOAST.ok('Preparing PDF export…');
    setTimeout(() => window.print(), 300);
  },

  async exportWord() {
    TOAST.ok('Generating Word document…');
    const snap = await getDocs(COL.alumni);
    const rows = snap.docs.map(d => {
      const a = d.data();
      return `${a.fn} ${a.ln}\t${a.batch}\t${a.course}\t${a.status}\t${a.co||''}\t${a.jt||''}\t${a.ind||''}\t${a.yoe}`;
    }).join('\n');
    const content = `AlumniTrack — Alumni Report\n\nName\tBatch\tCourse\tStatus\tCompany\tTitle\tIndustry\tExp\n${rows}`;
    const blob = new Blob([content], { type:'application/msword' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href:url, download:'alumni-report.doc' }).click();
    URL.revokeObjectURL(url);
  },

  async exportExcel() {
    TOAST.ok('Generating Excel file…');
    const snap   = await getDocs(COL.alumni);
    const header = 'Name\tBatch\tCourse\tStatus\tCompany\tJob Title\tIndustry\tExperience\n';
    const rows   = snap.docs.map(d => {
      const a = d.data();
      return `${a.fn} ${a.ln}\t${a.batch}\t${a.course}\t${a.status}\t${a.co||''}\t${a.jt||''}\t${a.ind||''}\t${a.yoe}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type:'text/tab-separated-values' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href:url, download:'alumni-report.xls' }).click();
    URL.revokeObjectURL(url);
  },
};


/* ================================================================
   MODULE: TOAST
   ================================================================ */
const TOAST = {
  _show(msg, bg) {
    const el = ge('app-toast');
    ge('toast-msg').textContent = msg;
    el.style.background = bg;
    bootstrap.Toast.getOrCreateInstance(el, { delay:3000 }).show();
  },
  ok(msg)  { this._show(msg, '#C00000'); },
  err(msg) { this._show(msg, '#333');    },
};


/* ================================================================
   HELPERS
   ================================================================ */

function ge(id)    { return document.getElementById(id); }
function gv(id)    { const el = ge(id); return el ? el.value : ''; }
function sv(id, v) { const el = ge(id); if (el) el.value = v; }

function updateEl(id, txt) {
  const el = ge(id);
  if (el) el.textContent = txt;
}

function countUp(id, target) {
  const el = ge(id);
  if (!el) return;
  let start = 0;
  const step  = Math.ceil(target / 40);
  const timer = setInterval(() => {
    start = Math.min(start + step, target);
    el.textContent = start;
    if (start >= target) clearInterval(timer);
  }, 20);
}

function avColor(seed) {
  const palette = ['#C00000','#b03030','#8B0000','#cc3333','#a02020','#d44444','#7a0000'];
  const n = typeof seed === 'number' ? seed : (seed||'').charCodeAt(0) || 0;
  return palette[n % palette.length];
}

function stClass(status) {
  return { Employed:'stag-emp', Unemployed:'stag-unemp', Studying:'stag-study' }[status] || '';
}

function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = t.split(':').map(Number);
  const ampm   = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${ampm}`;
}

/** Helper: add a timestamped activity log entry to Firestore */
async function addActivityLog(txt) {
  try {
    const now = new Date();
    const time = now.toLocaleTimeString('en-PH', { hour:'2-digit', minute:'2-digit' });
    await addDoc(COL.activity, { txt, time: 'Just now', ts: Date.now() });
  } catch(e) { console.error('Activity log failed:', e); }
}


/* ================================================================
   EXPOSE MODULES TO GLOBAL SCOPE
   Required because app.js uses type="module" (ES module scope).
   HTML onclick/onchange attributes can't see module-scoped variables
   unless we explicitly attach them to window.
   ================================================================ */
window.AUTH        = AUTH;
window.NAV         = NAV;
window.ALUMNI_SPA  = ALUMNI_SPA;
window.ADMIN_DASH  = ADMIN_DASH;
window.PROFILE     = PROFILE;
window.ALUMNI      = ALUMNI;
window.EVENTS      = EVENTS;
window.DONATIONS   = DONATIONS;
window.REPORTS     = REPORTS;
window.TOAST       = TOAST;


/* ── Wire up global delete confirm button ── */
document.addEventListener('DOMContentLoaded', async () => {
  
  // --- SCROLL ARROW MAGIC ---
  const contentArea = ge('content');
  const scrollPrompt = ge('dash-scroll-prompt');
  
  if (contentArea && scrollPrompt) {
    contentArea.addEventListener('scroll', () => {
      // If the user scrolls down more than 40 pixels, hide the arrow
      if (contentArea.scrollTop > 40) {
        scrollPrompt.classList.add('hidden');
      } else {
        // If they scroll back to the top, show it again
        scrollPrompt.classList.remove('hidden');
      }
    });
  }
  const delBtn = ge('del-confirm-btn');
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (typeof _deletePending === 'function') {
        await _deletePending();
        _deletePending = null;
      }
    });
  }

  document.addEventListener('click', e => {
    const header = e.target.closest('.ev-header');
    if (!header) return;
    const card = header.closest('.ev-card');
    if (!card) return;
    card.classList.toggle('ev-card-open');
  });

  // Seed database on first load if empty
  try {
    await seedIfEmpty();
  } catch(e) {
    console.error('Seed check failed:', e);
  }
});
