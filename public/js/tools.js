const Tools = {
  // ── Pomodoro ──────────────────────────────────────────────
  pom: { timer:null, secs:25*60, running:false, session:1, isBreak:false, studyMin:0 },

  initPomodoro(){
    this._pomRender();
    U.$('pom-start')?.addEventListener('click',()=>this._pomToggle());
    U.$('pom-reset')?.addEventListener('click',()=>this._pomReset());
  },

  _pomToggle(){
    if(this.pom.running){
      clearInterval(this.pom.timer); this.pom.running=false;
      U.$('pom-start').textContent='▶ Resume';
    } else {
      this.pom.running=true;
      U.$('pom-start').textContent='⏸ Pause';
      this.pom.timer=setInterval(()=>this._pomTick(),1000);
      Gami.recordTool('pomodoro');
    }
  },

  _pomTick(){
    this.pom.secs--;
    if(!this.pom.isBreak) this.pom.studyMin=Math.round((25*60-this.pom.secs)/60);
    this._pomRender();
    if(this.pom.secs<=0){
      clearInterval(this.pom.timer); this.pom.running=false;
      if(!this.pom.isBreak){
        this.pom.session++; this.pom.isBreak=true;
        this.pom.secs=this.pom.session%4===0?15*60:5*60;
        U.toast('🍅 Focus session complete! Take a break.','success');
        Gami.recordTool('pomodoro');
      } else {
        this.pom.isBreak=false; this.pom.secs=25*60;
        U.toast('☕ Break over — back to focus!','info');
      }
      U.$('pom-start').textContent='▶ Start';
      this._pomRender();
    }
  },

  _pomReset(){
    clearInterval(this.pom.timer);
    this.pom={timer:null,secs:25*60,running:false,session:1,isBreak:false,studyMin:0};
    U.$('pom-start').textContent='▶ Start';
    this._pomRender();
  },

  _pomRender(){
    const m=Math.floor(this.pom.secs/60).toString().padStart(2,'0');
    const s=(this.pom.secs%60).toString().padStart(2,'0');
    const el=U.$('pom-time'); if(el) el.textContent=`${m}:${s}`;
    const lbl=U.$('pom-label'); if(lbl) lbl.textContent=this.pom.isBreak?'☕ Break':'🍅 Focus';
    const sn=U.$('pom-snum'); if(sn) sn.textContent=this.pom.session;
    const td=U.$('pom-today'); if(td) td.textContent=this.pom.studyMin+' min';
    // Ring
    const ring=U.$('pom-ring-fill');
    if(ring){
      const total=this.pom.isBreak?(this.pom.session%4===0?15*60:5*60):25*60;
      const pct=this.pom.secs/total;
      const circ=2*Math.PI*54;
      ring.style.strokeDasharray=circ;
      ring.style.strokeDashoffset=circ*pct;
      ring.style.stroke=this.pom.isBreak?'var(--emerald)':'var(--purple)';
    }
    // Session dots
    const dots=U.$('pom-session-dots');
    if(dots){
      dots.innerHTML='';
      for(let i=1;i<=4;i++){
        const d=document.createElement('span');
        d.className='pom-dot'+(i<this.pom.session?' pom-dot--done':i===this.pom.session?' pom-dot--active':'');
        dots.appendChild(d);
      }
    }
  },

  // ── Flashcards ────────────────────────────────────────────
  fc: { cards:[], idx:0, flipped:false, mastered:[] },

  initFlashcards(){
    U.$('fc-generate-btn')?.addEventListener('click',()=>this._fcGenerate());
    U.$('fc-flip')?.addEventListener('click',()=>this._fcFlip());
    U.$('fc-next')?.addEventListener('click',()=>this._fcNext());
    U.$('fc-prev')?.addEventListener('click',()=>this._fcPrev());
    U.$('fc-know')?.addEventListener('click',()=>this._fcKnow());
  },

  async _fcGenerate(){
    const topic=U.$('fc-topic')?.value.trim();
    if(!topic){U.toast('Enter a topic first','error');return;}
    const btn=U.$('fc-generate-btn');
    btn.textContent='Generating…'; btn.disabled=true;
    try{
      const r=await fetch(`${CFG.API}/flashcards`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({topic,notes:U.$('fc-notes')?.value||''}),
      });
      const d=await r.json();
      this.fc.cards=d.flashcards||[];
      this.fc.idx=0; this.fc.flipped=false; this.fc.mastered=[];
      U.$('fc-deck')?.classList.remove('hidden');
      this._fcRender();
      Gami.recordTool('flashcard');
      U.toast(`${this.fc.cards.length} flashcards generated!`,'success');
    }catch(e){ U.toast('Error: '+e.message,'error'); }
    btn.textContent='🃏 Generate Flashcards'; btn.disabled=false;
  },

  _fcRender(){
    const card=this.fc.cards[this.fc.idx];
    if(!card)return;
    const front=U.$('fc-front'); const back=U.$('fc-back');
    if(front) front.textContent=card.front;
    if(back)  back.textContent=card.back;
    const fcCard=U.$('fc-card');
    if(fcCard) fcCard.classList.toggle('fc-card--flipped',this.fc.flipped);
    if(front) front.classList.toggle('hidden',this.fc.flipped);
    if(back)  back.classList.toggle('hidden',!this.fc.flipped);
    const counter=U.$('fc-counter'); if(counter) counter.textContent=`${this.fc.idx+1} / ${this.fc.cards.length}`;
    const pct=Math.round((this.fc.mastered.length/this.fc.cards.length)*100);
    const pfill=U.$('fc-prog-fill'); if(pfill) pfill.style.width=pct+'%';
    const mast=U.$('fc-mastery'); if(mast) mast.textContent=pct+'% mastered';
  },

  _fcFlip(){
    this.fc.flipped=!this.fc.flipped;
    const fcCard=U.$('fc-card');
    if(fcCard) fcCard.classList.toggle('fc-card--flipped',this.fc.flipped);
    const front=U.$('fc-front'); const back=U.$('fc-back');
    if(front) front.classList.toggle('hidden',this.fc.flipped);
    if(back)  back.classList.toggle('hidden',!this.fc.flipped);
    Gami.recordFlashcard();
  },

  _fcNext(){
    if(this.fc.idx<this.fc.cards.length-1){
      this.fc.idx++; this.fc.flipped=false; this._fcRender();
    } else { U.toast('End of deck!','info'); }
  },

  _fcPrev(){
    if(this.fc.idx>0){ this.fc.idx--; this.fc.flipped=false; this._fcRender(); }
  },

  _fcKnow(){
    if(!this.fc.mastered.includes(this.fc.idx)) this.fc.mastered.push(this.fc.idx);
    this._fcRender();
    U.toast('Marked as mastered ✓','success');
    if(this.fc.mastered.length===this.fc.cards.length) U.toast('🎉 Deck complete! All mastered!','success');
    else this._fcNext();
  },

  // ── Quiz ──────────────────────────────────────────────────
  quiz: { questions:[], current:0, answers:{}, done:false },

  initQuiz(){
    U.$('quiz-generate-btn')?.addEventListener('click',()=>this._quizGenerate());
  },

  async _quizGenerate(){
    const topic=U.$('quiz-topic')?.value.trim();
    if(!topic){U.toast('Enter a topic first','error');return;}
    const diff=U.$('quiz-diff')?.value||'medium';
    const count=parseInt(U.$('quiz-count')?.value)||5;
    const btn=U.$('quiz-generate-btn');
    btn.textContent='Generating…'; btn.disabled=true;
    try{
      const r=await fetch(`${CFG.API}/quiz`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({topic,difficulty:diff,count}),
      });
      const d=await r.json();
      this.quiz={questions:d.questions||[],current:0,answers:{},done:false};
      U.$('quiz-setup')?.classList.add('hidden');
      U.$('quiz-active')?.classList.remove('hidden');
      this._quizRender();
      Gami.recordTool('quiz');
    }catch(e){ U.toast('Error: '+e.message,'error'); }
    btn.textContent='📝 Generate Quiz'; btn.disabled=false;
  },

  _quizRender(){
    const wrap=U.$('quiz-active'); if(!wrap)return;
    const q=this.quiz.questions[this.quiz.current]; if(!q)return;
    const pct=Math.round((this.quiz.current/this.quiz.questions.length)*100);
    const opts = q.options || (q.type==='truefalse'?['True','False']:['Answer']);

    wrap.innerHTML=`
      <div class="quiz-card glass-card">
        <div class="quiz-top">
          <span class="quiz-num">Question ${this.quiz.current+1}/${this.quiz.questions.length}</span>
          <span class="quiz-diff-badge quiz-diff-badge--${q.difficulty||'medium'}">${q.difficulty||'medium'}</span>
        </div>
        <div class="quiz-prog-bar"><div class="quiz-prog-fill" style="width:${pct}%"></div></div>
        <p class="quiz-question">${U.esc(q.question)}</p>
        <div class="quiz-opts">
          ${opts.map((opt,i)=>`<button class="quiz-opt glass-card" data-idx="${i}" onclick="Tools._quizAnswer(${i})">${q.type==='mcq'?`<span class="quiz-opt-letter">${'ABCD'[i]}</span>`:''}${U.esc(opt)}</button>`).join('')}
        </div>
        ${q.type==='fillblank'?`<div class="quiz-fill-wrap"><input class="glass-input quiz-fill-input" id="quiz-fill-inp" placeholder="Type your answer…"/><button class="glow-btn" onclick="Tools._quizFillAnswer()">Submit</button></div>`:''}
      </div>`;
  },

  _quizAnswer(idx){
    const q=this.quiz.questions[this.quiz.current];
    this.quiz.answers[this.quiz.current]=idx;
    const correct=q.correct===idx;
    // Flash colour
    const opts=U.$$('.quiz-opt');
    opts.forEach((opt,i)=>{
      opt.disabled=true;
      if(i===q.correct) opt.classList.add('quiz-opt--correct');
      else if(i===idx&&!correct) opt.classList.add('quiz-opt--wrong');
    });
    // Explanation
    const card=U.$('quiz-active')?.querySelector('.quiz-card');
    if(card){
      const expl=document.createElement('div');
      expl.className='quiz-explanation glass-card';
      expl.innerHTML=`<span>${correct?'✅ Correct!':'❌ Incorrect'}</span><p>${U.esc(q.explanation||'')}</p>`;
      card.appendChild(expl);
      const nextBtn=document.createElement('button');
      nextBtn.className='glow-btn quiz-next-btn';
      nextBtn.textContent=this.quiz.current<this.quiz.questions.length-1?'Next Question →':'See Results';
      nextBtn.onclick=()=>this._quizNext();
      card.appendChild(nextBtn);
    }
    if(correct) Gami.recordQuiz();
  },

  _quizFillAnswer(){
    const val=U.$('quiz-fill-inp')?.value.trim();
    if(!val){U.toast('Type your answer','error');return;}
    this.quiz.answers[this.quiz.current]=val;
    this._quizNext();
  },

  _quizNext(){
    if(this.quiz.current<this.quiz.questions.length-1){
      this.quiz.current++;
      this._quizRender();
    } else {
      this._quizResults();
    }
  },

  _quizResults(){
    const correct=Object.entries(this.quiz.answers).filter(([i,a])=>this.quiz.questions[i]?.correct===a).length;
    const total=this.quiz.questions.length;
    const pct=Math.round((correct/total)*100);
    const grade=pct>=90?'A+':pct>=80?'A':pct>=70?'B':pct>=60?'C':pct>=50?'D':'F';
    U.$('quiz-active')?.classList.add('hidden');
    const res=U.$('quiz-results'); if(!res)return;
    res.classList.remove('hidden');
    res.innerHTML=`
      <div class="quiz-results-card glass-card">
        <div class="qr-grade qr-grade--${grade[0]}">${grade}</div>
        <div class="qr-score">${correct}/${total} correct · ${pct}%</div>
        <div class="qr-bar"><div class="qr-bar-fill" style="width:${pct}%"></div></div>
        <p class="qr-msg">${pct>=70?'Great work! Keep it up! 🎉':'Keep practising — you\'ll get there! 💪'}</p>
        <div class="qr-btns">
          <button class="glow-btn" onclick="Tools._quizRetry()">↺ Try Again</button>
          <button class="sol-share-btn" onclick="Tools._quizNew()">New Quiz</button>
        </div>
      </div>`;
    Gami.recordQuiz();
    U.toast(`Quiz done! ${pct}% — ${grade}`,'success');
  },

  _quizRetry(){
    this.quiz.current=0; this.quiz.answers={}; this.quiz.done=false;
    U.$('quiz-results')?.classList.add('hidden');
    U.$('quiz-active')?.classList.remove('hidden');
    this._quizRender();
  },

  _quizNew(){
    this.quiz={questions:[],current:0,answers:{},done:false};
    U.$('quiz-results')?.classList.add('hidden');
    U.$('quiz-active')?.classList.add('hidden');
    U.$('quiz-setup')?.classList.remove('hidden');
  },

  // ── Budget ────────────────────────────────────────────────
  initBudget(){
    U.$('b-calc-btn')?.addEventListener('click',()=>this._calcBudget());
  },

  _calcBudget(){
    const v=id=>parseFloat(U.$(id)?.value)||0;
    const income=v('b-income');
    const expenses=v('b-rent')+v('b-food')+v('b-transport')+v('b-books')+v('b-fun');
    const left=income-expenses;
    const pct=income>0?Math.min(Math.round(expenses/income*100),100):0;
    const res=U.$('b-result'); if(!res)return;
    res.classList.remove('hidden');
    res.innerHTML=`
      <div class="budget-summary ${left<0?'budget-summary--over':''}">
        <div class="budget-row-r"><span>Total Expenses</span><strong>${expenses.toLocaleString()}</strong></div>
        <div class="budget-row-r"><span>Income</span><strong>${income.toLocaleString()}</strong></div>
        <div class="budget-row-r budget-row-r--hl ${left<0?'text-red':'text-green'}">
          <span>${left>=0?'Remaining':'Shortfall'}</span><strong>${Math.abs(left).toLocaleString()}</strong>
        </div>
        <div class="budget-prog-bar"><div class="budget-prog-fill ${pct>90?'budget-prog-fill--danger':''}" style="width:${pct}%"></div></div>
        <p class="budget-advice">${left<0?`⚠️ Overspending by ${Math.abs(left).toLocaleString()}. Cut discretionary expenses.`:`✅ ${left.toLocaleString()} left. Save at least 20%!`}</p>
        <p class="budget-savings">${income>0?`💡 20% savings target: ${Math.round(income*0.2).toLocaleString()} /month`:''}</p>
      </div>`;
    Gami.recordTool('budget');
  },

  // ── Burnout ───────────────────────────────────────────────
  burnout: { step:0, answers:[] },

  initBurnout(){
    U.$('burnout-start-btn')?.addEventListener('click',()=>this._burnoutStart());
  },

  _burnoutStart(){
    this.burnout={step:0,answers:[]};
    this._burnoutRender();
    Gami.recordTool('burnout');
  },

  _burnoutRender(){
    const wrap=U.$('burnout-card'); if(!wrap)return;
    const q=CFG.BURNOUT_QS[this.burnout.step];
    if(!q){this._burnoutResult();return;}
    wrap.innerHTML=`
      <h3>🧠 Burnout Detector</h3>
      <p class="burnout-step-num">Question ${this.burnout.step+1} of ${CFG.BURNOUT_QS.length}</p>
      <div class="burnout-prog-bar"><div class="burnout-prog-fill" style="width:${(this.burnout.step/CFG.BURNOUT_QS.length)*100}%"></div></div>
      <p class="burnout-q-text">${U.esc(q.q)}</p>
      <div class="burnout-opts">
        ${q.opts.map((o,i)=>`<button class="burnout-opt glass-card" data-score="${i}">${U.esc(o)}</button>`).join('')}
      </div>`;
    wrap.querySelectorAll('.burnout-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        this.burnout.answers.push(parseInt(btn.dataset.score));
        this.burnout.step++;
        this._burnoutRender();
      });
    });
  },

  _burnoutResult(){
    const total=this.burnout.answers.reduce((a,b)=>a+b,0);
    const max=(CFG.BURNOUT_QS.length)*3;
    const pct=Math.round((total/max)*100);
    const lvl=pct<30?'Low':pct<60?'Moderate':pct<80?'High':'Critical';
    const colors={Low:'var(--emerald)',Moderate:'var(--amber)',High:'var(--red)',Critical:'#ff0040'};
    const advice={
      Low:'You\'re doing great! Maintain your current habits.',
      Moderate:'Stress building up. Schedule proper rest.',
      High:'You need a break now. Reach out for support.',
      Critical:'Please seek support immediately. Your wellbeing comes first.',
    };
    const wrap=U.$('burnout-card'); if(!wrap)return;
    wrap.innerHTML=`
      <h3>🧠 Burnout Results</h3>
      <div class="burnout-result-level" style="color:${colors[lvl]}">${lvl} Burnout</div>
      <div class="burnout-result-bar"><div class="burnout-result-fill" style="width:${pct}%;background:${colors[lvl]}"></div></div>
      <p class="burnout-pct">${pct}% burnout score</p>
      <p class="burnout-advice">${advice[lvl]}</p>
      <button class="glow-btn" onclick="Tools._burnoutStart()">↺ Retake</button>`;
  },

  // ── Deadlines ─────────────────────────────────────────────
  deadlines: [],

  initDeadlines(){
    this.deadlines=U.load('deadlines2',[]);
    this._renderDeadlines();
    U.$('dl-add-btn')?.addEventListener('click',()=>this._addDeadline());
    const dateInput=U.$('dl-date');
    if(dateInput) dateInput.min=new Date().toISOString().split('T')[0];
  },

  _addDeadline(){
    const task=U.$('dl-task')?.value.trim();
    const date=U.$('dl-date')?.value;
    if(!task||!date){U.toast('Fill in task and date','error');return;}
    this.deadlines.push({id:Date.now(),task,date});
    this.deadlines.sort((a,b)=>new Date(a.date)-new Date(b.date));
    U.save('deadlines2',this.deadlines);
    U.$('dl-task').value=''; U.$('dl-date').value='';
    this._renderDeadlines();
    Gami.recordTool('deadline');
    U.toast('Deadline added','success');
  },

  _renderDeadlines(){
    const list=U.$('dl-list'); if(!list)return;
    if(!this.deadlines.length){list.innerHTML='<p class="empty-state-sm">No deadlines yet. Add one above.</p>';return;}
    const colors={critical:'var(--red)',high:'var(--amber)',medium:'var(--gold)',low:'var(--emerald)'};
    list.innerHTML='';
    this.deadlines.forEach(d=>{
      const days=Math.ceil((new Date(d.date)-new Date())/(1000*60*60*24));
      const urg=days<=1?'critical':days<=3?'high':days<=7?'medium':'low';
      const el=document.createElement('div');
      el.className='dl-item glass-card';
      el.innerHTML=`
        <div class="dl-dot" style="background:${colors[urg]}"></div>
        <div class="dl-body">
          <strong>${U.esc(d.task)}</strong>
          <span>${new Date(d.date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
        </div>
        <span class="dl-days" style="color:${colors[urg]}">${days<=0?'OVERDUE':days===1?'Tomorrow':`${days}d`}</span>
        <button class="dl-remove-btn" onclick="Tools.removeDeadline(${d.id})">✕</button>`;
      list.appendChild(el);
    });
  },

  removeDeadline(id){
    this.deadlines=this.deadlines.filter(d=>d.id!==id);
    U.save('deadlines2',this.deadlines);
    this._renderDeadlines();
  },

  // ── CV ────────────────────────────────────────────────────
  initCV(){
    U.$('cv-gen-btn')?.addEventListener('click',()=>this._cvGenerate());
  },

  async _cvGenerate(){
    const exp=U.$('cv-exp')?.value.trim();
    if(!exp){U.toast('Describe your experience first','error');return;}
    const btn=U.$('cv-gen-btn');
    btn.textContent='Generating…'; btn.disabled=true;
    try{
      const r=await fetch(`${CFG.API}/cv`,{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({experience:exp}),
      });
      const d=await r.json();
      const res=U.$('cv-result'); if(!res)return;
      res.classList.remove('hidden');
      res.innerHTML=`<ul class="cv-bullets">${(d.bullets||[]).map(b=>`<li class="glass-card">${U.esc(b)}</li>`).join('')}</ul>`;
      Gami.recordTool('cv');
      U.toast('CV bullets generated!','success');
    }catch(e){U.toast('Error: '+e.message,'error');}
    btn.textContent='✦ Generate CV Bullets'; btn.disabled=false;
  },

  // ── Tab Switching ─────────────────────────────────────────
  initTabs(){
    U.$$('.tools-tab').forEach(tab=>{
      tab.addEventListener('click',()=>{
        U.$$('.tools-tab').forEach(t=>t.classList.remove('active'));
        U.$$('.tool-pane').forEach(p=>p.classList.remove('active'));
        tab.classList.add('active');
        const pane=U.$('tool-'+tab.dataset.tool);
        if(pane) pane.classList.add('active');
      });
    });
  },

  init(){
    this.initTabs();
    this.initPomodoro();
    this.initFlashcards();
    this.initQuiz();
    this.initBudget();
    this.initBurnout();
    this.initDeadlines();
    this.initCV();
  },
};
