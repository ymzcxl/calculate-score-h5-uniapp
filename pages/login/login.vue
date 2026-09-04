<template>
  <view class="app-shell login-page">
    <view class="bg-orb orb-left"></view>
    <view class="bg-orb orb-right"></view>
    <view class="bg-grid"></view>

    <view class="hero-panel">
      <view class="hero-mark">
        <view class="mark-inner">
          <text class="mark-text">牌局</text>
        </view>
      </view>
      <view class="hero-copy">
        <text class="hero-tag">微信小程序风实时记分工具</text>
        <text class="hero-title">牌友记分</text>
        <text class="hero-sub">更快进桌，更轻松同步，更适合熟人局的移动端记分体验。</text>
      </view>
      <view class="hero-pills">
        <text class="hero-pill blue">手机号登录</text>
        <text class="hero-pill pink">实时同步</text>
        <text class="hero-pill mint">H5 即开即用</text>
      </view>

      <view class="hero-glance">
        <view class="glance-item">
          <text class="glance-k">开局</text>
          <text class="glance-v">1 步进房</text>
        </view>
        <view class="glance-item">
          <text class="glance-k">同步</text>
          <text class="glance-v">全桌实时更新</text>
        </view>
        <view class="glance-item">
          <text class="glance-k">记录</text>
          <text class="glance-v">历史自动沉淀</text>
        </view>
      </view>
    </view>

    <view class="macaron-card auth-card">
      <view class="mode-switch">
        <view class="switch-track" :class="{ 'is-right': isRegister }"></view>
        <view class="switch-item" :class="{ active: !isRegister }" @click="setMode(false)">登录</view>
        <view class="switch-item" :class="{ active: isRegister }" @click="setMode(true)">注册</view>
      </view>

      <view class="panel-head">
        <text class="panel-title">{{ isRegister ? '创建新账号' : '欢迎回来' }}</text>
        <text class="panel-sub">{{ isRegister ? '用手机号和昵称快速开账号' : '继续你上次的牌局节奏' }}</text>
      </view>

      <view v-if="!isRegister && hasSavedAccount" class="saved-tip">
        <view class="saved-dot"></view>
        <text class="saved-text">已自动填充上次记住的账号</text>
      </view>

      <view class="form-body">
        <view class="field-card">
          <text class="field-label">手机号</text>
          <view class="field-input">
            <text class="field-icon">01</text>
            <input
              class="macaron-input clear-field"
              v-model.trim="phone"
              type="number"
              maxlength="11"
              placeholder="输入 11 位手机号"
              placeholder-class="macaron-input-placeholder"
            />
          </view>
        </view>

        <view class="field-card">
          <text class="field-label">密码</text>
          <view class="field-input">
            <text class="field-icon">02</text>
            <input
              class="macaron-input clear-field"
              v-model="password"
              password
              placeholder="至少 6 位密码"
              placeholder-class="macaron-input-placeholder"
            />
          </view>
        </view>

        <block v-if="isRegister">
          <view class="field-card">
            <text class="field-label">确认密码</text>
            <view class="field-input">
              <text class="field-icon">03</text>
              <input
                class="macaron-input clear-field"
                v-model="confirmPassword"
                password
                placeholder="再次输入密码"
                placeholder-class="macaron-input-placeholder"
              />
            </view>
          </view>

          <view class="field-card">
            <text class="field-label">昵称</text>
            <view class="field-input">
              <text class="field-icon">04</text>
              <input
                class="macaron-input clear-field"
                v-model.trim="nickName"
                placeholder="房间里大家看到的名字"
                placeholder-class="macaron-input-placeholder"
              />
            </view>
          </view>
        </block>

        <view v-if="!isRegister" class="helper-row">
          <view class="remember-wrap" @click="toggleRemember">
            <view class="remember-box" :class="{ active: rememberPwd }">
              <text>{{ rememberPwd ? '✓' : '' }}</text>
            </view>
            <text class="remember-text">记住密码</text>
          </view>
          <text class="helper-link" @click="goToForgotPassword">找回密码</text>
        </view>

        <button
          class="macaron-btn submit-btn"
          :class="{ pink: isRegister }"
          :loading="loading"
          @click="handlePhoneAuth"
        >
          {{ isRegister ? '立即注册' : '进入首页' }}
        </button>
      </view>

      <view class="panel-foot">
        <view class="foot-item">
          <text class="foot-k">安全</text>
          <text class="foot-v">账号独立保存</text>
        </view>
        <view class="foot-item">
          <text class="foot-k">体验</text>
          <text class="foot-v">按钮与操作为 H5 优化</text>
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
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 26rpx;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  z-index: 0;
  pointer-events: none;
  filter: blur(18rpx);
}

.orb-left {
  left: -140rpx;
  top: 220rpx;
  width: 360rpx;
  height: 360rpx;
  background: radial-gradient(circle, rgba(255, 141, 170, 0.3) 0%, rgba(255, 141, 170, 0) 72%);
}

.orb-right {
  right: -120rpx;
  top: 60rpx;
  width: 420rpx;
  height: 420rpx;
  background: radial-gradient(circle, rgba(95, 140, 255, 0.24) 0%, rgba(95, 140, 255, 0) 74%);
}

.bg-grid {
  position: absolute;
  inset: 180rpx 0 auto;
  height: 520rpx;
  z-index: 0;
  opacity: 0.32;
  background-image:
    linear-gradient(rgba(95, 140, 255, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(95, 140, 255, 0.08) 1px, transparent 1px);
  background-size: 28rpx 28rpx;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.7), transparent);
}

.hero-panel {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 8rpx 12rpx 0;
}

.hero-mark {
  width: 148rpx;
  height: 148rpx;
  border-radius: 44rpx;
  padding: 8rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.32));
  box-shadow: var(--shadow-sm);
}

.mark-inner {
  width: 100%;
  height: 100%;
  border-radius: 36rpx;
  background: linear-gradient(135deg, var(--primary), var(--accent) 92%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.mark-text {
  font-size: 38rpx;
  font-weight: 900;
  color: #fff;
  letter-spacing: 4rpx;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.hero-tag {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 18rpx;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.74);
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1;
  box-shadow: var(--shadow-xs);
}

.hero-title {
  font-size: 68rpx;
  line-height: 1.04;
  font-weight: 900;
  color: var(--text-strong);
  letter-spacing: 2rpx;
}

.hero-sub {
  font-size: 26rpx;
  line-height: 1.7;
  color: var(--text-sub);
}

.hero-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.hero-glance {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
}

.glance-item {
  padding: 18rpx 16rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.66);
  border: 2rpx solid rgba(255, 255, 255, 0.58);
  box-shadow: var(--shadow-xs);
}

.glance-k {
  display: block;
  font-size: 20rpx;
  color: var(--text-light);
}

.glance-v {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 800;
  color: var(--text-main);
  line-height: 1.45;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 20rpx;
  border-radius: var(--radius-pill);
  font-size: 22rpx;
  font-weight: 700;
  line-height: 1;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: var(--shadow-xs);
}

.hero-pill.blue {
  color: var(--primary-strong);
}

.hero-pill.pink {
  color: var(--accent-strong);
}

.hero-pill.mint {
  color: #13997a;
}

.auth-card {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  background: var(--card-bg-accent);
  border-color: rgba(255, 255, 255, 0.8);
}

.mode-switch {
  display: flex;
  position: relative;
  padding: 8rpx;
  background: rgba(240, 245, 255, 0.88);
  border-radius: var(--radius-pill);
  margin-bottom: 28rpx;
}

.switch-track {
  position: absolute;
  top: 8rpx;
  left: 8rpx;
  width: calc(50% - 8rpx);
  height: calc(100% - 16rpx);
  background: linear-gradient(135deg, #ffffff, #fef4f8);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 78rpx;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-sub);
  line-height: 1;
}

.switch-item.active {
  color: var(--text-strong);
}

.panel-head {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-bottom: 24rpx;
}

.panel-title {
  font-size: 40rpx;
  font-weight: 900;
  color: var(--text-strong);
}

.panel-sub {
  font-size: 24rpx;
  color: var(--text-sub);
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.saved-tip {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
  padding: 18rpx 20rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.7);
  color: var(--text-sub);
}

.saved-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: var(--mint);
  box-shadow: 0 0 0 8rpx rgba(52, 211, 171, 0.14);
}

.saved-text {
  font-size: 24rpx;
  font-weight: 700;
}

.field-card {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  padding: 22rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-xs);
}

.field-card:focus-within {
  border-color: rgba(95, 140, 255, 0.26);
  box-shadow: 0 0 0 8rpx rgba(95, 140, 255, 0.08);
}

.field-label {
  font-size: 23rpx;
  font-weight: 700;
  color: var(--text-sub);
}

.field-input {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.field-icon {
  width: 56rpx;
  height: 56rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  color: var(--primary-strong);
  font-size: 20rpx;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
}

.clear-field {
  flex: 1;
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
  min-height: 88rpx;
  padding: 0 !important;
}

.helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 8rpx 2rpx 6rpx;
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
  display: flex;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  color: var(--primary-strong);
  font-weight: 800;
  line-height: 1;
}

.submit-btn {
  margin-top: 10rpx;
  min-height: 102rpx;
  font-size: 32rpx;
}

.panel-foot {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.foot-item {
  padding: 20rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.62);
  border: 2rpx solid rgba(255, 255, 255, 0.66);
}

.foot-k {
  display: block;
  font-size: 22rpx;
  color: var(--text-light);
}

.foot-v {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  font-weight: 700;
  color: var(--text-main);
}

@media (max-width: 380px) {
  .hero-glance,
  .panel-foot {
    grid-template-columns: 1fr;
  }
}
</style>
