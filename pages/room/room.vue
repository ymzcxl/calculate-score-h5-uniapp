<template>
  <view class="room-page app-shell">
    <view class="room-header glass-card">
      <view class="room-main">
        <view>
          <view class="room-title">{{ roomInfo.title || '实时牌局' }}</view>
          <view class="room-meta">房间号 {{ roomId }} · {{ roomInfo.status === 'active' ? '进行中' : '已结束' }}</view>
        </view>
        <view class="room-tags">
          <text class="badge">{{ players.length }} 人</text>
          <text class="badge">{{ isRoomCreator ? '房主' : '参与中' }}</text>
        </view>
      </view>

      <view class="share-box">
        <text class="share-label">邀请链接</text>
        <text class="share-link">{{ shareLink }}</text>
        <button class="secondary-button" @click="copyShareLink">复制链接</button>
      </view>

      <view class="room-actions">
        <button v-if="isRoomCreator && roomInfo.status === 'active'" class="secondary-button" @click="settleRoom">
          结束对局
        </button>
        <button v-if="roomInfo.status === 'active'" class="secondary-button" @click="revokeLastScore">
          撤回上一笔
        </button>
        <button class="secondary-button danger-button" @click="exitRoom">
          {{ isRoomCreator ? '关闭并退出' : '退出房间' }}
        </button>
      </view>
    </view>

    <view class="player-panel glass-card">
      <view class="panel-head">
        <view>
          <view class="section-title">实时总分</view>
          <view class="section-desc">点击其他玩家可作为记分目标，自己的卡片支持改房间昵称。</view>
        </view>
        <button class="secondary-button" @click="refreshRoom">刷新</button>
      </view>

      <view class="player-list">
        <view
          v-for="player in orderedPlayers"
          :key="player.userId"
          class="player-card"
          :class="{ active: selectedTargetId === player.userId }"
          @click="selectTarget(player.userId)"
        >
          <image class="player-avatar" :src="player.avatar || defaultAvatar"></image>
          <view class="player-text">
            <view class="player-name-row">
              <text class="player-name">{{ player.name }}</text>
              <text v-if="player.userId === currentUserId" class="badge badge-self">我</text>
            </view>
            <text class="player-score">{{ formatScore(player.score) }}</text>
          </view>
          <button
            v-if="player.userId === currentUserId"
            class="edit-name-button"
            @click.stop="openEditName(player)"
          >
            改名
          </button>
        </view>
      </view>
    </view>

    <view v-if="roomInfo.status === 'active'" class="score-panel glass-card">
      <view class="section-title">快捷记分</view>
      <view class="section-desc">
        当前操作者：{{ currentPlayerName }}，记给：{{ selectedTargetName || '请选择一位玩家' }}
      </view>

      <view class="shortcut-grid">
        <button v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">
          +{{ item }}
        </button>
      </view>

      <view class="custom-score">
        <input v-model="customScore" class="field flex-1" type="number" placeholder="输入自定义分数" />
        <button class="primary-button custom-submit" @click="submitCustomScore">记分</button>
      </view>
    </view>

    <view class="timeline-panel glass-card">
      <view class="panel-head">
        <view>
          <view class="section-title">记分流水</view>
          <view class="section-desc">所有实时记分都会记录下来，撤回也会保留痕迹。</view>
        </view>
      </view>

      <view v-if="scoreHistory.length" class="timeline-list">
        <view v-for="item in scoreHistory" :key="item.id" class="timeline-item">
          <view class="timeline-dot"></view>
          <view class="timeline-body">
            <view class="timeline-line">
              <text class="timeline-main">{{ getScoreText(item) }}</text>
              <text class="timeline-time">{{ formatTime(item.timestamp) }}</text>
            </view>
            <text class="timeline-sub">
              {{ item.isRevoked ? '该记录已撤回' : `结算后比分：${item.fromUserScoreAfter} / ${item.toUserScoreAfter}` }}
            </text>
          </view>
        </view>
      </view>
      <view v-else class="empty-card">还没有记分流水，先来记第一笔。</view>
    </view>

    <view class="chat-panel glass-card">
      <view class="panel-head">
        <view>
          <view class="section-title">房间消息</view>
          <view class="section-desc">网页端适合直接通过链接邀请，消息会留在房间里。</view>
        </view>
      </view>

      <view v-if="messages.length" class="message-list">
        <view v-for="msg in messages" :key="msg.id || msg.timestamp" class="message-item">
          <text class="message-author">{{ msg.userName || '系统' }}</text>
          <text class="message-text">{{ msg.content }}</text>
          <text class="message-time">{{ formatTime(msg.timestamp) }}</text>
        </view>
      </view>
      <view v-else class="empty-card">还没有消息记录。</view>

      <view v-if="roomInfo.status === 'active'" class="message-composer">
        <input v-model.trim="message" class="field flex-1" placeholder="说点什么，房间内所有人都能看到" />
        <button class="secondary-button composer-button" @click="sendMessage">发送</button>
      </view>
    </view>

    <view v-if="editNamePopup" class="modal-mask" @click="editNamePopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改房间昵称</view>
        <view class="section-desc">只影响当前房间显示，不会改你的账号昵称。</view>
        <input v-model.trim="editName" class="field field-spacing" placeholder="请输入新昵称" />
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

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=clean%20minimal%20card%20game%20avatar%20icon%2C%20dark%20navy%20background%2C%20soft%20cyan%20highlight%2C%20app%20friendly&image_size=square';
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
  return `${fromName} -> ${toName} ${item.score} 分`;
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

  if (!selectedTargetId.value) {
    const defaultTarget = room.players.find(item => item.userId !== currentUserId.value);
    selectedTargetId.value = defaultTarget?.userId || '';
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
  if (userId === currentUserId.value) {
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
    content: '结束后会生成最终排名并写入历史记录，确认继续吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }

      try {
        const data = await api.settleRoom({ roomId: roomId.value });
        roomInfo.value.status = 'closed';
        appendSystemMessage('本局已结束并生成结算');
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
    content: isRoomCreator.value ? '关闭后当前房间不可继续记分，确认关闭并退出吗？' : '确认退出当前房间吗？',
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
    appendSystemMessage('收到房间结算更新');
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
  gap: 22rpx;
}

.room-header,
.player-panel,
.score-panel,
.timeline-panel,
.chat-panel {
  padding: 28rpx;
}

.room-main,
.room-actions,
.panel-head,
.modal-actions,
.message-composer,
.custom-score {
  display: flex;
  gap: 14rpx;
  align-items: center;
  justify-content: space-between;
}

.room-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #f8fafc;
}

.room-meta {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.room-tags {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.share-box {
  margin-top: 22rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  background: rgba(15, 23, 42, 0.66);
  border: 1rpx solid rgba(148, 163, 184, 0.1);
}

.share-label {
  display: block;
  color: #94a3b8;
  font-size: 22rpx;
}

.share-link {
  display: block;
  margin: 10rpx 0 16rpx;
  color: #e2e8f0;
  font-size: 22rpx;
  line-height: 1.6;
  word-break: break-all;
}

.room-actions {
  margin-top: 22rpx;
  flex-wrap: wrap;
}

.player-list,
.timeline-list,
.message-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 22rpx;
  border-radius: 26rpx;
  background: rgba(15, 23, 42, 0.7);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.player-card.active {
  border-color: rgba(99, 102, 241, 0.7);
  box-shadow: 0 0 0 2rpx rgba(99, 102, 241, 0.2);
}

.player-avatar {
  width: 82rpx;
  height: 82rpx;
  border-radius: 24rpx;
}

.player-text {
  flex: 1;
}

.player-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}

.player-name {
  font-size: 30rpx;
  color: #f8fafc;
  font-weight: 700;
}

.badge-self {
  background: rgba(16, 185, 129, 0.18);
  color: #bbf7d0;
}

.player-score {
  display: block;
  margin-top: 10rpx;
  font-size: 42rpx;
  color: #c4b5fd;
  font-weight: 700;
}

.edit-name-button {
  padding: 18rpx 24rpx;
  border-radius: 22rpx;
  background: rgba(30, 41, 59, 0.9);
  color: #e2e8f0;
  font-size: 24rpx;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.shortcut-chip {
  min-height: 82rpx;
  border-radius: 24rpx;
  background: rgba(99, 102, 241, 0.14);
  border: 1rpx solid rgba(129, 140, 248, 0.24);
  color: #e0e7ff;
  font-size: 30rpx;
  font-weight: 700;
}

.custom-score {
  margin-top: 20rpx;
}

.custom-submit,
.composer-button {
  min-width: 180rpx;
}

.timeline-item {
  display: flex;
  gap: 18rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #818cf8;
  margin-top: 14rpx;
}

.timeline-body,
.message-item {
  flex: 1;
  padding: 20rpx 22rpx;
  border-radius: 22rpx;
  background: rgba(15, 23, 42, 0.68);
  border: 1rpx solid rgba(148, 163, 184, 0.1);
}

.timeline-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.timeline-main,
.message-text {
  color: #f8fafc;
  font-size: 26rpx;
  line-height: 1.6;
}

.message-author {
  display: block;
  color: #c7d2fe;
  font-size: 22rpx;
  margin-bottom: 8rpx;
}

.timeline-time,
.message-time,
.timeline-sub {
  color: #94a3b8;
  font-size: 22rpx;
}

.timeline-sub {
  display: block;
  margin-top: 8rpx;
}

.message-time {
  display: block;
  margin-top: 10rpx;
}

.message-composer {
  margin-top: 20rpx;
}

.empty-card {
  margin-top: 22rpx;
  padding: 26rpx;
  border-radius: 26rpx;
  background: rgba(15, 23, 42, 0.5);
  color: #94a3b8;
  font-size: 24rpx;
  text-align: center;
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 24rpx;
  background: rgba(2, 6, 23, 0.58);
}

.modal-panel {
  width: 100%;
  padding: 30rpx;
  border-radius: 36rpx;
}

.field-spacing {
  margin: 24rpx 0;
}

.flex-1 {
  flex: 1;
}
</style>
