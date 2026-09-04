<template>
  <view class="history-page app-shell">
    <view class="page-nav">
      <view class="nav-btn nav-pill" @click="goBack">
        <text class="nav-icon">←</text>
        <text class="nav-btn-text">返回</text>
      </view>
      <view class="nav-title">
        <text class="title-text">历史战绩</text>
        <text class="sub-text">回看每一局的结果和你的走势</text>
      </view>
      <view class="nav-btn nav-pill right" @click="goToHome">
        <text class="nav-btn-text">首页</text>
      </view>
    </view>

    <view class="macaron-card summary-card">
      <view class="card-title">
        📈 生涯概览
        <text class="macaron-badge blue" style="margin-left:auto">{{ archiveStatusText }}</text>
      </view>

      <view class="summary-banner">
        <view class="banner-copy">
          <text class="banner-title">最近这段时间，你的牌桌状态 {{ archiveStatusText === '已同步' ? '已经更新' : '等待开局' }}</text>
          <text class="banner-sub">历史会自动记录每桌结果、排名和同桌信息，方便你回看走势。</text>
        </view>
        <view class="banner-pill">{{ latestResultText }}</view>
      </view>
      
      <view class="summary-grid">
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
        <view class="empty-icon">🗂</view>
        <view class="empty-text">还没有历史记录</view>
        <view class="empty-sub">开完第一桌以后，这里会自动沉淀你的全部战绩。</view>
        <button class="macaron-btn empty-btn" @click="goToHome">去开局</button>
      </view>
    </view>

    <view v-if="confirmPopup.visible" class="modal-mask" @click="closeConfirm">
      <view class="macaron-card modal-panel" @click.stop>
        <view class="modal-title">{{ confirmPopup.title || '提示' }}</view>
        <view class="modal-desc" style="font-size: 30rpx; margin-bottom: 40rpx; color: #4a4a4a;">
          {{ confirmPopup.content }}
        </view>
        <view class="modal-actions">
          <button class="macaron-btn ghost" @click="closeConfirm">取消</button>
          <button class="macaron-btn" :class="{ pink: confirmPopup.isDanger }" @click="handleConfirm">确 定</button>
        </view>
      </view>
    </view>

  </view>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '../../utils/api';
import { navigateBackOrPage, reLaunchPage, redirectToLogin } from '../../utils/auth';

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

const confirmPopup = ref({
  visible: false,
  title: '',
  content: '',
  isDanger: false,
  onConfirm: null
});

const showConfirm = (title, content, onConfirm, isDanger = false) => {
  confirmPopup.value = {
    visible: true,
    title,
    content,
    isDanger,
    onConfirm
  };
};

const closeConfirm = () => {
  confirmPopup.value.visible = false;
};

const handleConfirm = () => {
  if (confirmPopup.value.onConfirm) {
    confirmPopup.value.onConfirm();
  }
  closeConfirm();
};

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
  showConfirm('确认清空？', '所有历史战绩将被永久删除，不可恢复哦。', async () => {
    try {
      await api.clearHistory();
      historyRecords.value = [];
      await loadData();
      uni.showToast({ title: '已清空', icon: 'success' });
    } catch (error) {
      uni.showToast({ title: error.message || '清空失败', icon: 'none' });
    }
  }, true);
};

const goToHome = () => reLaunchPage('/pages/index/index');

const goBack = () => navigateBackOrPage('/pages/index/index');

onMounted(loadData);
</script>

<style scoped lang="scss">
.history-page {
  display: flex;
  flex-direction: column;
}

.page-nav {
  display: grid;
  grid-template-columns: 132rpx minmax(0, 1fr) 132rpx;
  align-items: center;
  column-gap: 16rpx;
}

.nav-pill {
  width: 132rpx;
  min-width: 132rpx;
  min-height: 76rpx;
  padding: 0 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  line-height: 1;
  justify-self: stretch;
}

.nav-icon {
  font-size: 26rpx;
  line-height: 1;
}

.nav-btn-text {
  line-height: 1;
}

.nav-title {
  align-items: center;
  text-align: center;
}

.summary-card {
  background: var(--card-bg-accent);
  border-color: rgba(255, 255, 255, 0.8);
}

.summary-banner {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-bottom: 24rpx;
  padding: 22rpx 24rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.74);
}

.banner-copy {
  flex: 1;
  min-width: 0;
}

.banner-title {
  display: block;
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-strong);
}

.banner-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--text-sub);
}

.banner-pill {
  flex-shrink: 0;
  min-height: 72rpx;
  padding: 0 22rpx;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, rgba(95, 140, 255, 0.14), rgba(255, 140, 171, 0.16));
  color: var(--primary-strong);
  font-size: 22rpx;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20rpx;
  margin-bottom: 24rpx;
}

.stat-box {
  padding: 24rpx 18rpx;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.72);
  border: 2rpx solid rgba(255, 255, 255, 0.7);
  box-shadow: var(--shadow-xs);
}

.s-val {
  font-size: 38rpx;
  font-weight: 900;
  color: var(--text-strong);
}
.s-val.positive { color: var(--accent-strong); }
.s-val.negative { color: #109c7a; }
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
  background: rgba(255, 255, 255, 0.72);
  padding: 20rpx;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  border: 2rpx solid var(--divider);
}

.i-label {
  font-size: 22rpx;
  color: var(--text-sub);
}

.i-val {
  font-size: 28rpx;
  font-weight: 800;
  color: var(--text-main);
  margin-top: 6rpx;
}

.clear-btn {
  margin-left: auto;
  width: auto;
  min-height: 60rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.record-list {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.record-item {
  background: rgba(255, 255, 255, 0.78);
  border-radius: var(--radius-md);
  padding: 24rpx;
  border: 2rpx solid var(--divider);
  box-shadow: var(--shadow-xs);
  transition: transform 0.18s ease, border-color 0.18s ease;
}

.record-item:active {
  transform: translateY(2rpx);
}

.record-item.win {
  background: linear-gradient(135deg, rgba(255, 140, 171, 0.09), rgba(255, 255, 255, 0.84));
  border-color: rgba(255, 140, 171, 0.16);
}

.record-item.lose {
  background: linear-gradient(135deg, rgba(52, 211, 171, 0.08), rgba(255, 255, 255, 0.84));
  border-color: rgba(52, 211, 171, 0.16);
}

.record-item.draw {
  background: rgba(255, 255, 255, 0.78);
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
  color: var(--text-strong);
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
  font-weight: 800;
  padding: 8rpx 20rpx;
  border-radius: var(--radius-pill);
}
.r-result.win { background: var(--accent-soft); color: var(--accent-strong); }
.r-result.lose { background: var(--mint-soft); color: #109c7a; }
.r-result.draw { background: #e9eef9; color: #55647d; }

.r-body {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.r-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.r-score {
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1;
}
.r-score.win { color: var(--accent-strong); }
.r-score.lose { color: #109c7a; }
.r-score.draw { color: #475569; }
.r-rank {
  font-size: 24rpx;
  font-weight: 800;
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
  padding: 70rpx 0 50rpx;
}
.empty-icon {
  width: 136rpx;
  height: 136rpx;
  border-radius: 42rpx;
  background: linear-gradient(135deg, var(--primary-soft), var(--accent-soft));
  color: var(--primary-strong);
  font-size: 68rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-text {
  font-size: 32rpx;
  font-weight: 800;
  color: var(--text-strong);
}
.empty-sub {
  font-size: 24rpx;
  color: var(--text-sub);
  margin-top: 10rpx;
  text-align: center;
  line-height: 1.7;
}
.empty-btn {
  margin-top: 40rpx;
  width: 300rpx;
}

@media (max-width: 380px) {
  .page-nav {
    grid-template-columns: 120rpx minmax(0, 1fr) 120rpx;
  }

  .summary-banner,
  .insight-row,
  .r-body {
    flex-direction: column;
    align-items: flex-start;
  }

  .r-meta {
    align-items: flex-start;
    text-align: left;
  }
}
</style>
