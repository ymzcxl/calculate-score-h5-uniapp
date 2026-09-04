<template>
  <view class="app-shell forgot-page">
    <!-- 活泼的背景装饰 -->
    <view class="bg-shape shape-1"></view>
    <view class="bg-shape shape-2"></view>
    
    <!-- 头部品牌区 -->
    <view class="header-zone">
      <view class="logo-box">
        <text class="logo-icon">🔑</text>
      </view>
      <text class="brand-title">找回密码</text>
      <text class="brand-sub">不要慌，马上就能回桌</text>
    </view>

    <!-- 重置密码卡片 -->
    <view class="macaron-card form-card">
      <view class="form-body">
        
        <view class="input-wrap">
          <text class="input-icon">📱</text>
          <input 
            class="macaron-input" 
            v-model.trim="phone" 
            type="number" 
            maxlength="11" 
            placeholder="注册时的手机号" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <view class="input-wrap">
          <text class="input-icon">👻</text>
          <input 
            class="macaron-input" 
            v-model.trim="nickName" 
            placeholder="注册时的昵称" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <view class="input-wrap">
          <text class="input-icon">🔒</text>
          <input 
            class="macaron-input" 
            v-model="newPassword" 
            password 
            placeholder="新密码 (至少6位)" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <view class="input-wrap">
          <text class="input-icon">✨</text>
          <input 
            class="macaron-input" 
            v-model="confirmPassword" 
            password 
            placeholder="确认新密码" 
            placeholder-class="macaron-input-placeholder"
          />
        </view>

        <button 
          class="macaron-btn pink submit-btn" 
          :loading="loading" 
          @click="resetPassword"
        >
          确 认 重 置 🚀
        </button>
      </view>

      <view class="action-links">
        <text class="link-text" @click="goToLogin">想起来了，返回登录 🔙</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../../utils/api';
import { navigateBackOrPage } from '../../utils/auth';

const phone = ref('');
const nickName = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const resetPassword = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号哦', icon: 'none' });
    return;
  }

  if (!nickName.value || nickName.value.length < 2) {
    uni.showToast({ title: '请输入注册昵称呀', icon: 'none' });
    return;
  }

  if (!newPassword.value || newPassword.value.length < 6) {
    uni.showToast({ title: '密码至少要 6 位', icon: 'none' });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致呢', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    await api.resetPassword({
      phone: phone.value,
      nickName: nickName.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value
    });
    uni.showToast({ title: '密码已重置 🎉', icon: 'success' });
    setTimeout(() => {
      goToLogin();
    }, 1000);
  } catch (error) {
    uni.showToast({ title: error.message || '重置失败了，再试一次', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  navigateBackOrPage('/pages/login/login');
};
</script>

<style scoped lang="scss">
.forgot-page {
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
  background: var(--warning); /* 柠檬黄 */
  top: -80rpx;
  left: -100rpx;
}
.shape-2 {
  width: 500rpx;
  height: 500rpx;
  background: var(--primary-light); /* 樱花粉 */
  bottom: -150rpx;
  right: -150rpx;
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
  box-shadow: 0 16rpx 32rpx rgba(255, 179, 186, 0.3);
  margin-bottom: 30rpx;
  transform: rotate(5deg);
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
