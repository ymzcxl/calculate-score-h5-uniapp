<template>
  <view class="login-page app-shell">
    <view class="brand-strip">
      <view class="brand-mark">
        <text class="brand-chip">Scoring Room</text>
        <text class="brand-copy">朋友局记分工具</text>
      </view>
      <text class="status-badge">实时可用</text>
    </view>

    <view class="auth-card glass-card">
      <view class="auth-head">
        <view class="auth-copy">
          <view class="panel-label">Account</view>
          <view class="section-title">{{ authMeta.title }}</view>
          <view class="section-desc">{{ pendingHint || authMeta.desc }}</view>
        </view>
        <text class="entry-badge">{{ authMeta.badge }}</text>
      </view>

      <view v-if="pendingHint" class="resume-banner">
        <text class="resume-label">继续上次操作</text>
        <text class="resume-copy">{{ pendingHint }}</text>
      </view>

      <view class="auth-switch">
        <button class="switch-pill" :class="{ active: !isRegister }" @click="setMode(false)">登录</button>
        <button class="switch-pill" :class="{ active: isRegister }" @click="setMode(true)">注册</button>
      </view>

      <view class="mode-strip">
        <text class="mode-pill">{{ authMeta.pill }}</text>
        <text class="mode-note">{{ authMeta.note }}</text>
      </view>

      <view class="input-panel">
        <view class="field-group">
          <view class="field-head">
            <text class="field-label">手机号</text>
            <text class="field-tag">11 位</text>
          </view>
          <input v-model.trim="phone" class="field auth-field" type="number" maxlength="11" placeholder="输入常用手机号" />
        </view>

        <view class="field-group">
          <view class="field-head">
            <text class="field-label">密码</text>
            <text class="field-tag">至少 6 位</text>
          </view>
          <input v-model="password" class="field auth-field" password placeholder="输入登录密码" />
        </view>

        <view v-if="isRegister" class="field-group">
          <view class="field-head">
            <text class="field-label">确认密码</text>
          </view>
          <input v-model="confirmPassword" class="field auth-field" password placeholder="再输入一次密码" />
        </view>

        <view v-if="isRegister" class="field-group">
          <view class="field-head">
            <text class="field-label">昵称</text>
            <text class="field-tag">房间内显示</text>
          </view>
          <input v-model.trim="nickName" class="field auth-field" placeholder="输入你的展示昵称" />
        </view>
      </view>

      <button class="primary-button submit-button" :loading="loading" @click="handlePhoneAuth">
        {{ authMeta.action }}
      </button>

      <view class="helper-row">
        <button class="secondary-button helper-button" @click="setMode(!isRegister)">
          {{ isRegister ? '切换到登录' : '先去注册账号' }}
        </button>
        <button v-if="!isRegister" class="text-button helper-link danger-link" @click="goToForgotPassword">找回密码</button>
      </view>
    </view>

    <view class="support-card glass-card">
      <view class="support-head">
        <view class="panel-label">Quick Notes</view>
        <view class="support-title">打开就能用，不用先读说明</view>
      </view>

      <view class="support-grid">
        <view class="support-item">
          <text class="support-kicker">进房更快</text>
          <text class="support-copy">分享链接直接加入。</text>
        </view>
        <view class="support-item">
          <text class="support-kicker">记分同步</text>
          <text class="support-copy">每一笔都会实时更新。</text>
        </view>
        <view class="support-item">
          <text class="support-kicker">历史留档</text>
          <text class="support-copy">打完后自动沉淀战绩。</text>
        </view>
      </view>

      <view class="confidence-strip">
        <text class="confidence-copy">适合麻将、斗地主、掼蛋等朋友局。</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { consumePendingRedirect } from '../../utils/auth';

const phone = ref('');
const password = ref('');
const confirmPassword = ref('');
const nickName = ref('');
const loading = ref(false);
const isRegister = ref(false);
const pendingRedirect = ref('');

const pendingHint = computed(() => {
  if (!pendingRedirect.value) {
    return '';
  }

  return pendingRedirect.value.includes('/pages/room/room')
    ? '登录后会直接把你送回朋友分享给你的房间。'
    : '登录后会直接回到你刚才看到的页面。';
});

const authMeta = computed(() => {
  if (isRegister.value) {
    return {
      title: '先建账号，再去开局',
      desc: '手机号注册一次，后面直接登录。',
      action: '创建账号并进入',
      badge: '新账号',
      pill: '长期可用',
      note: '注册后可继续查看房间和历史'
    };
  }

  return {
    title: '登录后继续当前牌局',
    desc: '回到首页、房间或刚才的操作位置。',
    action: '登录并进入',
    badge: '手机号登录',
    pill: '自动续上',
    note: '支持直接回到分享房间或首页'
  };
});

const resolveRedirect = () => {
  pendingRedirect.value = consumePendingRedirect();
  return pendingRedirect.value || '/pages/index/index';
};

const persistLogin = (payload) => {
  uni.setStorageSync('userInfo', payload.user);
  uni.setStorageSync('token', payload.token);
  uni.showToast({ title: '已进入牌局', icon: 'success' });
  const target = resolveRedirect();
  setTimeout(() => {
    uni.reLaunch({ url: target });
  }, 420);
};

const handlePhoneAuth = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' });
    return;
  }

  if (!password.value || password.value.length < 6) {
    uni.showToast({ title: '密码长度至少 6 位', icon: 'none' });
    return;
  }

  loading.value = true;
  try {
    if (isRegister.value) {
      if (!nickName.value || nickName.value.length < 2) {
        throw new Error('昵称长度至少 2 位');
      }

      if (password.value !== confirmPassword.value) {
        throw new Error('两次密码输入不一致');
      }

      const data = await api.register({
        phone: phone.value,
        password: password.value,
        confirmPassword: confirmPassword.value,
        nickName: nickName.value
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
    uni.showToast({ title: error.message || '操作失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToForgotPassword = () => {
  uni.navigateTo({ url: '/pages/login/forgot-password' });
};

const setMode = (nextMode) => {
  isRegister.value = nextMode;
};

onMounted(() => {
  const token = uni.getStorageSync('token');
  if (token) {
    const target = resolveRedirect();
    uni.reLaunch({ url: target });
    return;
  }

  pendingRedirect.value = uni.getStorageSync('pending_redirect_url') || '';
});
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.brand-strip {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14rpx;
  padding: 4rpx 6rpx 2rpx;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
}

.brand-chip,
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 700;
}

.brand-chip {
  background: var(--surface-3);
  color: var(--text-primary);
}

.brand-copy {
  color: var(--text-secondary);
  font-size: 22rpx;
}

.status-badge {
  background: var(--success-surface);
  color: var(--success);
}

.auth-card,
.support-card {
  padding: 30rpx;
}

.auth-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.auth-switch {
  display: inline-flex;
  width: 100%;
  padding: 8rpx;
  border-radius: 999rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
  margin-top: 24rpx;
}

.switch-pill {
  flex: 1;
  min-height: 72rpx;
  border-radius: 999rpx;
  color: var(--text-secondary);
  font-size: 25rpx;
  font-weight: 700;
}

.switch-pill.active {
  background: var(--surface-4);
  color: var(--text-primary);
}

.entry-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 54rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--surface-accent);
  color: var(--accent);
  font-size: 20rpx;
  font-weight: 700;
}

.resume-banner,
.mode-strip {
  margin-top: 18rpx;
  padding: 20rpx 22rpx;
  border-radius: 24rpx;
  border: 1rpx solid var(--border-soft);
  background: var(--surface-3);
}

.resume-label,
.mode-pill {
  display: inline-flex;
  align-items: center;
  min-height: 42rpx;
  padding: 0 14rpx;
  border-radius: 999rpx;
  background: var(--surface-accent);
  color: var(--accent);
  font-size: 19rpx;
  font-weight: 700;
}

.resume-copy,
.mode-note {
  display: block;
  margin-top: 12rpx;
  color: var(--text-secondary);
  font-size: 23rpx;
  line-height: 1.58;
}

.input-panel {
  overflow: hidden;
  margin-top: 22rpx;
  border: 1rpx solid var(--border-soft);
  border-radius: 28rpx;
  background: var(--surface-3);
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 22rpx 24rpx;
}

.field-group + .field-group {
  border-top: 1rpx solid var(--border-soft);
}

.field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.field-label {
  color: var(--text-secondary);
  font-size: 22rpx;
  font-weight: 600;
}

.field-tag {
  color: var(--text-muted);
  font-size: 20rpx;
}

.auth-field {
  min-height: 54rpx;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
}

.auth-field:focus,
.auth-field:focus-visible {
  background: transparent;
  box-shadow: none;
}

.submit-button {
  width: 100%;
  margin-top: 28rpx;
}

.helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 18rpx;
}

.helper-button {
  flex: 1;
}

.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 0 12rpx;
  color: var(--accent);
  font-size: 24rpx;
  font-weight: 600;
  white-space: nowrap;
}

.helper-link {
  flex-shrink: 0;
}

.danger-link {
  color: var(--danger);
}

.support-head {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.support-title {
  color: var(--text-primary);
  font-size: 34rpx;
  font-weight: 700;
  line-height: 1.3;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 24rpx;
}

.support-item {
  min-height: 164rpx;
  padding: 22rpx 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid var(--border-soft);
  background: var(--surface-3);
}

.support-kicker {
  display: block;
  color: var(--text-primary);
  font-size: 24rpx;
  font-weight: 700;
}

.support-copy {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 22rpx;
  line-height: 1.54;
}

.confidence-strip {
  margin-top: 24rpx;
  padding-top: 22rpx;
  border-top: 1rpx solid var(--border-soft);
}

.confidence-copy {
  display: block;
  color: var(--text-muted);
  font-size: 21rpx;
  line-height: 1.6;
}

@media (max-width: 560px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
