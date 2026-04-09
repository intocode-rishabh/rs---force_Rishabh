/* NeighbourHub — shared.js v2 */

const API = {
  async get(url) { const r = await fetch(url,{credentials:'include'}); return r.json(); },
  async post(url,body) { const r = await fetch(url,{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.json(); },
  async put(url,body) { const r = await fetch(url,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}); return r.json(); },
  async del(url) { const r = await fetch(url,{method:'DELETE',credentials:'include'}); return r.json(); }
};

const Toast = {
  _t:null,
  show(msg,type='info'){
    const el=document.getElementById('toast');if(!el)return;
    el.textContent=msg;el.className=type;el.style.display='block';
    clearTimeout(this._t);this._t=setTimeout(()=>{el.style.display='none';},3600);
  }
};

const Notif = {
  _t:null,
  show(msg){
    let el=document.getElementById('top-notif');
    if(!el){
      el=document.createElement('div');el.id='top-notif';
      el.style.cssText='position:fixed;top:72px;right:20px;z-index:3000;background:var(--navy);color:white;padding:12px 18px;border-radius:var(--radius-md);font-size:0.88rem;font-weight:500;box-shadow:var(--shadow-lg);border-left:4px solid var(--amber);display:none;max-width:300px;cursor:pointer;font-family:var(--font-body);';
      el.onclick=()=>{el.style.display='none';if(typeof ChatWidget!=='undefined')ChatWidget.togglePanel();};
      document.body.appendChild(el);
      if(!document.getElementById('notif-kf')){const s=document.createElement('style');s.id='notif-kf';s.textContent='@keyframes slideInR{from{transform:translateX(120%);opacity:0}to{transform:translateX(0);opacity:1}}';document.head.appendChild(s);}
    }
    el.innerHTML='💬 '+msg;el.style.animation='none';el.offsetHeight;el.style.animation='slideInR 0.3s ease';el.style.display='block';
    clearTimeout(this._t);this._t=setTimeout(()=>{el.style.display='none';},5000);
  }
};

const Modal = {
  open(html){const ov=document.getElementById('modal-overlay');const bx=document.getElementById('modal-box');if(!ov||!bx)return;bx.innerHTML=html;ov.classList.add('open');},
  close(){const ov=document.getElementById('modal-overlay');if(ov)ov.classList.remove('open');}
};
document.addEventListener('DOMContentLoaded',()=>{const ov=document.getElementById('modal-overlay');if(ov)ov.addEventListener('click',e=>{if(e.target===ov)Modal.close();});});

const PROFESSIONS=[
  {id:'Plumber',label:'Plumber',icon:'🔧',badge:'badge-plumber'},
  {id:'Tutor',label:'Tutor',icon:'📚',badge:'badge-tutor'},
  {id:'Electrician',label:'Electrician',icon:'⚡',badge:'badge-electrician'},
  {id:'Delivery Agent',label:'Delivery Agent',icon:'🛵',badge:'badge-delivery'},
  {id:'Doctor',label:'Doctor',icon:'🩺',badge:'badge-doctor'},
  {id:'Others',label:'Others',icon:'🛠️',badge:'badge-others'}
];

function profBadge(profession,role){
  if(role==='customer')return`<span class="badge badge-customer">Customer</span>`;
  const p=PROFESSIONS.find(x=>x.id===profession);
  if(!p)return`<span class="badge badge-others">${profession||'Provider'}</span>`;
  return`<span class="badge ${p.badge}">${p.icon} ${p.label}</span>`;
}

function avatarHTML(user,cls='avatar-md'){
  const i=(user.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  if(user.profilePic)return`<div class="avatar ${cls}"><img src="${user.profilePic}" alt="avatar"></div>`;
  return`<div class="avatar ${cls}">${i}</div>`;
}

function timeAgo(iso){
  const d=Date.now()-new Date(iso);const m=Math.floor(d/60000);
  if(m<1)return'just now';if(m<60)return m+'m ago';
  const h=Math.floor(m/60);if(h<24)return h+'h ago';
  return Math.floor(h/24)+'d ago';
}

function starsHTML(rating,interactive=false){
  if(!rating&&!interactive)return'';
  if(interactive){
    return`<div class="star-picker" id="star-picker">${[1,2,3,4,5].map(i=>`<span class="star-pick" data-v="${i}" onclick="pickStar(${i})" style="font-size:1.5rem;cursor:pointer;color:var(--grey-200);transition:color 0.1s">★</span>`).join('')}</div>`;
  }
  const f=Math.floor(Math.round(rating||0));
  return`<span style="color:var(--amber);letter-spacing:1px">${'★'.repeat(f)}${'☆'.repeat(5-f)}</span><span style="font-size:0.82rem;color:var(--grey-600);margin-left:4px">${Number(rating).toFixed(1)}</span>`;
}

function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function escAttr(s){return String(s||'').replace(/'/g,'&#39;').replace(/"/g,'&quot;');}

// Global provider store — fixes card click with special chars
window.__providers=[];
function openProviderByIndex(idx){const p=window.__providers[idx];if(p)openProfileModal(p);}

async function renderNavbar(){
  const nav=document.getElementById('nav-links');if(!nav)return;
  const res=await API.get('/api/auth/me');const user=res.user;
  window.__currentUser=user;
  if(!user){
    nav.innerHTML=`<button class="nav-btn" onclick="location.href='/find-work'">Find Work</button><button class="nav-btn" onclick="location.href='/how-to-service'">Find Service</button><button class="nav-btn-cta" onclick="location.href='/login'">Login</button>`;
    return;
  }
  const fw=user.role==='provider'?`<button class="nav-btn${location.pathname==='/find-work'?' active':''}" onclick="location.href='/find-work'">Find Work</button>`:'';
  const fs=user.role==='customer'?`<button class="nav-btn${location.pathname==='/find-service'?' active':''}" onclick="location.href='/find-service'">Find Service</button>`:'';
  const avi=user.profilePic?`<img src="${user.profilePic}" alt="avatar">`:(user.name||'U').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  nav.innerHTML=`${fw}${fs}<button class="nav-btn${location.pathname==='/profile'?' active':''}" onclick="location.href='/profile'" title="My Profile"><span class="nav-avatar">${avi}</span></button><button class="nav-btn" onclick="doLogout()" style="color:rgba(255,255,255,0.55);font-size:0.85rem">Logout</button>`;
}

async function doLogout(){await API.post('/api/auth/logout',{});window.__currentUser=null;location.href='/';}

async function openProfileModal(user){
  const id=user._id||user.id;const c=user.contacts||{};
  let contacts='';
  if(c.whatsapp)contacts+=`<a class="modal-contact-btn wa" href="https://wa.me/${c.whatsapp.replace(/\D/g,'')}" target="_blank">💬 WhatsApp</a>`;
  if(c.instagram)contacts+=`<a class="modal-contact-btn ig" href="https://instagram.com/${c.instagram.replace('@','')}" target="_blank">📸 Instagram</a>`;
  if(c.twitter)contacts+=`<a class="modal-contact-btn tw" href="https://twitter.com/${c.twitter.replace('@','')}" target="_blank">🐦 Twitter</a>`;
  if(!contacts)contacts=`<p style="color:var(--grey-600);font-size:0.88rem">No contact details provided.</p>`;

  const rateLabel=user.hourlyRate?`<strong style="font-family:var(--font-display);color:var(--amber-dark);font-size:1.1rem">₹${user.hourlyRate}/hr</strong>`:'';
  const me=window.__currentUser;
  const chatBtn=(me&&id&&me._id!==id.toString())?`<button class="btn btn-primary btn-sm" onclick="ChatWidget.openChatWith('${id}','${escAttr(user.name)}');Modal.close()">💬 Message</button>`:'';
  const avgStars=user.avgRating?starsHTML(user.avgRating):`<span style="color:var(--grey-400);font-size:0.82rem">No ratings yet</span>`;
  const canReview=me&&me.role==='customer'&&me._id!==id?.toString();
  const reviewFormHTML=canReview?`
    <div id="review-form" style="margin-top:14px;padding:14px;background:var(--off-white);border-radius:var(--radius-sm)">
      <p style="font-size:0.78rem;font-weight:700;color:var(--grey-600);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px">Leave a Review</p>
      ${starsHTML(0,true)}
      <input type="hidden" id="review-rating" value="0"/>
      <textarea id="review-text" placeholder="Share your experience..." maxlength="500" style="width:100%;margin-top:10px;padding:10px;border:2px solid var(--grey-200);border-radius:var(--radius-sm);font-family:var(--font-body);font-size:0.88rem;resize:vertical;min-height:70px;outline:none;"></textarea>
      <button class="btn btn-primary btn-sm" style="margin-top:8px;width:100%;justify-content:center" onclick="submitReview('${id}')">Submit Review ⭐</button>
    </div>`:'';

  Modal.open(`
    <button class="modal-close" onclick="Modal.close()">✕</button>
    <div class="modal-profile-header">
      ${avatarHTML(user,'avatar-lg')}
      <div class="modal-profile-info">
        <h3>${escHtml(user.name)}</h3>
        <p>${user.username?'@'+user.username:''} ${user.location?'· '+escHtml(user.location):''}</p>
        <div style="display:flex;align-items:center;gap:10px;margin-top:6px;flex-wrap:wrap">${profBadge(user.profession,user.role)}${rateLabel}</div>
        <div style="margin-top:6px">${avgStars}</div>
      </div>
    </div>
    <div class="divider"></div>
    <p style="font-size:0.78rem;font-weight:700;color:var(--grey-600);text-transform:uppercase;letter-spacing:0.5px">About</p>
    <div class="modal-about">${escHtml(user.about||'No description provided.')}</div>
    <div class="divider"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div><p style="font-size:0.78rem;font-weight:700;color:var(--grey-600);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Connect</p><div class="modal-contacts">${contacts}</div></div>
      ${chatBtn}
    </div>
    <div class="divider"></div>
    <p style="font-size:0.78rem;font-weight:700;color:var(--grey-600);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">Reviews</p>
    <div id="modal-reviews-list"><div class="spinner" style="width:22px;height:22px;border-width:2px;margin:10px auto"></div></div>
    ${reviewFormHTML}
  `);
  loadReviewsInModal(id);
}

async function loadReviewsInModal(providerId){
  const listEl=document.getElementById('modal-reviews-list');if(!listEl)return;
  const res=await API.get(`/api/reviews/${providerId}`);
  const reviews=res.reviews||[];
  if(!reviews.length){listEl.innerHTML=`<p style="color:var(--grey-400);font-size:0.88rem;padding:8px 0">No reviews yet. Be the first!</p>`;return;}
  listEl.innerHTML=reviews.map(r=>`
    <div style="padding:10px 0;border-bottom:1px solid var(--grey-100)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <span style="font-weight:600;font-size:0.88rem;color:var(--navy)">${escHtml(r.customerName)}</span>
        <span style="color:var(--grey-400);font-size:0.75rem">${timeAgo(r.createdAt)}</span>
      </div>
      <div>${starsHTML(r.rating)}</div>
      <p style="font-size:0.87rem;color:var(--text-light);margin-top:4px;line-height:1.5">${escHtml(r.text)}</p>
    </div>`).join('');
}

function pickStar(v){
  document.getElementById('review-rating').value=v;
  document.querySelectorAll('.star-pick').forEach(s=>{s.style.color=parseInt(s.dataset.v)<=v?'var(--amber)':'var(--grey-200)';});
}

async function submitReview(providerId){
  const rating=parseInt(document.getElementById('review-rating')?.value||'0');
  const text=document.getElementById('review-text')?.value?.trim();
  if(!rating)return Toast.show('Please select a star rating.','error');
  if(!text)return Toast.show('Please write your review.','error');
  const res=await API.post(`/api/reviews/${providerId}`,{rating,text});
  if(res.error)return Toast.show(res.error,'error');
  Toast.show('Review submitted! ⭐','success');
  const rf=document.getElementById('review-form');
  if(rf)rf.innerHTML='<p style="color:var(--teal);font-size:0.88rem;padding:8px 0">✅ Thank you for your review!</p>';
  loadReviewsInModal(providerId);
}
