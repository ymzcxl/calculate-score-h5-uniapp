<template>
  <view class="login-container">
    <!-- 背景图 -->
    <view class="login-bg">
      <image src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=casino%20poker%20game%20background%20with%20cards%20and%20chips%2C%20blurred%2C%20colorful%2C%20casual%20style&image_size=landscape_16_9" mode="aspectFill" class="bg-image"></image>
    </view>
    
    <!-- 登录选择弹窗 -->
    <view class="login-popup">
      <view class="popup-content">
        <view class="popup-header">
          <image src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=poker%20game%20logo%2C%20simple%20modern%20design%2C%20colorful%20cards%20icon&image_size=square" mode="aspectFit" class="popup-logo"></image>
          <view class="popup-title">打牌算分</view>
          <view class="popup-desc">轻松计分，快乐打牌</view>
        </view>
        
        <view class="login-options">
          <!-- 微信登录 -->
          <button @click="loginByWechat" class="login-option wechat">
            <view class="option-icon wechat-icon">💬</view>
            <view class="option-text">微信登录</view>
          </button>
          
          <!-- 手机登录 -->
          <button @click="showPhoneLogin = true" class="login-option phone">
            <view class="option-icon phone-icon">📱</view>
            <view class="option-text">手机号登录</view>
          </button>
        </view>
      </view>
    </view>
    
    <!-- 手机号登录弹窗 -->
    <view v-if="showPhoneLogin" class="phone-login-popup">
      <view class="phone-popup-content">
        <view class="phone-popup-header">
          <view class="phone-popup-title">{{ isRegister ? '手机号注册' : '手机号登录' }}</view>
          <view class="close-btn" @click="showPhoneLogin = false">✕</view>
        </view>
        
        <view class="phone-login-form">
          <view class="form-group">
            <input 
              v-model="phone" 
              placeholder="请输入手机号" 
              type="number" 
              maxlength="11"
              class="form-input"
            />
          </view>
          
          <view class="form-group">
            <input 
              v-model="password" 
              placeholder="请输入密码" 
              type="password"
              class="form-input"
            />
          </view>
          
          <view v-if="isRegister" class="form-group">
            <input 
              v-model="confirmPassword" 
              placeholder="请确认密码" 
              type="password"
              class="form-input"
            />
          </view>
          
          <view v-if="isRegister" class="form-group">
            <input 
              v-model="nickName" 
              placeholder="请输入昵称" 
              class="form-input"
            />
          </view>
          

          
          <button 
            @click="handlePhoneAuth"
            class="login-button"
            :loading="loading"
          >
            {{ isRegister ? '注册' : '登录' }}
          </button>
          
          <view class="switch-mode">
            <text @click="isRegister = !isRegister">
              {{ isRegister ? '已有账号？去登录' : '没有账号？去注册' }}
            </text>
            <text v-if="!isRegister" @click="goToForgotPassword" class="forgot-password">忘记密码？</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickName = ref('');
const loading = ref(false);
const showPhoneLogin = ref(false);
const isRegister = ref(false);

const loginByPhone = () => {
  // 表单验证
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  
  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码长度至少6位', icon: 'none' });
    return;
  }
  
  loading.value = true;
  
  // 调用云函数密码登录
  uniCloud.callFunction({
    name: 'user',
    data: {
      action: 'passwordLogin',
      phone: phone.value,
      password: password.value
    },
    success: (res) => {
      if (res.result.code === 200) {
        // 登录成功
        const userInfo = res.result.data;
        uni.setStorageSync('userInfo', userInfo);
        uni.setStorageSync('token', 'uniCloud_token'); // 简化处理，使用固定token
        uni.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } else {
        // 登录失败
        uni.showToast({ title: res.result.message || '登录失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      console.error('登录失败:', err);
    },
    complete: () => {
      loading.value = false;
    }
  });
};

const handlePhoneAuth = () => {
  if (isRegister.value) {
    registerByPhone();
  } else {
    loginByPhone();
  }
};

const registerByPhone = () => {
  // 表单验证
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }
  
  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码长度至少6位', icon: 'none' });
    return;
  }
  
  if (!confirmPassword.value || password.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码输入不一致', icon: 'none' });
    return;
  }
  
  if (!nickName.value || nickName.value.length < 2) {
    uni.showToast({ title: '昵称长度至少2位', icon: 'none' });
    return;
  }
  
  loading.value = true;
  
  // 调用云函数注册
  uniCloud.callFunction({
    name: 'user',
    data: {
      action: 'login',
      uid: 'phone_' + phone.value,
      nickName: nickName.value,
      avatarUrl: 'https://img.yzcdn.cn/vant/logo.png',
      password: password.value,
      phone: phone.value
    },
    success: (res) => {
      if (res.result.code === 200) {
        // 注册成功
        const userInfo = res.result.data;
        uni.setStorageSync('userInfo', userInfo);
        uni.setStorageSync('token', 'uniCloud_token'); // 简化处理，使用固定token
        uni.showToast({ title: '注册成功', icon: 'success' });
        setTimeout(() => {
          uni.reLaunch({ url: '/pages/index/index' });
        }, 1000);
      } else {
        // 注册失败
        uni.showToast({ title: res.result.message || '注册失败', icon: 'none' });
      }
    },
    fail: (err) => {
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      console.error('注册失败:', err);
    },
    complete: () => {
      loading.value = false;
    }
  });
};

const loginByWechat = () => {
  loading.value = true;
  
  // 使用uni的微信登录功能
  uni.login({
    provider: 'weixin',
    success: function (loginRes) {
      // 获取用户信息
      uni.getUserInfo({
        provider: 'weixin',
        success: function (infoRes) {
          // 调用云函数微信登录
          uniCloud.callFunction({
            name: 'user',
            data: {
              action: 'login',
              uid: 'wechat_' + loginRes.code,
              nickName: infoRes.userInfo.nickName,
              avatarUrl: infoRes.userInfo.avatarUrl
            },
            success: (res) => {
              if (res.result.code === 200) {
                // 登录成功
                const userInfo = res.result.data;
                uni.setStorageSync('userInfo', userInfo);
                uni.setStorageSync('token', 'uniCloud_token'); // 简化处理，使用固定token
                uni.showToast({ title: '登录成功', icon: 'success' });
                setTimeout(() => {
                  uni.reLaunch({ url: '/pages/index/index' });
                }, 1000);
              } else {
                // 登录失败
                uni.showToast({ title: res.result.message || '登录失败', icon: 'none' });
              }
            },
            fail: (err) => {
              uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
              console.error('微信登录失败:', err);
            },
            complete: () => {
              loading.value = false;
            }
          });
        },
        fail: function () {
          uni.showToast({ title: '获取用户信息失败', icon: 'none' });
          loading.value = false;
        }
      });
    },
    fail: function () {
      uni.showToast({ title: '微信登录失败', icon: 'none' });
      loading.value = false;
    }
  });
};

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/login/forgot-password' });
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
.login-container {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-bg {
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

.login-popup {
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
}

.login-options {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.login-option {
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
  width: 300rpx;
}

.login-option.wechat {
  background: linear-gradient(135deg, #07C160 0%, #00a854 100%);
  color: #fff;
}

.login-option.phone {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.login-option:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
}

.option-icon {
  font-size: 40rpx;
  margin-right: 16rpx;
}

.option-text {
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 手机号登录弹窗 */
.phone-login-popup {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.phone-popup-content {
  width: 90%;
  max-width: 500rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx;
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

.phone-popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  padding-bottom: 20rpx;
  border-bottom: 2rpx solid #e9ecef;
}

.phone-popup-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.close-btn {
  font-size: 36rpx;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #333;
  transform: scale(1.1);
}

.phone-login-form {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.form-group {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  flex: 1;
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

.code-btn {
  color: #4facfe;
  font-size: 24rpx;
  padding: 0 24rpx;
  font-weight: 600;
  white-space: nowrap;
}

.login-button {
  height: 96rpx;
  line-height: 96rpx;
  width: 100%;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  border: none;
  box-shadow: 0 10rpx 30rpx rgba(79, 172, 254, 0.3);
  transition: all 0.3s ease;
  color: #fff;
  margin-top: 20rpx;
}

.login-button:hover {
  transform: translateY(-4rpx);
  box-shadow: 0 15rpx 40rpx rgba(79, 172, 254, 0.4);
}

.switch-mode {
  text-align: center;
  margin-top: 24rpx;
  font-size: 24rpx;
  color: #4facfe;
}

.switch-mode text {
  cursor: pointer;
  font-weight: 600;
}

.switch-mode text:hover {
  text-decoration: underline;
}

.forgot-password {
  margin-left: 20rpx;
  color: #ff6b6b;
}

.forgot-password:hover {
  text-decoration: underline;
  color: #ff5252;
}
</style>