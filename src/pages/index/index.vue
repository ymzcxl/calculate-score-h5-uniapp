<template>
  <view class="index-page app-shell">
    <view class="launch-card glass-card">
      <view class="launch-top">
        <view class="user-brief">
          <image class="avatar" :src="userInfo.avatarUrl || defaultAvatar"></image>
          <view class="user-copy">
            <view class="user-row">
              <text class="user-name">{{ userInfo.nickName || '牌局玩家' }}</text>
              <text class="badge">UID {{ userInfo.uid || '--' }}</text>
            </view>
            <text class="user-meta">{{ userInfo.phone || '未绑定手机号' }}</text>
          </view>
        </view>
        <button class="settings-trigger" @click="settingsPopup = true">账号设置</button>
      </view>

      <view class="launch-head">
        <view class="launch-copy">
          <view class="panel-label">Quick Start</view>
          <view class="hero-title">{{ greetingTitle }}</view>
          <view class="section-desc">创建、加入、粘贴链接都在首屏完成。</view>
        </view>
        <text class="availability-pill">可直接开局</text>
      </view>

      <button class="primary-button launch-button" @click="createRoom">创建房间</button>

      <view class="join-panel">
        <view class="join-head">
          <text class="join-title">加入房间</text>
          <text class="join-hint">房间号 / 邀请链接</text>
        </view>
        <input
          v-model.trim="joinInput"
          class="field"
          placeholder="输入房间号，或粘贴分享链接"
          confirm-type="done"
          @confirm="joinRoom"
        />
        <view class="join-actions">
          <button class="secondary-button flex-1" @click="joinRoom">加入房间</button>
          <button class="secondary-button flex-1" @click="pasteLink">粘贴并识别</button>
        </view>
      </view>

      <view class="meta-row">
        <text class="meta-chip">创建后可直接分享</text>
        <text class="meta-chip">支持链接识别</text>
        <text class="meta-chip">历史自动归档</text>
      </view>
    </view>

    <view class="stat-grid">
      <view class="metric-card stat-card">
        <text class="metric-label">累计场次</text>
        <text class="metric-value">{{ stats.totalGames }}</text>
      </view>
      <view class="metric-card stat-card">
        <text class="metric-label">胜率</text>
        <text class="metric-value">{{ stats.winRate }}%</text>
      </view>
      <view class="metric-card stat-card">
        <text class="metric-label">累计积分</text>
        <text class="metric-value">{{ stats.totalScore }}</text>
      </view>
    </view>

    <view class="history-card glass-card">
      <view class="panel-head">
        <view class="history-copy">
          <view class="panel-label">History</view>
          <view class="section-title">最近战绩</view>
          <view class="section-desc">{{ historyHint }}</view>
        </view>
        <button class="secondary-button compact-button" @click="goToHistory">查看</button>
      </view>

      <view class="history-grid">
        <view class="metric-card history-metric">
          <text class="metric-label">胜场</text>
          <text class="metric-value">{{ stats.winGames }}</text>
        </view>
        <view class="metric-card history-metric">
          <text class="metric-label">平均得分</text>
          <text class="metric-value">{{ stats.averageScore }}</text>
        </view>
        <view class="metric-card history-metric">
          <text class="metric-label">单局最佳</text>
          <text class="metric-value">{{ stats.bestScore }}</text>
        </view>
      </view>
    </view>

    <view v-if="settingsPopup" class="modal-mask" @click="settingsPopup = false">
      <view class="settings-sheet glass-card" @click.stop>
        <view class="sheet-handle"></view>
        <view class="sheet-header">
          <view>
            <view class="panel-label">Account</view>
            <view class="section-title">账号设置</view>
          </view>
          <text class="sheet-meta">{{ userInfo.phone || '未绑定手机号' }}</text>
        </view>

        <view class="settings-list">
          <button class="action-item" @click="openNicknamePopup">
            <view class="action-copy-block">
              <text class="action-title">修改昵称</text>
              <text class="action-copy">更新房间和历史里的展示名称</text>
            </view>
            <text class="action-tag">进入</text>
          </button>
          <button class="action-item" @click="openPasswordPopup">
            <view class="action-copy-block">
              <text class="action-title">修改密码</text>
              <text class="action-copy">调整当前账号的登录密码</text>
            </view>
            <text class="action-tag">进入</text>
          </button>
          <button class="action-item danger" @click="logout">
            <view class="action-copy-block">
              <text class="action-title">退出登录</text>
              <text class="action-copy">退出当前设备，下次重新验证</text>
            </view>
            <text class="action-tag danger">退出</text>
          </button>
        </view>
      </view>
    </view>

    <view v-if="nicknamePopup" class="modal-mask" @click="nicknamePopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改昵称</view>
        <view class="section-desc">更新后会同步到后续房间与历史战绩。</view>
        <input v-model.trim="newNickname" class="field modal-field" placeholder="输入新的昵称" />
        <view class="modal-actions">
          <button class="secondary-button flex-1" @click="nicknamePopup = false">取消</button>
          <button class="primary-button flex-1" @click="saveNickname">保存昵称</button>
        </view>
      </view>
    </view>

    <view v-if="passwordPopup" class="modal-mask" @click="passwordPopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改密码</view>
        <view class="section-desc">确认当前密码后，立即替换为新密码。</view>
        <view class="field-list">
          <input v-model="oldPassword" class="field" password placeholder="输入当前密码" />
          <input v-model="newPassword" class="field" password placeholder="输入新的登录密码" />
          <input v-model="confirmPassword" class="field" password placeholder="再次确认新的密码" />
        </view>
        <view class="modal-actions">
          <button class="secondary-button flex-1" @click="passwordPopup = false">取消</button>
          <button class="primary-button flex-1" @click="savePassword">保存密码</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '../../utils/api';
import { getRoomPageUrl, redirectToLogin } from '../../utils/auth';

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=refined%20dark%20playing%20cards%20avatar%20icon%2C%20premium%20minimal%20mobile%20app%20style%2C%20warm%20gold%20accent%2C%20clean%20graphic&image_size=square';

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

const joinInput = ref('');
const settingsPopup = ref(false);
const nicknamePopup = ref(false);
const newNickname = ref('');
const passwordPopup = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const greetingTitle = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) {
    return '现在适合直接开桌';
  }
  if (hour < 18) {
    return '继续一局，动作放前面';
  }
  return '朋友到位就能马上开局';
});

const historyHint = computed(() => {
  if (!stats.value.totalGames) {
    return '还没有已结算牌局，开完第一桌后这里会自动出现。';
  }

  return `已完成 ${stats.value.totalGames} 局，平均 ${stats.value.averageScore} 分。`;
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
  if (!value) {
    return '';
  }

  const normalized = decodeURIComponent(String(value).trim());
  const match = normalized.match(/roomId=([A-Za-z0-9]+)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  if (/^https?:/i.test(normalized)) {
    return '';
  }

  return normalized.replace(/\s+/g, '').toUpperCase();
};

const loadDashboard = async () => {
  if (!requireAuth()) {
    return;
  }

  try {
    const [profile, summary] = await Promise.all([
      api.getUserInfo(),
      api.getStats()
    ]);
    userInfo.value = profile;
    stats.value = summary;
    uni.setStorageSync('userInfo', profile);
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' });
  }
};

const createRoom = async () => {
  if (!requireAuth()) {
    return;
  }

  try {
    uni.showLoading({ title: '正在创建' });
    const room = await api.createRoom({});
    uni.navigateTo({
      url: getRoomPageUrl(room.roomId, true)
    });
  } catch (error) {
    uni.showToast({ title: error.message || '创建失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const joinByRoomId = async (value, source = 'manual') => {
  if (!requireAuth()) {
    return;
  }

  const roomId = extractRoomId(value);
  if (!roomId) {
    uni.showToast({
      title: source === 'paste' ? '剪贴板里没有可识别的房间链接' : '请输入房间号或房间链接',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({ title: '正在加入' });
    await api.joinRoom({ roomId });
    uni.navigateTo({ url: getRoomPageUrl(roomId) });
  } catch (error) {
    uni.showToast({ title: error.message || '加入失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const joinRoom = () => joinByRoomId(joinInput.value);

const pasteLink = () => {
  if (!requireAuth()) {
    return;
  }

  uni.getClipboardData({
    success: ({ data }) => {
      joinInput.value = data || '';
      joinByRoomId(data || '', 'paste');
    },
    fail: () => {
      uni.showToast({ title: '读取剪贴板失败', icon: 'none' });
    }
  });
};

const goToHistory = () => {
  uni.navigateTo({ url: '/pages/history/history' });
};

const openNicknamePopup = () => {
  settingsPopup.value = false;
  newNickname.value = userInfo.value.nickName;
  nicknamePopup.value = true;
};

const saveNickname = async () => {
  if (!newNickname.value || newNickname.value.length < 2) {
    uni.showToast({ title: '昵称至少 2 位', icon: 'none' });
    return;
  }

  try {
    const data = await api.updateUserInfo({ nickName: newNickname.value });
    userInfo.value = {
      ...userInfo.value,
      ...data
    };
    uni.setStorageSync('userInfo', userInfo.value);
    nicknamePopup.value = false;
    uni.showToast({ title: '昵称已更新', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error.message || '更新失败', icon: 'none' });
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
  if (!oldPassword.value) {
    uni.showToast({ title: '请输入当前密码', icon: 'none' });
    return;
  }

  if (!newPassword.value || newPassword.value.length < 6) {
    uni.showToast({ title: '新密码至少 6 位', icon: 'none' });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次新密码不一致', icon: 'none' });
    return;
  }

  try {
    await api.changePassword({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });
    passwordPopup.value = false;
    uni.showToast({ title: '密码已修改', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error.message || '修改失败', icon: 'none' });
  }
};

const logout = async () => {
  settingsPopup.value = false;
  uni.showModal({
    title: '退出登录',
    content: '退出后仍可重新登录继续历史对局，确认退出吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }

      try {
        await api.logout();
      } catch (error) {
        console.error(error);
      } finally {
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        redirectToLogin('/pages/index/index');
      }
    }
  });
};

onShow(loadDashboard);
</script>

<style scoped lang="scss">
.index-page {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.launch-card,
.history-card,
.settings-sheet,
.modal-panel {
  padding: 30rpx;
}

.launch-top,
.launch-head,
.panel-head,
.modal-actions,
.join-actions,
.join-head,
.sheet-header {
  display: flex;
  justify-content: space-between;
  gap: 14rpx;
}

.launch-top,
.launch-head,
.modal-actions,
.join-actions {
  align-items: center;
}

.user-brief {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-width: 0;
  flex: 1;
}

.avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 26rpx;
  border: 1rpx solid var(--border-strong);
}

.user-copy {
  min-width: 0;
  flex: 1;
}

.user-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10rpx;
}

.user-name {
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 700;
}

.user-meta {
  display: block;
  margin-top: 8rpx;
  color: var(--text-muted);
  font-size: 22rpx;
}

.settings-trigger {
  min-height: 64rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  border: 1rpx solid var(--border-soft);
  background: var(--surface-3);
  color: var(--text-secondary);
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.launch-head {
  margin-top: 28rpx;
  align-items: flex-start;
}

.launch-copy {
  flex: 1;
}

.hero-title {
  margin-top: 10rpx;
  font-size: 48rpx;
  line-height: 1.14;
  font-weight: 700;
  color: var(--text-primary);
}

.availability-pill {
  display: inline-flex;
  align-items: center;
  min-height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--success-surface);
  color: var(--success);
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.launch-button {
  width: 100%;
  margin-top: 24rpx;
}

.join-panel {
  margin-top: 18rpx;
  padding: 24rpx;
  border-radius: 28rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
}

.join-head {
  align-items: center;
  margin-bottom: 16rpx;
}

.join-title {
  color: var(--text-primary);
  font-size: 26rpx;
  font-weight: 700;
}

.join-hint {
  color: var(--text-muted);
  font-size: 22rpx;
}

.join-actions {
  margin-top: 16rpx;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  min-height: 48rpx;
  padding: 0 16rpx;
  border-radius: 999rpx;
  background: var(--surface-4);
  color: var(--text-secondary);
  font-size: 20rpx;
}

.stat-grid,
.history-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
}

.stat-card,
.history-metric {
  padding: 22rpx;
}

.panel-head {
  align-items: flex-start;
}

.history-copy {
  flex: 1;
}

.compact-button {
  min-height: 72rpx;
  padding: 0 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.history-grid {
  margin-top: 22rpx;
}

.sheet-header {
  align-items: flex-start;
}

.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  margin: 0 auto 18rpx;
  border-radius: 999rpx;
  background: var(--surface-5);
}

.sheet-meta {
  color: var(--text-muted);
  font-size: 22rpx;
}

.settings-list,
.field-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 24rpx;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  width: 100%;
  padding: 24rpx;
  border-radius: 28rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
  text-align: left;
}

.action-item.danger {
  background: linear-gradient(180deg, var(--surface-3), rgba(130, 58, 58, 0.08));
}

.action-copy-block {
  flex: 1;
  min-width: 0;
}

.action-title {
  display: block;
  color: var(--text-primary);
  font-size: 28rpx;
  font-weight: 700;
}

.action-copy {
  display: block;
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: 23rpx;
  line-height: 1.58;
}

.action-tag {
  color: var(--accent);
  font-size: 22rpx;
  font-weight: 700;
}

.action-tag.danger {
  color: var(--danger);
}

.modal-panel {
  width: 100%;
  border-radius: 34rpx;
}

.settings-sheet {
  width: 100%;
  border-radius: 34rpx;
}

.modal-field {
  margin: 26rpx 0 22rpx;
}

.flex-1 {
  flex: 1;
}
</style>
