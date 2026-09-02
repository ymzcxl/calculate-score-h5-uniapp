<template>
  <view class="login-page app-shell">
    <view class="hero-panel glass-card">
      <view class="hero-badge">Web 实时算分</view>
      <view class="hero-title">打开链接就能进房，一套账号跨设备继续玩</view>
      <view class="hero-desc">
        现在这版按网页产品设计：手机号注册登录、链接分享进房、MongoDB 持久化历史，适合直接部署到线上域名使用。
      </view>

      <view class="feature-grid">
        <view class="feature-item">
          <text class="feature-label">访问方式</text>
          <text class="feature-value">URL 直达</text>
        </view>
        <view class="feature-item">
          <text class="feature-label">账号体系</text>
          <text class="feature-value">手机号登录</text>
        </view>
        <view class="feature-item">
          <text class="feature-label">数据存储</text>
          <text class="feature-value">MongoDB</text>
        </view>
      </view>
    </view>

    <view class="login-card glass-card">
      <view class="section-title">{{ isRegister ? '创建你的账号' : '登录继续牌局' }}</view>
      <view class="section-desc">
        {{ pendingHint || (isRegister ? '注册后可以在任意浏览器继续你的历史牌局。' : '登录后会自动回到你刚才访问的页面。') }}
      </view>

      <view class="form-list">
        <input v-model.trim="phone" class="field" type="number" maxlength="11" placeholder="请输入手机号" />
        <input v-model="password" class="field" password placeholder="请输入密码" />
        <input v-if="isRegister" v-model="confirmPassword" class="field" password placeholder="请确认密码" />
        <input v-if="isRegister" v-model.trim="nickName" class="field" placeholder="请输入昵称" />
      </view>

      <button class="primary-button submit-button" :loading="loading" @click="handlePhoneAuth">
        {{ isRegister ? '完成注册' : '立即登录' }}
      </button>

      <view class="panel-foot">
        <text class="switch-link" @click="isRegister = !isRegister">
          {{ isRegister ? '已有账号，去登录' : '没有账号，去注册' }}
        </text>
        <text v-if="!isRegister" class="switch-link danger-link" @click="goToForgotPassword">
          忘记密码
        </text>
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
    ? '登录后会自动回到分享给你的房间。'
    : '登录后会自动回到你之前访问的页面。';
});

const resolveRedirect = () => {
  pendingRedirect.value = consumePendingRedirect();
  return pendingRedirect.value || '/pages/index/index';
};

const persistLogin = (payload) => {
  uni.setStorageSync('userInfo', payload.user);
  uni.setStorageSync('token', payload.token);
  uni.showToast({ title: '登录成功', icon: 'success' });
  const target = resolveRedirect();
  setTimeout(() => {
    uni.reLaunch({ url: target });
  }, 400);
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
  gap: 24rpx;
  justify-content: center;
}

.hero-panel,
.login-card {
  padding: 36rpx 32rpx;
}

.hero-badge {
  display: inline-flex;
  width: fit-content;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(59, 130, 246, 0.16);
  color: #bfdbfe;
  font-size: 22rpx;
  font-weight: 700;
}

.hero-title {
  margin-top: 20rpx;
  font-size: 52rpx;
  line-height: 1.2;
  font-weight: 700;
  color: #f8fafc;
}

.hero-desc {
  margin-top: 18rpx;
  font-size: 26rpx;
  line-height: 1.7;
  color: #94a3b8;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 30rpx;
}

.feature-item {
  padding: 22rpx 18rpx;
  border-radius: 24rpx;
  background: rgba(15, 23, 42, 0.76);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.feature-label {
  display: block;
  font-size: 22rpx;
  color: #94a3b8;
}

.feature-value {
  display: block;
  margin-top: 10rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #f8fafc;
}

.form-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 28rpx;
}

.submit-button {
  width: 100%;
  margin-top: 24rpx;
}

.panel-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
}

.switch-link {
  color: #c7d2fe;
  font-size: 24rpx;
}

.danger-link {
  color: #fda4af;
}
</style>
