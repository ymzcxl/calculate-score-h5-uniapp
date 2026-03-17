const db = uniCloud.database();
const realtime = uniCloud.database().realtime;

// 发送消息
exports.sendMessage = async (event) => {
  try {
    const { roomId, content, type, uid } = event;
    
    // 验证消息类型
    if (!['user', 'system'].includes(type)) {
      return {
        code: 400,
        message: '消息类型无效'
      };
    }
    
    // 创建消息
    const messageResult = await db.collection('message').add({
      roomId,
      userId: uid,
      content,
      type,
      timestamp: new Date()
    });
    
    // 触发实时数据推送
    const messageData = {
      messageId: messageResult.id,
      roomId,
      userId: uid,
      content,
      type,
      timestamp: new Date()
    };
    
    // 向房间内所有用户推送消息
    await realtime.publish({
      channel: `room_${roomId}_messages`,
      data: messageData
    });
    
    return {
      code: 200,
      data: {
        messageId: messageResult.id,
        content,
        timestamp: new Date()
      },
      message: '消息发送成功'
    };
  } catch (error) {
    console.error('消息发送失败:', error);
    return {
      code: 500,
      message: '消息发送失败'
    };
  }
};

// 获取消息记录
exports.getMessageHistory = async (event) => {
  try {
    const { roomId, limit = 50, offset = 0 } = event;
    
    // 获取消息记录
    const messages = await db.collection('message')
      .where({ roomId })
      .orderBy('timestamp', 'desc')
      .skip(parseInt(offset))
      .limit(parseInt(limit))
      .get();
    
    return {
      code: 200,
      data: messages.data.map(msg => ({
        messageId: msg._id,
        userId: msg.userId,
        content: msg.content,
        type: msg.type,
        timestamp: msg.timestamp
      })),
      message: '获取成功'
    };
  } catch (error) {
    console.error('获取消息记录失败:', error);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

exports.main = async (event) => {
  const { action, ...data } = event;
  switch (action) {
    case 'sendMessage':
      return exports.sendMessage(data);
    case 'getMessageHistory':
      return exports.getMessageHistory(data);
    default:
      return {
        code: 400,
        message: '无效的操作'
      };
  }
};