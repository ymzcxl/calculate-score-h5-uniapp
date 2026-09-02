<template>
  <view class="history-page app-shell">
    <view class="overview-card glass-card">
      <view class="section-title">我的历史战绩</view>
      <view class="section-desc">所有已结算对局都会自动沉淀到这里。</view>

      <view class="stats-grid">
        <view class="stat-box">
          <text class="stat-label">总场次</text>
          <text class="stat-value">{{ stats.totalGames }}</text>
        </view>
        <view class="stat-box">
          <text class="stat-label">胜率</text>
          <text class="stat-value">{{ stats.winRate }}%</text>
        </view>
        <view class="stat-box">
          <text class="stat-label">总积分</text>
          <text class="stat-value">{{ stats.totalScore }}</text>
        </view>
      </view>
    </view>

    <view class="history-card glass-card">
      <view class="panel-head">
        <view>
          <view class="section-title">对局列表</view>
          <view class="section-desc">点击卡片可查看本局的房间号与关键信息。</view>
        </view>
        <button class="secondary-button danger-button" @click="clearHistory">清空</button>
      </view>

      <view v-if="historyRecords.length" class="history-list">
        <view v-for="record in historyRecords" :key="`${record.roomId}_${record.rank}`" class="record-card">
          <view class="record-head">
            <view>
              <view class="record-title">{{ record.roomTitle || '好友牌局' }}</view>
              <view class="record-meta">{{ record.time }} · 房间 {{ record.roomId }}</view>
            </view>
            <view class="record-result" :class="record.result">
              {{ resultTextMap[record.result] }}
            </view>
          </view>

          <view class="record-grid">
            <view class="record-metric">
              <text class="metric-label">排名</text>
              <text class="metric-value">#{{ record.rank }}</text>
            </view>
            <view class="record-metric">
              <text class="metric-label">人数</text>
              <text class="metric-value">{{ record.playerCount }}</text>
            </view>
            <view class="record-metric">
              <text class="metric-label">积分</text>
              <text class="metric-value">{{ record.score }}</text>
            </view>
            <view class="record-metric">
              <text class="metric-label">流水</text>
              <text class="metric-value">{{ record.scoreChanges }}</text>
            </view>
          </view>

          <view class="opponents-line">对手：{{ record.opponents.join('、') || '--' }}</view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-title">还没有已结算的对局</view>
        <view class="empty-desc">去首页创建一个房间，打完一局后这里就会自动出现。</view>
        <button class="primary-button empty-button" @click="goToHome">去创建房间</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { redirectToLogin } from '../../utils/auth';

const resultTextMap = {
  win: '胜',
  lose: '负',
  draw: '平'
};

const stats = ref({
  totalGames: 0,
  winGames: 0,
  winRate: 0,
  totalScore: 0,
  averageScore: 0,
  bestScore: 0
});

const historyRecords = ref([]);

const requireAuth = () => {
  if (!uni.getStorageSync('token')) {
    redirectToLogin('/pages/history/history');
    return false;
  }
  return true;
};

const loadData = async () => {
  if (!requireAuth()) {
    return;
  }

  try {
    const [history, summary] = await Promise.all([
      api.getHistoryList(),
      api.getStats()
    ]);

    historyRecords.value = history;
    stats.value = summary;
  } catch (error) {
    uni.showToast({ title: error.message || '加载失败', icon: 'none' });
  }
};

const clearHistory = () => {
  uni.showModal({
    title: '清空历史',
    content: '仅清空当前账号的历史战绩，确认继续吗？',
    success: async ({ confirm }) => {
      if (!confirm) {
        return;
      }

      try {
        await api.clearHistory();
        historyRecords.value = [];
        await loadData();
        uni.showToast({ title: '已清空', icon: 'success' });
      } catch (error) {
        uni.showToast({ title: error.message || '清空失败', icon: 'none' });
      }
    }
  });
};

const goToHome = () => {
  uni.navigateTo({ url: '/pages/index/index' });
};

onMounted(loadData);
</script>

<style scoped lang="scss">
.history-page {
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}

.overview-card,
.history-card {
  padding: 30rpx;
}

.stats-grid,
.record-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16rpx;
  margin-top: 24rpx;
}

.stat-box,
.record-metric {
  padding: 22rpx;
  border-radius: 24rpx;
  background: rgba(15, 23, 42, 0.72);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.stat-label,
.metric-label {
  display: block;
  color: #94a3b8;
  font-size: 22rpx;
}

.stat-value,
.metric-value {
  display: block;
  margin-top: 12rpx;
  color: #f8fafc;
  font-size: 38rpx;
  font-weight: 700;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
  margin-top: 26rpx;
}

.record-card {
  padding: 24rpx;
  border-radius: 28rpx;
  background: rgba(15, 23, 42, 0.68);
  border: 1rpx solid rgba(148, 163, 184, 0.12);
}

.record-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.record-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #f8fafc;
}

.record-meta {
  margin-top: 10rpx;
  color: #94a3b8;
  font-size: 22rpx;
}

.record-result {
  min-width: 72rpx;
  padding: 10rpx 18rpx;
  text-align: center;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.record-result.win {
  background: rgba(16, 185, 129, 0.18);
  color: #bbf7d0;
}

.record-result.lose {
  background: rgba(248, 113, 113, 0.18);
  color: #fecaca;
}

.record-result.draw {
  background: rgba(59, 130, 246, 0.18);
  color: #bfdbfe;
}

.opponents-line {
  margin-top: 18rpx;
  color: #cbd5e1;
  font-size: 24rpx;
  line-height: 1.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0 80rpx;
  text-align: center;
}

.empty-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f8fafc;
}

.empty-desc {
  margin-top: 14rpx;
  color: #94a3b8;
  font-size: 24rpx;
  line-height: 1.7;
}

.empty-button {
  margin-top: 28rpx;
  min-width: 260rpx;
}
</style>
