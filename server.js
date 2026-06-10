require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');

const app    = express();
const PORT   = process.env.PORT || 3000;
const AI_KEY = process.env.ANTHROPIC_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* ── AI helper ─────────────────────────────────────────── */
async function callClaude(prompt, maxTokens = 2000) {
  if (!AI_KEY || AI_KEY === 'your_anthropic_key_here') {
    return null; // demo mode
  }
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': AI_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d.error?.message || 'Claude error');
  return d.content?.[0]?.text || '';
}

function parseJSON(text, fallback = {}) {
  try {
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch { return fallback; }
}

/* ── POST /api/solve ───────────────────────────────────── */
app.post('/api/solve', async (req, res) => {
  try {
    const { problem, mode, profile, extraContext, solveMode } = req.body;
    if (!problem) return res.status(400).json({ error: 'problem required' });

    let prompt = '';

    if (mode === 'emergency') {
      const { subject, hours, examWeight } = extraContext || {};
      prompt = `You are an expert exam-prep coach. Student: ${profile?.level}, ${profile?.field}.
Subject: ${subject}, Hours: ${hours}, Weight: ${examWeight}%.
Create a minute-by-minute emergency study schedule.
Respond ONLY with JSON:
{"diagnosis":"string","rootCause":"string","mustKnow":["topic"],"skipTopics":["topic"],
"schedule":[{"time":"18:00","duration":"45 min","task":"string","type":"study|break|review|sleep","priority":"high|medium|low"}],
"successTip":"string","successProbability":75}`;
    } else if (mode === 'deepdive') {
      prompt = `You are a student life strategist. Student: ${profile?.level}, ${profile?.field}, struggles: ${profile?.struggles?.join(', ')}.
Problem: "${problem}"
Respond ONLY with JSON:
{"diagnosis":"string","rootCauses":["string"],"category":"academic|time|finance|mental|career|social|study","severity":"low|medium|high|critical",
"actionPlan":[{"step":1,"when":"Today","duration":"30 min","action":"string","why":"string","resources":["string"]}],
"quickWins":["string"],"avoidMistakes":["string"],"successMetrics":["string"],"successProbability":80,"encouragement":"string"}`;
    } else if (solveMode === 'simplify') {
      prompt = `Explain this like I'm a complete beginner (ELI5 style): "${problem}"
Respond ONLY with JSON:
{"diagnosis":"Simple explanation","rootCause":"Why this matters","category":"academic","severity":"low",
"actionPlan":[{"step":1,"when":"Now","duration":"5 min","action":"string"}],
"quickWin":"string","successProbability":90,"encouragement":"string"}`;
    } else if (solveMode === 'stepbystep') {
      prompt = `Provide extremely detailed step-by-step working for: "${problem}"
Respond ONLY with JSON:
{"diagnosis":"Step-by-step breakdown","rootCause":"Core concept","category":"academic","severity":"low",
"actionPlan":[{"step":1,"when":"Step 1","duration":"","action":"Detailed step with explanation"}],
"quickWin":"string","successProbability":95,"encouragement":"string"}`;
    } else {
      prompt = `You are StudySync AI. Student: ${profile?.level}, ${profile?.field}, struggles: ${profile?.struggles?.join(', ')}.
Problem: "${problem}"
Respond ONLY with JSON:
{"diagnosis":"string","rootCause":"string","category":"academic|time|finance|mental|career|social|study","severity":"low|medium|high|critical",
"actionPlan":[{"step":1,"when":"Tonight","duration":"20 min","action":"string"}],
"quickWin":"string","resources":["string"],"successProbability":75,"encouragement":"string"}`;
    }

    const text = await callClaude(prompt);
    if (!text) return res.json(getDemoSolve(problem, mode));
    res.json(parseJSON(text, getDemoSolve(problem, mode)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/flashcards ──────────────────────────────── */
app.post('/api/flashcards', async (req, res) => {
  try {
    const { topic, notes } = req.body;
    const prompt = `Generate 8 flashcards for: "${topic}". ${notes ? `Notes: ${notes}` : ''}
Respond ONLY with JSON:
{"flashcards":[{"id":1,"front":"Question or term","back":"Answer or definition","difficulty":"easy|medium|hard","category":"string"}]}`;
    const text = await callClaude(prompt, 1500);
    if (!text) return res.json(getDemoFlashcards(topic));
    res.json(parseJSON(text, getDemoFlashcards(topic)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/quiz ────────────────────────────────────── */
app.post('/api/quiz', async (req, res) => {
  try {
    const { topic, difficulty, count = 5 } = req.body;
    const prompt = `Generate ${count} quiz questions about "${topic}" at ${difficulty} difficulty.
Mix question types: multiple choice, true/false, fill-in-blank.
Respond ONLY with JSON:
{"questions":[{"id":1,"type":"mcq|truefalse|fillblank","question":"string","options":["A","B","C","D"],"correct":0,"explanation":"string","difficulty":"${difficulty}"}]}`;
    const text = await callClaude(prompt, 2000);
    if (!text) return res.json(getDemoQuiz(topic, difficulty));
    res.json(parseJSON(text, getDemoQuiz(topic, difficulty)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/study-plan ──────────────────────────────── */
app.post('/api/study-plan', async (req, res) => {
  try {
    const { course, topics, examDate, planDays } = req.body;
    const prompt = `Create a ${planDays}-day study plan for "${course}".
Topics: ${topics}. Exam date: ${examDate}.
Respond ONLY with JSON:
{"title":"string","totalDays":${planDays},"days":[{"day":1,"date":"string","theme":"string","tasks":[{"time":"09:00","duration":"1hr","task":"string","type":"study|review|practice|rest","completed":false}],"dailyGoal":"string"}]}`;
    const text = await callClaude(prompt, 3000);
    if (!text) return res.json(getDemoStudyPlan(course, planDays));
    res.json(parseJSON(text, getDemoStudyPlan(course, planDays)));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/community-solve ─────────────────────────── */
app.post('/api/community-solve', async (req, res) => {
  try {
    const { problem } = req.body;
    const prompt = `Generate 3 authentic student community responses to: "${problem}"
Respond ONLY with JSON:
{"solutions":[{"avatar":"emoji","name":"string","level":"string","solution":"string","upvotes":23,"badge":"string"}],
"aiSynthesis":"string"}`;
    const text = await callClaude(prompt, 1000);
    if (!text) return res.json(getDemoCommunity());
    res.json(parseJSON(text, getDemoCommunity()));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── POST /api/cv ──────────────────────────────────────── */
app.post('/api/cv', async (req, res) => {
  try {
    const { experience } = req.body;
    const prompt = `Generate 4 professional CV bullet points for: "${experience}"
Action-oriented, measurable where possible.
Respond ONLY with JSON: {"bullets":["• string","• string","• string","• string"]}`;
    const text = await callClaude(prompt, 600);
    if (!text) return res.json({ bullets: ['• Add your ANTHROPIC_API_KEY to .env for real CV bullets', '• Demo mode is active', '• Real bullets will be action-oriented', '• With measurable impact where possible'] });
    res.json(parseJSON(text, { bullets: [] }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Demo data ─────────────────────────────────────────── */
function getDemoSolve(problem) {
  return {
    diagnosis: 'Demo mode — add ANTHROPIC_API_KEY to .env for real AI solutions.',
    rootCause: 'API key not configured yet.',
    category: 'academic', severity: 'medium',
    actionPlan: [
      { step: 1, when: 'Right now', duration: '2 min', action: 'Open the .env file in your project root' },
      { step: 2, when: 'Then', duration: '1 min', action: 'Paste your Anthropic API key after ANTHROPIC_API_KEY=' },
      { step: 3, when: 'After', duration: '1 min', action: 'Restart the server with npm start' },
    ],
    quickWin: 'Get your free key at console.anthropic.com',
    resources: ['console.anthropic.com'],
    successProbability: 100,
    encouragement: "You're one API key away from a full AI student advisor!",
  };
}
function getDemoFlashcards(topic) {
  return { flashcards: [
    { id:1, front:`What is ${topic}?`, back:'Add your API key for real flashcards', difficulty:'easy', category: topic },
    { id:2, front:'How does it work?', back:'Real AI-generated answers coming soon', difficulty:'medium', category: topic },
    { id:3, front:'Why is it important?', back:'Configure your Anthropic key in .env', difficulty:'hard', category: topic },
    { id:4, front:'Give an example', back:'Demo mode — real examples with API key', difficulty:'easy', category: topic },
  ]};
}
function getDemoQuiz(topic, difficulty) {
  return { questions: [
    { id:1, type:'mcq', question:`Demo question about ${topic}`, options:['Option A','Option B','Option C','Option D'], correct:0, explanation:'Add API key for real questions', difficulty },
    { id:2, type:'truefalse', question:`Is ${topic} important to study?`, options:['True','False'], correct:0, explanation:'Of course it is!', difficulty },
    { id:3, type:'mcq', question:'What does StudySync need to work?', options:['An API key','Nothing','A VPN','A credit card'], correct:0, explanation:'Add ANTHROPIC_API_KEY to .env', difficulty },
  ]};
}
function getDemoStudyPlan(course, planDays) {
  const days = [];
  for (let i = 1; i <= Math.min(planDays, 7); i++) {
    days.push({ day:i, date:`Day ${i}`, theme:`${course} - Week ${i}`, tasks:[
      { time:'09:00', duration:'1hr', task:`Study ${course} fundamentals`, type:'study', completed:false },
      { time:'11:00', duration:'30min', task:'Practice problems', type:'practice', completed:false },
      { time:'14:00', duration:'45min', task:'Review notes', type:'review', completed:false },
    ], dailyGoal:`Complete core ${course} concepts for day ${i}` });
  }
  return { title:`${course} Study Plan`, totalDays: planDays, days };
}
function getDemoCommunity() {
  return {
    solutions: [
      { avatar:'👩‍💻', name:'Amara K.', level:'3rd Year CS', solution:'Break the problem into smaller pieces. Tackle one at a time.', upvotes:34, badge:'Problem Crusher' },
      { avatar:'👨‍🔬', name:'David O.', level:'2nd Year Engineering', solution:'Office hours changed everything for me. Professors love when you show up.', upvotes:21, badge:'Helper' },
      { avatar:'👩‍🎨', name:'Zara M.', level:'Final Year Design', solution:'YouTube + forums saved me. Someone has always solved your exact problem.', upvotes:15, badge:'Scholar' },
    ],
    aiSynthesis: 'Break it down, seek help proactively, and use available resources rather than suffering alone.'
  };
}

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, () => console.log(`\n🎓 StudySync Pro → http://localhost:${PORT}\n`));
