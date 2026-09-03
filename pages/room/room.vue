<template>
  <view class="room-page app-shell">
    
    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="nav-btn" @click="goBack">← 返回</view>
      <view class="nav-title">
        <text class="title-text">{{ roomInfo.title || '实时牌局' }}</text>
        <text class="sub-text">房间: {{ roomId || '--' }}</text>
      </view>
      <view class="nav-btn right" @click="goHome">首页</view>
    </view>

    <!-- 房间状态卡片 -->
    <view class="macaron-card header-card">
      <view class="status-row">
        <view class="room-info">
          <text class="room-name">{{ roomInfo.title || '实时牌局' }}</text>
          <text class="macaron-badge" :class="roomInfo.status === 'active' ? 'green' : 'yellow'">
            {{ roomStatusText }}
          </text>
        </view>
        <view class="role-badge">{{ roomRoleText }}</view>
      </view>
      
      <view class="metrics-row">
        <view class="metric-item">
          <text class="m-val">{{ players.length }}</text>
          <text class="m-label">玩家</text>
        </view>
        <view class="metric-item">
          <text class="m-val">{{ leaderPlayer?.name || '--' }}</text>
          <text class="m-label">领先</text>
        </view>
      </view>

      <view class="share-box">
        <view class="share-text">
          <text class="s-title">邀请链接</text>
          <text class="s-link">{{ shareLink }}</text>
        </view>
        <view class="share-btns">
          <button class="macaron-btn ghost small" @click="copyShareLink">复制</button>
          <button class="macaron-btn ghost small" @click="refreshRoom">刷新</button>
        </view>
      </view>

      <view class="control-row">
        <button v-if="isRoomCreator && roomInfo.status === 'active'" class="macaron-btn pink control-btn" @click="settleRoom">结束对局</button>
        <button v-if="roomInfo.status === 'active'" class="macaron-btn ghost control-btn" @click="revokeLastScore">撤回上一笔</button>
        <button class="macaron-btn ghost control-btn danger" @click="exitRoom">{{ isRoomCreator ? '关闭并退出' : '退出房间' }}</button>
      </view>
    </view>

    <!-- 排行榜 (包含头像和气泡) -->
    <view class="macaron-card board-card" id="board-area">
      <view class="card-title">🏆 实时排行</view>
      
      <view class="player-list">
        <view
          v-for="(player, index) in orderedPlayers"
          :key="player.userId"
          class="player-row"
          :class="{
            active: selectedTargetId === player.userId,
            leader: index === 0
          }"
          @click="selectTarget(player.userId)"
        >
          <view class="rank-num" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
          
          <view class="avatar-container" :id="'avatar-' + player.userId">
            <image class="p-avatar" :src="player.avatar || defaultAvatar"></image>
            
            <!-- 聊天气泡 -->
            <view class="chat-bubble" v-if="activeBubbles[player.userId]">
              {{ activeBubbles[player.userId] }}
            </view>
          </view>
          
          <view class="p-info">
            <view class="p-name-line">
              <text class="p-name">{{ player.name }}</text>
              <text v-if="player.userId === currentUserId" class="macaron-badge blue self-badge">我</text>
            </view>
            <text class="p-desc">{{ getPlayerStatusText(player, index) }}</text>
          </view>

          <view class="p-score-wrap">
            <view class="p-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
              {{ formatScore(player.score) }}
            </view>
            <!-- 替补接管按钮 (仅非自己时显示) -->
            <button v-if="player.userId !== currentUserId" class="takeover-btn" @click.stop="handleTakeover(player)">接管</button>
          </view>

          <view v-if="player.userId === currentUserId" class="edit-btn" @click.stop="openEditName(player)">✏️</view>
        </view>
      </view>
    </view>

    <!-- 记分与互动操作区 (仅进行中可见) -->
    <block v-if="roomInfo.status === 'active'">
      <view class="macaron-card target-card">
        <view class="card-title">🎯 目标玩家 (记分或互动)</view>
        
        <scroll-view class="target-scroll" scroll-x show-scrollbar="false">
          <view class="target-strip">
            <view
              v-for="player in orderedPlayers"
              :key="player.userId"
              class="target-pill"
              :class="{
                active: selectedTargetId === player.userId,
                self: player.userId === currentUserId
              }"
              @click="selectTarget(player.userId)"
            >
              <view class="tp-avatar-box">
                <image class="tp-avatar" :src="player.avatar || defaultAvatar"></image>
                <text v-if="player.userId === currentUserId" class="tp-self">我</text>
              </view>
              <text class="tp-name">{{ player.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <view class="macaron-card score-dock">
        <view class="card-title">
          ✍️ 记分面板
          <text class="target-hint" :class="{ active: selectedTargetId }">
            {{ selectedTargetName ? `目标: ${selectedTargetName}` : '请先在上方选人' }}
          </text>
        </view>
        
        <view class="shortcut-grid">
          <view v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">
            +{{ item }}
          </view>
        </view>

        <view class="custom-row">
          <input v-model="customScore" class="macaron-input custom-input" type="number" placeholder="自定义分" />
          <button class="macaron-btn custom-btn" @click="submitCustomScore">记 分</button>
        </view>
      </view>

      <view class="macaron-card interaction-dock">
        <view class="card-title">🎉 快捷互动</view>
        <view class="quick-chat">
          <view v-for="item in quickMessages" :key="item" class="chat-chip" @click="sendQuickReaction(item)">
            {{ item }}
          </view>
        </view>
        
        <view class="interaction-tools">
          <view v-for="item in interactionTools" :key="item.emoji" class="tool-btn" @click="sendInteraction(item)">
            <text class="tool-emoji">{{ item.emoji }}</text>
            <text class="tool-name">{{ item.name }}</text>
          </view>
        </view>
        
        <view class="chat-input-row" style="margin-top: 20rpx;">
          <input v-model.trim="message" class="macaron-input" placeholder="自定义发言..." @confirm="sendMessage()" confirm-type="send" />
          <view class="send-btn" @click="sendMessage()">发送</view>
        </view>
      </view>
    </block>

    <!-- 记分流水 -->
    <view class="macaron-card log-card">
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

    <!-- 弹窗：修改房间昵称 -->
    <view v-if="editNamePopup" class="modal-mask" @click="editNamePopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">修改房间昵称</view>
        <view class="modal-desc">只在这个房间里生效哦</view>
        <input v-model.trim="editName" class="macaron-input" placeholder="输入房间昵称" />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="editNamePopup = false">取消</button>
          <button class="macaron-btn" @click="savePlayerName">保 存</button>
        </view>
      </view>
    </view>

    <!-- 动画层 (用于表情飞行) -->
    <view v-for="anim in flyingAnimations" :key="anim.id" class="flying-emoji" :style="anim.style">
      {{ anim.emoji }}
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
            <image class="s-avatar" :src="p.avatar || '/static/default-avatar.png'" mode="aspectFill" />
            <text class="s-name">{{ p.name }} <text v-if="p.userId === currentUserId">(我)</text></text>
            <text class="s-score" :class="{ positive: p.score > 0, negative: p.score < 0 }">{{ formatScore(p.score) }}</text>
          </view>
        </scroll-view>

        <button class="macaron-btn s-btn" @click="closeSettlement">回到大厅</button>
      </view>
      
      <view class="confetti-container" v-if="settlementData.isWin">
        <!-- 简单的撒花动画元素可以用绝对定位的Emoji代替，或在此处放置动画 -->
      </view>
    </view>
    
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, nextTick, getCurrentInstance } from 'vue';
import io from 'socket.io-client';
import { currentConfig } from '../../config/env';
import { api } from '../../utils/api';
import { getRoomPageUrl, getRoomShareLink, redirectToLogin } from '../../utils/auth';

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
const editName = ref('');
const settlementData = ref(null);

// 互动与动画状态
const activeBubbles = ref({});
const flyingAnimations = ref([]);

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
    const match = window.location.hash.match(/roomId=([A-Za-z0-9]+)/i);
    if (match?.[1]) return match[1].toUpperCase();
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
  uni.showModal({
    title: '替补接管',
    content: `确认要接管【${player.name}】的位置和分数吗？操作后该玩家将被移出，分数归你。`,
    confirmColor: '#f43f5e',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.takeoverSeat({ roomId: roomId.value, targetUserId: player.userId });
          uni.showToast({ title: '接管成功', icon: 'success' });
          syncRoom();
        } catch (err) {
          uni.showToast({ title: err.message || '接管失败', icon: 'none' });
        }
      }
    }
  });
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

const settleRoom = async () => {
  uni.showModal({
    title: '结束对局',
    content: '这将会结算并保存本局战绩，确定结束吗？',
    confirmColor: '#f43f5e',
    success: async ({ confirm }) => {
      if (!confirm) return;
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
    }
  });
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
  uni.reLaunch({ url: '/pages/index/index' });
};

const exitRoom = () => {
  uni.showModal({
    title: isRoomCreator.value ? '关闭房间' : '退出房间',
    content: isRoomCreator.value ? '关闭后不能继续记分，确认退出吗？' : '退出后你的分数仍保留，但不再接收实时更新，确认退出吗？',
    confirmColor: '#f43f5e',
    success: async (res) => {
      if (res.confirm) {
        try {
          if (isRoomCreator.value) await api.closeRoom({ roomId: roomId.value });
          else await api.exitRoom({ roomId: roomId.value });
          socket.value?.emit('leave-room', roomId.value);
          
          // 给自己弹出一个小结算
          showSettlement(players.value, '退出结算');
          
        } catch (error) {
          uni.showToast({ title: error.message || '操作失败', icon: 'none' });
        }
      }
    }
  });
};

const goHome = () => uni.reLaunch({ url: '/pages/index/index' });

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack({ delta: 1 });
  else goHome();
};

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

// 气泡显示逻辑
const showChatBubble = (userId, content) => {
  activeBubbles.value[userId] = content;
  // 3秒后自动清除气泡
  setTimeout(() => {
    if (activeBubbles.value[userId] === content) {
      activeBubbles.value[userId] = null;
    }
  }, 3000);
};

// 互动表情逻辑
const sendInteraction = (tool) => {
  if (!selectedTargetId.value) return uni.showToast({ title: '请先在上方选择目标玩家哦', icon: 'none' });
  if (selectedTargetId.value === currentUserId.value) return uni.showToast({ title: '不能给自己发互动哦', icon: 'none' });
  
  // 发送 Socket 事件，广播互动
  socket.value?.emit('interaction', {
    roomId: roomId.value,
    fromUserId: currentUserId.value,
    toUserId: selectedTargetId.value,
    emoji: tool.emoji
  });
  
  // 自己本地先播一次动画
  playInteractionAnimation(currentUserId.value, selectedTargetId.value, tool.emoji);
};

const playInteractionAnimation = (fromUserId, toUserId, emoji) => {
  // 获取起止元素的坐标 (H5 / 小程序)
  const query = uni.createSelectorQuery().in(getCurrentInstance());
  query.select(`#avatar-${fromUserId}`).boundingClientRect();
  query.select(`#avatar-${toUserId}`).boundingClientRect();
  
  query.exec((res) => {
    const fromRect = res[0];
    const toRect = res[1];
    
    if (!fromRect || !toRect) {
      // 找不到元素退级方案，直接在目标头上显示气泡
      showChatBubble(toUserId, emoji);
      return;
    }
    
    const animId = `anim_${Date.now()}_${Math.random()}`;
    const startX = fromRect.left + fromRect.width / 2;
    const startY = fromRect.top + fromRect.height / 2;
    const endX = toRect.left + toRect.width / 2;
    const endY = toRect.top + toRect.height / 2;
    
    flyingAnimations.value.push({
      id: animId,
      emoji,
      style: `
        --start-x: ${startX}px;
        --start-y: ${startY}px;
        --end-x: ${endX}px;
        --end-y: ${endY}px;
      `
    });
    
    // 动画结束后移除元素，并在目标头上展示爆炸/表情气泡
    setTimeout(() => {
      flyingAnimations.value = flyingAnimations.value.filter(a => a.id !== animId);
      showChatBubble(toUserId, emoji + emoji + emoji); // 夸张的反馈
    }, 1000);
  });
};

const openEditName = (player) => {
  editName.value = player.name;
  editNamePopup.value = true;
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
    if (data && data.fromUserId && data.toUserId && data.emoji) {
      // 如果不是自己发的（自己发的在发送时已经播了本地动画）
      if (data.fromUserId !== currentUserId.value) {
        playInteractionAnimation(data.fromUserId, data.toUserId, data.emoji);
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
    uni.reLaunch({ url: '/pages/index/index' });
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
}

/* 顶部导航 */
.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10rpx 30rpx;
}
.nav-btn {
  font-size: 28rpx;
  color: var(--secondary);
  font-weight: bold;
  padding: 10rpx;
  &.right { text-align: right; }
}
.nav-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title-text {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--text-main);
}
.sub-text {
  font-size: 22rpx;
  color: var(--text-sub);
}

.card-title {
  font-size: 32rpx;
  font-weight: 800;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
}

/* 状态卡片 */
.header-card {
  background: linear-gradient(135deg, #fff, #f0f7ff);
}
.status-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24rpx;
}
.room-name {
  font-size: 40rpx;
  font-weight: 800;
  margin-bottom: 8rpx;
  display: block;
}
.role-badge {
  background: var(--primary-light);
  color: #e67381;
  padding: 8rpx 20rpx;
  border-radius: var(--radius-pill);
  font-size: 22rpx;
  font-weight: bold;
}
.metrics-row {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
}
.metric-item {
  flex: 1;
  background: rgba(255,255,255,0.6);
  padding: 16rpx;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.m-val { font-size: 32rpx; font-weight: 800; color: var(--text-main); }
.m-label { font-size: 22rpx; color: var(--text-sub); margin-top: 4rpx; }

.share-box {
  background: #F8FAFC;
  padding: 20rpx;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.share-text {
  flex: 1;
  min-width: 0;
}
.s-title { display: block; font-size: 24rpx; color: var(--text-sub); }
.s-link { display: block; font-size: 22rpx; color: var(--secondary); margin-top: 4rpx; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.share-btns {
  display: flex;
  gap: 12rpx;
  margin-left: 20rpx;
}
.share-btns .macaron-btn.small {
  height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  width: auto;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}
.control-btn {
  flex: 1;
  min-width: 140rpx;
  height: 80rpx;
  font-size: 26rpx;
}
.control-btn.danger {
  color: #e11d48;
  border-color: #ffe4e6;
}

/* 目标选择区 */
.target-scroll {
  width: 100%;
  white-space: nowrap;
}
.target-strip {
  display: inline-flex;
  gap: 20rpx;
  padding-bottom: 10rpx;
}
.target-pill {
  width: 160rpx;
  background: #F8FAFC;
  border-radius: var(--radius-md);
  padding: 20rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  border: 4rpx solid transparent;
  transition: all 0.2s;
}
.target-pill.active {
  background: #fff;
  border-color: var(--secondary);
  box-shadow: 0 8rpx 24rpx rgba(160, 196, 255, 0.2);
  transform: translateY(-4rpx);
}
.target-pill.self {
  opacity: 0.6;
}
.tp-avatar-box {
  position: relative;
  margin-bottom: 12rpx;
}
.tp-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
}
.tp-self {
  position: absolute;
  bottom: -10rpx;
  left: 50%;
  transform: translateX(-50%);
  background: var(--success);
  color: #fff;
  font-size: 18rpx;
  padding: 2rpx 12rpx;
  border-radius: 10rpx;
}
.tp-name {
  font-size: 24rpx;
  font-weight: bold;
  color: var(--text-main);
  text-align: center;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 记分面板 */
.target-hint {
  font-size: 22rpx;
  color: var(--text-light);
  margin-left: auto;
  font-weight: normal;
}
.target-hint.active {
  color: var(--secondary);
  font-weight: bold;
}
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}
.shortcut-chip {
  background: #F0F7FF;
  color: var(--secondary);
  height: 96rpx;
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
}
.custom-input {
  flex: 1;
}
.custom-btn {
  width: 180rpx;
}

/* 排行榜 */
.player-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.player-row {
  display: flex;
  align-items: center;
  padding: 20rpx;
  background: #F8FAFC;
  border-radius: var(--radius-md);
  transition: all 0.2s;
  border: 2rpx solid transparent;
}
.player-row.active {
  background: #fff;
  border-color: var(--secondary-light);
  box-shadow: 0 4rpx 12rpx rgba(160, 196, 255, 0.1);
}
.player-row.leader {
  background: #FFFDF0;
}
.rank-num {
  width: 50rpx;
  font-size: 32rpx;
  font-weight: 900;
  color: var(--text-light);
  text-align: center;
}
.rank-num.rank-1 { color: #F59E0B; }
.rank-num.rank-2 { color: #9CA3AF; }
.rank-num.rank-3 { color: #B45309; }

/* 头像容器与气泡 */
.avatar-container {
  position: relative;
  margin: 0 20rpx;
}
.chat-bubble {
  position: absolute;
  top: -50rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 8rpx 16rpx;
  border-radius: 16rpx;
  font-size: 24rpx;
  color: var(--text-main);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.1);
  white-space: nowrap;
  z-index: 10;
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  pointer-events: none;
}
.chat-bubble::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  border-width: 8rpx 8rpx 0;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.95) transparent transparent transparent;
}

@keyframes popIn {
  0% { transform: translate(-50%, 20rpx) scale(0.5); opacity: 0; }
  100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
}

/* 飞行表情动画 */
.flying-emoji {
  position: fixed;
  font-size: 60rpx;
  z-index: 9999;
  pointer-events: none;
  left: 0;
  top: 0;
  /* 使用 CSS 变量传入起止点 */
  transform: translate(var(--start-x), var(--start-y));
  animation: flyToTarget 1s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
}

@keyframes flyToTarget {
  0% {
    transform: translate(calc(var(--start-x) - 30rpx), calc(var(--start-y) - 30rpx)) scale(0.5) rotate(0deg);
    opacity: 1;
  }
  50% {
    /* 抛物线最高点：高度减去一定值 */
    transform: translate(
      calc((var(--start-x) + var(--end-x)) / 2 - 30rpx), 
      calc(min(var(--start-y), var(--end-y)) - 150rpx)
    ) scale(1.5) rotate(180deg);
  }
  90% {
    transform: translate(calc(var(--end-x) - 30rpx), calc(var(--end-y) - 30rpx)) scale(1) rotate(360deg);
    opacity: 1;
  }
  100% {
    transform: translate(calc(var(--end-x) - 30rpx), calc(var(--end-y) - 30rpx)) scale(2) rotate(360deg);
    opacity: 0;
  }
}

.p-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  margin: 0 20rpx;
}
.p-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.p-name-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.p-name {
  font-size: 28rpx;
  font-weight: bold;
}
.self-badge {
  padding: 2rpx 10rpx;
  font-size: 18rpx;
}
.p-desc {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 6rpx;
}
.takeover-btn {
  font-size: 22rpx;
  background: var(--primary-light);
  color: #fff;
  border-radius: var(--radius-pill);
  padding: 4rpx 16rpx;
  margin-left: 12rpx;
  box-shadow: 0 4rpx 8rpx rgba(255, 179, 186, 0.4);
}
.takeover-btn:active {
  transform: scale(0.95);
}

.p-score-wrap {
  display: flex;
  align-items: center;
}
.p-score {
  font-size: 40rpx;
  font-weight: 900;
  text-align: right;
  min-width: 100rpx;
}
.p-score.positive { color: #f43f5e; }
.p-score.negative { color: #10b981; }

.edit-btn {
  font-size: 32rpx;
  padding: 10rpx;
  margin-left: 10rpx;
}

.interaction-dock {
  margin-bottom: 24rpx;
}
.interaction-tools {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}
.tool-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #FFF0F2;
  border-radius: var(--radius-md);
  width: 120rpx;
  height: 120rpx;
  transition: all 0.2s;
}
.tool-btn:active {
  transform: scale(0.9);
  background: #FFE4E8;
}
.tool-emoji {
  font-size: 48rpx;
  margin-bottom: 4rpx;
}
.tool-name {
  font-size: 20rpx;
  color: #f43f5e;
  font-weight: bold;
}

/* 聊天区 (已保留发送框，移除列表) */
.quick-chat {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}
.chat-chip {
  background: #F8FAFC;
  padding: 12rpx 24rpx;
  border-radius: var(--radius-pill);
  font-size: 24rpx;
  color: var(--text-main);
}
.chat-list {
  background: #F8FAFC;
  border-radius: var(--radius-md);
  padding: 20rpx;
  max-height: 400rpx;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
}
.msg-item {
  font-size: 26rpx;
  line-height: 1.4;
}
.msg-author { font-weight: bold; color: var(--secondary); }
.msg-content { color: var(--text-main); }
.msg-time { font-size: 20rpx; color: var(--text-light); margin-left: 10rpx; }
.msg-item.system .msg-author { color: var(--primary); }
.msg-item.system .msg-content { color: var(--text-sub); }
.chat-input-row {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.send-btn {
  background: var(--secondary);
  color: #fff;
  padding: 0 32rpx;
  height: 96rpx;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

/* 流水区 */
.log-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.log-item {
  background: #F8FAFC;
  padding: 20rpx;
  border-radius: var(--radius-md);
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

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(8rpx);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40rpx;
}
.modal-panel {
  width: 100%;
  max-width: 600rpx;
  margin-bottom: 0;
}
.modal-title {
  font-size: 36rpx;
  font-weight: 800;
  text-align: center;
  margin-bottom: 16rpx;
}
.modal-desc {
  font-size: 26rpx;
  color: var(--text-sub);
  text-align: center;
  margin-bottom: 32rpx;
}
.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;
}
/* 斗地主结算弹窗样式 */
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
