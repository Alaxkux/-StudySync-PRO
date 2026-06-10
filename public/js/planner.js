// ── Study Planner ─────────────────────────────────────────
const Planner = {
  planDays: 7,
  plan: null,

  init(){
    U.$$('.plan-len-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        U.$$('.plan-len-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.planDays=parseInt(btn.dataset.days);
      });
    });
    U.$('planner-gen-btn')?.addEventListener('click',()=>this.generate());
  },

  async generate(){
    const course=U.$('pf-course')?.value.trim();
    const topics=U.$('pf-topics')?.value.trim();
    const date=U.$('pf-date')?.value;
    if(!course){U.toast('Enter a course name','error');return;}
    const btn=U.$('planner-gen-btn');
    btn.textContent='Generating…'; btn.disabled=true;
    try{
      const r=await fetch(`${CFG.API}/study-plan`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({course,topics,examDate:date,planDays:this.planDays}),
      });
      const d=await r.json();
      this.plan=d;
      this.render(d);
      Gami.recordPlanner();
      U.toast(`${this.planDays}-day plan generated!`,'success');
    }catch(e){U.toast('Error: '+e.message,'error');}
    btn.textContent='📅 Generate My Plan'; btn.disabled=false;
  },

  render(plan){
    const out=U.$('planner-output'); if(!out)return;
    const typeColor={study:'var(--purple)',review:'var(--amber)',practice:'var(--emerald)',rest:'var(--cyan)'};
    out.innerHTML=`
      <div class="plan-header glass-card">
        <h3>${U.esc(plan.title||'Study Plan')}</h3>
        <span class="plan-days-badge">${plan.totalDays} Days</span>
      </div>
      <div class="plan-days-list">
        ${(plan.days||[]).map(day=>`
          <div class="plan-day glass-card">
            <div class="plan-day-header">
              <div class="plan-day-num">Day ${day.day}</div>
              <div class="plan-day-info">
                <strong>${U.esc(day.theme||'')}</strong>
                <span>${U.esc(day.date||'')}</span>
              </div>
              <div class="plan-day-goal">${U.esc(day.dailyGoal||'')}</div>
            </div>
            <div class="plan-tasks">
              ${(day.tasks||[]).map((t,ti)=>`
                <div class="plan-task" data-day="${day.day}" data-task="${ti}">
                  <div class="plan-task-dot" style="background:${typeColor[t.type]||'var(--purple)'}"></div>
                  <div class="plan-task-body">
                    <span class="plan-task-time">${U.esc(t.time||'')} · ${U.esc(t.duration||'')}</span>
                    <span class="plan-task-name">${U.esc(t.task)}</span>
                  </div>
                  <button class="plan-task-check ${t.completed?'plan-task-check--done':''}" onclick="Planner.toggleTask(${day.day},${ti})">
                    ${t.completed?'✓':'○'}
                  </button>
                </div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`;
  },

  toggleTask(dayNum,taskIdx){
    if(!this.plan)return;
    const day=this.plan.days.find(d=>d.day===dayNum);
    if(day&&day.tasks[taskIdx]) day.tasks[taskIdx].completed=!day.tasks[taskIdx].completed;
    this.render(this.plan);
    Gami.addXP(5,'— Task completed');
  },
};

// ── Leaderboard ───────────────────────────────────────────
const LB = {
  mode: 'xp',

  init(){
    U.$$('.lb-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        U.$$('.lb-tab').forEach(t=>t.classList.remove('active'));
        tab.classList.add('active');
        this.mode=tab.dataset.lb;
        this.render();
      });
    });
    this.render();
    this._renderCommLB();
  },

  render(){
    const sorted=[...CFG.LEADERBOARD].sort((a,b)=>b[this.mode]-(a[this.mode]));
    // Podium (top 3)
    const podium=U.$('lb-podium'); if(podium){
      const [first,second,third]=sorted;
      podium.innerHTML=`
        <div class="podium-wrap">
          <div class="podium-item podium-item--2nd">
            <div class="podium-avatar">${second?.avatar||'👤'}</div>
            <div class="podium-name">${U.esc(second?.name||'')}</div>
            <div class="podium-val">${this._val(second)}</div>
            <div class="podium-block podium-block--2nd">2</div>
          </div>
          <div class="podium-item podium-item--1st">
            <div class="podium-crown">👑</div>
            <div class="podium-avatar podium-avatar--1st">${first?.avatar||'👤'}</div>
            <div class="podium-name">${U.esc(first?.name||'')}</div>
            <div class="podium-val">${this._val(first)}</div>
            <div class="podium-block podium-block--1st">1</div>
          </div>
          <div class="podium-item podium-item--3rd">
            <div class="podium-avatar">${third?.avatar||'👤'}</div>
            <div class="podium-name">${U.esc(third?.name||'')}</div>
            <div class="podium-val">${this._val(third)}</div>
            <div class="podium-block podium-block--3rd">3</div>
          </div>
        </div>`;
    }
    // List (4-10)
    const list=U.$('lb-list'); if(list){
      list.innerHTML=sorted.slice(3).map((u,i)=>`
        <div class="lb-row glass-card">
          <span class="lb-rank">${i+4}</span>
          <span class="lb-avatar">${u.avatar}</span>
          <div class="lb-info"><strong>${U.esc(u.name)}</strong><span>${U.esc(u.level)}</span></div>
          <span class="lb-val">${this._val(u)}</span>
        </div>`).join('');
    }
    // Your rank
    const yours=U.$('lb-your-rank'); if(yours){
      const gs=Gami.s;
      yours.innerHTML=`
        <span class="lb-you-label">Your Rank</span>
        <span class="lb-you-avatar">🎓</span>
        <div class="lb-info"><strong>You</strong><span>${CFG.LEVELS[gs.level]?.name||'Freshman'}</span></div>
        <span class="lb-val">${this.mode==='xp'?gs.xp+' XP':this.mode==='streak'?gs.streak+'🔥':gs.solved}</span>`;
    }
  },

  _val(u){ if(!u)return'—'; return this.mode==='xp'?u.xp+' XP':this.mode==='streak'?u.streak+'🔥':u.solved+' solved'; },

  _renderCommLB(){
    const lb=U.$('comm-lb'); if(!lb)return;
    lb.innerHTML=CFG.LEADERBOARD.slice(0,5).map((u,i)=>`
      <div class="lb-mini-row">
        <span class="lb-mini-rank">${i+1}</span>
        <span>${u.avatar}</span>
        <span class="lb-mini-name">${U.esc(u.name)}</span>
        <span class="lb-mini-xp">${u.xp} XP</span>
      </div>`).join('');
  },
};

// ── Community ─────────────────────────────────────────────
const Community = {
  init(){
    U.$('comm-post-btn')?.addEventListener('click',()=>this.post());
    U.$$('.sg-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        U.toast(`Joined ${btn.textContent} study group!`,'success');
        btn.classList.toggle('sg-btn--active');
      });
    });
  },

  async post(){
    const text=U.$('comm-input')?.value.trim();
    if(!text){U.toast('Write your problem first','error');return;}
    const btn=U.$('comm-post-btn');
    btn.textContent='Getting answers…'; btn.disabled=true;
    try{
      const r=await fetch(`${CFG.API}/community-solve`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({problem:text}),
      });
      const d=await r.json();
      this.renderFeed(d,text);
      Gami.recordCommunity();
      U.$('comm-input').value='';
      U.toast('+30 XP for community post!','xp');
    }catch(e){U.toast('Error: '+e.message,'error');}
    btn.textContent='Post to Community'; btn.disabled=false;
  },

  renderFeed(data,problem){
    const feed=U.$('comm-feed'); if(!feed)return;
    feed.innerHTML=`
      <div class="comm-problem-card glass-card">
        <span class="comm-anon-label">Anonymous · just now</span>
        <p>${U.esc(problem)}</p>
      </div>
      <div class="ai-synthesis-card glass-card">
        <div class="ai-syn-head"><span class="ai-syn-star">✦</span><strong>AI Synthesis</strong></div>
        <p>${U.esc(data.aiSynthesis||'')}</p>
      </div>
      <h4 class="comm-answers-title">Community Perspectives</h4>
      ${(data.solutions||[]).map((s,i)=>`
        <div class="comm-answer-card glass-card" style="animation-delay:${i*0.1}s">
          <div class="comm-ans-head">
            <span class="comm-ans-avatar">${s.avatar}</span>
            <div><strong>${U.esc(s.name)}</strong><span class="comm-ans-level">${U.esc(s.level)}</span></div>
            <span class="comm-ans-badge">${U.esc(s.badge)}</span>
            <span class="comm-ans-votes">▲ ${s.upvotes}</span>
          </div>
          <p>${U.esc(s.solution)}</p>
        </div>`).join('')}`;
    requestAnimationFrame(()=>{
      feed.querySelectorAll('.comm-answer-card').forEach((el,i)=>{
        setTimeout(()=>el.classList.add('comm-ans--in'),i*80);
      });
    });
  },
};

// ── Command Palette Search ────────────────────────────────
const Search = {
  commands: [
    { label:'Go to Dashboard',       icon:'🏠', action:()=>App.showScreen('dashboard') },
    { label:'Go to AI Solver',        icon:'✦', action:()=>App.showScreen('solver')    },
    { label:'Go to Study Tools',      icon:'🛠', action:()=>App.showScreen('tools')    },
    { label:'Go to Planner',          icon:'📅', action:()=>App.showScreen('planner')  },
    { label:'Go to Leaderboard',      icon:'🏆', action:()=>App.showScreen('leaderboard') },
    { label:'Go to Community',        icon:'👥', action:()=>App.showScreen('community') },
    { label:'Go to Profile',          icon:'👤', action:()=>App.showScreen('profile')  },
    { label:'Start Pomodoro Timer',   icon:'🍅', action:()=>{ App.showScreen('tools'); setTimeout(()=>{ U.$$('.tools-tab').forEach(t=>t.classList.remove('active')); U.$$('.tool-pane').forEach(p=>p.classList.remove('active')); document.querySelector('.tools-tab[data-tool="pomodoro"]')?.classList.add('active'); U.$('tool-pomodoro')?.classList.add('active'); },100); } },
    { label:'Generate Flashcards',    icon:'🃏', action:()=>{ App.showScreen('tools'); setTimeout(()=>{ document.querySelector('.tools-tab[data-tool="flashcards"]')?.click(); },100); } },
    { label:'Take a Quiz',            icon:'📝', action:()=>{ App.showScreen('tools'); setTimeout(()=>{ document.querySelector('.tools-tab[data-tool="quiz"]')?.click(); },100); } },
    { label:'Check Burnout Level',    icon:'🧠', action:()=>{ App.showScreen('tools'); setTimeout(()=>{ document.querySelector('.tools-tab[data-tool="burnout"]')?.click(); },100); } },
    { label:'Budget Planner',         icon:'💸', action:()=>{ App.showScreen('tools'); setTimeout(()=>{ document.querySelector('.tools-tab[data-tool="budget"]')?.click(); },100); } },
    { label:'Toggle Theme',           icon:'🌙', action:()=>App.toggleTheme() },
    { label:'Emergency Study Mode',   icon:'🚨', action:()=>{ App.showScreen('solver'); setTimeout(()=>{ document.querySelector('.smode-btn[data-mode="emergency"]')?.click(); },100); } },
  ],

  init(){
    U.$('nav-search-btn')?.addEventListener('click',()=>this.open());
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='k'){e.preventDefault();this.open();}
      if(e.key==='Escape') this.close();
    });
    U.$('cmd-bg')?.addEventListener('click',e=>{ if(e.target===U.$('cmd-bg'))this.close(); });
    U.$('cmd-input')?.addEventListener('input',()=>this.filter());
  },

  open(){
    U.$('cmd-bg')?.classList.remove('hidden');
    U.$('cmd-input')?.focus();
    this.filter();
  },

  close(){
    U.$('cmd-bg')?.classList.add('hidden');
    if(U.$('cmd-input')) U.$('cmd-input').value='';
  },

  filter(){
    const q=(U.$('cmd-input')?.value||'').toLowerCase();
    const hist=U.load('history',[]).slice(0,3);
    const results=[
      ...this.commands.filter(c=>c.label.toLowerCase().includes(q)||q===''),
      ...(q===''?hist.map(h=>({label:`Revisit: ${h.problem}`,icon:U.catIcon(h.category),action:()=>{ App.showScreen('solver'); setTimeout(()=>{ U.$('solver-input').value=h.problem; },100); }})):[] ),
    ];
    const wrap=U.$('cmd-results'); if(!wrap)return;
    wrap.innerHTML=results.slice(0,8).map((r,i)=>`
      <div class="cmd-result" tabindex="0" onclick="Search._run(${i})">
        <span class="cmd-result-icon">${r.icon}</span>
        <span>${U.esc(r.label)}</span>
      </div>`).join('');
    this._results=results;
  },

  _run(i){
    const r=this._results[i]; if(!r)return;
    r.action(); this.close();
  },
};
