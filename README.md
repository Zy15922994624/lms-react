# lms-react

学习任务管理系统前端（React + TypeScript）。

## 仓库关系

- 前端：<https://github.com/Zy15922994624/lms-react>
- 后端：<https://github.com/Zy15922994624/server-nest>

## 技术栈

- React 19 + TypeScript + Vite
- Ant Design 6 + Tailwind CSS 4
- Zustand + TanStack Query
- Axios + Socket.IO Client

## 快速启动

### 仅启动前端

```bash
npm install
npm run dev
```

默认地址：`http://localhost:5173`

### 前后端一体化联调（推荐）

在 `server-nest` 目录执行：

```bash
docker compose up -d --build
docker exec lms-backend npm run seed:users
```

访问：`http://localhost:8080`

## 演示账号

- 管理员：`admin001 / Admin@123456`
- 教师：`teacher001 / Teacher@123456`
- 学生：`student001 / Student@123456`

## 常用命令

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run format
```
