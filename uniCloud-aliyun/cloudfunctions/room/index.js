const db = uniCloud.database();
const crypto = require('crypto');
const realtime = uniCloud.database().realtime;

// 生成房间号
const generateRoomId = () => {
  return 'room_' + crypto.randomBytes(6).toString('hex');
};

// 创建房间
exports.createRoom = async (event) => {
  try {
    const { uid } = event;
    
    // 生成房间号
    const roomId = generateRoomId();
    
    // 创建房间
    const roomResult = await db.collection('room').add({
      roomId,
      creator: uid,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 获取用户信息
    const user = await db.collection('user').where({ uid }).get();
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    // 创建玩家记录
    const playerResult = await db.collection('player').add({
      roomId,
      userId: uid,
      name: user.data[0].nickName,
      avatar: user.data[0].avatarUrl,
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return {
      code: 200,
      data: {
        roomId,
        creator: uid
      },
      message: '房间创建成功'
    };
  } catch (error) {
    console.error('创建房间失败:', error);
    return {
      code: 500,
      message: '房间创建失败'
    };
  }
};

// 加入房间
exports.joinRoom = async (event) => {
  try {
    const { roomId, uid } = event;
    
    // 检查房间是否存在
    const room = await db.collection('room').where({ roomId, status: 'active' }).get();
    if (room.data.length === 0) {
      return {
        code: 404,
        message: '房间不存在或已关闭'
      };
    }
    
    // 检查用户是否已在房间中
    const existingPlayer = await db.collection('player').where({ roomId, userId: uid }).get();
    if (existingPlayer.data.length > 0) {
      return {
        code: 400,
        message: '您已在该房间中'
      };
    }
    
    // 获取用户信息
    const user = await db.collection('user').where({ uid }).get();
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    // 创建玩家记录
    await db.collection('player').add({
      roomId,
      userId: uid,
      name: user.data[0].nickName,
      avatar: user.data[0].avatarUrl,
      score: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // 获取房间内所有玩家
    const players = await db.collection('player').where({ roomId }).get();
    
    const playerList = players.data.map(p => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      score: p.score
    }));
    
    // 触发实时数据推送
    const joinData = {
      roomId,
      type: 'join',
      userId: uid,
      players: playerList,
      timestamp: new Date()
    };
    
    // 向房间内所有用户推送加入消息
    await realtime.publish({
      channel: `room_${roomId}_players`,
      data: joinData
    });
    
    return {
      code: 200,
      data: {
        roomId,
        players: playerList
      },
      message: '加入房间成功'
    };
  } catch (error) {
    console.error('加入房间失败:', error);
    return {
      code: 500,
      message: '加入房间失败'
    };
  }
};

// 获取房间信息
exports.getRoomInfo = async (event) => {
  try {
    const { roomId } = event;
    
    // 检查房间是否存在
    const room = await db.collection('room').where({ roomId }).get();
    if (room.data.length === 0) {
      return {
        code: 404,
        message: '房间不存在'
      };
    }
    
    // 获取房间内所有玩家
    const players = await db.collection('player').where({ roomId }).get();
    
    return {
      code: 200,
      data: {
        roomId: room.data[0].roomId,
        creator: room.data[0].creator,
        status: room.data[0].status,
        players: players.data.map(p => ({
          userId: p.userId,
          name: p.name,
          avatar: p.avatar,
          score: p.score
        }))
      },
      message: '获取成功'
    };
  } catch (error) {
    console.error('获取房间信息失败:', error);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

// 关闭房间
exports.closeRoom = async (event) => {
  try {
    const { roomId, uid } = event;
    
    // 检查房间是否存在
    const room = await db.collection('room').where({ roomId }).get();
    if (room.data.length === 0) {
      return {
        code: 404,
        message: '房间不存在'
      };
    }
    
    // 检查是否是房间创建者
    if (room.data[0].creator !== uid) {
      return {
        code: 403,
        message: '只有房间创建者可以关闭房间'
      };
    }
    
    // 关闭房间
    await db.collection('room').where({ roomId }).update({
      status: 'closed',
      updatedAt: new Date()
    });
    
    // 触发实时数据推送
    const closeData = {
      roomId,
      type: 'close',
      userId: uid,
      timestamp: new Date()
    };
    
    // 向房间内所有用户推送关闭消息
    await realtime.publish({
      channel: `room_${roomId}_status`,
      data: closeData
    });
    
    return {
      code: 200,
      data: {
        roomId,
        status: 'closed'
      },
      message: '房间已关闭'
    };
  } catch (error) {
    console.error('关闭房间失败:', error);
    return {
      code: 500,
      message: '关闭房间失败'
    };
  }
};

// 退出房间
exports.exitRoom = async (event) => {
  try {
    const { roomId, uid } = event;
    
    // 检查玩家是否在房间中
    const player = await db.collection('player').where({ roomId, userId: uid }).get();
    if (player.data.length === 0) {
      return {
        code: 400,
        message: '您不在该房间中'
      };
    }
    
    // 删除玩家记录
    await db.collection('player').doc(player.data[0]._id).remove();
    
    // 获取房间内剩余玩家
    const remainingPlayers = await db.collection('player').where({ roomId }).get();
    const playerList = remainingPlayers.data.map(p => ({
      userId: p.userId,
      name: p.name,
      avatar: p.avatar,
      score: p.score
    }));
    
    // 触发实时数据推送
    const exitData = {
      roomId,
      type: 'exit',
      userId: uid,
      players: playerList,
      timestamp: new Date()
    };
    
    // 向房间内所有用户推送退出消息
    await realtime.publish({
      channel: `room_${roomId}_players`,
      data: exitData
    });
    
    return {
      code: 200,
      data: {
        roomId
      },
      message: '已退出房间'
    };
  } catch (error) {
    console.error('退出房间失败:', error);
    return {
      code: 500,
      message: '退出房间失败'
    };
  }
};

exports.main = async (event) => {
  const { action, ...data } = event;
  switch (action) {
    case 'createRoom':
      return exports.createRoom(data);
    case 'joinRoom':
      return exports.joinRoom(data);
    case 'getRoomInfo':
      return exports.getRoomInfo(data);
    case 'closeRoom':
      return exports.closeRoom(data);
    case 'exitRoom':
      return exports.exitRoom(data);
    default:
      return {
        code: 400,
        message: '无效的操作'
      };
  }
};