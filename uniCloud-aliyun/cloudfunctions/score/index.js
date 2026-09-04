const db = uniCloud.database();
const realtime = uniCloud.database().realtime;

// 更新分数
exports.updateScore = async (event) => {
  try {
    const { roomId, fromUserId, toUserId, score } = event;
    
    // 验证分数必须为正数
    if (score <= 0) {
      return {
        code: 400,
        message: '分数必须为正数'
      };
    }
    
    // 查找扣分用户
    const fromPlayer = await db.collection('player').where({ roomId, userId: fromUserId }).get();
    if (fromPlayer.data.length === 0) {
      return {
        code: 404,
        message: '扣分用户不在房间中'
      };
    }
    
    // 查找加分用户
    const toPlayer = await db.collection('player').where({ roomId, userId: toUserId }).get();
    if (toPlayer.data.length === 0) {
      return {
        code: 404,
        message: '加分用户不在房间中'
      };
    }
    
    // 计算新分数
    const newFromScore = fromPlayer.data[0].score - score;
    const newToScore = toPlayer.data[0].score + score;
    
    // 更新分数
    await db.collection('player').doc(fromPlayer.data[0]._id).update({
      score: newFromScore,
      updatedAt: new Date()
    });
    
    await db.collection('player').doc(toPlayer.data[0]._id).update({
      score: newToScore,
      updatedAt: new Date()
    });
    
    // 记录分数历史
    await db.collection('scoreHistory').add({
      roomId,
      fromUserId,
      toUserId,
      score,
      timestamp: new Date()
    });
    
    // 触发实时数据推送
    const scoreData = {
      roomId,
      fromUserId,
      toUserId,
      score,
      fromUser: {
        userId: fromPlayer.data[0].userId,
        score: newFromScore
      },
      toUser: {
        userId: toPlayer.data[0].userId,
        score: newToScore
      },
      timestamp: new Date()
    };
    
    // 向房间内所有用户推送分数更新
    await realtime.publish({
      channel: `room_${roomId}_scores`,
      data: scoreData
    });
    
    return {
      code: 200,
      data: {
        fromUser: {
          userId: fromPlayer.data[0].userId,
          score: newFromScore
        },
        toUser: {
          userId: toPlayer.data[0].userId,
          score: newToScore
        }
      },
      message: '分数更新成功'
    };
  } catch (error) {
    console.error('分数更新失败:', error);
    return {
      code: 500,
      message: '分数更新失败'
    };
  }
};

// 获取分数历史
exports.getScoreHistory = async (event) => {
  try {
    const { roomId } = event;
    
    let query = db.collection('scoreHistory');
    
    // 如果提供了房间ID，按房间ID过滤
    if (roomId && roomId !== '') {
      query = query.where({ roomId });
    }
    
    // 获取分数历史记录
    const history = await query
      .orderBy('timestamp', 'desc')
      .get();
    
    return {
      code: 200,
      data: history.data.map(item => ({
        fromUserId: item.fromUserId,
        toUserId: item.toUserId,
        score: item.score,
        timestamp: item.timestamp,
        roomId: item.roomId
      })),
      message: '获取成功'
    };
  } catch (error) {
    console.error('获取分数历史失败:', error);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

exports.main = async (event) => {
  const { action, ...data } = event;
  switch (action) {
    case 'updateScore':
      return exports.updateScore(data);
    case 'getScoreHistory':
      return exports.getScoreHistory(data);
    default:
      return {
        code: 400,
        message: '无效的操作'
      };
  }
};