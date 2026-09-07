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

    <view class="room-top-shell">
      <view class="top-overview-panel macaron-card">
        <view class="room-mini-bar">
          <view class="room-mini-main">
            <view class="room-id-line">
              <text class="room-id-label">房间号</text>
              <text class="room-id-value">{{ roomId || '--' }}</text>
            </view>
            <view class="room-mini-tags">
              <text class="meta-chip accent">{{ roomStatusText }}</text>
              <text class="meta-chip">{{ roomRoleText }}</text>
              <text class="meta-chip">{{ playerCount }} 人在线</text>
              <text class="meta-chip">我 {{ formatScore(currentPlayer?.score || 0) }}</text>
            </view>
          </view>
          <view class="room-mini-side">
            <text class="leader-mini-label">领先</text>
            <text class="leader-mini-name">{{ leaderPlayer ? leaderPlayer.name : '暂无' }}</text>
          </view>
        </view>

        <view class="top-entry-row">
          <view class="entry-btn accent" @click="openRoomInfoPopup">
            <text class="entry-name">房间信息</text>
            <text class="entry-desc">房号 邀请 状态</text>
          </view>
          <view class="entry-btn secondary" @click="openLeaderboardPopup">
            <text class="entry-name">排行榜</text>
            <text class="entry-desc">积分 名次 提醒</text>
          </view>
          <view class="entry-btn neutral" @click="openMoreActionsPopup">
            <text class="entry-name">更多功能</text>
            <text class="entry-desc">{{ isRoomCreator ? '撤回 结算 关房' : '撤回 刷新 退出' }}</text>
          </view>
        </view>

        <view v-if="isRoomCreator && roomInfo.status === 'active'" class="creator-action-row">
          <view class="creator-close-pill" @click="closeRoomDirectly">
            房主关闭房间
          </view>
        </view>
      </view>

      <view class="player-strip-card macaron-card">
        <view class="section-head compact">
          <text class="section-title">玩家区</text>
          <text class="section-subtitle">{{ currentAudienceShortText }}</text>
        </view>

        <scroll-view class="player-strip-scroll" scroll-x enable-flex show-scrollbar="false">
          <view class="player-strip-list">
            <view
              v-for="player in players"
              :key="player.userId"
              class="player-square"
              :class="{
                active: selectedTargetId === player.userId,
                self: player.userId === currentUserId
              }"
              @click="selectTarget(player.userId)"
            >
              <view class="player-square-avatar-shell">
                <image class="player-square-avatar" :src="getAvatarSrc(player)" mode="aspectFill" />
                <view
                  v-if="player.userId === currentUserId || (leaderPlayer && leaderPlayer.userId === player.userId)"
                  class="player-square-marker"
                  :class="{ leader: leaderPlayer && leaderPlayer.userId === player.userId }"
                >
                  {{ player.userId === currentUserId ? '我' : '领' }}
                </view>
              </view>
              <text class="player-square-name">{{ player.name || '未命名玩家' }}</text>
              <text class="player-square-score" :class="{ positive: player.score > 0, negative: player.score < 0 }">
                {{ formatScore(player.score) }}
              </text>
            </view>
          </view>
        </scroll-view>

        <view class="target-hint-bar" :class="{ active: !!selectedTargetId }">
          <view class="target-hint-copy">
            <text class="target-hint-label">当前发送目标</text>
            <text class="target-hint-name">{{ selectedTargetName || '默认发给全桌' }}</text>
          </view>
          <view v-if="selectedTargetId" class="target-hint-clear" @click="clearSelectedTarget">
            再点一次取消
          </view>
        </view>
      </view>
    </view>

    <view class="feed-section">
      <view class="macaron-card feed-card">
        <view class="feed-head">
          <view>
            <view class="card-title">房间流水</view>
            <view class="feed-subtitle">消息和计分都在这里，最新一条永远看得见</view>
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
          <view v-else class="empty-hint">还没有房间流水，先发一句话或者先记一笔分。</view>
        </scroll-view>
      </view>

    </view>

    <view class="broadcast-stage">
      <view
        v-for="broadcast in roomBroadcasts"
        :key="broadcast.id"
        class="broadcast-banner"
        :class="broadcast.type"
      >
        <view v-if="isFuryBroadcast(broadcast)" class="broadcast-flare-row">
          <text class="broadcast-flare">😤</text>
          <text class="broadcast-flare">🔥</text>
          <text class="broadcast-flare">😡</text>
        </view>
        <text class="broadcast-label">{{ broadcast.label }}</text>
        <text class="broadcast-content">{{ broadcast.content }}</text>
      </view>
    </view>

    <view class="interaction-stage">
      <view
        v-for="effect in interactionEffects"
        :key="effect.id"
        class="interaction-effect"
        :class="{ bomb: effect.kind === '炸弹', combo: effect.count > 1 }"
        :style="{ left: effect.left, top: effect.top }"
      >
        <view class="effect-pulse"></view>
        <view class="effect-main">
          <text class="effect-emoji">{{ effect.emoji }}</text>
          <text v-if="effect.count > 1" class="effect-count">x{{ effect.count }}</text>
        </view>
        <view v-if="effect.count > 1" class="effect-echo-row">
          <text
            v-for="index in getInteractionEchoCount(effect.count)"
            :key="`${effect.id}-${index}`"
            class="effect-echo"
          >
            {{ effect.emoji }}
          </text>
        </view>
        <text class="effect-caption">{{ getInteractionCaptionText(effect) }}</text>
      </view>
    </view>

    <view v-if="floatingPanelVisible" class="floating-dismiss" @click="floatingPanelVisible = false"></view>

    <view class="floating-edge-launchers">
      <view class="floating-edge-tab secondary" @click="toggleFloatingPanel('message')">
        话术
      </view>
      <view class="floating-edge-tab" @click="toggleFloatingPanel('interaction')">
        互动
      </view>
    </view>

    <view v-if="floatingPanelVisible" class="floating-edge-stack">
      <view class="floating-edge-panel">
        <view class="floating-panel-head">
          <text class="floating-title">{{ floatingPanelMode === 'interaction' ? '快捷互动' : '快捷话术' }}</text>
          <text class="floating-subtitle">
            {{ floatingPanelMode === 'interaction' ? `${currentAudienceHint}，长按支持 10 连发` : currentAudienceHint }}
          </text>
        </view>
        <view v-if="floatingPanelMode === 'interaction'" class="interaction-list floating-list">
          <view
            v-for="item in interactionTools"
            :key="item.emoji"
            class="interaction-btn"
            @click="sendInteraction(item)"
            @longpress="sendInteractionBurst(item, 10)"
          >
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
    </view>

    <view class="bottom-wrapper">
      <view class="bottom-dock">
        <view class="chat-range-bar">
          <text class="chat-range-label">当前发送范围</text>
          <text class="chat-range-value">{{ currentAudienceHint }}</text>
        </view>
        <view class="chat-row compact-chat-row">
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
        <view class="score-head-card">
          <view class="score-head-copy">
            <text class="score-head-kicker">本次操作</text>
            <text class="modal-desc score-modal-desc">
              从 <text class="highlight">{{ currentPlayerName }}</text> 记给
              <text class="highlight">{{ selectedTargetName || '请选择目标玩家' }}</text>
            </text>
          </view>
          <view class="score-head-badge">支持小数</view>
        </view>

        <view class="target-picker">
          <view class="target-picker-head">
            <text class="target-picker-title">选择记分对象</text>
            <text class="target-picker-tip">这里和页面上的选择保持同步，不能给自己记分</text>
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

        <view class="score-shortcut-head">
          <text class="score-shortcut-title">快捷分值</text>
          <text class="score-shortcut-tip">常用就这四档，够快</text>
        </view>

        <view class="shortcut-grid compact-score-grid">
          <view v-for="item in shortcuts" :key="item" class="shortcut-chip" @click="updateScore(item)">
            +{{ item }}
          </view>
        </view>

        <view class="custom-row score-custom-row">
          <input v-model="customScore" class="macaron-input" type="digit" placeholder="自定义分值，例如 0.5 / 1.5" />
        </view>

        <view class="score-modal-actions">
          <button class="macaron-btn" @click="submitCustomScore">确认记分</button>
          <button class="macaron-btn ghost close-score-btn" @click="scoreModalVisible = false">关闭</button>
        </view>
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
          <view v-if="isRoomCreator && roomInfo.status === 'active'" class="setting-item danger" @click="closeRoomDirectly">
            <text class="st-title">关闭房间</text>
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
        <view class="settlement-hero">
          <text class="settlement-kicker">本局结算</text>
          <view class="s-title-img">{{ settlementData.title }}</view>
          <text class="settlement-summary">{{ settlementData.summary }}</text>
        </view>
        <view v-if="settlementData.spotlights.length" class="settlement-spotlights">
          <view
            v-for="spotlight in settlementData.spotlights"
            :key="spotlight.label"
            class="spotlight-card"
            :class="spotlight.tone"
          >
            <text class="spotlight-label">{{ spotlight.label }}</text>
            <text class="spotlight-name">{{ spotlight.name }}</text>
            <text class="spotlight-meta">{{ spotlight.meta }}</text>
          </view>
        </view>
        <view v-if="settlementData.mvp" class="s-mvp">
          <text class="crown">👑</text>
          <text class="mvp-name">MVP: {{ settlementData.mvp.name }}</text>
          <text class="mvp-tag">{{ settlementData.mvpTitle }}</text>
          <text class="mvp-score">{{ formatScore(settlementData.mvp.score) }}</text>
        </view>
        <view class="settlement-board-head">
          <text class="settlement-board-title">排行榜</text>
          <text class="settlement-board-subtitle">{{ settlementData.players.length }} 人本局排名</text>
        </view>
        <scroll-view class="s-list" scroll-y>
          <view
            v-for="(p, index) in settlementData.players"
            :key="p.userId"
            class="s-item"
            :class="{ podium: index < 3, self: p.userId === currentUserId }"
          >
            <view class="s-rank">{{ index + 1 }}</view>
            <image class="s-avatar" :src="getAvatarSrc(p)" mode="aspectFill" />
            <view class="s-main">
              <text class="s-name">{{ p.name }} <text v-if="p.userId === currentUserId">(我)</text></text>
              <text class="s-tagline">{{ p.funTitle }}</text>
            </view>
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

const shortcuts = [1, 2, 5, 10];
const quickMessages = ['漂亮一手', '稳住节奏', '先盯榜一', '这一分很关键', '别上头', '下一轮开追'];
const interactionTools = [
  { emoji: '💣', name: '炸弹' },
  { emoji: '🌹', name: '鲜花' },
  { emoji: '🍺', name: '酒杯' },
  { emoji: '👏', name: '鼓掌' },
  { emoji: '😡', name: '发火' },
  { emoji: '🔥', name: '点火' },
  { emoji: '🤯', name: '炸裂' },
  { emoji: '🤣', name: '笑喷' }
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
const roomBroadcasts = ref([]);
const editName = ref('');
const settlementData = ref(null);
const floatingPanelVisible = ref(false);
const floatingPanelMode = ref('interaction');
const feedScrollAnchor = ref('');
const seenInteractionIds = new Set();
const ignoredSocketEventKeys = new Set();
const interactionEffectTimers = new Map();
const roomBroadcastTimers = new Map();
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
  return selectedTargetName.value ? `已选中 ${selectedTargetName.value}` : '横向滑动选择玩家';
});
const currentAudienceHint = computed(() => {
  if (roomInfo.value.status !== 'active') {
    return '牌局已结束，只看记录';
  }
  return selectedTargetName.value ? `只发给 ${selectedTargetName.value}` : '默认发给全桌';
});
const messagePlaceholder = computed(() => (selectedTargetName.value ? `对 ${selectedTargetName.value} 说点什么` : '给全桌说点什么'));
const leaderReminderText = computed(() => {
  if (!leaderPlayer.value) {
    return '会在屏幕中间放一条更醒目的提醒，把大家注意力拉回来。';
  }
  return `会给 ${leaderPlayer.value.name} 上一层“盯住他”的动效提醒，全桌都看得见。`;
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

const showRoomBroadcast = ({ id, type = 'leaderboard', label = '全桌广播', content = '' }) => {
  if (!content) {
    return;
  }
  const broadcastId = id || `broadcast_${type}_${Date.now()}`;
  const existingIndex = roomBroadcasts.value.findIndex(item => item.id === broadcastId);
  const broadcast = {
    id: broadcastId,
    type,
    label,
    content
  };

  if (existingIndex >= 0) {
    roomBroadcasts.value = roomBroadcasts.value.map(item => (item.id === broadcastId ? broadcast : item));
  } else {
    roomBroadcasts.value = [...roomBroadcasts.value.slice(-1), broadcast];
  }

  const existingTimer = roomBroadcastTimers.get(broadcastId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    roomBroadcasts.value = roomBroadcasts.value.filter(item => item.id !== broadcastId);
    roomBroadcastTimers.delete(broadcastId);
  }, 2600);
  roomBroadcastTimers.set(broadcastId, timer);
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
  if (roomInfo.value.status !== 'active') return;
  if (userId === currentUserId.value) {
    uni.showToast({ title: '不能选自己记分', icon: 'none' });
    return;
  }
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
    uni.showToast({ title: '请输入大于 0 的分值，支持小数', icon: 'none' });
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

const approvePendingRevokeRequest = async () => {
  try {
    const result = await api.revokeScore({ roomId: roomId.value, action: 'approve' });
    markIgnoredSocketEvent(getRevokeEventKey(result));
    await syncRoom();
    uni.showToast({ title: '已确认撤回上一笔', icon: 'none' });
  } catch (error) {
    uni.showToast({ title: error.message || '撤回失败', icon: 'none' });
  }
};

const promptRevokeApproval = (payload) => {
  const requesterName = getPlayerName(payload?.requesterUserId || payload?.history?.fromUserId, '对方');
  const scoreValue = payload?.history?.score || latestRevocableScore.value?.score || 0;
  showRoomBroadcast({
    id: `revoke-pending-${payload?.history?.id || Date.now()}`,
    type: 'revoke',
    label: '待你确认',
    content: `${requesterName} 申请撤回 ${formatScore(scoreValue)}，请确认`
  });
  showConfirm(
    '确认撤回上一笔',
    `${requesterName} 申请撤回记给你的 ${formatScore(scoreValue)}，确认后双方分数会回退。`,
    approvePendingRevokeRequest,
    true
  );
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

const closeRoomDirectly = () => {
  moreActionsPopup.value = false;
  showConfirm('关闭房间', '关闭后本局不会结算，但会通知所有人离开房间，确定继续吗？', async () => {
    try {
      await api.closeRoom({ roomId: roomId.value });
      socket.value?.emit('room-closed', {
        roomId: roomId.value,
        operatorUserId: currentUserId.value,
        message: '房主已关闭房间'
      });
      showSettlement(players.value, '房间已关闭');
    } catch (error) {
      uni.showToast({ title: error.message || '关闭失败', icon: 'none' });
    }
  }, true);
};

const showSettlement = (playerList, title = '结算排名') => {
  const sorted = [...playerList].sort((a, b) => b.score - a.score);
  const mvp = sorted.length > 0 && sorted[0].score > 0 ? sorted[0] : null;
  const activeScoreLogs = scoreHistory.value.filter(item => !item.isRevoked);
  const chatCounter = new Map();
  const scoreFromCounter = new Map();
  const scoreToCounter = new Map();

  messages.value.forEach((item) => {
    if (!item.userId) return;
    chatCounter.set(item.userId, (chatCounter.get(item.userId) || 0) + 1);
  });
  activeScoreLogs.forEach((item) => {
    scoreFromCounter.set(item.fromUserId, (scoreFromCounter.get(item.fromUserId) || 0) + 1);
    scoreToCounter.set(item.toUserId, (scoreToCounter.get(item.toUserId) || 0) + 1);
  });

  const getHighestUserIds = (counter) => {
    const pairs = [...counter.entries()].filter(([, count]) => count > 0);
    if (!pairs.length) return [];
    const maxCount = Math.max(...pairs.map(([, count]) => count));
    return pairs.filter(([, count]) => count === maxCount).map(([userId]) => userId);
  };

  const attackLeaders = new Set(getHighestUserIds(scoreFromCounter));
  const chatLeaders = new Set(getHighestUserIds(chatCounter));
  const focusLeaders = new Set(getHighestUserIds(scoreToCounter));
  const getFunTitle = (player, index) => {
    if (index === 0) return '本局 MVP';
    if (attackLeaders.has(player.userId)) return '火力全开';
    if (chatLeaders.has(player.userId)) return '气氛担当';
    if (focusLeaders.has(player.userId)) return '全桌焦点';
    if (player.score === 0) return '稳台选手';
    return player.score > 0 ? '稳步收分' : '下局再冲';
  };

  const rankedPlayers = sorted.map((player, index) => ({
    ...player,
    funTitle: getFunTitle(player, index)
  }));
  const spotlights = [];
  const spotlightSeen = new Set();
  const pushSpotlight = (label, player, meta, tone) => {
    if (!player || spotlightSeen.has(player.userId)) {
      return;
    }
    spotlightSeen.add(player.userId);
    spotlights.push({
      label,
      name: player.name,
      meta,
      tone
    });
  };

  pushSpotlight('冠军', rankedPlayers[0], `拿下 ${formatScore(rankedPlayers[0]?.score || 0)}`, 'gold');
  const attackPlayer = rankedPlayers.find(player => attackLeaders.has(player.userId));
  pushSpotlight('出手最多', attackPlayer, `${scoreFromCounter.get(attackPlayer?.userId) || 0} 次记分`, 'rose');
  const chatPlayer = rankedPlayers.find(player => chatLeaders.has(player.userId));
  pushSpotlight('气氛最足', chatPlayer, `${chatCounter.get(chatPlayer?.userId) || 0} 条消息`, 'blue');

  settlementData.value = {
    title,
    summary: mvp ? `${mvp.name} 收下本局最高分，排行榜已经锁定。` : '本局结束，排行榜已经出炉。',
    players: rankedPlayers,
    mvp,
    mvpTitle: mvp ? '全桌焦点' : '',
    spotlights,
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
  await sendMessage(content, { keepPanel: true });
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
    showRoomBroadcast({
      id: `leaderboard-${result.messageId || Date.now()}`,
      type: 'leaderboard fury',
      label: '全桌围攻提醒',
      content: result.content
    });
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

const isFuryBroadcast = (broadcast) => String(broadcast?.type || '').includes('fury');

const buildInteractionCaption = (payload) => {
  const fromName = getPlayerName(payload.fromUserId, '玩家');
  const toName = payload.toUserId ? getPlayerName(payload.toUserId, '目标玩家') : '';

  if (toName) {
    return `${fromName} 对 ${toName} 送出${payload.name || '互动'} ${payload.emoji}`;
  }
  return `${fromName} 对全桌送出${payload.name || '互动'} ${payload.emoji}`;
};

const getInteractionGroupKey = (payload) => `${payload.name || payload.emoji}_${payload.fromUserId}_${payload.toUserId || 'room'}`;

const getInteractionEchoCount = (count) => Math.min(Math.max(count - 1, 0), 6);

const getInteractionCaptionText = (effect) => {
  if (effect.count > 1) {
    return `${effect.caption} · 连发 x${effect.count}`;
  }
  return effect.caption;
};

const scheduleInteractionCleanup = (effectId, delay = 2600) => {
  const existingTimer = interactionEffectTimers.get(effectId);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  const timer = setTimeout(() => {
    interactionEffects.value = interactionEffects.value.filter(item => item.id !== effectId);
    interactionEffectTimers.delete(effectId);
  }, delay);
  interactionEffectTimers.set(effectId, timer);
};

const pushInteractionEffect = (payload) => {
  const interactionId = payload.interactionId || `interaction_${Date.now()}`;
  if (seenInteractionIds.has(interactionId)) return;
  seenInteractionIds.add(interactionId);

  const now = Date.now();
  const groupKey = getInteractionGroupKey(payload);
  const existingEffect = interactionEffects.value.find(item => item.groupKey === groupKey && now - item.lastAt < 1600);

  if (existingEffect) {
    const increment = Math.max(payload.burstCount || 1, 1);
    const nextCount = existingEffect.count + increment;
    interactionEffects.value = interactionEffects.value.map(item => (
      item.id === existingEffect.id
        ? {
            ...item,
            count: nextCount,
            caption: buildInteractionCaption(payload),
            lastAt: now
          }
        : item
    ));
    scheduleInteractionCleanup(existingEffect.id, 2800);
    return;
  }

  const stagePositions = [
    { left: '50%', top: '48%' },
    { left: '36%', top: '53%' },
    { left: '64%', top: '44%' }
  ];
  const stagePosition = stagePositions[interactionEffects.value.length % stagePositions.length];
  const effect = {
    id: interactionId,
    groupKey,
    emoji: payload.emoji,
    caption: buildInteractionCaption(payload),
    kind: payload.name || '',
    count: Math.max(payload.burstCount || 1, 1),
    left: stagePosition.left,
    top: stagePosition.top,
    lastAt: now
  };

  interactionEffects.value = [...interactionEffects.value, effect];
  scheduleInteractionCleanup(effect.id);
};

const sendInteraction = (tool, burstCount = 1) => {
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
    burstCount,
    timestamp: new Date().toISOString()
  };

  pushInteractionEffect(payload);
  socket.value?.emit('interaction', payload);
};

const sendInteractionBurst = (tool, burstCount = 10) => {
  sendInteraction(tool, burstCount);
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
      showRoomBroadcast({
        id: `leaderboard-${data.messageId || Date.now()}`,
        type: 'leaderboard fury',
        label: '全桌围攻提醒',
        content: data.content
      });
    }
    await syncRoomQuietly();
  });

  socket.value.on('score-revoke-requested', async (data) => {
    if (shouldIgnoreSocketEvent(getRevokeEventKey(data))) {
      return;
    }
    showTopToast(buildRevokeSocketMessage(data));
    if (data?.approverUserId === currentUserId.value) {
      promptRevokeApproval(data);
    }
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
  interactionEffectTimers.forEach(timer => clearTimeout(timer));
  roomBroadcastTimers.forEach(timer => clearTimeout(timer));
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
  gap: 18rpx;
  padding: calc(env(safe-area-inset-top) + 14rpx) 24rpx 12rpx;
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

.room-top-shell {
  padding: 0 24rpx 10rpx;
}

.top-overview-panel {
  padding: 14rpx;
  border-radius: 34rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(245, 248, 255, 0.92));
  box-shadow: 0 18rpx 34rpx rgba(148, 163, 184, 0.14);
}

.room-mini-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 12rpx 14rpx;
  border-radius: 26rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.88), rgba(242, 246, 255, 0.82));
  border: 2rpx solid rgba(216, 226, 244, 0.76);
}

.room-mini-main {
  flex: 1;
  min-width: 0;
}

.room-id-line {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}

.room-id-label {
  font-size: 22rpx;
  color: var(--text-sub);
}

.room-id-value {
  font-size: 34rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
  color: var(--text-main);
}

.room-mini-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6rpx;
}

.meta-chip {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #f4f7ff;
  color: var(--text-sub);
  font-size: 20rpx;
  font-weight: 700;
}

.meta-chip.accent {
  background: #fff0f6;
  color: var(--primary-strong);
}

.room-mini-side {
  min-width: 116rpx;
  padding: 10rpx 12rpx;
  border-radius: 22rpx;
  background: linear-gradient(180deg, #fff7fb, #fff1f8);
  text-align: right;
  flex-shrink: 0;
}

.leader-mini-label {
  display: block;
  font-size: 20rpx;
  color: var(--text-light);
}

.leader-mini-name {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  font-weight: 900;
  color: var(--text-main);
}

.top-entry-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 12rpx;
}

.entry-btn {
  min-height: 94rpx;
  padding: 12rpx 8rpx;
  border-radius: 26rpx;
  flex-direction: column;
  gap: 6rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 12rpx 24rpx rgba(148, 163, 184, 0.1);
  min-width: 0;
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
  font-size: 23rpx;
  font-weight: 900;
  color: var(--text-main);
  white-space: nowrap;
}

.entry-desc {
  max-width: 100%;
  font-size: 18rpx;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.creator-action-row {
  display: flex;
  justify-content: flex-end;
  margin-top: 12rpx;
}

.creator-close-pill {
  min-height: 62rpx;
  padding: 0 22rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff1f2, #ffe4e6);
  color: #e11d48;
  font-size: 22rpx;
  font-weight: 900;
  box-shadow: 0 10rpx 20rpx rgba(244, 63, 94, 0.12);
}

.player-strip-card {
  margin-top: 10rpx;
  padding: 16rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(245, 248, 255, 0.92));
}

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  padding: 0 4rpx 12rpx;
}

.section-head.compact {
  padding-bottom: 10rpx;
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

.player-strip-scroll {
  white-space: nowrap;
  width: 100%;
}

.player-strip-list {
  display: inline-flex;
  flex-wrap: nowrap;
  gap: 12rpx;
  padding: 2rpx 12rpx 6rpx 0;
  width: max-content;
}

.player-square {
  width: 164rpx;
  min-width: 164rpx;
  height: 198rpx;
  padding: 14rpx 12rpx 16rpx;
  border-radius: 30rpx;
  background: linear-gradient(180deg, #ffffff, #eef4ff);
  border: 2rpx solid rgba(209, 223, 248, 0.72);
  box-shadow: 0 14rpx 28rpx rgba(148, 163, 184, 0.14);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 8rpx;
  text-align: center;
  overflow: hidden;
  transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.player-square.active {
  background: linear-gradient(180deg, #3b82f6, #2563eb);
  border-color: rgba(147, 197, 253, 0.92);
  box-shadow: 0 16rpx 30rpx rgba(37, 99, 235, 0.28);
  transform: translateY(-2rpx);
}

.player-square.self {
  border-color: rgba(125, 211, 252, 0.92);
}

.player-square-avatar-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-square-marker,
.leaderboard-tag {
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  color: #fff;
  font-size: 18rpx;
  font-weight: 800;
  line-height: 1.2;
}

.player-square-marker {
  position: absolute;
  right: -8rpx;
  bottom: -6rpx;
  min-width: 34rpx;
  padding: 4rpx 10rpx;
  background: #22c55e;
  box-shadow: 0 8rpx 18rpx rgba(34, 197, 94, 0.24);
}

.player-square-marker.leader,
.leader-tag {
  background: #f59e0b;
  box-shadow: 0 8rpx 18rpx rgba(245, 158, 11, 0.24);
}

.self-tag {
  background: #22c55e;
}

.player-square-avatar,
.leaderboard-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 24rpx;
  background: #e2e8f0;
  box-shadow: 0 10rpx 18rpx rgba(148, 163, 184, 0.18);
  flex-shrink: 0;
}

.player-square-name {
  width: 100%;
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.35;
  min-height: 48rpx;
  color: var(--text-main);
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.player-square-score,
.leaderboard-score {
  margin-top: auto;
  min-height: 40rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 23rpx;
  font-weight: 900;
  color: var(--text-main);
  line-height: 1.1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: rgba(226, 232, 240, 0.78);
}

.player-square.active .player-square-name,
.player-square.active .player-square-score {
  color: #fff;
}

.player-square.active .player-square-score {
  background: rgba(255, 255, 255, 0.18);
}

.player-square-score.neutral {
  font-size: 20rpx;
  color: var(--text-light);
}

.player-square-score.positive,
.leaderboard-score.positive,
.s-score.positive {
  color: #f43f5e;
}

.player-square-score.negative,
.leaderboard-score.negative,
.s-score.negative {
  color: #10b981;
}

.player-square.active .player-square-score.positive,
.player-square.active .player-square-score.negative {
  color: #fff;
}

.target-hint-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 12rpx;
  padding: 14rpx 16rpx;
  border-radius: 22rpx;
  background: linear-gradient(180deg, #f7faff, #eef5ff);
  border: 2rpx solid rgba(214, 226, 247, 0.8);
}

.target-hint-bar.active {
  background: linear-gradient(180deg, #eef5ff, #dbeafe);
  border-color: rgba(96, 165, 250, 0.6);
}

.target-hint-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.target-hint-label {
  font-size: 20rpx;
  color: var(--text-light);
}

.target-hint-name {
  font-size: 26rpx;
  font-weight: 900;
  color: var(--secondary-strong);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target-hint-clear {
  flex-shrink: 0;
  padding: 12rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(59, 130, 246, 0.12);
  color: #2563eb;
  font-size: 22rpx;
  font-weight: 800;
}

.feed-section {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 0 24rpx 10rpx;
}

.feed-card {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 18rpx 18rpx 14rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(244, 247, 255, 0.88));
}

.feed-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
  padding-bottom: 14rpx;
}

.card-title {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 4rpx;
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
}

.feed-scroll {
  flex: 1;
  min-height: 0;
  padding-right: 4rpx;
}

.feed-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding-bottom: 8rpx;
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
  padding: 16rpx 18rpx;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 18rpx rgba(148, 163, 184, 0.1);
}

.feed-item.message .feed-bubble {
  background: rgba(255, 255, 255, 0.96);
  border-top-left-radius: 10rpx;
}

.feed-item.score .feed-bubble {
  background: linear-gradient(180deg, #fff7fb, #ffffff);
  border-top-right-radius: 10rpx;
}

.feed-item.revoked .feed-bubble {
  opacity: 0.6;
}

.feed-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 8rpx;
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
  line-height: 1.56;
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
  position: fixed;
  inset: calc(env(safe-area-inset-top) + 110rpx) 24rpx calc(220rpx + env(safe-area-inset-bottom)) 24rpx;
  pointer-events: none;
  overflow: hidden;
  z-index: 62;
}

.broadcast-stage {
  position: fixed;
  top: 28%;
  left: 24rpx;
  right: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
  pointer-events: none;
  z-index: 63;
}

.broadcast-banner {
  width: min(100%, 520rpx);
  padding: 18rpx 24rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.94), rgba(59, 130, 246, 0.96));
  box-shadow: 0 22rpx 40rpx rgba(37, 99, 235, 0.24);
  color: #fff;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  text-align: center;
  animation: broadcast-pop 2.6s ease forwards;
}

.broadcast-banner.leaderboard {
  background: linear-gradient(135deg, rgba(30, 64, 175, 0.94), rgba(147, 197, 253, 0.98));
}

.broadcast-banner.fury {
  overflow: hidden;
}

.broadcast-banner.fury::before,
.broadcast-banner.fury::after {
  content: '';
  position: absolute;
  top: -26rpx;
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 189, 89, 0.42) 0%, rgba(255, 189, 89, 0) 70%);
  animation: fury-glow 1.2s ease-in-out infinite;
}

.broadcast-banner.fury::before {
  left: -28rpx;
}

.broadcast-banner.fury::after {
  right: -28rpx;
  animation-delay: 0.25s;
}

.broadcast-banner.revoke {
  background: linear-gradient(135deg, rgba(190, 24, 93, 0.94), rgba(244, 114, 182, 0.98));
}

.broadcast-flare-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 2rpx;
}

.broadcast-flare {
  font-size: 34rpx;
  line-height: 1;
  animation: fury-bounce 0.8s ease-in-out infinite alternate;
}

.broadcast-flare:nth-child(2) {
  animation-delay: 0.12s;
}

.broadcast-flare:nth-child(3) {
  animation-delay: 0.24s;
}

.broadcast-label {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  opacity: 0.86;
}

.broadcast-content {
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.5;
}

.interaction-effect {
  position: absolute;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  animation: interaction-burst 2.2s ease-out forwards;
}

.interaction-effect.bomb {
  animation: bomb-pop 2.2s ease-out forwards;
}

.interaction-effect.combo .effect-main::after {
  content: '';
  position: absolute;
  inset: -26rpx;
  border-radius: 50%;
  border: 8rpx solid rgba(96, 165, 250, 0.28);
  animation: combo-ring 0.9s ease-out infinite;
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
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.92) 0%, rgba(255, 255, 255, 0) 72%);
  z-index: -1;
}

.effect-main {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.effect-emoji {
  font-size: 148rpx;
  line-height: 1;
  filter: drop-shadow(0 18rpx 24rpx rgba(15, 23, 42, 0.2));
}

.interaction-effect.bomb .effect-emoji {
  font-size: 168rpx;
}

.effect-count {
  position: absolute;
  right: -42rpx;
  top: 8rpx;
  min-width: 74rpx;
  height: 52rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #1d4ed8, #60a5fa);
  color: #fff;
  font-size: 28rpx;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 24rpx rgba(37, 99, 235, 0.28);
}

.effect-echo-row {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.72);
}

.effect-echo {
  font-size: 32rpx;
  line-height: 1;
}

.effect-caption {
  max-width: 420rpx;
  padding: 14rpx 22rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.96);
  color: var(--text-main);
  font-size: 24rpx;
  font-weight: 800;
  text-align: center;
  line-height: 1.45;
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
    transform: translate(-50%, -60%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -82%) scale(0.96);
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
    transform: translate(-50%, -56%) scale(1.04);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -78%) scale(0.94);
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

@keyframes broadcast-pop {
  0% {
    opacity: 0;
    transform: translateY(28rpx) scale(0.92);
  }
  16% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  82% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-18rpx) scale(0.98);
  }
}

@keyframes fury-glow {
  0%,
  100% {
    opacity: 0.34;
    transform: scale(0.9);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.18);
  }
}

@keyframes fury-bounce {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(-8rpx) scale(1.06);
  }
}

@keyframes combo-ring {
  0% {
    opacity: 0.3;
    transform: scale(0.7);
  }
  100% {
    opacity: 0;
    transform: scale(1.2);
  }
}

.floating-dismiss {
  position: fixed;
  inset: 0;
  z-index: 48;
}

.floating-edge-stack {
  position: fixed;
  right: 24rpx;
  bottom: calc(320rpx + env(safe-area-inset-bottom));
  z-index: 50;
}

.floating-edge-launchers {
  position: fixed;
  right: 24rpx;
  bottom: calc(198rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  z-index: 51;
}

.floating-edge-panel {
  width: 420rpx;
  padding: 18rpx;
  border-radius: 28rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 249, 255, 0.96));
  border: 2rpx solid rgba(222, 231, 246, 0.84);
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

.floating-edge-tab {
  width: 92rpx;
  min-height: 92rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, var(--accent), var(--accent-strong));
  color: #fff;
  font-size: 24rpx;
  font-weight: 900;
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

.interaction-btn:active {
  transform: scale(0.96);
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
  padding: 0 24rpx calc(14rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.92) 18%, #fff 100%);
  backdrop-filter: blur(18px);
}

.bottom-dock {
  padding-top: 8rpx;
}

.chat-range-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 10rpx;
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
  gap: 10rpx;
}

.compact-chat-row {
  align-items: stretch;
}

.chat-input {
  flex: 1;
  min-width: 0;
  height: 84rpx;
  border-radius: var(--radius-pill);
  font-size: 26rpx;
  background: #f4f6fa !important;
}

.chat-send-btn {
  width: 96rpx;
  height: 84rpx;
  border-radius: var(--radius-pill);
  font-size: 26rpx;
  font-weight: 800;
  flex-shrink: 0;
}

.score-open-btn {
  width: 118rpx;
  height: 84rpx;
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

.score-modal {
  padding: 30rpx;
  border-radius: 40rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 248, 255, 0.96));
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

.score-head-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
  margin-bottom: 22rpx;
  padding: 18rpx 20rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #f7faff, #fff4fa);
  border: 2rpx solid rgba(225, 232, 245, 0.84);
}

.score-head-copy {
  flex: 1;
  min-width: 0;
}

.score-head-kicker {
  display: block;
  margin-bottom: 8rpx;
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--text-light);
}

.score-modal-desc {
  margin-bottom: 0;
  line-height: 1.5;
}

.score-head-badge {
  min-width: 112rpx;
  height: 54rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: #fff;
  font-size: 22rpx;
  font-weight: 800;
  flex-shrink: 0;
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
  background: linear-gradient(180deg, #fff8fb, #fffdfd);
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

.shortcut-grid {
  margin-bottom: 24rpx;
}

.score-shortcut-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.score-shortcut-title {
  font-size: 24rpx;
  font-weight: 900;
  color: var(--text-main);
}

.score-shortcut-tip {
  font-size: 20rpx;
  color: var(--text-light);
}

.compact-score-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.shortcut-chip {
  height: 88rpx;
  border-radius: 26rpx;
  background: linear-gradient(180deg, #f5f8ff, #eef4ff);
  color: var(--secondary-strong);
  font-size: 32rpx;
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

.score-custom-row {
  margin-bottom: 18rpx;
}

.score-modal-actions {
  display: flex;
  flex-direction: row;
  gap: 14rpx;
}

.score-modal-actions .macaron-btn {
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
  padding: 36rpx;
  border-radius: 44rpx;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 42%, #eef4ff 100%);
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
}

.settlement-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 22rpx;
}

.settlement-kicker {
  font-size: 22rpx;
  letter-spacing: 6rpx;
  color: var(--text-light);
}

.settlement-summary {
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--text-sub);
  text-align: center;
}

.settlement-spotlights {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-bottom: 22rpx;
}

.spotlight-card {
  padding: 16rpx 14rpx;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  color: #fff;
}

.spotlight-card.gold {
  background: linear-gradient(135deg, #f59e0b, #fbbf24);
}

.spotlight-card.rose {
  background: linear-gradient(135deg, #ec4899, #fb7185);
}

.spotlight-card.blue {
  background: linear-gradient(135deg, #2563eb, #60a5fa);
}

.spotlight-label {
  font-size: 20rpx;
  opacity: 0.84;
}

.spotlight-name {
  font-size: 28rpx;
  font-weight: 900;
}

.spotlight-meta {
  font-size: 20rpx;
  line-height: 1.4;
}

.s-mvp {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
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

.mvp-tag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  font-size: 20rpx;
  font-weight: 800;
}

.settlement-board-head {
  width: 100%;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.settlement-board-title {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-main);
}

.settlement-board-subtitle {
  font-size: 22rpx;
  color: var(--text-light);
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

.s-item.podium {
  background: linear-gradient(180deg, #ffffff, #fff7e8);
}

.s-item.self {
  border: 2rpx solid rgba(59, 130, 246, 0.2);
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

.s-main {
  flex: 1;
  min-width: 0;
}

.s-name {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}

.s-tagline {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--text-light);
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
  .modal-actions,
  .custom-row {
    flex-direction: column;
    align-items: flex-start;
  }

  .custom-btn,
  .modal-actions .macaron-btn,
  .notice-btn {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .shortcut-grid,
  .compact-score-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .player-square {
    width: 150rpx;
    min-width: 150rpx;
    height: 190rpx;
  }

  .feed-bubble {
    max-width: 100%;
  }

  .floating-edge-stack {
    right: 16rpx;
    bottom: calc(286rpx + env(safe-area-inset-bottom));
  }

  .floating-edge-panel {
    width: calc(100vw - 156rpx);
  }

  .floating-edge-launchers {
    right: 16rpx;
    bottom: calc(188rpx + env(safe-area-inset-bottom));
  }

  .top-entry-row {
    gap: 8rpx;
  }

  .entry-btn {
    min-height: 84rpx;
    padding: 10rpx 6rpx;
  }

  .entry-name {
    font-size: 21rpx;
  }

  .entry-desc {
    font-size: 17rpx;
  }

  .score-modal-actions {
    flex-direction: row;
    width: 100%;
  }

  .score-modal-actions .macaron-btn {
    flex: 1;
    width: auto;
  }

  .chat-send-btn {
    width: 88rpx;
  }

  .score-open-btn {
    width: 106rpx;
  }

  .settlement-spotlights {
    grid-template-columns: 1fr;
  }
}
</style>
