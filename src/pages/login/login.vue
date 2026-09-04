<template>
  <view class="login-page app-shell">
    <view class="login-shell">
      <view class="brand-row">
        <text class="brand-title">牌友记分</text>
        <text class="brand-sub">手机号登录，进来就能开局。</text>
      </view>

      <view class="macaron-card auth-card">
        <view class="mode-switch">
          <view class="switch-track" :class="{ 'is-right': isRegister }"></view>
          <view class="switch-item" :class="{ active: !isRegister }" @click="setMode(false)">登录</view>
          <view class="switch-item" :class="{ active: isRegister }" @click="setMode(true)">注册</view>
        </view>

        <view v-if="!isRegister && hasSavedAccount" class="saved-tip">
          <view class="saved-dot"></view>
          <text class="saved-text">已填入上次账号</text>
        </view>

        <view class="form-body">
          <view class="field-group">
            <text class="field-label">手机号</text>
            <input
              class="macaron-input slim-input"
              v-model.trim="phone"
              type="number"
              maxlength="11"
              placeholder="输入 11 位手机号"
              placeholder-class="macaron-input-placeholder"
            />
          </view>

          <view class="field-group">
            <text class="field-label">密码</text>
            <input
              class="macaron-input slim-input"
              v-model="password"
              password
              placeholder="至少 6 位密码"
              placeholder-class="macaron-input-placeholder"
            />
          </view>

          <block v-if="isRegister">
            <view class="field-group">
              <text class="field-label">确认密码</text>
              <input
                class="macaron-input slim-input"
                v-model="confirmPassword"
                password
                placeholder="再次输入密码"
                placeholder-class="macaron-input-placeholder"
              />
            </view>

            <view class="field-group">
              <text class="field-label">昵称</text>
              <input
                class="macaron-input slim-input"
                v-model.trim="nickName"
                placeholder="房间里显示的名字"
                placeholder-class="macaron-input-placeholder"
              />
            </view>
          </block>

          <view v-if="!isRegister" class="helper-row">
            <view class="remember-wrap" @click="toggleRemember">
              <view class="remember-box" :class="{ active: rememberPwd }">
                <text>{{ rememberPwd ? '✓' : '' }}</text>
              </view>
              <text class="remember-text">记住密码</text>
            </view>
            <text class="helper-link" @click="goToForgotPassword">忘记密码</text>
          </view>

          <button
            class="macaron-btn submit-btn"
            :class="{ pink: isRegister }"
            :loading="loading"
            @click="handlePhoneAuth"
          >
            {{ isRegister ? '注册并进入' : '登录进入' }}
          </button>
        </view>
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

  uni.showToast({ title: isRegister.value ? '注册成功' : '登录成功', icon: 'none', duration: 1200 });
  const target = resolveRedirect();
  setTimeout(() => {
    reLaunchPage(target);
  }, 300);
};

const handlePhoneAuth = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的 11 位手机号', icon: 'none' });
    return;
  }

  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    if (isRegister.value) {
      if (!nickName.value || nickName.value.trim().length < 2) {
        throw new Error('昵称至少 2 个字');
      }

      if (password.value !== confirmPassword.value) {
        throw new Error('两次密码输入不一致');
      }

      const data = await api.register({
        phone: phone.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        nickName: nickName.value.trim()
      });
      persistLogin(data);
      return;
    }

    const data = await api.loginByPhone({
      phone: phone.value,
      password: password.value
    });
    persistLogin(data);
  } catch (error) {
    uni.showToast({ title: error.message || '操作失败，请重试', icon: 'none' });
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
};

onMounted(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    reLaunchPage(resolveRedirect());
    return;
  }

  const savedAccount = uni.getStorageSync('savedAccount');
  if (savedAccount) {
    phone.value = savedAccount.phone || '';
    password.value = savedAccount.password || '';
    rememberPwd.value = true;
    hasSavedAccount.value = true;
  }
});
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-shell {
  width: 100%;
  max-width: 680rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.brand-row {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding: 0 8rpx;
}

.brand-title {
  font-size: 52rpx;
  line-height: 1.05;
  font-weight: 900;
  color: var(--text-strong);
}

.brand-sub {
  font-size: 24rpx;
  color: var(--text-sub);
  line-height: 1.5;
}

.auth-card {
  padding: 24rpx;
}

.mode-switch {
  display: flex;
  position: relative;
  padding: 6rpx;
  background: rgba(240, 245, 255, 0.92);
  border-radius: var(--radius-pill);
}

.switch-track {
  position: absolute;
  top: 6rpx;
  left: 6rpx;
  width: calc(50% - 6rpx);
  height: calc(100% - 12rpx);
  background: #fff;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-xs);
  transition: transform 0.24s ease;
}

.switch-track.is-right {
  transform: translateX(100%);
}

.switch-item {
  flex: 1;
  position: relative;
  z-index: 1;
  min-height: 72rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 27rpx;
  font-weight: 800;
  color: var(--text-sub);
  line-height: 1;
}

.switch-item.active {
  color: var(--text-strong);
}

.saved-tip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 18rpx;
  padding: 14rpx 16rpx;
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.76);
  color: var(--text-sub);
}

.saved-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--mint);
}

.saved-text {
  font-size: 23rpx;
  font-weight: 700;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  margin-top: 20rpx;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.field-label {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--text-sub);
  padding-left: 6rpx;
}

.slim-input {
  min-height: 88rpx;
}

.helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 4rpx 2rpx 0;
}

.remember-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.remember-box {
  width: 34rpx;
  height: 34rpx;
  border-radius: 10rpx;
  border: 2rpx solid var(--divider);
  background: rgba(255, 255, 255, 0.9);
  color: transparent;
  font-size: 24rpx;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.remember-box.active {
  border-color: rgba(95, 140, 255, 0.3);
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  color: #fff;
}

.remember-text {
  font-size: 24rpx;
  color: var(--text-sub);
  font-weight: 700;
}

.helper-link {
  font-size: 24rpx;
  color: var(--primary-strong);
  font-weight: 800;
}

.submit-btn {
  margin-top: 6rpx;
  min-height: 92rpx;
  font-size: 30rpx;
}
</style>
