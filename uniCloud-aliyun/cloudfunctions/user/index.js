const db = uniCloud.database();
const crypto = require('crypto');

// 密码哈希函数
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// 登录/注册用户
exports.login = async (event) => {
  try {
    const { uid, nickName, avatarUrl, password, phone } = event;
    
    // 检查用户是否已存在
    const existingUser = await db.collection('user').where({ uid }).get();
    
    if (existingUser.data.length > 0) {
      // 用户已存在，更新信息
      const updateData = {
        nickName,
        avatarUrl,
        updatedAt: new Date()
      };
      
      // 如果提供了密码，更新密码
      if (password) {
        updateData.password = hashPassword(password);
      }
      
      // 如果提供了手机号，更新手机号
      if (phone) {
        updateData.phone = phone;
      }
      
      await db.collection('user').doc(existingUser.data[0]._id).update(updateData);
      
      return {
        code: 200,
        data: {
          uid: existingUser.data[0].uid,
          nickName,
          avatarUrl,
          phone: existingUser.data[0].phone || phone
        },
        message: '登录成功'
      };
    } else {
      // 用户不存在，创建新用户
      const userData = {
        uid,
        nickName,
        avatarUrl,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 如果提供了密码，添加密码
      if (password) {
        userData.password = hashPassword(password);
      }
      
      // 如果提供了手机号，添加手机号
      if (phone) {
        userData.phone = phone;
      }
      
      const userResult = await db.collection('user').add(userData);
      
      return {
        code: 200,
        data: {
          uid,
          nickName,
          avatarUrl,
          phone
        },
        message: '注册成功'
      };
    }
  } catch (error) {
    console.error('登录/注册失败:', error);
    return {
      code: 500,
      message: '登录/注册失败'
    };
  }
};

// 密码登录
exports.passwordLogin = async (event) => {
  try {
    const { phone, password } = event;
    
    // 查找用户
    const user = await db.collection('user').where({ phone }).get();
    
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    // 验证密码
    if (user.data[0].password !== hashPassword(password)) {
      return {
        code: 401,
        message: '密码错误'
      };
    }
    
    return {
      code: 200,
      data: {
        uid: user.data[0].uid,
        nickName: user.data[0].nickName,
        avatarUrl: user.data[0].avatarUrl,
        phone: user.data[0].phone
      },
      message: '登录成功'
    };
  } catch (error) {
    console.error('密码登录失败:', error);
    return {
      code: 500,
      message: '登录失败'
    };
  }
};

// 获取用户信息
exports.getUserInfo = async (event) => {
  try {
    const { uid } = event;
    
    // 获取用户信息
    const user = await db.collection('user').where({ uid }).get();
    
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    return {
      code: 200,
      data: {
        uid: user.data[0].uid,
        nickName: user.data[0].nickName,
        avatarUrl: user.data[0].avatarUrl,
        phone: user.data[0].phone
      },
      message: '获取成功'
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

// 更新用户信息
exports.updateUserInfo = async (event) => {
  try {
    const { uid, nickName, avatarUrl, phone, password } = event;
    
    // 检查用户是否存在
    const user = await db.collection('user').where({ uid }).get();
    
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    // 准备更新数据
    const updateData = {
      updatedAt: new Date()
    };
    
    if (nickName) updateData.nickName = nickName;
    if (avatarUrl) updateData.avatarUrl = avatarUrl;
    if (phone) updateData.phone = phone;
    if (password) updateData.password = hashPassword(password);
    
    // 更新用户信息
    await db.collection('user').doc(user.data[0]._id).update(updateData);
    
    return {
      code: 200,
      data: {
        uid,
        nickName: updateData.nickName || user.data[0].nickName,
        avatarUrl: updateData.avatarUrl || user.data[0].avatarUrl,
        phone: updateData.phone || user.data[0].phone
      },
      message: '更新成功'
    };
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return {
      code: 500,
      message: '更新失败'
    };
  }
};

// 获取用户统计数据
exports.getUserStats = async (event) => {
  try {
    const { uid } = event;
    
    // 检查用户是否存在
    const user = await db.collection('user').where({ uid }).get();
    if (user.data.length === 0) {
      return {
        code: 404,
        message: '用户不存在'
      };
    }
    
    // 获取用户参与的房间数量
    const rooms = await db.collection('player').where({ userId: uid }).get();
    const totalGames = rooms.data.length;
    
    // 获取用户的分数历史
    const scoreHistory = await db.collection('scoreHistory')
      .where({ $or: [{ fromUserId: uid }, { toUserId: uid }] })
      .get();
    
    // 计算胜场数
    let winGames = 0;
    let totalScore = 0;
    let bestScore = 0;
    
    scoreHistory.data.forEach(item => {
      if (item.toUserId === uid) {
        winGames++;
        totalScore += item.score;
        if (item.score > bestScore) {
          bestScore = item.score;
        }
      } else if (item.fromUserId === uid) {
        totalScore -= item.score;
      }
    });
    
    // 计算胜率
    const winRate = totalGames > 0 ? Math.round((winGames / totalGames) * 100) : 0;
    // 计算平均得分
    const averageScore = scoreHistory.data.length > 0 ? totalScore / scoreHistory.data.length : 0;
    
    return {
      code: 200,
      data: {
        totalGames,
        winGames,
        winRate,
        totalScore,
        averageScore,
        bestScore
      },
      message: '获取成功'
    };
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    return {
      code: 500,
      message: '获取失败'
    };
  }
};

exports.main = async (event) => {
  const { action, ...data } = event;
  switch (action) {
    case 'login':
      return exports.login(data);
    case 'passwordLogin':
      return exports.passwordLogin(data);
    case 'getUserInfo':
      return exports.getUserInfo(data);
    case 'updateUserInfo':
      return exports.updateUserInfo(data);
    case 'getUserStats':
      return exports.getUserStats(data);
    default:
      return {
        code: 400,
        message: '无效的操作'
      };
  }
};