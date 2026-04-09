/* NeighbourHub — chat.js v2
   Fixes: sent msgs appear instantly, red FAB border on unread,
   top-right notification popup for incoming messages */

const ChatWidget = {
  socket: null,
  activeConvoUserId: null,
  activeConvoUserName: null,
  unreadCount: 0,
  currentUserId: null,

  init(currentUserId) {
    if (!currentUserId || this.socket) return;
    this.currentUserId = currentUserId;
    this.socket = io({ withCredentials: true });

    this.socket.on('new_message', (msg) => {
      const senderId = (msg.senderId?.$oid || msg.senderId || '').toString();
      const isMine   = senderId === this.currentUserId;

      // Append to open chat window (both sender and receiver)
      if (this.activeConvoUserId) {
        const otherParty = isMine
          ? (msg.receiverId?.$oid || msg.receiverId || '').toString()
          : senderId;
        if (otherParty === this.activeConvoUserId || senderId === this.activeConvoUserId) {
          this._appendMsg(msg, isMine);
        }
      }

      // Incoming from someone else
      if (!isMine) {
        const panelOpen  = document.getElementById('chat-panel')?.classList.contains('open');
        const windowOpen = document.getElementById('chat-window')?.style.display !== 'none';
        const chatWithSender = this.activeConvoUserId === senderId;

        if (!panelOpen || !windowOpen || !chatWithSender) {
          this.unreadCount++;
          this._updateBadge();
          // Top-right notification
          if (typeof Notif !== 'undefined') {
            Notif.show((msg._senderName || 'Someone') + ' sent you a message');
          }
        }
        // Refresh convo list if visible
        const convosEl = document.getElementById('chat-convos');
        if (convosEl && convosEl.style.display !== 'none') this.loadConversations();
      }
    });

    this._renderWidget();
    this.loadConversations();
  },

  _renderWidget() {
    if (document.getElementById('chat-widget')) return;
    const div = document.createElement('div');
    div.id = 'chat-widget';
    div.innerHTML = `
      <div id="chat-panel">
        <div class="chat-panel-header">
          <button class="chat-back-btn" id="chat-back-btn" onclick="ChatWidget.backToConvos()">← Back</button>
          <h4 id="chat-panel-title">Messages</h4>
          <button class="chat-close-btn" onclick="ChatWidget.togglePanel()">✕</button>
        </div>
        <div id="chat-convos" style="flex:1;overflow-y:auto"><div class="chat-empty-convos">Loading...</div></div>
        <div id="chat-window">
          <div id="chat-messages"></div>
          <div class="chat-input-row">
            <input type="text" id="chat-input" placeholder="Type a message..." maxlength="1000"
              onkeydown="if(event.key==='Enter')ChatWidget.sendMsg()"/>
            <button class="chat-send-btn" onclick="ChatWidget.sendMsg()">➤</button>
          </div>
        </div>
      </div>
      <button id="chat-fab" onclick="ChatWidget.togglePanel()" title="Messages">
        💬
        <span id="chat-notif-badge"></span>
      </button>`;
    document.body.appendChild(div);
  },

  togglePanel() {
    const panel = document.getElementById('chat-panel');
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      this.unreadCount = 0;
      this._updateBadge();
      this.loadConversations();
    }
  },

  async loadConversations() {
    const convosEl = document.getElementById('chat-convos');
    if (!convosEl) return;
    const res = await API.get('/api/chat/conversations');
    const convos = res.conversations || [];
    if (!convos.length) {
      convosEl.innerHTML = `<div class="chat-empty-convos">No conversations yet.<br>Click "Message" on any profile to start.</div>`;
      return;
    }
    convosEl.innerHTML = convos.map(c => {
      const u = c.user;
      const lastText = c.lastMessage?.text || '';
      const t = c.lastMessage ? timeAgo(c.lastMessage.createdAt) : '';
      const initials = (u.name||'?').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
      const pic = u.profilePic
        ? `<div class="avatar avatar-sm"><img src="${u.profilePic}" alt=""></div>`
        : `<div class="avatar avatar-sm">${initials}</div>`;
      return `<div class="chat-convo-item" onclick="ChatWidget.openChatWith('${u._id}','${(u.name||'').replace(/'/g,"\\'")}')">
        ${pic}
        <div class="convo-info">
          <div class="convo-name">${u.name}</div>
          <div class="convo-last">${lastText.slice(0,40)}${lastText.length>40?'...':''}</div>
        </div>
        <div class="convo-time">${t}</div>
      </div>`;
    }).join('');
  },

  async openChatWith(userId, userName) {
    this.activeConvoUserId = userId;
    this.activeConvoUserName = userName;
    document.getElementById('chat-panel').classList.add('open');
    document.getElementById('chat-convos').style.display = 'none';
    const cw = document.getElementById('chat-window');
    cw.style.display = 'flex'; cw.style.flexDirection = 'column';
    document.getElementById('chat-panel-title').textContent = userName;
    document.getElementById('chat-back-btn').classList.add('show');

    const msgsEl = document.getElementById('chat-messages');
    msgsEl.innerHTML = '<div class="spinner" style="margin:20px auto;width:24px;height:24px;border-width:2px"></div>';

    const res = await API.get(`/api/chat/messages/${userId}`);
    const msgs = res.messages || [];
    msgsEl.innerHTML = '';
    if (!msgs.length) {
      msgsEl.innerHTML = `<div class="chat-no-msgs">No messages yet. Say hello! 👋</div>`;
    } else {
      msgs.forEach(m => {
        const isMine = (m.senderId?.$oid||m.senderId||'').toString() === this.currentUserId;
        this._appendMsg(m, isMine);
      });
    }
    msgsEl.scrollTop = msgsEl.scrollHeight;
  },

  backToConvos() {
    this.activeConvoUserId = null;
    this.activeConvoUserName = null;
    document.getElementById('chat-convos').style.display = 'block';
    document.getElementById('chat-window').style.display = 'none';
    document.getElementById('chat-panel-title').textContent = 'Messages';
    document.getElementById('chat-back-btn').classList.remove('show');
    this.loadConversations();
  },

  sendMsg() {
    const input = document.getElementById('chat-input');
    const text  = input?.value?.trim();
    if (!text || !this.activeConvoUserId) return;
    // Optimistic: append immediately for sender
    this._appendMsg({
      senderId: this.currentUserId,
      text,
      createdAt: new Date().toISOString()
    }, true);
    this.socket.emit('send_message', { receiverId: this.activeConvoUserId, text });
    input.value = '';
  },

  _appendMsg(msg, isMine) {
    const msgsEl = document.getElementById('chat-messages');
    if (!msgsEl) return;
    const placeholder = msgsEl.querySelector('.chat-no-msgs');
    if (placeholder) placeholder.remove();
    const time = msg.createdAt
      ? new Date(msg.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })
      : '';
    const div = document.createElement('div');
    div.className = 'chat-msg ' + (isMine ? 'mine' : 'theirs');
    div.innerHTML = escHtml(msg.text) + `<div class="chat-msg-time">${time}</div>`;
    msgsEl.appendChild(div);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  },

  _updateBadge() {
    const b   = document.getElementById('chat-notif-badge');
    const fab = document.getElementById('chat-fab');
    if (!b) return;
    if (this.unreadCount > 0) {
      b.textContent = this.unreadCount > 9 ? '9+' : this.unreadCount;
      b.classList.add('show');
      if (fab) fab.style.border = '3px solid #ef4444';
    } else {
      b.classList.remove('show');
      if (fab) fab.style.border = 'none';
    }
  }
};

function escHtml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
