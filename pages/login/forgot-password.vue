<template>
  <view class="forgot-page app-shell">
    <view class="forgot-card glass-card">
      <view class="section-title">找回密码</view>
      <view class="section-desc">
        Web 版没有接短信服务，这里先用“手机号 + 注册昵称”做基础校验。后续接入短信后再升级成正式找回流程。
      </view>

      <view class="form-list">
        <input v-model.trim="phone" class="field" type="number" maxlength="11" placeholder="请输入注册手机号" />
        <input v-model.trim="nickName" class="field" placeholder="请输入注册时的昵称" />
        <input v-model="newPassword" class="field" password placeholder="请输入新密码" />
        <input v-model="confirmPassword" class="field" password placeholder="请确认新密码" />
      </view>

      <button class="primary-button full-button" :loading="loading" @click="resetPassword">
        重置密码
      </button>
      <button class="secondary-button back-button" @click="goToLogin">返回登录</button>
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
      uni.navigateBack({ delta: 1 });
    }, 700);
  } catch (error) {
    uni.showToast({ title: error.message || '重置失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  uni.navigateBack({ delta: 1 });
};
</script>

<style scoped lang="scss">
.forgot-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}

.forgot-card {
  width: 100%;
  padding: 34rpx 30rpx;
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.full-button,
.back-button {
  width: 100%;
}

.full-button {
  margin-top: 24rpx;
}

.back-button {
  margin-top: 18rpx;
}
</style>
