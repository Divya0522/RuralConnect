# 🏥 Rural Health Connect System

A production-ready, role-based healthcare platform connecting villagers, doctors, helpline operators, Panchayat health workers, and administrators through a centralized system for rural healthcare management.

---

## 📋 Project Structure

```
RuralConnect/
├── backend/              # Node.js + Express + MongoDB API
│   ├── models/           # Mongoose schemas (9 models)
│   ├── routes/           # REST API routes (11 modules)
│   ├── middleware/       # JWT auth, RBAC, error handler, Multer
│   ├── utils/            # Audit logger
│   ├── uploads/          # Uploaded images & files
│   ├── server.js         # Main Express app
│   ├── seed.js           # Database seeding script
│   └── .env              # Environment variables
│
└── frontend/             # React Native (Expo Router)
    ├── app/
    │   ├── _layout.jsx   # Root layout + auth guard
    │   ├── auth/         # Login + Register screens
    │   └── dashboard/    # Role-specific dashboards
    ├── components/ui/    # Shared UI components
    ├── context/          # AuthContext
    ├── services/         # Axios API service layer
    └── constants/        # Config, colors, role constants
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (or local MongoDB)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your mobile device

### 1. Backend Setup

```bash
cd backend
npm install
```

Create/update `.env` (already configured):
```
MONGO_URL=mongodb+srv://ruralconnect:ruralconnect@cluster0.flimvh7.mongodb.net/?appName=Cluster0
PORT=5000
JWT_SECRET=ruralconnect_jwt_super_secret_2024
JWT_REFRESH_SECRET=ruralconnect_refresh_super_secret_2024
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
NODE_ENV=development
```

```bash
# Seed the database with sample data
node seed.js

# Start the backend server
npm run dev
```

API will be available at: `http://localhost:5000/api`
Health check: `http://localhost:5000/api/health`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm start
```

Scan the QR code with **Expo Go** to launch on your device.

> **Note:** Make sure your `.env` or `constants/config.js` `API_BASE_URL` points to your backend IP address (use your machine's local IP instead of `localhost` when testing on a physical device).
> Example: `http://192.168.1.X:5000/api`

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| 🔧 Admin | admin@rhc.com | Admin@123 |
| 👨‍⚕️ Senior Doctor | senior.doctor@rhc.com | Doctor@123 |
| 🩺 Junior Doctor | junior.doctor@rhc.com | Doctor@123 |
| 📞 Helpline Operator | helpline@rhc.com | Help@123 |
| 🏘️ Panchayat Officer | panchayat@rhc.com | Panch@123 |
| 🤒 Patient | patient@rhc.com | Patient@123 |

---

## 🗂️ Database Models

| Model | Description |
|-------|-------------|
| `User` | All roles, bcrypt password, JWT refresh token |
| `Patient` | Demographics, medical history, emergency contact |
| `Case` | Full workflow status tracking with history |
| `DoctorReport` | Vitals, clinical notes, medicines |
| `Diagnosis` | Senior doctor diagnosis, prescriptions |
| `FollowUp` | Scheduled follow-up visits |
| `Village` | Village info, assigned doctors |
| `Notification` | In-app notifications with read status |
| `Log` | Audit log of all system actions |

---

## 📡 API Endpoints

| Module | Base Route | Key Endpoints |
|--------|-----------|---------------|
| Auth | `/api/auth` | POST register, login, refresh, logout |
| Users | `/api/users` | CRUD (admin only) |
| Patients | `/api/patients` | CRUD with search |
| Cases | `/api/cases` | CRUD + assign + status update + senior review |
| Reports | `/api/reports` | Doctor visit reports with file upload |
| Diagnoses | `/api/diagnoses` | Senior doctor diagnoses |
| Follow-ups | `/api/followups` | Schedule & complete |
| Villages | `/api/villages` | Village management |
| Notifications | `/api/notifications` | Read, mark-all-read |
| Analytics | `/api/analytics` | Summary, trends, performance |
| Logs | `/api/logs` | Audit logs (admin only) |

---

## 👥 User Roles & Dashboards

| Role | Dashboard Features |
|------|-------------------|
| **Patient** | Submit complaints, view case status, doctor instructions |
| **Helpline Operator** | Register cases, assign junior doctors, search cases |
| **Junior Doctor** | View assigned cases, submit visit reports with vitals, request senior review |
| **Senior Doctor** | Review queue, provide final diagnosis, prescribe treatment |
| **Panchayat Officer** | Village analytics, disease trends, monthly charts |
| **Admin** | User management, system analytics, audit logs |

---

## ⚙️ Case Workflow

```
Submitted → Assigned → Visited → Reviewed → Treated → Follow-up → Closed
```

Each status change is recorded in `statusHistory` and triggers notifications to relevant users.

---

## 🔒 Security Features

- **bcrypt** password hashing (12 rounds)
- **JWT** access tokens (15min) + refresh tokens (7 days)
- **Helmet** security headers
- **CORS** origin restriction
- **Express Rate Limiting** (200 req/15min general, 20 req/15min auth)
- **Input validation** via express-validator
- **Role-based access control** on every API route
- **Audit logging** for all system actions

---

## 🎨 Design System

- **Primary**: Medical Blue (#1E88E5)
- **Secondary**: Teal/Green (#26A69A)
- **Accent**: Health Green (#43A047)
- **Background**: Soft Gray (#F0F4F8)
- Rounded cards with soft shadows
- Color-coded status and severity badges
- Pull-to-refresh on all list screens
