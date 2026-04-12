/* ===== ALUMNITRACK APP.JS ===== */

// ---- STATE ----
let CU = null; // current user
let charts = {};
let calYear, calMonth;

// ---- SEED DATA ----
const DB = {
  alumni: [
    {id:1,fn:'Maria',ln:'Santos',batch:'2022',course:'BSIT',email:'maria@email.com',phone:'09171234567',addr:'Quezon City',status:'Employed',co:'Accenture Philippines',jt:'Software Developer',ind:'Technology',yoe:2,av:null},
    {id:2,fn:'Juan',ln:'Dela Cruz',batch:'2021',course:'BSCS',email:'juan@email.com',phone:'09181234567',addr:'Pasig City',status:'Employed',co:'BDO Unibank',jt:'Systems Analyst',ind:'Finance',yoe:3,av:null},
    {id:3,fn:'Ana',ln:'Reyes',batch:'2023',course:'BSN',email:'ana@email.com',phone:'09191234567',addr:'Manila',status:'Employed',co:'Philippine General Hospital',jt:'Staff Nurse',ind:'Healthcare',yoe:1,av:null},
    {id:4,fn:'Carlo',ln:'Mendoza',batch:'2020',course:'BSBA',email:'carlo@email.com',phone:'09201234567',addr:'Makati',status:'Unemployed',co:'',jt:'',ind:'',yoe:0,av:null},
    {id:5,fn:'Liza',ln:'Garcia',batch:'2022',course:'BSEd',email:'liza@email.com',phone:'09211234567',addr:'Caloocan',status:'Studying',co:'UP Diliman',jt:'MA Education',ind:'Education',yoe:0,av:null},
    {id:6,fn:'Marco',ln:'Villanueva',batch:'2021',course:'BSIT',email:'marco@email.com',phone:'09221234567',addr:'Marikina',status:'Employed',co:'Globe Telecom',jt:'Network Engineer',ind:'Technology',yoe:3,av:null},
    {id:7,fn:'Sofia',ln:'Cruz',batch:'2023',course:'BSCS',email:'sofia@email.com',phone:'09231234567',addr:'Taguig',status:'Employed',co:'Concentrix',jt:'Technical Support',ind:'BPO',yoe:1,av:null},
    {id:8,fn:'Paolo',ln:'Ramos',batch:'2019',course:'BSCE',email:'paolo@email.com',phone:'09241234567',addr:'Paranaque',status:'Employed',co:'DPWH',jt:'Civil Engineer',ind:'Government',yoe:5,av:null},
    {id:9,fn:'Jasmine',ln:'Torres',batch:'2020',course:'BSN',email:'jasmine@email.com',phone:'09251234567',addr:'Las Pinas',status:'Employed',co:"St. Luke's Medical",jt:'ICU Nurse',ind:'Healthcare',yoe:4,av:null},
    {id:10,fn:'Ryan',ln:'Bautista',batch:'2018',course:'BSBA',email:'ryan@email.com',phone:'09261234567',addr:'Mandaluyong',status:'Employed',co:'Jollibee Foods Corp',jt:'Operations Manager',ind:'Finance',yoe:6,av:null},
    {id:11,fn:'Nicole',ln:'Fernandez',batch:'2024',course:'BSIT',email:'nicole@email.com',phone:'09271234567',addr:'Valenzuela',status:'Unemployed',co:'',jt:'',ind:'',yoe:0,av:null},
    {id:12,fn:'Kevin',ln:'Lopez',batch:'2022',course:'BSCS',email:'kevin@email.com',phone:'09281234567',addr:'Malabon',status:'Studying',co:'AIM',jt:'MBA Program',ind:'Education',yoe:2,av:null},
    {id:13,fn:'Diana',ln:'Santos',batch:'2019',course:'BSN',email:'diana@email.com',phone:'09291234567',addr:'Pasay',status:'Employed',co:'Makati Medical',jt:'Head Nurse',ind:'Healthcare',yoe:5,av:null},
    {id:14,fn:'Alex',ln:'Reyes',batch:'2021',course:'BSIT',email:'alex@email.com',phone:'09301234567',addr:'Antipolo',status:'Employed',co:'DICT',jt:'IT Officer',ind:'Government',yoe:3,av:null},
  ],
  events: [
    {id:1,title:'Alumni Grand Reunion 2025',desc:'Annual gathering of all alumni batches.',date:'2025-08-15',time:'10:00',venue:'University Gymnasium',type:'Reunion',max:500,rsvps:[]},
    {id:2,title:'Tech Career Fair 2025',desc:'Connect with top tech companies. Bring your resume!',date:'2025-07-20',time:'09:00',venue:'Conference Hall A',type:'Job Fair',max:200,rsvps:[]},
    {id:3,title:'Leadership & Entrepreneurship Seminar',desc:'Inspiring talks from alumni entrepreneurs.',date:'2025-06-10',time:'13:00',venue:'Online / Zoom',type:'Seminar',max:300,rsvps:[]},
    {id:4,title:'Scholarship Fundraiser Gala',desc:'Help raise funds for incoming scholars.',date:'2025-09-05',time:'18:00',venue:'Grand Ballroom, Hotel Manila',type:'Fundraiser',max:150,rsvps:[]},
  ],
  donations: [
    {id:1,name:'Ryan Bautista',amount:5000,purpose:'Scholarship Fund',date:'2025-01-15',status:'Paid',notes:''},
    {id:2,name:'Paolo Ramos',amount:3000,purpose:'Events',date:'2025-02-01',status:'Paid',notes:''},
    {id:3,name:'Anonymous',amount:10000,purpose:'General Fund',date:'2025-03-10',status:'Paid',notes:'Anonymous donor'},
    {id:4,name:'Jasmine Torres',amount:2500,purpose:'Scholarship Fund',date:'2025-04-05',status:'Pending',notes:''},
  ],
  activity: [
    {txt:'Maria Santos updated career info',time:'2 mins ago'},
    {txt:'New alumni registered: Nicole Fernandez',time:'1 hr ago'},
    {txt:'Juan Dela Cruz RSVPed for Tech Fair',time:'3 hrs ago'},
    {txt:'Donation recorded: ₱10,000 from Anonymous',time:'Yesterday'},
    {txt:'Admin updated alumni directory',time:'2 days ago'},
  ]
};

// ---- AUTH ----
function doLogin() {
  const em = v('l-em'), pw = v('l-pw'), role = v('l-role');
  if (!em) { toast('Please enter your email', 'error'); return; }
  CU = { id:99, fn: role==='admin'?'Admin':'Alumni', ln:'User', email:em, role, batch:'2022', course:'BSIT', status:'Employed', co:'', jt:'', ind:'', yoe:0, phone:'', addr:'', av:null };
  launch();
}

function doRegister() {
  const fn=v('r-fn'),ln=v('r-ln'),em=v('r-em'),bt=v('r-bt'),cs=v('r-cs'),rl=v('r-rl');
  if (!fn||!em||!bt||!cs) { toast('Please fill all required fields','error'); return; }
  CU = { id:99, fn, ln, email:em, role:rl, batch:bt, course:cs, status:'Unemployed', co:'', jt:'', ind:'', yoe:0, phone:'', addr:'', av:null };
  if (rl==='alumni') DB.alumni.push({id:DB.alumni.length+1,fn,ln,batch:bt,course:cs,email:em,phone:'',addr:'',status:'Unemployed',co:'',jt:'',ind:'',yoe:0,av:null});
  DB.activity.unshift({txt:`New alumni registered: ${fn} ${ln}`,time:'Just now'});
  launch();
}

function doLogout() {
  CU = null;
  document.getElementById('app').classList.add('d-none');
  document.getElementById('auth-screen').classList.remove('d-none');
  toggleAuth('login');
}

function toggleAuth(which) {
  document.getElementById('login-card').classList.toggle('d-none', which!=='login');
  document.getElementById('reg-card').classList.toggle('d-none', which!=='reg');
}

// ---- LAUNCH ----
function launch() {
  document.getElementById('auth-screen').classList.add('d-none');
  document.getElementById('app').classList.remove('d-none');
  // Sidebar user
  el('sb-uname').textContent = CU.fn;
  el('sb-urole').textContent = CU.role==='admin'?'Administrator':'Alumni';
  el('sb-av').textContent = CU.fn[0];
  // Role UI
  qsa('.admin-only').forEach(e=>e.style.display=CU.role==='admin'?'':'none');
  qsa('.alumni-only').forEach(e=>e.style.display=CU.role==='alumni'?'':'none');
  // Topbar date
  el('tb-date').textContent = new Date().toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  go('dashboard');
}

// ---- NAVIGATION ----
function go(pg) {
  qsa('.page').forEach(p=>p.classList.add('d-none'));
  el('pg-'+pg).classList.remove('d-none');
  qsa('.sb-item').forEach(i=>i.classList.toggle('active', i.dataset.pg===pg));
  el('tb-bc').textContent = {dashboard:'Dashboard',alumni:'Alumni Directory',career:'Career Tracking',events:'Events',donations:'Donations',reports:'Reports & Analytics',profile:'My Profile'}[pg]||pg;

  const loaders = {dashboard:loadDash,alumni:loadAlumni,career:loadCareer,events:loadEvents,donations:loadDonations,reports:loadReports,profile:loadProfile};
  if (loaders[pg]) loaders[pg]();
}

function toggleSidebar() {
  el('sidebar').classList.toggle('collapsed');
}

// ---- DASHBOARD ----
function loadDash() {
  const h = new Date().getHours();
  const greet = h<12?'Good morning':h<18?'Good afternoon':'Good evening';
  el('dash-greet').textContent = `${greet}, ${CU.fn}!`;

  const total = DB.alumni.length;
  const emp = DB.alumni.filter(a=>a.status==='Employed').length;
  const uev = DB.events.filter(e=>new Date(e.date)>=new Date()).length;
  const don = DB.donations.filter(d=>d.status==='Paid').reduce((s,d)=>s+d.amount,0);

  countUp('kpi-total', total);
  el('kpi-emp').textContent = Math.round(emp/total*100)+'%';
  countUp('kpi-events', uev);
  el('kpi-don').textContent = '₱'+don.toLocaleString();

  // Activity
  el('act-feed').innerHTML = DB.activity.slice(0,5).map(a=>`
    <div class="af-item"><div class="af-dot"></div><div class="af-text">${a.txt}</div><div class="af-time">${a.time}</div></div>`).join('');

  // Upcoming events
  const uevs = DB.events.filter(e=>new Date(e.date)>=new Date()).slice(0,4);
  el('dash-uev').innerHTML = uevs.map(e=>{
    const d=new Date(e.date);
    return `<div class="uev-card">
      <div class="uev-date"><div class="uev-day">${d.getDate()}</div><div class="uev-mon">${d.toLocaleString('default',{month:'short'})}</div></div>
      <div><div class="uev-title">${e.title}</div><div class="uev-venue"><i class="bi bi-geo-alt-fill" style="color:var(--red);font-size:11px"></i> ${e.venue}</div></div>
    </div>`;
  }).join('');

  buildEmpChart('all');
}

function buildEmpChart(filter) {
  const ctx = document.getElementById('emp-chart');
  if (!ctx) return;
  if (charts.emp) { charts.emp.destroy(); charts.emp=null; }
  let data = DB.alumni;
  if (filter!=='all') data = data.filter(a=>a.batch===filter);
  const emp=data.filter(a=>a.status==='Employed').length;
  const unemp=data.filter(a=>a.status==='Unemployed').length;
  const study=data.filter(a=>a.status==='Studying').length;
  charts.emp = new Chart(ctx, {
    type:'doughnut',
    data:{
      labels:['Employed','Unemployed','Studying'],
      datasets:[{data:[emp,unemp,study],backgroundColor:['#B50000','#1c1c1c','#aaaaaa'],borderWidth:0,hoverOffset:4}]
    },
    options:{
      responsive:false,
      maintainAspectRatio:false,
      plugins:{legend:{position:'right',labels:{usePointStyle:true,padding:14,font:{family:'Inter',size:12}}}},
      cutout:'68%'
    }
  });
}
function redrawEmpChart(v) { buildEmpChart(v); }

// ---- ALUMNI ----
function loadAlumni(data) {
  const list = data||DB.alumni;
  el('dir-meta').textContent = `Showing ${list.length} of ${DB.alumni.length} alumni`;
  el('alumni-grid').innerHTML = list.map(a=>`
    <div class="ac" onclick="viewAlumni(${a.id})">
      <div class="ac-top">
        <div class="ac-av" style="background:${avColor(a.id)}">${a.fn[0]}${a.ln[0]}</div>
        <div><div class="ac-nm">${a.fn} ${a.ln}</div><div class="ac-sub">Batch ${a.batch} · ${a.course}</div></div>
      </div>
      <div class="ac-info"><i class="bi bi-briefcase"></i>${a.jt||'—'}</div>
      <div class="ac-info"><i class="bi bi-building"></i>${a.co||'—'}</div>
      <div class="ac-info"><i class="bi bi-tag"></i>${a.ind||'—'}</div>
      <div><span class="status-tag st-${a.status==='Employed'?'emp':a.status==='Unemployed'?'unemp':'study'}">${a.status}</span></div>
    </div>`).join('');
}

function filterDir() {
  const q=(v('sq')||'').toLowerCase();
  const bt=v('sb'),cs=v('sc'),ss=v('ss'),si=v('si');
  const res = DB.alumni.filter(a=>{
    const nm=(a.fn+' '+a.ln).toLowerCase();
    return (!q||nm.includes(q)||a.batch.includes(q)||a.course.toLowerCase().includes(q))
      &&(!bt||a.batch===bt)&&(!cs||a.course===cs)&&(!ss||a.status===ss)&&(!si||a.ind===si);
  });
  loadAlumni(res);
}

function viewAlumni(id) {
  const a=DB.alumni.find(x=>x.id===id); if (!a) return;
  el('detail-body').innerHTML=`
    <div class="detail-hd">
      <div class="detail-av" style="background:${avColor(a.id)}">${a.fn[0]}${a.ln[0]}</div>
      <div><div class="detail-nm">${a.fn} ${a.ln}</div><div class="detail-sub">Batch ${a.batch} · ${a.course}</div>
      <span class="status-tag st-${a.status==='Employed'?'emp':a.status==='Unemployed'?'unemp':'study'}" style="margin-top:6px;display:inline-block">${a.status}</span></div>
    </div>
    <div class="detail-grid">
      <div class="dg-item"><div class="dg-lbl">Email</div><div class="dg-val">${a.email||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Phone</div><div class="dg-val">${a.phone||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Address</div><div class="dg-val">${a.addr||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Company</div><div class="dg-val">${a.co||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Job Title</div><div class="dg-val">${a.jt||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Industry</div><div class="dg-val">${a.ind||'—'}</div></div>
      <div class="dg-item"><div class="dg-lbl">Experience</div><div class="dg-val">${a.yoe||0} years</div></div>
    </div>`;
  bsModal('m-alumniDetail').show();
}

function openM(which) { bsModal('m-'+which).show(); }

function submitAddAlumni() {
  const fn=v('ma-fn'),ln=v('ma-ln');
  if (!fn||!ln) { toast('Name is required','error'); return; }
  const na={id:DB.alumni.length+1,fn,ln,batch:v('ma-bt'),course:v('ma-cs'),email:v('ma-em'),phone:v('ma-ph'),addr:v('ma-ad'),status:v('ma-es'),co:v('ma-co'),jt:v('ma-jt'),ind:v('ma-in'),yoe:parseInt(v('ma-ye'))||0,av:null};
  DB.alumni.push(na);
  DB.activity.unshift({txt:`Admin added alumni: ${fn} ${ln}`,time:'Just now'});
  bsModal('m-addAlumni').hide();
  loadAlumni();
  toast('Alumni added!','success');
}

// ---- CAREER ----
function loadCareer() {
  const emp=DB.alumni.filter(a=>a.status==='Employed').length;
  const unemp=DB.alumni.filter(a=>a.status==='Unemployed').length;
  const study=DB.alumni.filter(a=>a.status==='Studying').length;
  el('ck-emp').textContent=emp;
  el('ck-unemp').textContent=unemp;
  el('ck-study').textContent=study;

  const inds={};
  DB.alumni.filter(a=>a.ind).forEach(a=>{inds[a.ind]=(inds[a.ind]||0)+1;});
  const sorted=Object.entries(inds).sort((a,b)=>b[1]-a[1]);
  const mx=sorted[0]?.[1]||1;
  el('ind-bars').innerHTML=sorted.map(([nm,ct])=>`
    <div class="ind-bar">
      <div class="ib-hd"><span class="ib-nm">${nm}</span><span class="ib-ct">${ct} alumni</span></div>
      <div class="ib-track"><div class="ib-fill" style="width:${ct/mx*100}%"></div></div>
    </div>`).join('');

  el('car-list').innerHTML=DB.alumni.map(a=>`
    <div class="car-item">
      <div class="car-name">${a.fn} ${a.ln} <span class="status-tag st-${a.status==='Employed'?'emp':a.status==='Unemployed'?'unemp':'study'}" style="font-size:10px">${a.status}</span></div>
      <div class="car-meta">${a.co||'No employer listed'} · ${a.jt||'—'}</div>
    </div>`).join('');
}

function submitCareer() {
  CU.status=v('cu-es'); CU.co=v('cu-co'); CU.jt=v('cu-jt'); CU.ind=v('cu-in'); CU.yoe=parseInt(v('cu-ye'))||0;
  const idx=DB.alumni.findIndex(a=>a.id===CU.id);
  if (idx!==-1) { Object.assign(DB.alumni[idx],{status:CU.status,co:CU.co,jt:CU.jt,ind:CU.ind,yoe:CU.yoe}); }
  DB.activity.unshift({txt:`${CU.fn} ${CU.ln} updated career info`,time:'Just now'});
  bsModal('m-careerUpdate').hide();
  loadCareer();
  toast('Career updated!','success');
}

// ---- EVENTS ----
const now = new Date();
calYear = now.getFullYear();
calMonth = now.getMonth();

function loadEvents() {
  drawCal();
  renderEvCards();
}

function drawCal() {
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  el('cal-lbl').textContent = `${months[calMonth]} ${calYear}`;

  const first = new Date(calYear, calMonth, 1).getDay();
  const days = new Date(calYear, calMonth+1, 0).getDate();
  const today = new Date();
  const eventDates = new Set(DB.events.map(e=>{const d=new Date(e.date);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;}));

  let html='';
  for(let i=0;i<first;i++) html+=`<div class="cal-day empty other-month"></div>`;
  for(let d=1;d<=days;d++) {
    const key=`${calYear}-${calMonth}-${d}`;
    const isTd=(today.getDate()===d&&today.getMonth()===calMonth&&today.getFullYear()===calYear);
    const hasEv=eventDates.has(key);
    html+=`<div class="cal-day ${isTd?'today':''} ${hasEv?'has-event':''}" onclick="calClick(${d})">${d}</div>`;
  }
  el('cal-grid').innerHTML=html;
}

function calShift(dir) { calMonth+=dir; if(calMonth>11){calMonth=0;calYear++;} if(calMonth<0){calMonth=11;calYear--;} drawCal(); }
function calClick(d) {
  qsa('.cal-day').forEach(c=>c.classList.remove('selected'));
  event.target.classList.add('selected');
  const sel=new Date(calYear,calMonth,d);
  const dayEvs=DB.events.filter(e=>{ const ed=new Date(e.date); return ed.toDateString()===sel.toDateString(); });
  if (dayEvs.length) renderEvCards(dayEvs);
}

function renderEvCards(list) {
  const evs=list||DB.events;
  const stripeMap={Reunion:'reunion',Seminar:'seminar','Job Fair':'jobfair',Fundraiser:'fundraiser',Others:'others'};
  el('ev-cards').innerHTML=evs.map(e=>{
    const d=new Date(e.date);
    const joined=e.rsvps.includes(CU.email);
    return `<div class="ev-card">
      <div class="ev-stripe ${stripeMap[e.type]||'others'}"></div>
      <div class="ev-body">
        <div class="ev-title">${e.title}</div>
        <div class="ev-meta">
          <span><i class="bi bi-calendar3"></i>${d.toLocaleDateString('en-PH',{month:'long',day:'numeric',year:'numeric'})}</span>
          <span><i class="bi bi-clock"></i>${fmtTime(e.time)}</span>
          <span><i class="bi bi-geo-alt"></i>${e.venue}</span>
        </div>
        <div class="ev-foot">
          <span class="ev-going"><i class="bi bi-people"></i> ${e.rsvps.length} going</span>
          <button class="rsvp-btn ${joined?'rsvp-yes':'rsvp-no'}" onclick="toggleRSVP(${e.id},event)">${joined?'✓ Going':'RSVP'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleRSVP(id, e) {
  e.stopPropagation();
  const ev=DB.events.find(x=>x.id===id); if (!ev) return;
  const idx=ev.rsvps.indexOf(CU.email);
  if (idx===-1) { ev.rsvps.push(CU.email); DB.activity.unshift({txt:`${CU.fn} RSVPed for: ${ev.title}`,time:'Just now'}); toast('RSVP confirmed! 🎉','success'); }
  else { ev.rsvps.splice(idx,1); toast('RSVP cancelled',''); }
  renderEvCards();
}

function submitEvent() {
  const ti=v('ce-ti'),dt=v('ce-dt');
  if (!ti||!dt) { toast('Title and date required','error'); return; }
  DB.events.push({id:DB.events.length+1,title:ti,desc:v('ce-de'),date:dt,time:v('ce-tm')||'09:00',venue:v('ce-ve'),type:v('ce-ty'),max:parseInt(v('ce-mx'))||100,rsvps:[]});
  DB.activity.unshift({txt:`New event created: ${ti}`,time:'Just now'});
  bsModal('m-createEvent').hide();
  renderEvCards();
  drawCal();
  toast('Event created!','success');
}

// ---- DONATIONS ----
function loadDonations() {
  const paid=DB.donations.filter(d=>d.status==='Paid');
  const total=paid.reduce((s,d)=>s+d.amount,0);
  const yr=new Date().getFullYear();
  const yrTotal=paid.filter(d=>d.date.startsWith(yr)).reduce((s,d)=>s+d.amount,0);
  const donors=new Set(DB.donations.map(d=>d.name)).size;
  const avg=paid.length?Math.round(total/paid.length):0;
  el('dk-total').textContent='₱'+total.toLocaleString();
  el('dk-year').textContent='₱'+yrTotal.toLocaleString();
  el('dk-donors').textContent=donors;
  el('dk-avg').textContent='₱'+avg.toLocaleString();

  el('don-tb').innerHTML=DB.donations.map(d=>`
    <tr>
      <td><strong>${d.name}</strong></td>
      <td>₱${d.amount.toLocaleString()}</td>
      <td>${d.purpose}</td>
      <td>${d.date}</td>
      <td><span class="${d.status==='Paid'?'tag-paid':'tag-pending'}">${d.status}</span></td>
    </tr>`).join('');
}

function submitDonation() {
  const nm=v('ad-nm'),am=parseFloat(v('ad-am'));
  if (!nm||!am) { toast('Name and amount required','error'); return; }
  DB.donations.push({id:DB.donations.length+1,name:nm,amount:am,purpose:v('ad-pu'),date:v('ad-dt')||today(),status:'Paid',notes:v('ad-no')});
  DB.activity.unshift({txt:`Donation recorded: ₱${am.toLocaleString()} from ${nm}`,time:'Just now'});
  bsModal('m-addDonation').hide();
  loadDonations();
  toast('Donation recorded!','success');
}

// ---- REPORTS — Static-sized charts ----
function loadReports() {
  const total=DB.alumni.length;
  const emp=DB.alumni.filter(a=>a.status==='Employed').length;
  const inds=new Set(DB.alumni.filter(a=>a.ind).map(a=>a.ind)).size;

  el('rk-total').textContent=total;
  el('rk-rate').textContent=Math.round(emp/total*100)+'%';
  el('rk-ind').textContent=inds;
  el('rk-ev').textContent=DB.events.length;

  // Destroy old charts first
  ['rBatch','rInd','rDist','rRsvp'].forEach(k=>{ if(charts[k]){charts[k].destroy();charts[k]=null;} });

  const batches=[...new Set(DB.alumni.map(a=>a.batch))].sort();

  // Chart 1: Employment rate per batch (horizontal bar)
  const empRates = batches.map(b=>{
    const t=DB.alumni.filter(a=>a.batch===b).length;
    const e=DB.alumni.filter(a=>a.batch===b&&a.status==='Employed').length;
    return t?Math.round(e/t*100):0;
  });
  charts.rBatch = new Chart(document.getElementById('r-batch'), {
    type:'bar',
    data:{ labels:batches.map(b=>'Batch '+b), datasets:[{label:'Employment %',data:empRates,backgroundColor:'#B50000',borderRadius:6,borderSkipped:false}] },
    options:{ responsive:false, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{max:100,ticks:{callback:v=>v+'%'},grid:{color:'#f0f0f0'}}, x:{grid:{display:false}} } }
  });

  // Chart 2: Industry distribution (doughnut)
  const indMap={};
  DB.alumni.filter(a=>a.ind).forEach(a=>{indMap[a.ind]=(indMap[a.ind]||0)+1;});
  const indLabels=Object.keys(indMap), indVals=Object.values(indMap);
  const palette=['#B50000','#1c1c1c','#888','#d04040','#444','#c07070','#606060'];
  charts.rInd = new Chart(document.getElementById('r-ind'), {
    type:'doughnut',
    data:{ labels:indLabels, datasets:[{data:indVals,backgroundColor:palette.slice(0,indLabels.length),borderWidth:0}] },
    options:{ responsive:false, maintainAspectRatio:false, plugins:{legend:{position:'right',labels:{usePointStyle:true,padding:10,font:{size:11}}}}, cutout:'60%' }
  });

  // Chart 3: Alumni per batch (bar)
  const batchCounts=batches.map(b=>DB.alumni.filter(a=>a.batch===b).length);
  charts.rDist = new Chart(document.getElementById('r-dist'), {
    type:'bar',
    data:{ labels:batches.map(b=>'Batch '+b), datasets:[{label:'Alumni Count',data:batchCounts,backgroundColor:'#1c1c1c',borderRadius:6,borderSkipped:false}] },
    options:{ responsive:false, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ y:{beginAtZero:true,grid:{color:'#f0f0f0'},ticks:{stepSize:1}}, x:{grid:{display:false}} } }
  });

  // Chart 4: Event RSVP (horizontal bar)
  const evLabels=DB.events.map(e=>e.title.length>22?e.title.substring(0,22)+'…':e.title);
  const evRsvps=DB.events.map(e=>e.rsvps.length);
  charts.rRsvp = new Chart(document.getElementById('r-rsvp'), {
    type:'bar',
    data:{ labels:evLabels, datasets:[{label:'RSVPs',data:evRsvps,backgroundColor:'#B50000',borderRadius:6,borderSkipped:false}] },
    options:{ indexAxis:'y', responsive:false, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{ x:{beginAtZero:true,grid:{color:'#f0f0f0'}}, y:{grid:{display:false}} } }
  });

  // Employed table
  el('r-emp-tb').innerHTML=DB.alumni.filter(a=>a.status==='Employed').map(a=>`
    <tr>
      <td><strong>${a.fn} ${a.ln}</strong></td>
      <td>${a.batch}</td>
      <td>${a.course}</td>
      <td>${a.co||'—'}</td>
      <td>${a.jt||'—'}</td>
      <td>${a.ind||'—'}</td>
    </tr>`).join('');
}

function exportTxt() {
  const total=DB.alumni.length;
  const emp=DB.alumni.filter(a=>a.status==='Employed').length;
  const txt=`ALUMNITRACK REPORT\nGenerated: ${new Date().toLocaleDateString()}\n\nTotal Alumni: ${total}\nEmployed: ${emp} (${Math.round(emp/total*100)}%)\nUnemployed: ${DB.alumni.filter(a=>a.status==='Unemployed').length}\nStudying: ${DB.alumni.filter(a=>a.status==='Studying').length}\n\nEvents: ${DB.events.length}\nTotal Donations: ₱${DB.donations.reduce((s,d)=>s+d.amount,0).toLocaleString()}`;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download='alumni-report.txt'; a.click();
  toast('Report exported!','success');
}

// ---- PROFILE ----
function loadProfile() {
  el('pf-fn').value=CU.fn||'';
  el('pf-ln').value=CU.ln||'';
  el('pf-em').value=CU.email||'';
  el('pf-ph').value=CU.phone||'';
  el('pf-ad').value=CU.addr||'';
  el('pf-es').value=CU.status||'Employed';
  el('pf-co').value=CU.co||'';
  el('pf-jt').value=CU.jt||'';
  el('pf-in').value=CU.ind||'';
  el('pf-ye').value=CU.yoe||0;
  if(CU.batch) el('pf-bt').value=CU.batch;
  if(CU.course) el('pf-cs').value=CU.course;

  el('pa-name').textContent=`${CU.fn} ${CU.ln||''}`;
  el('pa-role').textContent=CU.role==='admin'?'Administrator':'Alumni';
  el('pai-batch').textContent='Batch '+(CU.batch||'—');
  el('pai-course').textContent=CU.course||'—';
  el('pai-status').textContent=CU.status||'—';
  el('pai-company').textContent=CU.co||'—';
  if(CU.av) el('pa-pic').innerHTML=`<img src="${CU.av}"/>`;
  else el('pa-pic').textContent=CU.fn[0];
}

function saveProfile() {
  CU.fn=v('pf-fn'); CU.ln=v('pf-ln'); CU.email=v('pf-em');
  CU.phone=v('pf-ph'); CU.addr=v('pf-ad');
  CU.status=v('pf-es'); CU.co=v('pf-co'); CU.jt=v('pf-jt');
  CU.ind=v('pf-in'); CU.yoe=parseInt(v('pf-ye'))||0;
  CU.batch=v('pf-bt'); CU.course=v('pf-cs');
  const idx=DB.alumni.findIndex(a=>a.id===CU.id);
  if(idx!==-1) Object.assign(DB.alumni[idx],{fn:CU.fn,ln:CU.ln,email:CU.email,phone:CU.phone,addr:CU.addr,status:CU.status,co:CU.co,jt:CU.jt,ind:CU.ind,yoe:CU.yoe,batch:CU.batch,course:CU.course});
  el('sb-uname').textContent=CU.fn;
  if(!CU.av) el('sb-av').textContent=CU.fn[0];
  DB.activity.unshift({txt:`${CU.fn} updated their profile`,time:'Just now'});
  loadProfile();
  toast('Profile saved!','success');
}

function uploadPic(e) {
  const f=e.target.files[0]; if(!f) return;
  const r=new FileReader();
  r.onload=ev=>{
    CU.av=ev.target.result;
    el('pa-pic').innerHTML=`<img src="${ev.target.result}"/>`;
    el('sb-av').innerHTML=`<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>`;
    toast('Photo updated!','success');
  };
  r.readAsDataURL(f);
}

// ---- UTILITIES ----
function el(id) { return document.getElementById(id); }
function v(id) { const e=el(id); return e?e.value:''; }
function qsa(sel) { return document.querySelectorAll(sel); }
function bsModal(id) { return new bootstrap.Modal(document.getElementById(id)); }
function avColor(id) { return ['#B50000','#1c1c1c','#8a0000','#3a3a3a','#c83030','#555'][id%6]; }
function fmtTime(t) { if(!t) return ''; const [h,m]=t.split(':'); const hr=parseInt(h); return `${hr%12||12}:${m} ${hr>=12?'PM':'AM'}`; }
function today() { return new Date().toISOString().split('T')[0]; }

function countUp(id, target) {
  const e=el(id); if(!e) return;
  let n=0; const step=Math.ceil(target/25);
  const t=setInterval(()=>{ n=Math.min(n+step,target); e.textContent=n.toLocaleString(); if(n>=target) clearInterval(t); },40);
}

function toast(msg, type='') {
  const t=el('toast');
  t.className='toast align-items-center text-white border-0';
  if(type==='success') t.classList.add('t-success');
  if(type==='error') t.classList.add('t-error');
  el('toast-msg').textContent=msg;
  new bootstrap.Toast(t,{delay:3000}).show();
}
