/* ---------- data ---------- */
const SCENES=__DATA__;
const TE=__TE__;
const UI=__UI__;
const SRC=__SRC__;
let lang='en';try{lang=localStorage.getItem('sceneboard.lang')==='te'?'te':'en'}catch(e){}
/* The interface is always English. Only the story itself — scene text, scene
   terms, sequence and board names — follows the language switch. */
function T(k,a){let s=UI.en[k]||k;if(a)Object.keys(a).forEach(x=>{s=s.split('{'+x+'}').join(a[x])});return s}
const isTe=()=>lang==='te';
const BASE={},ORDER=[];SCENES.forEach(s=>{BASE[s.c]=s;ORDER.push(s.c)});
let BY={};ORDER.forEach(c=>BY[c]=BASE[c]);
const EVN={};SCENES.forEach(s=>EVN[s.ev]=s.evn);
const TOTAL=SCENES.length;
const all=()=>ORDER.map(c=>BY[c]);
function sc(s,f){
  if(!isTe())return s[f];
  if(s.te&&s.te[f])return s.te[f];
  if(s.ovf&&s.ovf[f])return s[f];
  const b=TE.sc[s.c];return (b&&b[f])||s[f];
}
const shotText=sh=>isTe()&&sh.te?sh.te:sh.x;
const term=(k,v)=>isTe()&&TE.terms[k]&&TE.terms[k][v]?TE.terms[k][v]:v;
function nm(n){
  if(!isTe()||!n)return n;if(TE.seq[n])return TE.seq[n];
  let m=/^Sequence ([A-Z0-9]+)$/.exec(n);if(m)return 'సీక్వెన్స్ '+m[1];
  m=/^Board (\d+)$/.exec(n);if(m)return 'బోర్డ్ '+m[1];
  m=/^Copy of (.+)\.$/.exec(n);if(m)return nm(m[1])+' కాపీ.';return n}
const colName=c=>isTe()?((c.te&&c.te.name)||nm(c.name)):c.name;
const colNote=c=>isTe()?((c.te&&c.te.note)||nm(c.note||'')||''):(c.note||'');
const bName=b=>isTe()?((b.te&&b.te.name)||nm(b.name)):b.name;
const bDesc=b=>isTe()?((b.te&&b.te.desc)||nm(b.desc||'')||''):(b.desc||'');
const catLabel=c=>T(c==='A'?'catA':'catD');

const defaultState=()=>({cols:[{id:'c1',name:'Sequence A',ids:[]},{id:'c2',name:'Sequence B',ids:[]},{id:'c3',name:'Sequence C',ids:[]}],cat:{}});
let state=defaultState();
let filt={q:'',f:'all',ev:'0',sort:'ev'};
let mode='loading',lastJSON='',pending=false,writing=false,again=false,wtimer=null,sortables=[],openCode=null,openSeq=null;
/* desktop or mobile layout: guessed from the screen, remembered once chosen */
function autoView(){
  try{if(matchMedia('(pointer:coarse)').matches&&innerWidth<1100)return 'mobile'}catch(e){}
  return innerWidth<=820?'mobile':'desktop';
}
let view='desktop',viewPinned=false,folded=new Set();
try{const v=localStorage.getItem('sceneboard.view');if(v==='mobile'||v==='desktop'){view=v;viewPinned=true}}catch(e){}
if(!viewPinned)view=autoView();
try{const f=JSON.parse(localStorage.getItem('sceneboard.folded')||'[]');if(Array.isArray(f))folded=new Set(f)}catch(e){}
const isMob=()=>view==='mobile';
function applyView(){
  document.body.dataset.view=view;
  document.querySelectorAll('#viewseg [data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===view));
}
function setView(v){
  if(v!==view){view=v;hidePeek();hideCtx();applyView();applyStatic();render();toast(v==='mobile'?'Mobile layout':'Desktop layout')}
  viewPinned=true;try{localStorage.setItem('sceneboard.view',v)}catch(e){}
}
function toggleFold(id){
  if(folded.has(id))folded.delete(id);else folded.add(id);
  try{localStorage.setItem('sceneboard.folded',JSON.stringify([...folded]))}catch(e){}
  render();
}
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const catOf=c=>state.cat[c]||BY[c].cat;
const placedSet=()=>{const s=new Set();state.cols.forEach(c=>c.ids.forEach(i=>s.add(i)));return s};
const flat=()=>state.cols.flatMap(c=>c.ids);
const fmtMin=m=>m>=60?Math.floor(m/60)+T('hour')+' '+String(Math.round(m%60)).padStart(2,'0')+T('min'):Math.round(m)+' '+T('min');
function toast(k,a){const t=T(k,a);const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,2600)}
let statusKey='loading',statusOk=false;
function setStatus(k,ok){statusKey=k;statusOk=!!ok;const e=$('status');e.textContent=T(k);e.className=ok?'ok':''}
const when=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleString(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})};

/* ---------- sanitise ---------- */
function clean(d){
  const seen=new Set();const cols=[];
  (d&&Array.isArray(d.cols)?d.cols:[]).forEach((c,i)=>{
    if(!c)return;const ids=[];(Array.isArray(c.ids)?c.ids:[]).forEach(x=>{if(BASE[x]&&!seen.has(x)){seen.add(x);ids.push(x)}});
    const o={id:String(c.id||('c'+Date.now()+i)),name:String(c.name||'Sequence').slice(0,60),ids};
    if(typeof c.note==='string'&&c.note.trim())o.note=c.note.slice(0,600);
    if(typeof c.lastp==='string'&&c.lastp.trim())o.lastp=c.lastp.slice(0,400);
    if(c.te&&typeof c.te==='object'){const t={};
      if(typeof c.te.name==='string'&&c.te.name.trim())t.name=c.te.name.slice(0,80);
      if(typeof c.te.note==='string'&&c.te.note.trim())t.note=c.te.note.slice(0,700);
      if(Object.keys(t).length)o.te=t}
    cols.push(o);
  });
  const cat={};if(d&&d.cat)Object.keys(d.cat).forEach(k=>{if(BASE[k]&&(d.cat[k]==='A'||d.cat[k]==='D')&&d.cat[k]!==BASE[k].cat)cat[k]=d.cat[k]});
  return {cols:cols.length?cols:defaultState().cols,cat};
}
function cleanShots(a){
  if(!Array.isArray(a))return null;
  const out=[];
  a.forEach(s=>{
    if(!s)return;
    const x=typeof s==='string'?{x:s}:s;
    const txt=String(x.x||x.text||'').trim();if(!txt)return;
    const o={t:String(x.t||x.type||'SHOT').trim().toUpperCase().slice(0,16)||'SHOT',x:txt.slice(0,700)};
    const te=String(x.te||'').trim();if(te)o.te=te.slice(0,700);
    out.push(o);
  });
  return out.slice(0,60);
}

/* ---------- scene overrides, shots and history ---------- */
const TXT=['t','sum','why','turn','story','rasa','pov','pl','k','mins'];
const SNAP=['t','sum','why','turn','story','rasa','pov','pl','k','mins'];
let ov={},ovRef=null;
const midOf=m=>{const n=String(m).match(/\d+(?:\.\d+)?/g);if(!n)return 1.5;const a=n.map(Number);return a.length>1?(a[0]+a[1])/2:a[0]};
function applyOv(){
  ORDER.forEach(c=>{BY[c]=BASE[c]});
  Object.keys(ov).forEach(code=>{
    if(!BASE[code])return;
    const o=ov[code]||{},b=Object.assign({},BASE[code]),f={};
    TXT.forEach(k=>{if(typeof o[k]==='string'&&o[k].trim()){b[k]=o[k].trim();f[k]=1}});
    if(Array.isArray(o.gen)&&o.gen.length)b.gen=o.gen.filter(x=>typeof x==='string').slice(0,5);
    const t=Number(o.tier);if(isFinite(t)&&t>=1&&t<=5){b.tier=Math.round(t);f.tier=1}
    if(typeof o.carrier==='boolean'){b.carrier=o.carrier;f.carrier=1}
    if(f.mins)b.mid=midOf(b.mins);
    if(o.te&&typeof o.te==='object')b.te=o.te;
    const sh=cleanShots(o.shots);if(sh)b.shots=sh;
    b.hist=Array.isArray(o.hist)?o.hist:[];
    b.ovf=f;b.ed=Object.keys(f).length>0;b.lastp=typeof o.prompt==='string'?o.prompt:'';
    BY[code]=b;
  });
}
function snapOf(code){
  const s=BY[code],o={at:new Date().toISOString(),prompt:(ov[code]&&ov[code].prompt)||''};
  SNAP.forEach(k=>{o[k]=s[k]});
  o.tier=s.tier;o.carrier=!!s.carrier;o.gen=s.gen;
  if(s.te)o.te=s.te;
  if(s.shots)o.shots=s.shots;
  if(!(ov[code]&&ov[code].hist&&ov[code].hist.length)&&!BY[code].ed)o.base=true;
  return o;
}
function pushHist(code){
  const prev=ov[code]||{};
  const h=Array.isArray(prev.hist)?prev.hist.slice():[];
  h.unshift(snapOf(code));
  ov[code]=Object.assign({},prev,{hist:h.slice(0,10)});
}
async function saveOv(code){
  try{localStorage.setItem('sceneboard.ov',JSON.stringify(ov))}catch(e){}
  if(mode!=='db'||!ovRef)return;
  try{
    const o=ov[code];
    if(o&&Object.keys(o).length)await ovRef.doc(code).set(o);else await ovRef.doc(code).delete();
    setStatus('saved',true);
  }catch(e){setStatus('fail')}
}

/* ---------- persistence ---------- */
let boardsData={},active='b1',catRef=null,boardsRef=null,dirtyCat=false;
const bid=n=>parseInt(String(n).replace(/\D/g,''),10)||0;
const boardIds=()=>Object.keys(boardsData).sort((a,b)=>bid(a)-bid(b));
function curBoard(){return boardsData[active]||(boardsData[active]={name:'Board '+bid(active),desc:'',cols:state.cols})}
function saveLocal(){try{localStorage.setItem('sceneboard.v2',JSON.stringify({boards:boardsData,cat:state.cat,active}))}catch(e){}}
function persist(catChanged){
  curBoard().cols=state.cols;if(catChanged)dirtyCat=true;
  saveLocal();
  if(mode!=='db')return;
  pending=true;setStatus('saving');clearTimeout(wtimer);wtimer=setTimeout(flush,600);
}
async function flush(){
  if(writing){again=true;return}
  const id=active,b=boardsData[id];if(!b){pending=false;return}
  writing=true;const j=JSON.stringify(b.cols);
  try{
    await boardsRef.doc(id).set({name:b.name,desc:b.desc||'',te:b.te||null,cols:b.cols,order:b.cols.flatMap(c=>c.ids),updated:new Date().toISOString()});
    lastJSON=j;
    if(dirtyCat){await catRef.set({cat:state.cat});dirtyCat=false}
    setStatus('saved',true);
  }catch(e){setStatus('fail')}
  writing=false;pending=false;
  if(again){again=false;persist()}
}
function readBoard(v,id){v=v||{};const o={name:String(v.name||'Board '+bid(id)).slice(0,70),desc:String(v.desc||'').slice(0,400),cols:clean({cols:v.cols}).cols};
  if(v.te&&typeof v.te==='object')o.te={name:String(v.te.name||'').slice(0,80),desc:String(v.te.desc||'').slice(0,500)};return o}
function switchBoard(id){
  if(id===active||!boardsData[id])return;
  if(pending){clearTimeout(wtimer);flush()}
  active=id;state.cols=boardsData[id].cols;lastJSON=JSON.stringify(state.cols);closeDrawer();render();saveLocal();
}
function dupBoard(){
  if(pending){clearTimeout(wtimer);flush()}
  const n=Math.max(0,...boardIds().map(bid))+1,id='b'+n,src=curBoard();
  boardsData[id]={name:'Board '+n,desc:'Copy of '+src.name+'.',cols:JSON.parse(JSON.stringify(src.cols))};
  active=id;state.cols=boardsData[id].cols;lastJSON='';closeDrawer();persist();render();toast('tBoardNew',{n});
}
let delArm=false;
async function delBoard(){
  if(boardIds().length<2){toast('This is the only board. Copy it first if you want to try another order.');return}
  if(!delArm){delArm=true;toast('Click × again to delete “'+curBoard().name+'”');setTimeout(()=>{delArm=false},4000);return}
  delArm=false;
  const id=active,gone=curBoard().name;
  clearTimeout(wtimer);pending=false;
  delete boardsData[id];active=boardIds()[0]||'b1';state.cols=curBoard().cols;lastJSON=JSON.stringify(state.cols);
  closeDrawer();saveLocal();render();
  if(mode==='db'&&boardsRef){try{await boardsRef.doc(id).delete();setStatus('saved',true)}catch(e){setStatus('fail')}}
  toast('Deleted “'+gone+'”');
}
function renderTabs(){
  $('boards').innerHTML=boardIds().map(id=>'<button type="button" data-board="'+id+'" aria-pressed="'+(id===active)+'" title="'+esc(bName(boardsData[id]))+'">'+esc(bName(boardsData[id]))+'</button>').join('')+'<button type="button" class="plus" id="dupboard" title="'+esc(T('copyTip'))+'">'+esc(T('copyBoard'))+'</button>';
  const bn=$('bname');if(document.activeElement!==bn)bn.value=bName(curBoard());
  $('bdesc').textContent=bDesc(curBoard());
}
async function boot(){
  curBoard();applyOv();render();
  let db=null;try{db=await (window.claude&&window.claude.use?window.claude.use('db'):null)}catch(e){}
  try{samp=await (window.claude&&window.claude.use?window.claude.use('sample'):null)}catch(e){samp=null}
  if(samp)render();
  if(!db){
    mode='local';
    try{const r=JSON.parse(localStorage.getItem('sceneboard.v2')||'null');
      if(r&&r.boards){boardsData={};Object.keys(r.boards).forEach(k=>boardsData[k]=readBoard(r.boards[k],k));state.cat=clean({cols:[],cat:r.cat}).cat;active=boardsData[r.active]?r.active:(boardIds()[0]||'b1');state.cols=curBoard().cols}}catch(e){}
    try{const o=JSON.parse(localStorage.getItem('sceneboard.ov')||'null');if(o&&typeof o==='object'){ov=o;applyOv()}}catch(e){}
    setStatus('local');render();return;
  }
  mode='db';boardsRef=db.collection('boards');catRef=db.doc('meta/cats');ovRef=db.collection('scenes');
  const t=setTimeout(()=>{if(!lastJSON)setStatus('slow')},10000);
  catRef.onSnapshot(s=>{
    if(s.exists&&!dirtyCat&&!pending){const c=clean({cols:[],cat:(s.data()||{}).cat}).cat;if(JSON.stringify(c)!==JSON.stringify(state.cat)){state.cat=c;if(!dragging)render()}}
  },()=>{});
  ovRef.onSnapshot(qs=>{
    const next={};qs.docs.forEach(d=>{next[d.id]=d.data()||{}});
    if(JSON.stringify(next)!==JSON.stringify(ov)){ov=next;applyOv();if(!dragging&&!asking)render()}
  },()=>{});
  boardsRef.onSnapshot(qs=>{
    clearTimeout(t);
    const seen={};qs.docs.forEach(d=>{seen[d.id]=readBoard(d.data(),d.id)});
    if(Object.keys(seen).length){if(pending&&boardsData[active])seen[active]=boardsData[active];boardsData=seen}
    if(!boardsData[active])active=boardIds()[0]||'b1';
    const b=curBoard(),j=JSON.stringify(b.cols);
    if(!pending&&!dragging&&j!==lastJSON){state.cols=b.cols;lastJSON=j;render()}else renderTabs();
    if(!pending)setStatus('saved',true);
  },()=>{mode='local';setStatus('local')});
}

/* ---------- render ---------- */
let dragging=false;
function cardHTML(code,pos){
  const s=BY[code],cat=catOf(code);
  const dots=[1,2,3,4,5].map(i=>'<i class="'+(i<=s.tier?'on':'')+'"></i>').join('');
  return '<div class="card" data-c="'+code+'" data-cat="'+cat+'" tabindex="0" role="button" aria-label="'+esc(sc(s,'t'))+', '+catLabel(cat)+'">'+
    (pos?'<span class="pos">'+pos+'</span>':'')+
    '<div class="cb"><div class="top"><span class="code">'+code+'</span><span class="chip">'+catLabel(cat)+'</span>'+(s.ed?'<span class="edflag">edited</span>':'')+'</div>'+
    '<div class="ttl">'+esc(sc(s,'t'))+'</div>'+
    '<div class="meta"><span>'+esc(term('evn',s.evn))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span><span class="dots" title="'+T('tier')+' '+s.tier+'">'+dots+'</span>'+(s.carrier?'<span>'+T('carrier')+'</span>':'')+(s.shots&&s.shots.length?'<span>'+s.shots.length+' shots</span>':'')+'</div></div>'+
    (pos?'':'<button class="add" type="button" data-add="'+code+'" title="'+esc(T('addTip'))+'" aria-label="'+esc(T('addAria'))+'">+</button>')+
    '<button class="more" type="button" data-more="'+code+'" title="More" aria-label="More options">⋯</button></div>';
}
function render(){
  const placed=placedSet();
  // bin
  let list=all().filter(s=>!placed.has(s.c));
  const binTotal=list.length;
  const q=filt.q.trim().toLowerCase();
  list=list.filter(s=>(filt.f==='all'||catOf(s.c)===filt.f)&&(filt.ev==='0'||String(s.ev)===filt.ev)&&(!q||(s.t+' '+s.c+' '+s.pl+' '+s.pov+' '+s.evn+' '+sc(s,'t')+' '+term('pl',s.pl)+' '+term('pov',s.pov)+' '+term('evn',s.evn)).toLowerCase().includes(q)));
  const so={ev:(a,b)=>a.ev-b.ev||a.src.localeCompare(b.src),code:(a,b)=>a.c.localeCompare(b.c),title:(a,b)=>sc(a,'t').localeCompare(sc(b,'t'),isTe()?'te':undefined),tier:(a,b)=>b.tier-a.tier||sc(a,'t').localeCompare(sc(b,'t'),isTe()?'te':undefined)}[filt.sort];
  list.sort(so);
  $('bin').innerHTML=list.length?list.map(s=>cardHTML(s.c)).join(''):'<div class="empty">'+T(binTotal?'noMatch':'allPlaced')+'</div>';
  $('bincount').textContent=T('binCount',{n:list.length,t:binTotal});
  // board
  let n=0;
  $('board').innerHTML=state.cols.map(c=>{
    const mins=c.ids.reduce((a,i)=>a+BY[i].mid,0),note=colNote(c);
    return '<div class="col'+(folded.has(c.id)?' folded':'')+'" data-id="'+esc(c.id)+'"><div class="chead">'+
      '<button class="fold" type="button" data-fold="'+esc(c.id)+'" aria-expanded="'+(!folded.has(c.id))+'" aria-label="Fold or unfold this sequence">'+(folded.has(c.id)?'▸':'▾')+'</button>'+
      '<span class="grip" title="'+esc(T('gripTip'))+'" aria-hidden="true">⠿</span>'+
      '<input class="cname" value="'+esc(colName(c))+'" aria-label="'+esc(T('seqName'))+'" maxlength="60">'+
      '<button class="ebtn" type="button" data-seq="'+esc(c.id)+'" title="Open this sequence (right-click for more)" aria-label="Edit sequence">✎</button>'+
      '<button class="xbtn" type="button" data-del="'+esc(c.id)+'" title="'+esc(T('delTip'))+'" aria-label="'+esc(T('delAria'))+'">×</button></div>'+
      '<div class="cinfo">'+T('colInfo',{n:c.ids.length,w:T(c.ids.length===1?'scene':'scenes'),t:fmtMin(mins)})+'</div>'+
      (note?'<div class="cnote">'+esc(note)+'</div>':'')+
      '<div class="cards">'+c.ids.map(i=>cardHTML(i,++n)).join('')+'</div></div>';
  }).join('')+'<button class="newcol" id="newcol" type="button">'+esc(T('addSeq'))+'</button>';
  renderTabs();stats();bindSortables();
  const ae=document.activeElement;
  if(!(ae&&(ae.id==='edp'||ae.id==='shx'||ae.id==='sht'))){if(openCode)drawer(openCode,true);else if(openSeq)seqDrawer(openSeq,true)}
  if(!$('read').hidden)readThrough(true);
}
function stats(){
  const order=flat();
  $('s-placed').textContent=order.length+'/'+TOTAL;
  $('s-run').textContent='≈ '+fmtMin(order.reduce((a,i)=>a+BY[i].mid,0));
  const d=order.filter(i=>catOf(i)==='D').length;$('s-mix').textContent=d+' · '+(order.length-d);
  let h='';state.cols.forEach(c=>{
    if(!c.ids.length)return;if(h)h+='<i class="gap"></i>';
    c.ids.forEach(i=>{const s=BY[i];h+='<i class="'+catOf(i)+'" data-open="'+i+'" style="flex-grow:'+Math.max(s.mid,.5)+';flex-basis:0" title="'+esc(order.indexOf(i)+1+'. '+sc(s,'t'))+'"></i>'});
  });
  $('strip').innerHTML=h||'<span class="none">'+esc(T('stripNone'))+'</span>';
  let bd=0,ba=0,rd=0,ra=0;order.forEach(i=>{if(catOf(i)==='D'){rd++;ra=0}else{ra++;rd=0}bd=Math.max(bd,rd);ba=Math.max(ba,ra)});
  $('runs').textContent=order.length?T('runs',{d:bd,a:ba}):'';
}

/* ---------- drag and drop ---------- */
function fromDOM(){
  const by={};state.cols.forEach(c=>by[c.id]=c);
  state.cols=[...document.querySelectorAll('#board > .col')].map(el=>{
    const o=by[el.dataset.id]||{id:el.dataset.id,name:'Sequence'};
    o.ids=[...el.querySelectorAll('.card')].map(c=>c.dataset.c);return o});
}
function bindSortables(){
  sortables.forEach(s=>s.destroy());sortables=[];
  const common={group:'scenes',animation:150,ghostClass:'ghost',chosenClass:'chosen',delay:140,delayOnTouchOnly:true,filter:'.add,.more,.fold,.cname,.xbtn,.ebtn',preventOnFilter:false,
    onStart:()=>{dragging=true;hidePeek();hideCtx()},
    onEnd:()=>{dragging=false;fromDOM();persist();setTimeout(render,0)}};
  sortables.push(new Sortable($('bin'),Object.assign({},common,{sort:false})));
  document.querySelectorAll('.cards').forEach(el=>sortables.push(new Sortable(el,common)));
  sortables.push(new Sortable($('board'),{animation:150,draggable:'.col',handle:'.grip',ghostClass:'ghost',filter:'.newcol',
    onStart:()=>{dragging=true;hidePeek();hideCtx()},onEnd:()=>{dragging=false;fromDOM();persist();setTimeout(render,0)}}));
}

/* ---------- editing by prompt ---------- */
let samp=null,asking=null,ctl=null,draft={},edErr='';
const edKey=()=>openCode?(dtab==='shots'?'h:'+openCode:'s:'+openCode):(openSeq?('q:'+openSeq):null);
function reopen(){if(openCode)drawer(openCode,true);else if(openSeq)seqDrawer(openSeq,true)}
function edPanel(key,ph,last,extra){
  const busy=asking===key;
  return '<div class="edwrap"><span class="lab">Edit with a prompt</span>'+
    '<textarea id="edp" rows="3" placeholder="'+esc(ph)+'"'+(busy?' disabled':'')+'>'+esc(draft[key]||'')+'</textarea>'+
    '<div class="acts">'+(busy
      ?'<span class="busy"><i></i><i></i><i></i></span><span class="sub">Claude is writing…</span><button class="btn" id="edstop" type="button">Stop</button>'
      :'<button class="btn pri" id="edgo" type="button">Apply</button>'+(extra||''))+'</div>'+
    (edErr?'<div class="err">'+esc(edErr)+'</div>':'')+
    (last?'<div class="hist">Last instruction: “'+esc(last)+'”</div>':'')+
    '</div>';
}
function msgFor(e){
  const c=e&&e.code;
  if(c==='cancelled')return '';
  if(c==='not_granted')return 'This page is not allowed to use Claude. Reload the page and allow it, then try again.';
  if(c==='rate_limited')return 'Claude is rate limited just now. Try again in a minute.';
  if(c==='invalid_json')return 'Claude did not answer in the shape this tool needs. Try again, or put the instruction more plainly.';
  if(c==='refused')return 'Claude declined that instruction.';
  if(c==='prompt_too_large')return 'That instruction is too long.';
  if(c==='session_expired')return 'Your session expired. Reload the page.';
  if(c==='sampling_disabled'||c==='not_declared'||c==='capability_disabled')return 'Claude is not available in this view, so prompt editing is off.';
  return (e&&e.message)?('Could not edit: '+e.message):'Could not edit. Try again.';
}
const PREM='You are editing the story bible of “The Unseen Sun”, a feature film about Rukmini and Krishna. Rukmini is the protagonist. Krishna is kept off screen until the abduction. The film is told out of chronological order. The writing style is plain, concrete and in the present tense, with no flourish.';
async function askScene(code,prompt){
  const s=BY[code],te=(s.te||TE.sc[code]||{});
  const cur={code:code,title:s.t,what_happens:s.sum,why_it_is_in_the_film:s.why,turn:s.turn||'',as_filmed_in_cg:s.story||'',
    minutes:s.mins,cg_tier:s.tier,rasa:s.rasa,point_of_view:s.pov,place:s.pl,krishna_presence:s.k,
    carrier_scene:!!s.carrier,category:catOf(code)==='A'?'A (action)':'D (drama)',genres:s.gen,
    telugu:{t:te.t||'',sum:te.sum||'',why:te.why||'',turn:te.turn||'',story:te.story||''}};
  const p=PREM+'\n\nYou are editing ONE scene. It belongs to event '+s.ev+' ('+s.evn+'), which cannot change.\n\nThe scene as it stands:\n'+JSON.stringify(cur,null,1)+
   '\n\nThe writer\'s instruction:\n"""'+prompt+'"""\n\nRewrite the scene so it follows the instruction. Keep every field the instruction does not touch exactly as it is now, the Telugu included. "turn" is one sentence. "minutes" looks like "2" or "1–2". "tier" is how heavy the CG is, 1 to 5.\n\n'+
   'Reply with only a JSON object with these keys: t (title, under 70 characters), sum (what happens), why (why it is in the film), turn, story (how it is filmed in CG), mins, tier, rasa, pov, pl (place), k (how much of Krishna is present), carrier (true or false), cat ("D" or "A"), gen (array of 1 to 4 genre names), te (object with t, sum, why, turn, story in Telugu, saying the same as the English). Example of the shape: {"t":"The letter","sum":"…","why":"…","turn":"…","story":"…","mins":"1–2","tier":2,"rasa":"Karuṇa","pov":"Rukmini","pl":"The palace","k":"Not present","carrier":false,"cat":"D","gen":["Drama"],"te":{"t":"…","sum":"…","why":"…","turn":"…","story":"…"}}';
  return await samp.json(p,{signal:ctl.signal,cache:false,modelTier:'default'});
}
function applySceneEdit(code,prompt,r){
  if(!r||typeof r!=='object'||Array.isArray(r))throw new Error('nothing usable came back');
  const o={};
  TXT.forEach(k=>{if(typeof r[k]==='string'&&r[k].trim())o[k]=r[k].trim().slice(0,k==='t'?90:5000)});
  if(Array.isArray(r.gen)&&r.gen.length)o.gen=r.gen.filter(x=>typeof x==='string'&&x.trim()).map(x=>x.trim().slice(0,40)).slice(0,5);
  const t=Number(r.tier);if(isFinite(t)&&t>=1&&t<=5)o.tier=Math.round(t);
  if(typeof r.carrier==='boolean')o.carrier=r.carrier;
  if(r.te&&typeof r.te==='object'){const te={};['t','sum','why','turn','story'].forEach(k=>{if(typeof r.te[k]==='string'&&r.te[k].trim())te[k]=r.te[k].trim().slice(0,5000)});if(Object.keys(te).length)o.te=te}
  if(!Object.keys(o).length)throw new Error('nothing usable came back');
  pushHist(code);
  const prev=ov[code]||{};
  o.prompt=String(prompt).slice(0,400);
  o.updated=new Date().toISOString();
  ov[code]=Object.assign({},prev,o);
  applyOv();
  if(r.cat==='A'||r.cat==='D'){const base=BASE[code].cat;if(r.cat===base)delete state.cat[code];else state.cat[code]=r.cat;persist(true)}
  saveOv(code);
}
async function askShots(code,prompt){
  const s=BY[code];
  const cur={title:s.t,what_happens:s.sum,as_filmed_in_cg:s.story||'',minutes:s.mins,place:s.pl,point_of_view:s.pov,
    krishna_presence:s.k,category:catOf(code)==='A'?'A (action)':'D (drama)',
    shots:(s.shots||[]).map((x,i)=>({n:i+1,type:x.t,text:x.x,telugu:x.te||''}))};
  const p=PREM+'\n\nYou are writing the SHOT LIST for one scene. A shot is one continuous camera take: a shot type (WIDE, CLOSE, INSERT, TRACKING, POV, OVER, AERIAL, TWO-SHOT and so on) and one sentence of what the camera sees and does. Krishna must not be shown more than the scene says he is shown.\n\nThe scene, and its shots as they stand:\n'+JSON.stringify(cur,null,1)+
   '\n\nThe writer\'s instruction:\n"""'+prompt+'"""\n\nReturn the COMPLETE shot list after the instruction, in order, not only the changed shots. Keep the shots the instruction does not touch as they are, Telugu included. Around 1 to 3 shots per minute of screen time.\n\n'+
   'Reply with only a JSON object: {"shots":[{"type":"WIDE","text":"…","te":"…"}]} where "te" is the same line in Telugu.';
  return await samp.json(p,{signal:ctl.signal,cache:false,modelTier:'default'});
}
function applyShotsEdit(code,prompt,r){
  const arr=cleanShots(r&&(r.shots||r.shot_list||(Array.isArray(r)?r:null)));
  if(!arr||!arr.length)throw new Error('no shots came back');
  pushHist(code);
  const prev=ov[code]||{};
  ov[code]=Object.assign({},prev,{shots:arr,shotp:String(prompt).slice(0,400),updated:new Date().toISOString()});
  applyOv();saveOv(code);
}
async function askSeq(col,prompt){
  const scenes=col.ids.map((i,n)=>({n:n+1,code:i,title:BY[i].t,event:BY[i].evn,category:catOf(i)}));
  const cur={name:col.name,story_context:col.note||'',telugu:{name:(col.te&&col.te.name)||'',note:(col.te&&col.te.note)||''},scenes};
  const p=PREM+'\n\nYou are editing ONE sequence of the board: a run of scenes that play together.\n\nThe sequence as it stands:\n'+JSON.stringify(cur,null,1)+
   '\n\nThe writer\'s instruction:\n"""'+prompt+'"""\n\nKeep whatever the instruction does not touch. The story context is 1 to 3 sentences saying what this run of scenes does in the film.\n\n'+
   'Reply with only a JSON object with these keys: name (under 60 characters), note (the story context, may be ""), te (object with name and note in Telugu), and order (optional: the scene codes of this sequence in a new order — include every one of them exactly once, and leave the key out unless the instruction asks for a reorder). Example of the shape: {"name":"Ink","note":"…","te":{"name":"…","note":"…"},"order":["S-101","S-102"]}';
  return await samp.json(p,{signal:ctl.signal,cache:false,modelTier:'default'});
}
function applySeqEdit(col,prompt,r){
  if(!r||typeof r!=='object'||Array.isArray(r))throw new Error('nothing usable came back');
  let touched=false;
  if(typeof r.name==='string'&&r.name.trim()){col.name=r.name.trim().slice(0,60);touched=true}
  if(typeof r.note==='string'){col.note=r.note.trim().slice(0,600);touched=true}
  if(r.te&&typeof r.te==='object'){col.te=col.te||{};
    if(typeof r.te.name==='string'&&r.te.name.trim()){col.te.name=r.te.name.trim().slice(0,80);touched=true}
    if(typeof r.te.note==='string'){col.te.note=r.te.note.trim().slice(0,700);touched=true}}
  if(Array.isArray(r.order)){
    const have=new Set(col.ids),out=[];
    r.order.forEach(x=>{if(typeof x==='string'&&have.has(x)&&out.indexOf(x)<0)out.push(x)});
    if(out.length===col.ids.length){col.ids=out;touched=true}
  }
  if(!touched)throw new Error('nothing usable came back');
  col.lastp=String(prompt).slice(0,400);
  persist();
}
async function runEdit(){
  const key=edKey();if(!key||asking)return;
  const txt=(draft[key]||'').trim();
  edErr='';
  if(!txt){edErr='Type what you want changed first.';reopen();return}
  if(!samp){edErr='Claude is not available in this view, so prompt editing is off.';reopen();return}
  asking=key;ctl=new AbortController();reopen();
  const kind=key.charAt(0),id=key.slice(2);
  try{
    if(kind==='s'){const r=await askScene(id,txt);applySceneEdit(id,txt,r);draft[key]='';asking=null;render();toast('Scene rewritten')}
    else if(kind==='h'){const r=await askShots(id,txt);applyShotsEdit(id,txt,r);draft[key]='';asking=null;render();toast('Shot list updated')}
    else{const col=state.cols.find(c=>c.id===id);if(!col)throw new Error('that sequence is gone');
      const r=await askSeq(col,txt);applySeqEdit(col,txt,r);draft[key]='';asking=null;render();toast('Sequence updated')}
  }catch(e){asking=null;edErr=msgFor(e);reopen()}
}
function renameScene(code,v){
  v=String(v||'').trim().slice(0,90);if(!v)return;
  const s=BY[code];if(v===sc(s,'t'))return;
  pushHist(code);
  const prev=ov[code]||{},o={updated:new Date().toISOString(),prompt:'Renamed by hand'};
  if(isTe()){o.te=Object.assign({},prev.te||s.te||{},{t:v})}else o.t=v;
  ov[code]=Object.assign({},prev,o);
  applyOv();saveOv(code);render();toast('Renamed');
}
function restoreVersion(code,i){
  const h=(ov[code]&&ov[code].hist)||[];const v=h[i];if(!v)return;
  pushHist(code);
  const prev=ov[code]||{};
  const next={hist:ov[code].hist,prompt:(v.base?'Put back as it was originally':'Restored the version of '+when(v.at)),updated:new Date().toISOString()};
  if(prev.shots)next.shots=prev.shots;
  if(prev.shotp)next.shotp=prev.shotp;
  if(!v.base){
    SNAP.forEach(k=>{if(typeof v[k]==='string'&&v[k].trim())next[k]=v[k]});
    if(Array.isArray(v.gen))next.gen=v.gen;
    if(typeof v.tier==='number')next.tier=v.tier;
    if(typeof v.carrier==='boolean')next.carrier=v.carrier;
    if(v.te)next.te=v.te;
  }
  if(v.shots)next.shots=v.shots;
  ov[code]=next;applyOv();saveOv(code);render();toast('Restored');
}
/* ---------- shots by hand ---------- */
let shotEdit=null;
function setShots(code,arr,msg){
  const prev=ov[code]||{};
  const a=cleanShots(arr)||[];
  if(a.length)ov[code]=Object.assign({},prev,{shots:a,updated:new Date().toISOString()});
  else{const n=Object.assign({},prev);delete n.shots;ov[code]=n}
  applyOv();saveOv(code);render();if(msg)toast(msg);
}
function moveShot(code,i,d){
  const a=(BY[code].shots||[]).slice(),j=i+d;
  if(j<0||j>=a.length)return;const t=a[i];a[i]=a[j];a[j]=t;setShots(code,a);
}

/* ---------- diff ---------- */
function diffWords(a,b){
  const A=String(a==null?'':a).split(/(\s+)/),B=String(b==null?'':b).split(/(\s+)/);
  const n=A.length,m=B.length;
  if(n*m>400000||!n||!m)return [[a===b?'=':'~',b]];
  const w=m+1,dp=new Uint16Array((n+1)*w);
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i*w+j]=A[i]===B[j]?Math.min(65535,dp[(i+1)*w+j+1]+1):Math.max(dp[(i+1)*w+j],dp[i*w+j+1]);
  const out=[];let i=0,j=0;
  while(i<n&&j<m){
    if(A[i]===B[j]){out.push(['=',A[i]]);i++;j++}
    else if(dp[(i+1)*w+j]>=dp[i*w+j+1]){out.push(['-',A[i]]);i++}
    else{out.push(['+',B[j]]);j++}
  }
  while(i<n)out.push(['-',A[i++]]);
  while(j<m)out.push(['+',B[j++]]);
  return out;
}
const diffHTML=(a,b)=>diffWords(a,b).map(p=>{
  const k=p[0],t=esc(p[1]);
  return k==='-'?'<del>'+t+'</del>':k==='+'?'<ins>'+t+'</ins>':k==='~'?'<ins>'+t+'</ins>':t;
}).join('');

/* ---------- drawer ---------- */
let dtab='scene';
function where(code){for(let ci=0;ci<state.cols.length;ci++){const i=state.cols[ci].ids.indexOf(code);if(i>=0)return {ci,i}}return null}
function srcHTML(code){
  const r=SRC[code];if(!r)return '';
  const body=r.u
    ? 'Follows <a href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.c)+'</a> ('+esc(r.k)+').'+(r.n?' Note: '+esc(r.n)+'.':'')
    : esc(r.c)+' ('+esc(r.k)+'): this scene is not in the texts.'+(r.n?' '+esc(r.n)+'.':'');
  return '<details class="srcd"><summary>Where this comes from</summary><div class="sbody">'+body+'</div></details>';
}
function shotsHTML(code){
  const s=BY[code],shots=s.shots||[];
  let h='<div class="acts"><button class="btn" id="addshot" type="button">Add a shot</button>'+
    (shots.length?'<span class="sub">'+shots.length+' '+(shots.length===1?'shot':'shots')+'</span>':'<span class="sub">No shots yet</span>')+'</div>';
  h+=shots.map((x,i)=>{
    if(shotEdit===i)return '<div class="sform"><input id="sht" value="'+esc(x.t)+'" maxlength="16" placeholder="WIDE" aria-label="Shot type">'+
      '<textarea id="shx" rows="3" placeholder="What the camera sees and does">'+esc(x.x)+'</textarea>'+
      '<div class="acts"><button class="btn pri" type="button" data-shsave="'+i+'">Save</button><button class="btn" type="button" data-shcancel="1">Cancel</button></div></div>';
    return '<div class="shot"><span class="n">'+(i+1)+'</span><div class="sb"><span class="st">'+esc(x.t)+'</span>'+
      '<div class="sx">'+esc(shotText(x))+'</div></div>'+
      '<div class="sa"><button type="button" data-shup="'+i+'" title="Move up" aria-label="Move up">↑</button>'+
      '<button type="button" data-shdn="'+i+'" title="Move down" aria-label="Move down">↓</button>'+
      '<button type="button" data-shed="'+i+'" title="Edit" aria-label="Edit">✎</button>'+
      '<button type="button" data-shdel="'+i+'" title="Delete" aria-label="Delete">×</button></div></div>';
  }).join('');
  if(shotEdit===-1)h+='<div class="sform"><input id="sht" value="" maxlength="16" placeholder="WIDE" aria-label="Shot type">'+
    '<textarea id="shx" rows="3" placeholder="What the camera sees and does"></textarea>'+
    '<div class="acts"><button class="btn pri" type="button" data-shsave="-1">Save</button><button class="btn" type="button" data-shcancel="1">Cancel</button></div></div>';
  if(samp)h+=edPanel('h:'+code,shots.length?'e.g. make shot 3 a close-up on her hands · add a shot of the door before the last one':'e.g. break this into 6 shots, open on the lamp and end on her face',(ov[code]&&ov[code].shotp)||'');
  return h;
}
let histSel=0;
function histHTML(code){
  const s=BY[code],h=s.hist||[];
  if(!h.length)return '<div class="hist">This scene has not been changed yet. Every edit from here on is kept, with the earlier wording beside the new one.</div>';
  const sel=Math.min(histSel,h.length-1),v=h[sel];
  const rows='<div class="acts" style="flex-direction:column;align-items:stretch;gap:6px">'+h.map((x,i)=>
    '<button class="vrow" type="button" data-ver="'+i+'" aria-pressed="'+(i===sel)+'"><span class="vt"><b>'+(x.base?'The original':esc(x.t||'Earlier version'))+'</b>'+
    '<span>'+esc(when(x.at))+(x.prompt?' · “'+esc(x.prompt)+'”':'')+'</span></span></button>').join('')+'</div>';
  const F=[['t','Title'],['sum',T('hWhat')],['story',T('hCG')],['why',T('hWhy')],['turn',T('hTurn')]];
  let d='';
  F.forEach(f=>{
    const a=v[f[0]]||'',b=s[f[0]]||'';
    if(!a&&!b)return;
    d+='<div class="dfield"><h5>'+esc(f[1])+'</h5><div>'+(a===b?esc(b)+' <span class="sub">(unchanged)</span>':diffHTML(a,b))+'</div></div>';
  });
  const meta=[];
  if((v.mins||'')!==s.mins)meta.push('runtime '+esc(v.mins||'—')+' → '+esc(s.mins));
  if(v.tier!==s.tier)meta.push('CG tier '+v.tier+' → '+s.tier);
  if((v.pl||'')!==s.pl)meta.push('place '+esc(v.pl||'—')+' → '+esc(s.pl));
  if((v.pov||'')!==s.pov)meta.push('point of view '+esc(v.pov||'—')+' → '+esc(s.pov));
  if((v.rasa||'')!==s.rasa)meta.push('rasa '+esc(v.rasa||'—')+' → '+esc(s.rasa));
  if((v.k||'')!==s.k)meta.push('Krishna '+esc(v.k||'—')+' → '+esc(s.k));
  if((v.shots||[]).length!==(s.shots||[]).length)meta.push('shots '+(v.shots||[]).length+' → '+(s.shots||[]).length);
  return rows+
    '<div class="sub" style="margin-top:4px">Red is what that version said; green is what it says now.</div>'+
    d+(meta.length?'<div class="hist">'+meta.join(' · ')+'</div>':'')+
    '<div class="acts"><button class="btn pri" type="button" data-restore="'+sel+'">Restore this version</button></div>';
}
function drawer(code,keep){
  const s=BY[code];if(!s)return;
  if(openCode!==code){dtab='scene';histSel=0;shotEdit=null}
  openCode=code;openSeq=null;
  const w=where(code),cat=catOf(code),order=flat();
  const colOpts=state.cols.map((c,i)=>'<option value="'+i+'"'+(w&&w.ci===i?' selected':'')+'>'+esc(colName(c))+'</option>').join('');
  const tabs='<div class="dtabs" role="tablist">'+
    [['scene','Scene'],['shots','Shots'+(s.shots&&s.shots.length?' ('+s.shots.length+')':'')],['hist','History'+(s.hist&&s.hist.length?' ('+s.hist.length+')':'')]]
    .map(t=>'<button type="button" role="tab" data-dtab="'+t[0]+'" aria-selected="'+(dtab===t[0])+'">'+t[1]+'</button>').join('')+'</div>';
  let body='';
  if(dtab==='shots')body=shotsHTML(code);
  else if(dtab==='hist')body=histHTML(code);
  else body=
   '<div class="acts"><div class="seg" role="group" aria-label="'+esc(T('category'))+'"><button type="button" data-setcat="D" aria-pressed="'+(cat==='D')+'">'+T('catD')+'</button><button type="button" data-setcat="A" aria-pressed="'+(cat==='A')+'">'+T('catA')+'</button></div>'+
   (w?'<button class="btn" type="button" data-mv="-1">'+T('earlier')+'</button><button class="btn" type="button" data-mv="1">'+T('later')+'</button><button class="btn" type="button" data-unplace="1">'+T('toBin')+'</button>'
     :'<select id="dcol" aria-label="'+esc(T('sequence'))+'">'+colOpts+'</select><button class="btn pri" type="button" data-place="1">'+T('addToSeq')+'</button>')+'</div>'+
   (w?'<div class="acts"><label for="dcol2" class="sub">'+T('moveTo')+'</label><select id="dcol2">'+colOpts+'</select></div>':'')+
   (samp?edPanel('s:'+code,'e.g. make the turn land harder and cut it to one minute · give her the last line · move it to night',s.lastp||''):'')+
   '<div><h4>'+T('hWhat')+'</h4><p>'+esc(sc(s,'sum'))+'</p></div>'+
   (s.story?'<div><h4>'+T('hCG')+'</h4><p>'+esc(sc(s,'story'))+'</p></div>':'')+
   '<div><h4>'+T('hWhy')+'</h4><p>'+esc(sc(s,'why'))+'</p></div>'+
   (s.turn?'<div><h4>'+T('hTurn')+'</h4><p>'+esc(sc(s,'turn'))+'</p></div>':'')+
   '<dl class="kv"><dt>'+T('kEvent')+'</dt><dd>'+esc(term('evn',s.evn))+' ('+s.src+')</dd><dt>'+T('kPlace')+'</dt><dd>'+esc(term('pl',s.pl))+'</dd><dt>'+T('kPov')+'</dt><dd>'+esc(term('pov',s.pov))+'</dd><dt>'+T('kKrishna')+'</dt><dd>'+esc(term('k',s.k))+'</dd><dt>'+T('kRasa')+'</dt><dd>'+esc(term('rasa',s.rasa))+'</dd><dt>'+T('kRun')+'</dt><dd>'+esc(s.mins)+' '+T('min')+'</dd><dt>'+T('kTier')+'</dt><dd>'+T('tierOf',{t:s.tier})+'</dd></dl>'+
   '<div><h4>'+T('hGenres')+'</h4><div class="tags">'+s.gen.map(g=>'<span>'+esc(term('gen',g))+'</span>').join('')+'</div></div>'+
   srcHTML(code);
  $('drawer').innerHTML=
   '<div class="dh"><div><div class="top"><span class="code">'+code+'</span><span class="chip" style="'+(cat==='A'?'background:var(--action-bg);color:var(--action)':'')+'">'+catLabel(cat)+'</span>'+(s.ed?'<span class="edflag">edited</span>':'')+'</div><h3>'+esc(sc(s,'t'))+'</h3>'+
   '<div class="sub">'+(w?esc(T('pos',{p:order.indexOf(code)+1,n:order.length,s:colName(state.cols[w.ci])})):esc(T('inBin')))+'</div></div><button class="btn" id="dclose" type="button">'+esc(T('close'))+'</button></div>'+
   tabs+body;
  $('drawer').hidden=false;$('veil').hidden=false;
  if(!keep)$('dclose').focus();
}
function seqDrawer(id,keep){
  const col=state.cols.find(c=>c.id===id);if(!col){closeDrawer();return}
  openSeq=id;openCode=null;
  const mins=col.ids.reduce((a,i)=>a+BY[i].mid,0),note=colNote(col);
  const shots=col.ids.reduce((a,i)=>a+((BY[i].shots||[]).length),0);
  const list=col.ids.length
    ? col.ids.map((i,n)=>'<div class="hist"><b class="mono">'+(n+1)+'. '+i+'</b> · '+esc(sc(BY[i],'t'))+' · '+catLabel(catOf(i))+((BY[i].shots||[]).length?' · '+BY[i].shots.length+' shots':'')+'</div>').join('')
    : '<div class="hist">No scenes here yet.</div>';
  $('drawer').innerHTML=
   '<div class="dh"><div><div class="top"><span class="code">SEQUENCE</span></div><h3>'+esc(colName(col))+'</h3>'+
   '<div class="sub">'+col.ids.length+' '+T(col.ids.length===1?'scene':'scenes')+' · ≈ '+fmtMin(mins)+(shots?' · '+shots+' shots':'')+'</div></div><button class="btn" id="dclose" type="button">'+esc(T('close'))+'</button></div>'+
   (note?'<div><h4>Story context</h4><p>'+esc(note)+'</p></div>':'')+
   (samp?edPanel('q:'+id,'e.g. call it “Ink and the letter” and say in two lines what it does in the story · put the night scenes last',col.lastp||''):'')+
   '<div><h4>Scenes in order</h4>'+list+'</div>';
  $('drawer').hidden=false;$('veil').hidden=false;
  if(!keep)$('dclose').focus();
}
function closeDrawer(){
  if(asking&&ctl){ctl.abort();asking=null}
  openCode=null;openSeq=null;edErr='';shotEdit=null;$('drawer').hidden=true;$('veil').hidden=true;
}
function place(code,ci,at){
  if(!state.cols.length)state.cols.push({id:'c'+Date.now(),name:'Sequence A',ids:[]});
  ci=Math.max(0,Math.min(ci,state.cols.length-1));
  const w=where(code);if(w)state.cols[w.ci].ids.splice(w.i,1);
  const ids=state.cols[ci].ids;ids.splice(at==null?ids.length:at,0,code);
}
function move(code,d){
  const w=where(code);if(!w)return;const ids=state.cols[w.ci].ids,t=w.i+d;
  if(t>=0&&t<ids.length){const x=ids[w.i];ids[w.i]=ids[t];ids[t]=x}
  else if(d<0&&w.ci>0){ids.splice(w.i,1);state.cols[w.ci-1].ids.push(code)}
  else if(d>0&&w.ci<state.cols.length-1){ids.splice(w.i,1);state.cols[w.ci+1].ids.unshift(code)}
}

/* ---------- read-through ---------- */
function readThrough(keep){
  const order=flat();
  const b=curBoard();
  let n=0,h='<div class="rbar"><span class="rstat">'+order.length+' '+T(order.length===1?'scene':'scenes')+' · ≈ '+fmtMin(order.reduce((a,i)=>a+BY[i].mid,0))+'</span>'+
    '<button class="btn" id="rprint" type="button">Print</button><button class="btn" id="rclose" type="button">Close</button></div>'+
    '<div class="rwrap"><h1>'+esc(bName(b))+'</h1>'+(bDesc(b)?'<div class="rdesc">'+esc(bDesc(b))+'</div>':'');
  if(!order.length)h+='<p class="rdesc">Nothing is on this board yet.</p>';
  state.cols.forEach(c=>{
    if(!c.ids.length)return;
    const mins=c.ids.reduce((a,i)=>a+BY[i].mid,0);
    h+='<div class="rseq"><h2>'+esc(colName(c))+'</h2><div class="rstat">'+c.ids.length+' '+T(c.ids.length===1?'scene':'scenes')+' · ≈ '+fmtMin(mins)+'</div>'+
      (colNote(c)?'<div class="rnote">'+esc(colNote(c))+'</div>':'')+'</div>';
    c.ids.forEach(i=>{
      const s=BY[i];n++;
      h+='<div class="rsc"><div class="rh"><span>'+n+'</span><span>'+i+'</span><span>'+catLabel(catOf(i)).toUpperCase()+'</span><span>'+esc(term('pl',s.pl))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span></div>'+
        '<h3>'+esc(sc(s,'t'))+'</h3>'+
        '<p>'+esc(sc(s,'sum'))+'</p>'+
        (s.story?'<p class="rcg">'+esc(sc(s,'story'))+'</p>':'')+
        (s.turn?'<p class="rcg"><b>'+T('hTurn')+'</b> — '+esc(sc(s,'turn'))+'</p>':'')+
        ((s.shots&&s.shots.length)?'<ul class="rshots">'+s.shots.map((x,k)=>'<li><b>'+(k+1)+' · '+esc(x.t)+'</b> — '+esc(shotText(x))+'</li>').join('')+'</ul>':'')+
        '</div>';
    });
  });
  h+='</div>';
  $('read').innerHTML=h;$('read').hidden=false;document.body.classList.add('reading');
  if(!keep)$('read').scrollTop=0;
}
function closeRead(){$('read').hidden=true;$('read').innerHTML='';document.body.classList.remove('reading')}

/* ---------- context menu ---------- */
let ctxFor=null;
function hideCtx(){const c=$('ctx');if(!c.hidden){c.hidden=true;c.innerHTML=''}ctxFor=null}
function showCtx(x,y,html,kind,id){
  const c=$('ctx');c.innerHTML=html;c.hidden=false;ctxFor={kind,id};
  const r=c.getBoundingClientRect();
  c.style.left=Math.max(6,Math.min(x,innerWidth-r.width-6))+'px';
  c.style.top=Math.max(6,Math.min(y,innerHeight-r.height-6))+'px';
}
function ctxScene(code,x,y){
  const s=BY[code],w=where(code),cat=catOf(code),r=SRC[code];
  const h='<div class="ch">'+esc(sc(s,'t'))+'</div>'+
    '<button type="button" data-cx="open">Open scene</button>'+
    '<button type="button" data-cx="rename">Rename…</button>'+
    (samp?'<button type="button" data-cx="prompt">Edit with a prompt…</button>':'')+
    '<button type="button" data-cx="shots">Shots'+((s.shots&&s.shots.length)?' ('+s.shots.length+')':'')+'…</button>'+
    '<button type="button" data-cx="hist">History'+((s.hist&&s.hist.length)?' ('+s.hist.length+')':'')+'…</button><hr>'+
    '<button type="button" data-cx="cat">Make it '+(cat==='A'?T('catD'):T('catA'))+'</button>'+
    (w?'<button type="button" data-cx="up">Move earlier</button><button type="button" data-cx="down">Move later</button><button type="button" data-cx="bin">Return to the bin</button>'
      :'<button type="button" data-cx="add">Add to the last sequence</button>')+'<hr>'+
    '<button type="button" data-cx="copy">Copy the code ('+code+')</button>'+
    (r&&r.u?'<button type="button" data-cx="src">Open the source ↗</button>':'');
  showCtx(x,y,h,'scene',code);
}
function ctxSeq(id,x,y){
  const col=state.cols.find(c=>c.id===id);if(!col)return;
  const h='<div class="ch">'+esc(colName(col))+'</div>'+
    '<button type="button" data-cx="open">Open sequence</button>'+
    '<button type="button" data-cx="rename">Rename…</button>'+
    (samp?'<button type="button" data-cx="prompt">Edit with a prompt…</button>':'')+
    '<button type="button" data-cx="read">Read this sequence</button><hr>'+
    '<button type="button" data-cx="after">Add a sequence after this</button>'+
    '<button type="button" data-cx="del">Delete the sequence</button>';
  showCtx(x,y,h,'seq',id);
}
function ctxRename(cur){
  const c=$('ctx');
  c.innerHTML='<div class="ch">Rename</div><input id="ctxin" value="'+esc(cur)+'" maxlength="90"><div class="acts" style="padding:6px 4px 2px"><button class="btn pri" type="button" data-cx="rsave">Save</button><button class="btn" type="button" data-cx="rcancel">Cancel</button></div>';
  const i=$('ctxin');i.focus();i.select();
}

/* ---------- hover preview ---------- */
let peekT=null,peekFor=null,peekArm=null;
function hidePeek(){clearTimeout(peekT);peekT=null;peekFor=null;peekArm=null;$('peek').hidden=true}
function showPeek(code,el){
  const s=BY[code];if(!s)return;
  const sh=(s.shots||[]).slice(0,3);
  $('peek').innerHTML='<div class="pm"><span>'+code+'</span><span>'+catLabel(catOf(code)).toUpperCase()+'</span><span>'+esc(term('evn',s.evn))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span></div>'+
    '<h4>'+esc(sc(s,'t'))+'</h4>'+
    '<p>'+esc(sc(s,'sum'))+'</p>'+
    (s.turn?'<p><span class="pl">'+T('hTurn')+'</span><br>'+esc(sc(s,'turn'))+'</p>':'')+
    '<p><span class="pl">'+T('hWhy')+'</span><br>'+esc(sc(s,'why'))+'</p>'+
    '<p class="pm"><span>'+esc(term('pl',s.pl))+'</span><span>'+T('kPov')+': '+esc(term('pov',s.pov))+'</span><span>'+T('kKrishna')+': '+esc(term('k',s.k))+'</span></p>'+
    (sh.length?'<p><span class="pl">Shots</span><br>'+sh.map((x,i)=>(i+1)+' · '+esc(x.t)+' — '+esc(shotText(x))).join('<br>')+((s.shots.length>3)?'<br>+'+(s.shots.length-3)+' more':'')+'</p>':'');
  const p=$('peek');p.hidden=false;
  const r=el.getBoundingClientRect(),b=p.getBoundingClientRect();
  let x=r.right+10;if(x+b.width>innerWidth-8)x=Math.max(8,r.left-b.width-10);
  let y=r.top;if(y+b.height>innerHeight-8)y=Math.max(8,innerHeight-b.height-8);
  p.style.left=x+'px';p.style.top=y+'px';
  peekFor=code;
}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const t=e.target;
  if(!t.closest('#ctx'))hideCtx();
  const add=t.closest('[data-add]');if(add){place(add.dataset.add,state.cols.length-1);persist();render();toast('tAdded',{s:colName(state.cols[state.cols.length-1])});return}
  const mo=t.closest('[data-more]');if(mo){const r=mo.getBoundingClientRect();hidePeek();ctxScene(mo.dataset.more,r.left-4,r.bottom+4);return}
  const fo=t.closest('[data-fold]');if(fo){toggleFold(fo.dataset.fold);return}
  const sq=t.closest('[data-seq]');if(sq){
    if(isMob()){const r=sq.getBoundingClientRect();ctxSeq(sq.dataset.seq,r.left-150,r.bottom+4)}else seqDrawer(sq.dataset.seq);return}
  const del=t.closest('[data-del]');if(del){delSeq(del.dataset.del);return}
  if(t.id==='newcol'){addSeq();return}
  if(t.id==='delboard'){delBoard();return}
  const bt=t.closest('[data-board]');if(bt){switchBoard(bt.dataset.board);return}
  if(t.id==='dupboard'){dupBoard();return}
  if(t.id==='btn-read'){readThrough();return}
  if(t.id==='rclose'){closeRead();return}
  if(t.id==='rprint'){window.print();return}
  const op=t.closest('[data-open]');if(op){drawer(op.dataset.open);return}
  if(t.closest('#ctx')){
    const b=t.closest('button[data-cx]');if(!b||!ctxFor)return;
    const a=b.dataset.cx,k=ctxFor.kind,id=ctxFor.id;
    if(a==='rename'){ctxRename(k==='scene'?sc(BY[id],'t'):colName(state.cols.find(c=>c.id===id)||{name:''}));return}
    if(a==='rcancel'){hideCtx();return}
    if(a==='rsave'){const v=$('ctxin').value;hideCtx();if(k==='scene')renameScene(id,v);else renameSeq(id,v);return}
    hideCtx();
    if(k==='scene'){
      if(a==='open'){drawer(id)}
      else if(a==='prompt'){dtab='scene';drawer(id);const p=$('edp');if(p){p.focus()}}
      else if(a==='shots'){drawer(id);dtab='shots';drawer(id,true)}
      else if(a==='hist'){drawer(id);dtab='hist';drawer(id,true)}
      else if(a==='cat'){const n=catOf(id)==='A'?'D':'A';if(n===BASE[id].cat)delete state.cat[id];else state.cat[id]=n;persist(true);render()}
      else if(a==='up'){move(id,-1);persist();render()}
      else if(a==='down'){move(id,1);persist();render()}
      else if(a==='bin'){const w=where(id);if(w){state.cols[w.ci].ids.splice(w.i,1);persist();render()}}
      else if(a==='add'){place(id,state.cols.length-1);persist();render()}
      else if(a==='copy'){navigator.clipboard&&navigator.clipboard.writeText(id).then(()=>toast('Copied '+id),()=>{})}
      else if(a==='src'){const r=SRC[id];if(r&&r.u)window.open(r.u,'_blank','noopener')}
    }else{
      if(a==='open'){seqDrawer(id)}
      else if(a==='prompt'){seqDrawer(id);const p=$('edp');if(p)p.focus()}
      else if(a==='read'){readSeq(id)}
      else if(a==='after'){addSeq(id)}
      else if(a==='del'){delSeq(id)}
    }
    return;
  }
  if(t.closest('#drawer')){
    const b=t.closest('button');if(!b)return;
    if(b.id==='dclose'){closeDrawer();return}
    if(b.dataset.dtab){dtab=b.dataset.dtab;shotEdit=null;edErr='';reopen();return}
    if(b.id==='edgo'){runEdit();return}
    if(b.id==='edstop'){if(ctl)ctl.abort();return}
    if(b.id==='addshot'){shotEdit=-1;reopen();const x=$('shx');if(x)x.focus();return}
    if(b.dataset.shsave!=null){
      const i=+b.dataset.shsave,type=$('sht').value,txt=$('shx').value;
      const a=(BY[openCode].shots||[]).slice();
      if(i<0)a.push({t:type,x:txt});else a[i]=Object.assign({},a[i],{t:type,x:txt,te:''});
      shotEdit=null;setShots(openCode,a,i<0?'Shot added':'Shot saved');return;
    }
    if(b.dataset.shcancel){shotEdit=null;reopen();return}
    if(b.dataset.shed!=null){shotEdit=+b.dataset.shed;reopen();const x=$('shx');if(x)x.focus();return}
    if(b.dataset.shdel!=null){const a=(BY[openCode].shots||[]).slice();a.splice(+b.dataset.shdel,1);shotEdit=null;setShots(openCode,a,'Shot deleted');return}
    if(b.dataset.shup!=null){moveShot(openCode,+b.dataset.shup,-1);return}
    if(b.dataset.shdn!=null){moveShot(openCode,+b.dataset.shdn,1);return}
    if(b.dataset.ver!=null){histSel=+b.dataset.ver;reopen();return}
    if(b.dataset.restore!=null){restoreVersion(openCode,+b.dataset.restore);return}
    if(b.dataset.setcat){const c=openCode;if(b.dataset.setcat===BASE[c].cat)delete state.cat[c];else state.cat[c]=b.dataset.setcat;persist(true);render();return}
    if(b.dataset.mv){move(openCode,+b.dataset.mv);persist();render();return}
    if(b.dataset.unplace){const w=where(openCode);if(w)state.cols[w.ci].ids.splice(w.i,1);persist();render();return}
    if(b.dataset.place){place(openCode,+$('dcol').value);persist();render();return}
    return;
  }
  if(t===$('veil')){closeDrawer();return}
  const card=t.closest('.card');if(card&&!t.closest('button')){hidePeek();drawer(card.dataset.c)}
});
function addSeq(afterId){
  const c={id:'c'+Date.now(),name:'Sequence '+(state.cols.length+1),ids:[]};
  const i=afterId?state.cols.findIndex(x=>x.id===afterId):-1;
  if(i>=0)state.cols.splice(i+1,0,c);else state.cols.push(c);
  persist();render();const bw=$('boardwrap');if(i<0)bw.scrollLeft=bw.scrollWidth;
}
function delSeq(id){
  const i=state.cols.findIndex(c=>c.id===id);if(i<0)return;
  const n=state.cols[i].ids.length;
  if(openSeq===id)closeDrawer();
  state.cols.splice(i,1);persist();render();
  toast(n?'tReturned':'tSeqDel',{n,w:T(n===1?'scene':'scenes')});
}
function renameSeq(id,v){
  const c=state.cols.find(x=>x.id===id);if(!c)return;
  v=String(v||'').trim().slice(0,60);if(!v||v===colName(c))return;
  if(isTe()){c.te=c.te||{};c.te.name=v}else c.name=v;
  persist();render();toast('Renamed');
}
function readSeq(id){
  const c=state.cols.find(x=>x.id===id);if(!c)return;
  const keep=state.cols;state.cols=[c];readThrough();state.cols=keep;
}
document.addEventListener('contextmenu',e=>{
  const card=e.target.closest('.card');
  const col=e.target.closest('.col');
  if(card){e.preventDefault();hidePeek();ctxScene(card.dataset.c,e.clientX,e.clientY);return}
  if(col){e.preventDefault();hidePeek();ctxSeq(col.dataset.id,e.clientX,e.clientY)}
});
document.addEventListener('input',e=>{
  if(e.target.id==='edp'){const k=edKey();if(k)draft[k]=e.target.value}
});
document.addEventListener('change',e=>{
  if(e.target.id==='bname'){const v=e.target.value.trim();if(v!==bName(curBoard())){if(isTe()){curBoard().te=curBoard().te||{};curBoard().te.name=v}else curBoard().name=v||('Board '+bid(active));persist()}renderTabs()}
  if(e.target.id==='dcol2'){place(openCode,+e.target.value);persist();render()}
  if(e.target.classList.contains('cname')){const id=e.target.closest('.col').dataset.id;renameSeq(id,e.target.value)}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    if(!$('ctx').hidden){hideCtx();return}
    if(!$('peek').hidden){hidePeek();return}
    if(!$('read').hidden){closeRead();return}
    if(openCode||openSeq){closeDrawer();return}
  }
  if(e.target.id==='ctxin'){if(e.key==='Enter'){const v=e.target.value,f=ctxFor;hideCtx();if(f){if(f.kind==='scene')renameScene(f.id,v);else renameSeq(f.id,v)}}return}
  if(e.target.id==='edp'){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();runEdit()}return}
  if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('card')){e.preventDefault();drawer(e.target.dataset.c)}
  if(e.key==='Enter'&&e.target.classList&&e.target.classList.contains('cname'))e.target.blur();
});
document.addEventListener('mouseover',e=>{
  if(isMob())return;
  const card=e.target.closest('.card');
  if(!card){return}
  const code=card.dataset.c;
  if(peekFor===code||peekArm===code)return;
  clearTimeout(peekT);$('peek').hidden=true;peekFor=null;peekArm=code;
  peekT=setTimeout(()=>{
    peekArm=null;
    if(dragging||!$('ctx').hidden||!$('read').hidden)return;
    if(!document.body.contains(card))return;
    if(!card.matches(':hover'))return;
    showPeek(code,card);
  },5000);
});
document.addEventListener('mouseout',e=>{
  const card=e.target.closest('.card');
  if(card&&!(e.relatedTarget&&e.relatedTarget.closest&&e.relatedTarget.closest('.card')===card))hidePeek();
});
document.addEventListener('mousedown',()=>{hidePeek()},true);
document.addEventListener('scroll',()=>{hidePeek();hideCtx()},true);
window.addEventListener('resize',()=>{
  hidePeek();hideCtx();
  if(!viewPinned){const v=autoView();if(v!==view){view=v;applyView();applyStatic();render()}}
});
document.querySelectorAll('#viewseg [data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('q').addEventListener('input',e=>{filt.q=e.target.value;render()});
$('evf').addEventListener('change',e=>{filt.ev=e.target.value;render()});
$('sortf').addEventListener('change',e=>{filt.sort=e.target.value;render()});
document.querySelectorAll('.seg [data-f]').forEach(b=>b.addEventListener('click',()=>{filt.f=b.dataset.f;document.querySelectorAll('.seg [data-f]').forEach(x=>x.setAttribute('aria-pressed',x===b));render()}));
function tab(n){document.querySelector('main').dataset.tab=n;$('tab-bin').setAttribute('aria-selected',n==='bin');$('tab-board').setAttribute('aria-selected',n==='board')}
$('tab-bin').onclick=()=>tab('bin');$('tab-board').onclick=()=>tab('board');
let resetArmed=false;
$('btn-reset').addEventListener('click',e=>{
  const b=e.currentTarget;
  if(!flat().length){toast('tEmpty');return}
  if(!resetArmed){resetArmed=true;b.textContent=T('clearConfirm');setTimeout(()=>{resetArmed=false;b.textContent=T('clear')},3000);return}
  resetArmed=false;b.textContent=T('clear');state.cols.forEach(c=>c.ids=[]);persist();render();toast('tAllBack');
});
$('btn-export').addEventListener('click',async()=>{
  const order=flat();if(!order.length){toast('tPlaceFirst');return}
  const rows=['board,position,sequence,sequence_note,code,old_id,title,title_telugu,category,minutes,shots,edited,source,source_url'];let n=0;
  const Q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const teT=i=>{const s=BY[i];if(s.te&&s.te.t)return s.te.t;if(s.ovf&&s.ovf.t)return '';return (TE.sc[i]&&TE.sc[i].t)||''};
  state.cols.forEach(c=>c.ids.forEach(i=>{const s=BY[i],r=SRC[i]||{};
    rows.push([Q(curBoard().name),++n,Q(c.name),Q(c.note||''),i,s.src,Q(s.t),Q(teT(i)),catOf(i)==='A'?'Action':'Drama',Q(s.mins),(s.shots||[]).length,s.ed?'yes':'',Q(r.c||''),Q(r.u||'')].join(','))}));
  const csv='﻿'+rows.join('\n');
  try{const dl=await window.claude.use('downloads');if(!dl)throw 0;await dl.save({filename:'story_order_'+active+'.csv',data:csv});toast('tCsv')}
  catch(err){if(err&&err.code==='declined')return;try{await navigator.clipboard.writeText(csv);toast('tCsvCopy')}catch(e2){toast('tNoExport')}}
});
function applyStatic(){
  document.body.classList.toggle('te',isTe());
  document.querySelectorAll('[data-i]').forEach(e=>{const k=e.dataset.i;e.textContent=T(isMob()&&UI.en[k+'M']?k+'M':k)});
  document.querySelectorAll('[data-ip]').forEach(e=>{const t=T(e.dataset.ip);e.placeholder=t;e.setAttribute('aria-label',t)});
  document.querySelectorAll('[data-ia]').forEach(e=>{const p=e.dataset.ia.split(':');e.setAttribute(p[0],T(p[1]))});
  const ev=$('evf'),evv=filt.ev;ev.innerHTML='<option value="0">'+esc(T('allEvents'))+'</option>'+Object.keys(EVN).map(k=>'<option value="'+k+'">'+k+'. '+esc(term('evn',EVN[k]))+'</option>').join('');ev.value=evv;
  const sf=$('sortf'),sv=filt.sort;sf.innerHTML=[['ev','sortEv'],['code','sortCode'],['title','sortTitle'],['tier','sortTier']].map(x=>'<option value="'+x[0]+'">'+esc(T(x[1]))+'</option>').join('');sf.value=sv;
  document.querySelectorAll('#langseg [data-lang]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.lang===lang));
  $('status').textContent=T(statusKey);
}
function setLang(l){lang=l==='te'?'te':'en';try{localStorage.setItem('sceneboard.lang',lang)}catch(e){}applyStatic();render()}
document.querySelectorAll('#langseg [data-lang]').forEach(b=>b.addEventListener('click',()=>setLang(b.dataset.lang)));
applyView();
applyStatic();
window.addEventListener('beforeunload',()=>{if(pending&&mode==='db')flush()});
boot();
