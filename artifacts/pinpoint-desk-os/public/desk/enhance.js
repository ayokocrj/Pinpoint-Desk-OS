/* Pinpoint Desk OS, concept demo: shell enhancements.
   Record finder, mandate journey, demo scenarios, connection status and layout switch.
   Everything here reads the same engine and state as app.js (window.PP_APP). It drives the
   existing screens and actions by dispatching the same clicks the interface already handles,
   so every rule, log line and refusal stays where it was. No network call, no storage, no
   send, merge, reject or delete. */
(function(){'use strict';
const A=window.PP_APP; if(!A) return;
const {S,E,listFor,mandate,HERO,ME_CODE,MY_DESK,BR}=A;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num=v=>Number(v).toLocaleString('en-GB');
const mago=n=>n===0?'this month':n+' month'+(n===1?'':'s')+' ago';
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Dispatch a click the existing handler understands: data-tab, data-open, data-ask, data-rec, data-act. */
function fire(data){ const b=document.createElement('button'); b.hidden=true; Object.keys(data).forEach(k=>b.dataset[k]=data[k]); document.body.append(b); b.click(); b.remove(); }

/* ---------------- modal sheet ---------------- */
let open=null, lastFocus=null;
function sheet(id,title,body,foot){
  let el=document.getElementById(id);
  if(!el){ el=document.createElement('div'); el.id=id; el.className='xback'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-label',title);
    el.addEventListener('mousedown',e=>{ if(e.target===el) closeSheet() }); document.body.append(el); }
  el.innerHTML='<div class="xsheet"><div class="xhead"><h2>'+esc(title)+'</h2><span class="sp"></span><button class="btn sm" data-act="x-close" data-testid="button-close-'+id+'">Close <span class="xkbd">Esc</span></button></div><div class="xbody">'+body+'</div>'+(foot?'<div class="xfoot">'+foot+'</div>':'')+'</div>';
  if(open&&open!==el) open.classList.remove('open');
  lastFocus=document.activeElement; open=el; requestAnimationFrame(()=>el.classList.add('open'));
  return el;
}
function closeSheet(){ if(!open) return; open.classList.remove('open'); open=null; if(lastFocus&&lastFocus.focus) lastFocus.focus() }

/* ---------------- record finder ---------------- */
let IDX=null, HIDDEN=null;
const F={q:'',city:'',side:'',practice:'',flags:{},sort:'code',limit:60,kb:0};
const FLAGS=[['stale','Not checked in 24 months'],['dup','Two records'],['consent','No storage consent'],['moved','Firm out of date'],['open','Note: open to a move']];
function buildIndex(){
  if(IDX) return; IDX=[]; HIDDEN={total:0,byDesk:{}};
  for(let r=0;r<E.R.length;r++){
    const f=E.recordFacts(r,MY_DESK);
    if(f.hiddenDesk){ HIDDEN.total++; HIDDEN.byDesk[f.hiddenDesk]=(HIDDEN.byDesk[f.hiddenDesk]||0)+1; continue }
    IDX.push({c:f.cid,desk:f.desk,owner:f.owner,practice:f.practice,city:f.city,firm:f.firmOnRecord,years:f.years,base:f.baseYear,legal:f.legal,months:f.months,
      dup:!!f.dup,consent:f.consent,priv:f.priv,moved:f.reg&&f.firmOnRecord!==f.firmNow,open:f.noteDay>=0||!!f.noteOther,reg:f.reg,
      hay:(f.cid+' '+f.practice+' '+f.city+' '+f.firmOnRecord+' '+f.desk+' '+f.owner).toLowerCase()});
  }
}
function results(){
  const q=F.q.trim().toLowerCase(), toks=q.split(/\s+/).filter(Boolean);
  let out=IDX.filter(x=>(!F.city||x.city===F.city)&&(!F.side||(F.side==='legal')===x.legal)&&(!F.practice||x.practice===F.practice)&&
    (!F.flags.stale||x.months>=24)&&(!F.flags.dup||x.dup)&&(!F.flags.consent||!x.consent)&&(!F.flags.moved||x.moved)&&(!F.flags.open||x.open)&&
    toks.every(t=>x.hay.indexOf(t.replace(/^c(\d)/,'c-$1'))>=0||x.hay.indexOf(t)>=0));
  if(F.sort==='stale') out=out.slice().sort((a,b)=>b.months-a.months||(a.c<b.c?-1:1));
  else if(F.sort==='years') out=out.slice().sort((a,b)=>b.years-a.years||(a.c<b.c?-1:1));
  return out;
}
/* A code typed in full that is private to another desk: say so, as the drawer does. Never list it among results. */
function privateCode(){
  const m=/^c-?(\d{3,4})$/i.exec(F.q.trim()); if(!m) return null;
  const c='C-'+m[1].padStart(4,'0'), rid=E.ridOf(c); if(rid<0) return null;
  const f=E.recordFacts(rid,MY_DESK); return f.hiddenDesk?c:null;
}
function finderBody(){
  const sel=(k,opts,label)=>'<select data-f="'+k+'" aria-label="'+label+'" data-testid="select-finder-'+k+'">'+opts.map(o=>'<option value="'+esc(o[0])+'"'+(F[k]===o[0]?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
  return '<div class="fq"><svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6"/><path d="m20 20-4.5-4.5"/></svg><input id="xfq" type="search" autocomplete="off" spellcheck="false" placeholder="Code, firm, practice or city: try C-4112, US firm 07, Funds" value="'+esc(F.q)+'" aria-label="Search the records you may see" data-testid="input-finder-query"></div>'+
   '<div class="ffil">'+sel('side',[['','Both sides'],['legal','Legal'],['fs','Financial services']],'Side')+sel('city',[['','Both cities'],['London','London'],['New York','New York']],'City')+
   sel('practice',[['','Every practice']].concat(E.PRACT.map(p=>[p,p])),'Practice')+sel('sort',[['code','Sort by code'],['stale','Oldest check first'],['years','Most years first']],'Sort')+'</div>'+
   '<div class="ffil">'+FLAGS.map(f=>'<button class="fchip'+(F.flags[f[0]]?' on':'')+'" data-f-flag="'+f[0]+'" aria-pressed="'+!!F.flags[f[0]]+'" data-testid="toggle-finder-'+f[0]+'">'+esc(f[1])+'</button>').join('')+'</div>'+
   '<div id="xfout"></div>';
}
function renderResults(){
  const box=$('#xfout'); if(!box) return;
  const list=results(), pc=privateCode(), shown=list.slice(0,F.limit), filtered=F.q.trim()||F.city||F.side||F.practice||Object.keys(F.flags).some(k=>F.flags[k]);
  F.kb=Math.min(F.kb,Math.max(0,shown.length-1));
  let h='<div class="fmeta"><span data-testid="text-finder-count"><b>'+num(list.length)+'</b> of '+num(IDX.length)+' records on your view'+(filtered?'':' · type or filter to narrow')+'</span><span class="lockline">'+num(HIDDEN.total)+' records private to other desks are not searchable as '+ME_CODE+': rule R-6</span></div>';
  if(pc) h+='<div class="fres"><button class="frow priv" data-x-rec="'+pc+'" data-testid="row-finder-private"><span class="fc">'+pc+'</span><span class="fm"><b>Private to another desk</b><span>The record exists and is not shown to you. Opening it logs the block, nothing more.</span></span><span class="ft"><span class="tag bad">R-6</span></span></button></div>';
  if(!list.length&&!pc){
    h+='<div class="fempty" data-testid="status-finder-empty"><h3>Nothing on your view matches</h3><p>No record you may see fits '+(F.q.trim()?'“'+esc(F.q.trim())+'”':'these filters')+'. A record private to another desk would not appear here either: ask its desk.</p><button class="btn sm" data-x-reset="1" data-testid="button-finder-reset">Clear the search and filters</button></div>';
  } else if(list.length){
    h+='<div class="fres" role="listbox">'+shown.map((x,i)=>{
      const tags=[]; const mc=x.months>=24?'bad':x.months>=12?'warn':'ok';
      tags.push('<span class="tag '+mc+'">checked '+esc(mago(x.months))+'</span>');
      if(x.dup) tags.push('<span class="tag blue">two records</span>'); if(x.moved) tags.push('<span class="tag bad">firm out of date</span>');
      if(!x.consent) tags.push('<span class="tag warn">no storage consent</span>'); if(x.priv) tags.push('<span class="tag grey">private to its desk</span>');
      return '<button class="frow'+(i===F.kb?' kb':'')+'" role="option" data-x-rec="'+x.c+'" data-testid="row-finder-'+x.c+'"><span class="fc">'+x.c+'</span><span class="fm"><b>'+esc(x.practice)+' · '+esc(x.city)+'</b><span>'+esc(x.firm)+' on record · '+(x.legal?'admitted ':'in the industry since ')+x.base+', '+x.years+' years today · '+esc(x.desk)+', '+esc(x.owner)+'</span></span><span class="ft">'+tags.join('')+'</span></button>'}).join('')+'</div>';
    if(list.length>shown.length) h+='<button class="btn sm fmore" data-x-more="1" data-testid="button-finder-more">Show '+Math.min(60,list.length-shown.length)+' more of '+num(list.length-shown.length)+'</button>';
  }
  box.innerHTML=h;
}
function openFinder(){
  buildIndex();
  sheet('xfind','Find a record',finderBody(),'<span>Read from the synthetic record, as '+ME_CODE+' sees it. Each fact opens with its date.</span><span><span class="xkbd">↑</span> <span class="xkbd">↓</span> move · <span class="xkbd">Enter</span> open</span><span>Searches are not logged or stored.</span>');
  renderResults(); setTimeout(()=>{const i=$('#xfq'); if(i){i.focus(); i.select()}},40);
}
function openRec(c){ closeSheet(); if(document.body.classList.contains('lay-chat')) setLay('split'); fire({rec:c}); if(innerWidth<=900) $('#ws').scrollIntoView({block:'start',behavior:reduced?'auto':'smooth'}) }
document.addEventListener('input',e=>{ if(e.target.id==='xfq'){ F.q=e.target.value; F.limit=60; F.kb=0; renderResults() } });
document.addEventListener('change',e=>{ const k=e.target.dataset&&e.target.dataset.f; if(k&&open&&open.id==='xfind'){ F[k]=e.target.value; F.limit=60; F.kb=0; renderResults() } });

/* ---------------- scenarios ---------------- */
const SCEN=[
 ['follow','Morning brief','Follow-ups with their evidence','Nine people to call today out of 55 due this month, each with the note or register entry behind it and its date. The first line opens with its draft.','You accept, correct or confirm each line. The draft waits in your mailbox: nothing is sent.',()=>{ fire({ask:'Who should I call today, and why?'}); setTimeout(()=>{ fire({tab:'0'}); const c=BR.today[0].cid; if(S.fuOpen!==c) fire({act:'fu-open',c}) },350) }],
 ['mandate','Mandate and longlist','Mandate matching, M-0457','From the email received at 08:12 to ten names, each with a reason and a date. Two strong matches set aside by the hands-off list; one question back on the 2021 admissions.','You answer the question, take names off, record agreements and approve to call. Clerk drafts; you decide.',()=>{ fire({act:'mid',m:HERO}); fire({ask:'Longlist for M-0457?'}) }],
 ['dup','Record hygiene','Duplicate review','Three pairs on your lists that look like one person, with the facts side by side and what reading them as one changes.','Read as one or keep apart is a decision by a named person. Both source rows are kept; the source system is read-only.',()=>{ fire({ask:'Who is duplicated on my desk?'}); setTimeout(()=>fire({tab:'3'}),350) }],
 ['cv','CV intake','A suspicious CV','CV-05 carries white text in 1 point, addressed to a machine. It is read in a sealed step, quarantined and shown as it is. Each claim is checked against a register, simulated here.','Nothing read from a quarantined CV is used until a person decides.',()=>{ fire({act:'cv',c:'CV-05'}); fire({ask:'What can you confirm on CV-05?'}) }],
 ['bench','Test bench','The method, tested first','50 closed mandates under three methods, re-run in the page, and 40 probes across desk boundaries.','Changing a rule, a threshold or a model needs a signed request and a new run: rule R-6.',()=>{ fire({ask:'How was the method tested?'}); setTimeout(()=>fire({open:'4',flash:'bt'}),350) }]];
function openScen(){
  sheet('xscen','Demo scenarios','<p class="small muted" style="margin:0 0 12px">Each scenario opens the real screen and asks Clerk the matching question. The figures are computed in this page from the synthetic dataset; the actions are the ones on the screen. The 60-second tour runs all of them in order.</p><div class="scgrid">'+
   SCEN.map((s,i)=>'<div class="sc'+(i===SCEN.length-1?' wide':'')+'"><span class="k">'+esc(s[1].toUpperCase())+'</span><h3>'+esc(s[2])+'</h3><p>'+esc(s[3])+'</p><p class="hum"><b>Stays with a person.</b> '+esc(s[4])+'</p><button class="btn sm primary" data-x-scen="'+i+'" data-testid="button-scenario-'+s[0]+'">Open this scenario</button></div>').join('')+
   '</div>','<button class="btn sm" data-act="tour" data-testid="button-scenario-tour">Play the 60-second tour</button><span>Synthetic data: no real person, client or firm.</span>');
}

/* ---------------- connection status ---------------- */
function openConn(){
  const rows=[
   ['Record data','Synthetic','st-ok','5,000 invented records and 60 invented mandates, generated from seed '+esc(window.PP_DATA.seed)+' and embedded in this page.'],
   ['Matching and figures','In this browser','st-ok','Computed by the engine in this page. The self-check on screen 4 compares them with the generator’s read-out.'],
   ['Public registers','Simulated','st-sim','No register is called. Checks are simulated and labelled; each register’s terms are read with Pinpoint before any automation.'],
   ['Microsoft 365 and Outlook','Not connected','st-off','Drafts are held in a simulated mailbox for '+ME_CODE+'. In a pilot, Clerk would run inside your tenant, behind the rules on screen 6.'],
   ['Microdec','Not connected','st-off','The demo reads a synthetic export. The source system is treated as read-only: rule R-3.'],
   ['Model provider','Optional voice','st-sim','Text workflows use local rules. Talk to Clerk connects to Gemini Live after consent, sending microphone audio and the current desk screen to Google via the server. The API key never reaches the browser.'],
   ['Sending','Does not exist','st-ok','There is no send, email, merge, delete or reject action anywhere in the code: rules R-1, R-3 and R-4.'],
   ['Your pasted text','Not stored by demo','st-ok','Text workflows read it in browser memory. If you start voice, text visible on the desk screen is shared with Google. This demo does not persist audio or transcripts; Google account terms apply.']];
  sheet('xconn','Connection status','<div class="conn" data-testid="status-connections">'+rows.map(r=>'<div><b>'+esc(r[0])+'</b><b class="'+r[2]+'">'+esc(r[1])+'</b><span>'+r[3]+'</span></div>').join('')+'</div>'+
   '<p class="xs muted" style="margin:10px 0 0">Concept demo prepared for Pinpoint Partners by Roland-Caryl Obam Ngo’O. Not a Pinpoint product, and not connected to any Pinpoint system.</p>');
}

/* ---------------- layout ---------------- */
function setLay(v){ document.body.classList.remove('lay-desk','lay-chat'); if(v!=='split') document.body.classList.add('lay-'+v); document.querySelectorAll('.lay button').forEach(b=>b.classList.toggle('on',b.dataset.v===v)) }

/* ---------------- mandate journey on screen 1 ---------------- */
function journey(){
  const main=$('#main'); if(!main||main.dataset.tab!=='1'||S.mid==='paste'||main.querySelector('.journey')) return;
  const m=mandate(S.mid); if(!m) return;
  const L=listFor(S.mid), hero=S.mid===HERO, kept=L.top.filter(x=>!S.off[S.mid+'|'+x.cid]).length;
  const agreed=Object.keys(S.agreed).filter(k=>k.split('|')[0]===S.mid).length, ap=S.approved[S.mid], dis=S.dismissed[S.mid], qb=S.qback[HERO];
  const steps=[
   ['done','Received',hero?'Tue 1 Dec, 08:12':'Opened '+E.nice(m.opened),hero?'One email, one PDF, your note':'For '+m.client+' (synthetic)','arrive'],
   ['done','Evidence read',num(L.records)+' records',num(L.people)+' people · '+num(L.family)+' in the practice family · '+num(L.pass)+' fit','funnel'],
   ['done','Ranked',L.top.length+' proposed',num(L.blockedTotal)+' blocked by desk rules · '+L.hidden+' private to another desk','ten'],
   hero?(qb?['done','Ambiguity',qb==='edge'?'Top edge':'Inside the range','Answered by '+ME_CODE+' · logged','qback']:['wait','Ambiguity','One question back','Is a 2021 admission inside “3 to 5 years”?','qback'])
       :['done','Ambiguity','No question back','The brief reads without one','ten'],
   ap?['done','Named approval','Approved by '+ME_CODE,'At '+ap+' · '+agreed+' agreement'+(agreed===1?'':'s')+' recorded · 0 sent','decide']
     :dis?['done','Named approval','Dismissed by '+ME_CODE,'At '+dis+' · kept as a test case','decide']
     :['you','Named approval','Waits for you',kept+' on your list · '+agreed+' agreement'+(agreed===1?'':'s')+' · nothing sent','decide']];
  const el=document.createElement('div');
  el.innerHTML='<div class="journey" role="list" aria-label="Mandate journey" data-testid="journey-'+esc(S.mid)+'">'+steps.map((s,i)=>'<button class="jstep '+s[0]+'" role="listitem" data-x-jump="'+s[4]+'" data-testid="journey-step-'+(i+1)+'"><span class="jn"><i>'+(s[0]==='done'?'✓':i+1)+'</i>'+esc(s[1])+'</span><b>'+esc(s[2])+'</b><span>'+esc(s[3])+'</span></button>').join('')+'</div>'+
   '<div class="jcap">'+'<span class="tag deep">'+esc(S.mid)+'</span><span>Receipt, evidence, ranking, the question back and the approval, in the order the layer works. Each step opens its part of the screen. The shortlist stays with the recruiter.</span></div>';
  const tabs=main.querySelector('.mtabs'); const frag=document.createDocumentFragment(); while(el.firstChild) frag.append(el.firstChild);
  if(tabs) tabs.after(frag); else main.prepend(frag);
}
function jump(id){
  const main=$('#main'); let el=id==='funnel'?main.querySelector('.funnel'):document.getElementById(id);
  if(id==='arrive'&&!el){ el=main.querySelector('.journey') }
  if(!el){ return }
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); el.scrollIntoView({block:'center',behavior:reduced?'auto':'smooth'});
}
new MutationObserver(journey).observe($('#main'),{childList:true});
journey();

/* ---------------- events ---------------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('[data-act^="x-"],[data-x-rec],[data-x-scen],[data-x-jump],[data-x-more],[data-x-reset],[data-f-flag],[data-act="tour"]');
  if(!t) return;
  if(t.dataset.act==='tour'){ if(open) closeSheet(); return }   /* the tour itself is started by app.js */
  e.stopPropagation(); e.preventDefault();
  const a=t.dataset.act;
  if(a==='x-find') return openFinder();
  if(a==='x-scen') return openScen();
  if(a==='x-conn') return openConn();
  if(a==='x-close') return closeSheet();
  if(a==='x-lay') return setLay(t.dataset.v);
  if(t.dataset.xRec) return openRec(t.dataset.xRec);
  if(t.dataset.xScen!==undefined){ closeSheet(); fire({act:'tour-skip'}); if(document.body.classList.contains('lay-chat')||document.body.classList.contains('lay-desk')) setLay('split'); SCEN[+t.dataset.xScen][5](); return }
  if(t.dataset.xJump) return jump(t.dataset.xJump);
  if(t.dataset.xMore){ F.limit+=60; renderResults(); return }
  if(t.dataset.xReset){ Object.assign(F,{q:'',city:'',side:'',practice:'',flags:{},sort:'code',limit:60,kb:0}); open&&open.id==='xfind'&&(open.querySelector('.xbody').innerHTML=finderBody()); renderResults(); const i=$('#xfq'); if(i) i.focus(); return }
  if(t.dataset.fFlag){ F.flags[t.dataset.fFlag]=!F.flags[t.dataset.fFlag]; t.classList.toggle('on'); t.setAttribute('aria-pressed',!!F.flags[t.dataset.fFlag]); F.limit=60; F.kb=0; renderResults(); return }
},true);
document.addEventListener('keydown',e=>{
  const typing=/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''));
  if((e.key==='k'||e.key==='K')&&(e.metaKey||e.ctrlKey)){ e.preventDefault(); open&&open.id==='xfind'?closeSheet():openFinder(); return }
  if(e.key==='/'&&!typing&&!open){ e.preventDefault(); openFinder(); return }
  if(!open) return;
  if(e.key==='Escape'){ e.stopPropagation(); closeSheet(); return }
  if(open.id==='xfind'&&(e.key==='ArrowDown'||e.key==='ArrowUp')){ e.preventDefault(); const rows=open.querySelectorAll('.frow[role="option"]'); if(!rows.length) return; F.kb=Math.max(0,Math.min(rows.length-1,F.kb+(e.key==='ArrowDown'?1:-1))); rows.forEach((r,i)=>r.classList.toggle('kb',i===F.kb)); rows[F.kb].scrollIntoView({block:'nearest'}); return }
  if(open.id==='xfind'&&e.key==='Enter'&&e.target.id==='xfq'){ e.preventDefault(); const r=open.querySelector('.frow.kb')||open.querySelector('.frow'); if(r) openRec(r.dataset.xRec) }
},true);
})();
