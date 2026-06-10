const App = {
  profile: null,
  currentScreen: 'dashboard',

  init(){
    const saved=U.load('profile2',null);
    if(saved){ this.profile=saved; this._launch(); }
    else this._initOnboarding();
  },

  _initOnboarding(){
    const p={level:'',field:'',struggles:[]};
    U.$$('#ob-1 .ob-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        p.level=btn.dataset.val;
        U.$$('#ob-1 .ob-opt').forEach(b=>b.classList.remove('ob-opt--sel'));
        btn.classList.add('ob-opt--sel');
        setTimeout(()=>this._obGo(2),320);
      });
    });
    U.$$('#ob-2 .ob-opt--multi').forEach(btn=>{
      btn.addEventListener('click',()=>{
        btn.classList.toggle('ob-opt--sel');
        const val=btn.dataset.val;
        btn.classList.contains('ob-opt--sel')?p.struggles.push(val):p.struggles.splice(p.struggles.indexOf(val),1);
      });
    });
    U.$('ob-continue-2')?.addEventListener('click',()=>{
      if(!p.struggles.length){U.toast('Pick at least one','error');return;}
      this._obGo(3);
    });
    U.$$('#ob-3 .ob-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        p.field=btn.dataset.val;
        U.$$('#ob-3 .ob-opt').forEach(b=>b.classList.remove('ob-opt--sel'));
        btn.classList.add('ob-opt--sel');
        setTimeout(()=>{ U.save('profile2',p); this.profile=p; this._launch(); },350);
      });
    });
  },

  _obGo(step){
    U.$$('.ob-step').forEach(s=>s.classList.remove('active'));
    U.$('ob-'+step)?.classList.add('active');
  },

  _launch(){
    const ob=U.$('onboarding');
    const app=U.$('app');
    if(ob) ob.style.display='none';
    if(app){ app.classList.remove('hidden'); app.style.opacity='0'; requestAnimationFrame(()=>{ app.style.transition='opacity 0.5s ease'; app.style.opacity='1'; }); }

    // Load theme
    const theme=U.load('theme','dark');
    document.documentElement.setAttribute('data-theme',theme);

    Solver.profile=this.profile;
    Gami.init();
    Solver.init();
    Tools.init();
    Planner.init();
    LB.init();
    Community.init();
    Search.init();
    this._bindNav();
    this._bindMobileNav();
    this._bindQuickActions();
    this._bindCatCards();
    this._bindProfile();
    this._bindHamburger();
    this._bindTheme();
    this._bindLevelUp();
    U.$('dash-greeting').textContent=`${U.greeting()} 👋`;
    this.renderActivity();
    Solver._renderSaved();
  },

  // ── Navigation ────────────────────────────────────────────
  _bindNav(){
    // Desktop nav
    U.$$('.nav-link').forEach(link=>{
      link.addEventListener('click',()=>this.showScreen(link.dataset.screen));
    });
    // Avatar
    U.$('nav-avatar-btn')?.addEventListener('click',()=>this.showScreen('profile'));
    // Logo
    U.$('nav-logo-btn')?.addEventListener('click',()=>this.showScreen('dashboard'));
    // Build mobile drawer nav
    const drawerNav=U.$('drawer-nav'); if(drawerNav){
      const items=[
        {screen:'dashboard',icon:'🏠',label:'Dashboard'},
        {screen:'solver',   icon:'✦', label:'AI Solver'},
        {screen:'tools',    icon:'🛠', label:'Study Tools'},
        {screen:'planner',  icon:'📅', label:'Planner'},
        {screen:'leaderboard',icon:'🏆',label:'Leaderboard'},
        {screen:'community',icon:'👥', label:'Community'},
        {screen:'profile',  icon:'👤', label:'Profile'},
      ];
      drawerNav.innerHTML=items.map(it=>`<button class="drawer-link" data-screen="${it.screen}"><span>${it.icon}</span>${it.label}</button>`).join('');
      drawerNav.querySelectorAll('.drawer-link').forEach(btn=>{
        btn.addEventListener('click',()=>{ this.showScreen(btn.dataset.screen); this._closeDrawer(); });
      });
    }
  },

  _bindMobileNav(){
    U.$$('.bn-btn').forEach(btn=>{
      btn.addEventListener('click',()=>this.showScreen(btn.dataset.screen));
    });
  },

  showScreen(name){
    this.currentScreen=name;
    U.$$('.screen').forEach(s=>s.classList.remove('active'));
    U.$$('.nav-link').forEach(l=>l.classList.remove('active'));
    U.$$('.bn-btn').forEach(b=>b.classList.remove('active'));
    U.$$('.drawer-link').forEach(l=>l.classList.remove('active'));
    U.$(`screen-${name}`)?.classList.add('active');
    document.querySelector(`.nav-link[data-screen="${name}"]`)?.classList.add('active');
    document.querySelector(`.bn-btn[data-screen="${name}"]`)?.classList.add('active');
    document.querySelector(`.drawer-link[data-screen="${name}"]`)?.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    // Re-render leaderboard when visited
    if(name==='leaderboard') LB.render();
  },

  // ── Quick actions ─────────────────────────────────────────
  _bindQuickActions(){
    U.$$('.qa-card[data-screen]').forEach(btn=>{
      btn.addEventListener('click',()=>this.showScreen(btn.dataset.screen));
    });
    U.$('[data-action="flashcards"]')?.addEventListener('click',()=>{
      this.showScreen('tools');
      setTimeout(()=>document.querySelector('.tools-tab[data-tool="flashcards"]')?.click(),150);
    });
    U.$('[data-action="quiz"]')?.addEventListener('click',()=>{
      this.showScreen('tools');
      setTimeout(()=>document.querySelector('.tools-tab[data-tool="quiz"]')?.click(),150);
    });
  },

  // ── Category cards ────────────────────────────────────────
  _bindCatCards(){
    const prompts={
      academic:'I am struggling with understanding my coursework and keeping up academically.',
      time:'I have too many deadlines and cannot manage my time effectively.',
      finance:'I am struggling financially and need help managing my student budget.',
      mental:'I am feeling overwhelmed, burned out and mentally exhausted from studying.',
      career:'I don\'t know what career to pursue after graduation and feel completely lost.',
      social:'I am having serious trouble with group projects and social situations at university.',
    };
    U.$$('.cat-glass-card').forEach(card=>{
      card.addEventListener('click',()=>{
        this.showScreen('solver');
        setTimeout(()=>{ const inp=U.$('solver-input'); if(inp){ inp.value=prompts[card.dataset.cat]||''; inp.focus(); } },150);
      });
    });
  },

  // ── Profile settings ──────────────────────────────────────
  _bindProfile(){
    U.$$('.theme-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        U.$$('.theme-opt').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this._setTheme(btn.dataset.theme);
      });
    });
    U.$('reset-btn')?.addEventListener('click',()=>{
      if(confirm('Reset ALL progress? This cannot be undone.')){
        ['gami2','profile2','history','saved_solutions','deadlines2','theme'].forEach(k=>localStorage.removeItem('ss2_'+k));
        location.reload();
      }
    });
  },

  _bindTheme(){
    U.$('theme-btn')?.addEventListener('click',()=>{
      const current=document.documentElement.getAttribute('data-theme');
      this._setTheme(current==='dark'?'light':'dark');
    });
  },

  _setTheme(theme){
    document.documentElement.setAttribute('data-theme',theme);
    U.save('theme',theme);
    // Sync settings buttons
    U.$$('.theme-opt').forEach(b=>{
      b.classList.toggle('active',b.dataset.theme===theme);
    });
  },

  toggleTheme(){
    const t=document.documentElement.getAttribute('data-theme');
    this._setTheme(t==='dark'?'light':'dark');
  },

  // ── Hamburger ─────────────────────────────────────────────
  _bindHamburger(){
    U.$('hamburger')?.addEventListener('click',()=>this._openDrawer());
    U.$('drawer-close')?.addEventListener('click',()=>this._closeDrawer());
    U.$('drawer-overlay')?.addEventListener('click',()=>this._closeDrawer());
  },

  _openDrawer(){
    U.$('mobile-drawer')?.classList.add('mobile-drawer--open');
    U.$('drawer-overlay')?.classList.remove('hidden');
    document.body.style.overflow='hidden';
  },

  _closeDrawer(){
    U.$('mobile-drawer')?.classList.remove('mobile-drawer--open');
    U.$('drawer-overlay')?.classList.add('hidden');
    document.body.style.overflow='';
  },

  // ── Level up ──────────────────────────────────────────────
  _bindLevelUp(){
    U.$('levelup-close')?.addEventListener('click',()=>U.$('levelup-screen')?.classList.add('hidden'));
  },

  // ── Activity feed ─────────────────────────────────────────
  renderActivity(){
    const list=U.$('recent-activity'); if(!list)return;
    const hist=U.load('history',[]).slice(0,5);
    if(!hist.length){ list.innerHTML='<div class="activity-empty glass-card"><p>No activity yet. Solve your first problem!</p></div>'; return; }
    list.innerHTML=hist.map(h=>`
      <div class="activity-item glass-card" onclick="App._revisit('${U.esc(h.problem)}')">
        <span class="act-icon">${U.catIcon(h.category)}</span>
        <div class="act-body">
          <p class="act-problem">${U.esc(h.problem)}</p>
          <span class="act-meta">${h.mode} · ${U.timeAgo(h.ts)}</span>
        </div>
        <span class="act-solved ${h.solved?'act-solved--done':''}">${h.solved?'✓':'···'}</span>
      </div>`).join('');
  },

  _revisit(problem){
    this.showScreen('solver');
    setTimeout(()=>{ const inp=U.$('solver-input'); if(inp){ inp.value=problem; inp.focus(); } },150);
  },
};

document.addEventListener('DOMContentLoaded',()=>App.init());
