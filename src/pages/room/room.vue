<template>
  <view class="room-page app-shell">
    <view class="hero-card glass-card">
      <view class="hero-head">
        <view class="hero-copy">
          <view class="panel-label">Live Table</view>
          <view class="room-title">{{ roomInfo.title || '实时牌局' }}</view>
          <view class="room-meta">房间 {{ roomId }}</view>
        </view>
        <text class="status-pill" :class="roomInfo.status">{{ roomStatusText }}</text>
      </view>

      <view class="hero-stats">
        <view class="hero-stat">
          <text class="hero-stat-label">玩家</text>
          <text class="hero-stat-value">{{ players.length }}</text>
        </view>
        <view class="hero-stat">
          <text class="hero-stat-label">领先</text>
          <text class="hero-stat-value leader">{{ leaderPlayer?.name || '--' }}</text>
        </view>
        <view class="hero-stat">
          <text class="hero-stat-label">身份</text>
          <text class="hero-stat-value">{{ roomRoleText }}</text>
        </view>
      </view>

      <view class="target-card" :class="{ ready: !!selectedTargetId, closed: roomInfo.status !== 'active' }">
        <view class="target-head">
          <view>
            <text class="target-label">当前目标</text>
            <text class="target-value">{{ selectedTargetName || (roomInfo.status === 'active' ? '请选择玩家' : '本局已结束') }}</text>
          </view>
          <text class="target-badge">{{ currentPlayerName }} 操作</text>
        </view>
        <text class="target-copy">{{ targetHintText }}</text>
      </view>

      <view class="share-card">
        <view class="share-copy">
          <text class="share-label">邀请链接</text>
          <text class="share-link">{{ shareLink }}</text>
        </view>
        <view class="share-actions">
          <button class="secondary-button compact-button" @click="copyShareLink">复制</button>
          <button class="secondary-button compact-button" @click="refreshRoom">刷新</button>
        </view>
      </view>

      <view class="hero-actions">
        <button v-if="isRoomCreator && roomInfo.status === 'active'" class="secondary-button flex-1" @click="settleRoom">结束对局</button>
        <button v-if="roomInfo.status === 'active'" class="secondary-button flex-1" @click="revokeLastScore">撤回上一笔</button>
        <button class="secondary-button danger-button flex-1" @click="exitRoom">{{ isRoomCreator ? '关闭并退出' : '退出房间' }}</button>
      </view>
    </view>

    <view v-if="roomInfo.status === 'active'" class="scoring-card glass-card">
      <view class="panel-head">
        <view>
          <view class="panel-label">Score Pad</view>
          <view class="section-title">快速记分</view>
        </view>
        <text class="panel-note">{{ selectedTargetName || '未选目标' }}</text>
      </view>

      <view class="shortcut-grid">
        <button v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">+{{ item }}</button>
      </view>

      <view class="custom-row">
        <input v-model="customScore" class="field flex-1" type="number" placeholder="输入分值" />
        <button class="primary-button submit-score" @click="submitCustomScore">记分</button>
      </view>

      <text class="score-tip">先选目标，再点分值。</text>
    </view>

    <view class="table-card glass-card">
      <view class="panel-head">
        <view>
          <view class="panel-label">Scoreboard</view>
          <view class="section-title">当前排名</view>
        </view>
        <text class="panel-note">{{ roomInfo.status === 'active' ? '点击玩家切换目标' : '已停止记分' }}</text>
      </view>

      <view class="player-list">
        <view
          v-for="(player, index) in orderedPlayers"
          :key="player.userId"
          class="player-card"
          :class="{
            active: selectedTargetId === player.userId,
            self: player.userId === currentUserId,
            leader: index === 0
          }"
          @click="selectTarget(player.userId)"
        >
          <view class="player-side">
            <text class="player-rank">#{{ index + 1 }}</text>
            <image class="player-avatar" :src="player.avatar || defaultAvatar"></image>
          </view>
          <view class="player-main">
            <view class="player-head">
              <view class="player-name-row">
                <text class="player-name">{{ player.name }}</text>
                <text v-if="player.userId === currentUserId" class="player-self-tag">我</text>
              </view>
              <text class="player-score">{{ formatScore(player.score) }}</text>
            </view>
            <view class="player-foot">
              <view class="player-tags">
                <text v-if="index === 0" class="mini-tag leader-tag">领先</text>
                <text v-if="selectedTargetId === player.userId" class="mini-tag target-tag">目标</text>
                <text v-if="player.userId === currentUserId" class="mini-tag self-tag">自己</text>
              </view>
              <button v-if="player.userId === currentUserId" class="edit-name-button" @click.stop="openEditName(player)">改昵称</button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view class="timeline-card glass-card">
      <view class="panel-head">
        <view>
          <view class="panel-label">Score Feed</view>
          <view class="section-title">记分流水</view>
        </view>
        <text class="panel-note">{{ scoreLogCount }} 笔</text>
      </view>

      <view v-if="scoreHistory.length" class="timeline-list">
        <view v-for="item in scoreHistory" :key="item.id" class="timeline-item" :class="{ revoked: item.isRevoked }">
          <view class="timeline-body">
            <view class="timeline-line">
              <text class="timeline-main">{{ getScoreText(item) }}</text>
              <text class="timeline-time">{{ formatTime(item.timestamp) }}</text>
            </view>
            <text class="timeline-sub">{{ getScoreDetailText(item) }}</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-card subdued-empty">还没有流水</view>
    </view>

    <view class="chat-card glass-card">
      <view class="panel-head">
        <view>
          <view class="panel-label">Room Notes</view>
          <view class="section-title">房间消息</view>
        </view>
        <text class="panel-note">{{ messageCount }} 条</text>
      </view>

      <view v-if="messages.length" class="message-list">
        <view
          v-for="msg in messages"
          :key="msg.id || msg.timestamp"
          class="message-item"
          :class="{ system: !msg.userName || msg.userName === '系统' }"
        >
          <view class="message-head">
            <text class="message-author">{{ msg.userName || '系统' }}</text>
            <text class="message-time">{{ formatTime(msg.timestamp) }}</text>
          </view>
          <text class="message-text">{{ msg.content }}</text>
        </view>
      </view>
      <view v-else class="empty-card subdued-empty">还没有消息</view>

      <view v-if="roomInfo.status === 'active'" class="composer-row">
        <input v-model.trim="message" class="field flex-1" placeholder="发条消息" />
        <button class="secondary-button composer-button" @click="sendMessage">发送</button>
      </view>
    </view>

    <view v-if="editNamePopup" class="modal-mask" @click="editNamePopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改房间昵称</view>
        <view class="modal-note">只改当前房间。</view>
        <input v-model.trim="editName" class="field modal-field" placeholder="输入房间昵称" />
        <view class="modal-actions">
          <button class="secondary-button flex-1" @click="editNamePopup = false">取消</button>
          <button class="primary-button flex-1" @click="savePlayerName">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import io from 'socket.io-client';
import { currentConfig } from '../../config/env';
import { api } from '../../utils/api';
import { getRoomPageUrl, getRoomShareLink, redirectToLogin } from '../../utils/auth';

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=refined%20card%20table%20avatar%20icon%2C%20dark%20premium%20mobile%20ui%20style%2C%20golden%20accent%2C%20clean%20shape&image_size=square';
const shortcuts = [1, 2, 5, 10, 20, 50];

const roomId = ref('');
const roomInfo = ref({
  title: '',
  status: 'active'
});
const players = ref([]);
const scoreHistory = ref([]);
const messages = ref([]);
const message = ref('');
const customScore = ref('');
const selectedTargetId = ref('');
const socket = ref(null);
const isRoomCreator = ref(false);
const editNamePopup = ref(false);
const editName = ref('');

const currentUserId = computed(() => {
  const user = uni.getStorageSync('userInfo') || {};
  return user.uid || '';
});

const shareLink = computed(() => getRoomShareLink(roomId.value));
const currentPlayer = computed(() => players.value.find(item => item.userId === currentUserId.value));
const currentPlayerName = computed(() => currentPlayer.value?.name || '我');
const orderedPlayers = computed(() => [...players.value].sort((a, b) => b.score - a.score));
const selectedTargetName = computed(() => players.value.find(item => item.userId === selectedTargetId.value)?.name || '');
const roomStatusText = computed(() => (roomInfo.value.status === 'active' ? '进行中' : '已结算'));
const roomRoleText = computed(() => (isRoomCreator.value ? '房主' : '玩家'));
const leaderPlayer = computed(() => orderedPlayers.value[0] || null);
const scoreLogCount = computed(() => scoreHistory.value.filter(item => !item.isRevoked).length);
const messageCount = computed(() => messages.value.length);
const targetHintText = computed(() => {
  if (roomInfo.value.status !== 'active') {
    return '记分已停止，可继续看流水。';
  }
  if (selectedTargetName.value) {
    return `下一笔会记到 ${selectedTargetName.value}。`;
  }
  return '先选玩家，再记分。';
});

const resolveRoomIdFromUrl = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const routeRoomId = currentPage?.options?.roomId;
  if (routeRoomId) {
    isRoomCreator.value = currentPage.options.isCreator === '1';
    return routeRoomId;
  }

  if (typeof window !== 'undefined' && window.location?.hash) {
    const match = window.location.hash.match(/roomId=([A-Za-z0-9]+)/i);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }

  return '';
};

const requireAuth = () => {
  if (!uni.getStorageSync('token')) {
    redirectToLogin(getRoomPageUrl(roomId.value || resolveRoomIdFromUrl()));
    return false;
  }
  return true;
};

const formatScore = (value) => (value > 0 ? `+${value}` : `${value}`);
const formatTime = (value) => new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

const getScoreText = (item) => {
  const fromName = players.value.find(player => player.userId === item.fromUserId)?.name || '玩家';
  const toName = players.value.find(player => player.userId === item.toUserId)?.name || '玩家';
  return `${fromName} 记给 ${toName} ${formatScore(item.score)}`;
};

const getScoreDetailText = (item) => {
  if (item.isRevoked) {
    return '已撤回';
  }
  return `比分 ${formatScore(item.fromUserScoreAfter)} / ${formatScore(item.toUserScoreAfter)}`;
};

const appendSystemMessage = (content) => {
  messages.value.unshift({
    id: `local_${Date.now()}`,
    userName: '系统',
    content,
    timestamp: new Date().toISOString()
  });
};

const copyShareLink = () => {
  uni.setClipboardData({
    data: shareLink.value,
    success: () => {
      uni.showToast({ title: '链接已复制', icon: 'success' });
    }
  });
};

const syncRoom = async () => {
  const [room, history, messageHistory] = await Promise.all([
    api.getRoomInfo(roomId.value),
    api.getScoreHistory(roomId.value),
    api.getMessageHistory(roomId.value)
  ]);

  roomInfo.value = room;
  players.value = room.players || [];
  scoreHistory.value = history;
  messages.value = messageHistory.map(item => ({
    id: item.messageId,
    userName: item.userName,
    content: item.content,
    timestamp: item.timestamp
  }));

  const hasTarget = players.value.some(item => item.userId === selectedTargetId.value && item.userId !== currentUserId.value);
  if (!hasTarget || roomInfo.value.status !== 'active') {
    const defaultTarget = players.value.find(item => item.userId !== currentUserId.value);
    selectedTargetId.value = roomInfo.value.status === 'active' ? (defaultTarget?.userId || '') : '';
  }
};

const refreshRoom = async () => {
  if (!requireAuth()) {
    return;
  }

  try {
    await syncRoom();
  } catch (error) {
    uni.showToast({ title: error.message || '刷新失败', icon: 'none' });
  }
};

const selectTarget = (userId) => {
  if (roomInfo.value.status !== 'active' || userId === currentUserId.value) {
    return;
  }
  selectedTargetId.value = userId;
};

const updateScore = async (score) => {
  if (!selectedTargetId.value) {
    uni.showToast({ title: '请选择一位玩家', icon: 'none' });
    return;
  }

  try {
    await api.updateScore({
      roomId: roomId.value,
      fromUserId: currentUserId.value,
      toUserId: selectedTargetId.value,
      score
    });
    await syncRoom();
    socket.value?.emit('score-updated', { roomId: roomId.value });
  } catch (error) {
    uni.showToast({ title: error.message || '记分失败', icon: 'none' });
  }
};

const submitCustomScore = () => {
  const score = Number(customScore.value);
  if (!score || score <= 0) {
    uni.showToast({ title: '请输入正整数分值', icon: 'none' });
    return;
  }
  customScore.value = '';
  updateScore(score);
};

const revokeLastScore = async () => {
  try {
    await api.revokeScore({ roomId: roomId.value });
    await syncRoom();
    socket.value?.emit('score-updated', { roomId: roomId.value });
    appendSystemMessage('已撤回上一笔记分');
  } catch (error) {
    uni.showToast({ title: error.message || '撤回失败', icon: 'none' });
  }
};

const settleRoom = async () => {
  uni.showModal({
    title: '结束对局',
    content: '结束后会写入历史，确认结束吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }

      try {
        const data = await api.settleRoom({ roomId: roomId.value });
        roomInfo.value.status = 'closed';
        appendSystemMessage('本局已结算');
        socket.value?.emit('room-settled', { roomId: roomId.value, rankings: data.rankings });
        uni.showToast({ title: '已结算', icon: 'success' });
        await syncRoom();
      } catch (error) {
        uni.showToast({ title: error.message || '结算失败', icon: 'none' });
      }
    }
  });
};

const exitRoom = () => {
  uni.showModal({
    title: isRoomCreator.value ? '关闭房间' : '退出房间',
    content: isRoomCreator.value ? '关闭后不能继续记分，确认退出吗？' : '确认退出该房间吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }

      try {
        if (isRoomCreator.value) {
          await api.closeRoom({ roomId: roomId.value });
        } else {
          await api.exitRoom({ roomId: roomId.value });
        }
        socket.value?.emit('leave-room', roomId.value);
        uni.reLaunch({ url: '/pages/index/index' });
      } catch (error) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' });
      }
    }
  });
};

const sendMessage = async () => {
  if (!message.value) {
    return;
  }

  try {
    const content = message.value;
    await api.sendMessage({
      roomId: roomId.value,
      content,
      type: 'user'
    });
    message.value = '';
    await syncRoom();
    socket.value?.emit('new-message', { roomId: roomId.value });
  } catch (error) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
  }
};

const openEditName = (player) => {
  editName.value = player.name;
  editNamePopup.value = true;
};

const savePlayerName = async () => {
  if (!editName.value || editName.value.length < 2) {
    uni.showToast({ title: '昵称至少 2 位', icon: 'none' });
    return;
  }

  try {
    await api.updatePlayerName({
      roomId: roomId.value,
      name: editName.value
    });
    editNamePopup.value = false;
    await syncRoom();
    socket.value?.emit('player-joined', { roomId: roomId.value });
  } catch (error) {
    uni.showToast({ title: error.message || '更新失败', icon: 'none' });
  }
};

const initSocket = () => {
  socket.value = io(currentConfig.SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true
  });

  socket.value.on('connect', () => {
    socket.value.emit('join-room', roomId.value);
  });

  socket.value.on('player-joined', refreshRoom);
  socket.value.on('player-left', refreshRoom);
  socket.value.on('score-updated', refreshRoom);
  socket.value.on('new-message', refreshRoom);
  socket.value.on('room-settled', async () => {
    appendSystemMessage('收到结算更新');
    await refreshRoom();
  });
};

onMounted(async () => {
  roomId.value = resolveRoomIdFromUrl();
  if (!roomId.value) {
    uni.showToast({ title: '房间号缺失', icon: 'none' });
    uni.reLaunch({ url: '/pages/index/index' });
    return;
  }

  if (!requireAuth()) {
    return;
  }

  try {
    if (!isRoomCreator.value) {
      await api.joinRoom({ roomId: roomId.value });
    }
    await syncRoom();
    initSocket();
  } catch (error) {
    uni.showToast({ title: error.message || '进入房间失败', icon: 'none' });
  }
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.emit('leave-room', roomId.value);
    socket.value.disconnect();
  }
});
</script>

<style scoped lang="scss">
.room-page {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.hero-card,
.table-card,
.scoring-card,
.timeline-card,
.chat-card,
.modal-panel {
  padding: 30rpx;
}

.hero-head,
.panel-head,
.hero-actions,
.modal-actions,
.share-actions,
.custom-row,
.composer-row,
.target-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.hero-head,
.panel-head {
  align-items: flex-start;
}

.hero-copy {
  flex: 1;
}

.room-title {
  margin-top: 10rpx;
  color: var(--text-primary);
  font-size: 46rpx;
  line-height: 1.16;
  font-weight: 700;
}

.room-meta {
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 24rpx;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 110rpx;
  min-height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--success-surface);
  color: var(--success);
  font-size: 22rpx;
  font-weight: 700;
}

.status-pill.closed {
  background: var(--surface-4);
  color: var(--text-secondary);
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 24rpx;
}

.hero-stat {
  padding: 20rpx;
  border-radius: 24rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
}

.hero-stat-label {
  display: block;
  color: var(--text-muted);
  font-size: 20rpx;
}

.hero-stat-value {
  display: block;
  margin-top: 12rpx;
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 700;
}

.hero-stat-value.leader {
  font-size: 28rpx;
}

.target-card {
  margin-top: 22rpx;
  padding: 24rpx;
  border-radius: 30rpx;
  background: linear-gradient(180deg, rgba(210, 164, 92, 0.18), rgba(210, 164, 92, 0.04));
  border: 1rpx solid rgba(210, 164, 92, 0.22);
}

.target-card.closed {
  background: var(--surface-3);
  border-color: var(--border-soft);
}

.target-label {
  display: block;
  color: var(--text-muted);
  font-size: 21rpx;
}

.target-value {
  display: block;
  margin-top: 10rpx;
  color: var(--text-primary);
  font-size: 40rpx;
  font-weight: 700;
}

.target-badge {
  display: inline-flex;
  align-items: center;
  min-height: 48rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-secondary);
  font-size: 20rpx;
}

.target-copy {
  display: block;
  margin-top: 12rpx;
  color: var(--text-secondary);
  font-size: 23rpx;
}

.share-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 20rpx;
  padding: 20rpx 22rpx;
  border-radius: 26rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
}

.share-copy {
  flex: 1;
  min-width: 0;
}

.share-label {
  display: block;
  color: var(--text-muted);
  font-size: 21rpx;
}

.share-link {
  display: block;
  margin-top: 8rpx;
  color: var(--text-primary);
  font-size: 22rpx;
  line-height: 1.5;
  word-break: break-all;
}

.share-actions {
  flex-shrink: 0;
}

.compact-button {
  min-height: 68rpx;
  padding: 0 22rpx;
  border-radius: 18rpx;
  font-size: 22rpx;
}

.hero-actions {
  margin-top: 18rpx;
  flex-wrap: wrap;
}

.panel-note {
  color: var(--text-muted);
  font-size: 22rpx;
  white-space: nowrap;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 22rpx;
}

.shortcut-chip {
  min-height: 92rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, rgba(210, 164, 92, 0.22), rgba(210, 164, 92, 0.08));
  border: 1rpx solid rgba(210, 164, 92, 0.2);
  color: var(--accent-soft);
  font-size: 31rpx;
  font-weight: 700;
}

.custom-row {
  margin-top: 18rpx;
}

.submit-score,
.composer-button {
  min-width: 180rpx;
}

.score-tip {
  display: block;
  margin-top: 14rpx;
  color: var(--text-muted);
  font-size: 22rpx;
}

.player-list,
.timeline-list,
.message-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 22rpx;
}

.player-card {
  display: flex;
  gap: 16rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
}

.player-card.active {
  border-color: rgba(210, 164, 92, 0.3);
  box-shadow: inset 0 0 0 1rpx rgba(210, 164, 92, 0.22);
}

.player-card.self {
  background: linear-gradient(180deg, rgba(91, 155, 132, 0.12), var(--surface-3));
}

.player-card.leader:not(.active) {
  border-color: rgba(210, 164, 92, 0.14);
}

.player-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.player-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 56rpx;
  height: 48rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: var(--surface-4);
  color: var(--text-secondary);
  font-size: 20rpx;
  font-weight: 700;
}

.player-avatar {
  width: 82rpx;
  height: 82rpx;
  border-radius: 24rpx;
  border: 1rpx solid var(--border-soft);
}

.player-main {
  flex: 1;
}

.player-head,
.player-foot,
.message-head,
.timeline-line {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
}

.player-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.player-name {
  color: var(--text-primary);
  font-size: 29rpx;
  font-weight: 700;
}

.player-self-tag {
  display: inline-flex;
  align-items: center;
  min-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: var(--success-surface);
  color: var(--success);
  font-size: 18rpx;
  font-weight: 700;
}

.player-score {
  color: var(--accent-strong);
  font-size: 40rpx;
  font-weight: 700;
}

.player-foot {
  margin-top: 14rpx;
  align-items: center;
}

.player-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.mini-tag {
  display: inline-flex;
  align-items: center;
  min-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: var(--surface-4);
  color: var(--text-secondary);
  font-size: 18rpx;
  font-weight: 700;
}

.leader-tag {
  color: var(--accent-soft);
}

.target-tag {
  background: rgba(210, 164, 92, 0.16);
  color: var(--accent-soft);
}

.self-tag {
  background: var(--success-surface);
  color: var(--success);
}

.edit-name-button {
  min-height: 60rpx;
  padding: 0 18rpx;
  border-radius: 18rpx;
  background: var(--surface-4);
  color: var(--text-primary);
  font-size: 22rpx;
  white-space: nowrap;
}

.timeline-item {
  position: relative;
  padding-left: 18rpx;
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12rpx;
  bottom: 12rpx;
  width: 4rpx;
  border-radius: 999rpx;
  background: rgba(210, 164, 92, 0.36);
}

.timeline-item.revoked::before {
  background: rgba(255, 255, 255, 0.14);
}

.timeline-body,
.message-item {
  flex: 1;
  padding: 18rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.timeline-main,
.message-text {
  color: var(--text-primary);
  font-size: 24rpx;
  line-height: 1.56;
}

.timeline-time,
.timeline-sub,
.message-time {
  color: var(--text-muted);
  font-size: 21rpx;
}

.timeline-sub {
  display: block;
  margin-top: 8rpx;
}

.message-item.system {
  background: rgba(255, 255, 255, 0.02);
}

.message-head {
  align-items: center;
}

.message-author {
  color: var(--text-secondary);
  font-size: 22rpx;
  font-weight: 700;
}

.message-item.system .message-author {
  color: var(--accent-soft);
}

.message-text {
  display: block;
  margin-top: 8rpx;
}

.composer-row {
  margin-top: 18rpx;
}

.subdued-empty {
  padding: 32rpx 24rpx;
  text-align: center;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24rpx;
  color: var(--text-muted);
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 24rpx;
  background: rgba(7, 10, 15, 0.62);
}

.modal-panel {
  width: 100%;
  border-radius: 34rpx;
}

.modal-note {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 23rpx;
}

.modal-field {
  margin: 24rpx 0 22rpx;
}

.flex-1 {
  flex: 1;
}
</style>
