# Study-Easy

![CI](https://github.com/Radhikapatel-code/study-easy/actions/workflows/ci.yml/badge.svg)

> **Full-stack MERN productivity platform** with a gamified task/habit tracker — JWT-authenticated REST API, MongoDB persistence, and a React frontend with dynamic completion analytics and a tiered ranking system.

**Stack:** React.js · Node.js · Express.js · MongoDB · Tailwind CSS

<!-- Add live URL here once deployed -->
<!-- 🔗 **Live Demo:** [https://study-easy.vercel.app](https://study-easy.vercel.app) -->

**Demo Accounts** (after running `node server/seed.js`):

| Email | Password |
|---|---|
| `demo@gmail.com` | `demo1234` |
| `reviewer@gmail.com` | `review1234` |
| `guest@gmail.com` | `guest1234` |

---

## Architecture

```
Client (React + Vite)  →  REST API (Express.js)  →  MongoDB
       ↓                         ↓
   Tailwind CSS            JWT Authentication
   Lucide Icons            Habit ↔ Task Sync
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ✗ | Register a new user |
| `POST` | `/login` | ✗ | Login, returns JWT token |
| `GET` | `/tasks` | ✓ | Get user's tasks (optional `?date=YYYY-MM-DD`) |
| `POST` | `/tasks` | ✓ | Create a new task |
| `PUT` | `/tasks/:id` | ✓ | Toggle task completion (syncs linked habits) |
| `DELETE` | `/tasks/:id` | ✓ | Delete a task |
| `GET` | `/habits` | ✓ | Get user's habits |
| `POST` | `/habits` | ✓ | Create habit + auto-linked daily task |
| `PUT` | `/habits/:id` | ✓ | Update habit streak (syncs linked tasks) |
| `DELETE` | `/habits/:id` | ✓ | Delete habit + linked tasks |
| `POST` | `/sync-habits-to-tasks` | ✓ | Ensure today's habit tasks exist |

---

## 📡 SYSTEM TRANSMISSION

<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/6a07e5a0-8071-44b7-81e3-ce5040108a95" />

**Study-Easy** is a gamified productivity platform designed to turn the daily academic grind into a retro-futuristic mission. Built with the **MERN Stack**, it transforms standard to-do lists into "Missions," tracks habits as "Protocols," and rewards consistency with a dynamic ranking system ranging from Bronze to Platinum.

---

## 📸 VISUAL LOGS

| **Mission Board (Daily Ops)** | **Neural Profile (Stats)** |
|---|---|
| <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1ff15ef5-8d56-4f8c-b6ed-7458e0b5d26f" /> | <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/90f8c9f2-1f30-41a0-90c4-8857aedcd5c4" /> |
| *High-contrast, pixelated task management.* | *Gamified stats & rank tracking.* |

| **Habit Tracker** | **Calendar Reminder** |
|---|---|
| <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/c8b8ad68-0dec-4e4c-adca-49ca001e37d4" /> | <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/6aec7541-47fd-4c6e-bc77-e4f08b4b73be" /> |
| *Visual streak tracking & recurring protocols.* | *Monthly planner with timed reminders.* |

---

## 🕹️ CORE MODULES

### 1. 🛡️ **Mission Board (Daily Tasks)**
* **Retro Terminal UI:** A clean, pixelated interface (`VT323` font) for managing daily objectives.
* **Priority Matrices:** Classify missions as `LOW` (Purple), `MEDIUM` (Cyan), or `HIGH` (Red) priority with distinct visual cues.
* **Optimistic Updates:** Instant visual feedback (neon strikes & glows) when tasks are engaged or completed.
* **Category Tagging:** Organize by `[WORK]`, `[HEALTH]`, `[LEARNING]`, etc.

### 2. 📊 **Neural Profile (Gamification)**
* **Dynamic Analytics:** Tracking of total missions, daily completion rates, and active habits.
* **Dynamic Ranking System:** Your rank upgrades automatically based on your efficiency:
    * 🟤 **BRONZE:** < 50% Completion
    * ⚪ **SILVER:** 50% - 74%
    * 🟡 **GOLD:** 75% - 89% (Pulsing Glow)
    * 🔵 **PLATINUM:** 90%+ (High-Energy Neon Animation)
* **Data Chips:** Earn badges for milestones like "Streak Keeper" or "Task Master."

### 3. ⚡ **Habit Log**
* **Recurring Protocols:** Set habits that persist daily.
* **Sync Logic:** Habits are automatically synced to your daily task list for seamless tracking.

### 4. 🔐 **JWT Authentication**
* **Secure API:** All data routes require a valid JWT Bearer token.
* **Token-based Identity:** Server derives user identity from the token — no client-supplied email spoofing.
* **Auto-redirect:** Expired/invalid tokens redirect to login automatically.

---

## 🛠️ TECH STACK

| **Layer** | **Technology** |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Lucide React (Icons) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **Testing** | Jest, Supertest, MongoDB Memory Server |
| **CI/CD** | GitHub Actions |
| **Aesthetics** | Google Fonts (`VT323`), Custom CSS Animations |

---

## 💾 INSTALLATION PROTOCOL

Follow these steps to deploy the system locally.

### Prerequisites
* Node.js (v16+)
* MongoDB installed locally or an Atlas URI

### 1. Clone the Repository
```bash
git clone https://github.com/Radhikapatel-code/study-easy.git
cd study-easy
```

### 2. Initialize Backend (Server)
```bash
cd server
npm install

# Create a .env file
echo "MONGO_URI=your_mongodb_connection_string" > .env
echo "JWT_SECRET=your_secret_key" >> .env
echo "PORT=5000" >> .env

# Start the server
node server.js
```
Console Output: `>> ✅ MongoDB Connected` `>> 🚀 Server running on port 5000`

### 3. Initialize Frontend (Client)
Open a new terminal window:
```bash
cd client
npm install

# Launch the interface
npm run dev
```
Access the system at `http://localhost:5173`

### 4. Seed Demo Accounts (Optional)
```bash
cd server
node seed.js
```

### 5. Run Tests
```bash
# Server tests
cd server
npm test

# Client tests
cd client
npm test
```

---

## 🔮 FUTURE UPGRADES
- [ ] Multiplayer Leaderboards: Compete with other pilots.
- [ ] Shop System: Spend earned "Data Chips" on UI themes.
- [ ] Focus Timer: Built-in Pomodoro timer with lo-fi beats (basic version already available).
- [ ] Weekly/monthly analytics view with MongoDB aggregation pipelines.
- [ ] Task reminders via browser notifications.

---

## 🤝 CONTRIBUTING
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

Crafted with 💜 and ☕ by Radhika Sanagadhiya — Commander of the Study-Easy Grid
