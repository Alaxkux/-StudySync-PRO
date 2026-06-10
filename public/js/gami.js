const Gami = {
  s: null,
  init(){
    this.s = U.load('gami2',{ xp:0,level:0,streak:0,lastActive:null,solved:0,badges:[],toolsUsed:[],quizzes:0,flashcardsReviewed:0,plannerUsed:false,challenges:{},challengeDate:'' });
    this._checkStreak(); this._calcLevel(); this._render();
  },
  addXP(n,reason=''){
    this.s.xp+=n; this._calcLevel(); U.save('gami2',this.s); this._render();
    U.toast(`+${n} XP ${reason}`,'xp');
  },
  recordSolve(mode){
    this.s.solved++; this.s.lastActive=Date.now();
    this._incChallenge('solve');
    const old=this.s.level; this.addXP(CFG.XP[mode]||25,'— Problem solved!');
    if(this.s.level>old) this._levelUp(this.s.level);
    this._checkBadges(); U.save('gami2',this.s);
  },
  recordTool(id){
    if(!this.s.toolsUsed.includes(id)) this.s.toolsUsed.push(id);
    this._incChallenge(id); this.addXP(CFG.XP.tool,'— Tool used'); this._checkBadges();
  },
  recordQuiz(){
    this.s.quizzes++; this._incChallenge('quiz'); this.addXP(CFG.XP.quiz,'— Quiz done'); this._checkBadges();
  },
  recordFlashcard(){
    this.s.flashcardsReviewed++; this._incChallenge('fc'); this.addXP(CFG.XP.flashcard,'— Flashcard'); this._checkBadges();
  },
  recordPlanner(){
    this.s.plannerUsed=true; this._incChallenge('planner'); this.addXP(30,'— Study plan created'); this._awardBadge('planner'); this._checkBadges();
  },
  recordCommunity(){
    this._incChallenge('community'); this.addXP(CFG.XP.community,'— Community post'); this._awardBadge('community'); this._checkBadges();
  },
  _incChallenge(type){
    const today=new Date().toDateString();
    if(this.s.challengeDate!==today){ this.s.challenges={}; this.s.challengeDate=today; }
    this.s.challenges[type]=(this.s.challenges[type]||0)+1;
    U.save('gami2',this.s); this._renderChallenges();
  },
  _checkStreak(){
    if(!this.s.lastActive){ this.s.streak=0; return; }
    const days=(Date.now()-this.s.lastActive)/86400000;
    if(days>1.5) this.s.streak=0;
    else if(days<0.5){ /* same day */ }
    else this.s.streak++;
  },
  _calcLevel(){
    for(let i=CFG.LEVELS.length-1;i>=0;i--){ if(this.s.xp>=CFG.LEVELS[i].xp){this.s.level=i;break;} }
  },
  _checkBadges(){
    if(this.s.solved>=1)  this._awardBadge('first_solve');
    if(this.s.streak>=3)  this._awardBadge('streak_3');
    if(this.s.streak>=7)  this._awardBadge('streak_7');
    if(this.s.streak>=30) this._awardBadge('streak_30');
    if(this.s.solved>=10) this._awardBadge('solved_10');
    if(this.s.solved>=25) this._awardBadge('solved_25');
    if(this.s.solved>=50) this._awardBadge('solved_50');
    if(this.s.quizzes>=5)          this._awardBadge('quiz_master');
    if(this.s.flashcardsReviewed>=50) this._awardBadge('flashcard');
    if(this.s.toolsUsed.length>=5) this._awardBadge('tool_master');
    if(this.s.level>=5)            this._awardBadge('scholar');
    if(this.s.toolsUsed.includes('budget')) this._awardBadge('budget_pro');
  },
  _awardBadge(id){
    if(this.s.badges.includes(id)) return;
    this.s.badges.push(id); U.save('gami2',this.s);
    const b=CFG.BADGES.find(b=>b.id===id);
    if(b){ U.toast(`🎖 Badge: ${b.name}!`,'badge'); }
    this._renderAchievements();
  },
  _levelUp(lv){
    const lname=CFG.LEVELS[lv]?.name||'Scholar';
    U.$('levelup-text').textContent=`You are now a ${lname}`;
    U.$('levelup-screen').classList.remove('hidden');
    this._fireConfetti();
  },
  _fireConfetti(){
    const wrap=U.$('levelup-confetti'); if(!wrap)return;
    wrap.innerHTML='';
    const colors=['#6c47ff','#c8a96e','#00c896','#ff8c42','#ff4757'];
    for(let i=0;i<40;i++){
      const p=document.createElement('div');
      p.className='confetti-piece';
      p.style.cssText=`left:${Math.random()*100}%;background:${colors[i%5]};animation-delay:${Math.random()*0.5}s;animation-duration:${0.8+Math.random()*0.6}s`;
      wrap.appendChild(p);
    }
  },
  _render(){
    const lv=CFG.LEVELS[this.s.level]; const next=CFG.LEVELS[this.s.level+1];
    const pct=next?Math.min(((this.s.xp-lv.xp)/(next.xp-lv.xp))*100,100):100;
    const els={
      'nav-streak':this.s.streak,'nav-xp-val':this.s.xp+' XP',
      'sg-num-solved':this.s.solved,'sg-num-streak':this.s.streak+'🔥','sg-num-xp':this.s.xp,
      'sg-num-level':lv?.name||'Freshman',
      'xpc-level':lv?.name||'Freshman','xpc-next':next?.name||'Max',
      'xpc-remaining':next?`${next.xp-this.s.xp} XP to go`:'Max level!',
      'ps-xp':this.s.xp,'ps-streak':this.s.streak,'ps-solved':this.s.solved,
      'profile-level-text':lv?.name||'Freshman',
    };
    Object.entries(els).forEach(([id,val])=>{ const el=U.$(id); if(el)el.textContent=val; });
    const fills=['xpc-fill','profile-xp-fill'];
    fills.forEach(id=>{ const el=U.$(id); if(el)el.style.width=pct+'%'; });
    const pl=U.$('profile-xp-label'); if(pl)pl.textContent=next?`${next.xp-this.s.xp} XP to ${next.name}`:'Max level!';
    this._renderAchievements(); this._renderChallenges();
  },
  _renderAchievements(){
    const grid=U.$('achievements-grid'); if(!grid)return;
    grid.innerHTML='';
    CFG.BADGES.forEach(b=>{
      const earned=this.s.badges.includes(b.id);
      const el=document.createElement('div');
      el.className='ach-item glass-card'+(earned?'':' ach-item--locked');
      el.title=`${b.name}: ${b.desc}`;
      el.innerHTML=`<span class="ach-icon">${earned?b.icon:'🔒'}</span><span class="ach-name">${b.name}</span>`;
      grid.appendChild(el);
    });
  },
  _renderChallenges(){
    const wrap=U.$('challenges-row'); if(!wrap)return;
    const today=new Date().toDateString();
    const prog=this.s.challengeDate===today?this.s.challenges:{};
    // Pick 3 daily challenges
    const daily=CFG.DAILY_CHALLENGES.slice(0,3);
    wrap.innerHTML='';
    let done=0;
    daily.forEach(ch=>{
      const p=prog[ch.type]||0; const completed=p>=ch.target;
      if(completed)done++;
      const el=document.createElement('div');
      el.className='challenge-card glass-card'+(completed?' challenge-card--done':'');
      el.innerHTML=`
        <div class="ch-top">
          <span class="ch-icon">${ch.icon}</span>
          <span class="ch-xp">+${ch.xp} XP</span>
        </div>
        <p class="ch-text">${ch.text}</p>
        <div class="ch-prog-bar"><div class="ch-prog-fill" style="width:${Math.min((p/ch.target)*100,100)}%"></div></div>
        <span class="ch-status">${completed?'✓ Done':`${p}/${ch.target}`}</span>`;
      wrap.appendChild(el);
    });
    const badge=U.$('challenges-badge'); if(badge)badge.textContent=`${done}/3`;
  },
};
