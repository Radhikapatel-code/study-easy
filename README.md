# 🚀 STUDY-EASY // WORKSPACE V2.0

> **"PLOT TWIST: STUDYING JUST GOT FUN... LET'S PLAN IT OUT!"**

![Project Banner](https://via.placeholder.com/1000x350/050505/22d3ee?text=STUDY-EASY+SYSTEM+ONLINE)
*(Replace this link with a banner image or a screenshot of your dashboard)*

## 📡 SYSTEM TRANSMISSION
**Study-Easy** is a gamified productivity platform designed to turn the daily academic grind into a retro-futuristic mission. Built with the **MERN Stack**, it transforms standard to-do lists into "Missions," tracks habits as "Protocols," and rewards consistency with a dynamic ranking system ranging from Bronze to Platinum.

---

## 📸 VISUAL LOGS

| **Mission Board (Daily Ops)** | **Neural Profile (Stats)** |
|:---:|:---:|
| ![Mission Board](screenshots/mission_board_preview.png) | ![Profile](screenshots/profile_preview.png) |
| *High-contrast, pixelated task management.* | *Gamified stats & rank tracking.* |

| **Habit Tracker** | **Login Portal** |
|:---:|:---:|
| ![Habits](screenshots/habit_preview.png) | ![Login](screenshots/login_preview.png) |
| *Visual streak tracking & recurring protocols.* | *Secure entry point for pilots.* |

*(⚠️ Note: Create a folder named `screenshots` in your repo and add images named `mission_board_preview.png`, etc., for these to show up!)*

---

## 🕹️ CORE MODULES

### 1. 🛡️ **Mission Board (Daily Tasks)**
* **Retro Terminal UI:** A clean, pixelated interface (`VT323` font) for managing daily objectives.
* **Priority Matrices:** Classify missions as `LOW` (Purple), `MEDIUM` (Cyan), or `HIGH` (Red) priority with distinct visual cues.
* **Optimistic Updates:** Instant visual feedback (neon strikes & glows) when tasks are engaged or completed.
* **Category Tagging:** Organize by `[WORK]`, `[HEALTH]`, `[LEARNING]`, etc.

### 2. 📊 **Neural Profile (Gamification)**
* **Live Analytics:** Real-time tracking of total missions, daily completion rates, and active habits.
* **Dynamic Ranking System:** Your rank upgrades automatically based on your efficiency:
    * 🟤 **BRONZE:** < 50% Completion
    * ⚪ **SILVER:** 50% - 74%
    * 🟡 **GOLD:** 75% - 89% (Pulsing Glow)
    * 🔵 **PLATINUM:** 90%+ (High-Energy Neon Animation)
* **Data Chips:** Earn badges for milestones like "Streak Keeper" or "Task Master."

### 3. ⚡ **Habit Log**
* **Recurring Protocols:** Set habits that persist daily.
* **Sync Logic:** Habits are automatically synced to your daily task list for seamless tracking.

---

## 🛠️ TECH STACK

| **Layer** | **Technology** |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS, Lucide React (Icons) |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **Aesthetics** | Google Fonts (`VT323`), Custom CSS Animations (`hue-rotate`, `breathing-bg`) |
| **State** | React Hooks (`useState`, `useEffect`) |

---

## 💾 INSTALLATION PROTOCOL

Follow these steps to deploy the system locally.

### Prerequisites
* Node.js (v16+)
* MongoDB installed locally or an Atlas URI

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/study-easy.git](https://github.com/your-username/study-easy.git)
cd study-easy

2. Initialize Backend (Server)
Bash

cd backend
npm install

# Create a .env file
echo "MONGO_URI=your_mongodb_connection_string" > .env
echo "PORT=5000" >> .env

# Start the server
node server.js
Console Output: >> Server online on Port 5000

3. Initialize Frontend (Client)
Open a new terminal window:

Bash

cd frontend
npm install

# Launch the interface
npm run dev
Access the system at http://localhost:5173

🔮 FUTURE UPGRADES
[ ] Multiplayer Leaderboards: Compete with other pilots.

[ ] Shop System: Spend earned "Data Chips" on UI themes.

[ ] Focus Timer: Built-in Pomodoro timer with lo-fi beats.

🤝 CONTRIBUTING
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Crafted with 💜 and ☕ by Radhika Sanagadhiya Commander of the Study-Easy Grid