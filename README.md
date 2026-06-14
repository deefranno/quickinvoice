# QuickInvoice Caribbean

A full-stack invoicing web app built for Caribbean freelancers and SMEs.  
Stack: **Express + SQLite** (backend) · **React + Vite** (frontend) · **Railway** (deployment)

---

## 🚀 Deploy to Railway (one service)

### 1. Push to GitHub
```bash
git add .
git commit -m "initial commit"
git push origin main
```

### 2. Create a Railway project
- Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
- Select your repo

### 3. Set environment variables in Railway
Copy `server/.env.example` → fill in your values in Railway's **Variables** tab:

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | ✅ | Set to `production` |
| `JWT_SECRET` | ✅ | Random 32+ char string |
| `ADMIN_JWT_SECRET` | ✅ | Different random string |
| `ADMIN_EMAIL` | ✅ | Admin panel login email |
| `DB_PATH` | Recommended | Set to `/data` after adding a volume |
| `STRIPE_*` | Optional | Only if using Stripe |
| `WIPAY_*` | Optional | Only if using WiPay |
| `SMTP_*` | Optional | Email notifications |

### 4. Add a Volume for database persistence (recommended)
- Railway Dashboard → your service → **Volumes** tab
- Add volume → Mount path: `/data`
- Add env var: `DB_PATH=/data`

Without a volume, the SQLite database resets on each deploy/restart.

### 5. Deploy
Railway auto-deploys on every push. The build runs:
```
cd server && npm install
cd client && npm install && npm run build
```
Then starts with: `node server/index.js`

---

## 💻 Local Development

```bash
# Install all deps
cd server && npm install && cd ..
cd client && npm install && cd ..

# Copy and fill in your env
cp server/.env.example server/.env

# Run both servers concurrently
# Terminal 1:
cd server && nodemon index.js

# Terminal 2:
cd client && npm run dev
```

Client runs at `http://localhost:5173`  
API runs at `http://localhost:3001`

---

## 🏗 Project Structure

```
├── client/              React + Vite frontend
│   └── src/
│       ├── components/  Layout, BottomNav, DesktopSidebar, etc.
│       ├── pages/       Dashboard, Invoices, Clients, Reports...
│       ├── context/     AuthContext
│       └── utils/       api.js (Axios instance)
├── server/              Express backend
│   ├── db/              SQLite + migrations + seed
│   ├── routes/          auth, invoices, clients, reports, admin...
│   ├── middleware/       auth, adminAuth, planGate
│   ├── gateways/        Stripe, WiPay, Ezee
│   └── index.js         Entry point
├── railway.toml         Railway deployment config
├── nixpacks.toml        Build phase config
└── package.json         Root scripts
```

---

## Admin Panel

Visit `/admin/login` to access the admin panel.  
Default admin credentials are seeded from `ADMIN_EMAIL` + a temporary password set in `server/db/seed.js`.
