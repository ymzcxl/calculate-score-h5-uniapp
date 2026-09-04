<template>
  <view class="room-page app-shell">
    
    <!-- 顶部消息通知 (Toast) -->
    <view class="top-toast" :class="{ 'show': !!topToastMessage }">
      {{ topToastMessage }}
    </view>

    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="nav-btn" @click="goBack">← 返回</view>
      <view class="nav-title">
        <text class="title-text">{{ roomInfo.title || '实时牌局' }}</text>
      </view>
      <view class="nav-right">
        <view class="nav-btn icon-btn" @click="moreActionsPopup = true">⚙️</view>
        <view class="nav-btn" @click="goHome">首页</view>
      </view>
    </view>

    <!-- 玩家列表 (横向滚动，用于选择目标) -->
    <view class="player-list-section">
      <scroll-view class="player-scroll" scroll-x show-scrollbar="false">
        <view class="player-strip">
          <view
            v-for="player in players"
            :key="player.userId"
            class="player-pill"
            :class="{ active: selectedTargetId === player.userId }"
            @click="selectTarget(player.userId)"
          >
            <view class="p-avatar-box">
              <image class="p-avatar" :src="player.avatar || defaultAvatar"></image>
              <text v-if="player.userId === currentUserId" class="p-self-tag">我</text>
            </view>
            <text class="p-name">{{ player.name }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 实时排行 (紧凑) -->
    <view class="macaron-card ranking-card">
      <view class="card-title">🏆 实时排行</view>
      <view class="ranking-list">
        <view
          v-for="(player, index) in orderedPlayers"
          :key="player.userId"
          class="ranking-item"
        >
          <view class="r-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
          <image class="r-avatar" :src="player.avatar || defaultAvatar"></image>
          <view class="r-info">
            <view class="r-name">{{ player.name }}</view>
            <view class="r-desc">{{ getPlayerStatusText(player, index) }}</view>
          </view>
          <view class="r-score-wrap">
            <view class="r-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
              {{ formatScore(player.score) }}
            </view>
            <button v-if="player.userId !== currentUserId" class="takeover-btn" @click.stop="handleTakeover(player)">接管</button>
          </view>
        </view>
      </view>
    </view>

    <!-- 记分流水 (中间滚动区) -->
    <scroll-view class="flow-scroll" scroll-y>
      <view class="macaron-card flow-card">
        <view class="card-title">📝 记分流水</view>
        <view class="log-list" v-if="scoreHistory.length">
          <view v-for="item in scoreHistory" :key="item.id" class="log-item" :class="{ revoked: item.isRevoked }">
            <view class="log-main">
              <text class="log-text">{{ getScoreText(item) }}</text>
              <text class="log-time">{{ formatTime(item.timestamp) }}</text>
            </view>
            <text class="log-sub">{{ getScoreDetailText(item) }}</text>
          </view>
        </view>
        <view v-else class="empty-hint">还没有记分记录哦</view>
      </view>
      <!-- 底部占位，避免被底部输入框遮挡 -->
      <view class="bottom-spacer"></view>
    </scroll-view>

    <!-- 底部交互与记分栏 -->
    <view class="bottom-wrapper">
      <!-- 次底部：快捷互动 (全员可见) -->
      <view class="sub-bottom-interactions">
        <view class="interaction-list">
          <view v-for="item in interactionTools" :key="item.emoji" class="interaction-btn" @click="sendInteraction(item)">
            <text class="i-emoji">{{ item.emoji }}</text>
          </view>
        </view>
      </view>

      <!-- 底部Dock：聊天与记分行 -->
      <view class="bottom-dock">
        <view class="chat-row">
          <input v-model.trim="message" class="macaron-input chat-input" placeholder="发个消息..." @confirm="sendMessage()" confirm-type="send" />
          <button class="macaron-btn chat-send-btn" @click="sendMessage()">发送</button>
          <button class="macaron-btn pink score-open-btn" @click="openScoreModal">计分</button>
        </view>
      </view>
    </view>

    <!-- 弹窗：记分面板 -->
    <view v-if="scoreModalVisible" class="modal-mask" @click="scoreModalVisible = false">
      <view class="macaron-card modal-panel score-modal" @click.stop>
        <view class="modal-title">✍️ 计分</view>
        <view class="modal-desc">
          当前选中: <text class="highlight">{{ selectedTargetName || '请先在玩家列表选择' }}</text>
        </view>

        <view class="shortcut-grid">
          <view v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">
            +{{ item }}
          </view>
        </view>

        <view class="custom-row">
          <input v-model="customScore" class="macaron-input" type="number" placeholder="自定义分" />
          <button class="macaron-btn custom-btn" @click="submitCustomScore">记 分</button>
        </view>

        <button class="macaron-btn ghost close-score-btn" @click="scoreModalVisible = false">关 闭</button>
      </view>
    </view>

    <!-- 弹窗：更多功能 (设置) -->
    <view v-if="moreActionsPopup" class="modal-mask" @click="moreActionsPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">更多功能</view>
        <view class="settings-list">
          <view class="setting-item" @click="copyShareLink">
            <text class="st-title">🔗 复制邀请链接</text>
          </view>
          <view class="setting-item" @click="refreshRoom">
            <text class="st-title">🔄 刷新房间状态</text>
          </view>
          <view v-if="roomInfo.status === 'active'" class="setting-item" @click="revokeLastScore">
            <text class="st-title">↩️ 撤回上一笔记分</text>
          </view>
          <view class="setting-item" @click="openEditName">
            <text class="st-title">👤 修改房间昵称</text>
          </view>
          <view v-if="isRoomCreator && roomInfo.status === 'active'" class="setting-item danger" @click="settleRoom">
            <text class="st-title">🛑 结束对局</text>
          </view>
          <view class="setting-item danger" @click="exitRoom">
            <text class="st-title">🚪 {{ isRoomCreator ? '关闭并退出' : '退出房间' }}</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="moreActionsPopup = false">关 闭</button>
        </view>
      </view>
    </view>

    <!-- 弹窗：修改房间昵称 -->
    <view v-if="editNamePopup" class="modal-mask" @click="editNamePopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">修改房间昵称</view>
        <input v-model.trim="editName" class="macaron-input" placeholder="输入房间昵称" />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="editNamePopup = false">取消</button>
          <button class="macaron-btn" @click="savePlayerName">保 存</button>
        </view>
      </view>
    </view>

    <!-- 弹窗：确认操作 -->
    <view v-if="confirmPopup.visible" class="modal-mask" @click="closeConfirm">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">{{ confirmPopup.title || '提示' }}</view>
        <view class="modal-desc" style="font-size: 30rpx; margin-bottom: 40rpx; color: #4a4a4a;">
          {{ confirmPopup.content }}
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="closeConfirm">取消</button>
          <button class="macaron-btn" :class="{ pink: confirmPopup.isDanger }" @click="handleConfirm">确 定</button>
        </view>
      </view>
    </view>

    <!-- 斗地主风格结算弹窗 -->
    <view v-if="settlementData" class="settlement-mask">
      <view class="settlement-modal" :class="{'win-bg': settlementData.isWin}">
        <view class="s-title-img">{{ settlementData.title }}</view>
        <view class="s-mvp" v-if="settlementData.mvp">
          <text class="crown">👑</text>
          <text class="mvp-name">MVP: {{ settlementData.mvp.name }}</text>
          <text class="mvp-score">{{ formatScore(settlementData.mvp.score) }}</text>
        </view>
        <scroll-view class="s-list" scroll-y>
          <view class="s-item" v-for="(p, index) in settlementData.players" :key="p.userId">
            <view class="s-rank">{{ index + 1 }}</view>
            <image class="s-avatar" :src="p.avatar || defaultAvatar" mode="aspectFill" />
            <text class="s-name">{{ p.name }} <text v-if="p.userId === currentUserId">(我)</text></text>
            <text class="s-score" :class="{ positive: p.score > 0, negative: p.score < 0 }">{{ formatScore(p.score) }}</text>
          </view>
        </scroll-view>
        <button class="macaron-btn s-btn" @click="closeSettlement">回到大厅</button>
      </view>
    </view>
    
    <!-- 巨型全屏动画层 -->
    <view v-if="giantAnimation" class="giant-animation">
      {{ giantAnimation }}
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, getCurrentInstance } from 'vue';
import io from 'socket.io-client';
import { currentConfig } from '../../config/env';
import { api } from '../../utils/api';
import {
  getRoomPageUrl,
  getRoomShareLink,
  navigateBackOrPage,
  reLaunchPage,
  redirectToLogin
} from '../../utils/auth';

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20pastel%20macaron%20avatar%20icon%20for%20card%20game%20app%2C%20kawaii%20style%2C%20flat%20design%2C%20clean&image_size=square';
const shortcuts = [1, 2, 5, 10, 20, 50];
const quickMessages = ['漂亮一手', '稳住节奏', '继续冲', '准备收官'];
const interactionTools = [
  { emoji: '💣', name: '炸弹' },
  { emoji: '🌹', name: '鲜花' },
  { emoji: '🍺', name: '啤酒' },
  { emoji: '💩', name: '泼水' }
];

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
const moreActionsPopup = ref(false);
const scoreModalVisible = ref(false);
const topToastMessage = ref('');
const giantAnimation = ref('');
let topToastTimer = null;
const editName = ref('');
const settlementData = ref(null);

const confirmPopup = ref({
  visible: false,
  title: '',
  content: '',
  isDanger: false,
  onConfirm: null
});

const showConfirm = (title, content, onConfirm, isDanger = false) => {
  confirmPopup.value = {
    visible: true,
    title,
    content,
    isDanger,
    onConfirm
  };
};

const closeConfirm = () => {
  confirmPopup.value.visible = false;
};

const handleConfirm = () => {
  if (confirmPopup.value.onConfirm) {
    confirmPopup.value.onConfirm();
  }
  closeConfirm();
};

// 互动与动画状态


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

const resolveRoomIdFromUrl = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const routeRoomId = currentPage?.options?.roomId;
  if (routeRoomId) {
    isRoomCreator.value = currentPage.options.isCreator === '1';
    return routeRoomId;
  }
  if (typeof window !== 'undefined' && window.location?.hash) {
    const hash = window.location.hash.replace(/^#/, '');
    const queryString = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryString);
    const hashRoomId = params.get('roomId');
    isRoomCreator.value = params.get('isCreator') === '1';
    if (hashRoomId) return hashRoomId.toUpperCase();
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
  return `${fromName} 给 ${toName} 记了 ${formatScore(item.score)}`;
};

const getScoreDetailText = (item) => {
  if (item.isRevoked) return '这笔记分已撤回';
  return `目前比分: ${formatScore(item.fromUserScoreAfter)} / ${formatScore(item.toUserScoreAfter)}`;
};

const getPlayerStatusText = (player, index) => {
  if (player.userId === currentUserId.value) {
    return index === 0 ? '你目前领先，继续稳住！' : '加油冲冲冲！';
  }
  if (selectedTargetId.value === player.userId) return '已选中，分数或道具将给他。';
  if (index === 0) return '当前领先中，注意分差。';
  return '点击切换成目标。';
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
    success: () => uni.showToast({ title: '链接已复制', icon: 'success' })
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
  if (!requireAuth()) return;
  try {
    await syncRoom();
  } catch (error) {
    uni.showToast({ title: error.message || '刷新失败', icon: 'none' });
  }
};

const selectTarget = (userId) => {
  if (roomInfo.value.status !== 'active' || userId === currentUserId.value) return;
  selectedTargetId.value = userId;
};

const handleTakeover = (player) => {
  showConfirm('接管玩家', `确认要接管【${player.name}】的位置和分数吗？操作后该玩家将被移出，分数归你。`, async () => {
    try {
      await api.takeoverSeat({ roomId: roomId.value, targetUserId: player.userId });
      uni.showToast({ title: '接管成功', icon: 'success' });
      syncRoom();
    } catch (err) {
      uni.showToast({ title: err.message || '接管失败', icon: 'none' });
    }
  }, true);
};

const updateScore = async (score) => {
  if (!selectedTargetId.value) return uni.showToast({ title: '请先选择一位玩家哦', icon: 'none' });
  try {
    await api.updateScore({
      roomId: roomId.value,
      fromUserId: currentUserId.value,
      toUserId: selectedTargetId.value,
      score
    });
    await syncRoom();
    socket.value?.emit('score-updated', { roomId: roomId.value });
    scoreModalVisible.value = false;
  } catch (error) {
    uni.showToast({ title: error.message || '记分失败', icon: 'none' });
  }
};

const submitCustomScore = () => {
  const score = Number(customScore.value);
  if (!score || score <= 0) return uni.showToast({ title: '请输入正确的正整数', icon: 'none' });
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

const settleRoom = () => {
  moreActionsPopup.value = false;
  showConfirm('结束对局', '这将会结算并保存本局战绩，确定结束吗？', async () => {
    try {
      const data = await api.settleRoom({ roomId: roomId.value });
      roomInfo.value.status = 'ended';
      appendSystemMessage('本局已结算');
      socket.value?.emit('room-settled', { roomId: roomId.value, rankings: data.rankings });
      showSettlement(players.value, '牌局圆满结束');
      await syncRoom();
    } catch (error) {
      uni.showToast({ title: error.message || '结算失败', icon: 'none' });
    }
  }, true);
};

const showSettlement = (playerList, title = '结算排名') => {
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  let mvp = null;
  if (sorted.length > 0 && sorted[0].score > 0) {
    mvp = sorted[0];
  }
  
  settlementData.value = {
    title,
    players: sorted,
    mvp,
    isWin: mvp && mvp.userId === currentUserId.value
  };
};

const closeSettlement = () => {
  settlementData.value = null;
  reLaunchPage('/pages/index/index');
};

const exitRoom = () => {
  moreActionsPopup.value = false;
  const msg = isRoomCreator.value ? '关闭后不能继续记分，确认退出吗？' : '退出后你的分数仍保留，但不再接收实时更新，确认退出吗？';
  showConfirm('退出房间', msg, async () => {
    try {
      if (isRoomCreator.value) await api.closeRoom({ roomId: roomId.value });
      else await api.exitRoom({ roomId: roomId.value });
      socket.value?.emit('leave-room', roomId.value);
      showSettlement(players.value, '退出结算');
    } catch (error) {
      uni.showToast({ title: error.message || '操作失败', icon: 'none' });
    }
  }, true);
};

const goHome = () => reLaunchPage('/pages/index/index');

const goBack = () => navigateBackOrPage('/pages/index/index');

const sendMessage = async (contentOverride = '') => {
  const content = contentOverride || message.value;
  if (!content) return;
  try {
    await api.sendMessage({ roomId: roomId.value, content, type: 'user' });
    message.value = '';
    await syncRoom();
    
    // 自己发消息时，立刻在本地显示气泡
    showChatBubble(currentUserId.value, content);
    
    socket.value?.emit('new-message', { roomId: roomId.value, userId: currentUserId.value, content });
  } catch (error) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
  }
};

const sendQuickReaction = async (content) => await sendMessage(content);

// 气泡/顶部通知逻辑
const showChatBubble = (userId, content) => {
  const p = players.value.find(x => x.userId === userId);
  const name = p ? p.name : '系统';
  showTopToast(`${name}: ${content}`);
};

// 互动表情逻辑
const sendInteraction = (tool) => {
  // 发送 Socket 事件，广播互动
  socket.value?.emit('interaction', {
    roomId: roomId.value,
    fromUserId: currentUserId.value,
    toUserId: null,
    emoji: tool.emoji
  });
  
  // 自己本地先播一次动画
  playGiantAnimation(tool.emoji);
  showChatBubble(currentUserId.value, `发送了 ${tool.name} ${tool.emoji}`);
};



const openScoreModal = () => {
  if (roomInfo.value.status !== 'active') return uni.showToast({ title: '牌局已结束', icon: 'none' });
  scoreModalVisible.value = true;
};

const showTopToast = (msg) => {
  topToastMessage.value = msg;
  if (topToastTimer) clearTimeout(topToastTimer);
  topToastTimer = setTimeout(() => {
    topToastMessage.value = '';
  }, 3000);
};

const playGiantAnimation = (emoji) => {
  giantAnimation.value = emoji;
  setTimeout(() => {
    giantAnimation.value = '';
  }, 1500);
};

const openEditName = () => {
  editName.value = currentPlayerName.value;
  editNamePopup.value = true;
  moreActionsPopup.value = false;
};

const savePlayerName = async () => {
  if (!editName.value || editName.value.length < 2) return uni.showToast({ title: '昵称至少 2 位', icon: 'none' });
  try {
    await api.updatePlayerName({ roomId: roomId.value, name: editName.value });
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
  socket.value.on('connect', () => socket.value.emit('join-room', roomId.value));
  socket.value.on('player-joined', refreshRoom);
  socket.value.on('player-left', refreshRoom);
  socket.value.on('score-updated', refreshRoom);
  
  // 监听别人发的消息，显示气泡
  socket.value.on('new-message', async (data) => {
    // data 期望包含 userId 和 content
    if (data && data.userId && data.content && data.userId !== currentUserId.value) {
      showChatBubble(data.userId, data.content);
    }
    await refreshRoom();
  });
  
  // 监听别人的互动表情
  socket.value.on('interaction', (data) => {
    if (data && data.fromUserId && data.emoji) {
      if (data.fromUserId !== currentUserId.value) {
        playGiantAnimation(data.emoji);
        const p = players.value.find(x => x.userId === data.fromUserId);
        if (p) showTopToast(`${p.name} 发送了 ${data.emoji}`);
      }
    }
  });
  
  socket.value.on('room-settled', async (data) => {
    appendSystemMessage('房主已结算当前牌局');
    roomInfo.value.status = 'ended';
    // 通知全员弹窗
    showSettlement(players.value, '牌局圆满结束');
    await refreshRoom();
  });
};

onMounted(async () => {
  roomId.value = resolveRoomIdFromUrl();
  if (!roomId.value) {
    uni.showToast({ title: '房间号缺失', icon: 'none' });
    reLaunchPage('/pages/index/index');
    return;
  }
  if (!requireAuth()) return;
  try {
    if (!isRoomCreator.value) await api.joinRoom({ roomId: roomId.value });
    
    // 连接 websocket 前先建立
    await syncRoom();
    initSocket();

    // 如果中途加入房间时，房间已结束，显示结算
    if (roomInfo.value.status !== 'active') {
      showSettlement(players.value, '牌局已结束');
    }
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
  height: 100vh;
  padding: 0;
  overflow: hidden;
  background: var(--bg-gradient);
}

/* 顶部通知 */
.top-toast {
  position: fixed;
  top: env(safe-area-inset-top);
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: rgba(255, 179, 186, 0.95);
  color: #fff;
  padding: 16rpx 40rpx;
  border-radius: var(--radius-pill);
  font-size: 28rpx;
  font-weight: bold;
  z-index: 1000;
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: var(--shadow-primary);
  white-space: nowrap;
}
.top-toast.show {
  transform: translateX(-50%) translateY(20rpx);
  opacity: 1;
}

/* 顶部导航 */
.page-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 20rpx) 30rpx 20rpx;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
}
.nav-btn {
  font-size: 28rpx;
  color: var(--secondary-strong);
  font-weight: bold;
  padding: 12rpx 24rpx;
  background: rgba(255,255,255,0.9);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-right {
  display: flex;
  gap: 16rpx;
}
.icon-btn {
  padding: 12rpx 16rpx;
  font-size: 32rpx;
}
.nav-title {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title-text {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--text-main);
}

/* 玩家列表 (横向滚动) */
.player-list-section {
  padding: 20rpx 0 10rpx;
  background: transparent;
}
.player-scroll {
  width: 100%;
  white-space: nowrap;
}
.player-strip {
  display: inline-flex;
  padding: 10rpx 30rpx;
  gap: 24rpx;
}
.player-pill {
  width: 140rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.7);
  padding: 16rpx 10rpx;
  border-radius: var(--radius-md);
  border: 4rpx solid transparent;
  transition: all 0.2s;
  box-shadow: var(--shadow-sm);
}
.player-pill.active {
  background: #fff;
  border-color: var(--primary);
  transform: translateY(-4rpx);
  box-shadow: var(--shadow-primary);
}
.p-avatar-box {
  position: relative;
  margin-bottom: 12rpx;
}
.p-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
}
.p-self-tag {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  background: var(--success);
  color: #1b9b66;
  font-size: 18rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
  font-weight: bold;
}
.p-name {
  font-size: 24rpx;
  font-weight: bold;
  color: var(--text-main);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 实时排行 */
.ranking-card {
  margin: 10rpx 30rpx 20rpx;
  padding: 16rpx 24rpx;
  background: rgba(255,255,255,0.85);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}
.ranking-card .card-title {
  font-size: 24rpx;
  margin-bottom: 12rpx;
  color: var(--text-sub);
}
.ranking-list {
  display: flex;
  gap: 16rpx;
  overflow-x: auto;
}
.ranking-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12rpx;
  background: #fff;
  border-radius: var(--radius-md);
  box-shadow: 0 4rpx 12rpx rgba(134, 170, 232, 0.08);
  min-width: 120rpx;
}
.r-rank {
  font-size: 24rpx;
  font-weight: 900;
  color: var(--text-light);
  margin-bottom: 8rpx;
}
.rank-1 { color: #F59E0B; }
.rank-2 { color: #9CA3AF; }
.rank-3 { color: #B45309; }
.r-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 16rpx;
  margin-bottom: 8rpx;
}
.r-info {
  display: none; /* 紧凑模式下隐藏名字和描述 */
}
.r-score-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.r-score {
  font-size: 28rpx;
  font-weight: 900;
  text-align: center;
}
.r-score.positive { color: #f43f5e; }
.r-score.negative { color: #10b981; }
.takeover-btn {
  font-size: 20rpx;
  background: var(--primary-light);
  color: #f43f5e;
  border-radius: var(--radius-pill);
  padding: 4rpx 16rpx;
  box-shadow: 0 4rpx 8rpx rgba(255, 179, 186, 0.4);
}
.takeover-btn:active {
  transform: scale(0.95);
}

/* 记分流水区 (自适应滚动) */
.flow-scroll {
  flex: 1;
  width: 100%;
}
.flow-card {
  margin: 0 30rpx;
  background: rgba(255,255,255,0.7);
  box-shadow: none;
  border: none;
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.log-item {
  background: #fff;
  padding: 20rpx;
  border-radius: var(--radius-md);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.03);
}
.log-item.revoked {
  opacity: 0.5;
  text-decoration: line-through;
}
.log-main {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}
.log-text { font-size: 26rpx; font-weight: bold; }
.log-time { font-size: 22rpx; color: var(--text-light); }
.log-sub { font-size: 22rpx; color: var(--text-sub); }
.empty-hint {
  text-align: center;
  padding: 40rpx 0;
  color: var(--text-light);
  font-size: 26rpx;
}
.bottom-spacer {
  height: 320rpx; /* 留出底部交互区空间 */
}

/* 底部交互区 */
.bottom-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.sub-bottom-interactions {
  background: transparent;
  padding: 0 30rpx 16rpx;
  display: flex;
  justify-content: flex-start;
}
.interaction-list {
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 16rpx 24rpx;
  border-radius: var(--radius-pill);
  box-shadow: 0 4rpx 16rpx rgba(134, 170, 232, 0.15);
  width: 100%;
}
.interaction-btn {
  font-size: 60rpx; /* 大一点 */
  padding: 10rpx 30rpx;
  transition: transform 0.2s;
}
.interaction-btn:active {
  transform: scale(1.3);
}

.bottom-dock {
  background: linear-gradient(180deg, rgba(255,255,255,0.95), #fff);
  backdrop-filter: blur(10px);
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -10rpx 30rpx rgba(134, 170, 232, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.chat-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.chat-input {
  flex: 1;
  height: 88rpx;
  border-radius: var(--radius-pill);
  font-size: 28rpx;
  background: #f4f6fa !important;
}
.chat-send-btn {
  width: 140rpx;
  height: 88rpx;
  font-size: 28rpx;
  border-radius: var(--radius-pill);
}
.score-open-btn {
  width: 140rpx;
  height: 88rpx;
  font-size: 28rpx;
  border-radius: var(--radius-pill);
}

/* 计分弹窗 */
.score-modal {
  padding: 40rpx 30rpx;
}
.highlight {
  color: var(--primary-strong);
  font-weight: bold;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
  margin-bottom: 30rpx;
}
.shortcut-chip {
  background: #F0F7FF;
  color: var(--secondary-strong);
  height: 90rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-size: 36rpx;
  font-weight: 900;
  transition: all 0.1s;
}
.shortcut-chip:active {
  transform: scale(0.95);
  background: var(--secondary-light);
}
.custom-row {
  display: flex;
  gap: 16rpx;
  margin-bottom: 30rpx;
}
.custom-btn {
  width: 160rpx;
}
.close-score-btn {
  margin-top: 20rpx;
}

/* 设置列表 */
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.setting-item {
  padding: 24rpx;
  background: #F8FAFC;
  border-radius: var(--radius-md);
  text-align: center;
}
.setting-item.danger {
  background: #FFF0F2;
  color: #e11d48;
}

/* 巨型动画 */
.giant-animation {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 200rpx;
  z-index: 9999;
  pointer-events: none;
  animation: explode 1.5s ease-out forwards;
}
@keyframes explode {
  0% { transform: translate(-50%, -50%) scale(0.1); opacity: 0; }
  30% { transform: translate(-50%, -50%) scale(1.5); opacity: 1; }
  70% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
}

/* 斗地主风格结算弹窗样式 (保留) */
.settlement-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(10px);
}
.settlement-modal {
  width: 600rpx;
  background: linear-gradient(to bottom, #fff, #f8fafc);
  border-radius: 40rpx;
  padding: 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}
.settlement-modal.win-bg {
  background: linear-gradient(to bottom, #FFF0F2, #fff);
  border: 4rpx solid #FFDFE2;
}
.s-title-img {
  font-size: 48rpx;
  font-weight: 900;
  color: #f43f5e;
  text-shadow: 0 4rpx 8rpx rgba(244, 63, 94, 0.2);
  margin-bottom: 20rpx;
  letter-spacing: 4rpx;
}
.s-mvp {
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #FFB3BA, #FFDFE2);
  padding: 12rpx 30rpx;
  border-radius: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 8rpx 16rpx rgba(255, 179, 186, 0.4);
}
.crown {
  font-size: 40rpx;
  margin-right: 12rpx;
}
.mvp-name {
  font-weight: bold;
  color: #fff;
  font-size: 30rpx;
  margin-right: 16rpx;
}
.mvp-score {
  font-weight: 900;
  color: #fff;
  font-size: 36rpx;
}
.s-list {
  width: 100%;
  max-height: 500rpx;
  margin-bottom: 30rpx;
}
.s-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: rgba(255,255,255,0.8);
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
}
.s-rank {
  font-size: 32rpx;
  font-weight: 900;
  color: var(--secondary);
  width: 50rpx;
}
.s-avatar {
  width: 64rpx; height: 64rpx;
  border-radius: 50%;
  margin-right: 16rpx;
}
.s-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: bold;
  color: var(--text-main);
}
.s-score {
  font-size: 36rpx;
  font-weight: 900;
}
.s-btn {
  width: 100%;
  border-radius: 100rpx;
  font-size: 32rpx;
}
</style>
