const Solver = {
  profile: null,
  currentMode: 'quickfix',
  currentSolveMode: 'normal',
  lastSolution: null,
  lastProblem: '',
  saved: [],

  init(){
    this.saved = U.load('saved_solutions',[]);
    this._bindModes();
    this._bindSolveModes();
    this._bindSolveBtn();
    this._bindHeroSolve();
  },

  _bindModes(){
    U.$$('.smode-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        U.$$('.smode-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode=btn.dataset.mode;
        const em=U.$('em-extras');
        if(em) em.classList.toggle('hidden', this.currentMode!=='emergency');
      });
    });
  },

  _bindSolveModes(){
    U.$$('.ssr-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        U.$$('.ssr-btn').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        this.currentSolveMode=btn.dataset.solveMode;
      });
    });
  },

  _bindSolveBtn(){
    U.$('solve-main-btn')?.addEventListener('click',()=>{
      const text=U.$('solver-input')?.value.trim();
      if(!text){U.toast('Describe your problem first','error');return;}
      this.run(text, this.currentMode, this.currentSolveMode);
    });
    U.$('solver-input')?.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();U.$('solve-main-btn')?.click();}
    });
  },

  _bindHeroSolve(){
    U.$('hero-solve-btn')?.addEventListener('click',()=>{
      const text=U.$('hero-input')?.value.trim();
      if(!text){U.toast('Type a problem first','error');return;}
      const mode=document.querySelector('.mode-pill.active')?.dataset.mode||'quickfix';
      App.showScreen('solver');
      setTimeout(()=>{
        const inp=U.$('solver-input'); if(inp)inp.value=text;
        this.run(text, mode, 'normal');
      },150);
    });
    U.$('hero-input')?.addEventListener('keydown',e=>{
      if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();U.$('hero-solve-btn')?.click();}
    });
    U.$$('.mode-pill').forEach(p=>{
      p.addEventListener('click',()=>{
        U.$$('.mode-pill').forEach(x=>x.classList.remove('active'));
        p.classList.add('active');
      });
    });
  },

  async run(problem, mode, solveMode='normal'){
    this.lastProblem=problem;
    this._setLoading(true);
    this._showPlaceholder(false);

    const extraContext = mode==='emergency'?{
      subject: U.$('em-subject')?.value||'General',
      hours:   U.$('em-hours')?.value||6,
      examWeight: U.$('em-weight')?.value||40,
    }:null;

    try{
      const r=await fetch(`${CFG.API}/solve`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({problem,mode,profile:this.profile,extraContext,solveMode}),
      });
      if(!r.ok)throw new Error('Server error');
      const data=await r.json();
      this.lastSolution={data,mode};
      this._renderSolution(data,mode);
      Gami.recordSolve(mode);
      this._addToHistory(problem,mode,data);
    }catch(e){
      this._showError(e.message);
    }
    this._setLoading(false);
  },

  _setLoading(on){
    U.$('smb-text')?.classList.toggle('hidden',on);
    U.$('smb-loading')?.classList.toggle('hidden',!on);
    const btn=U.$('solve-main-btn'); if(btn)btn.disabled=on;
  },

  _showPlaceholder(show){
    U.$('solution-placeholder')?.classList.toggle('hidden',!show);
    U.$('solution-output')?.classList.toggle('hidden',show);
  },

  _renderSolution(data, mode){
    const out=U.$('solution-output'); if(!out)return;
    out.classList.remove('hidden');
    if(mode==='emergency') out.innerHTML=this._tmplEmergency(data);
    else if(mode==='deepdive') out.innerHTML=this._tmplDeepDive(data);
    else out.innerHTML=this._tmplQuickFix(data);

    // Animate steps
    requestAnimationFrame(()=>{
      out.querySelectorAll('.step-row,.sched-row').forEach((el,i)=>{
        setTimeout(()=>el.classList.add('step--in'),i*70);
      });
      setTimeout(()=>out.querySelectorAll('.prob-fill').forEach(f=>f.classList.add('prob-fill--on')),400);
    });
    out.scrollIntoView({behavior:'smooth',block:'nearest'});
  },

  _tmplQuickFix(d){
    return `
    <div class="sol-card glass-card">
      <div class="sol-header">
        <span class="sol-cat-pill" style="background:${U.catColor(d.category)}22;color:${U.catColor(d.category)};border-color:${U.catColor(d.category)}44">${U.catIcon(d.category)} ${d.category||'General'}</span>
        <span class="sol-severity" style="color:${U.severityColor(d.severity)}">${{low:'✅ Low',medium:'⚠️ Medium',high:'🔴 High',critical:'🚨 Critical'}[d.severity]||d.severity}</span>
        <button class="sol-save-star" title="Save solution" onclick="Solver.saveSolution()">★</button>
      </div>
      <div class="sol-section"><div class="sol-sec-icon">🔍</div><div><h4>Diagnosis</h4><p>${U.esc(d.diagnosis)}</p></div></div>
      <div class="sol-section sol-section--tinted"><div class="sol-sec-icon">🎯</div><div><h4>Root Cause</h4><p>${U.esc(d.rootCause)}</p></div></div>
      ${d.quickWin?`<div class="sol-quickwin"><span class="qw-label">⚡ Do this right now</span><p>${U.esc(d.quickWin)}</p></div>`:''}
      <div class="sol-action-plan"><h4>📋 Action Plan</h4><div class="steps-list">
        ${(d.actionPlan||[]).map((s,i)=>`<div class="step-row glass-card"><div class="step-num">${i+1}</div><div><div class="step-when">${U.esc(s.when||'')}${s.duration?` · ${U.esc(s.duration)}`:''}</div><div class="step-action">${U.esc(s.action)}</div></div></div>`).join('')}
      </div></div>
      ${d.resources?.length?`<div class="sol-resources"><h4>🔗 Resources</h4><div class="res-tags">${d.resources.map(r=>`<span class="res-tag">${U.esc(r)}</span>`).join('')}</div></div>`:''}
      <div class="sol-prob"><div class="sol-prob-label"><span>Success Probability</span><strong>${d.successProbability||75}%</strong></div><div class="prob-bar"><div class="prob-fill" style="--w:${d.successProbability||75}%"></div></div></div>
      ${d.encouragement?`<div class="sol-encourage">💬 <em>${U.esc(d.encouragement)}</em></div>`:''}
      <div class="sol-footer-btns">
        <button class="sol-done-btn glow-btn" onclick="Solver.markDone()">✓ Mark Solved</button>
        <button class="sol-share-btn" onclick="Solver.share()">↗ Share</button>
        <button class="sol-save-btn-small" onclick="Solver.saveSolution()">★ Save</button>
      </div>
    </div>`;
  },

  _tmplDeepDive(d){
    return `
    <div class="sol-card glass-card">
      <div class="sol-header"><span class="sol-cat-pill" style="background:rgba(108,71,255,0.15);color:var(--purple);border-color:rgba(108,71,255,0.3)">🔍 Deep Dive</span><span class="sol-severity" style="color:${U.severityColor(d.severity)}">${{low:'✅ Low',medium:'⚠️ Medium',high:'🔴 High',critical:'🚨 Critical'}[d.severity]||d.severity}</span><button class="sol-save-star" onclick="Solver.saveSolution()">★</button></div>
      <div class="sol-section"><div class="sol-sec-icon">🧠</div><div><h4>Full Diagnosis</h4><p>${U.esc(d.diagnosis)}</p></div></div>
      ${d.rootCauses?.length?`<div class="sol-section sol-section--tinted"><div class="sol-sec-icon">🎯</div><div><h4>Root Causes</h4><ul class="cause-list">${d.rootCauses.map(c=>`<li>${U.esc(c)}</li>`).join('')}</ul></div></div>`:''}
      <div class="sol-action-plan"><h4>📋 Strategic Plan</h4><div class="steps-list">
        ${(d.actionPlan||[]).map((s,i)=>`<div class="step-row glass-card"><div class="step-num">${i+1}</div><div><div class="step-when">${U.esc(s.when||'')}${s.duration?` · ${U.esc(s.duration)}`:''}</div><div class="step-action">${U.esc(s.action)}</div>${s.why?`<div class="step-why">${U.esc(s.why)}</div>`:''}</div></div>`).join('')}
      </div></div>
      ${d.quickWins?.length?`<div class="sol-quickwin"><span class="qw-label">⚡ Quick wins</span><ul>${d.quickWins.map(w=>`<li>${U.esc(w)}</li>`).join('')}</ul></div>`:''}
      ${d.avoidMistakes?.length?`<div class="sol-avoid"><h4>⛔ Avoid These</h4><ul>${d.avoidMistakes.map(m=>`<li>${U.esc(m)}</li>`).join('')}</ul></div>`:''}
      <div class="sol-prob"><div class="sol-prob-label"><span>Success Probability</span><strong>${d.successProbability||80}%</strong></div><div class="prob-bar"><div class="prob-fill" style="--w:${d.successProbability||80}%"></div></div></div>
      ${d.encouragement?`<div class="sol-encourage">💬 <em>${U.esc(d.encouragement)}</em></div>`:''}
      <div class="sol-footer-btns"><button class="sol-done-btn glow-btn" onclick="Solver.markDone()">✓ Mark Solved</button><button class="sol-share-btn" onclick="Solver.share()">↗ Share</button></div>
    </div>`;
  },

  _tmplEmergency(d){
    const tc={study:'var(--purple)',break:'var(--emerald)',review:'var(--amber)',sleep:'var(--cyan)'};
    const ti={study:'📖',break:'☕',review:'📝',sleep:'😴'};
    return `
    <div class="sol-card glass-card">
      <div class="sol-em-header"><span class="em-badge">🚨 EMERGENCY MODE</span><p>${U.esc(d.diagnosis)}</p></div>
      ${d.mustKnow?.length?`<div class="sol-quickwin sol-quickwin--red"><span class="qw-label" style="color:var(--red)">🔥 Must-Know Topics</span><div class="res-tags">${d.mustKnow.map(t=>`<span class="res-tag res-tag--red">${U.esc(t)}</span>`).join('')}</div></div>`:''}
      ${d.skipTopics?.length?`<div class="sol-avoid"><h4>⏭ Skip These</h4><div class="res-tags">${d.skipTopics.map(t=>`<span class="res-tag">${U.esc(t)}</span>`).join('')}</div></div>`:''}
      <div class="schedule-wrap"><h4>⏱ Your Schedule</h4>
        ${(d.schedule||[]).map((s,i)=>`<div class="sched-row" style="--tc:${tc[s.type]||'var(--purple)'}"><div class="sched-time"><span>${U.esc(s.time)}</span><small>${U.esc(s.duration)}</small></div><div class="sched-dot"></div><div class="sched-body"><span>${ti[s.type]||'📖'}</span><span>${U.esc(s.task)}</span>${s.priority==='high'?'<span class="sched-hi">HIGH</span>':''}</div></div>`).join('')}
      </div>
      ${d.successTip?`<div class="sol-quickwin"><span class="qw-label">💡 Power Tip</span><p>${U.esc(d.successTip)}</p></div>`:''}
      <div class="sol-prob"><div class="sol-prob-label"><span>Pass Probability</span><strong>${d.successProbability||75}%</strong></div><div class="prob-bar"><div class="prob-fill prob-fill--em" style="--w:${d.successProbability||75}%"></div></div></div>
      <div class="sol-footer-btns"><button class="sol-done-btn glow-btn" onclick="Solver.markDone()">✓ Done — Mark Solved</button></div>
    </div>`;
  },

  _showError(msg){
    const out=U.$('solution-output'); if(!out)return;
    out.classList.remove('hidden');
    out.innerHTML=`<div class="sol-error glass-card"><h3>⚠️ Connection Error</h3><p>${U.esc(msg)}</p><p>Make sure the server is running: <code>npm start</code></p><button class="glow-btn" onclick="U.$('solve-main-btn').click()">Retry</button></div>`;
  },

  markDone(){
    const btn=document.querySelector('.sol-done-btn');
    if(btn){btn.textContent='🎉 Solved!';btn.style.background='var(--emerald)';btn.disabled=true;}
    U.toast('Problem solved! +XP awarded','success');
  },

  share(){
    const text=`Solved a student problem with StudySync AI! 🎓\n"${this.lastProblem}"\nstudysync.app`;
    if(navigator.share) navigator.share({title:'StudySync',text});
    else{ navigator.clipboard?.writeText(text); U.toast('Copied to clipboard!','success'); }
  },

  saveSolution(){
    if(!this.lastSolution)return;
    const item={id:Date.now(),problem:this.lastProblem.slice(0,80),mode:this.lastSolution.mode,ts:Date.now()};
    this.saved.unshift(item); if(this.saved.length>20)this.saved.pop();
    U.save('saved_solutions',this.saved);
    U.toast('★ Solution saved to profile','success');
    this._renderSaved();
  },

  _renderSaved(){
    const list=U.$('saved-list'); if(!list)return;
    if(!this.saved.length){list.innerHTML='<p class="empty-state-sm">No saved items yet.</p>';return;}
    list.innerHTML=this.saved.map(s=>`<div class="saved-item glass-card"><span class="saved-mode">${s.mode}</span><p>${U.esc(s.problem)}</p><span class="saved-time">${U.timeAgo(s.ts)}</span></div>`).join('');
  },

  _addToHistory(problem,mode,data){
    let hist=U.load('history',[]);
    hist.unshift({id:Date.now(),problem:problem.slice(0,80),mode,category:data.category||'general',ts:Date.now(),solved:false});
    if(hist.length>50)hist=hist.slice(0,50);
    U.save('history',hist);
    App.renderActivity();
  },
};
