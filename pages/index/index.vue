<template>
  <view class="index-page app-shell">
    <view class="profile-card glass-card">
      <view class="profile-main">
        <image class="avatar" :src="userInfo.avatarUrl || defaultAvatar"></image>
        <view class="profile-info">
          <view class="profile-name-row">
            <text class="profile-name">{{ userInfo.nickName || '未登录' }}</text>
            <text class="badge">UID {{ userInfo.uid || '--' }}</text>
          </view>
          <text class="profile-meta">{{ userInfo.phone || '未绑定手机号' }}</text>
        </view>
      </view>

      <view class="quick-actions">
        <button class="secondary-button" @click="openNicknamePopup">修改昵称</button>
        <button class="secondary-button" @click="openPasswordPopup">修改密码</button>
        <button class="secondary-button danger-button" @click="logout">退出登录</button>
      </view>
    </view>

    <view class="summary-grid">
      <view class="summary-card glass-card">
        <text class="summary-label">总场次</text>
        <text class="summary-value">{{ stats.totalGames }}</text>
      </view>
      <view class="summary-card glass-card">
        <text class="summary-label">胜率</text>
        <text class="summary-value">{{ stats.winRate }}%</text>
      </view>
      <view class="summary-card glass-card">
        <text class="summary-label">累计积分</text>
        <text class="summary-value">{{ stats.totalScore }}</text>
      </view>
    </view>

    <view class="panel glass-card">
      <view class="section-title">开局工作台</view>
      <view class="section-desc">创建房间后可直接复制链接发给朋友，或者输入房间号 / 链接进入。</view>

      <button class="primary-button full-button" @click="createRoom">创建实时房间</button>

      <view class="join-card">
        <input v-model.trim="joinInput" class="field" placeholder="输入房间号，或粘贴房间链接" />
        <view class="join-actions">
          <button class="secondary-button flex-1" @click="joinRoom">加入房间</button>
          <button class="secondary-button flex-1" @click="pasteClipboard">粘贴链接</button>
        </view>
      </view>
    </view>

    <view class="panel glass-card">
      <view class="panel-head">
        <view>
          <view class="section-title">数据总览</view>
          <view class="section-desc">基于真实对局和结算历史自动汇总。</view>
        </view>
        <button class="secondary-button" @click="goToHistory">查看历史</button>
      </view>

      <view class="analytics-grid">
        <view class="analytics-item">
          <text class="analytics-key">胜场</text>
          <text class="analytics-val">{{ stats.winGames }}</text>
        </view>
        <view class="analytics-item">
          <text class="analytics-key">平均得分</text>
          <text class="analytics-val">{{ stats.averageScore }}</text>
        </view>
        <view class="analytics-item">
          <text class="analytics-key">单局最佳</text>
          <text class="analytics-val">{{ stats.bestScore }}</text>
        </view>
      </view>
    </view>

    <view v-if="nicknamePopup" class="modal-mask" @click="nicknamePopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改昵称</view>
        <view class="section-desc">昵称会同步到你参与的后续牌局。</view>
        <input v-model.trim="newNickname" class="field field-spacing" placeholder="请输入新昵称" />
        <view class="modal-actions">
          <button class="secondary-button flex-1" @click="nicknamePopup = false">取消</button>
          <button class="primary-button flex-1" @click="saveNickname">保存</button>
        </view>
      </view>
    </view>

    <view v-if="passwordPopup" class="modal-mask" @click="passwordPopup = false">
      <view class="modal-panel glass-card" @click.stop>
        <view class="section-title">修改密码</view>
        <view class="section-desc">登录后的安全修改入口，适合 Web 账号体系。</view>
        <view class="field-list">
          <input v-model="oldPassword" class="field" password placeholder="请输入当前密码" />
          <input v-model="newPassword" class="field" password placeholder="请输入新密码" />
          <input v-model="confirmPassword" class="field" password placeholder="请确认新密码" />
        </view>
        <view class="modal-actions">
          <button class="secondary-button flex-1" @click="passwordPopup = false">取消</button>
          <button class="primary-button flex-1" @click="savePassword">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { getRoomPageUrl, redirectToLogin } from '../../utils/auth';

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=professional%20minimal%20playing%20cards%20app%20avatar%20icon%2C%20deep%20navy%20background%2C%20subtle%20glow%2C%20clean%20flat%20illustration&image_size=square';

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
const nicknamePopup = ref(false);
const newNickname = ref('');
const passwordPopup = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

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

  const trimmed = value.trim();
  const match = trimmed.match(/roomId=([A-Za-z0-9]+)/i);
  if (match?.[1]) {
    return match[1].toUpperCase();
  }

  return trimmed.toUpperCase();
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

const joinRoom = async () => {
  const roomId = extractRoomId(joinInput.value);
  if (!roomId) {
    uni.showToast({ title: '请输入房间号或房间链接', icon: 'none' });
    return;
  }

  try {
    await api.joinRoom({ roomId });
    uni.navigateTo({ url: getRoomPageUrl(roomId) });
  } catch (error) {
    uni.showToast({ title: error.message || '加入失败', icon: 'none' });
  }
};

const pasteClipboard = () => {
  uni.getClipboardData({
    success: ({ data }) => {
      joinInput.value = data || '';
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
    uni.showToast({ title: '已更新', icon: 'success' });
  } catch (error) {
    uni.showToast({ title: error.message || '更新失败', icon: 'none' });
  }
};

const openPasswordPopup = () => {
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

onMounted(loadDashboard);
</script>

<style scoped lang="scss">
.index-page {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.profile-card,
.panel {
  padding: 30rpx;
}

.profile-main {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.avatar {
  width: 116rpx;
  height: 116rpx;
  border-radius: 28rpx;
  border: 2rpx solid rgba(148, 163, 184, 0.2);
}

.profile-info {
  flex: 1;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  flex-wrap: wrap;
}

.profile-name {
  font-size: 38rpx;
  font-weight: 700;
  color: #f8fafc;
}

.profile-meta {
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.quick-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
  flex-wrap: wrap;
}

.summary-grid,
.analytics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
}

.summary-card,
.analytics-item {
  padding: 24rpx;
}

.summary-label,
.analytics-key {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
}

.summary-value,
.analytics-val {
  display: block;
  margin-top: 12rpx;
  font-size: 40rpx;
  font-weight: 700;
  color: #f8fafc;
}

.full-button {
  width: 100%;
  margin-top: 24rpx;
}

.join-card {
  margin-top: 22rpx;
  padding: 22rpx;
  border-radius: 28rpx;
  background: rgba(15, 23, 42, 0.66);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.join-actions,
.modal-actions,
.panel-head {
  display: flex;
  gap: 14rpx;
  align-items: center;
  justify-content: space-between;
}

.join-actions {
  margin-top: 18rpx;
}

.flex-1 {
  flex: 1;
}

.modal-mask {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(2, 6, 23, 0.6);
  padding: 24rpx;
}

.modal-panel {
  width: 100%;
  padding: 30rpx;
  border-radius: 36rpx;
}

.field-spacing {
  margin-top: 24rpx;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
  margin-bottom: 22rpx;
}
</style>
