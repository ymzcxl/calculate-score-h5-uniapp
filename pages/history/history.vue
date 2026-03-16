<template>
  <view class="history-container">
    <!-- 用户信息卡片 -->
    <view class="user-card">
      <view class="user-info">
        <image :src="userInfo.avatarUrl" class="avatar"></image>
        <view class="user-details">
          <view class="nickname">{{ userInfo.nickName }}</view>
          <view class="total-score">总积分: {{ stats.totalScore }}</view>
        </view>
      </view>
      <view class="stats">
        <view class="stat-item">
          <view class="stat-icon">
            <u-icon name="game" size="28rpx" color="#4facfe"></u-icon>
          </view>
          <view class="stat-value">{{ stats.totalGames }}</view>
          <view class="stat-label">总场</view>
        </view>
        <view class="stat-item">
          <view class="stat-icon">
            <u-icon name="trophy" size="28rpx" color="#10b981"></u-icon>
          </view>
          <view class="stat-value">{{ stats.winGames }}</view>
          <view class="stat-label">胜场</view>
        </view>
        <view class="stat-item">
          <view class="stat-icon">
            <u-icon name="trend-up" size="28rpx" color="#f59e0b"></u-icon>
          </view>
          <view class="stat-value">{{ stats.winRate }}%</view>
          <view class="stat-label">胜率</view>
        </view>
      </view>
    </view>

    <!-- 历史记录列表 -->
    <view class="history-list">
      <view class="list-header">
        <view class="list-title">历史记录</view>
        <u-button @click="clearHistory" class="clear-button">
          清空历史记录
        </u-button>
      </view>
      <view class="year-section">
        <view class="year-title">{{ currentYear }}年</view>
        <view class="year-income">总积分: {{ stats.totalScore }}</view>
      </view>
      <view v-for="(record, index) in historyRecords" :key="index" class="record-item" :class="['record-result-' + record.result]">
        <view class="record-date">
          <view :class="['record-result', record.result]">{{ record.result === 'win' ? '胜' : record.result === 'draw' ? '平' : '负' }}</view>
          <view class="record-info">
            <view class="record-time">{{ record.time }}</view>
            <view class="record-opponents">{{ record.opponents.join('、') }}</view>
          </view>
        </view>
        <view class="record-score" :class="record.result === 'win' ? 'win-score' : record.result === 'lose' ? 'lose-score' : ''">
          {{ record.result === 'win' ? '+' : record.result === 'lose' ? '-' : '' }}{{ Math.abs(record.score) }}
        </view>
      </view>
      <view v-if="historyRecords.length === 0" class="empty-state">
        <div class="empty-icon">
          <u-icon name="history" size="100rpx" color="#d1d5db"></u-icon>
        </div>
        <view class="empty-text">暂无比赛记录</view>
        <u-button @click="goToHome" class="empty-button">去创建房间</u-button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const userInfo = ref({
  nickName: '未登录',
  avatarUrl: 'https://img.yzcdn.cn/vant/logo.png'
});

const stats = ref({
  totalGames: 0,
  winGames: 0,
  winRate: 0,
  totalScore: 0
});

const historyRecords = ref([]);
const currentYear = ref(new Date().getFullYear());

// 后端API地址
const API_BASE_URL = 'http://38.182.96.171:3000/api';

const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？',
    success: (res) => {
      if (res.confirm) {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.navigateTo({ url: '/pages/login/login' });
          return;
        }
        
        // 调用后端API清空历史记录
        uni.request({
          url: `${API_BASE_URL}/history/clear`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`
          },
          success: (res) => {
            if (res.data.code === 200) {
              historyRecords.value = [];
              uni.showToast({
                title: '历史记录已清空',
                icon: 'success'
              });
              loadStats();
            } else {
              uni.showToast({ title: res.data.message || '清空失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('清空历史记录失败:', err);
            uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
          }
        });
      }
    }
  });
};

const goToHome = () => {
  uni.navigateTo({
    url: '/pages/index/index'
  });
};

const loadHistoryRecords = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 调用后端API获取历史记录
  uni.request({
    url: `${API_BASE_URL}/history/list`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    },
    success: (res) => {
      if (res.data.code === 200) {
        historyRecords.value = res.data.data;
      } else {
        uni.showToast({ title: res.data.message || '获取历史记录失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('获取历史记录失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    }
  });
};

const loadStats = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    return;
  }
  
  // 调用后端API获取统计数据
  uni.request({
    url: `${API_BASE_URL}/history/stats`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    },
    success: (res) => {
      if (res.data.code === 200) {
        stats.value = {
          totalGames: res.data.data.totalGames,
          winGames: res.data.data.winGames,
          winRate: res.data.data.winRate,
          totalScore: res.data.data.totalScore
        };
      }
    },
    fail: (err) => {
      console.error('获取统计数据失败:', err);
    }
  });
};

onMounted(() => {
  const storedUserInfo = uni.getStorageSync('userInfo');
  if (storedUserInfo) {
    userInfo.value = storedUserInfo;
  } else {
    // 未登录，跳转到登录页
    uni.navigateTo({ url: '/pages/login/login' });
  }
  loadHistoryRecords();
  loadStats();
});
</script>

<style scoped>
.history-container {
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
  margin-bottom: 30rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.user-info:hover {
  transform: translateY(-2rpx);
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  margin-right: 24rpx;
  border: 5rpx solid #f8f9fa;
  box-shadow: 0 5rpx 20rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 8rpx 25rpx rgba(0, 0, 0, 0.15);
}

.user-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nickname {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  margin-bottom: 8rpx;
}

.total-score {
  font-size: 28rpx;
  font-weight: 600;
  color: #4facfe;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background-color: rgba(79, 172, 254, 0.1);
  padding: 8rpx 16rpx;
  border-radius: 50rpx;
  box-shadow: 0 2rpx 8rpx rgba(79, 172, 254, 0.2);
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
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.stat-value {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 4rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.stat-label {
  font-size: 18rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  text-align: center;
}

.history-list {
  background-color: #fff;
  border-radius: 32rpx;
  padding: 30rpx;
  width: 100%;
  max-width: 700rpx;
  box-shadow: 0 15rpx 50rpx rgba(0, 0, 0, 0.1);
  animation: fadeIn 0.8s ease-in-out;
  flex: 1;
  overflow-y: auto;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30rpx) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e9ecef;
}

.list-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.clear-button {
  font-size: 20rpx;
  padding: 10rpx 24rpx;
  border-radius: 50rpx;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
  color: #333;
  border: none;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.clear-button:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
  background-color: #e9ecef;
}

.year-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  margin-bottom: 24rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.year-section:hover {
  background-color: #e9ecef;
  transform: translateY(-4rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.year-title {
  font-size: 24rpx;
  font-weight: 600;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.year-income {
  font-size: 22rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-radius: 20rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  background-color: #fff;
  border: 2rpx solid #e9ecef;
  animation: recordSlideIn 0.4s ease-out;
}

@keyframes recordSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.record-item:hover {
  transform: translateX(10rpx) translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border-color: #4facfe;
}

.record-item.record-result-win:hover {
  border-color: #10b981;
  box-shadow: 0 0 0 3rpx rgba(16, 185, 129, 0.1);
}

.record-item.record-result-lose:hover {
  border-color: #ef4444;
  box-shadow: 0 0 0 3rpx rgba(239, 68, 68, 0.1);
}

.record-item.record-result-draw:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3rpx rgba(59, 130, 246, 0.1);
}

.record-date {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  flex: 1;
}

.record-result {
  font-size: 20rpx;
  padding: 8rpx 16rpx;
  border-radius: 50rpx;
  font-weight: 600;
  min-width: 56rpx;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.record-result.win {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  box-shadow: 0 2rpx 8rpx rgba(16, 185, 129, 0.2);
}

.record-result.draw {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  box-shadow: 0 2rpx 8rpx rgba(59, 130, 246, 0.2);
}

.record-result.lose {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  box-shadow: 0 2rpx 8rpx rgba(239, 68, 68, 0.2);
}

.record-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.record-time {
  font-size: 22rpx;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 500;
}

.record-opponents {
  font-size: 18rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.4;
}

.record-score {
  font-size: 28rpx;
  font-weight: 700;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  transition: all 0.3s ease;
  min-width: 80rpx;
  text-align: right;
}

.win-score {
  color: #10b981;
  text-shadow: 0 1rpx 3rpx rgba(16, 185, 129, 0.3);
}

.lose-score {
  color: #ef4444;
  text-shadow: 0 1rpx 3rpx rgba(239, 68, 68, 0.3);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  color: #999;
  animation: emptyFadeIn 0.6s ease-in-out;
  gap: 30rpx;
}

@keyframes emptyFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.empty-icon {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 24rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: #999;
}

.empty-button {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;
  padding: 16rpx 40rpx;
  font-size: 22rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.3);
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.empty-button:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 15rpx 40rpx rgba(79, 172, 254, 0.4);
}
</style>