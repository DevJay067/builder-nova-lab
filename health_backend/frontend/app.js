const apiBase = window.location.origin; // assume netlify.toml proxies /api and /ws
const api = (path) => `${apiBase}/api${path}`;
const wsUrl = (token) => {
  const loc = window.location;
  const proto = loc.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${loc.host}/ws?token=${encodeURIComponent(token)}`;
};

const el = (id) => document.getElementById(id);
let accessToken = null;
let ws;

const hrCtx = document.getElementById('hrChart').getContext('2d');
const hrData = { labels: [], datasets: [{ label: 'BPM', data: [], borderColor: '#4fc3f7', tension: 0.25 }] };
const hrChart = new Chart(hrCtx, { type: 'line', data: hrData, options: { animation: false, plugins: { legend: { display: false } }, scales: { y: { suggestedMin: 40, suggestedMax: 160 } } } });

function pushSample(ts, bpm) {
  const maxPoints = 120;
  hrData.labels.push(new Date(ts).toLocaleTimeString());
  hrData.datasets[0].data.push(bpm ?? null);
  if (hrData.labels.length > maxPoints) {
    hrData.labels.shift();
    hrData.datasets[0].data.shift();
  }
  hrChart.update('none');
}

async function login(email, password) {
  const res = await fetch(api('/v1/auth/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password })});
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  return data.access_token;
}

async function loadInitial() {
  const res = await fetch(api('/v1/watch/samples'), { headers: { Authorization: `Bearer ${accessToken}` }});
  if (res.ok) {
    const arr = await res.json();
    arr.reverse().forEach(s => pushSample(s.timestamp, s.heart_rate_bpm));
  }
}

function connectWS() {
  if (ws) try { ws.close(); } catch {}
  ws = new WebSocket(wsUrl(accessToken));
  el('connState').textContent = 'Connecting…';
  ws.onopen = () => {
    el('connState').textContent = 'Connected';
  };
  ws.onclose = () => {
    el('connState').textContent = 'Disconnected';
    setTimeout(connectWS, 2000);
  };
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.event === 'watch.sample') {
        const s = msg.data;
        pushSample(s.timestamp, s.heart_rate_bpm);
        el('rssiVal').textContent = (s.rssi_dbm ?? '—');
        el('qualVal').textContent = (s.connection_quality ?? '—');
        el('spo2Val').textContent = (s.spo2_percent ?? '—');
        el('stepsVal').textContent = (s.steps ?? '—');
        el('calVal').textContent = (s.calories ?? '—');
      }
    } catch (e) {
      console.error('ws message parse error', e);
    }
  };
}

el('loginBtn').addEventListener('click', async () => {
  const email = el('email').value.trim();
  const password = el('password').value;
  el('authMsg').textContent = 'Logging in…';
  try {
    accessToken = await login(email, password);
    el('authCard').style.display = 'none';
    el('liveCard').style.display = 'block';
    el('tokenPreview').textContent = `Bearer ${accessToken.substring(0, 16)}…`;
    await loadInitial();
    connectWS();
  } catch (e) {
    el('authMsg').textContent = 'Login failed';
  }
});