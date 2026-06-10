const U = {
  $: id => document.getElementById(id),
  $$: sel => document.querySelectorAll(sel),
  esc(s){ if(!s)return''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); },
  save(k,v){ try{localStorage.setItem('ss2_'+k,JSON.stringify(v));}catch{} },
  load(k,d=null){ try{const v=localStorage.getItem('ss2_'+k);return v?JSON.parse(v):d;}catch{return d;} },
  toast(msg,type='success'){
    const t=U.$('toast');
    t.textContent=msg; t.className=`toast toast--${type} toast--show`;
    clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('toast--show'),3200);
  },
  greeting(){ const h=new Date().getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; },
  timeAgo(ts){ const d=Date.now()-ts; if(d<60000)return'just now'; if(d<3600000)return`${Math.floor(d/60000)}m ago`; if(d<86400000)return`${Math.floor(d/3600000)}h ago`; return`${Math.floor(d/86400000)}d ago`; },
  catColor(c){ return {academic:'var(--purple)',time:'var(--amber)',finance:'var(--emerald)',mental:'var(--cyan)',career:'var(--gold)',social:'var(--pink)',study:'var(--purple)'}[c]||'var(--purple)'; },
  severityColor(s){ return {low:'var(--emerald)',medium:'var(--amber)',high:'var(--red)',critical:'#ff0040'}[s]||'var(--purple)'; },
  catIcon(c){ return {academic:'📚',time:'⏰',finance:'💸',mental:'🧠',career:'🎯',social:'👥',study:'🔬'}[c]||'✦'; },
  animNum(el,target,ms=700){
    const start=parseInt(el.textContent)||0; const range=target-start;
    const t0=performance.now();
    const tick=now=>{
      const p=Math.min((now-t0)/ms,1);
      el.textContent=Math.floor(start+range*p);
      if(p<1)requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  },
  sleep(ms){ return new Promise(r=>setTimeout(r,ms)); },
};
