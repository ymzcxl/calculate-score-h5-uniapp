<template>
  <view class="history-page app-shell">
    
    <!-- 顶部导航 -->
    <view class="page-nav">
      <view class="nav-btn" @click="goBack">← 返回</view>
      <view class="nav-title">
        <text class="title-text">历史战绩</text>
        <text class="sub-text">回看每一局的结果</text>
      </view>
      <view class="nav-btn right" @click="goToHome">首页</view>
    </view>

    <view class="macaron-card summary-card">
      <view class="card-title">
        📈 生涯概览
        <text class="macaron-badge blue" style="margin-left:auto">{{ archiveStatusText }}</text>
      </view>
      
      <view class="stats-grid">
        <view class="stat-box">
          <text class="s-val">{{ stats.totalGames }}</text>
          <text class="s-label">总场次</text>
        </view>
        <view class="stat-box">
          <text class="s-val">{{ stats.winRate }}%</text>
          <text class="s-label">胜率</text>
        </view>
        <view class="stat-box">
          <text class="s-val" :class="{ positive: stats.bestScore > 0, negative: stats.bestScore < 0 }">
            {{ formatSignedScore(stats.bestScore) }}
          </text>
          <text class="s-label">最佳得分</text>
        </view>
      </view>

      <view class="insight-row">
        <view class="insight-item">
          <text class="i-label">最近表现</text>
          <text class="i-val">{{ latestResultText }}</text>
        </view>
        <view class="insight-item">
          <text class="i-label">当前连胜</text>
          <text class="i-val">{{ streakText }}</text>
        </view>
      </view>
    </view>

    <view class="macaron-card records-card">
      <view class="card-title">
        🗂️ 战绩列表
        <button class="macaron-btn ghost small clear-btn" @click="clearHistory">清空</button>
      </view>

      <view v-if="historyRecords.length" class="record-list">
        <view 
          v-for="record in historyRecords" 
          :key="`${record.roomId}_${record.rank}`" 
          class="record-item"
          :class="record.result"
        >
          <view class="r-head">
            <view class="r-info">
              <text class="r-title">{{ record.roomTitle || '好友牌局' }}</text>
              <text class="r-time">{{ record.time }}</text>
            </view>
            <view class="r-result" :class="record.result">
              {{ resultTextMap[record.result] }}
            </view>
          </view>
          
          <view class="r-body">
            <view class="r-data">
              <text class="r-score" :class="record.result">{{ formatSignedScore(record.score) }}</text>
              <text class="r-rank">第 {{ record.rank }} 名</text>
            </view>
            <view class="r-meta">
              <text>记分次数：{{ record.scoreChanges }} 次</text>
              <text>房间号：{{ record.roomId }}</text>
              <text class="r-opponents">同桌：{{ getOpponentsText(record.opponents) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-else class="empty-state">
        <view class="empty-icon">🤷‍♂️</view>
        <view class="empty-text">还没有打过一局哦</view>
        <view class="empty-sub">赶快去大厅开一桌吧！</view>
        <button class="macaron-btn empty-btn" @click="goToHome">去 开 局 🚀</button>
      </view>
    </view>

  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { redirectToLogin } from '../../utils/auth';

const resultTextMap = {
  win: '大胜',
  lose: '落败',
  draw: '平手'
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

const archiveStatusText = computed(() => (historyRecords.value.length ? '已同步' : '暂无数据'));

const latestRecord = computed(() => historyRecords.value[0] || null);

const latestResultText = computed(() => {
  if (!latestRecord.value) return '待开局';
  return `${resultTextMap[latestRecord.value.result]} ${formatSignedScore(latestRecord.value.score)}`;
});

const streakText = computed(() => {
  if (!historyRecords.value.length) return '还没开始';
  let count = 0;
  for (const item of historyRecords.value) {
    if (item.result === 'win') {
      count += 1;
      continue;
    }
    break;
  }
  return count ? `${count} 连胜 🔥` : '等待下一波';
});

const requireAuth = () => {
  if (!uni.getStorageSync('token')) {
    redirectToLogin('/pages/history/history');
    return false;
  }
  return true;
};

const formatSignedScore = (value) => (value > 0 ? `+${value}` : `${value}`);
const getOpponentsText = (opponents = []) => (opponents.length ? opponents.join('、') : '无');

const loadData = async () => {
  if (!requireAuth()) return;
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
    title: '确认清空？',
    content: '所有历史战绩将被永久删除，不可恢复哦。',
    success: async ({ confirm }) => {
      if (!confirm) return;
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

const goToHome = () => uni.reLaunch({ url: '/pages/index/index' });

const goBack = () => {
  const pages = getCurrentPages();
  if (pages.length > 1) uni.navigateBack({ delta: 1 });
  else goToHome();
};

onMounted(loadData);
</script>

<style scoped lang="scss">
.history-page {
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.page-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10rpx 30rpx;
}
.nav-btn {
  font-size: 28rpx;
  color: var(--secondary);
  font-weight: bold;
  padding: 10rpx;
  &.right { text-align: right; }
}
.nav-title {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title-text {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--text-main);
}
.sub-text {
  font-size: 22rpx;
  color: var(--text-sub);
}

.card-title {
  font-size: 32rpx;
  font-weight: 800;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
}

.summary-card {
  background: linear-gradient(135deg, #fff, #fef2f2);
}

.stats-grid {
  display: flex;
  gap: 20rpx;
  margin-bottom: 24rpx;
}
.stat-box {
  flex: 1;
  background: rgba(255,255,255,0.6);
  padding: 24rpx 16rpx;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.02);
}
.s-val {
  font-size: 36rpx;
  font-weight: 900;
  color: var(--text-main);
}
.s-val.positive { color: #f43f5e; }
.s-val.negative { color: #10b981; }
.s-label {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 8rpx;
}

.insight-row {
  display: flex;
  gap: 20rpx;
}
.insight-item {
  flex: 1;
  background: #F8FAFC;
  padding: 20rpx;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
}
.i-label { font-size: 22rpx; color: var(--text-sub); }
.i-val { font-size: 28rpx; font-weight: bold; color: var(--text-main); margin-top: 6rpx; }

.clear-btn {
  margin-left: auto;
  width: auto;
  height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.record-item {
  background: #F8FAFC;
  border-radius: var(--radius-md);
  padding: 24rpx;
  border: 2rpx solid transparent;
  transition: transform 0.2s;
}
.record-item:active {
  transform: scale(0.98);
}
.record-item.win {
  background: #FFF0F2;
  border-color: #FFE4E6;
}
.record-item.lose {
  background: #F0FDF4;
  border-color: #D1FAE5;
}
.record-item.draw {
  background: #F8FAFC;
}

.r-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}
.r-title {
  font-size: 30rpx;
  font-weight: 800;
  color: var(--text-main);
  display: block;
}
.r-time {
  font-size: 22rpx;
  color: var(--text-sub);
  margin-top: 4rpx;
  display: block;
}
.r-result {
  font-size: 24rpx;
  font-weight: bold;
  padding: 8rpx 20rpx;
  border-radius: var(--radius-pill);
}
.r-result.win { background: #FFE4E6; color: #E11D48; }
.r-result.lose { background: #D1FAE5; color: #059669; }
.r-result.draw { background: #E2E8F0; color: #475569; }

.r-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.r-data {
  display: flex;
  flex-direction: column;
}
.r-score {
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1;
}
.r-score.win { color: #E11D48; }
.r-score.lose { color: #059669; }
.r-score.draw { color: #475569; }
.r-rank {
  font-size: 24rpx;
  font-weight: bold;
  color: var(--text-main);
  margin-top: 10rpx;
}

.r-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  text-align: right;
  font-size: 22rpx;
  color: var(--text-sub);
  gap: 6rpx;
}
.r-opponents {
  max-width: 300rpx;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}
.empty-icon {
  font-size: 100rpx;
  margin-bottom: 20rpx;
}
.empty-text {
  font-size: 32rpx;
  font-weight: bold;
  color: var(--text-main);
}
.empty-sub {
  font-size: 24rpx;
  color: var(--text-sub);
  margin-top: 10rpx;
}
.empty-btn {
  margin-top: 40rpx;
  width: 300rpx;
}
</style>
