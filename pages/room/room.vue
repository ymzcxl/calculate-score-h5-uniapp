<template>
  <view class="room-page app-shell">
    <view class="top-toast" :class="{ show: !!topToastMessage }">
      {{ topToastMessage }}
    </view>

    <view class="page-nav">
      <view class="nav-btn" @click="goBack">返回</view>
      <view class="nav-title">
        <text class="title-text">{{ roomInfo.title || '实时牌局' }}</text>
      </view>
      <view class="nav-btn" @click="goHome">首页</view>
    </view>

    <view class="macaron-card top-function-card">
      <view class="function-main compact">
        <view class="room-identity">
          <view class="room-code-row">
            <text class="room-code-label">房间号</text>
            <text class="room-code">{{ roomId || '--' }}</text>
            <view class="mini-chip" @click="copyRoomCode">复制</view>
          </view>
          <view class="room-meta-line">
            <text class="meta-chip accent">{{ roomStatusText }}</text>
            <text class="meta-chip">{{ roomRoleText }}</text>
            <text class="meta-chip">{{ playerCount }} 人在线</text>
            <text class="meta-chip">播报 {{ messageCount }} 条</text>
          </view>
        </view>
        <view class="function-actions compact">
          <view class="top-action-btn share-btn compact" @click="copyShareLink">
            <text class="action-icon">🔗</text>
            <text class="action-text">邀请</text>
          </view>
          <view class="top-action-btn settings-btn compact" @click="moreActionsPopup = true">
            <text class="action-icon">⚙️</text>
            <text class="action-text">设置</text>
          </view>
        </view>
      </view>

      <view class="summary-strip">
        <view class="summary-pill">
          <text class="summary-label">领先</text>
          <text class="summary-value">{{ leaderPlayer ? leaderPlayer.name : '暂无' }}</text>
        </view>
        <view class="summary-pill">
          <text class="summary-label">我的分数</text>
          <text class="summary-value" :class="{ positive: (currentPlayer?.score || 0) > 0, negative: (currentPlayer?.score || 0) < 0 }">
            {{ formatScore(currentPlayer?.score || 0) }}
          </text>
        </view>
      </view>

      <view class="target-context-bar slim">
        <view class="target-context-main">
          <text class="target-context-label">消息是否指定人员</text>
          <text class="target-context-value">{{ currentAudienceHint }}</text>
        </view>
        <view
          v-if="roomInfo.status === 'active'"
          class="target-clear-btn"
          :class="{ disabled: !selectedTargetId }"
          @click="clearSelectedTarget"
        >
          全部人员
        </view>
      </view>
    </view>

    <view class="player-list-section">
      <view class="section-head">
        <text class="section-title">玩家列表</text>
        <text class="section-subtitle">{{ currentAudienceShortText }}</text>
      </view>
      <view class="player-grid">
        <view
          class="player-card all-room-card"
          :class="{ active: !selectedTargetId }"
          @click="clearSelectedTarget"
        >
          <view class="player-card-head all-room-card-head">
            <text class="all-room-icon">🌐</text>
            <text class="player-tag target-tag">全部</text>
          </view>
          <text class="player-name">全部人员</text>
          <text class="player-score neutral">消息和互动广播</text>
        </view>

        <view
          v-for="player in players"
          :key="player.userId"
          class="player-card"
          :class="{
            active: selectedTargetId === player.userId,
            self: player.userId === currentUserId
          }"
          @click="selectTarget(player.userId)"
        >
          <view class="player-card-head">
            <image class="player-avatar" :src="player.avatar || defaultAvatar" mode="aspectFill" />
            <text v-if="player.userId === currentUserId" class="player-tag self-tag">我</text>
            <text v-else-if="leaderPlayer && leaderPlayer.userId === player.userId" class="player-tag leader-tag">领先</text>
            <text v-if="selectedTargetId === player.userId" class="player-tag target-tag">指定</text>
          </view>
          <text class="player-name">{{ player.name }}</text>
          <text class="player-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
            {{ formatScore(player.score) }}
          </text>
          <view
            v-if="player.userId !== currentUserId && roomInfo.status === 'active'"
            class="player-card-action"
            @click.stop="handleTakeover(player)"
          >
            接管
          </view>
        </view>
      </view>
    </view>

    <view class="flow-stage-wrap">
      <scroll-view class="flow-scroll" scroll-y>
        <view class="macaron-card flow-card">
          <view class="flow-head">
            <view>
              <view class="card-title">房间流水</view>
              <view class="flow-subtitle">记分记录和房间播报都汇总在这里</view>
            </view>
            <view class="flow-counter">{{ scoreLogCount }} 笔</view>
          </view>

          <view v-if="recentMessages.length" class="broadcast-list">
            <view v-for="item in recentMessages" :key="item.id" class="broadcast-item">
              <view class="broadcast-main">
                <text class="broadcast-content">
                  <text class="broadcast-prefix">{{ getMessageAudienceText(item) }}</text>{{ item.content }}
                </text>
              </view>
              <text class="broadcast-time">{{ formatTime(item.timestamp) }}</text>
            </view>
          </view>

          <view v-if="recentMessages.length" class="flow-divider"></view>

          <view v-if="scoreHistory.length" class="log-list">
            <view v-for="item in scoreHistory" :key="item.id" class="log-item" :class="{ revoked: item.isRevoked }">
              <view class="log-main">
                <text class="log-text">{{ getScoreText(item) }}</text>
                <text class="log-time">{{ formatTime(item.timestamp) }}</text>
              </view>
              <text class="log-sub">{{ getScoreDetailText(item) }}</text>
            </view>
          </view>
          <view v-else class="empty-hint">还没有记分记录，先选人后计分会更顺手。</view>
        </view>
      </scroll-view>

      <view class="interaction-stage">
        <view
          v-for="effect in interactionEffects"
          :key="effect.id"
          class="interaction-effect"
          :class="{ bomb: effect.kind === '炸弹' }"
          :style="{ left: effect.left, top: effect.top }"
        >
          <text class="effect-emoji">{{ effect.emoji }}</text>
          <text class="effect-caption">{{ effect.caption }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-wrapper">
      <view class="bottom-dock">
        <view class="chat-range-bar">
          <text class="chat-range-label">当前发送范围</text>
          <text class="chat-range-value">{{ currentAudienceHint }}</text>
        </view>
        <view class="chat-row">
          <input
            v-model.trim="message"
            class="macaron-input chat-input"
            :placeholder="messagePlaceholder"
            @confirm="sendMessage()"
            confirm-type="send"
          />
          <button class="macaron-btn ghost chat-send-btn" @click="sendMessage()">发送</button>
          <button class="macaron-btn pink score-open-btn" @click="openScoreModal">计分</button>
        </view>
      </view>
    </view>

    <view class="floating-action-stack">
      <view v-if="floatingPanelVisible" class="floating-panel">
        <view class="floating-panel-head">
          <text class="floating-title">{{ floatingPanelMode === 'interaction' ? '快捷互动' : '快捷消息' }}</text>
          <text class="floating-subtitle">{{ currentAudienceHint }}</text>
        </view>
        <view v-if="floatingPanelMode === 'interaction'" class="interaction-list floating-list">
          <view v-for="item in interactionTools" :key="item.emoji" class="interaction-btn" @click="sendInteraction(item)">
            <text class="interaction-emoji">{{ item.emoji }}</text>
            <text class="interaction-name">{{ item.name }}</text>
          </view>
        </view>
        <view v-else class="quick-message-list floating-chips">
          <view v-for="item in quickMessages" :key="item" class="quick-message-chip" @click="sendQuickReaction(item)">
            {{ item }}
          </view>
        </view>
      </view>

      <view class="floating-fab secondary" @click="toggleFloatingPanel('message')">
        快捷话术
      </view>
      <view class="floating-fab" @click="toggleFloatingPanel('interaction')">
        快捷互动
      </view>
    </view>

    <view v-if="scoreModalVisible" class="modal-mask" @click="scoreModalVisible = false">
      <view class="macaron-card modal-panel score-modal" @click.stop>
        <view class="modal-title">计分</view>
        <view class="modal-desc">
          从 <text class="highlight">{{ currentPlayerName }}</text> 记给
          <text class="highlight">{{ selectedTargetName || '请选择目标玩家' }}</text>
        </view>

        <view class="target-picker">
          <view class="target-picker-head">
            <text class="target-picker-title">在弹窗里选择目标</text>
            <text class="target-picker-tip">页面外和弹窗内共用同一个目标状态</text>
          </view>
          <view class="target-picker-list">
            <view
              class="target-player-chip room-chip"
              :class="{ active: !selectedTargetId }"
              @click="clearSelectedTarget"
            >
              暂不选择
            </view>
            <view
              v-for="player in scoreTargetPlayers"
              :key="player.userId"
              class="target-player-chip"
              :class="{ active: selectedTargetId === player.userId }"
              @click="selectTarget(player.userId)"
            >
              {{ player.name }}
            </view>
          </view>
        </view>

        <view class="shortcut-grid">
          <view v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">
            +{{ item }}
          </view>
        </view>

        <view class="custom-row">
          <input v-model="customScore" class="macaron-input" type="number" placeholder="自定义分值" />
          <button class="macaron-btn custom-btn" @click="submitCustomScore">记分</button>
        </view>

        <button class="macaron-btn ghost close-score-btn" @click="scoreModalVisible = false">关闭</button>
      </view>
    </view>

    <view v-if="moreActionsPopup" class="modal-mask" @click="moreActionsPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">更多功能</view>
        <view class="settings-list">
          <view class="setting-item" @click="copyShareLink">
            <text class="st-title">复制邀请链接</text>
          </view>
          <view class="setting-item" @click="copyRoomCode">
            <text class="st-title">复制房间号</text>
          </view>
          <view class="setting-item" @click="refreshRoom">
            <text class="st-title">刷新房间状态</text>
          </view>
          <view v-if="roomInfo.status === 'active'" class="setting-item" @click="revokeLastScore">
            <text class="st-title">申请撤回上一笔</text>
          </view>
          <view class="setting-item" @click="openEditName">
            <text class="st-title">修改房间昵称</text>
          </view>
          <view v-if="isRoomCreator && roomInfo.status === 'active'" class="setting-item danger" @click="settleRoom">
            <text class="st-title">结束对局</text>
          </view>
          <view class="setting-item danger" @click="exitRoom">
            <text class="st-title">{{ isRoomCreator ? '关闭并退出' : '退出房间' }}</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="moreActionsPopup = false">关闭</button>
        </view>
      </view>
    </view>

    <view v-if="editNamePopup" class="modal-mask" @click="editNamePopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">修改房间昵称</view>
        <input v-model.trim="editName" class="macaron-input" placeholder="输入房间昵称" />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="editNamePopup = false">取消</button>
          <button class="macaron-btn" @click="savePlayerName">保存</button>
        </view>
      </view>
    </view>

    <view v-if="confirmPopup.visible" class="modal-mask" @click="closeConfirm">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">{{ confirmPopup.title || '提示' }}</view>
        <view class="modal-desc confirm-desc">
          {{ confirmPopup.content }}
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="closeConfirm">取消</button>
          <button class="macaron-btn" :class="{ pink: confirmPopup.isDanger }" @click="handleConfirm">确定</button>
        </view>
      </view>
    </view>

    <view v-if="settlementData" class="settlement-mask">
      <view class="settlement-modal" :class="{ 'win-bg': settlementData.isWin }">
        <view class="s-title-img">{{ settlementData.title }}</view>
        <view v-if="settlementData.mvp" class="s-mvp">
          <text class="crown">👑</text>
          <text class="mvp-name">MVP: {{ settlementData.mvp.name }}</text>
          <text class="mvp-score">{{ formatScore(settlementData.mvp.score) }}</text>
        </view>
        <scroll-view class="s-list" scroll-y>
          <view v-for="(p, index) in settlementData.players" :key="p.userId" class="s-item">
            <view class="s-rank">{{ index + 1 }}</view>
            <image class="s-avatar" :src="p.avatar || defaultAvatar" mode="aspectFill" />
            <text class="s-name">{{ p.name }} <text v-if="p.userId === currentUserId">(我)</text></text>
            <text class="s-score" :class="{ positive: p.score > 0, negative: p.score < 0 }">{{ formatScore(p.score) }}</text>
          </view>
        </scroll-view>
        <button class="macaron-btn s-btn" @click="closeSettlement">回到大厅</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
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
  { emoji: '🍺', name: '酒杯' },
  { emoji: '👏', name: '鼓掌' }
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
const interactionEffects = ref([]);
const editName = ref('');
const settlementData = ref(null);
const floatingPanelVisible = ref(false);
const floatingPanelMode = ref('interaction');
const seenInteractionIds = new Set();
let topToastTimer = null;

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

const currentUserId = computed(() => {
  const user = uni.getStorageSync('userInfo') || {};
  return user.uid || '';
});

const shareLink = computed(() => getRoomShareLink(roomId.value));
const currentPlayer = computed(() => players.value.find(item => item.userId === currentUserId.value) || null);
const currentPlayerName = computed(() => currentPlayer.value?.name || '我');
const orderedPlayers = computed(() => [...players.value].sort((a, b) => b.score - a.score));
const leaderPlayer = computed(() => orderedPlayers.value[0] || null);
const selectedTarget = computed(() => players.value.find(item => item.userId === selectedTargetId.value) || null);
const selectedTargetName = computed(() => selectedTarget.value?.name || '');
const scoreTargetPlayers = computed(() => players.value.filter(item => item.userId !== currentUserId.value));
const roomStatusText = computed(() => (roomInfo.value.status === 'active' ? '进行中' : '已结束'));
const roomRoleText = computed(() => (isRoomCreator.value ? '房主' : '玩家'));
const scoreLogCount = computed(() => scoreHistory.value.filter(item => !item.isRevoked).length);
const messageCount = computed(() => messages.value.length);
const playerCount = computed(() => players.value.length);
const recentMessages = computed(() => messages.value.slice(0, 6));
const currentAudienceShortText = computed(() => (selectedTargetName.value ? `指定对象｜${selectedTargetName.value}` : '全部人员'));
const currentAudienceHint = computed(() => {
  if (roomInfo.value.status !== 'active') {
    return '牌局已结束，仅查看记录';
  }
  return selectedTargetName.value ? `指定对象｜${selectedTargetName.value}` : '全部人员｜房间内所有人';
});
const messagePlaceholder = computed(() => (selectedTargetName.value ? `对 ${selectedTargetName.value} 说点什么...` : '对全部人员说点什么...'));

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
  if (item.revokeRequestStatus === 'pending') {
    const requester = getPlayerName(item.revokeRequestedBy, '相关玩家');
    const approver = getPlayerName(item.toUserId, '目标玩家');
    return `${requester} 发起了撤回申请，等待 ${approver} 确认`;
  }
  return `记分后比分：${formatScore(item.fromUserScoreAfter)} / ${formatScore(item.toUserScoreAfter)}`;
};

const appendSystemMessage = (content) => {
  messages.value.unshift({
    id: `local_${Date.now()}`,
    userId: '',
    userName: '系统',
    content,
    targetUserId: '',
    targetScope: 'room',
    timestamp: new Date().toISOString()
  });
};

const getPlayerName = (userId, fallback = '玩家') => {
  if (!userId) {
    return fallback;
  }
  return players.value.find(item => item.userId === userId)?.name || fallback;
};

const getMessageAudienceText = (item) => {
  const speaker = item?.userName || getPlayerName(item?.userId, '玩家');
  if (!item?.targetUserId) {
    return `${speaker}对全部人员说：`;
  }
  return `${speaker}对${getPlayerName(item.targetUserId, '目标玩家')}说：`;
};

const showTopToast = (msg) => {
  topToastMessage.value = msg;
  if (topToastTimer) clearTimeout(topToastTimer);
  topToastTimer = setTimeout(() => {
    topToastMessage.value = '';
  }, 2500);
};

const copyRoomCode = () => {
  if (!roomId.value) return;
  uni.setClipboardData({
    data: roomId.value,
    success: () => uni.showToast({ title: '房间号已复制', icon: 'success' })
  });
};

const copyShareLink = () => {
  moreActionsPopup.value = false;
  uni.setClipboardData({
    data: shareLink.value,
    success: () => uni.showToast({ title: '邀请链接已复制', icon: 'success' })
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
    userId: item.userId,
    userName: item.userName,
    content: item.content,
    targetUserId: item.targetUserId || '',
    targetScope: item.targetScope || (item.targetUserId ? 'player' : 'room'),
    timestamp: item.timestamp
  }));

  const hasTarget = players.value.some(item => item.userId === selectedTargetId.value && item.userId !== currentUserId.value);
  if (!hasTarget || roomInfo.value.status !== 'active') {
    selectedTargetId.value = '';
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

const toggleFloatingPanel = (mode) => {
  if (roomInfo.value.status !== 'active') {
    uni.showToast({ title: '牌局已结束', icon: 'none' });
    return;
  }
  if (floatingPanelVisible.value && floatingPanelMode.value === mode) {
    floatingPanelVisible.value = false;
    return;
  }
  floatingPanelMode.value = mode;
  floatingPanelVisible.value = true;
};

const selectTarget = (userId) => {
  if (roomInfo.value.status !== 'active' || userId === currentUserId.value) return;
  if (selectedTargetId.value === userId) {
    selectedTargetId.value = '';
    return;
  }
  selectedTargetId.value = userId;
};

const clearSelectedTarget = () => {
  if (roomInfo.value.status !== 'active') {
    return;
  }
  selectedTargetId.value = '';
};

const handleTakeover = (player) => {
  showConfirm('接管玩家', `确认要接管【${player.name}】的位置和分数吗？`, async () => {
    try {
      await api.takeoverSeat({ roomId: roomId.value, targetUserId: player.userId });
      await syncRoom();
      uni.showToast({ title: '接管成功', icon: 'success' });
    } catch (err) {
      uni.showToast({ title: err.message || '接管失败', icon: 'none' });
    }
  }, true);
};

const updateScore = async (score) => {
  if (!selectedTargetId.value) {
    uni.showToast({ title: '请先选择记分目标', icon: 'none' });
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
    scoreModalVisible.value = false;
  } catch (error) {
    uni.showToast({ title: error.message || '记分失败', icon: 'none' });
  }
};

const submitCustomScore = () => {
  const score = Number(customScore.value);
  if (!score || score <= 0) {
    uni.showToast({ title: '请输入正确的正整数', icon: 'none' });
    return;
  }
  customScore.value = '';
  updateScore(score);
};

const revokeLastScore = async () => {
  moreActionsPopup.value = false;
  try {
    const result = await api.revokeScore({ roomId: roomId.value });
    await syncRoom();
    socket.value?.emit('score-updated', { roomId: roomId.value });
    if (result?.status === 'pending') {
      appendSystemMessage('已发起撤回申请，等待对方确认');
      uni.showToast({ title: '撤回申请已发出', icon: 'none' });
      return;
    }
    appendSystemMessage('已撤回上一笔记分');
  } catch (error) {
    uni.showToast({ title: error.message || '撤回失败', icon: 'none' });
  }
};

const settleRoom = () => {
  moreActionsPopup.value = false;
  showConfirm('结束对局', '这会结算并保存本局战绩，确定结束吗？', async () => {
    try {
      const data = await api.settleRoom({ roomId: roomId.value });
      await syncRoom();
      socket.value?.emit('room-settled', { roomId: roomId.value, rankings: data.rankings });
      showSettlement(players.value, '牌局圆满结束');
    } catch (error) {
      uni.showToast({ title: error.message || '结算失败', icon: 'none' });
    }
  }, true);
};

const showSettlement = (playerList, title = '结算排名') => {
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  const mvp = sorted.length > 0 && sorted[0].score > 0 ? sorted[0] : null;

  settlementData.value = {
    title,
    players: sorted,
    mvp,
    isWin: !!(mvp && mvp.userId === currentUserId.value)
  };
};

const closeSettlement = () => {
  settlementData.value = null;
  reLaunchPage('/pages/index/index');
};

const exitRoom = () => {
  moreActionsPopup.value = false;
  const msg = isRoomCreator.value
    ? '关闭后其他人会收到房间关闭通知，确定继续吗？'
    : '退出后你的历史分数会保留，但不会继续接收实时更新。';

  showConfirm('退出房间', msg, async () => {
    try {
      if (isRoomCreator.value) {
        await api.closeRoom({ roomId: roomId.value });
        socket.value?.emit('room-closed', {
          roomId: roomId.value,
          operatorUserId: currentUserId.value,
          message: '房主已关闭房间'
        });
      } else {
        await api.exitRoom({ roomId: roomId.value });
        socket.value?.emit('leave-room', roomId.value);
      }
      showSettlement(players.value, isRoomCreator.value ? '房间已关闭' : '退出结算');
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
    const targetUserId = selectedTargetId.value || '';
    await api.sendMessage({ roomId: roomId.value, content, type: 'user', targetUserId });
    message.value = '';
    floatingPanelVisible.value = false;
    await syncRoom();
    showChatBubble(currentUserId.value, content, targetUserId);
    socket.value?.emit('new-message', {
      roomId: roomId.value,
      userId: currentUserId.value,
      targetUserId,
      content,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
  }
};

const sendQuickReaction = async (content) => sendMessage(content);

const showChatBubble = (userId, content, targetUserId = '') => {
  const player = players.value.find(item => item.userId === userId);
  const name = player ? player.name : '系统';
  const audienceText = targetUserId ? ` 对 ${getPlayerName(targetUserId, '目标玩家')}` : ' 对全房';
  showTopToast(`${name}${audienceText}：${content}`);
};

const buildInteractionCaption = (payload) => {
  const fromName = getPlayerName(payload.fromUserId, '玩家');
  const toName = payload.toUserId ? getPlayerName(payload.toUserId, '目标玩家') : '';

  if (toName) {
    return `${fromName} 对 ${toName} 送出${payload.name || '互动'} ${payload.emoji}`;
  }
  return `${fromName} 对全部人员送出${payload.name || '互动'} ${payload.emoji}`;
};

const pushInteractionEffect = (payload) => {
  const interactionId = payload.interactionId || `interaction_${Date.now()}`;
  if (seenInteractionIds.has(interactionId)) return;
  seenInteractionIds.add(interactionId);

  const effect = {
    id: interactionId,
    emoji: payload.emoji,
    caption: buildInteractionCaption(payload),
    kind: payload.name || '',
    left: `${18 + Math.random() * 56}%`,
    top: `${22 + Math.random() * 38}%`
  };

  interactionEffects.value = [...interactionEffects.value, effect];
  showTopToast(effect.caption);

  setTimeout(() => {
    interactionEffects.value = interactionEffects.value.filter(item => item.id !== interactionId);
  }, 1400);
};

const sendInteraction = (tool) => {
  if (roomInfo.value.status !== 'active') {
    uni.showToast({ title: '牌局已结束', icon: 'none' });
    return;
  }

  const payload = {
    roomId: roomId.value,
    interactionId: `interaction_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    fromUserId: currentUserId.value,
    toUserId: selectedTargetId.value || '',
    emoji: tool.emoji,
    name: tool.name,
    timestamp: new Date().toISOString()
  };

  floatingPanelVisible.value = false;
  pushInteractionEffect(payload);
  socket.value?.emit('interaction', payload);
};

const openScoreModal = () => {
  if (roomInfo.value.status !== 'active') {
    uni.showToast({ title: '牌局已结束', icon: 'none' });
    return;
  }
  floatingPanelVisible.value = false;
  scoreModalVisible.value = true;
};

const openEditName = () => {
  editName.value = currentPlayerName.value;
  editNamePopup.value = true;
  moreActionsPopup.value = false;
};

const savePlayerName = async () => {
  if (!editName.value || editName.value.length < 2) {
    uni.showToast({ title: '昵称至少 2 位', icon: 'none' });
    return;
  }

  try {
    const latestName = editName.value;
    await api.updatePlayerName({ roomId: roomId.value, name: latestName });
    editNamePopup.value = false;
    await syncRoom();
    socket.value?.emit('player-updated', {
      roomId: roomId.value,
      userId: currentUserId.value,
      message: `${latestName} 更新了房间昵称`
    });
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
    socket.value?.emit('join-room', roomId.value);
  });

  socket.value.on('player-joined', refreshRoom);
  socket.value.on('player-left', refreshRoom);
  socket.value.on('score-updated', refreshRoom);

  socket.value.on('player-updated', async (data) => {
    if (data?.message) showTopToast(data.message);
    await refreshRoom();
  });

  socket.value.on('new-message', async (data) => {
    if (data?.userId && data?.content && data.userId !== currentUserId.value) {
      const senderName = getPlayerName(data.userId, '玩家');
      const audienceText = data.targetUserId ? ` 对 ${getPlayerName(data.targetUserId, '目标玩家')}` : ' 对全房';
      showTopToast(`${senderName}${audienceText}：${data.content}`);
    }
    await refreshRoom();
  });

  const handleInteraction = (data) => {
    if (!data?.emoji || !data?.fromUserId) return;
    pushInteractionEffect(data);
  };

  socket.value.on('room-interaction', handleInteraction);
  socket.value.on('interaction', handleInteraction);

  socket.value.on('room-settled', async () => {
    appendSystemMessage('房主已结算当前牌局');
    await refreshRoom();
    showSettlement(players.value, '牌局圆满结束');
  });

  socket.value.on('room-closed', async (data) => {
    appendSystemMessage(data?.message || '房主已关闭房间');
    await refreshRoom();
    showSettlement(players.value, '房间已关闭');
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
    if (!isRoomCreator.value) {
      await api.joinRoom({ roomId: roomId.value });
    }

    await syncRoom();
    initSocket();

    if (roomInfo.value.status !== 'active') {
      showSettlement(players.value, '牌局已结束');
    }
  } catch (error) {
    uni.showToast({ title: error.message || '进入房间失败', icon: 'none' });
  }
});

onUnmounted(() => {
  if (topToastTimer) clearTimeout(topToastTimer);
  if (socket.value) {
    socket.value.emit('leave-room', roomId.value);
    socket.value.disconnect();
  }
});
</script>

<style scoped lang="scss">
.room-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-gradient);
}

.top-toast {
  position: fixed;
  top: calc(env(safe-area-inset-top) + 14rpx);
  left: 50%;
  transform: translateX(-50%) translateY(-120%);
  max-width: calc(100vw - 80rpx);
  padding: 18rpx 34rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 120, 140, 0.96);
  color: #fff;
  font-size: 26rpx;
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  box-shadow: 0 16rpx 32rpx rgba(244, 114, 182, 0.28);
  opacity: 0;
  z-index: 60;
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.top-toast.show {
  transform: translateX(-50%) translateY(0);
  opacity: 1;
}

.page-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: calc(env(safe-area-inset-top) + 14rpx) 30rpx 14rpx;
  position: relative;
  z-index: 20;
}

.nav-title {
  flex: 1;
  display: flex;
  justify-content: center;
}

.title-text {
  max-width: 420rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nav-btn,
.top-action-btn,
.mini-chip,
.interaction-btn,
.quick-message-chip,
.setting-item,
.shortcut-chip,
.floating-fab {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-btn {
  min-width: 112rpx;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: var(--shadow-sm);
  color: var(--secondary-strong);
  font-size: 28rpx;
  font-weight: 700;
}

.top-function-card {
  margin: 0 30rpx 14rpx;
  padding: 24rpx;
  position: relative;
  z-index: 10;
}

.function-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.room-identity {
  flex: 1;
  min-width: 0;
}

.room-code-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.room-code-label {
  font-size: 24rpx;
  color: var(--text-sub);
}

.room-code {
  font-size: 36rpx;
  font-weight: 900;
  letter-spacing: 3rpx;
  color: var(--text-main);
}

.mini-chip {
  min-width: 88rpx;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: #fff6fb;
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 700;
}

.room-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}

.meta-chip {
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f4f7ff;
  color: var(--text-sub);
  font-size: 22rpx;
  font-weight: 700;
}

.meta-chip.accent {
  background: #fff0f6;
  color: var(--primary-strong);
}

.function-actions {
  display: flex;
  gap: 12rpx;
  flex-shrink: 0;
}

.top-action-btn {
  width: 98rpx;
  height: 98rpx;
  flex-direction: column;
  gap: 4rpx;
  border-radius: 28rpx;
  box-shadow: 0 12rpx 24rpx rgba(148, 163, 184, 0.14);
}

.share-btn {
  background: linear-gradient(180deg, #fff8fb, #ffe8f2);
  color: var(--primary-strong);
}

.settings-btn {
  background: linear-gradient(180deg, #f7fbff, #e8f1ff);
  color: var(--secondary-strong);
}

.action-icon {
  font-size: 30rpx;
}

.action-text {
  font-size: 22rpx;
  font-weight: 800;
}

.summary-strip {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.summary-pill {
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.76);
  border: 2rpx solid rgba(225, 233, 246, 0.86);
}

.summary-label {
  display: block;
  font-size: 22rpx;
  color: var(--text-light);
  margin-bottom: 8rpx;
}

.summary-value {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}

.summary-value.positive,
.player-score.positive,
.s-score.positive {
  color: #f43f5e;
}

.summary-value.negative,
.player-score.negative,
.s-score.negative {
  color: #10b981;
}

.target-context-bar {
  margin-top: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 2rpx solid rgba(224, 232, 246, 0.88);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.target-context-main {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.target-context-label {
  font-size: 22rpx;
  color: var(--text-light);
}

.target-context-value {
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
}

.target-clear-btn {
  min-width: 132rpx;
  height: 60rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #fff0f6;
  color: var(--primary-strong);
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.target-clear-btn.disabled {
  background: #f5f5f5;
  color: var(--text-light);
}

.player-list-section {
  padding-bottom: 12rpx;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 30rpx 12rpx;
}

.section-title {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}

.section-subtitle {
  font-size: 22rpx;
  color: var(--text-light);
}

.player-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
  padding: 0 30rpx;
}

.player-card {
  min-height: 196rpx;
  padding: 18rpx 16rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 12rpx 26rpx rgba(148, 163, 184, 0.14);
  border: 3rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.all-room-card {
  justify-content: center;
}

.all-room-card-head {
  display: flex;
  align-items: center;
  justify-content: center;
}

.all-room-icon {
  font-size: 46rpx;
  line-height: 92rpx;
}

.player-card.active {
  border-color: var(--primary);
  background: #fff;
  transform: translateY(-2rpx);
}

.player-card.self {
  background: linear-gradient(180deg, #ffffff, #f6fbff);
}

.player-card-head {
  position: relative;
  width: 92rpx;
  height: 92rpx;
}

.player-avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  background: #e2e8f0;
}

.player-tag {
  position: absolute;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 1.2;
}

.self-tag {
  left: -6rpx;
  top: -8rpx;
  background: #22c55e;
}

.leader-tag {
  right: -14rpx;
  top: -8rpx;
  background: #f59e0b;
}

.target-tag {
  left: 50%;
  bottom: -8rpx;
  transform: translateX(-50%);
  background: var(--primary);
}

.player-name {
  width: 100%;
  font-size: 24rpx;
  font-weight: 800;
  text-align: center;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-score {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-main);
}

.player-score.neutral {
  font-size: 22rpx;
  color: var(--text-light);
  text-align: center;
  line-height: 1.5;
}

.player-card-action {
  min-width: 88rpx;
  height: 44rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: #eef5ff;
  color: var(--secondary-strong);
  font-size: 20rpx;
  font-weight: 800;
}

.flow-stage-wrap {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0 30rpx 12rpx;
}

.flow-scroll {
  height: 100%;
}

.flow-card {
  min-height: 100%;
  padding-bottom: 20rpx;
  background: rgba(255, 255, 255, 0.72);
}

.flow-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 18rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 6rpx;
}

.flow-subtitle {
  font-size: 22rpx;
  color: var(--text-light);
}

.flow-counter {
  min-width: 108rpx;
  height: 56rpx;
  border-radius: 28rpx;
  background: #eef5ff;
  color: var(--secondary-strong);
  font-size: 24rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.broadcast-list,
.log-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.broadcast-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding: 18rpx 20rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.88);
}

.broadcast-main {
  flex: 1;
  min-width: 0;
}

.broadcast-content {
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--text-main);
}

.broadcast-prefix {
  color: var(--secondary-strong);
  font-weight: 800;
}

.broadcast-time {
  font-size: 22rpx;
  color: var(--text-light);
  white-space: nowrap;
}

.flow-divider {
  height: 2rpx;
  margin: 20rpx 0;
  background: rgba(148, 163, 184, 0.14);
}

.log-item {
  padding: 22rpx 20rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 20rpx rgba(148, 163, 184, 0.08);
}

.log-item.revoked {
  opacity: 0.58;
}

.log-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 8rpx;
}

.log-text {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  font-weight: 800;
  color: var(--text-main);
}

.log-time,
.log-sub,
.empty-hint {
  font-size: 22rpx;
  color: var(--text-light);
}

.empty-hint {
  text-align: center;
  padding: 80rpx 0;
}

.interaction-stage {
  position: absolute;
  inset: 0 30rpx 12rpx 30rpx;
  pointer-events: none;
  overflow: hidden;
  z-index: 12;
}

.interaction-effect {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  animation: interaction-burst 1.5s ease-out forwards;
}

.interaction-effect.bomb::before {
  content: '';
  position: absolute;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 180, 198, 0.32) 0%, rgba(255, 180, 198, 0) 68%);
  transform: translateZ(0);
  animation: bomb-wave 1.2s ease-out forwards;
  z-index: -1;
}

.effect-emoji {
  font-size: 124rpx;
  line-height: 1;
  filter: drop-shadow(0 16rpx 20rpx rgba(15, 23, 42, 0.14));
}

.effect-caption {
  max-width: 360rpx;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-main);
  font-size: 22rpx;
  font-weight: 700;
  text-align: center;
}

@keyframes interaction-burst {
  0% {
    opacity: 0;
    transform: translate(-50%, -12%) scale(0.45);
  }
  22% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.08);
  }
  72% {
    opacity: 1;
    transform: translate(-50%, -64%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -88%) scale(0.92);
  }
}

@keyframes bomb-wave {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  30% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.45);
  }
}

.bottom-wrapper {
  position: relative;
  z-index: 20;
  padding: 0 24rpx calc(18rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.94) 18%, #fff 100%);
  backdrop-filter: blur(18px);
}

.bottom-dock {
  padding: 10rpx 8rpx 0;
}

.chat-range-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 12rpx;
  padding: 0 6rpx;
}

.chat-range-label {
  font-size: 22rpx;
  color: var(--text-light);
}

.chat-range-value {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--primary-strong);
}

.interaction-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14rpx;
}

.interaction-btn {
  min-height: 110rpx;
  flex-direction: column;
  gap: 6rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #fff8fb, #fff1f5);
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.6);
}

.interaction-emoji {
  font-size: 44rpx;
}

.interaction-name {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--text-main);
}

.quick-message-list.floating-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.quick-message-chip {
  min-width: 144rpx;
  height: 64rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  background: #f5f8ff;
  color: var(--secondary-strong);
  font-size: 24rpx;
  font-weight: 700;
}

.chat-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.chat-input {
  flex: 1;
  height: 88rpx;
  border-radius: var(--radius-pill);
  font-size: 26rpx;
  background: #f4f6fa !important;
}

.chat-send-btn,
.score-open-btn {
  width: 146rpx;
  height: 88rpx;
  border-radius: var(--radius-pill);
  font-size: 28rpx;
  font-weight: 800;
}

.floating-action-stack {
  position: fixed;
  right: 24rpx;
  bottom: calc(142rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 14rpx;
  z-index: 50;
}

.floating-panel {
  width: 480rpx;
  padding: 20rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  border: 2rpx solid rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow-lg);
}

.floating-panel-head {
  margin-bottom: 16rpx;
}

.floating-title {
  display: block;
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
}

.floating-subtitle {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-sub);
}

.floating-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.floating-fab {
  min-width: 156rpx;
  height: 82rpx;
  padding: 0 24rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
  box-shadow: var(--shadow-accent);
}

.floating-fab.secondary {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  box-shadow: var(--shadow-primary);
}

.modal-mask,
.settlement-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;
  background: rgba(15, 23, 42, 0.34);
  backdrop-filter: blur(10px);
  z-index: 80;
}

.modal-panel {
  width: 100%;
  max-width: 640rpx;
}

.modal-title {
  font-size: 34rpx;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 18rpx;
}

.modal-desc {
  font-size: 26rpx;
  color: var(--text-sub);
  margin-bottom: 28rpx;
}

.confirm-desc {
  margin-bottom: 38rpx;
}

.highlight {
  color: var(--primary-strong);
  font-weight: 800;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.target-picker {
  margin-bottom: 24rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: #fff8fb;
}

.target-picker-head {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  margin-bottom: 14rpx;
}

.target-picker-title {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--text-main);
}

.target-picker-tip {
  font-size: 22rpx;
  color: var(--text-light);
}

.target-picker-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.target-player-chip {
  min-height: 64rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #ffffff;
  color: var(--text-sub);
  font-size: 24rpx;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.target-player-chip.active {
  background: var(--primary);
  color: #fff;
}

.target-player-chip.room-chip {
  background: #f4f6fa;
}

.shortcut-chip {
  height: 88rpx;
  border-radius: 24rpx;
  background: #f5f8ff;
  color: var(--secondary-strong);
  font-size: 34rpx;
  font-weight: 900;
}

.custom-row,
.modal-actions {
  display: flex;
  gap: 16rpx;
}

.custom-row {
  margin-bottom: 24rpx;
}

.custom-row .macaron-input {
  flex: 1;
}

.custom-btn {
  width: 160rpx;
}

.close-score-btn {
  width: 100%;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.setting-item {
  min-height: 92rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: var(--text-main);
  font-size: 28rpx;
  font-weight: 700;
}

.setting-item.danger {
  background: #fff1f2;
  color: #e11d48;
}

.settlement-modal {
  width: 640rpx;
  padding: 40rpx;
  border-radius: 40rpx;
  background: linear-gradient(to bottom, #fff, #f8fafc);
  box-shadow: 0 24rpx 56rpx rgba(15, 23, 42, 0.24);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.settlement-modal.win-bg {
  background: linear-gradient(to bottom, #fff0f2, #fff);
  border: 4rpx solid #ffd6df;
}

.s-title-img {
  font-size: 46rpx;
  font-weight: 900;
  color: #f43f5e;
  margin-bottom: 18rpx;
}

.s-mvp {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 12rpx 28rpx;
  margin-bottom: 28rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #ffb3ba, #ffdbe5);
  box-shadow: 0 10rpx 18rpx rgba(255, 179, 186, 0.34);
}

.crown {
  font-size: 38rpx;
}

.mvp-name,
.mvp-score {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}

.s-list {
  width: 100%;
  max-height: 500rpx;
  margin-bottom: 24rpx;
}

.s-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.88);
  margin-bottom: 12rpx;
}

.s-rank {
  width: 48rpx;
  font-size: 30rpx;
  font-weight: 900;
  color: var(--secondary);
}

.s-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
}

.s-name {
  flex: 1;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}

.s-score {
  font-size: 34rpx;
  font-weight: 900;
}

.s-btn {
  width: 100%;
  border-radius: 999rpx;
  font-size: 30rpx;
  font-weight: 800;
}

@media (max-width: 380px) {
  .function-main,
  .chat-row,
  .log-main,
  .broadcast-item,
  .target-context-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .summary-strip,
  .player-grid,
  .interaction-list,
  .floating-list,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .function-actions,
  .chat-send-btn,
  .score-open-btn,
  .floating-panel {
    width: 100%;
  }

  .top-action-btn {
    flex: 1;
  }

  .floating-action-stack {
    left: 24rpx;
    right: 24rpx;
    align-items: stretch;
  }
}
</style>
