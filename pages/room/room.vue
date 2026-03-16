<template>
  <view class="room-container">
    <!-- 顶部人员横向滚动 -->
    <view class="players-scroll">
      <view class="players-container">
        <view v-for="(player, index) in players" :key="index" class="player-item" :class="{ 'current-player': index === 0 }">
          <image :src="player.avatar" class="player-avatar"></image>
          <view class="player-info">
            <view class="player-name" @click="editPlayerName(index)">{{ player.name }}</view>
            <view v-if="index === 0" class="player-tag">我</view>
          </view>
          <view class="player-score-container">
            <view class="player-score" @click="startEditScore(index)" v-if="editingScoreIndex !== index">
              <view class="star-icon">★</view>
              <span class="score-text">{{ player.score }}</span>
            </view>
            <view class="score-input" v-else>
              <input v-model="scoreInputs[index]" type="number" placeholder="输入分数" @confirm="handleScoreChange(index)" @blur="handleScoreChange(index)" class="score-input-field" autofocus />
            </view>
          </view>
        </view>
        <view class="player-item add-player" @click="inviteFriends">
          <div class="add-icon">
            <view class="plus-icon">+</view>
          </div>
          <view class="player-name">邀请</view>
        </view>
      </view>
    </view>

    <!-- 实时聊天界面 -->
    <view class="chat-container">
      <view class="chat-header">
        <view class="room-info">
          <view class="room-title">房间 {{ roomId }}</view>
          <view class="room-code">
            <view class="lock-icon">🔒</view>
            房间号: {{ roomId }}
          </view>
        </view>
        <view class="room-actions">
          <button @click="closeRoom" v-if="isRoomCreator" class="action-button close">关闭房间</button>
          <button @click="exitRoom" class="action-button exit">退出房间</button>
        </view>
      </view>
      <view class="chat-messages" ref="subtitleList">
        <view v-for="(subtitle, index) in subtitles" :key="index" class="message-item" :class="{ 'system-message': subtitle.type === 'system' }">
          <image :src="subtitle.avatar" class="message-avatar"></image>
          <view class="message-content">
            <view class="message-text">{{ subtitle.content }}</view>
            <view class="message-time">{{ subtitle.time }}</view>
          </view>
        </view>
      </view>
      <view class="chat-input">
        <input v-model="message" placeholder="输入消息..." class="message-input" @confirm="sendMessage" />
        <button @click="sendMessage" class="send-button">
          <view class="send-icon">➤</view>
        </button>
      </view>
    </view>

    <!-- 邀请二维码弹窗 -->
    <view v-if="qrcodePopup" class="modal-overlay" @click="qrcodePopup = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title">邀请好友加入房间</view>
          <view class="modal-close" @click="qrcodePopup = false">✕</view>
        </view>
        <view class="qrcode-content">
          <view class="qrcode-container">
            <image :src="qrcodeUrl" mode="aspectFit" style="width: 300rpx; height: 300rpx;"></image>
          </view>
          <view class="qrcode-tip">扫码加入房间 {{ roomId }}</view>
        </view>
      </view>
    </view>

    <!-- 修改玩家名称弹窗 -->
    <view v-if="editNamePopup" class="modal-overlay" @click="editNamePopup = false">
      <view class="modal-content" @click.stop>
        <view class="modal-header">
          <view class="modal-title">修改名称</view>
          <view class="modal-close" @click="editNamePopup = false">✕</view>
        </view>
        <view class="popup-content">
          <input v-model="editName" placeholder="请输入新名称" class="popup-input" autofocus />
          <view class="popup-buttons">
            <button @click="editNamePopup = false" class="popup-button cancel">取消</button>
            <button @click="savePlayerName" class="popup-button confirm">保存</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue';
import io from 'socket.io-client';

const roomId = ref('123456');
const qrcodePopup = ref(false);
const qrcodeUrl = ref('');
const editNamePopup = ref(false);
const editName = ref('');
const editIndex = ref(-1);
const editingScoreIndex = ref(-1);
const message = ref('');

const players = ref([]);
const scoreInputs = ref([]);
const subtitles = ref([]);
const subtitleList = ref(null);
const isRoomCreator = ref(false);
const socket = ref(null);

// 后端API地址
const API_BASE_URL = 'http://38.182.96.171:3000/api';
const SOCKET_URL = 'http://38.182.96.171:3000';

const inviteFriends = () => {
  // 生成二维码
  generateQRCode();
  // 显示二维码弹窗
  qrcodePopup.value = true;
};

const generateQRCode = () => {
  // 使用在线API生成二维码
  const appId = 'wx1234567890'; // 替换为实际的小程序appId
  const path = `pages/room/room?roomId=${roomId.value}`;
  const qrCodeText = `https://mp.weixin.qq.com/wxopen/qrcode?action=show&appid=${appId}&path=${encodeURIComponent(path)}`;
  
  // 由于草料二维码API需要付费，这里使用另一个免费的API
  qrcodeUrl.value = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeText)}`;
};

const editPlayerName = (index) => {
  editIndex.value = index;
  editName.value = players.value[index].name;
  setTimeout(() => {
    editNamePopup.value = true;
  }, 100);
};

const savePlayerName = () => {
  if (editName.value && editIndex.value >= 0) {
    players.value[editIndex.value].name = editName.value;
    addSubtitle(`玩家 ${players.value[editIndex.value].name} 修改了名称`);
    editNamePopup.value = false;
  }
};

const startEditScore = (index) => {
  editingScoreIndex.value = index;
  scoreInputs.value[index] = '';
};

const handleScoreChange = (index) => {
  const score = parseInt(scoreInputs.value[index]);
  if (!isNaN(score) && score > 0) {
    // 调用后端API更新分数
    updateScore(index, score);
  } else {
    // 取消编辑状态
    editingScoreIndex.value = -1;
  }
};

const updateScore = (index, score) => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  const fromUserId = players.value[0].userId;
  const toUserId = players.value[index].userId;
  
  uni.request({
    url: `${API_BASE_URL}/score/update`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      roomId: roomId.value,
      fromUserId: fromUserId,
      toUserId: toUserId,
      score: score
    },
    success: (res) => {
      if (res.data.code === 200) {
        // 更新本地分数
        players.value[0].score = res.data.data.fromUser.score;
        players.value[index].score = res.data.data.toUser.score;
        // 添加实时字幕
        addSubtitle(`玩家 ${players.value[0].name} 输给 ${players.value[index].name} ${score} 分`);
        // 通过Socket.io广播分数更新
        if (socket.value) {
          socket.value.emit('score-updated', {
            roomId: roomId.value,
            fromUserId: fromUserId,
            toUserId: toUserId,
            score: score
          });
        }
      } else {
        uni.showToast({ title: res.data.message || '分数更新失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('分数更新失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    },
    complete: () => {
      // 清空输入框
      scoreInputs.value[index] = '';
      // 取消编辑状态
      editingScoreIndex.value = -1;
    }
  });
};

const addSubtitle = (content, type = 'system') => {
  // 获取当前时间
  const now = new Date();
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // 新消息添加到开头
  subtitles.value.unshift({
    avatar: 'https://img.yzcdn.cn/vant/logo.png',
    content: content,
    time: time,
    type: type
  });
  // 保持滚动到顶部
  nextTick(() => {
    if (subtitleList.value) {
      const list = subtitleList.value;
      list.scrollTop = 0;
    }
  });
};

const sendMessage = () => {
  if (message.value) {
    const token = uni.getStorageSync('token');
    if (!token) {
      uni.navigateTo({ url: '/pages/login/login' });
      return;
    }
    
    // 调用后端API发送消息
    uni.request({
      url: `${API_BASE_URL}/message/send`,
      method: 'POST',
      header: {
        'Authorization': `Bearer ${token}`
      },
      data: {
        roomId: roomId.value,
        content: message.value,
        type: 'user'
      },
      success: (res) => {
        if (res.data.code === 200) {
          const msg = {
            userId: players.value[0].name,
            content: message.value
          };
          addSubtitle(`[${players.value[0].name}] ${message.value}`, 'user');
          message.value = '';
          // 通过Socket.io广播消息
          if (socket.value) {
            socket.value.emit('new-message', {
              roomId: roomId.value,
              message: msg
            });
          }
        } else {
          uni.showToast({ title: res.data.message || '消息发送失败', icon: 'none' });
        }
      },
      fail: (err) => {
        console.error('消息发送失败:', err);
        uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      }
    });
  }
};

const closeRoom = () => {
  uni.showModal({
    title: '关闭房间',
    content: '确定要关闭房间吗？所有玩家将被移出房间。',
    success: (res) => {
      if (res.confirm) {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.navigateTo({ url: '/pages/login/login' });
          return;
        }
        
        // 调用后端API关闭房间
        uni.request({
          url: `${API_BASE_URL}/room/close`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`
          },
          data: {
            roomId: roomId.value
          },
          success: (res) => {
            if (res.data.code === 200) {
              addSubtitle('房间已关闭');
              // 延迟后返回主页
              setTimeout(() => {
                uni.navigateBack({
                  delta: 1
                });
              }, 1000);
            } else {
              uni.showToast({ title: res.data.message || '关闭房间失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('关闭房间失败:', err);
            uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
          }
        });
      }
    }
  });
};

const exitRoom = () => {
  uni.showModal({
    title: '退出房间',
    content: '确定要退出房间吗？',
    success: (res) => {
      if (res.confirm) {
        const token = uni.getStorageSync('token');
        if (!token) {
          uni.navigateTo({ url: '/pages/login/login' });
          return;
        }
        
        // 调用后端API退出房间
        uni.request({
          url: `${API_BASE_URL}/room/exit`,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`
          },
          data: {
            roomId: roomId.value
          },
          success: (res) => {
            if (res.data.code === 200) {
              addSubtitle('你已退出房间');
              // 延迟后返回主页
              setTimeout(() => {
                uni.navigateBack({
                  delta: 1
                });
              }, 1000);
            } else {
              uni.showToast({ title: res.data.message || '退出房间失败', icon: 'none' });
            }
          },
          fail: (err) => {
            console.error('退出房间失败:', err);
            uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
          }
        });
      }
    }
  });
};

const joinRoom = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  uni.showLoading({ title: '加入房间中...' });
  
  // 调用后端API加入房间
  uni.request({
    url: `${API_BASE_URL}/room/join`,
    method: 'POST',
    header: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      roomId: roomId.value
    },
    success: (res) => {
      if (res.data.code === 200) {
        // 更新玩家列表
        players.value = res.data.data.players;
        scoreInputs.value = new Array(res.data.data.players.length).fill('');
        addSubtitle('你已加入房间');
      } else {
        uni.showToast({ title: res.data.message || '加入房间失败', icon: 'none' });
        // 延迟后返回主页
        setTimeout(() => {
          uni.navigateBack({
            delta: 1
          });
        }, 1000);
      }
    },
    fail: (err) => {
      console.error('加入房间失败:', err);
      uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
      // 延迟后返回主页
      setTimeout(() => {
        uni.navigateBack({
          delta: 1
        });
      }, 1000);
    },
    complete: () => {
      uni.hideLoading();
    }
  });
};

const getRoomInfo = () => {
  const token = uni.getStorageSync('token');
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' });
    return;
  }
  
  // 调用后端API获取房间信息
  uni.request({
    url: `${API_BASE_URL}/room/info`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    },
    data: {
      roomId: roomId.value
    },
    success: (res) => {
      if (res.data.code === 200) {
        // 更新玩家列表
        players.value = res.data.data.players;
        scoreInputs.value = new Array(res.data.data.players.length).fill('');
      } else {
        uni.showToast({ title: res.data.message || '获取房间信息失败', icon: 'none' });
      }
    },
    fail: (err) => {
      console.error('获取房间信息失败:', err);
    }
  });
};

const initSocket = () => {
  // 初始化Socket.io连接
  socket.value = io(SOCKET_URL, {
    transports: ['websocket'],
    autoConnect: true
  });
  
  // 连接成功
  socket.value.on('connect', () => {
    console.log('Socket连接成功:', socket.value.id);
    // 加入房间
    socket.value.emit('join-room', roomId.value);
  });
  
  // 玩家加入
  socket.value.on('player-joined', (data) => {
    console.log('玩家加入:', data);
    addSubtitle('有新玩家加入房间');
    // 刷新房间信息
    getRoomInfo();
  });
  
  // 玩家离开
  socket.value.on('player-left', (data) => {
    console.log('玩家离开:', data);
    addSubtitle('有玩家离开房间');
    // 刷新房间信息
    getRoomInfo();
  });
  
  // 分数更新
  socket.value.on('score-updated', (data) => {
    console.log('分数更新:', data);
    // 刷新房间信息
    getRoomInfo();
  });
  
  // 新消息
  socket.value.on('new-message', (msg) => {
    console.log('新消息:', msg);
    addSubtitle(`[${msg.userId}] ${msg.content}`, 'user');
  });
  
  // 连接断开
  socket.value.on('disconnect', () => {
    console.log('Socket连接断开');
  });
};

onMounted(() => {
  // 从URL参数中获取房间ID
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const options = currentPage.options;
  if (options.roomId) {
    roomId.value = options.roomId;
  }
  if (options.isCreator) {
    isRoomCreator.value = true;
    // 创建者不需要加入房间，直接获取房间信息
    getRoomInfo();
    addSubtitle('房间创建成功');
  } else {
    // 非创建者需要加入房间
    joinRoom();
  }
  
  // 初始化Socket.io连接
  initSocket();
});

onUnmounted(() => {
  // 离开房间
  if (socket.value) {
    socket.value.emit('leave-room', roomId.value);
    socket.value.disconnect();
  }
});
</script>

<style scoped>
.room-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  position: relative;
  overflow: hidden;
}

.room-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,107,107,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(78,205,196,0.1)"/><circle cx="40" cy="60" r="2" fill="rgba(131,56,236,0.1)"/><circle cx="60" cy="40" r="2" fill="rgba(251,86,7,0.1)"/></svg>');
  animation: float 20s infinite linear;
  z-index: 0;
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(100px, 100px);
  }
}

/* 顶部人员横向滚动 */
.players-scroll {
  background-color: #fff;
  padding: 20rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.1);
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: thin;
  scrollbar-color: #e9ecef #f8f9fa;
  z-index: 1;
}

.players-scroll::-webkit-scrollbar {
  height: 6rpx;
}

.players-scroll::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3rpx;
}

.players-scroll::-webkit-scrollbar-thumb {
  background: #e9ecef;
  border-radius: 3rpx;
}

.players-container {
  display: inline-flex;
  gap: 20rpx;
  padding-bottom: 10rpx;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 24rpx;
  background-color: #fff;
  border-radius: 20rpx;
  transition: all 0.3s ease;
  min-width: 280rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  position: relative;
  border: 2rpx solid #e9ecef;
  z-index: 1;
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50rpx) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.player-item:hover {
  background-color: #f8f9fa;
  transform: translateY(-4rpx) scale(1.02);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border-color: #4facfe;
}

.player-item.current-player {
  border-color: #4facfe;
  box-shadow: 0 0 0 3rpx rgba(79, 172, 254, 0.1);
  background-color: rgba(79, 172, 254, 0.05);
  animation: pulse 1.5s infinite;
}

.player-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  margin-right: 20rpx;
  border: 3rpx solid #e9ecef;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.player-item:hover .player-avatar {
  transform: scale(1.1);
  border-color: #4facfe;
}

.player-info {
  flex: 1;
  position: relative;
}

.player-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 4rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.player-name:hover {
  color: #4facfe;
  text-decoration: underline;
}

.player-tag {
  position: absolute;
  top: -8rpx;
  right: -40rpx;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
  font-size: 16rpx;
  padding: 4rpx 12rpx;
  border-radius: 50rpx;
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(79, 172, 254, 0.3);
}

.player-score-container {
  display: flex;
  align-items: center;
  margin-left: 20rpx;
}

.player-score {
  display: flex;
  align-items: center;
  padding: 12rpx 20rpx;
  background-color: #f8f9fa;
  border-radius: 50rpx;
  transition: all 0.3s ease;
  cursor: pointer;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.player-score:hover {
  background-color: rgba(79, 172, 254, 0.1);
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.2);
}

.star-icon {
  font-size: 24rpx;
  color: #ffd700;
  margin-right: 8rpx;
}

.score-text {
  font-size: 36rpx;
  font-weight: 700;
  color: #ff6b6b;
  margin-left: 4rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.score-input {
  width: 160rpx;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border: 2rpx solid #4facfe;
  animation: pulse 0.5s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.score-input-field {
  font-size: 30rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  border: none;
  outline: none;
  width: 100%;
}

.add-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30rpx;
  border: 2rpx dashed #e9ecef;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 180rpx;
}

.add-player:hover {
  border-color: #4facfe;
  background-color: rgba(79, 172, 254, 0.1);
  transform: translateY(-4rpx);
}

.add-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.plus-icon {
  font-size: 40rpx;
  color: #4facfe;
  font-weight: bold;
}

.add-player:hover .add-icon {
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

/* 实时聊天界面 */
.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  margin: 20rpx;
  border-radius: 32rpx;
  box-shadow: 0 10rpx 40rpx rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 1;
}

.chat-header {
  padding: 24rpx;
  border-bottom: 2rpx solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.room-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.room-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.room-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 4rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.room-code {
  font-size: 26rpx;
  color: #666;
  display: flex;
  align-items: center;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.lock-icon {
  font-size: 20rpx;
  margin-right: 8rpx;
}

.action-button {
  border-radius: 16rpx;
  padding: 12rpx 24rpx;
  font-size: 20rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  background: none;
}

.action-button.close {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.action-button.exit {
  background-color: #fff;
  color: #333;
  border: 2rpx solid #e9ecef;
}

.action-button:hover {
  transform: translateY(-2rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

.chat-messages {
  flex: 1;
  padding: 24rpx;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  scrollbar-width: thin;
  scrollbar-color: #e9ecef #f8f9fa;
}

.chat-messages::-webkit-scrollbar {
  width: 6rpx;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 3rpx;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #e9ecef;
  border-radius: 3rpx;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  transition: all 0.3s ease;
  animation: messageSlideIn 0.3s ease-out;
  max-width: 90%;
  align-self: flex-start;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.message-item.system-message {
  align-self: center;
  background-color: rgba(79, 172, 254, 0.1);
  border: 1rpx solid rgba(79, 172, 254, 0.3);
  max-width: 80%;
  animation: messageSlideIn 0.3s ease-out 0.2s;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateX(-20rpx) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.message-item:hover {
  background-color: #e9ecef;
  transform: translateX(10rpx) scale(1.02);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.message-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, #4facfe, transparent);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.message-item:hover::after {
  transform: scaleX(1);
}

.message-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 16rpx;
  flex-shrink: 0;
  border: 2rpx solid #e9ecef;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.message-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.message-text {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.message-time {
  font-size: 20rpx;
  color: #999;
  align-self: flex-end;
}

.chat-input {
  padding: 20rpx;
  border-top: 2rpx solid #e9ecef;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.message-input {
  flex: 1;
  border-radius: 24rpx;
  background-color: #fff;
  border: 2rpx solid #e9ecef;
  padding: 16rpx 24rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  outline: none;
}

.message-input:focus {
  border-color: #4facfe;
  box-shadow: 0 0 0 3rpx rgba(79, 172, 254, 0.1);
}

.send-button {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 2rpx solid #4facfe;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  background: none;
}

.send-icon {
  font-size: 28rpx;
  color: #4facfe;
  font-weight: bold;
}

.send-button:hover {
  background-color: #4facfe;
  color: #fff;
  transform: scale(1.1);
  box-shadow: 0 4rpx 12rpx rgba(79, 172, 254, 0.3);
}

.send-button:hover .send-icon {
  color: #fff;
}

/* 弹窗样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

.modal-content {
  background-color: #fff;
  border-radius: 32rpx;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.2);
  overflow: hidden;
  animation: popupSlideIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  width: 90%;
  max-width: 640rpx;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  border-bottom: 2rpx solid #e9ecef;
  background-color: #f8f9fa;
}

.modal-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.modal-close {
  font-size: 32rpx;
  color: #999;
  cursor: pointer;
  transition: all 0.3s ease;
}

.modal-close:hover {
  color: #333;
  transform: scale(1.1);
}

/* 二维码弹窗 */
.qrcode-content {
  padding: 50rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-container {
  margin-bottom: 24rpx;
  padding: 24rpx;
  background-color: #f8f9fa;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.qrcode-tip {
  font-size: 22rpx;
  color: #666;
  text-align: center;
  margin-top: 24rpx;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 修改名称弹窗 */
.popup-content {
  padding: 50rpx;
}

.popup-input {
  margin: 30rpx 0;
  border: 2rpx solid #e9ecef;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 24rpx;
  transition: all 0.3s ease;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
  outline: none;
  width: 100%;
}

.popup-input:focus {
  border-color: #4facfe;
  box-shadow: 0 0 0 3rpx rgba(79, 172, 254, 0.1);
}

.popup-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 50rpx;
  gap: 20rpx;
}

.popup-button {
  flex: 1;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 24rpx;
  font-weight: 600;
  transition: all 0.3s ease;
  border: none;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
  background: none;
}

.popup-button.cancel {
  background-color: #f8f9fa;
  color: #333;
}

.popup-button.confirm {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #fff;
}

.popup-button:hover {
  transform: translateY(-3rpx);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
}

@keyframes popupSlideIn {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(-20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>