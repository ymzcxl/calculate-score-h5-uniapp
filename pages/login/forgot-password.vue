<template>
  <view class="forgot-page app-shell">
    <view class="recovery-shell">
      <view class="brand-row">
        <text class="brand-title">重置密码</text>
        <text class="brand-sub">只需要手机号和新密码。</text>
      </view>

      <view class="macaron-card recovery-card">
        <view class="form-body">
          <view class="field-group">
            <text class="field-label">手机号</text>
            <input
              class="macaron-input slim-input"
              v-model.trim="phone"
              type="number"
              maxlength="11"
              placeholder="输入注册手机号"
              placeholder-class="macaron-input-placeholder"
            />
          </view>

          <view class="field-group">
            <text class="field-label">新密码</text>
            <input
              class="macaron-input slim-input"
              v-model="newPassword"
              password
              placeholder="至少 6 位密码"
              placeholder-class="macaron-input-placeholder"
            />
          </view>

          <view class="field-group">
            <text class="field-label">确认新密码</text>
            <input
              class="macaron-input slim-input"
              v-model="confirmPassword"
              password
              placeholder="再次输入新密码"
              placeholder-class="macaron-input-placeholder"
            />
          </view>

          <button class="macaron-btn pink submit-btn" :loading="loading" @click="resetPassword">
            确认重置
          </button>
        </view>

        <view class="helper-row">
          <text class="helper-link" @click="goToLogin">返回登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { api } from '../../utils/api';
import { navigateBackOrPage } from '../../utils/auth';

const phone = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const resetPassword = async () => {
  if (!phone.value || phone.value.length !== 11) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' });
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
  navigateBackOrPage('/pages/login/login');
};
</script>

<style scoped lang="scss">
.forgot-page {
  display: flex;
  align-items: center;
  justify-content: center;
}

.recovery-shell {
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
  font-size: 48rpx;
  line-height: 1.08;
  font-weight: 900;
  color: var(--text-strong);
}

.brand-sub {
  font-size: 24rpx;
  color: var(--text-sub);
  line-height: 1.5;
}

.recovery-card {
  padding: 24rpx;
}

.form-body {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
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

.submit-btn {
  margin-top: 6rpx;
  min-height: 92rpx;
  font-size: 30rpx;
}

.helper-row {
  display: flex;
  justify-content: center;
  margin-top: 18rpx;
}

.helper-link {
  font-size: 24rpx;
  color: var(--primary-strong);
  font-weight: 800;
}
</style>
