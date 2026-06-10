# StudySync Pro 🎓
**Premium AI-powered student platform — Glassmorphism Design System v2**

## Setup (3 minutes)

### 1. Install dependencies
```bash
cd studysync2
npm install
```

### 2. Add your Anthropic API key
Open `.env` and replace the placeholder:
```
ANTHROPIC_API_KEY=your_key_here
```
Get a free key at: https://console.anthropic.com

### 3. Start
```bash
npm start
# or with auto-reload:
npm run dev
```

### 4. Open browser
```
http://localhost:3000
```

---

## Features

### Core
- **3-step onboarding** — level, struggles, field of study
- **AI Problem Solver** — Quick Fix, Deep Dive, Emergency mode
- **Solve styles** — Normal, ELI5 (Simplify), Step-by-Step

### Study Tools
- 🍅 **Pomodoro Timer** — SVG ring, session dots, study time tracker
- 🃏 **AI Flashcards** — Generate from any topic, flip, mastery tracking
- 📝 **AI Quiz** — MCQ, True/False, Fill-in-blank, score + explanations
- 💸 **Budget Planner** — Income/expense tracker with savings advice
- 🧠 **Burnout Detector** — 5-question mental health assessment
- 📅 **Deadline Tracker** — Urgency-ranked assignment tracker
- 📄 **CV Generator** — AI-powered professional bullet points

### Advanced
- 📅 **AI Study Planner** — 7/14/30 day personalized plans
- 🏆 **Leaderboard** — Podium + full ranking, 3 sort modes
- 👥 **Community** — AI-synthesized community answers, study groups
- ⌘K **Command Palette** — Global search + navigation shortcuts
- 🌙 **Dark/Light Mode** — Full glassmorphism in both themes

### Gamification
- XP system with 7 levels (Freshman → Professor)
- 15 achievement badges
- Daily challenges (3/day)
- Streak tracking
- Level-up animation with confetti

---

## Project Structure
```
studysync2/
├── server.js              ← Express + AI proxy
├── .env                   ← API keys
├── package.json
└── public/
    ├── index.html         ← Full app shell
    ├── css/
    │   └── style.css      ← Glassmorphism design system
    └── js/
        ├── config.js      ← Levels, badges, challenges, leaderboard data
        ├── utils.js       ← Helpers, storage, toast
        ├── gami.js        ← Gamification engine
        ├── solver.js      ← AI solver + solution rendering
        ├── tools.js       ← All 7 study tools
        ├── planner.js     ← Study planner + leaderboard + community + search
        └── app.js         ← Main controller + navigation
```

## Demo Mode
No API key? The app runs in demo mode showing placeholder responses so you can explore the full UI. Add your key to `.env` to enable real AI.
# -StudySync-PRO
