<template>
  <view class="history-page app-shell">
    <view class="overview-card glass-card">
      <view class="overview-head">
        <view>
          <view class="panel-label">History Archive</view>
          <view class="section-title">战绩归档</view>
          <view class="section-desc">只看结果，回看更快。</view>
        </view>
        <text class="archive-pill">{{ archiveStatusText }}</text>
      </view>

      <view class="stats-grid">
        <view class="metric-card stat-box">
          <text class="metric-label">总场次</text>
          <text class="metric-value">{{ stats.totalGames }}</text>
        </view>
        <view class="metric-card stat-box">
          <text class="metric-label">胜率</text>
          <text class="metric-value">{{ stats.winRate }}%</text>
        </view>
        <view class="metric-card stat-box">
          <text class="metric-label">最佳积分</text>
          <text class="metric-value">{{ formatSignedScore(stats.bestScore) }}</text>
        </view>
      </view>
    </view>

    <view class="history-card glass-card">
      <view class="panel-head">
        <view>
          <view class="panel-label">Finished Rooms</view>
          <view class="section-title">最近结果</view>
        </view>
        <button class="secondary-button compact-danger" @click="clearHistory">清空记录</button>
      </view>

      <view v-if="historyRecords.length" class="history-list">
        <view v-for="record in historyRecords" :key="`${record.roomId}_${record.rank}`" class="record-card" :class="record.result">
          <view class="record-head">
            <view class="record-copy">
              <view class="record-kicker">{{ record.time }}</view>
              <view class="record-title">{{ record.roomTitle || '好友牌局' }}</view>
              <view class="record-meta">房间 {{ record.roomId }} · {{ record.playerCount }} 人</view>
            </view>
            <view class="record-summary">
              <view class="record-result" :class="record.result">{{ resultTextMap[record.result] }}</view>
              <text class="record-score" :class="record.result">{{ formatSignedScore(record.score) }}</text>
            </view>
          </view>

          <view class="record-grid">
            <view class="metric-card record-metric">
              <text class="metric-label">排名</text>
              <text class="metric-value">#{{ record.rank }}</text>
            </view>
            <view class="metric-card record-metric">
              <text class="metric-label">记分</text>
              <text class="metric-value">{{ record.scoreChanges }}</text>
            </view>
            <view class="metric-card record-metric wide">
              <text class="metric-label">同桌玩家</text>
              <text class="record-opponents">{{ getOpponentsText(record.opponents) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-mark">战绩</view>
        <view class="empty-title">还没有归档</view>
        <view class="empty-desc">打完一局，这里自动出现。</view>
        <button class="primary-button empty-button" @click="goToHome">去开一局</button>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { redirectToLogin } from '../../utils/auth';

const resultTextMap = {
  win: '胜局',
  lose: '失利',
  draw: '平局'
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
const archiveStatusText = computed(() => (historyRecords.value.length ? '最近已归档' : '暂无归档'));

const requireAuth = () => {
  if (!uni.getStorageSync('token')) {
    redirectToLogin('/pages/history/history');
    return false;
  }
  return true;
};

const formatSignedScore = (value) => (value > 0 ? `+${value}` : `${value}`);
const getOpponentsText = (opponents = []) => (opponents.length ? opponents.join('、') : '--');

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
    content: '只清空当前账号记录，确认继续吗？',
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
  gap: 18rpx;
}

.overview-card,
.history-card {
  padding: 30rpx;
}

.overview-head,
.panel-head,
.record-head {
  display: flex;
  justify-content: space-between;
  gap: 14rpx;
}

.overview-head,
.panel-head {
  align-items: flex-start;
}

.archive-pill {
  display: inline-flex;
  align-items: center;
  min-height: 56rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  background: var(--surface-4);
  color: var(--text-secondary);
  font-size: 22rpx;
  font-weight: 700;
  white-space: nowrap;
}

.stats-grid,
.record-grid {
  display: grid;
  gap: 12rpx;
  margin-top: 22rpx;
}

.stats-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.record-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.compact-danger {
  min-height: 72rpx;
  padding: 0 20rpx;
  border-radius: 20rpx;
  background: var(--danger-surface);
  color: var(--danger);
  border-color: transparent;
  font-size: 22rpx;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 24rpx;
}

.record-card {
  padding: 24rpx;
  border-radius: 30rpx;
  background: var(--surface-3);
  border: 1rpx solid var(--border-soft);
}

.record-card.win {
  background: linear-gradient(180deg, rgba(91, 155, 132, 0.08), var(--surface-3));
}

.record-card.lose {
  background: linear-gradient(180deg, rgba(140, 82, 82, 0.08), var(--surface-3));
}

.record-copy {
  flex: 1;
}

.record-kicker {
  color: var(--text-muted);
  font-size: 20rpx;
}

.record-title {
  margin-top: 8rpx;
  color: var(--text-primary);
  font-size: 30rpx;
  font-weight: 700;
}

.record-meta {
  margin-top: 8rpx;
  color: var(--text-secondary);
  font-size: 22rpx;
}

.record-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12rpx;
}

.record-result {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 88rpx;
  height: 52rpx;
  padding: 0 18rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 700;
}

.record-result.win {
  background: var(--success-surface);
  color: var(--success);
}

.record-result.lose {
  background: var(--danger-surface);
  color: var(--danger);
}

.record-result.draw {
  background: var(--surface-4);
  color: var(--text-primary);
}

.record-score {
  font-size: 42rpx;
  line-height: 1;
  font-weight: 700;
}

.record-score.win {
  color: var(--success);
}

.record-score.lose {
  color: var(--danger);
}

.record-score.draw {
  color: var(--text-primary);
}

.record-metric {
  padding: 22rpx;
}

.record-metric.wide {
  grid-column: 1 / -1;
}

.record-opponents {
  display: block;
  margin-top: 10rpx;
  color: var(--text-secondary);
  font-size: 24rpx;
  line-height: 1.56;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 110rpx 0 86rpx;
}

.empty-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 128rpx;
  min-height: 128rpx;
  padding: 0 24rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  font-size: 28rpx;
  font-weight: 700;
  letter-spacing: 4rpx;
}

.empty-title {
  margin-top: 24rpx;
  color: var(--text-primary);
  font-size: 32rpx;
  font-weight: 700;
}

.empty-desc {
  margin-top: 12rpx;
  color: var(--text-secondary);
  font-size: 24rpx;
}

.empty-button {
  min-width: 260rpx;
  margin-top: 28rpx;
}
</style>
