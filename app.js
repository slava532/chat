// Firebase config
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAcVuz5d2i6hEehDOeZrlQVt_9fn34aQVI",
  authDomain: "database-23af3.firebaseapp.com",
  databaseURL: "https://database-23af3-default-rtdb.firebaseio.com",
  projectId: "database-23af3",
  storageBucket: "database-23af3.firebasestorage.app",
  messagingSenderId: "907700032868",
  appId: "1:907700032868:web:88988469e0b4af30019671"
};

firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.database();

const messagesEl = document.getElementById('messages');
const sendForm = document.getElementById('send-form');
const nameInput = document.getElementById('name-input');
const messageInput = document.getElementById('message-input');

const ONE_HOUR = 60 * 60 * 1000;
let messagesRef = db.ref('messages');

// Chat logic
sendForm.addEventListener('submit', async e=>{
  e.preventDefault();
  const text = messageInput.value.trim();
  if(!text) return;
  const name = (nameInput.value || 'Anon').slice(0,32);
  const now = Date.now();
  await messagesRef.push({ name, text, ts: now });
  messageInput.value = '';
  cleanupOld();
});

function renderMessage(key, data){
  const el = document.createElement('div');
  el.className = 'message';
  el.id = "m-" + key;
  el.innerHTML = `<div class="meta">${data.name} · ${new Date(data.ts).toLocaleTimeString()}</div>
                  <div>${data.text}</div>`;
  return el;
}

function startChat(){
  const cutoff = Date.now() - ONE_HOUR;
  messagesRef.orderByChild('ts').startAt(cutoff).limitToLast(100).once('value', snap=>{
    messagesEl.innerHTML = '';
    const msgs = [];
    snap.forEach(s => msgs.push([s.key, s.val()]));
    msgs.sort((a,b)=>a[1].ts-b[1].ts);
    msgs.forEach(([k,v])=> messagesEl.appendChild(renderMessage(k,v)));
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  messagesRef.orderByChild('ts').startAt(Date.now()).on('child_added', snap=>{
    const node = renderMessage(snap.key, snap.val());
    messagesEl.appendChild(node);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  });

  setInterval(cleanupOld, 60000);
}

async function cleanupOld(){
  const cutoff = Date.now() - ONE_HOUR;
  const old = await messagesRef.orderByChild('ts').endAt(cutoff).once('value');
  const updates = {};
  old.forEach(s=> updates[s.key]=null);
  if(Object.keys(updates).length) messagesRef.update(updates);
}

// Start chat immediately
startChat();
