/* ============ KYAZA INISIAL - main.js ============ */
const C = window.APP_CONFIG, G = C.github, LOGO = C.brand.logo;
const PAGE = document.body.dataset.page;
const $ = id => document.getElementById(id);
const rp = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ghReady = () => !!(G.owner && G.repo && G.token) && !/^ISI_/.test(G.owner + G.repo + G.token);
const state = { products: [], waNumber: C.defaults.waNumber, waTemplate: C.defaults.waTemplate, sha: null, admin: null, active: null, playing: false };

/* ---------- Theme ---------- */
function setThemeIcon() { const i = $('themeIcon'); if (i) i.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode'; }
function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('kyaza_theme', dark ? 'dark' : 'light'); setThemeIcon();
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg, type = 'info') {
  const t = $('toast'); if (!t) return;
  $('toastMsg').textContent = msg;
  $('toastIcon').textContent = { success: 'check_circle', error: 'error', warning: 'warning' }[type] || 'info';
  t.classList.remove('translate-x-[120%]'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add('translate-x-[120%]'), 3500);
}

/* ---------- Layout (header, nav mobile, player) ---------- */
function shell() {
  const nav = [['dashboard','dashboard.html','grid_view','Dashboard'],['store','index.html','library_music','Store'],['admin','admin.html','admin_panel_settings','Admin']];
  $('app-header').innerHTML = `
  <header class="sticky top-0 z-40 glass border-b border-line/10 px-4 lg:px-8 py-3"><div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
    <a href="index.html" class="flex items-center gap-3"><img src="${LOGO}" alt="Kyaza Inisial" class="w-11 h-11 rounded-xl object-cover border border-brand/40">
      <div><h1 class="font-extrabold tracking-wider uppercase leading-tight">KYAZA <span class="text-brand">INISIAL</span></h1><p class="text-[10px] text-muted tracking-widest uppercase">Audio Sample & DJ Style</p></div></a>
    <nav class="hidden md:flex gap-1 bg-ink/5 p-1 rounded-2xl">${nav.map(n => `<a href="${n[1]}" class="px-5 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 ${PAGE === n[0] ? 'bg-brand text-white shadow-lg shadow-brand/30' : 'text-muted hover:text-ink'}"><span class="material-symbols-outlined text-lg">${n[2]}</span>${n[3]}</a>`).join('')}</nav>
    <button onclick="toggleTheme()" aria-label="Ganti tema" class="w-10 h-10 rounded-xl bg-ink/5 hover:bg-ink/10 flex items-center justify-center"><span id="themeIcon" class="material-symbols-outlined"></span></button>
  </div></header>
  <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-line/10 flex justify-around py-1.5">${nav.map(n => `<a href="${n[1]}" class="flex flex-col items-center px-4 py-1 text-[10px] font-medium ${PAGE === n[0] ? 'text-brand' : 'text-muted'}"><span class="material-symbols-outlined text-xl ${PAGE === n[0] ? 'filled' : ''}">${n[2]}</span>${n[3]}</a>`).join('')}</nav>
  <div id="toast" class="fixed top-20 right-4 z-[60] translate-x-[120%] transition-transform duration-300 max-w-sm w-[calc(100%-2rem)] card p-4 rounded-2xl shadow-2xl flex items-center gap-3"><span id="toastIcon" class="material-symbols-outlined text-brand">info</span><p id="toastMsg" class="text-sm font-medium"></p></div>
  <div id="playerBar" class="fixed bottom-14 md:bottom-0 inset-x-0 z-30 glass border-t border-brand/30 px-4 py-3 translate-y-[200%] transition-transform duration-300"><div class="max-w-7xl mx-auto flex items-center gap-4">
    <div class="flex items-center gap-3 w-1/3 min-w-0"><img id="pCover" src="${LOGO}" class="w-11 h-11 rounded-xl object-cover"><div class="min-w-0"><h4 id="pTitle" class="font-bold text-xs truncate"></h4><p id="pPrice" class="text-[11px] text-brand font-medium"></p></div></div>
    <div class="flex-1 flex items-center gap-3"><button onclick="togglePlay()" class="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center"><span id="pIcon" class="material-symbols-outlined filled">play_arrow</span></button>
      <span id="tCur" class="text-[10px] text-muted">00:00</span><input id="seek" type="range" min="0" max="100" value="0" oninput="seekAudio(this.value)" class="w-full h-1 accent-[#FF2E4C]"><span id="tDur" class="text-[10px] text-muted">00:00</span></div>
    <button onclick="orderWA(state.active)" class="btn hidden sm:inline-flex">Beli</button><div id="wave" class="hidden items-center gap-1 w-8"><i class="wave-bar"></i><i class="wave-bar"></i><i class="wave-bar"></i><i class="wave-bar"></i></div>
  </div></div>
  <audio id="audio" ontimeupdate="audioProgress()" onended="state.playing=false;syncPlayer()" onerror="audioError()"></audio>`;
  setThemeIcon();
}

/* ---------- GitHub database ---------- */
const api = p => `https://api.github.com/repos/${G.owner}/${G.repo}/contents/${p}`;
const hdr = () => ({ Authorization: `Bearer ${G.token}`, Accept: 'application/vnd.github+json' });
const b64enc = s => { let r = ''; new TextEncoder().encode(s).forEach(x => r += String.fromCharCode(x)); return btoa(r); };
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\n/g, '')), c => c.charCodeAt(0)));
const applyData = d => { state.products = d.products || []; state.waNumber = d.waNumber || state.waNumber; state.waTemplate = d.waTemplate || state.waTemplate; state.admin = d.admin || state.admin; };

async function loadData() {
  try { const c = JSON.parse(localStorage.getItem('kyaza_cache') || 'null'); if (c) applyData(c); } catch (e) {}
  if (!ghReady()) return;
  try {
    let json;
    if (PAGE === 'admin') { // admin: baca via API (selalu terbaru + sha untuk update)
      const r = await fetch(api(G.dataFile) + `?ref=${G.branch}&t=${Date.now()}`, { headers: hdr() });
      if (r.status === 404) return; if (!r.ok) throw 0;
      const d = await r.json(); state.sha = d.sha; json = JSON.parse(b64dec(d.content));
    } else { // store/dashboard: baca publik tanpa token (repo harus public)
      const r = await fetch(`https://raw.githubusercontent.com/${G.owner}/${G.repo}/${G.branch}/${G.dataFile}?t=${Date.now()}`);
      if (r.status === 404) return; /* data.json belum dibuat: normal sebelum ada produk */ if (!r.ok) throw r.status; json = await r.json();
    }
    applyData(json); localStorage.setItem('kyaza_cache', JSON.stringify(json));
  } catch (e) { toast(`Gagal memuat dari GitHub${e ? ' (kode ' + e + ')' : ''}, memakai data cache`, 'warning'); }
}

async function saveData() {
  const payload = { products: state.products, waNumber: state.waNumber, waTemplate: state.waTemplate, admin: state.admin, updatedAt: new Date().toISOString() };
  localStorage.setItem('kyaza_cache', JSON.stringify(payload));
  if (!ghReady()) { toast('Tersimpan lokal saja. Isi js/config.js untuk sync GitHub', 'warning'); return true; }
  const body = { message: 'Update data Kyaza Inisial', content: b64enc(JSON.stringify(payload, null, 2)), branch: G.branch };
  const put = () => { if (state.sha) body.sha = state.sha; else delete body.sha; return fetch(api(G.dataFile), { method: 'PUT', headers: { ...hdr(), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); };
  let r = await put();
  if (r.status === 409 || r.status === 422) { // sha kedaluwarsa: ambil sha terbaru lalu coba lagi
    const g = await fetch(api(G.dataFile) + `?ref=${G.branch}&t=${Date.now()}`, { headers: hdr() });
    state.sha = g.ok ? (await g.json()).sha : null; r = await put();
  }
  if (!r.ok) { toast(`Gagal simpan ke GitHub (${r.status}). Cek token/repo`, 'error'); return false; }
  state.sha = (await r.json()).content.sha; toast('Tersimpan ke GitHub', 'success'); return true;
}

async function uploadFile(file) {
  if (file.size > 25 * 1024 * 1024) throw new Error('Ukuran file maksimal 25 MB');
  const buf = new Uint8Array(await file.arrayBuffer()); let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
  const name = `${Date.now()}-${file.name.replace(/[^\w.-]/g, '_')}`, path = `${G.uploadDir}/${name}`;
  const r = await fetch(api(path), { method: 'PUT', headers: { ...hdr(), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Upload ' + name, content: btoa(bin), branch: G.branch }) });
  if (!r.ok) throw new Error(`Upload gagal (${r.status})`);
  return `https://raw.githubusercontent.com/${G.owner}/${G.repo}/${G.branch}/${path}`;
}

/* ---------- Audio player ---------- */
let cands = [], ci = 0;
function audioCandidates(url) { // cadangan URL bila raw.githubusercontent gagal (mis. MIME/range/cache)
  const pre = `https://raw.githubusercontent.com/${G.owner}/${G.repo}/${G.branch}/`;
  if (!url.startsWith(pre)) return [url];
  const path = url.slice(pre.length);
  return [url, `https://cdn.jsdelivr.net/gh/${G.owner}/${G.repo}@${G.branch}/${path}`, `https://github.com/${G.owner}/${G.repo}/raw/${G.branch}/${path}`];
}
function loadAudio(url) { cands = audioCandidates(url); ci = 0; $('audio').src = cands[0]; }
function audioError() {
  if (!state.active) return;
  if (++ci < cands.length) { const a = $('audio'); a.src = cands[ci]; a.play().then(() => { state.playing = true; syncPlayer(); }).catch(() => {}); return; }
  state.playing = false; syncPlayer();
  toast('Audio gagal dimuat. Pastikan repo public, file sudah ter-upload (bisa butuh beberapa menit), dan formatnya mp3/wav/m4a', 'error');
}
function playAudio(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const a = $('audio');
  if (state.active === id && state.playing) { a.pause(); state.playing = false; return syncPlayer(); }
  if (state.active !== id) loadAudio(p.audioUrl);
  state.active = id;
  a.play().then(() => { state.playing = true; syncPlayer(); }).catch(err => { if (err.name === 'NotAllowedError') toast('Pemutaran diblokir browser, tekan Play sekali lagi', 'warning'); });
  $('pCover').src = p.image || LOGO; $('pTitle').textContent = p.title; $('pPrice').textContent = rp(p.price);
  $('playerBar').classList.remove('translate-y-[200%]');
}
function togglePlay() { const a = $('audio'); if (!a.src) return; state.playing ? a.pause() : a.play(); state.playing = !state.playing; syncPlayer(); }
function syncPlayer() {
  $('pIcon').textContent = state.playing ? 'pause' : 'play_arrow';
  $('wave').classList.toggle('hidden', !state.playing); $('wave').classList.toggle('flex', state.playing);
  state.products.forEach(p => document.querySelectorAll(`[data-play="${p.id}"]`).forEach(el => el.textContent = (state.playing && state.active === p.id) ? 'pause' : 'play_arrow'));
}
const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function audioProgress() { const a = $('audio'); if (!a.duration) return; $('seek').value = a.currentTime / a.duration * 100; $('tCur').textContent = fmt(a.currentTime); $('tDur').textContent = fmt(a.duration); }
function seekAudio(v) { const a = $('audio'); if (a.duration) a.currentTime = v / 100 * a.duration; }

/* ---------- WhatsApp ---------- */
function orderWA(id) {
  const p = state.products.find(x => x.id === id); if (!p) return;
  const msg = state.waTemplate.replace('{JUDUL}', p.title).replace('{HARGA}', rp(p.price));
  window.open(`https://wa.me/${state.waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
}
function submitRequest(e) {
  e.preventDefault();
  const m = `Halo Admin Kyaza Inisial, saya ingin pesan Custom Audio:\n\n- Nama: ${$('reqName').value}\n- Teks Inisial: ${$('reqText').value}\n- Style: ${$('reqStyle').value}\n- Catatan: ${$('reqNotes').value || '-'}`;
  window.open(`https://wa.me/${state.waNumber}?text=${encodeURIComponent(m)}`, '_blank');
}

/* ---------- Store ---------- */
const SORTS = { sales: (a, b) => b.sales - a.sales, low: (a, b) => a.price - b.price, high: (a, b) => b.price - a.price, new: (a, b) => String(b.id).localeCompare(String(a.id), undefined, { numeric: true }) };
function renderStore() {
  const q = ($('searchInput').value || '').toLowerCase();
  const list = state.products.filter(p => p.title.toLowerCase().includes(q)).sort(SORTS[$('sortSel').value] || SORTS.new);
  $('countLabel').textContent = `Menampilkan ${list.length} Audio`;
  $('emptyState').classList.toggle('hidden', list.length > 0);
  $('productsGrid').innerHTML = list.map(p => `
  <div class="card rounded-2xl overflow-hidden flex flex-col group">
    <div class="relative aspect-square bg-ink/5 overflow-hidden">
      <img src="${esc(p.image || LOGO)}" onerror="this.src='${LOGO}'" alt="${esc(p.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
      <span class="absolute top-3 right-3 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full">Terjual: ${p.sales}</span>
    </div>
    <div class="p-4 space-y-3">
      <div><h3 class="font-bold uppercase tracking-wide line-clamp-1">${esc(p.title)}</h3><p class="text-brand font-extrabold text-lg">${rp(p.price)}</p></div>
      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-line/10">
        <button onclick="playAudio('${p.id}')" class="btn btn-soft justify-center"><span data-play="${p.id}" class="material-symbols-outlined text-base text-brand">play_arrow</span>Play</button>
        <button onclick="orderWA('${p.id}')" class="btn justify-center">Beli Sekarang</button>
      </div>
    </div>
  </div>`).join('');
  syncPlayer();
}

/* ---------- Dashboard ---------- */
function renderDashboard() {
  $('statProducts').textContent = state.products.length;
  $('statSales').textContent = state.products.reduce((a, p) => a + (+p.sales || 0), 0);
  $('statDb').textContent = ghReady() ? 'GitHub' : 'Lokal';
  const top = [...state.products].sort((a, b) => b.sales - a.sales).slice(0, 3);
  $('featuredGrid').innerHTML = top.length ? top.map(p => `
  <div class="card p-4 rounded-2xl flex items-center gap-4">
    <img src="${esc(p.image || LOGO)}" onerror="this.src='${LOGO}'" class="w-16 h-16 rounded-xl object-cover">
    <div class="flex-1 min-w-0"><h4 class="font-bold text-sm truncate uppercase">${esc(p.title)}</h4><p class="text-xs text-brand font-bold">${rp(p.price)}</p><p class="text-[10px] text-muted">Terjual: ${p.sales} unit</p></div>
    <button onclick="playAudio('${p.id}')" class="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center"><span data-play="${p.id}" class="material-symbols-outlined text-lg">play_arrow</span></button>
  </div>`).join('') : '<p class="text-sm text-muted">Belum ada produk.</p>';
}

/* ---------- Admin ---------- */
const sha256 = async t => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)))].map(b => b.toString(16).padStart(2, '0')).join('');
const credHash = (u, p) => sha256(`kyaza:${u}:${p}`);
async function adminLogin(e) {
  e.preventDefault(); const u = $('lu').value.trim(), p = $('lp').value;
  const ok = state.admin ? (u === state.admin.user && await credHash(u, p) === state.admin.hash) : (u === C.admin.username && p === C.admin.password);
  if (ok) { sessionStorage.setItem('kyaza_admin', '1'); initAdmin(); toast('Berhasil login', 'success'); }
  else toast('Username atau password salah', 'error');
}
async function saveSecurity(e) {
  e.preventDefault(); const u = $('newUser').value.trim(), p = $('newPass').value;
  if (p.length < 8) return toast('Password minimal 8 karakter', 'error');
  if (p !== $('newPass2').value) return toast('Konfirmasi password tidak sama', 'error');
  state.admin = { user: u, hash: await credHash(u, p) };
  if (await saveData()) { $('newPass').value = $('newPass2').value = ''; toast('Kredensial admin diperbarui', 'success'); }
}
async function testGithub() {
  if (!ghReady()) return toast('Isi owner, repo, dan token di js/config.js', 'warning');
  const r = await fetch(`https://api.github.com/repos/${G.owner}/${G.repo}`, { headers: hdr() });
  if (!r.ok) return toast(`Koneksi gagal (${r.status}). Cek token/owner/repo`, 'error');
  const d = await r.json();
  if (d.private) return toast('Repo private: store publik tidak bisa membaca data. Ubah ke public', 'warning');
  d.permissions && d.permissions.push ? toast('Koneksi OK, izin tulis tersedia', 'success') : toast('Terhubung, tapi token tanpa izin tulis', 'warning');
}
function adminLogout() { sessionStorage.removeItem('kyaza_admin'); initAdmin(); }
function initAdmin() {
  const on = sessionStorage.getItem('kyaza_admin') === '1';
  $('loginCard').classList.toggle('hidden', on); $('adminPanel').classList.toggle('hidden', !on);
  if (on) renderAdmin();
}
function renderAdmin() {
  $('ghStatus').textContent = ghReady() ? `Database: GitHub ${G.owner}/${G.repo}` : 'Database: lokal (isi js/config.js untuk GitHub)';
  $('adminEmpty').classList.toggle('hidden', state.products.length > 0);
  $('adminTable').innerHTML = state.products.map(p => `
  <tr><td class="p-4 flex items-center gap-3"><img src="${esc(p.image || LOGO)}" onerror="this.src='${LOGO}'" class="w-10 h-10 rounded-lg object-cover"><span class="font-bold uppercase">${esc(p.title)}</span></td>
    <td class="p-4 text-brand font-semibold">${rp(p.price)}</td><td class="p-4">${p.sales}</td>
    <td class="p-4"><div class="flex gap-2">
      <button onclick="playAudio('${p.id}')" class="p-1.5 rounded-lg bg-brand/10 text-brand"><span data-play="${p.id}" class="material-symbols-outlined text-base">play_arrow</span></button>
      <button onclick="openModal('${p.id}')" class="p-1.5 rounded-lg bg-blue-500/10 text-blue-500"><span class="material-symbols-outlined text-base">edit</span></button>
      <button onclick="deleteProduct('${p.id}')" class="p-1.5 rounded-lg bg-red-500/10 text-red-500"><span class="material-symbols-outlined text-base">delete</span></button></div></td></tr>`).join('');
  $('waNumber').value = state.waNumber; $('waTemplate').value = state.waTemplate; $('newUser').value = state.admin ? state.admin.user : C.admin.username;
}
function openModal(id = '') {
  const p = state.products.find(x => x.id === id) || {};
  $('mHead').textContent = id ? 'Edit Produk Audio' : 'Tambah Produk Audio';
  $('mId').value = id; $('mTitle').value = p.title || ''; $('mPrice').value = p.price || ''; $('mSales').value = p.sales ?? 0;
  $('mImageUrl').value = p.image || ''; $('mAudioUrl').value = p.audioUrl || ''; $('mImageFile').value = ''; $('mAudioFile').value = '';
  $('modal').classList.replace('hidden', 'flex');
}
function closeModal() { $('modal').classList.replace('flex', 'hidden'); }
async function saveProduct(e) {
  e.preventDefault(); const btn = $('mSave'); btn.disabled = true;
  try {
    let image = $('mImageUrl').value.trim(), audioUrl = $('mAudioUrl').value.trim();
    const fi = $('mImageFile').files[0], fa = $('mAudioFile').files[0];
    if ((fi || fa) && !ghReady()) throw new Error('Isi js/config.js (token, username, repo) untuk upload file');
    if (fi) { toast('Mengunggah gambar...'); image = await uploadFile(fi); }
    if (fa) { toast('Mengunggah audio...'); audioUrl = await uploadFile(fa); }
    if (!audioUrl) throw new Error('Audio wajib diisi (upload atau URL)');
    const id = $('mId').value;
    const p = { id: id || 'prod-' + Date.now(), title: $('mTitle').value.trim(), price: +$('mPrice').value || 0, sales: +$('mSales').value || 0, image, audioUrl };
    const i = state.products.findIndex(x => x.id === id); i > -1 ? state.products[i] = p : state.products.push(p);
    if (await saveData()) { closeModal(); renderAdmin(); }
  } catch (err) { toast(err.message, 'error'); }
  btn.disabled = false;
}
async function removeUpload(url) {
  const pre = `https://raw.githubusercontent.com/${G.owner}/${G.repo}/${G.branch}/`;
  if (!ghReady() || !url || !url.startsWith(pre + G.uploadDir + '/')) return;
  const path = url.slice(pre.length);
  try {
    const g = await fetch(api(path) + `?ref=${G.branch}`, { headers: hdr() }); if (!g.ok) return;
    await fetch(api(path), { method: 'DELETE', headers: { ...hdr(), 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Hapus ' + path, sha: (await g.json()).sha, branch: G.branch }) });
  } catch (e) {}
}
async function deleteProduct(id) {
  const p = state.products.find(x => x.id === id);
  if (!p || !confirm('Hapus produk ini beserta file uploadnya?')) return;
  state.products = state.products.filter(x => x.id !== id);
  if (await saveData()) await Promise.all([removeUpload(p.image), removeUpload(p.audioUrl)]);
  renderAdmin();
}
async function saveWa(e) {
  e.preventDefault(); state.waNumber = $('waNumber').value.trim(); state.waTemplate = $('waTemplate').value; await saveData();
}

/* ---------- Init ---------- */
(async function init() {
  shell(); if (PAGE === 'store') $('productsGrid').innerHTML = Array(4).fill('<div class="card rounded-2xl aspect-[3/4] animate-pulse"></div>').join('');
  await loadData();
  if (PAGE === 'store') renderStore();
  if (PAGE === 'dashboard') renderDashboard();
  if (PAGE === 'admin') initAdmin();
})();
