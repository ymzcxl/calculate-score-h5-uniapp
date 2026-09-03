<template>
  <view class="app-shell login-page">
    <!-- 活泼的背景装饰 -->
    <view class="bg-shape shape-1"></view>
    <view class="bg-shape shape-2"></view>
    
    <!-- 头部品牌区 -->
    <view class="header-zone">
      <view class="logo-box">
        <text class="logo-icon">🎮</text>
      </view>
      <text class="brand-title">牌友记分</text>
      <text class="brand-sub">随时随地，开心开局</text>
    </view>

    <!-- 登录注册卡片 -->
    <view class="macaron-card form-card">
      <view class="mode-switch">
        <view class="switch-bg" :class="{ 'is-right': isRegister }"></view>
        <view class="switch-item" :class="{ active: !isRegister }" @click="setMode(false)">登录</view>
        <view class="switch-item" :class="{ active: isRegister }" @click="setMode(true)">注册</view>
      </view>

      <view class="form-body">
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input 
            class="macaron-input" 
            v-model.trim="phone" 
            type="number" 
            maxlength="11" 
            placeholder="手机号" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input 
            class="macaron-input" 
            v-model="password" 
            password 
            placeholder="密码" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <block v-if="isRegister">
          <view class="input-wrap">
            <text class="input-icon">✨</text>
            <input 
              class="macaron-input" 
              v-model="confirmPassword" 
              password 
              placeholder="确认密码" 
              placeholder-class="macaron-input-placeholder"
            />
          </view>
          <view class="input-wrap">
            <text class="input-icon">👻</text>
            <input 
              class="macaron-input" 
              v-model.trim="nickName" 
              placeholder="给自己起个响亮的昵称" 
              placeholder-class="macaron-input-placeholder"
            />
          </view>
        </block>

        <button 
          class="macaron-btn submit-btn" 
          :class="{ pink: isRegister }" 
          :loading="loading" 
          @click="handlePhoneAuth"
        >
          {{ isRegister ? '开 始 注 册 🚀' : '进 入 牌 局 🎉' }}
        </button>
        
        <!-- 记住密码 -->
        <view v-if="!isRegister" class="remember-wrap" @click="toggleRemember">
          <view class="checkbox-icon">
            <text v-if="rememberPwd">✅</text>
            <text v-else>⬜</text>
          </view>
          <text class="remember-text">记住密码</text>
        </view>
      </view>

      <view v-if="!isRegister" class="action-links">
        <text class="link-text" @click="goToForgotPassword">忘记密码咯？</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { consumePendingRedirect } from '../../utils/auth';

const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickName = ref('');
const loading = ref(false);
const isRegister = ref(false);
const rememberPwd = ref(true);

const toggleRemember = () => {
  rememberPwd.value = !rememberPwd.value;
};

const resolveRedirect = () => {
  return consumePendingRedirect() || '/pages/index/index';
};

const persistLogin = (payload) => {
  uni.setStorageSync('userInfo', payload.user);
  uni.setStorageSync('token', payload.token);
  
  if (rememberPwd.value && !isRegister.value) {
    uni.setStorageSync('savedAccount', { phone: phone.value, password: password.value });
  } else if (!rememberPwd.value) {
    uni.removeStorageSync('savedAccount');
  }

  uni.showToast({ title: isRegister.value ? '欢迎新牌友!' : '欢迎回来!', icon: 'none', duration: 1500 });
  const target = resolveRedirect();
  setTimeout(() => {
    uni.reLaunch({ url: target });
  }, 1000);
};

const handlePhoneAuth = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的11位手机号哦', icon: 'none' });
    return;
  }
  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码至少要6位呀', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    if (isRegister.value) {
      if (!nickName.value || nickName.value.length < 2) {
        throw new Error('昵称太短啦，至少2个字');
      }
      if (password.value !== confirmPassword.value) {
        throw new Error('两次密码输入不一致呢');
      }

      const data = await api.register({
        phone: phone.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        nickName: nickName.value
      });
      persistLogin(data);
    } else {
      const data = await api.loginByPhone({
        phone: phone.value,
        password: password.value
      });
      persistLogin(data);
    }
  } catch (error) {
    uni.showToast({ title: error.message || '操作失败了，再试一次', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/login/forgot-password' });
};

const setMode = (mode) => {
  isRegister.value = mode;
  confirmPassword.value = '';
  if (mode && !nickName.value) {
    nickName.value = '';
  }
};

onMounted(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    const target = resolveRedirect();
    uni.reLaunch({ url: target });
  } else {
    // 自动填充记住的密码
    const savedAccount = uni.getStorageSync('savedAccount');
    if (savedAccount) {
      phone.value = savedAccount.phone || '';
      password.value = savedAccount.password || '';
      rememberPwd.value = true;
    }
  }
});
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

/* 背景装饰图形 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(60rpx);
  z-index: 0;
  opacity: 0.6;
}
.shape-1 {
  width: 400rpx;
  height: 400rpx;
  background: var(--primary-light);
  top: -100rpx;
  right: -100rpx;
}
.shape-2 {
  width: 500rpx;
  height: 500rpx;
  background: var(--secondary-light);
  bottom: -150rpx;
  left: -150rpx;
}

.header-zone {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
  margin-top: -100rpx;
}

.logo-box {
  width: 140rpx;
  height: 140rpx;
  background: #fff;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 16rpx 32rpx rgba(160, 196, 255, 0.2);
  margin-bottom: 30rpx;
  transform: rotate(-5deg);
}
.logo-icon {
  font-size: 72rpx;
}

.brand-title {
  font-size: 56rpx;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: 4rpx;
  text-shadow: 0 4rpx 12rpx rgba(0,0,0,0.05);
}

.brand-sub {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: var(--text-sub);
  background: rgba(255,255,255,0.6);
  padding: 8rpx 24rpx;
  border-radius: var(--radius-pill);
}

.form-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 660rpx;
  padding: 50rpx 40rpx;
  box-sizing: border-box;
}

.mode-switch {
  display: flex;
  position: relative;
  background: #F4F6F9;
  border-radius: var(--radius-pill);
  height: 88rpx;
  margin-bottom: 50rpx;
  padding: 8rpx;
  box-sizing: border-box;
}

.switch-bg {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: calc(50% - 8rpx);
  height: 72rpx;
  background: #fff;
  border-radius: var(--radius-pill);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.08);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.switch-bg.is-right {
  transform: translateX(100%);
}

.switch-item {
  flex: 1;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  font-weight: bold;
  color: var(--text-sub);
  transition: color 0.3s;
}
.switch-item.active {
  color: var(--text-main);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.input-wrap {
  position: relative;
}

.input-icon {
  position: absolute;
  left: 28rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 32rpx;
  z-index: 1;
}

.input-wrap .macaron-input {
  padding-left: 80rpx; /* 为图标留出空间 */
}

.submit-btn {
  margin-top: 20rpx;
  font-size: 34rpx;
  letter-spacing: 2rpx;
}

.remember-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: -10rpx;
  padding: 10rpx;
}
.checkbox-icon {
  font-size: 28rpx;
}
.remember-text {
  font-size: 26rpx;
  color: var(--text-sub);
}

.action-links {
  margin-top: 40rpx;
  text-align: center;
}

.link-text {
  font-size: 26rpx;
  color: var(--secondary);
  font-weight: bold;
  padding: 10rpx 20rpx;
}
</style>
