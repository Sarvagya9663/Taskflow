# TaskFlow — Team Task Manager

Full-stack team task manager with Role-Based Access Control, Kanban boards, and real-time dashboard.

## 🚀 Quick Start (Local)

```bash
# 1. Install backend deps
cd backend && npm install

# 2. Install & build frontend
cd ../frontend && npm install && npm run build

# 3. Run (auto-seeds demo data on first start)
cd ../backend && node server.js

# Open http://localhost:3001
```

## 🔑 Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| admin@demo.com | admin123 | Admin |
| member@demo.com | member123 | Member |

## 🌐 Deploy to Railway

1. Push this folder to a GitHub repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables:
   - `JWT_SECRET` = any long random string
   - `NODE_ENV` = production
5. Deploy — Railway uses `railway.toml` automatically

## ⚙️ Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 3001 | Server port |
| NODE_ENV | development | Set to `production` for Railway |
| JWT_SECRET | (insecure default) | **Change this in production!** |
| DB_DIR | ./data | SQLite database directory |

## 📁 Project Structure
```
taskflow/
├── backend/
│   ├── db/database.js      # SQLite via sql.js (no native build)
│   ├── middleware/auth.js  # JWT + RBAC middleware
│   ├── routes/
│   │   ├── auth.js         # Signup, Login, /me
│   │   ├── projects.js     # Project CRUD + members
│   │   └── tasks.js        # Tasks, Comments, Dashboard
│   ├── server.js           # Express entry point
│   └── seed.js             # Demo data (auto-runs on first start)
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Projects, ProjectDetail, TaskDetail
│       ├── components/     # Layout/sidebar
│       ├── context/        # Auth context
│       └── utils/api.js    # Axios instance
└── railway.toml
```

## 🔐 RBAC Rules
- **Global Admin** — full access to everything
- **Global Member** — access only to their projects
- **Project Admin** — manage members, edit/delete project
- **Project Member** — create tasks, edit assigned tasks, comment
