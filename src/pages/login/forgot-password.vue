<template>
  <view class="forgot-page app-shell">
    <view class="brand-strip">
      <view class="brand-mark">
        <text class="brand-chip">Scoring Room</text>
        <text class="brand-copy">账号找回</text>
      </view>
      <button class="text-button top-link" @click="goToLogin">返回登录</button>
    </view>

    <view class="recovery-card glass-card">
      <view class="recovery-head">
        <view class="recovery-copy">
          <view class="panel-label">Account Recovery</view>
          <view class="section-title">重置登录密码</view>
          <view class="section-desc">校验手机号和昵称后，直接设置一组新密码。</view>
        </view>
        <text class="entry-badge">三步完成</text>
      </view>

      <view class="step-strip">
        <text class="step-pill">手机号</text>
        <text class="step-pill">昵称</text>
        <text class="step-pill">新密码</text>
      </view>

      <view class="input-panel">
        <view class="field-group">
          <view class="field-head">
            <text class="field-label">注册手机号</text>
            <text class="field-tag">11 位</text>
          </view>
          <input v-model.trim="phone" class="field auth-field" type="number" maxlength="11" placeholder="输入注册时使用的手机号" />
        </view>

        <view class="field-group">
          <view class="field-head">
            <text class="field-label">注册昵称</text>
          </view>
          <input v-model.trim="nickName" class="field auth-field" placeholder="输入注册时使用的昵称" />
        </view>

        <view class="field-group">
          <view class="field-head">
            <text class="field-label">新密码</text>
            <text class="field-tag">至少 6 位</text>
          </view>
          <input v-model="newPassword" class="field auth-field" password placeholder="输入新的登录密码" />
        </view>

        <view class="field-group">
          <view class="field-head">
            <text class="field-label">确认新密码</text>
          </view>
          <input v-model="confirmPassword" class="field auth-field" password placeholder="再次输入新密码" />
        </view>
      </view>

      <button class="primary-button full-button" :loading="loading" @click="resetPassword">确认重置</button>

      <view class="helper-row">
        <button class="secondary-button helper-button" @click="goToLogin">返回登录</button>
      </view>
    </view>

    <view class="support-card glass-card">
      <view class="panel-label">Quick Notes</view>
      <view class="support-grid">
        <view class="support-item">
          <text class="support-title">完成后可直接登录</text>
          <text class="support-copy">使用新密码返回首页或房间。</text>
        </view>
        <view class="support-item">
          <text class="support-title">仍沿用手机号体系</text>
          <text class="support-copy">不需要切到别的登录方式。</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../../utils/api';

const phone = ref('');
const nickName = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const resetPassword = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
    return;
  }

  if (!nickName.value || nickName.value.length < 2) {
    uni.showToast({ title: '请输入注册昵称', icon: 'none' });
    return;
  }

  if (!newPassword.value || newPassword.value.length < 6) {
    uni.showToast({ title: '密码至少 6 位', icon: 'none' });
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次密码不一致', icon: 'none' });
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
    uni.showToast({ title: '密码已重置', icon: 'success' });
    setTimeout(() => {
      goToLogin();
    }, 700);
  } catch (error) {
    uni.showToast({ title: error.message || '重置失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack({ delta: 1 });
    return;
  }

  uni.reLaunch({ url: '/pages/login/login' });
};
</script>

<style scoped lang="scss">
.forgot-page {
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

.brand-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--surface-3);
  color: var(--text-primary);
  font-size: 20rpx;
  font-weight: 700;
}

.brand-copy {
  color: var(--text-secondary);
  font-size: 22rpx;
}

.text-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 84rpx;
  padding: 0 12rpx;
  color: var(--accent);
  font-size: 24rpx;
  font-weight: 600;
  white-space: nowrap;
}

.top-link {
  flex-shrink: 0;
}

.recovery-card,
.support-card {
  padding: 30rpx;
}

.recovery-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
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

.step-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.step-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 48rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
  color: var(--text-secondary);
  font-size: 21rpx;
  font-weight: 600;
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

.full-button,
.helper-button {
  width: 100%;
}

.full-button {
  margin-top: 28rpx;
}

.helper-row {
  margin-top: 16rpx;
}

.support-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14rpx;
  margin-top: 20rpx;
}

.support-item {
  min-height: 156rpx;
  padding: 22rpx 20rpx;
  border-radius: 24rpx;
  border: 1rpx solid var(--border-soft);
  background: var(--surface-3);
}

.support-title {
  display: block;
  color: var(--text-primary);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.4;
}

.support-copy {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 22rpx;
  line-height: 1.54;
}

@media (max-width: 560px) {
  .support-grid {
    grid-template-columns: 1fr;
  }
}
</style>
