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

    <view class="macaron-card top-overview-card">
      <view class="overview-head">
        <view class="overview-main">
          <view class="room-code-row">
            <text class="room-code-label">房间号</text>
            <text class="room-code">{{ roomId || '--' }}</text>
          </view>
          <view class="room-meta-line">
            <text class="meta-chip accent">{{ roomStatusText }}</text>
            <text class="meta-chip">{{ roomRoleText }}</text>
            <text class="meta-chip">{{ playerCount }} 人在线</text>
            <text class="meta-chip">我 {{ formatScore(currentPlayer?.score || 0) }}</text>
          </view>
        </view>
        <view class="overview-side">
          <text class="overview-leader-label">当前领先</text>
          <text class="overview-leader-name">{{ leaderPlayer ? leaderPlayer.name : '暂无' }}</text>
        </view>
      </view>

      <view class="top-entry-grid">
        <view class="entry-btn accent" @click="openRoomInfoPopup">
          <text class="entry-name">房间信息</text>
          <text class="entry-desc">房号 邀请 状态</text>
        </view>
        <view class="entry-btn secondary" @click="openLeaderboardPopup">
          <text class="entry-name">排行榜</text>
          <text class="entry-desc">名次 提醒领先</text>
        </view>
        <view class="entry-btn neutral" @click="openMoreActionsPopup">
          <text class="entry-name">更多功能</text>
          <text class="entry-desc">撤回 刷新 退出</text>
        </view>
      </view>

      <view class="target-strip">
        <view class="target-strip-main">
          <text class="target-strip-label">当前操作对象</text>
          <text class="target-strip-value">{{ selectedTargetName || '未指定，默认对全桌' }}</text>
        </view>
        <view
          v-if="roomInfo.status === 'active'"
          class="target-clear-btn"
          :class="{ disabled: !selectedTargetId }"
          @click="clearSelectedTarget"
        >
          发给全桌
        </view>
      </view>
    </view>

    <view class="player-compact-section">
      <view class="section-head">
        <text class="section-title">玩家区</text>
        <text class="section-subtitle">{{ currentAudienceShortText }}</text>
      </view>
      <view class="player-chip-wrap">
        <view
          class="player-chip broadcast-chip"
          :class="{ active: !selectedTargetId }"
          @click="clearSelectedTarget"
        >
          <view class="player-chip-head">
            <text class="player-chip-name">全桌</text>
            <text class="player-chip-tag pink-tag">广播</text>
          </view>
          <text class="player-chip-score neutral">消息和互动发给所有人</text>
        </view>

        <view
          v-for="player in players"
          :key="player.userId"
          class="player-chip"
          :class="{
            active: selectedTargetId === player.userId,
            self: player.userId === currentUserId
          }"
          @click="selectTarget(player.userId)"
        >
          <view class="player-chip-top">
            <image class="player-avatar" :src="getAvatarSrc(player)" mode="aspectFill" />
            <view class="player-chip-badges">
              <text v-if="player.userId === currentUserId" class="player-chip-tag green-tag">我</text>
              <text v-else-if="leaderPlayer && leaderPlayer.userId === player.userId" class="player-chip-tag gold-tag">领先</text>
              <text v-if="selectedTargetId === player.userId" class="player-chip-tag pink-tag">已选</text>
            </view>
          </view>
          <view class="player-chip-info">
            <text class="player-chip-name">{{ player.name }}</text>
            <text class="player-chip-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
              {{ formatScore(player.score) }}
            </text>
          </view>
          <view
            v-if="player.userId !== currentUserId && roomInfo.status === 'active'"
            class="player-chip-action"
            @click.stop="handleTakeover(player)"
          >
            接管
          </view>
        </view>
      </view>
    </view>

    <view class="feed-section">
      <view class="macaron-card feed-card">
        <view class="feed-head">
          <view>
            <view class="card-title">房间流水</view>
            <view class="feed-subtitle">像聊天一样看最新消息和记分记录</view>
          </view>
          <view class="feed-counter">{{ flowItems.length }} 条</view>
        </view>

        <scroll-view
          class="feed-scroll"
          scroll-y
          scroll-with-animation
          :scroll-into-view="feedScrollAnchor"
        >
          <view v-if="flowItems.length" class="feed-list">
            <view
              v-for="item in flowItems"
              :id="item.scrollId"
              :key="item.scrollId"
              class="feed-item"
              :class="[item.kind, { revoked: item.kind === 'score' && item.data.isRevoked }]"
            >
              <view class="feed-bubble">
                <view class="feed-item-head">
                  <text class="feed-item-type">{{ item.kind === 'message' ? '消息' : '记分' }}</text>
                  <text class="feed-item-time">{{ formatTime(item.timestamp) }}</text>
                </view>
                <text class="feed-item-main">{{ getFlowPrimaryText(item) }}</text>
                <text v-if="getFlowSecondaryText(item)" class="feed-item-sub">{{ getFlowSecondaryText(item) }}</text>
              </view>
            </view>
          </view>
          <view v-else class="empty-hint">还没有房间流水，先聊一句或者先记一笔分。</view>
        </scroll-view>
      </view>

      <view class="interaction-stage">
        <view
          v-for="effect in interactionEffects"
          :key="effect.id"
          class="interaction-effect"
          :class="{ bomb: effect.kind === '炸弹' }"
          :style="{ left: effect.left, top: effect.top }"
        >
          <view class="effect-pulse"></view>
          <text class="effect-emoji">{{ effect.emoji }}</text>
          <text class="effect-caption">{{ effect.caption }}</text>
        </view>
      </view>
    </view>

    <view v-if="floatingPanelVisible" class="floating-dismiss" @click="floatingPanelVisible = false"></view>

    <view class="floating-edge-stack">
      <view v-if="floatingPanelVisible" class="floating-edge-panel">
        <view class="floating-panel-head">
          <text class="floating-title">{{ floatingPanelMode === 'interaction' ? '快捷互动' : '快捷话术' }}</text>
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

      <view class="floating-edge-tabs">
        <view class="floating-edge-tab secondary" @click="toggleFloatingPanel('message')">
          话术
        </view>
        <view class="floating-edge-tab" @click="toggleFloatingPanel('interaction')">
          互动
        </view>
      </view>
    </view>

    <view class="bottom-wrapper">
      <view class="bottom-dock">
        <view class="chat-range-bar">
          <text class="chat-range-label">这条消息发给谁</text>
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

    <view v-if="scoreModalVisible" class="modal-mask" @click="scoreModalVisible = false">
      <view class="macaron-card modal-panel score-modal" @click.stop>
        <view class="modal-title">计分</view>
        <view class="modal-desc">
          从 <text class="highlight">{{ currentPlayerName }}</text> 记给
          <text class="highlight">{{ selectedTargetName || '请选择目标玩家' }}</text>
        </view>

        <view class="target-picker">
          <view class="target-picker-head">
            <text class="target-picker-title">选择记分对象</text>
            <text class="target-picker-tip">这里和页面上的选择保持同步</text>
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

    <view v-if="roomInfoPopup" class="modal-mask" @click="roomInfoPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">房间信息</view>
        <view class="info-grid">
          <view class="info-card">
            <text class="info-label">房间号</text>
            <text class="info-value">{{ roomId || '--' }}</text>
          </view>
          <view class="info-card">
            <text class="info-label">房间状态</text>
            <text class="info-value">{{ roomStatusText }}</text>
          </view>
          <view class="info-card">
            <text class="info-label">我的身份</text>
            <text class="info-value">{{ roomRoleText }}</text>
          </view>
          <view class="info-card">
            <text class="info-label">在线人数</text>
            <text class="info-value">{{ playerCount }} 人</text>
          </view>
          <view class="info-card">
            <text class="info-label">当前领先</text>
            <text class="info-value">{{ leaderPlayer ? leaderPlayer.name : '暂无' }}</text>
          </view>
          <view class="info-card">
            <text class="info-label">我的分数</text>
            <text class="info-value">{{ formatScore(currentPlayer?.score || 0) }}</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="copyRoomCode">复制房间号</button>
          <button class="macaron-btn" @click="copyShareLink">复制邀请链接</button>
        </view>
      </view>
    </view>

    <view v-if="leaderboardPopup" class="modal-mask" @click="leaderboardPopup = false">
      <view class="macaron-card modal-panel leaderboard-modal" @click.stop>
        <view class="modal-title">排行榜</view>
        <view class="leaderboard-list">
          <view
            v-for="(player, index) in orderedPlayers"
            :key="player.userId"
            class="leaderboard-item"
            :class="{ leader: index === 0, self: player.userId === currentUserId }"
          >
            <view class="leaderboard-rank">#{{ index + 1 }}</view>
            <image class="leaderboard-avatar" :src="getAvatarSrc(player)" mode="aspectFill" />
            <view class="leaderboard-main">
              <view class="leaderboard-name-row">
                <text class="leaderboard-name">{{ player.name }}</text>
                <text v-if="player.userId === currentUserId" class="leaderboard-tag self-tag">我</text>
                <text v-if="index === 0" class="leaderboard-tag leader-tag">领先</text>
              </view>
              <text class="leaderboard-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
                {{ formatScore(player.score) }}
              </text>
            </view>
          </view>
        </view>
        <view class="leaderboard-notice">
          <text class="leaderboard-notice-title">提醒一下全桌</text>
          <text class="leaderboard-notice-text">{{ leaderReminderText }}</text>
          <button class="macaron-btn notice-btn" @click="sendLeaderReminder">提醒大家关注领先者</button>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="leaderboardPopup = false">关闭</button>
        </view>
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
          <view
            v-if="roomInfo.status === 'active'"
            class="setting-item"
            :class="{ disabled: !revokeActionState.enabled }"
            @click="handleRevokeLastScore"
          >
            <view class="setting-copy">
              <text class="st-title">{{ revokeActionState.title }}</text>
              <text class="st-desc">{{ revokeActionState.desc }}</text>
            </view>
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
            <image class="s-avatar" :src="getAvatarSrc(p)" mode="aspectFill" />
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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import io from 'socket.io-client';
import { currentConfig } from '../../config/env';
import { api } from '../../utils/api';
import { resolveAvatarUrl } from '../../utils/avatar';
import {
  getRoomPageUrl,
  getRoomShareLink,
  navigateBackOrPage,
  reLaunchPage,
  redirectToLogin
} from '../../utils/auth';

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
const roomInfoPopup = ref(false);
const leaderboardPopup = ref(false);
const moreActionsPopup = ref(false);
const scoreModalVisible = ref(false);
const topToastMessage = ref('');
const interactionEffects = ref([]);
const editName = ref('');
const settlementData = ref(null);
const floatingPanelVisible = ref(false);
const floatingPanelMode = ref('interaction');
const feedScrollAnchor = ref('');
const seenInteractionIds = new Set();
const ignoredSocketEventKeys = new Set();
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
const latestRevocableScore = computed(() => scoreHistory.value.find(item => !item.isRevoked) || null);
const currentAudienceShortText = computed(() => {
  if (roomInfo.value.status !== 'active') {
    return '牌局已结束';
  }
  return selectedTargetName.value ? `当前只对 ${selectedTargetName.value}` : '当前对全桌';
});
const currentAudienceHint = computed(() => {
  if (roomInfo.value.status !== 'active') {
    return '牌局已结束，只看记录';
  }
  return selectedTargetName.value ? `只发给 ${selectedTargetName.value}` : '发给全桌所有人';
});
const messagePlaceholder = computed(() => (selectedTargetName.value ? `发给 ${selectedTargetName.value} 的话` : '发给全桌的话'));
const leaderReminderText = computed(() => {
  if (!leaderPlayer.value) {
    return '现在还没有明确领先的人。';
  }
  return `当前领先的是 ${leaderPlayer.value.name}，可以提醒大家盯一下分差。`;
});
const revokeActionState = computed(() => {
  const latestRecord = latestRevocableScore.value;
  if (!latestRecord) {
    return {
      title: '撤回上一笔',
      desc: '当前没有可撤回的记分记录',
      enabled: false,
      action: '',
      isDanger: false
    };
  }

  const requesterName = getPlayerName(latestRecord.fromUserId, '记分方');
  const approverName = getPlayerName(latestRecord.toUserId, '被记分方');
  const isRequester = currentUserId.value === latestRecord.fromUserId;
  const isApprover = currentUserId.value === latestRecord.toUserId;

  if (latestRecord.revokeRequestStatus === 'pending') {
    if (currentUserId.value === latestRecord.revokeRequestedBy) {
      return {
        title: '撤回申请待确认',
        desc: `已提交给 ${approverName}，等待对方确认`,
        enabled: false,
        action: '',
        isDanger: false
      };
    }

    if (isApprover) {
      return {
        title: '确认撤回上一笔',
        desc: `${requesterName} 申请撤回这笔 ${formatScore(latestRecord.score)} 记分，点此确认`,
        enabled: true,
        action: 'approve',
        isDanger: true
      };
    }

    return {
      title: '撤回处理中',
      desc: `这笔记分正在等待 ${approverName} 确认`,
      enabled: false,
      action: '',
      isDanger: false
    };
  }

  if (isRequester) {
    return {
      title: '申请撤回上一笔',
      desc: `你记给 ${approverName} 的 ${formatScore(latestRecord.score)} 可发起撤回申请`,
      enabled: true,
      action: 'request',
      isDanger: false
    };
  }

  if (isApprover) {
    return {
      title: '等待对方发起撤回',
      desc: `这笔分由 ${requesterName} 记给你，需对方先发起撤回申请`,
      enabled: false,
      action: '',
      isDanger: false
    };
  }

  return {
    title: '撤回上一笔',
    desc: '只有这笔记分的双方可以处理撤回',
    enabled: false,
    action: '',
    isDanger: false
  };
});
const flowItems = computed(() => {
  const scoreItems = scoreHistory.value.map((item, index) => ({
    kind: 'score',
    data: item,
    timestamp: item.timestamp,
    sortTime: new Date(item.timestamp).getTime() || 0,
    scrollId: `flow-score-${item.id || index}`
  }));
  const messageItems = messages.value.map((item, index) => ({
    kind: 'message',
    data: item,
    timestamp: item.timestamp,
    sortTime: new Date(item.timestamp).getTime() || 0,
    scrollId: `flow-message-${item.id || index}`
  }));

  return [...scoreItems, ...messageItems].sort((a, b) => {
    if (a.sortTime === b.sortTime) {
      return a.kind === 'score' ? -1 : 1;
    }
    return a.sortTime - b.sortTime;
  });
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
const getAvatarSrc = (user = {}) => resolveAvatarUrl({
  avatarUrl: user?.avatar || user?.avatarUrl,
  uid: user?.userId || user?.uid,
  phone: user?.phone,
  nickName: user?.name || user?.nickName
});

const getPlayerName = (userId, fallback = '玩家') => {
  if (!userId) {
    return fallback;
  }
  return players.value.find(item => item.userId === userId)?.name || fallback;
};

const getScoreText = (item) => {
  const fromName = players.value.find(player => player.userId === item.fromUserId)?.name || '玩家';
  const toName = players.value.find(player => player.userId === item.toUserId)?.name || '玩家';
  return `${fromName} 给 ${toName} 记了 ${formatScore(item.score)}`;
};

const getScoreDetailText = (item) => {
  if (item.isRevoked) {
    const approver = getPlayerName(item.toUserId, '相关玩家');
    return item.revokeRequestStatus === 'approved'
      ? `${approver} 已确认撤回，这笔记分已作废`
      : '这笔记分已撤回';
  }
  if (item.revokeRequestStatus === 'pending') {
    const requester = getPlayerName(item.revokeRequestedBy || item.fromUserId, '相关玩家');
    const approver = getPlayerName(item.toUserId, '目标玩家');
    if (currentUserId.value === item.toUserId) {
      return `${requester} 已申请撤回，正在等你确认`;
    }
    return `${requester} 发起了撤回申请，等待 ${approver} 确认`;
  }
  return `记分后比分：${formatScore(item.fromUserScoreAfter)} / ${formatScore(item.toUserScoreAfter)}`;
};

const getMessageAudienceText = (item) => {
  const speaker = item?.userName || getPlayerName(item?.userId, '玩家');
  if (!item?.targetUserId) {
    return `${speaker} 发给全桌`;
  }
  return `${speaker} 只发给 ${getPlayerName(item.targetUserId, '目标玩家')}`;
};

const getFlowPrimaryText = (item) => {
  if (item.kind === 'score') {
    return getScoreText(item.data);
  }
  return `${getMessageAudienceText(item.data)}：${item.data.content}`;
};

const getFlowSecondaryText = (item) => {
  if (item.kind === 'score') {
    return getScoreDetailText(item.data);
  }
  return item.data.targetUserId ? '私下提醒' : '全桌可见';
};

const appendSystemMessage = (content) => {
  messages.value.push({
    id: `local_${Date.now()}`,
    userId: '',
    userName: '系统',
    content,
    targetUserId: '',
    targetScope: 'room',
    timestamp: new Date().toISOString()
  });
};

const scrollFeedToLatest = async () => {
  const latestItem = flowItems.value[flowItems.value.length - 1];
  if (!latestItem) {
    feedScrollAnchor.value = '';
    return;
  }
  feedScrollAnchor.value = '';
  await nextTick();
  feedScrollAnchor.value = latestItem.scrollId;
};

watch(
  () => flowItems.value.map(item => `${item.scrollId}-${item.timestamp}`).join('|'),
  async () => {
    await scrollFeedToLatest();
  },
  { immediate: true }
);

const showTopToast = (msg) => {
  topToastMessage.value = msg;
  if (topToastTimer) clearTimeout(topToastTimer);
  topToastTimer = setTimeout(() => {
    topToastMessage.value = '';
  }, 2500);
};

const markIgnoredSocketEvent = (key) => {
  if (!key) return;
  ignoredSocketEventKeys.add(key);
  setTimeout(() => {
    ignoredSocketEventKeys.delete(key);
  }, 5000);
};

const shouldIgnoreSocketEvent = (key) => {
  if (!key || !ignoredSocketEventKeys.has(key)) {
    return false;
  }
  ignoredSocketEventKeys.delete(key);
  return true;
};

const getLeaderboardNoticeKey = (payload) => payload?.messageId ? `leaderboard-${payload.messageId}` : '';
const getRevokeEventKey = (payload) => {
  const historyId = payload?.history?.id || '';
  const action = payload?.action || '';
  const status = payload?.status || '';
  return historyId ? `revoke-${historyId}-${action}-${status}` : '';
};

const syncRoomQuietly = async () => {
  try {
    await syncRoom();
  } catch (error) {
    console.error('sync room by socket failed', error);
  }
};

const openRoomInfoPopup = () => {
  floatingPanelVisible.value = false;
  leaderboardPopup.value = false;
  moreActionsPopup.value = false;
  roomInfoPopup.value = true;
};

const openLeaderboardPopup = () => {
  floatingPanelVisible.value = false;
  roomInfoPopup.value = false;
  moreActionsPopup.value = false;
  leaderboardPopup.value = true;
};

const openMoreActionsPopup = () => {
  floatingPanelVisible.value = false;
  roomInfoPopup.value = false;
  leaderboardPopup.value = false;
  moreActionsPopup.value = true;
};

const copyRoomCode = () => {
  if (!roomId.value) return;
  roomInfoPopup.value = false;
  moreActionsPopup.value = false;
  uni.setClipboardData({
    data: roomId.value,
    success: () => uni.showToast({ title: '房间号已复制', icon: 'success' })
  });
};

const copyShareLink = () => {
  roomInfoPopup.value = false;
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
  moreActionsPopup.value = false;
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
  roomInfoPopup.value = false;
  leaderboardPopup.value = false;
  moreActionsPopup.value = false;
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

const handleRevokeLastScore = async () => {
  moreActionsPopup.value = false;
  if (!revokeActionState.value.enabled) {
    uni.showToast({ title: revokeActionState.value.desc, icon: 'none' });
    return;
  }

  const action = revokeActionState.value.action;
  const latestRecord = latestRevocableScore.value;
  const confirmTitle = action === 'approve' ? '确认撤回上一笔' : '申请撤回上一笔';
  const confirmContent = action === 'approve'
    ? `确认后会撤销这笔 ${formatScore(latestRecord?.score || 0)} 记分，并恢复双方分数。`
    : `将向 ${getPlayerName(latestRecord?.toUserId, '对方')} 发起撤回申请，等待对方确认。`;

  showConfirm(confirmTitle, confirmContent, async () => {
    try {
      const result = await api.revokeScore({ roomId: roomId.value, action });
      markIgnoredSocketEvent(getRevokeEventKey(result));
      await syncRoom();
      const successText = action === 'approve'
        ? '已确认撤回上一笔'
        : `已发起撤回申请，等待 ${getPlayerName(latestRecord?.toUserId, '对方')} 确认`;
      uni.showToast({ title: successText, icon: 'none' });
    } catch (error) {
      uni.showToast({ title: error.message || '撤回失败', icon: 'none' });
    }
  }, action === 'approve');
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

const sendMessage = async (contentOverride = '', options = {}) => {
  const content = contentOverride || message.value;
  if (!content) return false;

  try {
    const targetUserId = options.forceRoom ? '' : (selectedTargetId.value || '');
    await api.sendMessage({ roomId: roomId.value, content, type: 'user', targetUserId });
    if (!contentOverride) {
      message.value = '';
    }
    if (!options.keepPanel) {
      floatingPanelVisible.value = false;
    }
    await syncRoom();
    showChatBubble(currentUserId.value, content, targetUserId);
    socket.value?.emit('new-message', {
      roomId: roomId.value,
      userId: currentUserId.value,
      targetUserId,
      content,
      timestamp: new Date().toISOString()
    });
    return true;
  } catch (error) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
    return false;
  }
};

const sendQuickReaction = async (content) => {
  await sendMessage(content);
};

const sendLeaderReminder = async () => {
  if (roomInfo.value.status !== 'active') {
    uni.showToast({ title: '牌局已结束', icon: 'none' });
    return;
  }
  if (!leaderPlayer.value) {
    uni.showToast({ title: '还没有领先者', icon: 'none' });
    return;
  }

  try {
    const result = await api.sendLeaderboardNotice({ roomId: roomId.value });
    markIgnoredSocketEvent(getLeaderboardNoticeKey(result));
    await syncRoom();
    leaderboardPopup.value = false;
    uni.showToast({ title: '已提醒全桌', icon: 'none' });
  } catch (error) {
    uni.showToast({ title: error.message || '发送失败', icon: 'none' });
  }
};

const buildRevokeSocketMessage = (payload) => {
  if (payload?.message) {
    return payload.message;
  }
  const requester = getPlayerName(payload?.requesterUserId || payload?.history?.fromUserId, '记分方');
  const approver = getPlayerName(payload?.approverUserId || payload?.history?.toUserId, '被记分方');
  if (payload?.status === 'pending') {
    return `${requester} 发起了撤回申请，等待 ${approver} 确认`;
  }
  return `${approver} 已确认撤回上一笔记分`;
};

const showChatBubble = (userId, content, targetUserId = '') => {
  const player = players.value.find(item => item.userId === userId);
  const name = player ? player.name : '系统';
  const audienceText = targetUserId ? ` 发给 ${getPlayerName(targetUserId, '目标玩家')}` : ' 发给全桌';
  showTopToast(`${name}${audienceText}：${content}`);
};

const buildInteractionCaption = (payload) => {
  const fromName = getPlayerName(payload.fromUserId, '玩家');
  const toName = payload.toUserId ? getPlayerName(payload.toUserId, '目标玩家') : '';

  if (toName) {
    return `${fromName} 对 ${toName} 送出${payload.name || '互动'} ${payload.emoji}`;
  }
  return `${fromName} 对全桌送出${payload.name || '互动'} ${payload.emoji}`;
};

const pushInteractionEffect = (payload) => {
  const interactionId = payload.interactionId || `interaction_${Date.now()}`;
  if (seenInteractionIds.has(interactionId)) return;
  seenInteractionIds.add(interactionId);

  const horizontalOffset = (Math.random() - 0.5) * 18;
  const verticalOffset = (Math.random() - 0.5) * 12;
  const effect = {
    id: interactionId,
    emoji: payload.emoji,
    caption: buildInteractionCaption(payload),
    kind: payload.name || '',
    left: `${50 + horizontalOffset}%`,
    top: `${48 + verticalOffset}%`
  };

  interactionEffects.value = [...interactionEffects.value, effect];
  showTopToast(effect.caption);

  setTimeout(() => {
    interactionEffects.value = interactionEffects.value.filter(item => item.id !== interactionId);
  }, 1600);
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

  socket.value.on('player-joined', syncRoomQuietly);
  socket.value.on('player-left', syncRoomQuietly);
  socket.value.on('score-updated', syncRoomQuietly);

  socket.value.on('player-updated', async (data) => {
    const messageText = data?.message || '';
    if (/撤回申请|确认撤回|撤回上一笔记分/.test(messageText)) {
      return;
    }
    if (messageText) showTopToast(messageText);
    await syncRoomQuietly();
  });

  socket.value.on('new-message', async (data) => {
    if (data?.noticeType === 'leaderboard') {
      return;
    }
    if (data?.userId === currentUserId.value) {
      return;
    }
    if (data?.userId && data?.content && data.userId !== currentUserId.value) {
      const senderName = getPlayerName(data.userId, '玩家');
      const audienceText = data.targetUserId ? ` 发给 ${getPlayerName(data.targetUserId, '目标玩家')}` : ' 发给全桌';
      showTopToast(`${senderName}${audienceText}：${data.content}`);
    }
    await syncRoomQuietly();
  });

  socket.value.on('leaderboard-notice', async (data) => {
    if (shouldIgnoreSocketEvent(getLeaderboardNoticeKey(data))) {
      return;
    }
    if (data?.content) {
      showTopToast(data.content);
    }
    await syncRoomQuietly();
  });

  socket.value.on('score-revoke-requested', async (data) => {
    if (shouldIgnoreSocketEvent(getRevokeEventKey(data))) {
      return;
    }
    showTopToast(buildRevokeSocketMessage(data));
    await syncRoomQuietly();
  });

  socket.value.on('score-revoked', async (data) => {
    if (shouldIgnoreSocketEvent(getRevokeEventKey(data))) {
      return;
    }
    showTopToast(buildRevokeSocketMessage(data));
    await syncRoomQuietly();
  });

  const handleInteraction = (data) => {
    if (!data?.emoji || !data?.fromUserId) return;
    pushInteractionEffect(data);
  };

  socket.value.on('room-interaction', handleInteraction);
  socket.value.on('interaction', handleInteraction);

  socket.value.on('room-settled', async () => {
    appendSystemMessage('房主已结算当前牌局');
    await syncRoomQuietly();
    showSettlement(players.value, '牌局圆满结束');
  });

  socket.value.on('room-closed', async (data) => {
    appendSystemMessage(data?.message || '房主已关闭房间');
    await syncRoomQuietly();
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
  z-index: 90;
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
.entry-btn,
.interaction-btn,
.quick-message-chip,
.setting-item,
.shortcut-chip,
.floating-edge-tab,
.player-chip-action,
.target-clear-btn,
.notice-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
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

.top-overview-card {
  margin: 0 24rpx 12rpx;
  padding: 22rpx;
  position: relative;
  z-index: 10;
}

.overview-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.overview-main {
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
  font-size: 22rpx;
  color: var(--text-sub);
}

.room-code {
  font-size: 34rpx;
  font-weight: 900;
  letter-spacing: 3rpx;
  color: var(--text-main);
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

.overview-side {
  min-width: 154rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.72);
  text-align: right;
}

.overview-leader-label {
  display: block;
  font-size: 20rpx;
  color: var(--text-light);
}

.overview-leader-name {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
}

.top-entry-grid {
  margin-top: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.entry-btn {
  min-height: 116rpx;
  padding: 16rpx;
  border-radius: 26rpx;
  flex-direction: column;
  gap: 8rpx;
  box-shadow: 0 12rpx 24rpx rgba(148, 163, 184, 0.12);
}

.entry-btn.accent {
  background: linear-gradient(180deg, #fff8fb, #ffe8f2);
}

.entry-btn.secondary {
  background: linear-gradient(180deg, #f8fbff, #e8f2ff);
}

.entry-btn.neutral {
  background: linear-gradient(180deg, #fffef8, #fff7de);
}

.entry-name {
  font-size: 26rpx;
  font-weight: 900;
  color: var(--text-main);
}

.entry-desc {
  font-size: 20rpx;
  color: var(--text-light);
}

.target-strip {
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.78);
  border: 2rpx solid rgba(224, 232, 246, 0.88);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.target-strip-main {
  flex: 1;
  min-width: 0;
}

.target-strip-label {
  display: block;
  font-size: 22rpx;
  color: var(--text-light);
}

.target-strip-value {
  display: block;
  margin-top: 6rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-clear-btn {
  min-width: 136rpx;
  height: 60rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: #fff0f6;
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.target-clear-btn.disabled {
  background: #f3f4f6;
  color: var(--text-light);
}

.player-compact-section {
  padding: 0 24rpx 12rpx;
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 6rpx 12rpx;
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

.player-chip-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.player-chip {
  width: calc(50% - 6rpx);
  min-height: 142rpx;
  padding: 14rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 10rpx 22rpx rgba(148, 163, 184, 0.12);
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.player-chip.active {
  border-color: var(--primary);
  background: #fff;
}

.player-chip.self {
  background: linear-gradient(180deg, #ffffff, #f6fbff);
}

.broadcast-chip {
  justify-content: center;
}

.player-chip-top,
.player-chip-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.player-avatar,
.leaderboard-avatar {
  width: 62rpx;
  height: 62rpx;
  border-radius: 20rpx;
  background: #e2e8f0;
  flex-shrink: 0;
}

.player-chip-badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8rpx;
}

.player-chip-tag,
.leaderboard-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 1.2;
}

.pink-tag {
  background: var(--primary);
}

.green-tag,
.self-tag {
  background: #22c55e;
}

.gold-tag,
.leader-tag {
  background: #f59e0b;
}

.player-chip-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.player-chip-name {
  flex: 1;
  min-width: 0;
  font-size: 24rpx;
  font-weight: 800;
  color: var(--text-main);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-chip-score,
.leaderboard-score {
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
}

.player-chip-score.neutral {
  font-size: 22rpx;
  color: var(--text-light);
}

.player-chip-score.positive,
.leaderboard-score.positive,
.s-score.positive {
  color: #f43f5e;
}

.player-chip-score.negative,
.leaderboard-score.negative,
.s-score.negative {
  color: #10b981;
}

.player-chip-action {
  align-self: flex-end;
  min-width: 82rpx;
  height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: #eef5ff;
  color: var(--secondary-strong);
  font-size: 20rpx;
  font-weight: 800;
}

.feed-section {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0 24rpx 12rpx;
}

.feed-card {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.72);
}

.feed-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding-bottom: 18rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 6rpx;
}

.feed-subtitle {
  font-size: 22rpx;
  color: var(--text-light);
}

.feed-counter {
  min-width: 108rpx;
  height: 56rpx;
  border-radius: 28rpx;
  background: #eef5ff;
  color: var(--secondary-strong);
  font-size: 24rpx;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.feed-scroll {
  flex: 1;
  min-height: 0;
  padding-right: 4rpx;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  padding-bottom: 6rpx;
}

.feed-item {
  display: flex;
}

.feed-item.message {
  justify-content: flex-start;
}

.feed-item.score {
  justify-content: flex-end;
}

.feed-bubble {
  max-width: 88%;
  padding: 18rpx 20rpx;
  border-radius: 26rpx;
  box-shadow: 0 10rpx 22rpx rgba(148, 163, 184, 0.12);
}

.feed-item.message .feed-bubble {
  background: rgba(255, 255, 255, 0.92);
  border-top-left-radius: 12rpx;
}

.feed-item.score .feed-bubble {
  background: linear-gradient(180deg, #fff7fb, #ffffff);
  border-top-right-radius: 12rpx;
}

.feed-item.revoked .feed-bubble {
  opacity: 0.6;
}

.feed-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 10rpx;
}

.feed-item-type {
  font-size: 20rpx;
  font-weight: 800;
  color: var(--secondary-strong);
}

.feed-item-time,
.feed-item-sub,
.empty-hint {
  font-size: 22rpx;
  color: var(--text-light);
}

.feed-item-main {
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--text-main);
}

.feed-item-sub {
  display: block;
  margin-top: 8rpx;
}

.empty-hint {
  text-align: center;
  padding: 100rpx 0;
}

.interaction-stage {
  position: absolute;
  inset: 84rpx 24rpx 12rpx 24rpx;
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
  gap: 10rpx;
  animation: interaction-burst 1.6s ease-out forwards;
}

.interaction-effect.bomb {
  animation: bomb-pop 1.6s ease-out forwards;
}

.interaction-effect.bomb::before,
.interaction-effect.bomb::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  z-index: -1;
}

.interaction-effect.bomb::before {
  width: 250rpx;
  height: 250rpx;
  background: radial-gradient(circle, rgba(255, 188, 204, 0.42) 0%, rgba(255, 188, 204, 0) 70%);
  animation: bomb-wave 1.2s ease-out forwards;
}

.interaction-effect.bomb::after {
  width: 180rpx;
  height: 180rpx;
  border: 8rpx solid rgba(255, 151, 169, 0.5);
  animation: bomb-ring 1.2s ease-out forwards;
}

.effect-pulse {
  position: absolute;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.84) 0%, rgba(255, 255, 255, 0) 70%);
  z-index: -1;
}

.effect-emoji {
  font-size: 120rpx;
  line-height: 1;
  filter: drop-shadow(0 16rpx 20rpx rgba(15, 23, 42, 0.14));
}

.interaction-effect.bomb .effect-emoji {
  font-size: 144rpx;
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
    transform: translate(-50%, -20%) scale(0.4);
  }
  24% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.04);
  }
  72% {
    opacity: 1;
    transform: translate(-50%, -62%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -84%) scale(0.94);
  }
}

@keyframes bomb-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.32);
  }
  18% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.18);
  }
  56% {
    opacity: 1;
    transform: translate(-50%, -58%) scale(1.02);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -80%) scale(0.92);
  }
}

@keyframes bomb-wave {
  0% {
    opacity: 0;
    transform: scale(0.2);
  }
  28% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(1.55);
  }
}

@keyframes bomb-ring {
  0% {
    opacity: 0;
    transform: scale(0.35);
  }
  22% {
    opacity: 1;
    transform: scale(0.95);
  }
  100% {
    opacity: 0;
    transform: scale(1.35);
  }
}

.floating-dismiss {
  position: fixed;
  inset: 0;
  z-index: 48;
}

.floating-edge-stack {
  position: fixed;
  left: 0;
  bottom: calc(188rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: flex-end;
  gap: 12rpx;
  z-index: 50;
}

.floating-edge-panel {
  width: 430rpx;
  margin-left: 20rpx;
  padding: 18rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.97);
  border: 2rpx solid rgba(255, 255, 255, 0.84);
  box-shadow: var(--shadow-lg);
}

.floating-panel-head {
  margin-bottom: 14rpx;
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

.floating-edge-tabs {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.floating-edge-tab {
  width: 88rpx;
  min-height: 120rpx;
  padding: 0 16rpx;
  border-radius: 0 24rpx 24rpx 0;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  letter-spacing: 4rpx;
  box-shadow: var(--shadow-accent);
}

.floating-edge-tab.secondary {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  box-shadow: var(--shadow-primary);
}

.interaction-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.interaction-btn {
  min-height: 96rpx;
  flex-direction: column;
  gap: 6rpx;
  border-radius: 24rpx;
  background: linear-gradient(180deg, #fff8fb, #fff1f5);
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.6);
}

.interaction-emoji {
  font-size: 42rpx;
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

.chat-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
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
  width: 132rpx;
  height: 88rpx;
  border-radius: var(--radius-pill);
  font-size: 28rpx;
  font-weight: 800;
  flex-shrink: 0;
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

.leaderboard-modal {
  max-height: calc(100vh - 120rpx);
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

.info-grid,
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
}

.info-grid {
  margin-bottom: 24rpx;
}

.info-card {
  padding: 18rpx;
  border-radius: 24rpx;
  background: #f8fbff;
}

.info-label {
  display: block;
  font-size: 22rpx;
  color: var(--text-light);
}

.info-value {
  display: block;
  margin-top: 8rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: var(--text-main);
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-bottom: 20rpx;
  max-height: 520rpx;
  overflow-y: auto;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  background: #fff;
  box-shadow: 0 10rpx 20rpx rgba(148, 163, 184, 0.08);
}

.leaderboard-item.leader {
  background: linear-gradient(180deg, #fffaf1, #ffffff);
}

.leaderboard-item.self {
  border: 2rpx solid rgba(244, 114, 182, 0.16);
}

.leaderboard-rank {
  width: 56rpx;
  font-size: 28rpx;
  font-weight: 900;
  color: var(--secondary-strong);
  text-align: center;
}

.leaderboard-main {
  flex: 1;
  min-width: 0;
}

.leaderboard-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.leaderboard-name {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--text-main);
}

.leaderboard-score {
  display: block;
  margin-top: 8rpx;
}

.leaderboard-notice {
  margin-bottom: 24rpx;
  padding: 18rpx;
  border-radius: 24rpx;
  background: #fff7fb;
}

.leaderboard-notice-title {
  display: block;
  font-size: 24rpx;
  font-weight: 900;
  color: var(--text-main);
}

.leaderboard-notice-text {
  display: block;
  margin: 8rpx 0 14rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-sub);
}

.notice-btn {
  width: 100%;
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
  line-height: 1;
}

.target-player-chip.active {
  background: var(--primary);
  color: #fff;
}

.target-player-chip.room-chip {
  background: #f4f6fa;
}

.shortcut-grid {
  margin-bottom: 24rpx;
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
  padding: 18rpx 22rpx;
  border-radius: 24rpx;
  background: #f8fafc;
  color: var(--text-main);
  font-size: 28rpx;
  font-weight: 700;
  justify-content: flex-start;
}

.setting-item.disabled {
  opacity: 0.72;
}

.setting-copy {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.st-title {
  font-size: 28rpx;
  font-weight: 800;
}

.st-desc {
  font-size: 22rpx;
  line-height: 1.5;
  color: var(--text-light);
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

@media (max-width: 420px) {
  .top-entry-grid,
  .info-grid,
  .shortcut-grid {
    grid-template-columns: 1fr;
  }

  .player-chip {
    width: 100%;
  }

  .overview-head,
  .target-strip,
  .chat-row,
  .chat-range-bar,
  .modal-actions,
  .custom-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-side,
  .target-clear-btn,
  .chat-send-btn,
  .score-open-btn,
  .custom-btn,
  .modal-actions .macaron-btn,
  .notice-btn,
  .floating-edge-panel {
    width: 100%;
  }

  .feed-bubble {
    max-width: 100%;
  }

  .floating-edge-stack {
    left: 12rpx;
    right: 12rpx;
    bottom: calc(204rpx + env(safe-area-inset-bottom));
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .floating-edge-tabs {
    flex-direction: row;
  }

  .floating-edge-tab {
    width: auto;
    min-height: 82rpx;
    border-radius: 999rpx;
    writing-mode: horizontal-tb;
    text-orientation: initial;
    letter-spacing: 0;
  }

  .leaderboard-item {
    align-items: flex-start;
  }
}
</style>
