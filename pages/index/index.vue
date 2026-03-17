<template>
  <view class="index-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image :src="userInfo.avatarUrl" class="avatar" @click="chooseAvatar"></image>
        <view class="user-details">
          <view class="nickname">{{ userInfo.nickName }}</view>
          <view class="uid">uid:{{ userInfo.uid }}</view>
          <view v-if="userInfo.phone" class="phone">{{ userInfo.phone }}</view>
          <view v-else class="phone-unbound" @click="bindPhone">绑定手机号</view>
        </view>
        <view class="user-actions">
          <view class="edit-button" @click="editNickname">
            <view class="edit-icon">✏️</view>
          </view>
          <view class="logout-button" @click="logout">
            <view class="logout-icon">🚪</view>
          </view>
        </view>
      </view>
      <view class="stats">
        <view class="stat-item">
          <view class="stat-icon">
            <view class="game-icon">🎮</view>
          </view>
          <view class="stat-value">{{ stats.totalGames }}</view>
          <view class="stat-label">总场</view>
        </view>
        <view class="stat-item">
          <view class="stat-icon">
            <view class="trophy-icon">🏆</view>
          </view>
          <view class="stat-value">{{ stats.winGames }}</view>
          <view class="stat-label">胜场</view>
        </view>
        <view class="stat-item">
          <view class="stat-icon">
            <view class="trend-icon">📈</view>
          </view>
          <view class="stat-value">{{ stats.winRate }}%</view>
          <view class="stat-label">胜率</view>
        </view>
      </view>
    </view>

    <!-- 功能按钮 -->
    <view class="action-buttons">
      <button @click="createRoom" class="action-button primary">
        <view class="create-icon">🏠</view>
        创建房间
      </button>
      <view class="action-row">
        <button @click="scanCode" class="action-button secondary scan">
          <view class="scan-icon">📷</view>
          扫码加入
        </button>
        <button @click="goToHistory" class="action-button secondary history">
          <view class="history-icon">📋</view>
          历史记录
        </button>
      </view>
    </view>

    <!-- 游戏统计 -->
    <view class="game-stats">
      <view class="stats-header">
        <view class="chart-icon">📊</view>
        <view class="stats-title">游戏统计</view>
      </view>
      <view class="stats-content">
        <view class="stat-card">
          <view class="stat-number">{{ stats.totalScore }}</view>
          <view class="stat-desc">总积分</view>
        </view>
        <view class="stat-card">
          <view class="stat-number">{{ stats.averageScore.toFixed(1) }}</view>
          <view class="stat-desc">平均得分</view>
        </view>
        <view class="stat-card">
          <view class="stat-number">{{ stats.bestScore }}</view>
          <view class="stat-desc">最高得分</view>
        </view>
      </view>
    </view>

    <!-- 昵称编辑弹窗 -->
    <view v-if="nicknamePopup" class="modal-overlay" @click="nicknamePopup = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title">修改昵称</view>
          <view class="modal-close" @click="nicknamePopup = false">✕</view>
        </view>
        <view class="popup-content">
          <input v-model="newNickname" placeholder="请输入新昵称" class="popup-input" autofocus />
          <view class="popup-buttons">
            <button @click="nicknamePopup = false" class="popup-button cancel">取消</button>
            <button @click="saveNickname" class="popup-button confirm">保存</button>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 绑定手机号弹窗 -->
    <view v-if="bindPhonePopup" class="modal-overlay" @click="bindPhonePopup = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title">绑定手机号</view>
          <view class="modal-close" @click="bindPhonePopup = false">✕</view>
        </view>
        <view class="popup-content">
          <input v-model="bindPhoneNumber" placeholder="请输入手机号" type="number" maxlength="11" class="popup-input" />
          <input v-model="bindPhonePassword" placeholder="请输入密码" type="password" class="popup-input" />
          <input v-model="bindPhoneConfirmPassword" placeholder="请确认密码" type="password" class="popup-input" />
          <view class="popup-buttons">
            <button @click="bindPhonePopup = false" class="popup-button cancel">取消</button>
            <button @click="saveBindPhone" class="popup-button confirm">绑定</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const userInfo = ref({
  nickName: '未登录',
  avatarUrl: 'https://img.yzcdn.cn/vant/logo.png',
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

const nicknamePopup = ref(false);
const newNickname = ref('');
const bindPhonePopup = ref(false);
const bindPhoneNumber = ref('');
const bindPhonePassword = ref('');
const bindPhoneConfirmPassword = ref('');

const chooseAvatar = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: (res) => {
      userInfo.value.avatarUrl = res.tempFilePaths[0];
      // 调用云函数更新用户信息
      updateUserInfo();
    }
  });
};

const editNickname = () => {
  newNickname.value = userInfo.value.nickName;
  setTimeout(() => {
    nicknamePopup.value = true;
  }, 100);
};

const saveNickname = () => {
  if (newNickname.value) {
    userInfo.value.nickName = newNickname.value;
    // 调用云函数更新用户信息
    updateUserInfo();
    nicknamePopup.value = false;
  }
};

const updateUserInfo = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 调用云函数更新用户信息
  uniCloud.callFunction({
    name: 'user',
    data: {
      action: 'updateUserInfo',
      uid: userInfo.value.uid,
      nickName: userInfo.value.nickName,
      avatarUrl: userInfo.value.avatarUrl
    },
    success: (res) => {
      if (res.result.code === 200) {
        // 更新成功
        uni.setStorageSync('userInfo', userInfo.value);
        uni.showToast({ title: '更新成功', icon: 'success' });
      } else {
        uni.showToast({ title: '更新失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('更新用户信息失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    }
  });
};

const createRoom = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  uni.showLoading({ title: '创建房间中...' });
  
  // 调用云函数创建房间
  uniCloud.callFunction({
    name: 'room',
    data: {
      action: 'createRoom',
      uid: userInfo.value.uid
    },
    success: (res) => {
      if (res.result.code === 200) {
        const roomId = res.result.data.roomId;
        uni.navigateTo({
          url: `/pages/room/room?roomId=${roomId}&isCreator=true`
        });
      } else {
        uni.showToast({ title: res.result.message || '创建房间失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('创建房间失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    },
    complete: () => {
      uni.hideLoading();
    }
  });
};

const goToHistory = () => {
  uni.navigateTo({
    url: '/pages/history/history'
  });
};

const scanCode = () => {
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res);
      // 解析扫码结果，获取房间信息
      const roomId = res.result;
      if (roomId) {
        uni.navigateTo({
          url: `/pages/room/room?roomId=${roomId}`
        });
      }
    },
    fail: (error) => {
      console.error('扫码失败:', error);
      uni.showToast({
        title: '扫码失败',
        icon: 'none'
      });
    }
  });
};

const loadStats = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 调用云函数获取用户统计数据
  uniCloud.callFunction({
    name: 'user',
    data: {
      action: 'getUserStats',
      uid: userInfo.value.uid
    },
    success: (res) => {
      if (res.result.code === 200) {
        // 更新统计数据
        stats.value = res.result.data;
      } else {
        console.error('获取统计数据失败:', res.result.message);
      }
    },
    fail: (err) => {
      console.error('获取统计数据失败:', err);
    }
  });
};

const loadUserInfo = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  const storedUserInfo = uni.getStorageSync('userInfo');
  if (storedUserInfo) {
    userInfo.value = storedUserInfo;
  } else {
    uni.navigateTo({ url: '/pages/login/login' });
  }
};

const bindPhone = () => {
  bindPhonePopup.value = true;
};

const saveBindPhone = () => {
  if (!bindPhoneNumber.value || bindPhoneNumber.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  
  if (!bindPhonePassword.value || bindPhonePassword.value.length < 6) {
    uni.showToast({ title: '密码长度至少6位', icon: 'none' });
    return;
  }
  
  if (bindPhonePassword.value !== bindPhoneConfirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' });
    return;
  }
  
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 调用云函数更新用户信息
  uniCloud.callFunction({
    name: 'user',
    data: {
      action: 'updateUserInfo',
      uid: userInfo.value.uid,
      phone: bindPhoneNumber.value,
      password: bindPhonePassword.value
    },
    success: (res) => {
      if (res.result.code === 200) {
        // 更新成功
        userInfo.value.phone = bindPhoneNumber.value;
        uni.setStorageSync('userInfo', userInfo.value);
        uni.showToast({ title: '手机号绑定成功', icon: 'success' });
        bindPhonePopup.value = false;
      } else {
        uni.showToast({ title: '绑定失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('绑定手机号失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    }
  });
};

const logout = () => {
  uni.showModal({
    title: '确认退出',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除本地存储
        uni.removeStorageSync('userInfo');
        uni.removeStorageSync('token');
        uni.showToast({ title: '退出成功', icon: 'success' });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/login/login' });
        }, 1000);
      }
    }
  });
};

onMounted(() => {
  const storedUserInfo = uni.getStorageSync('userInfo');
  if (storedUserInfo) {
    userInfo.value = storedUserInfo;
    loadUserInfo();
    loadStats();
  } else {
    // 未登录，跳转到登录页
    uni.navigateTo({ url: '/pages/login/login' });
  }
});
</script>

<style scoped>
.index-container {
  padding: 20rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30rpx;
}

.user-card {
  background-color: #fff;
  border-radius: 32rpx;
  padding: 40rpx;
  width: 100%;
  max-width: 700rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
  animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.user-card::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(79, 172, 254, 0.1), transparent);
  transform: rotate(45deg);
  animation: shine 3s infinite;
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }
  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

.user-card:hover {
  box-shadow: 0 25rpx 70rpx rgba(0, 0, 0, 0.15);
  transform: translateY(-4rpx);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.user-actions {
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.edit-button,
.logout-button {
  padding: 12rpx;
  border-radius: 50%;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.edit-icon,
.logout-icon {
  font-size: 32rpx;
  color: #6b7280;
}

.edit-button:hover,
.logout-button:hover {
  background-color: #e9ecef;
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.logout-button:hover {
  background-color: #fee2e2;
  color: #dc2626;
}

.logout-button:hover .logout-icon {
  color: #dc2626;
}

.avatar {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 6rpx solid #f8f9fa;
  transition: all 0.3s ease;
  box-shadow: 0 5rpx 20rpx rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
}

.user-details {
  flex: 1;
}

.nickname {
  font-size: 42rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 8rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.uid {
  font-size: 26rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.phone {
  font-size: 24rpx;
  color: #4facfe;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  margin-top: 4rpx;
}

.phone-unbound {
  font-size: 24rpx;
  color: #ff6b6b;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  margin-top: 4rpx;
  cursor: pointer;
  text-decoration: underline;
  transition: all 0.3s ease;
}

.phone-unbound:hover {
  color: #ff5252;
  transform: scale(1.02);
}

.stats {
  display: flex;
  justify-content: space-around;
  padding-top: 30rpx;
  border-top: 2rpx solid #e9ecef;
  gap: 20rpx;
  position: relative;
  z-index: 1;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx;
  border-radius: 20rpx;
  transition: all 0.3s ease;
  flex: 1;
  background-color: #f8f9fa;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.stat-item:hover {
  background-color: #e9ecef;
  transform: translateY(-6rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.game-icon,
.trophy-icon,
.trend-icon {
  font-size: 32rpx;
  color: #4facfe;
}

.trophy-icon {
  color: #10b981;
}

.trend-icon {
  color: #f59e0b;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 4rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  text-align: center;
}

.action-buttons {
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  width: 100%;
  max-width: 700rpx;
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.action-row {
  display: flex;
  gap: 20rpx;
}

.action-button {
  border-radius: 24rpx;
  font-size: 30rpx;
  padding: 32rpx 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  width: 100%;
  font-weight: 600;
  border: none;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  color: #fff;
  background: #4facfe;
}

.scan-icon,
.history-icon,
.create-icon {
  font-size: 32rpx;
  color: #fff;
  margin-right: 12rpx;
  transition: all 0.3s ease;
}

.action-button.primary {
  background: #4facfe;
  box-shadow: 0 12rpx 32rpx rgba(79, 172, 254, 0.3);
}

.action-button.secondary {
  flex: 1;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.action-button.secondary.scan {
  background: #ff6b6b;
  box-shadow: 0 12rpx 32rpx rgba(255, 107, 107, 0.3);
}

.action-button.secondary.history {
  background: #8338ec;
  box-shadow: 0 12rpx 32rpx rgba(131, 56, 236, 0.3);
}

.action-button:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 16rpx 40rpx rgba(0, 0, 0, 0.15);
}

.action-button:hover .scan-icon,
.action-button:hover .history-icon,
.action-button:hover .create-icon {
  transform: scale(1.1);
}

.game-stats {
  background-color: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  width: 100%;
  max-width: 700rpx;
  box-shadow: 0 15rpx 50rpx rgba(0, 0, 0, 0.1);
  animation: slideUp 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both;
}

.stats-header {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e9ecef;
}

.chart-icon {
  font-size: 28rpx;
  color: #4facfe;
  margin-right: 12rpx;
}

.stats-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.stats-content {
  display: flex;
  justify-content: space-around;
  gap: 20rpx;
}

.stat-card {
  flex: 1;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  padding: 24rpx;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.stat-card:hover {
  background-color: #e9ecef;
  transform: translateY(-4rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.stat-number {
  font-size: 40rpx;
  font-weight: 700;
  color: #4facfe;
  margin-bottom: 8rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.stat-desc {
  font-size: 24rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.popup-content {
  padding: 50rpx;
  background-color: #fff;
  border-radius: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  animation: popupSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.popup-input {
  margin: 30rpx 0;
  border: 2rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
  outline: none;
  width: 100%;
}

.popup-input:focus {
  border-color: #4facfe;
  box-shadow: 0 0 0 3rpx rgba(79, 172, 254, 0.1);
}

.popup-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 50rpx;
  gap: 20rpx;
}

.popup-button {
  flex: 1;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background: none;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.popup-button.cancel {
  background-color: #f8f9fa;
  color: #333;
}

.popup-button.confirm {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.popup-button:hover {
  transform: translateY(-3rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: #fff;
  border-radius: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: popupSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 90%;
  max-width: 640rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 2rpx solid #e9ecef;
  background-color: #f8f9fa;
}

.modal-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.modal-close {
  font-size: 32rpx;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #333;
  transform: scale(1.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>