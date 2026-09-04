<template>
  <view class="app-shell login-page">
    <!-- 活泼的背景装饰 -->
    <view class="bg-shape shape-1"></view>
    <view class="bg-shape shape-2"></view>
    <view class="bg-shape shape-3"></view>
    
    <!-- 头部品牌区 -->
    <view class="header-zone">
      <view class="logo-box">
        <text class="logo-icon">🎮</text>
      </view>
      <text class="brand-title">牌友记分</text>
      <text class="brand-sub">随时随地，开心开局</text>
      <view class="play-tags">
        <text class="play-tag pink">马卡龙开局</text>
        <text class="play-tag blue">实时同步</text>
      </view>
    </view>

    <!-- 登录注册卡片 -->
    <view class="macaron-card form-card">
      <view class="mode-switch">
        <view class="switch-bg" :class="{ 'is-right': isRegister }"></view>
        <view class="switch-item" :class="{ active: !isRegister }" @click="setMode(false)">登录</view>
        <view class="switch-item" :class="{ active: isRegister }" @click="setMode(true)">注册</view>
      </view>

      <view v-if="!isRegister && hasSavedAccount" class="welcome-strip">
        <text class="welcome-text">欢迎回来，已帮你填好上次的账号</text>
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
import { consumePendingRedirect, navigateToPage, reLaunchPage } from '../../utils/auth';

const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickName = ref('');
const loading = ref(false);
const isRegister = ref(false);
const rememberPwd = ref(true);
const hasSavedAccount = ref(false);

const normalizeRedirect = (target) => {
  if (typeof target !== 'string') {
    return '/pages/index/index';
  }

  const normalized = target.trim();
  if (!normalized.startsWith('/pages/')) {
    return '/pages/index/index';
  }

  return normalized;
};

const toggleRemember = () => {
  rememberPwd.value = !rememberPwd.value;
};

const resolveRedirect = () => normalizeRedirect(consumePendingRedirect() || '/pages/index/index');

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
    reLaunchPage(target);
  }, 350);
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
  navigateToPage('/pages/login/forgot-password');
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
    reLaunchPage(target);
  } else {
    // 自动填充记住的密码
    const savedAccount = uni.getStorageSync('savedAccount');
    if (savedAccount) {
      phone.value = savedAccount.phone || '';
      password.value = savedAccount.password || '';
      rememberPwd.value = true;
      hasSavedAccount.value = true;
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
  min-height: 100vh;
  padding: calc(env(safe-area-inset-top) + 60rpx) 40rpx 40rpx;
  background: transparent;
}

/* 背景装饰图形 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(24rpx);
  z-index: 0;
  opacity: 0.82;
}
.shape-1 {
  width: 430rpx;
  height: 430rpx;
  background: radial-gradient(circle, rgba(255, 179, 186, 0.95) 0%, rgba(255, 223, 226, 0.48) 62%, rgba(255,255,255,0) 100%);
  top: -120rpx;
  right: -110rpx;
}
.shape-2 {
  width: 520rpx;
  height: 520rpx;
  background: radial-gradient(circle, rgba(160, 196, 255, 0.98) 0%, rgba(212, 228, 255, 0.54) 64%, rgba(255,255,255,0) 100%);
  bottom: -180rpx;
  left: -160rpx;
}
.shape-3 {
  width: 260rpx;
  height: 260rpx;
  background: radial-gradient(circle, rgba(255, 253, 150, 0.85) 0%, rgba(255, 253, 150, 0.08) 72%, rgba(255,255,255,0) 100%);
  top: 220rpx;
  left: 80rpx;
}

.header-zone {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 48rpx;
  margin-top: -52rpx;
}

.logo-box {
  width: 156rpx;
  height: 156rpx;
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255, 244, 248, 0.96));
  border: 2rpx solid rgba(255,255,255,0.88);
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 22rpx 54rpx rgba(255, 179, 186, 0.25),
    0 10rpx 24rpx rgba(160, 196, 255, 0.15);
  margin-bottom: 28rpx;
  transform: rotate(-7deg);
}
.logo-icon {
  font-size: 84rpx;
}

.brand-title {
  font-size: 60rpx;
  font-weight: 800;
  color: var(--text-main);
  letter-spacing: 6rpx;
  text-shadow: 0 8rpx 20rpx rgba(255, 179, 186, 0.24);
}

.brand-sub {
  margin-top: 16rpx;
  font-size: 28rpx;
  color: #7c8594;
  background: rgba(255,255,255,0.8);
  padding: 12rpx 28rpx;
  border-radius: var(--radius-pill);
  box-shadow: 0 10rpx 24rpx rgba(160, 196, 255, 0.16);
}

.play-tags {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}

.play-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 150rpx;
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 24rpx rgba(160, 196, 255, 0.18);
}

.play-tag.pink {
  background: linear-gradient(135deg, #ffd7df, #fff2f5);
  color: #e7748a;
}

.play-tag.blue {
  background: linear-gradient(135deg, #dce8ff, #f0f6ff);
  color: #5b86db;
}

.form-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 660rpx;
  padding: 52rpx 42rpx 44rpx;
  box-sizing: border-box;
  border: 2rpx solid rgba(255,255,255,0.9);
  background: linear-gradient(180deg, rgba(255,255,255,0.97), rgba(255, 250, 252, 0.95));
  box-shadow:
    0 32rpx 72rpx rgba(160, 196, 255, 0.2),
    0 14rpx 32rpx rgba(255, 179, 186, 0.14);
}

.mode-switch {
  display: flex;
  position: relative;
  background: linear-gradient(135deg, rgba(160, 196, 255, 0.16), rgba(255, 179, 186, 0.18));
  border-radius: var(--radius-pill);
  height: 96rpx;
  margin-bottom: 50rpx;
  padding: 8rpx;
  box-sizing: border-box;
}

.switch-bg {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: calc(50% - 8rpx);
  height: 80rpx;
  background: linear-gradient(135deg, #ffffff, #fff8fb);
  border-radius: var(--radius-pill);
  box-shadow: 0 10rpx 26rpx rgba(160, 196, 255, 0.2);
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
  color: #8f99a7;
  transition: color 0.3s;
}
.switch-item.active {
  color: #4a4a4a;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.welcome-strip {
  margin: -18rpx 0 12rpx;
  padding: 18rpx 22rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, rgba(255, 223, 226, 0.72), rgba(212, 228, 255, 0.72));
  box-shadow: 0 10rpx 24rpx rgba(160, 196, 255, 0.12);
  text-align: center;
}

.welcome-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #6c7890;
}

.input-wrap {
  position: relative;
  background: linear-gradient(180deg, rgba(250, 251, 255, 0.96), rgba(255, 246, 249, 0.94));
  border: 2rpx solid rgba(212, 228, 255, 0.78);
  border-radius: 28rpx;
  box-shadow: inset 0 1rpx 0 rgba(255,255,255,0.9);
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
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  height: 104rpx;
}

.submit-btn {
  margin-top: 20rpx;
  font-size: 34rpx;
  letter-spacing: 2rpx;
  width: 100%;
  height: 104rpx;
  border: none !important;
  color: #fff !important;
  background: linear-gradient(135deg, #8db7ff, #6f9cff) !important;
  box-shadow: 0 20rpx 42rpx rgba(111, 156, 255, 0.34) !important;
  justify-content: center !important;
  align-items: center !important;
  text-align: center !important;
}

.submit-btn.pink {
  background: linear-gradient(135deg, #ffb3ba, #ff8da1) !important;
  box-shadow: 0 20rpx 42rpx rgba(255, 141, 161, 0.3) !important;
}

.remember-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 2rpx;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: rgba(255,255,255,0.72);
}
.checkbox-icon {
  font-size: 28rpx;
}
.remember-text {
  font-size: 26rpx;
  color: #7d8796;
}

.action-links {
  margin-top: 34rpx;
  text-align: center;
}

.link-text {
  font-size: 26rpx;
  color: #7c8dff;
  font-weight: bold;
  padding: 14rpx 24rpx;
  background: rgba(220, 232, 255, 0.45);
  border-radius: 999rpx;
}
</style>
