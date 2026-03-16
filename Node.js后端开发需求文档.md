# Node.js后端开发需求文档

## 1. 项目概述

### 1.1 项目背景
本项目是一个打牌算分小程序的后端服务，为前端提供完整的API支持，包括用户认证、房间管理、计分系统、历史记录和消息系统等功能。

### 1.2 技术栈
- **语言**：Node.js 16+
- **框架**：Express 4.x
- **数据库**：MongoDB 4.4+
- **认证**：JWT (JSON Web Token)
- **实时通信**：Socket.io
- **部署**：Docker (可选)

## 2. 数据库设计

### 2.1 用户表 (users)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 用户ID | 主键 |
| `uid` | String | 唯一用户标识 | 唯一索引 |
| `nickName` | String | 用户昵称 | 普通索引 |
| `avatarUrl` | String | 用户头像URL | - |
| `phone` | String | 手机号 | 唯一索引 |
| `password` | String | 密码哈希 | - |
| `wechatOpenId` | String | 微信OpenID | 唯一索引 |
| `createdAt` | Date | 创建时间 | - |
| `updatedAt` | Date | 更新时间 | - |

### 2.2 房间表 (rooms)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 房间ID | 主键 |
| `roomId` | String | 房间号 | 唯一索引 |
| `creator` | String | 创建者UID | 普通索引 |
| `status` | String | 房间状态 (active/closed) | 普通索引 |
| `createdAt` | Date | 创建时间 | - |
| `updatedAt` | Date | 更新时间 | - |

### 2.3 玩家表 (players)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 玩家ID | 主键 |
| `roomId` | String | 房间号 | 普通索引 |
| `userId` | String | 用户UID | 普通索引 |
| `name` | String | 玩家名称 | - |
| `avatar` | String | 玩家头像URL | - |
| `score` | Number | 玩家分数 | - |
| `joinedAt` | Date | 加入时间 | - |

### 2.4 分数历史表 (scoreHistory)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 记录ID | 主键 |
| `roomId` | String | 房间号 | 普通索引 |
| `fromUserId` | String | 扣分用户UID | 普通索引 |
| `toUserId` | String | 加分用户UID | 普通索引 |
| `score` | Number | 分数 | - |
| `timestamp` | Date | 记录时间 | - |

### 2.5 消息表 (messages)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 消息ID | 主键 |
| `roomId` | String | 房间号 | 普通索引 |
| `userId` | String | 发送者UID | 普通索引 |
| `content` | String | 消息内容 | - |
| `type` | String | 消息类型 (user/system) | - |
| `timestamp` | Date | 发送时间 | - |

### 2.6 历史记录表 (history)
| 字段名 | 类型 | 描述 | 索引 |
|-------|------|------|------|
| `_id` | ObjectId | 记录ID | 主键 |
| `userId` | String | 用户UID | 普通索引 |
| `time` | String | 比赛时间 | - |
| `result` | String | 结果 (win/lose/draw) | - |
| `score` | Number | 分数 | - |
| `opponents` | Array<String> | 对手列表 | - |
| `createdAt` | Date | 创建时间 | - |

## 3. API接口设计

### 3.1 认证接口

#### 3.1.1 微信登录
- **URL**: `/api/auth/wechat`
- **方法**: POST
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `code` | String | 是 | 微信登录code |
  | `userInfo` | Object | 是 | 微信用户信息 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "token": "JWT令牌",
      "user": {
        "uid": "用户唯一标识",
        "nickName": "用户昵称",
        "avatarUrl": "用户头像URL"
      }
    },
    "message": "登录成功"
  }
  ```

#### 3.1.2 手机号登录
- **URL**: `/api/auth/phone`
- **方法**: POST
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `phone` | String | 是 | 手机号 |
  | `password` | String | 是 | 密码 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "token": "JWT令牌",
      "user": {
        "uid": "用户唯一标识",
        "nickName": "用户昵称",
        "avatarUrl": "用户头像URL"
      }
    },
    "message": "登录成功"
  }
  ```

#### 3.1.3 注册
- **URL**: `/api/auth/register`
- **方法**: POST
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `phone` | String | 是 | 手机号 |
  | `password` | String | 是 | 密码 |
  | `nickName` | String | 是 | 昵称 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "token": "JWT令牌",
      "user": {
        "uid": "用户唯一标识",
        "nickName": "用户昵称",
        "avatarUrl": "默认头像URL"
      }
    },
    "message": "注册成功"
  }
  ```

### 3.2 用户管理接口

#### 3.2.1 获取用户信息
- **URL**: `/api/user/info`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "uid": "用户唯一标识",
      "nickName": "用户昵称",
      "avatarUrl": "用户头像URL",
      "phone": "手机号"
    },
    "message": "获取成功"
  }
  ```

#### 3.2.2 更新用户信息
- **URL**: `/api/user/update`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `nickName` | String | 否 | 昵称 |
  | `avatarUrl` | String | 否 | 头像URL |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "uid": "用户唯一标识",
      "nickName": "更新后的昵称",
      "avatarUrl": "更新后的头像URL"
    },
    "message": "更新成功"
  }
  ```

### 3.3 房间管理接口

#### 3.3.1 创建房间
- **URL**: `/api/room/create`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "roomId": "房间号",
      "creator": "创建者UID"
    },
    "message": "房间创建成功"
  }
  ```

#### 3.3.2 加入房间
- **URL**: `/api/room/join`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "roomId": "房间号",
      "players": [
        {
          "userId": "用户UID",
          "name": "玩家名称",
          "avatar": "玩家头像URL",
          "score": 0
        }
      ]
    },
    "message": "加入房间成功"
  }
  ```

#### 3.3.3 获取房间信息
- **URL**: `/api/room/info`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **查询参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "roomId": "房间号",
      "creator": "创建者UID",
      "status": "房间状态",
      "players": [
        {
          "userId": "用户UID",
          "name": "玩家名称",
          "avatar": "玩家头像URL",
          "score": 0
        }
      ]
    },
    "message": "获取成功"
  }
  ```

#### 3.3.4 关闭房间
- **URL**: `/api/room/close`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "roomId": "房间号",
      "status": "closed"
    },
    "message": "房间已关闭"
  }
  ```

#### 3.3.5 退出房间
- **URL**: `/api/room/exit`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "roomId": "房间号"
    },
    "message": "已退出房间"
  }
  ```

### 3.4 计分系统接口

#### 3.4.1 更新分数
- **URL**: `/api/score/update`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
  | `fromUserId` | String | 是 | 扣分用户UID |
  | `toUserId` | String | 是 | 加分用户UID |
  | `score` | Number | 是 | 分数 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "fromUser": {
        "userId": "扣分用户UID",
        "score": "扣分后分数"
      },
      "toUser": {
        "userId": "加分用户UID",
        "score": "加分后分数"
      }
    },
    "message": "分数更新成功"
  }
  ```

#### 3.4.2 获取分数历史
- **URL**: `/api/score/history`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **查询参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": [
      {
        "fromUserId": "扣分用户UID",
        "toUserId": "加分用户UID",
        "score": 10,
        "timestamp": "2023-02-23T12:00:00Z"
      }
    ],
    "message": "获取成功"
  }
  ```

### 3.5 消息系统接口

#### 3.5.1 发送消息
- **URL**: `/api/message/send`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
  | `content` | String | 是 | 消息内容 |
  | `type` | String | 是 | 消息类型 (user/system) |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "messageId": "消息ID",
      "content": "消息内容",
      "timestamp": "2023-02-23T12:00:00Z"
    },
    "message": "消息发送成功"
  }
  ```

#### 3.5.2 获取消息记录
- **URL**: `/api/message/history`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **查询参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `roomId` | String | 是 | 房间号 |
  | `limit` | Number | 否 | 限制数量 |
  | `offset` | Number | 否 | 偏移量 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": [
      {
        "messageId": "消息ID",
        "userId": "发送者UID",
        "content": "消息内容",
        "type": "user",
        "timestamp": "2023-02-23T12:00:00Z"
      }
    ],
    "message": "获取成功"
  }
  ```

### 3.6 历史记录接口

#### 3.6.1 获取历史记录
- **URL**: `/api/history/list`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **查询参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `limit` | Number | 否 | 限制数量 |
  | `offset` | Number | 否 | 偏移量 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": [
      {
        "time": "2月23日 22:42:42",
        "result": "lose",
        "score": -32,
        "opponents": ["张三", "李四", "王五"]
      }
    ],
    "message": "获取成功"
  }
  ```

#### 3.6.2 添加历史记录
- **URL**: `/api/history/add`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **请求参数**:
  | 参数名 | 类型 | 必选 | 描述 |
  |-------|------|------|------|
  | `time` | String | 是 | 比赛时间 |
  | `result` | String | 是 | 结果 (win/lose/draw) |
  | `score` | Number | 是 | 分数 |
  | `opponents` | Array<String> | 是 | 对手列表 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "historyId": "历史记录ID"
    },
    "message": "添加成功"
  }
  ```

#### 3.6.3 清空历史记录
- **URL**: `/api/history/clear`
- **方法**: POST
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {},
    "message": "历史记录已清空"
  }
  ```

#### 3.6.4 获取统计数据
- **URL**: `/api/history/stats`
- **方法**: GET
- **请求头**:
  | 头部名 | 值 | 描述 |
  |-------|------|------|
  | `Authorization` | `Bearer JWT令牌` | 认证令牌 |
- **响应**:
  ```json
  {
    "code": 200,
    "data": {
      "totalGames": 12,
      "winGames": 9,
      "winRate": 75,
      "totalScore": 130,
      "averageScore": 10.8,
      "bestScore": 41
    },
    "message": "获取成功"
  }
  ```

## 4. 实时通信设计

### 4.1 Socket.io 事件

#### 4.1.1 连接和断开
- **connect**: 客户端连接
- **disconnect**: 客户端断开连接

#### 4.1.2 房间事件
- **join-room**: 加入房间
- **leave-room**: 离开房间
- **room-updated**: 房间信息更新
- **player-joined**: 玩家加入
- **player-left**: 玩家离开

#### 4.1.3 计分事件
- **score-updated**: 分数更新
- **score-history-updated**: 分数历史更新

#### 4.1.4 消息事件
- **new-message**: 新消息
- **message-history-updated**: 消息历史更新

### 4.2 实时通信流程

1. 客户端连接到Socket.io服务器
2. 客户端发送`join-room`事件，加入指定房间
3. 服务器广播`player-joined`事件给房间内所有成员
4. 当有分数更新时，服务器广播`score-updated`事件
5. 当有新消息时，服务器广播`new-message`事件
6. 客户端断开连接时，服务器发送`player-left`事件给房间内其他成员

## 5. 安全设计

### 5.1 认证安全
- 使用JWT进行身份验证
- 设置合理的token过期时间
- 密码使用bcrypt加密存储
- 微信登录使用官方API验证

### 5.2 数据安全
- 输入数据验证
- 防止SQL注入攻击
- 防止XSS攻击
- 防止CSRF攻击

### 5.3 传输安全
- 使用HTTPS协议
- 敏感数据加密传输

## 6. 部署方案

### 6.1 本地开发
- 使用nodemon进行热重载
- 本地MongoDB实例

### 6.2 生产部署
- 使用PM2进行进程管理
- 容器化部署 (Docker)
- 环境变量配置
- 日志管理

## 7. 项目结构

```
├── src/
│   ├── config/         # 配置文件
│   ├── controllers/    # 控制器
│   ├── middleware/     # 中间件
│   ├── models/         # 数据模型
│   ├── routes/         # 路由
│   ├── services/       # 业务逻辑
│   ├── utils/          # 工具函数
│   ├── socket/         # Socket.io处理
│   └── app.js          # 应用入口
├── package.json        # 项目配置
├── Dockerfile          # Docker配置
└── .env.example        # 环境变量示例
```

## 8. 实现步骤

### 8.1 初始化项目
1. 创建Node.js项目
2. 安装依赖
3. 配置环境变量

### 8.2 数据库设计
1. 设计MongoDB数据模型
2. 创建数据库连接
3. 实现数据模型

### 8.3 API接口实现
1. 实现认证接口
2. 实现用户管理接口
3. 实现房间管理接口
4. 实现计分系统接口
5. 实现消息系统接口
6. 实现历史记录接口

### 8.4 实时通信实现
1. 配置Socket.io
2. 实现房间事件处理
3. 实现计分事件处理
4. 实现消息事件处理

### 8.5 安全实现
1. 实现JWT认证
2. 实现输入验证
3. 实现安全中间件

### 8.6 测试和部署
1. 编写单元测试
2. 进行集成测试
3. 部署到生产环境

## 9. 技术要点

### 9.1 JWT认证
使用jsonwebtoken库实现JWT令牌的生成和验证，确保API接口的安全性。

### 9.2 Socket.io实时通信
使用Socket.io实现房间内的实时消息和分数更新，提升用户体验。

### 9.3 MongoDB数据存储
使用Mongoose库操作MongoDB，实现数据的持久化存储。

### 9.4 密码加密
使用bcrypt库对用户密码进行加密存储，确保用户数据安全。

### 9.5 错误处理
实现统一的错误处理机制，确保API接口的稳定性。

## 10. 总结

本后端系统设计基于Node.js + Express + MongoDB技术栈，为打牌算分小程序提供完整的API支持。系统包括用户认证、房间管理、计分系统、历史记录和消息系统等核心功能，通过Socket.io实现实时通信，提升用户体验。

系统设计遵循RESTful API设计原则，采用分层架构，代码结构清晰，易于维护和扩展。同时，系统注重安全性，实现了JWT认证、密码加密、输入验证等安全措施，确保用户数据的安全。

通过本后端系统的实现，打牌算分小程序将具备完整的功能，为用户提供便捷、高效的打牌算分体验。