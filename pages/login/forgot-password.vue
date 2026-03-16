<template>
  <view class="forgot-container">
    <!-- 背景图 -->
    <view class="forgot-bg">
      <image src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=casino%20poker%20game%20background%20with%20cards%20and%20chips%2C%20blurred%2C%20colorful%2C%20casual%20style&image_size=landscape_16_9" mode="aspectFill" class="bg-image"></image>
    </view>
    
    <!-- 忘记密码弹窗 -->
    <view class="forgot-popup">
      <view class="popup-content">
        <view class="popup-header">
          <image src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=poker%20game%20logo%2C%20simple%20modern%20design%2C%20colorful%20cards%20icon&image_size=square" mode="aspectFit" class="popup-logo"></image>
          <view class="popup-title">忘记密码</view>
          <view class="popup-desc">通过微信验证身份后重置密码</view>
        </view>
        
        <!-- 微信登录验证 -->
        <view v-if="!wechatLoggedIn" class="wechat-login-section">
          <button @click="loginByWechat" class="wechat-button">
            <view class="wechat-icon">💬</view>
            <view class="wechat-text">微信登录验证</view>
          </button>
          <view class="wechat-tip">
            请使用注册时关联的微信账号登录
          </view>
        </view>
        
        <!-- 密码重置表单 -->
        <view v-else class="reset-form">
          <!-- 手机号输入 -->
          <view class="form-group">
            <input 
              v-model="phone" 
              placeholder="请输入注册手机号" 
              type="number" 
              maxlength="11"
              class="form-input"
            />
          </view>
          
          <!-- 新密码 -->
          <view class="form-group">
            <input 
              v-model="newPassword" 
              placeholder="请输入新密码"
              type="password"
              class="form-input"
            />
          </view>
          
          <!-- 确认新密码 -->
          <view class="form-group">
            <input 
              v-model="confirmPassword" 
              placeholder="请确认新密码"
              type="password"
              class="form-input"
            />
          </view>
          
          <!-- 操作按钮 -->
          <view class="action-buttons">
            <button 
              @click="resetPassword"
              class="action-button primary"
              :loading="loading"
              :disabled="!phone || phone.length !== 11 || !newPassword || !confirmPassword || newPassword !== confirmPassword"
            >
              重置密码
            </button>
            
            <button @click="goToLogin" class="action-button secondary">
              返回登录
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { currentConfig } from '../../config/env';

const phone = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);
const wechatLoggedIn = ref(false);
const wechatCode = ref('');

// 后端API地址
const API_BASE_URL = currentConfig.API_BASE_URL;

// 微信登录
const loginByWechat = () => {
  loading.value = true;
  
  // 使用uni的微信登录功能
  uni.login({
    provider: 'weixin',
    success: function (loginRes) {
      // 登录成功，标记为已登录
      wechatLoggedIn.value = true;
      wechatCode.value = loginRes.code;
      loading.value = false;
    },
    fail: function () {
      uni.showToast({ title: '微信登录失败', icon: 'none' });
      loading.value = false;
    }
  });
};

// 重置密码
const resetPassword = () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  
  if (!newPassword.value || !confirmPassword.value) {
    uni.showToast({ title: '请输入密码', icon: 'none' });
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' });
    return;
  }
  
  if (newPassword.value.length < 6) {
    uni.showToast({ title: '密码长度至少6位', icon: 'none' });
    return;
  }
  
  loading.value = true;
  
  uni.request({
    url: `${API_BASE_URL}/auth/reset-password`,
    method: 'POST',
    data: {
      wechatCode: wechatCode.value,
      phone: phone.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    },
    success: (res) => {
      if (res.data.code === 200) {
        uni.showToast({ title: '密码重置成功', icon: 'success' });
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/login' });
        }, 1000);
      } else {
        uni.showToast({ title: res.data.message || '重置密码失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      console.error('重置密码失败:', err);
    },
    complete: () => {
      loading.value = false;
    }
  });
};

// 返回登录页
const goToLogin = () => {
  uni.navigateTo({ url: '/pages/login/login' });
};

onMounted(() => {
  // 检查是否已登录
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo) {
    uni.reLaunch({ url: '/pages/index/index' });
  }
});
</script>

<style scoped>
.forgot-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.forgot-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

.bg-image {
  width: 100%;
  height: 100%;
  filter: blur(20rpx);
}

.forgot-popup {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  padding: 40rpx;
}

.popup-content {
  width: 100%;
  max-width: 500rpx;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 32rpx;
  padding: 60rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10rpx);
  animation: slideUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.popup-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.popup-logo {
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 30rpx;
  border-radius: 28rpx;
  box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.popup-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.popup-desc {
  font-size: 26rpx;
  color: #666;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  text-align: center;
}

.wechat-login-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.wechat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 36rpx;
  border-radius: 24rpx;
  border: none;
  font-size: 28rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  min-height: 120rpx;
  width: 100%;
  background: linear-gradient(135deg, #07C160 0%, #00a854 100%);
  color: #fff;
}

.wechat-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.wechat-tip {
  font-size: 24rpx;
  color: #666;
  text-align: center;
  margin-top: 16rpx;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-group {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.question-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 600;
}

.form-input {
  border-radius: 16rpx;
  height: 88rpx;
  font-size: 28rpx;
  background-color: #f8f9fa;
  border: none;
  box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  padding: 0 24rpx;
}

.form-input:focus {
  box-shadow: inset 0 2rpx 12rpx rgba(79, 172, 254, 0.2);
  background-color: #fff;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  margin-top: 20rpx;
}

.action-button {
  height: 96rpx;
  line-height: 96rpx;
  width: 100%;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.action-button.primary {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.3);
}

.action-button.secondary {
  background: #f8f9fa;
  color: #333;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.action-button:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 15rpx 40rpx rgba(0, 0, 0, 0.15);
}

.action-button:disabled {
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}
</style>
