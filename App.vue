<script>
export default {
  onLaunch() {
    console.log('App Launch');
  },
  onShow() {
    console.log('App Show');
  },
  onHide() {
    console.log('App Hide');
  }
};
</script>

<style lang="scss">
@import "uview-plus/index.scss";
@import "uni.scss";

page {
  background:
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.24), transparent 32%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.2), transparent 28%),
    linear-gradient(180deg, #09111f 0%, #0f172a 42%, #111827 100%);
  color: #f8fafc;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  border: none;
  background: transparent;
  padding: 0;
  line-height: 1;
}

button::after {
  border: none;
}

.app-shell {
  min-height: 100vh;
  padding: 32rpx 24rpx 48rpx;
}

.glass-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 24rpx 80rpx rgba(15, 23, 42, 0.36);
  backdrop-filter: blur(28rpx);
  border-radius: 32rpx;
}

.section-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #f8fafc;
}

.section-desc {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #94a3b8;
}

.primary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  min-height: 92rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 20rpx 48rpx rgba(99, 102, 241, 0.28);
}

.secondary-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  min-height: 84rpx;
  padding: 0 26rpx;
  border-radius: 24rpx;
  background: rgba(30, 41, 59, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.18);
  color: #e2e8f0;
  font-size: 26rpx;
  font-weight: 600;
}

.danger-button {
  background: rgba(127, 29, 29, 0.9);
  color: #fecaca;
}

.field {
  width: 100%;
  min-height: 88rpx;
  padding: 0 28rpx;
  border-radius: 22rpx;
  background: rgba(15, 23, 42, 0.88);
  border: 1rpx solid rgba(148, 163, 184, 0.16);
  color: #f8fafc;
  font-size: 28rpx;
}

.field::placeholder {
  color: #64748b;
}

.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(99, 102, 241, 0.16);
  color: #c7d2fe;
  font-size: 20rpx;
  font-weight: 600;
}
</style>
