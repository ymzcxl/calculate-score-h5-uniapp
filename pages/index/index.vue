<template>
  <view class="index-page app-shell">
    <view class="macaron-card home-hero">
      <view class="hero-top">
        <view class="hero-user">
          <image class="avatar" :src="displayAvatar" mode="aspectFill"></image>
          <view class="user-copy">
            <view class="name-row">
              <text class="nickname">{{ userInfo.nickName || '牌局玩家' }}</text>
              <text class="macaron-badge yellow" v-if="userInfo.phone">{{ userInfo.phone }}</text>
              <text class="macaron-badge blue" v-else>未绑定手机</text>
            </view>
            <text class="hero-caption">随时开桌，随手记分，牌局节奏不断线</text>
          </view>
        </view>
        <button class="setting-btn" @click="settingsPopup = true">设置</button>
      </view>
      
      <view class="hero-body">
        <view class="hero-copy-block">
          <text class="greeting-title">{{ greetingTitle }}</text>
          <text class="greeting-sub">{{ dashboardSubtitle }}</text>
        </view>
        <view class="hero-mini-stats">
          <view class="mini-stat">
            <text class="mini-k">总场次</text>
            <text class="mini-v">{{ stats.totalGames }}</text>
          </view>
          <view class="mini-stat">
            <text class="mini-k">总积分</text>
            <text class="mini-v" :class="{ positive: stats.totalScore > 0, negative: stats.totalScore < 0 }">
              {{ stats.totalScore > 0 ? '+' : '' }}{{ stats.totalScore }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <view class="section-head">
      <text class="section-title">快速开局</text>
      <view class="section-help-entry" @click="helpPopup = true">
        <view class="section-help-dot">?</view>
        <text class="section-help-text">如何使用</text>
      </view>
    </view>

    <view class="action-grid">
      <view class="action-card create-box" @click="openCreateRoomPopup">
        <view class="action-icon">🎲</view>
        <text class="action-title">创建牌局</text>
        <text class="action-desc">起个房间名，马上拉朋友进桌</text>
        <view class="action-chip">推荐从这里开始</view>
      </view>
      
      <view class="action-card join-box" @click="joinPopup = true">
        <view class="action-icon">🚀</view>
        <text class="action-title">加入牌局</text>
        <text class="action-desc">输入房间号或粘贴邀请链接</text>
        <view class="action-chip pink">支持剪贴板识别</view>
      </view>
    </view>
    
    <view v-if="activeRoomId" class="macaron-card active-room-card">
      <view class="active-content" @click="returnToActiveRoom">
        <text class="active-icon">⏺</text>
        <view class="active-text">
          <text class="active-title">你有一桌正在进行中</text>
          <text class="active-desc">房间号 {{ activeRoomId }}，现在回去可以继续记分</text>
        </view>
      </view>
      <view class="active-actions">
        <button v-if="activeRoomIsCreator" class="macaron-btn ghost small end-btn" @click.stop="quickEndRoom">结束对局</button>
        <view class="active-arrow" @click="returnToActiveRoom">回到牌桌</view>
      </view>
    </view>

    <view class="macaron-card stats-card">
      <view class="card-title">
        <text class="icon">📊</text> 我的战绩
        <text class="more-link" @click="goToHistory">全部记录</text>
      </view>
      
      <view class="stats-grid">
        <view class="stat-item">
          <text class="stat-num">{{ stats.totalGames }}</text>
          <text class="stat-label">总场次</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.winRate }}<text class="unit">%</text></text>
          <text class="stat-label">胜率</text>
        </view>
        <view class="stat-item">
          <text class="stat-num" :class="{ positive: stats.totalScore > 0, negative: stats.totalScore < 0 }">
            {{ stats.totalScore > 0 ? '+' : '' }}{{ stats.totalScore }}
          </text>
          <text class="stat-label">总积分</text>
        </view>
        <view class="stat-item">
          <text class="stat-num">{{ stats.bestScore }}</text>
          <text class="stat-label">单局最佳</text>
        </view>
      </view>

      <view class="rhythm-box">
        <text class="rhythm-label">近期状态：</text>
        <text class="macaron-badge" :class="statusColorClass">{{ statusLabel }}</text>
        <text class="rhythm-desc">{{ rhythmCopy }}</text>
      </view>
    </view>

    <view v-if="createRoomPopup" class="modal-mask" @click="createRoomPopup = false">
      <view class="macaron-card modal-panel create-room-panel" @click.stop>
        <view class="modal-title">创建牌局</view>
        <view class="modal-desc">给这一桌起个名字，朋友进房时更容易认出来。</view>
        <view class="input-group create-room-group">
          <input
            v-model.trim="roomTitleInput"
            class="macaron-input"
            placeholder="例如：今晚欢乐局"
            maxlength="18"
            confirm-type="done"
            @confirm="createRoom"
          />
          <view class="title-helper">
            <text class="helper-main">留空会自动使用 {{ fallbackRoomTitle }}</text>
            <text class="helper-count">{{ roomTitleLength }}/18</text>
          </view>
          <view class="title-suggestions">
            <view
              v-for="item in roomTitleSuggestions"
              :key="item"
              class="title-suggestion"
              @click="applySuggestedTitle(item)"
            >
              {{ item }}
            </view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="createRoomPopup = false">取消</button>
          <button class="macaron-btn" @click="createRoom">确认创建</button>
        </view>
      </view>
    </view>

    <view v-if="helpPopup" class="modal-mask" @click="helpPopup = false">
      <view class="macaron-card modal-panel helper-modal" @click.stop>
        <view class="modal-title">如何使用</view>
        <view class="helper-list">
          <view class="helper-item">
            <text class="helper-index">01</text>
            <text class="helper-text">先创建房间，再把链接或房间号发给朋友。</text>
          </view>
          <view class="helper-item">
            <text class="helper-index">02</text>
            <text class="helper-text">如果你上次的牌局还没结束，首页会先提醒你回到上一局。</text>
          </view>
          <view class="helper-item">
            <text class="helper-index">03</text>
            <text class="helper-text">房主可以先结束上一局，再重新开一桌新牌局。</text>
          </view>
        </view>
        <view class="modal-actions">
          <button class="macaron-btn" @click="helpPopup = false">知道了</button>
        </view>
      </view>
    </view>

    <view v-if="activeRoomConflictPopup" class="modal-mask" @click="closeActiveRoomConflict">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">上一局还没结束</view>
        <view class="modal-desc">
          你当前还有一桌进行中的牌局（{{ activeRoomId }}）。先回去继续，或者处理完上一局再新开。
        </view>
        <view class="conflict-actions">
          <button class="macaron-btn ghost" @click="returnToExistingRoom">回到上一局</button>
          <button
            v-if="activeRoomIsCreator"
            class="macaron-btn"
            @click="endActiveRoomAndCreate"
          >
            结束上一局后新开
          </button>
          <button
            v-else
            class="macaron-btn"
            @click="leaveActiveRoomAndCreate"
          >
            退出上一局后新开
          </button>
        </view>
      </view>
    </view>

    <view v-if="joinPopup" class="modal-mask" @click="joinPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">加入房间</view>
        <view class="modal-desc">支持直接输入房间号，也支持粘贴邀请链接自动识别。</view>
        <input
          v-model.trim="joinInput"
          class="macaron-input"
          placeholder="例如：R123456"
          confirm-type="done"
          @confirm="joinRoom"
        />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="pasteLink">剪贴板识别</button>
          <button class="macaron-btn" @click="joinRoom">确认加入</button>
        </view>
      </view>
    </view>

    <view v-if="settingsPopup" class="modal-mask" @click="settingsPopup = false">
      <view class="macaron-card modal-panel sheet-panel" @click.stop>
        <view class="sheet-handle"></view>
        <view class="modal-title">账号设置</view>
        
        <view class="settings-list">
          <view class="setting-item" @click="openNicknamePopup">
            <view class="setting-icon">👤</view>
            <view class="setting-text">
              <text class="st-title">修改昵称</text>
              <text class="st-desc">房间里大家看到的名字</text>
            </view>
            <view class="setting-arrow"></view>
          </view>
          
          <view class="setting-item" @click="openPasswordPopup">
            <view class="setting-icon">🔑</view>
            <view class="setting-text">
              <text class="st-title">修改密码</text>
              <text class="st-desc">账号安全第一</text>
            </view>
            <view class="setting-arrow"></view>
          </view>
          
          <view class="setting-item danger" @click="logout">
            <view class="setting-icon">👋</view>
            <view class="setting-text">
              <text class="st-title">退出登录</text>
              <text class="st-desc">下次再来玩</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="nicknamePopup" class="modal-mask" @click="nicknamePopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">修改昵称</view>
        <input v-model.trim="newNickname" class="macaron-input" placeholder="输入新的昵称" />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="nicknamePopup = false">取消</button>
          <button class="macaron-btn" @click="saveNickname">保存</button>
        </view>
      </view>
    </view>

    <view v-if="passwordPopup" class="modal-mask" @click="passwordPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">修改密码</view>
        <view class="input-group">
          <input v-model="oldPassword" class="macaron-input" password placeholder="当前密码" />
          <input v-model="newPassword" class="macaron-input" password placeholder="新密码" />
          <input v-model="confirmPassword" class="macaron-input" password placeholder="确认新密码" />
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="passwordPopup = false">取消</button>
          <button class="macaron-btn" @click="savePassword">保存</button>
        </view>
      </view>
    </view>

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

  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '../../utils/api';
import { getRoomPageUrl, navigateToPage, redirectToLogin } from '../../utils/auth';
import { resolveAvatarUrl } from '../../utils/avatar';

const userInfo = ref({
  nickName: '',
  avatarUrl: '',
  uid: '',
  phone: ''
});

const stats = ref({
  totalGames: 0,
  winGames: 0,
  winRate: 0,
  totalScore: 0,
  averageScore: 0,
  bestScore: 0
});

const joinPopup = ref(false);
const joinInput = ref('');
const createRoomPopup = ref(false);
const roomTitleInput = ref('');
const activeRoomId = ref('');
const activeRoomIsCreator = ref(false);
const activeRoomConflictPopup = ref(false);
const helpPopup = ref(false);
const settingsPopup = ref(false);
const nicknamePopup = ref(false);
const newNickname = ref('');
const passwordPopup = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

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

const defaultStats = () => ({
  totalGames: 0,
  winGames: 0,
  winRate: 0,
  totalScore: 0,
  averageScore: 0,
  bestScore: 0
});

const greetingTitle = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好呀，今天手气如何？☀️';
  if (hour < 18) return '下午好，来一局提提神！🍵';
  return '晚上好，开桌快乐一下！🌙';
});

const dashboardSubtitle = computed(() => {
  if (!stats.value.totalGames) {
    return '还没开过局，从下面挑一个入口开始。';
  }
  return `已经玩了 ${stats.value.totalGames} 局，下一桌继续。`;
});

const displayAvatar = computed(() => resolveAvatarUrl(userInfo.value));

const sanitizeRoomTitle = (value = '') => value.replace(/\s+/g, ' ').trim().slice(0, 18);

const fallbackRoomTitle = computed(() => {
  const nickName = sanitizeRoomTitle(userInfo.value.nickName || '');
  return nickName ? `${nickName}的牌局` : '好友牌局';
});

const roomTitleLength = computed(() => sanitizeRoomTitle(roomTitleInput.value).length);

const roomTitleSuggestions = computed(() => {
  const suggestions = [
    fallbackRoomTitle.value,
    '今晚欢乐局',
    '手气回升局'
  ];

  return [...new Set(suggestions.filter(Boolean))].slice(0, 3);
});

const rhythmCopy = computed(() => {
  if (!stats.value.totalGames) return '打完第一局就会有评价哦';
  if (stats.value.winRate >= 60) return '最近手气爆棚，大杀四方！';
  if (stats.value.totalScore > 0) return '稳扎稳打，赢多输少。';
  return '起伏不定，下一局赢回来！';
});

const statusLabel = computed(() => {
  if (!stats.value.totalGames) return '萌新上路';
  if (stats.value.winRate >= 60) return '手感火热';
  if (stats.value.totalScore >= 0) return '稳如泰山';
  return '蛰伏蓄力';
});

const statusColorClass = computed(() => {
  if (!stats.value.totalGames) return 'blue';
  if (stats.value.winRate >= 60) return 'pink';
  if (stats.value.totalScore >= 0) return 'green';
  return 'yellow';
});

const requireAuth = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    redirectToLogin('/pages/index/index');
    return false;
  }
  return true;
};

const extractRoomId = (value) => {
  if (!value) return '';
  const normalized = decodeURIComponent(String(value).trim());
  const match = normalized.match(/roomId=([A-Za-z0-9]+)/i);
  if (match?.[1]) return match[1].toUpperCase();
  if (/^https?:/i.test(normalized)) return '';
  return normalized.replace(/\s+/g, '').toUpperCase();
};

const loadDashboard = async () => {
  // 优先从本地缓存读取，防止白屏等待
  const cachedUser = uni.getStorageSync('userInfo');
  if (cachedUser) {
    userInfo.value = cachedUser;
  }

  if (!requireAuth()) return;
  try {
    const profile = await api.getUserInfo();
    userInfo.value = profile;
    uni.setStorageSync('userInfo', profile);
    
    // 如果后端返回了正在进行的房间号，记录下来
    if (profile.activeRoomId) {
      activeRoomId.value = profile.activeRoomId;
      activeRoomIsCreator.value = profile.activeRoomIsCreator || false;
    } else {
      activeRoomId.value = '';
      activeRoomIsCreator.value = false;
    }
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' });
    return;
  }

  try {
    const summary = await api.getStats();
    stats.value = summary;
  } catch (error) {
    stats.value = defaultStats();
    console.error('加载统计数据失败:', error);
  }
};

const returnToActiveRoom = () => {
  if (activeRoomId.value) {
    navigateToPage(getRoomPageUrl(activeRoomId.value));
  }
};

const quickEndRoom = () => {
  if (!activeRoomId.value) return;
  showConfirm('结束对局', '这将会结算并结束该牌局，确认操作吗？', async () => {
    try {
      await api.settleRoom({ roomId: activeRoomId.value });
      uni.showToast({ title: '对局已结束', icon: 'success' });
      activeRoomId.value = '';
      activeRoomIsCreator.value = false;
      loadDashboard();
    } catch (err) {
      uni.showToast({ title: err.message || '结束失败', icon: 'none' });
    }
  }, true);
};

const openCreateRoomPopup = () => {
  if (!requireAuth()) return;
  if (activeRoomId.value) {
    activeRoomConflictPopup.value = true;
    return;
  }
  roomTitleInput.value = fallbackRoomTitle.value;
  createRoomPopup.value = true;
};

const closeActiveRoomConflict = () => {
  activeRoomConflictPopup.value = false;
};

const returnToExistingRoom = () => {
  closeActiveRoomConflict();
  returnToActiveRoom();
};

const leaveActiveRoomAndCreate = async () => {
  if (!activeRoomId.value) return;
  try {
    uni.showLoading({ title: '正在处理上一局...' });
    await api.exitRoom({ roomId: activeRoomId.value });
    activeRoomId.value = '';
    activeRoomIsCreator.value = false;
    closeActiveRoomConflict();
    roomTitleInput.value = fallbackRoomTitle.value;
    createRoomPopup.value = true;
  } catch (error) {
    uni.showToast({ title: error.message || '处理失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const endActiveRoomAndCreate = async () => {
  if (!activeRoomId.value) return;
  try {
    uni.showLoading({ title: '正在结束上一局...' });
    await api.settleRoom({ roomId: activeRoomId.value });
    activeRoomId.value = '';
    activeRoomIsCreator.value = false;
    closeActiveRoomConflict();
    roomTitleInput.value = fallbackRoomTitle.value;
    createRoomPopup.value = true;
    await loadDashboard();
  } catch (error) {
    uni.showToast({ title: error.message || '处理失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const applySuggestedTitle = (title) => {
  roomTitleInput.value = sanitizeRoomTitle(title);
};

const createRoom = async () => {
  if (!requireAuth()) return;
  try {
    uni.showLoading({ title: '正在建房...' });
    const title = sanitizeRoomTitle(roomTitleInput.value) || fallbackRoomTitle.value;
    const room = await api.createRoom({
      title,
      roomName: title
    });
    createRoomPopup.value = false;
    navigateToPage(getRoomPageUrl(room.roomId, true));
  } catch (error) {
    uni.showToast({ title: error.message || '创建失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const joinByRoomId = async (value, source = 'manual') => {
  if (!requireAuth()) return;
  const roomId = extractRoomId(value);
  if (!roomId) {
    uni.showToast({
      title: source === 'paste' ? '剪贴板里没找到房间号哦' : '请输入房间号',
      icon: 'none'
    });
    return;
  }
  try {
    uni.showLoading({ title: '正在加入...' });
    await api.joinRoom({ roomId });
    joinPopup.value = false;
    navigateToPage(getRoomPageUrl(roomId));
  } catch (error) {
    uni.showToast({ title: error.message || '加入失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const joinRoom = () => joinByRoomId(joinInput.value);

const pasteLink = () => {
  if (!requireAuth()) return;
  uni.getClipboardData({
    success: ({ data }) => {
      joinInput.value = data || '';
      joinByRoomId(data || '', 'paste');
    },
    fail: () => {
      uni.showToast({ title: '读取剪贴板失败啦', icon: 'none' });
    }
  });
};

const goToHistory = () => navigateToPage('/pages/history/history');

const openNicknamePopup = () => {
  settingsPopup.value = false;
  newNickname.value = userInfo.value.nickName;
  nicknamePopup.value = true;
};

const saveNickname = async () => {
  if (!newNickname.value || newNickname.value.length < 2) {
    uni.showToast({ title: '名字至少2个字呀', icon: 'none' });
    return;
  }
  try {
    const data = await api.updateUserInfo({ nickName: newNickname.value });
    userInfo.value = { ...userInfo.value, ...data };
    uni.setStorageSync('userInfo', userInfo.value);
    nicknamePopup.value = false;
    uni.showToast({ title: '改名成功！', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error.message || '改名失败', icon: 'none' });
  }
};

const openPasswordPopup = () => {
  settingsPopup.value = false;
  oldPassword.value = '';
  newPassword.value = '';
  confirmPassword.value = '';
  passwordPopup.value = true;
};

const savePassword = async () => {
  if (!oldPassword.value) return uni.showToast({ title: '当前密码没填哦', icon: 'none' });
  if (!newPassword.value || newPassword.value.length < 6) return uni.showToast({ title: '新密码太短啦', icon: 'none' });
  if (newPassword.value !== confirmPassword.value) return uni.showToast({ title: '两次新密码不一样', icon: 'none' });

  try {
    await api.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });
    passwordPopup.value = false;
    uni.showToast({ title: '密码修改成功', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error.message || '修改失败', icon: 'none' });
  }
};

const logout = () => {
  settingsPopup.value = false;
  showConfirm('退出登录', '要离开了吗？退出后需要重新登录哦', async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error(error);
    } finally {
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      redirectToLogin('/pages/index/index');
    }
  }, true);
};

onMounted(loadDashboard);
onShow(loadDashboard);
</script>

<style scoped lang="scss">
.index-page {
  display: flex;
  flex-direction: column;
}

.home-hero {
  padding: 30rpx;
  background: var(--card-bg-accent);
  border-color: rgba(255, 255, 255, 0.78);
}

.hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.hero-user {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.avatar {
  width: 108rpx;
  height: 108rpx;
  border-radius: 34rpx;
  background: var(--border-color);
  box-shadow: var(--shadow-xs);
}

.user-copy {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--text-strong);
}

.hero-caption {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: var(--text-sub);
  line-height: 1.5;
}

.setting-btn {
  min-width: 120rpx;
  min-height: 68rpx;
  padding: 0 20rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.74);
  color: var(--primary-strong);
  font-size: 24rpx;
  font-weight: 800;
  line-height: 1;
  box-shadow: var(--shadow-xs);
}

.hero-body {
  display: flex;
  align-items: stretch;
  gap: 18rpx;
  margin-top: 24rpx;
}

.hero-copy-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.greeting-title {
  display: block;
  font-size: 34rpx;
  font-weight: 900;
  color: var(--text-strong);
  line-height: 1.35;
}

.greeting-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 26rpx;
  color: var(--text-sub);
  line-height: 1.6;
}

.hero-mini-stats {
  width: 220rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.mini-stat {
  flex: 1;
  padding: 18rpx 20rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.7);
}

.mini-k {
  display: block;
  font-size: 22rpx;
  color: var(--text-sub);
}

.mini-v {
  display: block;
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 900;
  color: var(--text-strong);
}

.mini-v.positive {
  color: var(--accent-strong);
}

.mini-v.negative {
  color: #109c7a;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24rpx;
  margin-bottom: 28rpx;
}

.section-help-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 60rpx;
  padding: 0 18rpx 0 14rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.76);
  box-shadow: var(--shadow-xs);
  line-height: 1;
}

.section-help-dot {
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  color: var(--primary-strong);
  font-size: 20rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-help-text {
  font-size: 22rpx;
  font-weight: 800;
  color: var(--text-main);
}

.action-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12rpx;
  padding: 30rpx 26rpx;
  border-radius: var(--radius-lg);
  position: relative;
  overflow: hidden;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.action-card:active {
  transform: translateY(4rpx);
}

.action-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.create-box {
  background: var(--surface-blue);
}

.join-box {
  background: var(--surface-pink);
}

.action-icon {
  width: 92rpx;
  height: 92rpx;
  border-radius: 30rpx;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: var(--shadow-xs);
  font-size: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-title {
  font-size: 34rpx;
  font-weight: 900;
  color: var(--text-strong);
}

.action-desc {
  font-size: 24rpx;
  color: var(--text-sub);
  line-height: 1.5;
}

.action-chip {
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 18rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.72);
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1;
}

.action-chip.pink {
  color: var(--accent-strong);
}

.active-room-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20rpx;
  padding: 28rpx;
  margin-bottom: 28rpx;
  background: linear-gradient(135deg, rgba(255, 140, 171, 0.11), rgba(255, 204, 106, 0.14) 72%, rgba(255, 255, 255, 0.92));
  border-color: rgba(255, 255, 255, 0.8);
}

.active-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.active-icon {
  width: 82rpx;
  height: 82rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.8);
  color: var(--accent-strong);
  font-size: 34rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.active-text {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.active-title {
  font-size: 30rpx;
  font-weight: 900;
  color: var(--text-strong);
}

.active-desc {
  font-size: 24rpx;
  color: var(--text-sub);
  line-height: 1.5;
}

.active-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}

.end-btn {
  color: var(--accent-strong);
  border: 2rpx solid rgba(245, 111, 149, 0.18);
  background: rgba(255, 255, 255, 0.76);
  font-size: 22rpx;
  min-width: 156rpx;
}

.active-arrow {
  font-size: 24rpx;
  color: var(--primary-strong);
  font-weight: 800;
  background: rgba(255, 255, 255, 0.76);
  min-height: 64rpx;
  padding: 0 22rpx;
  border-radius: var(--radius-pill);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.stats-card {
  flex: 1;
  margin-top: 8rpx;
}

.stat-item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.stat-num {
  font-size: 42rpx;
  font-weight: 900;
  color: var(--text-strong);
  margin-bottom: 8rpx;
  &.positive { color: var(--accent-strong); }
  &.negative { color: #109c7a; }
  .unit {
    font-size: 24rpx;
    margin-left: 4rpx;
    font-weight: 700;
  }
}

.stat-label {
  font-size: 24rpx;
  color: var(--text-sub);
}

.rhythm-box {
  margin-top: 38rpx;
  padding: 24rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
  border: 2rpx solid rgba(255, 228, 233, 0.82);
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.78);
}
.rhythm-label {
  font-size: 26rpx;
  font-weight: 800;
  color: var(--text-main);
}
.rhythm-desc {
  width: 100%;
  font-size: 24rpx;
  color: var(--text-sub);
  margin-top: 8rpx;
}

.helper-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.helper-item {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 22rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid var(--divider);
}

.helper-index {
  width: 50rpx;
  height: 50rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  color: var(--primary-strong);
  font-size: 20rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.helper-text {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.65;
  color: var(--text-main);
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.sheet-panel {
  margin-top: auto;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  max-width: 100%;
}
.sheet-handle {
  width: 80rpx;
  height: 10rpx;
  background: #E2E8F0;
  border-radius: 10rpx;
  margin: 0 auto 30rpx;
}
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 20rpx;
}
.setting-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.74);
}
.setting-item:active {
  transform: scale(0.99);
}
.setting-item.danger {
  background: rgba(255, 240, 244, 0.84);
}
.setting-item.danger .st-title {
  color: #d63b69;
}
.setting-icon {
  font-size: 40rpx;
  margin-right: 24rpx;
}
.setting-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.st-title {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
}
.st-desc {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 6rpx;
}
.setting-arrow {
  width: 52rpx;
  height: 52rpx;
  border-radius: 18rpx;
  background: rgba(244, 247, 255, 0.9);
  border: 2rpx solid rgba(219, 229, 248, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-arrow::before {
  content: '';
  width: 14rpx;
  height: 14rpx;
  border-top: 4rpx solid var(--text-light);
  border-right: 4rpx solid var(--text-light);
  transform: translateX(-2rpx) rotate(45deg);
}

.create-room-panel {
  border-color: rgba(255, 255, 255, 0.8);
}

.create-room-group {
  gap: 14rpx;
}

.title-helper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.helper-main,
.helper-count {
  font-size: 22rpx;
  color: var(--text-sub);
}

.helper-count {
  font-weight: 800;
  color: var(--primary-strong);
}

.title-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.title-suggestion {
  min-height: 60rpx;
  padding: 0 20rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.82);
  border: 2rpx solid var(--divider);
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.helper-modal {
  max-width: 660rpx;
}

.conflict-actions {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

@media (max-width: 380px) {
  .hero-body,
  .active-room-card {
    flex-direction: column;
  }

  .hero-mini-stats {
    width: 100%;
    flex-direction: row;
  }

  .active-actions {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
  }

  .section-head {
    align-items: flex-start;
    gap: 14rpx;
  }

  .section-help-entry {
    min-height: 54rpx;
    padding: 0 16rpx 0 12rpx;
  }
}
</style>
