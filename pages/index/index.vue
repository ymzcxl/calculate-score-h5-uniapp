<template>
  <view class="index-page app-shell">
    
    <!-- 顶部个人信息卡片 -->
    <view class="macaron-card user-card">
      <view class="user-header">
        <image class="avatar" :src="userInfo.avatarUrl || defaultAvatar"></image>
        <view class="user-info">
          <view class="name-row">
            <text class="nickname">{{ userInfo.nickName || '牌局玩家' }}</text>
            <text class="macaron-badge yellow">UID: {{ userInfo.uid || '--' }}</text>
          </view>
          <text class="phone">{{ userInfo.phone || '未绑定手机号' }}</text>
        </view>
        <view class="setting-btn" @click="settingsPopup = true">⚙️</view>
      </view>
      
      <view class="greeting">
        <text class="greeting-title">{{ greetingTitle }}</text>
        <text class="greeting-sub">{{ dashboardSubtitle }}</text>
      </view>
    </view>

    <!-- 核心操作区 -->
    <view class="action-grid">
      <view class="action-card create-box" @click="createRoom">
        <view class="action-icon">🎲</view>
        <text class="action-title">创建房间</text>
        <text class="action-desc">当房主，拉好友</text>
      </view>
      
      <view class="action-card join-box" @click="joinPopup = true">
        <view class="action-icon">🚀</view>
        <text class="action-title">加入牌局</text>
        <text class="action-desc">输入房间号</text>
      </view>
    </view>
    
    <!-- 正在进行的房间提示 -->
    <view v-if="activeRoomId" class="macaron-card active-room-card">
      <view class="active-content" @click="returnToActiveRoom">
        <text class="active-icon">🔥</text>
        <view class="active-text">
          <text class="active-title">你有正在进行的牌局</text>
          <text class="active-desc">房间号: {{ activeRoomId }}</text>
        </view>
      </view>
      <view class="active-actions">
        <button v-if="activeRoomIsCreator" class="macaron-btn ghost small end-btn" @click.stop="quickEndRoom">结束</button>
        <view class="active-arrow" @click="returnToActiveRoom">回桌 ></view>
      </view>
    </view>

    <!-- 数据统计卡片 -->
    <view class="macaron-card stats-card">
      <view class="card-title">
        <text class="icon">📊</text> 我的战绩
        <text class="more-link" @click="goToHistory">查看全部 ></text>
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

    <!-- 弹窗：加入房间 -->
    <view v-if="joinPopup" class="modal-mask" @click="joinPopup = false">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">加入房间 🚀</view>
        <view class="modal-desc">输入朋友分享的房间号或者链接</view>
        <input
          v-model.trim="joinInput"
          class="macaron-input"
          placeholder="例如：R123456"
          confirm-type="done"
          @confirm="joinRoom"
        />
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="pasteLink">剪贴板识别</button>
          <button class="macaron-btn" @click="joinRoom">确 认</button>
        </view>
      </view>
    </view>

    <!-- 弹窗：设置菜单 -->
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
            <view class="setting-arrow">></view>
          </view>
          
          <view class="setting-item" @click="openPasswordPopup">
            <view class="setting-icon">🔑</view>
            <view class="setting-text">
              <text class="st-title">修改密码</text>
              <text class="st-desc">账号安全第一</text>
            </view>
            <view class="setting-arrow">></view>
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

    <!-- 弹窗：修改昵称 -->
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

    <!-- 弹窗：修改密码 -->
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

  </view>
</template>

<script setup>
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { api } from '../../utils/api';
import { getRoomPageUrl, redirectToLogin } from '../../utils/auth';

const defaultAvatar = 'https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=cute%20pastel%20macaron%20avatar%20icon%20for%20card%20game%20app%2C%20kawaii%20style%2C%20flat%20design%2C%20clean&image_size=square';

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
const activeRoomId = ref('');
const activeRoomIsCreator = ref(false);
const settingsPopup = ref(false);
const nicknamePopup = ref(false);
const newNickname = ref('');
const passwordPopup = ref(false);
const oldPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

const greetingTitle = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return '早上好呀，今天手气如何？☀️';
  if (hour < 18) return '下午好，来一局提提神！🍵';
  return '晚上好，开桌快乐一下！🌙';
});

const dashboardSubtitle = computed(() => {
  if (!stats.value.totalGames) {
    return '还没有记录呢，快拉上朋友开一局吧~';
  }
  return `已经玩了 ${stats.value.totalGames} 局，继续保持节奏！`;
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
  if (!requireAuth()) return;
  try {
    const [profile, summary] = await Promise.all([
      api.getUserInfo(),
      api.getStats()
    ]);
    userInfo.value = profile;
    stats.value = summary;
    
    // 如果后端返回了正在进行的房间号，记录下来
    if (profile.activeRoomId) {
      activeRoomId.value = profile.activeRoomId;
      activeRoomIsCreator.value = profile.activeRoomIsCreator || false;
    } else {
      activeRoomId.value = '';
      activeRoomIsCreator.value = false;
    }
    
    uni.setStorageSync('userInfo', profile);
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' });
  }
};

const returnToActiveRoom = () => {
  if (activeRoomId.value) {
    uni.navigateTo({ url: getRoomPageUrl(activeRoomId.value) });
  }
};

const quickEndRoom = () => {
  if (!activeRoomId.value) return;
  uni.showModal({
    title: '结束当局',
    content: '这将会结算并结束该牌局，确认操作吗？',
    confirmColor: '#f43f5e',
    success: async (res) => {
      if (res.confirm) {
        try {
          await api.settleRoom({ roomId: activeRoomId.value });
          uni.showToast({ title: '对局已结束', icon: 'success' });
          activeRoomId.value = '';
          activeRoomIsCreator.value = false;
          loadDashboard();
        } catch (err) {
          uni.showToast({ title: err.message || '结束失败', icon: 'none' });
        }
      }
    }
  });
};

const createRoom = async () => {
  if (!requireAuth()) return;
  try {
    uni.showLoading({ title: '正在建房...' });
    const room = await api.createRoom({});
    uni.navigateTo({ url: getRoomPageUrl(room.roomId, true) });
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
    uni.navigateTo({ url: getRoomPageUrl(roomId) });
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

const goToHistory = () => uni.navigateTo({ url: '/pages/history/history' });

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

const logout = async () => {
  settingsPopup.value = false;
  uni.showModal({
    title: '要离开了吗？',
    content: '退出后需要重新登录哦',
    success: async ({ confirm }) => {
      if (!confirm) return;
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
}

.user-card {
  background: linear-gradient(135deg, #fff, #f0f7ff);
}
.user-header {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}
.avatar {
  width: 100rpx;
  height: 100rpx;
  border-radius: 32rpx;
  background: var(--border-color);
  margin-right: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}
.user-info {
  flex: 1;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 8rpx;
}
.nickname {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--text-main);
}
.phone {
  font-size: 24rpx;
  color: var(--text-sub);
}
.setting-btn {
  font-size: 40rpx;
  padding: 10rpx;
  opacity: 0.8;
}

.greeting-title {
  display: block;
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-main);
  margin-bottom: 8rpx;
}
.greeting-sub {
  font-size: 26rpx;
  color: var(--text-sub);
}

.action-grid {
  display: flex;
  gap: 24rpx;
  margin-bottom: 28rpx;
}
.action-card {
  flex: 1;
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 32rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s;
}
.action-card:active {
  transform: scale(0.96);
}
.create-box {
  background: linear-gradient(135deg, var(--secondary-light), #fff);
}
.join-box {
  background: linear-gradient(135deg, var(--primary-light), #fff);
}
.action-icon {
  font-size: 64rpx;
  margin-bottom: 16rpx;
}
.action-title {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-main);
  margin-bottom: 8rpx;
}
.action-desc {
  font-size: 22rpx;
  color: var(--text-sub);
}

.active-room-card {
  background: linear-gradient(135deg, #FFF0F2, #FFFDF0);
  border: 2rpx solid #FFDFE2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 30rpx;
  margin-bottom: 28rpx;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(255, 179, 186, 0.4); }
  70% { box-shadow: 0 0 0 16rpx rgba(255, 179, 186, 0); }
  100% { box-shadow: 0 0 0 0 rgba(255, 179, 186, 0); }
}
.active-content {
  display: flex;
  align-items: center;
  gap: 20rpx;
}
.active-icon {
  font-size: 48rpx;
}
.active-text {
  display: flex;
  flex-direction: column;
}
.active-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #f43f5e;
}
.active-desc {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 4rpx;
}
.active-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.end-btn {
  color: #f43f5e;
  border: 1rpx solid #f43f5e;
  background: rgba(244, 63, 94, 0.05);
  font-size: 22rpx;
  padding: 6rpx 20rpx;
}
.active-arrow {
  font-size: 24rpx;
  color: #f43f5e;
  font-weight: bold;
  background: rgba(244, 63, 94, 0.1);
  padding: 8rpx 20rpx;
  border-radius: var(--radius-pill);
}

.stats-card {
  flex: 1;
}
.card-title {
  font-size: 32rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  .icon { margin-right: 12rpx; }
  .more-link {
    margin-left: auto;
    font-size: 24rpx;
    color: var(--secondary);
    font-weight: normal;
  }
}
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}
.stat-item {
  background: #F8FAFC;
  border-radius: var(--radius-md);
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}
.stat-num {
  font-size: 40rpx;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 8rpx;
  &.positive { color: #f43f5e; } /* 赢了用粉红色醒目 */
  &.negative { color: #10b981; }
  .unit { font-size: 24rpx; margin-left: 4rpx; font-weight: normal; }
}
.stat-label {
  font-size: 24rpx;
  color: var(--text-sub);
}

.rhythm-box {
  background: #fff5f5;
  border-radius: var(--radius-md);
  padding: 24rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12rpx;
}
.rhythm-label {
  font-size: 26rpx;
  font-weight: bold;
  color: var(--text-main);
}
.rhythm-desc {
  width: 100%;
  font-size: 24rpx;
  color: var(--text-sub);
  margin-top: 8rpx;
}

/* 弹窗样式 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
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
.input-group {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

/* 底部上拉菜单 */
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
  background: #F8FAFC;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}
.setting-item:active {
  background: #F1F5F9;
}
.setting-item.danger {
  background: #FFF1F2;
}
.setting-item.danger .st-title {
  color: #E11D48;
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
  font-weight: bold;
  color: var(--text-main);
}
.st-desc {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 6rpx;
}
.setting-arrow {
  color: var(--text-light);
  font-weight: bold;
}
</style>
