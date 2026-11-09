/* ---------- data ---------- */
const SCENES=__DATA__;
const TE=__TE__;
const UI=__UI__;
const SRC=__SRC__;
/* The five seeded board orders, built into the page from data/boards/.
   They are the starting point when nothing has been saved yet: the whole tool
   works offline on them, with or without a claude.ai runtime behind it. */
const SEED=__BOARDS__;
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
    if(c.ap===true){o.ap=true;if(typeof c.apAt==='string')o.apAt=c.apAt.slice(0,40)}
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
    const mj=String(x.mj||'').trim();if(mj)o.mj=mj.slice(0,1400);
    const imgs=[];
    if(Array.isArray(x.imgs))x.imgs.forEach(g=>{const id=String((g&&g.id)||g||'').trim();if(id&&imgs.length<8)imgs.push({id:id.slice(0,64)})});
    else{const im=String(x.img||'').trim();if(im)imgs.push({id:im.slice(0,64)})}
    if(imgs.length)o.imgs=imgs;
    if(x.chk&&typeof x.chk==='object'){
      const per=[];
      if(Array.isArray(x.chk.per))x.chk.per.forEach(q=>{if(q)per.push({i:Number(q.i)||0,ok:q.ok===true,note:String(q.note||'').slice(0,300)})});
      o.chk={best:typeof x.chk.best==='number'?x.chk.best:-1,note:String(x.chk.note||'').slice(0,500),
        fix:String(x.chk.fix||'').slice(0,400),at:String(x.chk.at||'').slice(0,40)};
      if(per.length)o.chk.per=per.slice(0,8);
    }
    if(x.a===true)o.a=true;          /* the shot is approved */
    if(x.ma===true)o.ma=true;        /* its image prompt is approved */
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
    b.ap=o.ap===true;b.apAt=typeof o.apAt==='string'?o.apAt:'';
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

/* ---------- approval ----------
   A scene, a sequence, a shot or an image prompt can be approved by hand.
   An approved thing is frozen: no prompt can rewrite it, no edit by hand can
   touch it, and it cannot be restored over, until the approval is removed. */
const sceneAp=c=>!!(ov[c]&&ov[c].ap);
const seqApId=id=>{const c=state.cols.find(x=>x.id===id);return !!(c&&c.ap)};
const shotsOf=c=>(BY[c]&&BY[c].shots)||[];
const apShots=c=>shotsOf(c).filter(x=>x.a).length;
/* a scene may be approved only once every one of its shots is approved */
function sceneApBlock(code){
  const a=shotsOf(code);
  if(!a.length)return 'Write its shots first, then approve them — a scene is approved only when all of its shots are.';
  const n=a.filter(x=>x.a).length;
  return n<a.length?('Approve all of its shots first — '+n+' of '+a.length+' are approved.'):'';
}
/* a sequence may be approved only once every scene in it is approved */
function seqApBlock(col){
  if(!col.ids.length)return 'Put scenes in it first.';
  const n=col.ids.filter(i=>sceneAp(i)).length;
  return n<col.ids.length?('Approve all of its scenes first — '+n+' of '+col.ids.length+' are approved.'):'';
}
/* an approval holds everything under it: the sequence holds its scenes, the
   scene holds its shots, so the lock is taken off from the top down */
const seqHolding=code=>{const w=where(code);return w&&state.cols[w.ci].ap?state.cols[w.ci]:null};
const LOCKED_BY_SEQ='Its sequence is approved. Take that approval off first.';
const LOCKED_BY_SCENE='This scene is approved. Take that approval off first.';
const shotLocked=code=>sceneAp(code);
const apChip=on=>on?'<span class="apchip" title="Approved">approved</span>':'';
const apCount=()=>ORDER.reduce((n,c)=>n+(sceneAp(c)?1:0),0);
const LOCKED_SCENE='This scene is approved. Remove the approval in Options before changing it.';
const LOCKED_SEQ='This sequence is approved. Remove the approval before changing it.';
function setSceneAp(code,on){
  if(on){const why=sceneApBlock(code);if(why){toast(why);return}}
  else if(seqHolding(code)){toast(LOCKED_BY_SEQ);return}
  const prev=ov[code]||{},next=Object.assign({},prev);
  if(on){next.ap=true;next.apAt=new Date().toISOString()}else{delete next.ap;delete next.apAt}
  if(Object.keys(next).length)ov[code]=next;else delete ov[code];
  applyOv();saveOv(code);render();
  toast(on?'Scene approved — its text and category are locked':'Approval removed from the scene');
}
function setSeqAp(id,on){
  const c=state.cols.find(x=>x.id===id);if(!c)return;
  if(on){const why=seqApBlock(c);if(why){toast(why);return}}
  if(on){c.ap=true;c.apAt=new Date().toISOString()}else{delete c.ap;delete c.apAt}
  persist();render();
  toast(on?'Sequence approved — its name, context and order are locked':'Approval removed from the sequence');
}
function setShotAp(code,i,key,on){
  if(shotLocked(code)){toast(LOCKED_BY_SCENE);return}
  const a=(BY[code].shots||[]).slice();if(!a[i])return;
  if(key==='a'&&!on&&a[i].a&&sceneAp(code)){toast(LOCKED_BY_SCENE);return}
  a[i]=Object.assign({},a[i]);
  if(on)a[i][key]=true;else delete a[i][key];
  setShots(code,a,on?(key==='a'?'Shot approved':'Image prompt approved'):'Approval removed');
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
/* start from the orders built into the page */
function seedBoards(){
  const ids=Object.keys(SEED||{}).sort();
  if(!ids.length)return false;
  boardsData={};ids.forEach(id=>{boardsData[id]=readBoard(SEED[id],id)});
  active=boardsData[active]?active:ids[0];
  state.cols=curBoard().cols;lastJSON='';
  return true;
}
/* Boards that ship with a new version of the page are added to an existing
   store once each, and a board the person has deleted is never resurrected:
   every seed id we have offered is remembered. */
function addNewSeeds(){
  let known=[];try{known=JSON.parse(localStorage.getItem('sceneboard.seeded')||'[]')||[]}catch(e){}
  const ids=Object.keys(SEED||{}).sort();
  if(!ids.length)return false;
  const fresh=ids.filter(id=>!boardsData[id]&&known.indexOf(id)<0);
  const remember=()=>{try{localStorage.setItem('sceneboard.seeded',JSON.stringify(ids.filter(id=>boardsData[id]||known.indexOf(id)>=0)))}catch(e){}};
  if(!fresh.length){remember();return false}
  fresh.forEach(id=>{boardsData[id]=readBoard(SEED[id],id)});
  remember();persist();
  toast(fresh.length===1?'New board in this version: “'+bName(boardsData[fresh[0]])+'”':'Added '+fresh.length+' new boards from this version');
  return true;
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
  try{assets=await (window.claude&&window.claude.use?window.claude.use('assets'):null)}catch(e){assets=null}
  if(samp)render();
  if(!db){
    mode='local';
    let saved=false;
    try{const r=JSON.parse(localStorage.getItem('sceneboard.v2')||'null');
      if(r&&r.boards&&Object.keys(r.boards).length){saved=true;boardsData={};Object.keys(r.boards).forEach(k=>boardsData[k]=readBoard(r.boards[k],k));state.cat=clean({cols:[],cat:r.cat}).cat;active=boardsData[r.active]?r.active:(boardIds()[0]||'b1');state.cols=curBoard().cols}}catch(e){}
    if(!saved)seedBoards();else addNewSeeds();
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
    else if(!Object.keys(boardsData).length||!flat().length)seedBoards();   /* an empty store: start from the seeds */
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
  return '<div class="card'+(s.ap?' apd':'')+'" data-c="'+code+'" data-cat="'+cat+'"'+(s.ap?' data-ap="1"':'')+' tabindex="0" role="button" aria-label="'+esc(sc(s,'t'))+', '+catLabel(cat)+(s.ap?', approved':'')+'">'+
    (pos?'<span class="pos">'+pos+'</span>':'')+
    '<div class="cb"><div class="top"><span class="code">'+code+'</span><span class="chip">'+catLabel(cat)+'</span>'+(s.ed?'<span class="edflag">edited</span>':'')+apChip(s.ap)+'</div>'+
    '<div class="ttl">'+esc(sc(s,'t'))+'</div>'+
    '<div class="meta"><span>'+esc(term('evn',s.evn))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span><span class="dots" title="'+T('tier')+' '+s.tier+'">'+dots+'</span>'+(s.carrier?'<span>'+T('carrier')+'</span>':'')+(s.shots&&s.shots.length?'<span>'+s.shots.filter(x=>x.a).length+'/'+s.shots.length+' shots'+(s.shots.reduce((n,x)=>n+((x.imgs||[]).length),0)?' · '+s.shots.reduce((n,x)=>n+((x.imgs||[]).length),0)+' images':'')+'</span>':'')+'</div></div>'+
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
    return '<div class="col'+(folded.has(c.id)?' folded':'')+(c.ap?' apd':'')+'" data-id="'+esc(c.id)+'"><div class="chead">'+
      '<button class="fold" type="button" data-fold="'+esc(c.id)+'" aria-expanded="'+(!folded.has(c.id))+'" aria-label="Fold or unfold this sequence">'+(folded.has(c.id)?'▸':'▾')+'</button>'+
      '<span class="grip" title="'+esc(T('gripTip'))+'" aria-hidden="true">⠿</span>'+
      '<input class="cname" value="'+esc(colName(c))+'" aria-label="'+esc(T('seqName'))+'" maxlength="60"'+(c.ap?' readonly title="Approved — the name is locked"':'')+'>'+
      (c.ap?'<span class="apmark" title="Approved">✓</span>':'')+
      '<button class="ebtn" type="button" data-seq="'+esc(c.id)+'" title="Open this sequence (right-click for more)" aria-label="Edit sequence">✎</button>'+
      '<button class="xbtn" type="button" data-del="'+esc(c.id)+'" title="'+esc(T('delTip'))+'" aria-label="'+esc(T('delAria'))+'">×</button></div>'+
      '<div class="cinfo">'+T('colInfo',{n:c.ids.length,w:T(c.ids.length===1?'scene':'scenes'),t:fmtMin(mins)})+'</div>'+
      (note?'<div class="cnote">'+esc(note)+'</div>':'')+
      '<div class="cards">'+c.ids.map(i=>cardHTML(i,++n)).join('')+'</div></div>';
  }).join('')+'<button class="newcol" id="newcol" type="button">'+esc(T('addSeq'))+'</button>';
  renderTabs();stats();bindSortables();
  const ae=document.activeElement;
  const typing=ae&&((ae.classList&&ae.classList.contains('edp'))||ae.id==='shx'||ae.id==='sht'||ae.id==='mjx');
  if(!typing){if(openCode)scenePanel(openCode,true);else if(openSeq)seqPanel(openSeq,true)}
  if(!$('read').hidden)readThrough(true);
}
function stats(){
  const order=flat();
  $('s-placed').textContent=order.length+'/'+TOTAL;
  $('s-run').textContent='≈ '+fmtMin(order.reduce((a,i)=>a+BY[i].mid,0));
  const d=order.filter(i=>catOf(i)==='D').length;$('s-mix').textContent=d+' · '+(order.length-d);
  const aps=order.filter(i=>sceneAp(i)).length,apq=state.cols.filter(c=>c.ap&&c.ids.length).length;
  $('s-appr').textContent=aps+(apq?' · '+apq:'');
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
let dragWarned=false;
function bindSortables(){
  sortables.forEach(s=>{try{s.destroy()}catch(e){}});sortables=[];
  /* Sortable comes from a CDN. Without it (offline, or a network that blocks
     it) everything else still works, so say so once and carry on. */
  if(typeof Sortable==='undefined'){
    if(!dragWarned){dragWarned=true;toast('Dragging is off — the drag library could not be loaded. Use Options on a scene to move it.')}
    return;
  }
  const common={group:'scenes',animation:150,ghostClass:'ghost',chosenClass:'chosen',delay:140,delayOnTouchOnly:true,filter:'.add,.more,.fold,.cname,.xbtn,.ebtn',preventOnFilter:false,
    onStart:()=>{dragging=true;hidePeek();hideCtx()},
    onEnd:()=>{dragging=false;fromDOM();persist();setTimeout(render,0)}};
  sortables.push(new Sortable($('bin'),Object.assign({},common,{sort:false})));
  document.querySelectorAll('.cards').forEach(el=>{
    const col=state.cols.find(c=>c.id===el.closest('.col').dataset.id);
    sortables.push(new Sortable(el,Object.assign({},common,col&&col.ap?{disabled:true}:{})));
  });
  sortables.push(new Sortable($('board'),{animation:150,draggable:'.col',handle:'.grip',ghostClass:'ghost',filter:'.newcol',
    onStart:()=>{dragging=true;hidePeek();hideCtx()},onEnd:()=>{dragging=false;fromDOM();persist();setTimeout(render,0)}}));
}

/* ---------- editing by prompt ---------- */
let samp=null,assets=null,asking=null,ctl=null,draft={},edErr={},busyShot=null;
function reopen(){if(openCode)scenePanel(openCode,true);else if(openSeq)seqPanel(openSeq,true)}
function edPanel(key,label,ph,last,extra){
  const busy=asking===key;
  return '<div class="edwrap"><span class="lab">'+esc(label)+' — tell Claude what you want</span>'+
    '<textarea class="edp" data-k="'+key+'" rows="2" placeholder="'+esc(ph)+'"'+(busy?' disabled':'')+'>'+esc(draft[key]||'')+'</textarea>'+
    '<div class="acts">'+(busy
      ?'<span class="busy"><i></i><i></i><i></i></span><span class="sub">Claude is writing…</span><button class="btn" type="button" data-stop="1">Stop</button>'
      :'<button class="btn pri" type="button" data-go="'+key+'">Apply</button>'+(extra||''))+'</div>'+
    (edErr[key]?'<div class="err">'+esc(edErr[key])+'</div>':'')+
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
  if(sceneAp(code))throw new Error('this scene is approved — remove the approval first');
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
  if(shotLocked(code))throw new Error('this scene is approved — take the approval off first');
  let arr=cleanShots(r&&(r.shots||r.shot_list||(Array.isArray(r)?r:null)));
  if(!arr||!arr.length)throw new Error('no shots came back');
  const old=BY[code].shots||[];
  /* approved shots keep their place and their wording whatever came back */
  const locked=old.map((x,i)=>(x.a?i:-1)).filter(i=>i>=0);
  if(locked.length){
    const maxI=Math.max.apply(null,locked);
    while(arr.length<=maxI)arr.push(old[arr.length]||{t:'SHOT',x:'—'});
    locked.forEach(i=>{arr[i]=old[i]});
  }
  /* an approved image prompt is kept whatever happens to its shot; an
     unapproved one stays only while the shot's wording is unchanged */
  arr=arr.map((x,i)=>{const o=old[i];
    if(!o)return x;
    if(o.ma&&o.mj)return Object.assign({},x,{mj:o.mj,ma:true});
    if(o.mj&&o.x===x.x&&!x.mj)return Object.assign({},x,{mj:o.mj});
    return x});
  pushHist(code);
  const prev=ov[code]||{};
  ov[code]=Object.assign({},prev,{shots:arr,shotp:String(prompt).slice(0,400),updated:new Date().toISOString()});
  applyOv();saveOv(code);
}
const MJ_STYLE='photoreal cinematic film still, ancient India, mythic epic, natural light, shallow depth of field, 35mm';
async function askPrompts(code,prompt){
  const s=BY[code],shots=s.shots||[];
  const cur={title:s.t,what_happens:s.sum,as_filmed_in_cg:s.story||'',place:s.pl,point_of_view:s.pov,
    krishna_presence:s.k,category:catOf(code)==='A'?'A (action)':'D (drama)',
    shots:shots.map((x,i)=>({n:i+1,type:x.t,shot:x.x,approved:!!x.ma,prompt:x.mj||''})).filter((x,i)=>shots[i].a)};
  const p=PREM+'\n\nYou are writing MIDJOURNEY image prompts, one for each shot, so that the shot list can be looked at as a storyboard.\n\n'+
   'The scene and its shots:\n'+JSON.stringify(cur,null,1)+
   '\n\nThe writer\'s instruction:\n+prompt+\n\n'+
   'Write one prompt per shot, in the same order, for every shot in the list. A prompt is a single line of comma-separated visual clauses in this order: what is in frame and what it is doing, where it is, the time of day and the light, the shot size and lens, the mood, then the look ('+MJ_STYLE+' unless the instruction says otherwise), and it ends with Midjourney parameters, by default --ar 21:9 --style raw. Never write a --v or --version flag: Midjourney uses its newest model when no version is named, and naming an old one costs more to render. Describe only what a still image can show: no camera moves, no cuts, no sound, no words or captions in the image, no named real people. Krishna may never be shown more than this scene shows him — if his presence is "Not present", "Spoken of", "Shadow or sound", "Hands" or "Effect", his face must not appear in the prompt. Keep each prompt under 60 words.\n\n'+
   'A shot marked "approved": true must be returned with its existing prompt word for word.\n\n'+
   'Reply with only a JSON object: {"prompts":[{"n":1,"text":"…"}]} with one entry for every shot, numbered from 1.';
  return await samp.json(p,{signal:ctl.signal,cache:false,modelTier:'default'});
}
function applyPromptsEdit(code,prompt,r){
  if(shotLocked(code))throw new Error('this scene is approved — take the approval off first');
  const list=r&&(r.prompts||r.shots||(Array.isArray(r)?r:null));
  if(!Array.isArray(list)||!list.length)throw new Error('no prompts came back');
  const old=(BY[code].shots||[]).slice();
  if(!old.length)throw new Error('there are no shots to write prompts for');
  let used=0;
  list.forEach((p,k)=>{
    if(!p)return;
    const txt=String(typeof p==='string'?p:(p.text||p.prompt||p.mj||'')).trim();
    if(!txt)return;
    let i=Number(p.n);i=isFinite(i)&&i>=1?Math.round(i)-1:k;
    if(!old[i])return;
    if(!old[i].a)return;                     /* only approved shots have prompts */
    if(old[i].ma)return;                     /* approved prompt: left alone */
    old[i]=Object.assign({},old[i],{mj:mjClean(txt).slice(0,1400)});
    used++;
  });
  if(!used)throw new Error('nothing usable came back');
  const prev=ov[code]||{};
  ov[code]=Object.assign({},prev,{shots:cleanShots(old),mjp:String(prompt).slice(0,400),updated:new Date().toISOString()});
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
  if(col.ap)throw new Error('this sequence is approved — remove the approval first');
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
async function runEdit(key,auto){
  if(!key||asking)return;
  const txt=(auto||draft[key]||'').trim();
  edErr={};
  if(!txt){edErr[key]='Type what you want changed first.';reopen();return}
  if(!samp){edErr[key]='Claude is not available in this view, so prompt editing is off.';reopen();return}
  asking=key;ctl=new AbortController();reopen();
  const kind=key.charAt(0),id=key.slice(2);
  try{
    if(kind==='s'){const r=await askScene(id,txt);applySceneEdit(id,txt,r);draft[key]='';asking=null;render();toast('Scene rewritten')}
    else if(kind==='h'){const r=await askShots(id,txt);applyShotsEdit(id,txt,r);draft[key]='';asking=null;render();toast('Shot list updated')}
    else if(kind==='m'){const r=await askPrompts(id,txt);applyPromptsEdit(id,txt,r);draft[key]='';asking=null;render();toast('Image prompts written')}
    else{const col=state.cols.find(c=>c.id===id);if(!col)throw new Error('that sequence is gone');
      const r=await askSeq(col,txt);applySeqEdit(col,txt,r);draft[key]='';asking=null;render();toast('Sequence updated')}
  }catch(e){asking=null;edErr[key]=msgFor(e);reopen()}
}
function renameScene(code,v){
  if(sceneAp(code)){toast(LOCKED_SCENE);return}
  v=String(v||'').trim().slice(0,90);if(!v)return;
  const s=BY[code];if(v===sc(s,'t'))return;
  pushHist(code);
  const prev=ov[code]||{},o={updated:new Date().toISOString(),prompt:'Renamed by hand'};
  if(isTe()){o.te=Object.assign({},prev.te||s.te||{},{t:v})}else o.t=v;
  ov[code]=Object.assign({},prev,o);
  applyOv();saveOv(code);render();toast('Renamed');
}
function restoreVersion(code,i){
  if(sceneAp(code)){toast(LOCKED_SCENE);return}
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
function setShots(code,arr,msg){
  if(shotLocked(code)){toast(LOCKED_BY_SCENE);return}
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

/* ---------- the image a prompt made ----------
   The viewer pastes the prompt into Midjourney, brings the picture back, and
   Claude says whether the picture is the shot. */
function shotPatch(code,i,patch,msg){
  if(shotLocked(code)){toast(LOCKED_BY_SCENE);return}
  const a=(BY[code].shots||[]).slice();if(!a[i])return;
  a[i]=Object.assign({},a[i],patch);
  Object.keys(patch).forEach(k=>{if(patch[k]===undefined)delete a[i][k]});
  setShots(code,a,msg);
}
async function uploadImage(file){
  if(!/^image\//.test(file.type||''))throw {code:'unsupported_type'};
  if(file.size>20*1024*1024)throw {code:'too_large'};
  if(!assets)throw {code:'not_granted'};
  return await assets.upload(file,{type:file.type});
}
/* add a picture to a shot, or put one in the place of another */
async function addShotImage(code,i,file,replaceAt){
  const sh=(BY[code].shots||[])[i];if(!sh||!file)return;
  if(shotLocked(code)){toast(LOCKED_BY_SCENE);return}
  if(!sh.a){toast('Approve the shot first');return}
  busyShot=i;reopen();
  try{
    const r=await uploadImage(file);
    const imgs=(sh.imgs||[]).slice();
    if(typeof replaceAt==='number'&&imgs[replaceAt]){
      const old=imgs[replaceAt].id;
      imgs[replaceAt]={id:r.id};
      if(assets&&old)assets.delete(old).catch(()=>{});
    }else{
      if(imgs.length>=8){busyShot=null;toast('Eight images is the most a shot can hold');reopen();return}
      imgs.push({id:r.id});
    }
    busyShot=null;
    shotSel[code+':'+i]=typeof replaceAt==='number'?replaceAt:imgs.length-1;
    shotPatch(code,i,{imgs:imgs,chk:undefined},typeof replaceAt==='number'?'Image replaced':'Image added');
  }catch(e){
    busyShot=null;
    toast(e&&e.code==='too_large'?'That image is over 20 MB'
      :e&&e.code==='unsupported_type'?'That is not an image file'
      :e&&e.code==='not_granted'?'Images need edit access to this page':'Could not store the image');
    reopen();
  }
}
async function blobOf(id){
  try{const r=await fetch('/_blob/'+id);if(!r.ok)return null;const b=await r.blob();return b.size?b:null}catch(e){return null}
}
/* ---------- After Effects export ----------
   Approved shots plus the picture each shot's check kept, written out as an
   ExtendScript that builds the comp, with the images beside it in a zip.
   Works at three levels: one scene, one sequence, the whole board. */
const AE_W={EWS:1.5,WIDE:1.4,WS:1.4,ESTABLISHING:1.5,POV:1.2,TRACKING:1.2,DOLLY:1.2,CRANE:1.3,AERIAL:1.4,OVER:1.1,OTS:1.1,MS:1,MEDIUM:1,CLOSE:1,CU:1,MCU:1,ECU:.9,INSERT:.7,MACRO:.7,DETAIL:.7,CUTAWAY:.8};
const AE_MV={EWS:[106,113,0,0],WIDE:[106,113,0,0],WS:[106,113,0,0],POV:[104,112,0,0],AERIAL:[108,100,0,0],TRACKING:[112,112,-70,0],DOLLY:[105,115,0,0],OVER:[108,112,26,0],OTS:[108,112,26,0],CLOSE:[110,116,0,-10],CU:[110,116,0,-10],MCU:[109,115,0,-8],ECU:[112,118,0,0],MS:[107,113,0,0],INSERT:[112,106,18,8],MACRO:[112,106,18,8],DETAIL:[112,106,18,8]};
const AE_FPS=24,AE_WIDTH=1680,AE_HEIGHT=720,AE_DIS=.5,AE_FADE=1;
/* Midjourney takes its newest model when no version is named, and an old
   --v costs more to render, so no prompt in this tool carries one. */
function mjClean(t){
  return String(t||'')
    .replace(/\s--(?:v|version)\s+[\d.]+\b/gi,'')
    .replace(/\s--niji\s+[\d.]+\b/gi,' --niji')
    .replace(/\s{2,}/g,' ').trim();
}
function aeKind(t){const ws=String(t||'').toUpperCase().split(/[^A-Z-]+/).filter(Boolean);for(const w of ws)if(AE_W[w]||AE_MV[w])return w;return ws[0]||''}
function ae2(n){return (n<10?'0':'')+n}
function ae3(n){return Math.round(n*1000)/1000}
/* which picture is this shot's picture: the one the check kept */
function aeImg(sh){
  const imgs=sh.imgs||[];if(!imgs.length)return null;
  const chk=sh.chk||{},b=chk.best;
  if(typeof b==='number'&&b>=0&&b<imgs.length)return{id:imgs[b].id,why:'checked: picture '+(b+1)+' of '+imgs.length+' kept'};
  if(typeof b==='number'&&b<0)return null;      /* the check said none of them is the shot */
  const ok=(chk.per||[]).filter(p=>p&&p.ok&&typeof p.i==='number');
  if(ok.length&&ok[0].i<imgs.length)return{id:imgs[ok[0].i].id,why:'checked: picture '+(ok[0].i+1)+' passed'};
  return{id:imgs[0].id,why:imgs.length===1?'one picture, not checked':imgs.length+' pictures, not checked — the first is used'};
}
/* the four After Effects layouts; the picture is the same cut in each */
const AE_TPL={
  clean:{label:'Clean',blurb:'The picture fills the frame. The shot brief and any dialogue sit inside the bottom of it, and nothing else is over it.',
    look:{suffix:' · clean',width:1680,height:720,bg:[0,0,0],ink:[1,1,1],dlgInk:[1,1,1],
      pictureWidth:1,pictureY:.5,fill:true,mask:false,corners:false,strip:false,
      pad:.03,small:19,dlg:29,stroke:true,strokeColour:[0,0,0],guides:false,
      brief:true,briefInside:true,briefWidth:.78,briefSize:19,briefInk:[.88,.9,.93],briefGap:0,dialogueUp:.115}},
  corners:{label:'Corners',blurb:'A wider black canvas with the picture centred and the production data in the four corners.',
    look:{suffix:' · corners',width:1920,height:1080,bg:[0,0,0],ink:[.78,.8,.84],dlgInk:[1,1,1],
      pictureWidth:.8,pictureY:.47,fill:false,mask:true,corners:true,strip:false,
      pad:.028,small:20,dlg:30,stroke:false,strokeColour:[0,0,0],guides:false,
      brief:true,briefInside:false,briefWidth:.82,briefSize:22,briefInk:[.74,.77,.82],briefGap:.04,dialogueUp:.075}},
  paper:{label:'Paper',blurb:'The corners layout on white with dark text, for review documents and printing.',
    look:{suffix:' · paper',width:1920,height:1080,bg:[1,1,1],ink:[.13,.15,.18],dlgInk:[.08,.09,.11],
      pictureWidth:.8,pictureY:.46,fill:false,mask:true,corners:true,strip:false,
      pad:.03,small:20,dlg:29,stroke:false,strokeColour:[1,1,1],guides:false,
      brief:true,briefInside:false,briefWidth:.82,briefSize:22,briefInk:[.25,.27,.31],briefGap:.04,dialogueUp:.075}},
  slate:{label:'Slate',blurb:'The picture high on a black canvas with a wide margin and everything on a strip beneath it.',
    look:{suffix:' · slate',width:1920,height:1080,bg:[.04,.04,.05],ink:[.93,.93,.95],dlgInk:[1,1,1],
      pictureWidth:.86,pictureY:.4,fill:false,mask:true,corners:false,strip:true,
      pad:.035,small:21,dlg:30,stroke:false,strokeColour:[0,0,0],guides:false,
      brief:true,briefInside:false,briefWidth:.84,briefSize:23,briefInk:[.84,.86,.9],briefGap:.035,dialogueUp:.07}}
};
const AE_TPL_DEF='corners';
function aeTplOf(code){const t=ov[code]&&ov[code].ae;return AE_TPL[t]?t:AE_TPL_DEF}
function setAeTpl(code,name){
  if(!AE_TPL[name]||aeTplOf(code)===name)return;
  ov[code]=Object.assign({},ov[code]||{},{ae:name,updated:new Date().toISOString()});
  saveOv(code);reopen();toast('This scene will build as “'+AE_TPL[name].label+'”');
}
function aeTplMix(ids){
  const n={};ids.forEach(c=>{const t=aeTplOf(c);n[t]=(n[t]||0)+1});
  return Object.keys(n).sort().map(k=>AE_TPL[k].label+(n[k]>1?' ×'+n[k]:'')).join(', ');
}
/* 00:12.4 — for slates and burn-ins */
function aeTc(sec){
  sec=Math.round(Math.max(0,sec)*10)/10;
  let h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),x=Math.round(sec%60*10)/10;
  if(x>=59.95){x=0;m++;if(m===60){m=0;h++}}
  const xs=(x<10?'0':'')+x.toFixed(1);
  return h?h+':'+ae2(m)+':'+xs:ae2(m)+':'+xs;
}
/* how far a move travels: a long shot can carry a bigger push and still read
   as slow, a short one needs less; action scenes move more, still ones less */
function aeSpeed(kind,dur,cat,rasa){
  let f=Math.min(1.6,Math.max(.6,dur/8));
  if(cat==='A')f*=1.35;
  if(rasa==='Śānta'||rasa==='Karuṇa')f*=.8;
  const mv=AE_MV[kind]||[107,113,0,0],mid=(mv[0]+mv[1])/2;
  return [Math.round((mid+(mv[0]-mid)*f)*100)/100,Math.round((mid+(mv[1]-mid)*f)*100)/100,
          Math.round(mv[2]*f),Math.round(mv[3]*f),Math.round(f*1000)/1000];
}
/* the approved shots of a scene, laid out across its runtime */
function aeShots(code,ctx){
  const s=BY[code];if(!s)return [];
  const got=(s.shots||[]).filter(x=>x.a);
  if(!got.length)return [];
  const total=(s.mid||1.5)*60,ws=got.map(x=>AE_W[aeKind(x.t)]||1),sum=ws.reduce((a,b)=>a+b,0)||1;
  const cat=catOf(code),rasa=s.rasa||'',title=sc(s,'t');
  let at=0;
  return got.map((x,i)=>{
    const dur=total*ws[i]/sum,g=aeImg(x),k=aeKind(x.t),sp=aeSpeed(k,dur,cat,rasa),
      label=ae2(i+1)+' · '+(x.t||'SHOT'),why=g?g.why:'no picture the check kept',
      row={n:i+1,label:label,text:x.x||'',mj:x.mj||'',dlg:x.dlg||'',
      id:g?g.id:'',why:why,imgs:(x.imgs||[]).length,
      file:g?ae2(i+1)+'_'+(k||'SHOT')+'_'+g.id.slice(0,8)+'.png':'',
      at:ae3(at),dur:ae3(dur),tcIn:aeTc(at),tcOut:aeTc(at+dur),
      z0:sp[0],z1:sp[1],dx:sp[2],dy:sp[3],mf:sp[4],
      cTopRight:aeTc(at)+' – '+aeTc(at+dur)+'\r'+(Math.round(dur*10)/10)+'s',
      cBotLeft:label+'   shot '+(i+1)+' of '+got.length+'\r'+why,
      strip:label+'    '+aeTc(at)+' – '+aeTc(at+dur)+'    ('+(Math.round(dur*10)/10)+'s)    shot '+(i+1)+' of '+got.length+'\r'+
        why+'    ·    move ×'+sp[4],
      burn:code+'  ·  '+title+(ctx?'   ·   '+ctx:'')+'\r'+
        label+'   '+aeTc(at)+' – '+aeTc(at+dur)+'   ('+(Math.round(dur*10)/10)+'s)\r'+
        'shot '+(i+1)+' of '+got.length+'   ·   '+why+'   ·   move ×'+sp[4]};
    at+=dur;return row;
  });
}
function aeReady(code){return aeShots(code).some(x=>x.file)}
function aeCount(ids){return ids.filter(aeReady).length}
/* the ExtendScript for one scene, in the layout this scene is set to */
function aeScript(code,rows,ctx,tpl){
  const s=BY[code],name=code+' · '+sc(s,'t'),dur=rows.reduce((a,x)=>a+x.dur,0),
    used=rows.filter(x=>x.file).length,up=rows.reduce((a,x)=>a+x.imgs,0),
    dlg=rows.filter(x=>x.dlg).length,cat=catOf(code);
  const t=AE_TPL[tpl]?tpl:AE_TPL_DEF,look=AE_TPL[t].look;
  const conf={name:name,imageDir:'images',template:t,
    width:AE_WIDTH,height:AE_HEIGHT,fps:AE_FPS,
    duration:ae3(dur),dissolve:cat==='A'?.25:AE_DIS,fadeOut:AE_FADE,
    cTopLeft:code+'  ·  '+sc(s,'t')+'\r'+(ctx||''),
    cBotRight:rows.length+' shots  ·  '+used+' picture'+(used===1?'':'s')+' of '+up+'\r'+
      aeTc(dur)+'  ·  '+AE_FPS+' fps  ·  weighted by shot type'+(dlg?'  ·  '+dlg+' with dialogue':'')};
  return ['/* '+name+'  —  layout: '+AE_TPL[t].label,
' * '+AE_TPL[t].blurb,
' * Built by the Scene Board from approved shots and checked pictures.',
' * Pictures are found next to this file, so this folder can be moved.',
' * After Effects: File > Scripts > Run Script File... and choose this file.',
' * Edit LOOK, not the data; re-export instead of editing the data.',
' */',
'#target aftereffects','',
'(function () {',
'  var CONF  = '+JSON.stringify(conf,null,2)+';',
'  var SHOTS = '+JSON.stringify(rows,null,2)+';',
'  var LOOK  = '+JSON.stringify(look,null,2)+';','',
'  var HERE = (new File($.fileName)).parent;',
'  var IMG = new Folder(HERE.fsName + "/" + CONF.imageDir);',
'  if (!IMG.exists) { alert("Picture folder not found next to this script:\\\\n" + IMG.fsName); return; }','',
'  function text(comp, body, size, colour, pos, just, lead) {',
'    var t = comp.layers.addText(body), d = t.property("Source Text").value;',
'    d.resetCharStyle(); d.fontSize = size; d.fillColor = colour; d.applyFill = true;',
'    if (LOOK.stroke) { d.strokeColor = LOOK.strokeColour;',
'      d.strokeWidth = Math.max(1, Math.round(size * 0.14));',
'      d.strokeOverFill = false; d.applyStroke = true; } else { d.applyStroke = false; }',
'    if (lead) d.leading = lead;',
'    d.justification = just;',
'    t.property("Source Text").setValue(d);',
'    t.property("Transform").property("Position").setValue(pos);',
'    t.guideLayer = LOOK.guides;',
'    return t;',
'  }',
'  function box(comp, body, w, size, colour, pos, stroked) {',
'    var t = comp.layers.addBoxText([w, Math.max(size * 4, 60)]);',
'    var d = t.property("Source Text").value;',
'    d.resetCharStyle(); d.text = body; d.fontSize = size;',
'    d.fillColor = colour; d.applyFill = true;',
'    if (stroked) { d.strokeColor = LOOK.strokeColour;',
'      d.strokeWidth = Math.max(1, Math.round(size * 0.14));',
'      d.strokeOverFill = false; d.applyStroke = true; } else { d.applyStroke = false; }',
'    d.leading = Math.round(size * 1.35);',
'    d.justification = ParagraphJustification.CENTER_JUSTIFY;',
'    t.property("Source Text").setValue(d);',
'    t.property("Transform").property("Position").setValue(pos);',
'    t.guideLayer = LOOK.guides;',
'    return t;',
'  }',
'  function ease(p, a, b) { try { var e = new KeyframeEase(0, 55);',
'    p.setTemporalEaseAtKey(a, [e], [e]); p.setTemporalEaseAtKey(b, [e], [e]); } catch (err) {} }','',
'  app.beginUndoGroup("Build " + CONF.name);',
'  var W = LOOK.width, H = LOOK.height;',
'  var comp = app.project.items.addComp(CONF.name + LOOK.suffix, W, H, 1.0, Math.max(CONF.duration, 1), CONF.fps);',
'  comp.bgColor = LOOK.bg;',
'  var bgl = comp.layers.addSolid(LOOK.bg, "BACKGROUND", W, H, 1.0); bgl.moveToEnd();',
'  var folder = app.project.items.addFolder(CONF.name + " \\u00b7 pictures");',
'  var missing = [];',
'  var PW = Math.round(W * LOOK.pictureWidth);',
'  var PH = Math.round(PW * CONF.height / CONF.width);',
'  var PX = Math.round(W / 2), PY = Math.round(H * LOOK.pictureY);','',
'  for (var i = 0; i < SHOTS.length; i++) {',
'    var s = SHOTS[i], lay, f = new File(IMG.fsName + "/" + s.file);',
'    if (s.file && f.exists) {',
'      var item = app.project.importFile(new ImportOptions(f));',
'      item.parentFolder = folder; item.name = s.label;',
'      lay = comp.layers.add(item);',
'    } else {',
'      missing.push(s.label + (s.file ? " (" + s.file + ")" : " (no picture)"));',
'      lay = comp.layers.addSolid([0.18, 0.05, 0.05], s.label + " \\u2014 NO PICTURE", PW, PH, 1.0);',
'    }',
'    lay.startTime = s.at; lay.inPoint = s.at; lay.outPoint = s.at + s.dur; lay.label = (i % 15) + 1;',
'    var w = lay.source ? lay.source.width : PW, h = lay.source ? lay.source.height : PH;',
'    var fit = (LOOK.fill ? Math.max(PW / w, PH / h) : Math.min(PW / w, PH / h)) * 100;',
'    var sc2 = lay.property("Transform").property("Scale");',
'    var ps = lay.property("Transform").property("Position");',
'    sc2.setValueAtTime(s.at, [fit * s.z0 / 100, fit * s.z0 / 100]);',
'    sc2.setValueAtTime(s.at + s.dur, [fit * s.z1 / 100, fit * s.z1 / 100]);',
'    ease(sc2, 1, 2);',
'    if (s.dx || s.dy) {',
'      ps.setValueAtTime(s.at, [PX - s.dx / 2, PY - s.dy / 2]);',
'      ps.setValueAtTime(s.at + s.dur, [PX + s.dx / 2, PY + s.dy / 2]);',
'      ease(ps, 1, 2);',
'    } else { ps.setValue([PX, PY]); }',
'    if (LOOK.mask) {',
'      var mk2 = lay.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");',
'      var shp = new Shape(); shp.closed = true;',
'      var hx = PW / 2, hy = PH / 2;',
'      shp.vertices = [[PX - hx, PY - hy], [PX + hx, PY - hy], [PX + hx, PY + hy], [PX - hx, PY + hy]];',
'      mk2.property("ADBE Mask Shape").setValue(shp); mk2.maskMode = MaskMode.ADD;',
'    }',
'    var op = lay.property("Transform").property("Opacity");',
'    op.setValueAtTime(s.at, 0); op.setValueAtTime(s.at + CONF.dissolve, 100);',
'    if (i === SHOTS.length - 1 && CONF.fadeOut > 0) {',
'      op.setValueAtTime(s.at + s.dur - CONF.fadeOut, 100); op.setValueAtTime(s.at + s.dur, 0);',
'    }',
'    var mk = new MarkerValue(s.label);',
'    mk.comment = s.text + (s.dlg ? "\\\\n\\\\nDIALOGUE: " + s.dlg : "")',
'      + (s.mj ? "\\\\n\\\\nPROMPT: " + s.mj : "") + (s.why ? "\\\\n\\\\nPICTURE: " + s.why : "");',
'    lay.property("Marker").setValueAtTime(s.at + Math.min(0.2, s.dur / 4), mk);','',
'    if (s.dlg) {',
'      var dw = Math.round(PW * 0.86);',
'      var perLine = Math.max(12, Math.round(dw / (LOOK.dlg * 0.52)));',
'      var lines = Math.max(1, Math.ceil(s.dlg.length / perLine));',
'      var dy = PY + PH / 2 - Math.round(H * LOOK.dialogueUp) - (lines - 1) * Math.round(LOOK.dlg * 1.35);',
'      var dl = box(comp, s.dlg, dw, LOOK.dlg, LOOK.dlgInk, [PX - dw / 2, dy], true);',
'      dl.name = "DLG " + s.label; dl.inPoint = s.at; dl.outPoint = s.at + s.dur; dl.label = 11;',
'    }',
'    if (LOOK.brief && s.text) {',
'      var bw = Math.round(PW * LOOK.briefWidth);',
'      var by = LOOK.briefInside ? PY + PH / 2 - Math.round(H * 0.052)',
'                                : PY + PH / 2 + Math.round(H * LOOK.briefGap);',
'      var bf = box(comp, s.text, bw, LOOK.briefSize, LOOK.briefInk, [PX - bw / 2, by], LOOK.briefInside || LOOK.stroke);',
'      bf.name = "BRIEF " + s.label; bf.inPoint = s.at; bf.outPoint = s.at + s.dur; bf.label = 4;',
'    }',
'    if (LOOK.corners) {',
'      var tr = text(comp, s.cTopRight, LOOK.small, LOOK.ink,',
'        [W - Math.round(W * LOOK.pad), Math.round(H * LOOK.pad) + LOOK.small],',
'        ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.35));',
'      tr.name = "TR " + s.label; tr.inPoint = s.at; tr.outPoint = s.at + s.dur; tr.label = 5;',
'      var bl = text(comp, s.cBotLeft, LOOK.small, LOOK.ink,',
'        [Math.round(W * LOOK.pad), H - Math.round(H * LOOK.pad)],',
'        ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.35));',
'      bl.name = "BL " + s.label; bl.inPoint = s.at; bl.outPoint = s.at + s.dur; bl.label = 5;',
'    }',
'    if (LOOK.strip) {',
'      var st = text(comp, s.strip, LOOK.small, LOOK.ink,',
'        [Math.round(W * LOOK.pad), Math.round(H * 0.845)],',
'        ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.45));',
'      st.name = "STRIP " + s.label; st.inPoint = s.at; st.outPoint = s.at + s.dur; st.label = 5;',
'    }',
'  }','',
'  if (LOOK.corners) {',
'    var tl = text(comp, CONF.cTopLeft, LOOK.small, LOOK.ink,',
'      [Math.round(W * LOOK.pad), Math.round(H * LOOK.pad) + LOOK.small],',
'      ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.35));',
'    tl.name = "TL \\u00b7 scene"; tl.label = 14;',
'    var br = text(comp, CONF.cBotRight, LOOK.small, LOOK.ink,',
'      [W - Math.round(W * LOOK.pad), H - Math.round(H * LOOK.pad)],',
'      ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.35));',
'    br.name = "BR \\u00b7 totals"; br.label = 14;',
'  }',
'  if (LOOK.strip) {',
'    var rule = comp.layers.addSolid(LOOK.ink, "RULE", W - Math.round(W * LOOK.pad * 2), Math.max(1, Math.round(H * 0.0018)), 1.0);',
'    rule.property("Transform").property("Position").setValue([W / 2, Math.round(H * 0.805)]);',
'    rule.property("Transform").property("Opacity").setValue(45);',
'    var head = text(comp, CONF.cTopLeft, LOOK.small, LOOK.ink,',
'      [Math.round(W * LOOK.pad), Math.round(H * 0.062)],',
'      ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.4));',
'    head.name = "HEAD"; head.label = 14;',
'    var foot = text(comp, CONF.cBotRight, LOOK.small, LOOK.ink,',
'      [W - Math.round(W * LOOK.pad), Math.round(H * 0.955)],',
'      ParagraphJustification.RIGHT_JUSTIFY, Math.round(LOOK.small * 1.4));',
'    foot.name = "FOOT"; foot.label = 14;',
'  }',
'  if (!LOOK.corners && !LOOK.strip) {',
'    var sl = text(comp, CONF.cTopLeft, LOOK.small, LOOK.ink,',
'      [Math.round(W * LOOK.pad), Math.round(H * LOOK.pad) + LOOK.small],',
'      ParagraphJustification.LEFT_JUSTIFY, Math.round(LOOK.small * 1.35));',
'    sl.name = "SLATE"; sl.label = 14;',
'  }','',
'  var adj = comp.layers.addSolid([1, 1, 1], "GRADE (add effects here)", W, H, 1.0);',
'  adj.adjustmentLayer = true; adj.enabled = false; adj.moveToBeginning();','',
'  comp.openInViewer(); app.endUndoGroup();',
'  var msg = CONF.name + LOOK.suffix + "\\\\n" + SHOTS.length + " shots \\u00b7 " + Math.round(CONF.duration) + "s \\u00b7 " + W + "x" + H;',
'  if (missing.length) msg += "\\\\n\\\\nNo picture for:\\\\n" + missing.join("\\\\n");',
'  alert(msg);',
'})();',''].join('\n');
}
/* the master script: nests the scene comps in board order */
function aeMaster(title,names){
  return ['/* '+title+' — master comp',' * Run the scene scripts first, then this one.',' */',
'#target aftereffects','',
'(function () {',
'  var NAMES = '+JSON.stringify(names,null,2)+';',
'  var MASTER = '+JSON.stringify(title)+';',
'  function find(n) { for (var i = 1; i <= app.project.numItems; i++) {',
'    var it = app.project.item(i); if (it instanceof CompItem && it.name === n) return it; } return null; }',
'  var got = [], total = 0, w = 0, h = 0, fps = 24;',
'  for (var i = 0; i < NAMES.length; i++) {',
'    var c = find(NAMES[i]);',
'    if (!c) { alert("Run the scene scripts first — missing comp:\\n" + NAMES[i]); return; }',
'    got.push(c); total += c.duration; w = c.width; h = c.height; fps = 1 / c.frameDuration;',
'  }',
'  app.beginUndoGroup("Build " + MASTER);',
'  var m = app.project.items.addComp(MASTER, w, h, 1.0, Math.max(total, 1), fps), at = 0;',
'  for (var j = 0; j < got.length; j++) {',
'    var l = m.layers.add(got[j]); l.startTime = at; l.inPoint = at; l.outPoint = at + got[j].duration;',
'    m.markerProperty.setValueAtTime(at + 0.001, new MarkerValue(got[j].name));',
'    at += got[j].duration;',
'  }',
'  m.openInViewer(); app.endUndoGroup();',
'  alert(MASTER + "\\n" + got.length + " scenes · " + Math.round(total) + "s");',
'})();',''].join('\n');
}
/* a store-only zip, so the script and its pictures travel together */
let aeCrcT=null;
function aeCrc(u8){
  if(!aeCrcT){aeCrcT=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;aeCrcT[n]=c}}
  let c=-1;for(let i=0;i<u8.length;i++)c=aeCrcT[(c^u8[i])&255]^(c>>>8);return (c^-1)>>>0;
}
function aeZip(files){
  const enc=new TextEncoder(),parts=[],cen=[];let off=0;
  const u16=n=>[n&255,(n>>8)&255],u32=n=>[n&255,(n>>8)&255,(n>>16)&255,(n>>24)&255];
  files.forEach(f=>{
    const nm=enc.encode(f.name),data=f.data instanceof Uint8Array?f.data:enc.encode(String(f.data));
    const crc=aeCrc(data);
    const h=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(crc),...u32(data.length),...u32(data.length),...u16(nm.length),...u16(0)]);
    parts.push(h,nm,data);
    cen.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(crc),...u32(data.length),...u32(data.length),...u16(nm.length),...u16(0),...u16(0),...u16(0),...u16(0),
      ...u32(0),...u32(off)]),nm);
    off+=h.length+nm.length+data.length;
  });
  const cstart=off;let clen=0;cen.forEach(c=>clen+=c.length);
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),
    ...u32(clen),...u32(cstart),...u16(0)]);
  return new Blob([...parts,...cen,end],{type:'application/zip'});
}
function aeSafe(s){return String(s||'board').replace(/[^A-Za-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,40)||'board'}
let aeBusy=false;
async function aeExport(kind,id){
  if(aeBusy)return;
  let ids=[],title='';
  if(kind==='scene'){ids=[id];title=id+' · '+sc(BY[id],'t')}
  else if(kind==='seq'){const c=state.cols.find(x=>x.id===id);if(!c)return;ids=c.ids.slice();title=colName(c)}
  else {ids=flat();title=bName(curBoard())}
  const use=ids.filter(aeReady);
  if(!use.length){toast('Nothing to build yet — a shot needs an approved status and a picture its check kept');return}
  aeBusy=true;toast('Collecting '+use.length+' scene'+(use.length===1?'':'s')+'…');
  try{
    const many=use.length>1,files=[],comps=[],lines=[],tpls={};
    let shots=0,missing=0,secs=0;
    const board=flat(),bn=board.length;
    for(const code of use){
      const w=where(code),cut=board.indexOf(code);
      const ctx=kind==='scene'?(w?colName(state.cols[w.ci])+' · scene '+(w.i+1)+' of '+state.cols[w.ci].ids.length:'in the bin')
        :kind==='seq'?(title+' · scene '+(use.indexOf(code)+1)+' of '+use.length+(cut>=0?' · cut '+(cut+1)+' of '+bn:''))
        :(bName(curBoard())+(w?' · '+colName(state.cols[w.ci]):'')+(cut>=0?' · cut '+(cut+1)+' of '+bn:''));
      const rows=aeShots(code,ctx),dir=many?code+'/':'';
      for(const r of rows){
        if(!r.id){missing++;continue}
        const b=await blobOf(r.id);
        if(!b){missing++;r.file='';continue}
        files.push({name:dir+'images/'+r.file,data:new Uint8Array(await b.arrayBuffer())});
      }
      const nm=code+' · '+sc(BY[code],'t')+AE_TPL[aeTplOf(code)].look.suffix;
      comps.push(nm);shots+=rows.length;secs+=rows.reduce((a,x)=>a+x.dur,0);
      const tpl=aeTplOf(code);
      files.push({name:dir+code+'_'+tpl+'.js',data:aeScript(code,rows,ctx,tpl)});
      tpls[tpl]=(tpls[tpl]||0)+1;
      lines.push(code+'  '+sc(BY[code],'t')+'  —  '+rows.length+' shots, '+Math.round(rows.reduce((a,x)=>a+x.dur,0))+'s, '+AE_TPL[aeTplOf(code)].label);
    }
    if(many)files.push({name:aeSafe(title)+'_master.js',data:aeMaster(title,comps)});
    files.push({name:'README.txt',data:
      title+'\n'+'='.repeat(title.length)+'\n\n'+
      use.length+' scene'+(use.length===1?'':'s')+' · '+shots+' shots · '+Math.round(secs)+'s · '+AE_WIDTH+'x'+AE_HEIGHT+' at '+AE_FPS+' fps\n\n'+
      'Layout'+(Object.keys(tpls).length>1?'s':'')+': '+Object.keys(tpls).sort().map(k=>AE_TPL[k].label+' ×'+tpls[k]).join(', ')+'\n\n'+
      'In After Effects: File > Scripts > Run Script File... and choose the .js file.\n'+
      (many?'Run each scene\'s script first, then '+aeSafe(title)+'_master.js to nest them in order.\n':'')+
      'Keep each .js beside its images folder — the script finds the pictures next to itself.\n\n'+
      'Only approved shots are here, and each shot uses the picture its check kept.\n'+
      (missing?'\n'+missing+' shot'+(missing===1?'':'s')+' had no picture the check kept; the comp marks '+(missing===1?'it':'them')+' in red.\n':'')+
      '\n'+lines.join('\n')+'\n'});
    const zip=aeZip(files);
    const fn=aeSafe(kind==='scene'?id:title)+'_AE.zip';
    const dl=await (window.claude&&window.claude.use?window.claude.use('downloads'):null);
    if(!dl)throw {code:'unavailable'};
    await dl.save({filename:fn,data:zip});
    toast(use.length===1?'Built '+fn+' — '+shots+' shots':'Built '+fn+' — '+use.length+' scenes, '+shots+' shots');
  }catch(e){
    if(!(e&&e.code==='declined'))toast(e&&e.code==='unavailable'?'Downloads are not available in this view':'Could not build the package');
  }
  aeBusy=false;
}
/* show Claude every picture on the shot: which of them is the shot, and if
   none of them is, how the prompt should change */
async function checkShotImages(code,i){
  const s=BY[code],sh=(s.shots||[])[i];
  if(!sh||!(sh.imgs||[]).length)return;
  if(!samp){toast('Claude is not available in this view');return}
  busyShot=i;reopen();
  try{
    const blobs=[];
    for(const g of sh.imgs){const b=await blobOf(g.id);if(b)blobs.push(b)}
    if(!blobs.length){busyShot=null;toast('Could not read the images back — add them again');reopen();return}
    const q=PREM+'\n\nYou are judging the pictures a writer generated for one shot of the film.\n\n'+
      'The scene: '+s.t+'. '+s.sum+'\nPlace: '+s.pl+'. How much of Krishna is present in this scene: '+s.k+'.\n'+
      'The shot ('+(i+1)+', '+sh.t+'): '+sh.x+'\n'+(sh.mj?'The prompt that made them: '+sh.mj+'\n':'')+
      '\nThere '+(blobs.length===1?'is 1 image':'are '+blobs.length+' images')+', in order. For each one judge what is in frame, the framing and shot size, the place, the time of day and the light, and whether anyone shown should be shown — if the scene keeps Krishna off screen, his face must not be in the picture. Then say which single image is the best one for this shot, or none if not one of them will do.\n\n'+
      'Reply with only a JSON object: {"best": the 1-based number of the best image or 0 if none will do, "note": "one or two plain sentences on the pick", "images": [{"n": 1, "ok": true or false, "note": "one short sentence"}], "prompt": "a better Midjourney prompt, only if none of them is right — otherwise an empty string"}';
    const r=await samp.json(q,{images:blobs,cache:false,modelTier:'default'});
    const per=[];
    if(r&&Array.isArray(r.images))r.images.forEach((x,k)=>{if(x)per.push({i:(Number(x.n)||k+1)-1,ok:x.ok===true,note:String(x.note||'')})});
    const best=Math.round(Number(r&&r.best)||0)-1;
    const chk={best:best>=0&&best<(sh.imgs||[]).length?best:-1,note:String((r&&r.note)||''),fix:'',at:new Date().toISOString(),per:per};
    const better=String((r&&r.prompt)||'').trim();
    const patch={chk:chk};
    if(chk.best<0&&better&&!sh.ma)patch.mj=mjClean(better).slice(0,1400);
    if(chk.best>=0)shotSel[code+':'+i]=chk.best;
    busyShot=null;
    shotPatch(code,i,patch,chk.best>=0?('Image '+(chk.best+1)+' is the one that fits'):(patch.mj?'None of them fit — the prompt has been rewritten':'None of them fit'));
  }catch(e){
    busyShot=null;
    toast(e&&e.code==='images_unavailable'?'This view cannot send images to Claude':msgFor(e));
    reopen();
  }
}
/* write the prompt for one shot: the first time, and again after a bad batch */
async function genShotPrompt(code,i,again){
  const s=BY[code],sh=(s.shots||[])[i];
  if(!sh||!samp||sh.ma)return;
  if(shotLocked(code)){toast(LOCKED_BY_SCENE);return}
  busyShot=i;reopen();
  try{
    const q=PREM+'\n\nWrite ONE Midjourney prompt, for one shot of the film.\n\n'+
      'The scene: '+s.t+'. '+s.sum+'\n'+(s.story?'How the scene is filmed: '+s.story+'\n':'')+
      'Place: '+s.pl+'. Krishna in this scene: '+s.k+'.\n'+
      'The shot ('+sh.t+'): '+sh.x+'\n'+
      (again?'The prompt that failed: '+(sh.mj||'(none)')+'\nWhat was wrong with the pictures it made: '+((sh.chk&&sh.chk.note)||'they did not match')+'\n':'')+
      '\nThe prompt is a single line of comma-separated visual clauses, in this order: what is in frame and what it is doing, where it is, the time of day and the light, the shot size and lens, the mood, then the look ('+MJ_STYLE+'), and it ends with the Midjourney parameters --ar 21:9 --style raw, and with no --v or --version flag at all: Midjourney uses its newest model when no version is named, and naming an old one costs more to render. Describe only what a still image can show: no camera moves, no cuts, no sound, no words in the image. Never show more of Krishna than the scene shows. Keep it under 60 words.\n\n'+
      'Reply with only a JSON object: {"text": "the prompt"}';
    const r=await samp.json(q,{cache:false,modelTier:'default'});
    const txt=String((r&&(r.text||r.prompt))||'').trim();
    if(!txt)throw new Error('nothing came back');
    busyShot=null;
    shotPatch(code,i,{mj:mjClean(txt).slice(0,1400),chk:undefined},again?'Prompt rewritten — try it in Midjourney again':'Prompt written');
  }catch(e){busyShot=null;toast(msgFor(e));reopen()}
}
const fixShotPrompt=(code,i)=>genShotPrompt(code,i,true);

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

/* ---------- the scene workspace ----------
   One page per scene, nothing hidden behind a tab: what the scene is, then
   its shots, each with its image prompt and the image made from it, then the
   options, then the history. */
let shotEdit=null,mjEdit=null,histSel=0,histOpen=false,shotSel={};
function where(code){for(let ci=0;ci<state.cols.length;ci++){const i=state.cols[ci].ids.indexOf(code);if(i>=0)return {ci,i}}return null}
function srcHTML(code){
  const r=SRC[code];if(!r)return '';
  const body=r.u
    ? 'Follows <a href="'+esc(r.u)+'" target="_blank" rel="noopener">'+esc(r.c)+'</a> ('+esc(r.k)+').'+(r.n?' Note: '+esc(r.n)+'.':'')
    : esc(r.c)+' ('+esc(r.k)+'): this scene is not in the texts.'+(r.n?' '+esc(r.n)+'.':'');
  return '<details class="srcd"><summary>Where this comes from</summary><div class="sbody">'+body+'</div></details>';
}
function apBtn(on,attr,what,block){
  if(!on&&block)return '<button class="btn ap" type="button" disabled title="'+esc(block)+'">Approve '+what+'</button><span class="sub">'+esc(block)+'</span>';
  return '<button class="btn ap'+(on?' on':'')+'" type="button" '+attr+'>'+(on?'✓ Approved':'Approve '+what)+'</button>';
}
/* one shot: what it is, the prompt that draws it, the image it made */
function shotCard(code,x,i){
  const lock=!!x.a,plock=!!x.ma,frozen=shotLocked(code),busy=busyShot===i;
  if(shotEdit===i)return '<div class="shotcard"><div class="sform">'+
    '<input id="sht" value="'+esc(x.t||'')+'" maxlength="16" placeholder="WIDE" aria-label="Shot type">'+
    '<textarea id="shx" rows="3" placeholder="What the camera sees and does">'+esc(x.x||'')+'</textarea>'+
    '<div class="acts"><button class="btn pri" type="button" data-shsave="'+i+'">Save the shot</button><button class="btn" type="button" data-shcancel="1">Cancel</button></div></div></div>';
  let body='';
  if(!lock){
    body='<p class="sub hint">Approve this shot and it gets its Midjourney prompt, and a place to keep the pictures you make from it.</p>';
  }else if(!x.mj){
    body='<div class="mjcol"><h5>Midjourney prompt</h5>'+
      (samp?'<div class="acts"><button class="btn pri" type="button" data-mjgen="'+i+'">Generate the prompt</button>'+
        '<span class="sub">Claude writes it from this shot and the scene.</span></div>'
        :'<p class="sub">Claude is not available in this view.</p>')+
      '<div class="acts"><button class="btn" type="button" data-mjed="'+i+'">Write it by hand</button></div></div>';
  }else{
    const imgs=x.imgs||[];
    const sel=Math.min(Math.max(shotSel[code+':'+i]||0,0),Math.max(imgs.length-1,0));
    const chk=x.chk;
    const per=k=>{const q=(chk&&chk.per||[]).find(z=>z.i===k);return q?q:null};
    const strip=imgs.length
      ? '<div class="thumbs">'+imgs.map((g,k)=>{const q=per(k);
          return '<button type="button" class="thumb'+(k===sel?' sel':'')+(chk&&chk.best===k?' best':'')+(q&&!q.ok?' bad':'')+'" data-shpick="'+i+'_'+k+'" title="'+esc(q?q.note:('Image '+(k+1)))+'">'+
            '<img src="/_blob/'+esc(g.id)+'" alt="Image '+(k+1)+' for shot '+(i+1)+'" loading="lazy">'+
            '<span class="tn">'+(k+1)+(chk&&chk.best===k?' ✓':'')+'</span></button>'}).join('')+'</div>'
      : '<label class="shotimg drop" data-drop="'+i+'"><span>Paste the prompt into Midjourney, then drop the picture here<br><u>or choose a file</u></span>'+
        '<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-shadd="'+i+'" hidden></label>';
    const verdict=chk
      ? '<div class="verdict '+(chk.best>=0?'ok':'bad')+'">'+(chk.best>=0?'✓ Image '+(chk.best+1)+' is the one that fits':'✗ None of these is the shot')+
        (chk.note?'<div class="sub">'+esc(chk.note)+'</div>':'')+
        ((chk.per||[]).length>1?'<div class="sub">'+chk.per.map(q=>(q.i+1)+': '+(q.ok?'fits':'no')+(q.note?' — '+esc(q.note):'')).join('<br>')+'</div>':'')+'</div>'
      : (imgs.length?'<div class="sub">Not checked yet.</div>':'');
    const imgActs='<div class="acts">'+
      '<label class="btn">+ Add an image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-shadd="'+i+'" hidden></label>'+
      (imgs.length?'<label class="btn">Replace<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-shrep="'+i+'_'+sel+'" hidden></label>'+
        '<button class="btn warn" type="button" data-shrm="'+i+'_'+sel+'">Remove</button>'+
        (samp?'<button class="btn pri" type="button" data-shcheck="'+i+'">Check '+(imgs.length>1?('all '+imgs.length):'it')+'</button>':'')
        :'')+'</div>'+
      (imgs.length>1?'<p class="sub">Replace and Remove act on image '+(sel+1)+' — click a picture to pick another.</p>':'');
    body='<div class="shotgrid"><div class="imgcol"><h5>Images'+(imgs.length?' ('+imgs.length+')':'')+'</h5>'+strip+verdict+imgActs+'</div>'+
      '<div class="mjcol"><h5>Midjourney prompt'+(plock?' <span class="apchip">approved</span>':'')+'</h5>'+
      (mjEdit===i
        ? '<div class="sform"><textarea id="mjx" rows="5" placeholder="The prompt you would paste into Midjourney">'+esc(x.mj||'')+'</textarea>'+
          '<div class="acts"><button class="btn pri" type="button" data-mjsave="'+i+'">Save the prompt</button><button class="btn" type="button" data-mjcancel="1">Cancel</button></div></div>'
        : '<div class="mjbox">'+esc(mjClean(x.mj))+'</div>'+
          '<div class="acts"><button class="btn" type="button" data-mjcopy="'+i+'">Copy</button>'+
          (plock||frozen?'':'<button class="btn" type="button" data-mjed="'+i+'">Edit</button>'+
            '<button class="btn" type="button" data-mjgen="'+i+'">Write it again</button>')+
          (frozen?'':apBtn(plock,'data-mjap="'+i+'"','this prompt'))+'</div>')+
      '</div></div>';
  }
  return '<div class="shotcard'+(lock?' apd':'')+'" data-shot="'+i+'">'+
    '<div class="shhead"><span class="n">Shot '+(i+1)+'</span><span class="st">'+esc(x.t||'SHOT')+'</span>'+
      (busy?'<span class="busy"><i></i><i></i><i></i></span>':'')+
      '<span class="grow"></span>'+
      (lock||frozen?'':'<button class="ebtn" type="button" data-shup="'+i+'" title="Move this shot up" aria-label="Move up">↑</button>'+
        '<button class="ebtn" type="button" data-shdn="'+i+'" title="Move this shot down" aria-label="Move down">↓</button>'+
        '<button class="ebtn" type="button" data-shed="'+i+'" title="Edit this shot" aria-label="Edit">✎</button>'+
        '<button class="ebtn" type="button" data-shdel="'+i+'" title="Delete this shot" aria-label="Delete">×</button>')+
      (frozen?apChip(true):apBtn(lock,'data-shap="'+i+'"','this shot'))+'</div>'+
    '<p class="shtext">'+esc(shotText(x))+'</p>'+
    body+'</div>';
}
function aeTplPicker(cur,attr){
  return '<div class="seg" role="group" aria-label="Layout">'+
    Object.keys(AE_TPL).map(k=>'<button type="button" '+attr+'="'+k+'" aria-pressed="'+(k===cur)+'" title="'+esc(AE_TPL[k].blurb)+'">'+AE_TPL[k].label+'</button>').join('')+
    '</div>';
}
function aeSection(code){
  const rows=aeShots(code),ready=rows.filter(x=>x.file).length,gaps=rows.length-ready;
  if(!rows.length)return '';
  const tpl=aeTplOf(code);
  let h='<div class="sect" id="sect-ae"><h3>After Effects</h3>';
  if(!ready)h+='<p class="sub">Every approved shot still needs a picture its check keeps. Generate the prompt, bring the picture back, press Check, and this scene can be built.</p>';
  else{
    h+='<p class="sub">Builds a comp from the approved shots of this scene: one layer per shot, a move chosen from the shot type, cross-dissolves, the shot brief under each picture and any dialogue inside it. The zip holds the script and its pictures.</p>'+
      '<div class="orow"><span class="olab">Layout</span>'+aeTplPicker(tpl,'data-aetpl')+
        '<span class="sub">'+esc(AE_TPL[tpl].blurb)+'</span></div>'+
      '<div class="acts"><button class="btn pri" type="button" data-ae="scene">Build this scene as “'+esc(AE_TPL[tpl].label)+'”</button>'+
      '<span class="sub">'+ready+' of '+rows.length+' shots have a picture · '+aeTc(rows.reduce((a,x)=>a+x.dur,0))+' at '+AE_FPS+' fps</span></div>'+
      '<p class="sub">The layout is remembered on this scene, so building its sequence or the whole board uses the one chosen here.</p>';
    if(gaps)h+='<p class="sub">'+gaps+' approved shot'+(gaps===1?'':'s')+' without a kept picture will come through as a red card, so the hole is visible in the timeline.</p>';
  }
  return h+'</div>';
}
function aeSeqSection(id){
  const col=state.cols.find(c=>c.id===id);if(!col||!col.ids.length)return '';
  const ready=col.ids.filter(aeReady);
  let h='<div class="sect"><h3>After Effects</h3>';
  if(!ready.length)h+='<p class="sub">No scene in this sequence has an approved shot with a kept picture yet.</p>';
  else h+='<p class="sub">Builds one comp per scene in this sequence, each in the layout that scene is set to, plus a master comp that nests them in order with a marker at every scene boundary.</p>'+
    '<div class="acts"><button class="btn pri" type="button" data-ae="seq">Build this sequence</button>'+
    '<span class="sub">'+ready.length+' of '+col.ids.length+' scenes ready · '+esc(aeTplMix(ready))+'</span></div>'+
    '<div class="orow"><span class="olab">Set them all to</span>'+aeTplPicker('','data-aetplall')+
      '<span class="sub">Changes the layout of every ready scene in this sequence.</span></div>';
  return h+'</div>';
}
function shotsSection(code){
  const s=BY[code],shots=s.shots||[],frozen=shotLocked(code);
  const ap=shots.filter(x=>x.a).length,mj=shots.filter(x=>x.mj).length,imgs=shots.reduce((n,x)=>n+((x.imgs||[]).length),0);
  const busyH=asking==='h:'+code,busyM=asking==='m:'+code;
  let h='<div class="sect" id="sect-shots"><h3>Shots, prompts and images</h3>'+
    '<p class="sub">Each shot is one camera take. Approve a shot and it gets a Midjourney prompt: paste the prompt into Midjourney, bring the picture back here, and Claude will say which picture is the shot.</p>';
  if(frozen){
    h+='<div class="lockmsg">'+LOCKED_BY_SCENE+' Until then the shots, their prompts and their images stay as they are.</div>';
  }else{
    h+='<div class="acts">';
    if(samp)h+=busyH
      ?'<span class="busy"><i></i><i></i><i></i></span><span class="sub">Claude is writing the shots…</span><button class="btn" type="button" data-stop="1">Stop</button>'
      :'<button class="btn pri" type="button" data-mkshots="'+(shots.length?'again':'new')+'">'+(shots.length?'Write the shots again':'Create shots')+'</button>';
    if(!busyH)h+='<button class="btn" id="addshot" type="button">Add one by hand</button>';
    h+='<span class="sub">'+(shots.length
      ? shots.length+' '+(shots.length===1?'shot':'shots')+' · '+ap+' approved · '+mj+' with a prompt'+(imgs?' · '+imgs+' image'+(imgs===1?'':'s'):'')
      : 'No shots yet')+'</span>'+
    (mj?'<span class="grow"></span><button class="btn" type="button" id="mjcopyall">Copy every prompt</button>':'')+'</div>';
    if(!shots.length&&samp&&!busyH)h+='<p class="sub">Create shots reads the scene — what happens in it, where it is, how Krishna may appear — and writes the shots it needs. Right-click the scene on the board to steer it with an instruction instead.</p>';
    if(edErr['h:'+code])h+='<div class="err">'+esc(edErr['h:'+code])+'</div>';
    if((ov[code]&&ov[code].shotp))h+='<div class="hist">Last instruction: “'+esc(ov[code].shotp)+'”</div>';
  }
  if(shots.length)h+='<div class="shotlist">'+shots.map((x,i)=>shotCard(code,x,i)).join('')+'</div>';
  if(shotEdit===-1)h+='<div class="shotcard"><div class="sform"><input id="sht" value="" maxlength="16" placeholder="WIDE" aria-label="Shot type">'+
    '<textarea id="shx" rows="3" placeholder="What the camera sees and does"></textarea>'+
    '<div class="acts"><button class="btn pri" type="button" data-shsave="-1">Add the shot</button><button class="btn" type="button" data-shcancel="1">Cancel</button></div></div></div>';
  if(samp&&!frozen&&ap>mj)h+='<div class="acts">'+(busyM
    ?'<span class="busy"><i></i><i></i><i></i></span><span class="sub">Claude is writing the prompts…</span><button class="btn" type="button" data-stop="1">Stop</button>'
    :'<button class="btn" type="button" data-mkprompts="1">Write the prompts for the '+(ap-mj)+' approved shot'+((ap-mj)===1?'':'s')+' without one</button>')+'</div>';
  if(edErr['m:'+code])h+='<div class="err">'+esc(edErr['m:'+code])+'</div>';
  return h+'</div>';
}
function optionsSection(code){
  const s=BY[code],w=where(code),cat=catOf(code),ap=sceneAp(code);
  const colOpts=state.cols.map((c,i)=>'<option value="'+i+'"'+(w&&w.ci===i?' selected':'')+'>'+esc(colName(c))+(c.ap?' ✓':'')+'</option>').join('');
  const inAp=!!(w&&state.cols[w.ci].ap);
  return '<div class="sect"><h3>Options</h3>'+
   '<div class="orow"><span class="olab">'+T('category')+'</span><div class="seg" role="group" aria-label="'+esc(T('category'))+'">'+
     '<button type="button" data-setcat="D" aria-pressed="'+(cat==='D')+'"'+(ap?' disabled':'')+'>'+T('catD')+'</button>'+
     '<button type="button" data-setcat="A" aria-pressed="'+(cat==='A')+'"'+(ap?' disabled':'')+'>'+T('catA')+'</button></div>'+
     '<span class="sub">How it counts in the rhythm strip.</span></div>'+
   '<div class="orow"><span class="olab">Position</span>'+(w
     ?'<button class="btn" type="button" data-mv="-1">'+T('earlier')+'</button><button class="btn" type="button" data-mv="1">'+T('later')+'</button>'+
      '<label class="sub" for="dcol2">'+T('moveTo')+'</label><select id="dcol2">'+colOpts+'</select>'+
      '<button class="btn" type="button" data-unplace="1">'+T('toBin')+'</button>'
     :'<select id="dcol" aria-label="'+esc(T('sequence'))+'">'+colOpts+'</select><button class="btn pri" type="button" data-place="1">'+T('addToSeq')+'</button>')+'</div>'+
   (inAp?'<div class="lockmsg">This scene sits in an approved sequence, so it cannot be moved.</div>':'')+
   '<div class="orow"><span class="olab">Reference</span><button class="btn" type="button" data-copycode="1">Copy the code ('+code+')</button>'+
     (SRC[code]&&SRC[code].u?'<button class="btn" type="button" data-opensrc="1">Open the source ↗</button>':'')+'</div>'+
   '</div>';
}
function histSection(code){
  const s=BY[code],h=s.hist||[];
  if(!h.length)return '<div class="sect"><h3>History</h3><p class="sub">This scene has not been changed yet. Every edit from here on is kept, with the earlier wording beside the new one.</p></div>';
  const sel=Math.min(histSel,h.length-1),v=h[sel];
  const rows=h.map((x,i)=>'<button class="vrow" type="button" data-ver="'+i+'" aria-pressed="'+(i===sel)+'"><b>'+(x.base?'The original':esc(x.t||'Earlier version'))+'</b>'+
    '<span>'+esc(when(x.at))+(x.prompt?' · “'+esc(x.prompt)+'”':'')+'</span></button>').join('');
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
  return '<details class="sect hsect"'+(histOpen?' open':'')+'><summary><h3>History ('+h.length+')</h3></summary>'+
    '<div class="vrows">'+rows+'</div>'+
    '<p class="sub">Red is what that version said; green is what it says now.</p>'+
    d+(meta.length?'<p class="sub">'+meta.join(' · ')+'</p>':'')+
    (sceneAp(code)?'<div class="lockmsg">'+LOCKED_SCENE+'</div>'
      :'<div class="acts"><button class="btn" type="button" data-restore="'+sel+'">Restore this version</button></div>')+
    '</details>';
}
function scenePanel(code,keep){
  const s=BY[code];if(!s)return;
  if(openCode!==code){histSel=0;shotEdit=null;mjEdit=null;histOpen=false}
  openCode=code;openSeq=null;
  const w=where(code),cat=catOf(code),order=flat(),ap=sceneAp(code);
  $('drawer').innerHTML=
   '<div class="sbar"><button class="btn" id="dclose" type="button">‹ Back to the board</button>'+
     '<span class="code">'+code+'</span>'+
     '<span class="chip" style="'+(cat==='A'?'background:var(--action-bg);color:var(--action)':'')+'">'+catLabel(cat)+'</span>'+
     (s.ed?'<span class="edflag">edited</span>':'')+apChip(ap)+
     '<span class="sub">'+(w?esc(T('pos',{p:order.indexOf(code)+1,n:order.length,s:colName(state.cols[w.ci])})):esc(T('inBin')))+'</span>'+
     '<span class="grow"></span>'+apBtn(ap,'data-sceneap="1"','this scene',ap?'':sceneApBlock(code))+'</div>'+
   '<div class="sheet">'+
   '<div class="sect first"><h3>The scene</h3><h1>'+esc(sc(s,'t'))+'</h1>'+
     (ap?'<div class="lockmsg">Approved '+esc(when(s.apAt))+'. Nothing rewrites this scene, its shots, its prompts or its images until the approval is taken off'+(seqHolding(code)?', and its sequence is approved too, so that one comes off first':'')+'.</div>'
       :'<p class="sub">'+esc(sceneApBlock(code)||'Every shot is approved — this scene is ready to approve.')+'</p>')+
     '<div class="scgrid"><div>'+
       '<h4>'+T('hWhat')+'</h4><p>'+esc(sc(s,'sum'))+'</p>'+
       (s.story?'<h4>'+T('hCG')+'</h4><p>'+esc(sc(s,'story'))+'</p>':'')+
       '<h4>'+T('hWhy')+'</h4><p>'+esc(sc(s,'why'))+'</p>'+
       (s.turn?'<h4>'+T('hTurn')+'</h4><p>'+esc(sc(s,'turn'))+'</p>':'')+
     '</div><div>'+
       '<dl class="kv"><dt>'+T('kEvent')+'</dt><dd>'+esc(term('evn',s.evn))+' ('+s.src+')</dd><dt>'+T('kPlace')+'</dt><dd>'+esc(term('pl',s.pl))+'</dd><dt>'+T('kPov')+'</dt><dd>'+esc(term('pov',s.pov))+'</dd><dt>'+T('kKrishna')+'</dt><dd>'+esc(term('k',s.k))+'</dd><dt>'+T('kRasa')+'</dt><dd>'+esc(term('rasa',s.rasa))+'</dd><dt>'+T('kRun')+'</dt><dd>'+esc(s.mins)+' '+T('min')+'</dd><dt>'+T('kTier')+'</dt><dd>'+T('tierOf',{t:s.tier})+'</dd></dl>'+
       '<div class="tags">'+s.gen.map(g=>'<span>'+esc(term('gen',g))+'</span>').join('')+'</div>'+
       srcHTML(code)+
     '</div></div>'+
     (ap||!samp?'':(asking==='s:'+code
       ?'<div class="acts"><span class="busy"><i></i><i></i><i></i></span><span class="sub">Claude is rewriting the scene…</span><button class="btn" type="button" data-stop="1">Stop</button></div>'
       :(edErr['s:'+code]?'<div class="err">'+esc(edErr['s:'+code])+'</div>':'')+
        (s.lastp?'<div class="hist">Last instruction: “'+esc(s.lastp)+'”</div>':'')))+
   '</div>'+
   shotsSection(code)+
   aeSection(code)+
   optionsSection(code)+
   histSection(code)+
   '</div>';
  $('drawer').hidden=false;$('veil').hidden=true;
  if(!keep){$('drawer').scrollTop=0;$('dclose').focus()}
}
function seqPanel(id,keep){
  const col=state.cols.find(c=>c.id===id);if(!col){closeDrawer();return}
  openSeq=id;openCode=null;
  const mins=col.ids.reduce((a,i)=>a+BY[i].mid,0),note=colNote(col);
  const shots=col.ids.reduce((a,i)=>a+((BY[i].shots||[]).length),0);
  const imgs=col.ids.reduce((a,i)=>a+((BY[i].shots||[]).filter(x=>x.img).length),0);
  const list=col.ids.length
    ? '<div class="seqlist">'+col.ids.map((i,n)=>{const x=BY[i];
        return '<button class="vrow" type="button" data-open="'+i+'"><b>'+(n+1)+'. '+esc(sc(x,'t'))+'</b>'+
          '<span>'+i+' · '+catLabel(catOf(i))+' · '+esc(x.mins)+' '+T('min')+
          ((x.shots||[]).length?' · '+x.shots.filter(y=>y.a).length+'/'+x.shots.length+' shots':'')+(sceneAp(i)?' · approved':'')+'</span></button>'}).join('')+'</div>'
    : '<p class="sub">No scenes here yet.</p>';
  $('drawer').innerHTML=
   '<div class="sbar"><button class="btn" id="dclose" type="button">‹ Back to the board</button>'+
     '<span class="code">SEQUENCE</span>'+apChip(col.ap)+
     '<span class="sub">'+col.ids.length+' '+T(col.ids.length===1?'scene':'scenes')+' · ≈ '+fmtMin(mins)+(shots?' · '+shots+' shots':'')+(imgs?' · '+imgs+' images':'')+'</span>'+
     '<span class="grow"></span>'+apBtn(col.ap,'data-seqap="'+esc(id)+'"','this sequence',col.ap?'':seqApBlock(col))+'</div>'+
   '<div class="sheet">'+
   '<div class="sect first"><h3>The sequence</h3><h1>'+esc(colName(col))+'</h1>'+
     (col.ap?'<div class="lockmsg">Approved '+esc(when(col.apAt))+'. Its name, its story context and the order of its scenes are locked, its scenes cannot be unapproved, and it cannot be deleted.</div>'
       :'<p class="sub">'+esc(seqApBlock(col)||'Every scene in it is approved — this sequence is ready to approve.')+'</p>')+
     (note?'<h4>Story context</h4><p>'+esc(note)+'</p>':'<p class="sub">No story context yet.</p>')+
     (col.ap?'':(samp?edPanel('q:'+id,'Rename it or change its context','e.g. call it “Ink and the letter” and say in two lines what it does in the story · put the night scenes last',col.lastp||''):''))+
   '</div>'+
   '<div class="sect"><h3>Scenes in order</h3>'+list+'</div>'+
   aeSeqSection(id)+
   '<div class="sect"><h3>Options</h3><div class="orow"><span class="olab">This sequence</span>'+
     '<button class="btn" type="button" data-seqread="'+esc(id)+'">Read it through</button>'+
     '<button class="btn warn" type="button" data-seqdel="'+esc(id)+'"'+(col.ap?' disabled':'')+'>Delete it</button></div></div>'+
   '</div>';
  $('drawer').hidden=false;$('veil').hidden=true;
  if(!keep){$('drawer').scrollTop=0;$('dclose').focus()}
}
const drawer=scenePanel,seqDrawer=seqPanel;
function closeDrawer(){
  if(asking&&ctl){ctl.abort();asking=null}
  openCode=null;openSeq=null;edErr={};shotEdit=null;mjEdit=null;busyShot=null;$('drawer').hidden=true;$('veil').hidden=true;
}
function place(code,ci,at){
  if(!state.cols.length)state.cols.push({id:'c'+Date.now(),name:'Sequence A',ids:[]});
  ci=Math.max(0,Math.min(ci,state.cols.length-1));
  const w=where(code);
  if(w&&state.cols[w.ci].ap){toast('That scene sits in an approved sequence');return false}
  if(state.cols[ci].ap){toast('That sequence is approved — its order is locked');return false}
  if(w)state.cols[w.ci].ids.splice(w.i,1);
  const ids=state.cols[ci].ids;ids.splice(at==null?ids.length:at,0,code);
  return true;
}
function move(code,d){
  const w=where(code);if(!w)return false;
  if(state.cols[w.ci].ap){toast(LOCKED_SEQ);return false}
  const nx=state.cols[w.ci+(d<0?-1:1)];
  const ids=state.cols[w.ci].ids,t=w.i+d;
  if((t<0||t>=ids.length)&&nx&&nx.ap){toast('The next sequence is approved — its order is locked');return false}
  if(t>=0&&t<ids.length){const x=ids[w.i];ids[w.i]=ids[t];ids[t]=x}
  else if(d<0&&w.ci>0){ids.splice(w.i,1);state.cols[w.ci-1].ids.push(code)}
  else if(d>0&&w.ci<state.cols.length-1){ids.splice(w.i,1);state.cols[w.ci+1].ids.unshift(code)}
  return true;
}

/* ---------- read-through ---------- */
let rdMj=false;
function readThrough(keep){
  const order=flat();
  const b=curBoard();
  let n=0,h='<div class="rbar"><span class="rstat">'+order.length+' '+T(order.length===1?'scene':'scenes')+' · ≈ '+fmtMin(order.reduce((a,i)=>a+BY[i].mid,0))+'</span>'+
    '<button class="btn" id="rmj" type="button" aria-pressed="'+rdMj+'">Image prompts: '+(rdMj?'on':'off')+'</button>'+
    '<button class="btn" id="rprint" type="button">Print</button><button class="btn" id="rclose" type="button">Close</button></div>'+
    '<div class="rwrap"><h1>'+esc(bName(b))+'</h1>'+(bDesc(b)?'<div class="rdesc">'+esc(bDesc(b))+'</div>':'');
  if(!order.length)h+='<p class="rdesc">Nothing is on this board yet.</p>';
  state.cols.forEach(c=>{
    if(!c.ids.length)return;
    const mins=c.ids.reduce((a,i)=>a+BY[i].mid,0);
    h+='<div class="rseq"><h2>'+esc(colName(c))+(c.ap?' <span class="apchip">approved</span>':'')+'</h2><div class="rstat">'+c.ids.length+' '+T(c.ids.length===1?'scene':'scenes')+' · ≈ '+fmtMin(mins)+'</div>'+
      (colNote(c)?'<div class="rnote">'+esc(colNote(c))+'</div>':'')+'</div>';
    c.ids.forEach(i=>{
      const s=BY[i];n++;
      h+='<div class="rsc"><div class="rh"><span>'+n+'</span><span>'+i+'</span>'+(s.ap?'<span class="apchip">approved</span>':'')+'<span>'+catLabel(catOf(i)).toUpperCase()+'</span><span>'+esc(term('pl',s.pl))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span></div>'+
        '<h3>'+esc(sc(s,'t'))+'</h3>'+
        '<p>'+esc(sc(s,'sum'))+'</p>'+
        (s.story?'<p class="rcg">'+esc(sc(s,'story'))+'</p>':'')+
        (s.turn?'<p class="rcg"><b>'+T('hTurn')+'</b> — '+esc(sc(s,'turn'))+'</p>':'')+
        ((s.shots&&s.shots.length)?'<ul class="rshots">'+s.shots.map((x,k)=>'<li><b>'+(k+1)+' · '+esc(x.t)+'</b>'+(x.a?' <span class="apchip">approved</span>':'')+' — '+esc(shotText(x))+
          (x.img?'<div class="rimg"><img src="/_blob/'+esc(x.img)+'" alt="" loading="lazy"></div>':'')+
          (rdMj&&x.mj?'<div class="mjbox">'+esc(mjClean(x.mj))+'</div>':'')+'</li>').join('')+'</ul>':'')+
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
  const s=BY[code];
  const h='<div class="ch">'+esc(sc(s,'t'))+'</div>'+
    '<button type="button" data-cx="open">Open this scene</button>'+
    '<button type="button" data-cx="shots">Go to its shots'+((s.shots||[]).length?' ('+s.shots.length+')':'')+'</button>'+
    '<button type="button" data-cx="rename"'+(s.ap?' disabled':'')+'>Rename…</button>'+
    (samp?'<button type="button" data-cx="ask"'+(s.ap?' disabled':'')+'>Rewrite it with an instruction…</button>'+
      '<button type="button" data-cx="askshots"'+(shotLocked(code)?' disabled':'')+'>Change the shots with an instruction…</button>':'')+'<hr>'+
    '<button type="button" data-cx="approve">'+(s.ap?'Remove the approval':'Approve this scene')+'</button>';
  showCtx(x,y,h,'scene',code);
}
function ctxSeq(id,x,y){
  const col=state.cols.find(c=>c.id===id);if(!col)return;
  const h='<div class="ch">'+esc(colName(col))+'</div>'+
    '<button type="button" data-cx="open">Open this sequence</button>'+
    '<button type="button" data-cx="read">Read it through</button>'+
    '<button type="button" data-cx="rename"'+(col.ap?' disabled':'')+'>Rename…</button><hr>'+
    '<button type="button" data-cx="approve">'+(col.ap?'Remove the approval':'Approve this sequence')+'</button>'+
    '<button type="button" data-cx="after">Add a sequence after this</button>'+
    '<button type="button" data-cx="del"'+(col.ap?' disabled':'')+'>Delete the sequence</button>';
  showCtx(x,y,h,'seq',id);
}
function ctxRename(cur){
  const c=$('ctx');
  c.innerHTML='<div class="ch">Rename</div><input id="ctxin" value="'+esc(cur)+'" maxlength="90"><div class="acts" style="padding:6px 4px 2px"><button class="btn pri" type="button" data-cx="rsave">Save</button><button class="btn" type="button" data-cx="rcancel">Cancel</button></div>';
  const i=$('ctxin');i.focus();i.select();
}
/* the prompt lives here instead of on the scene page */
function ctxAsk(kind,ph){
  const c=$('ctx');
  c.innerHTML='<div class="ch">'+(kind==='ask'?'Rewrite the scene':'Change the shots')+'</div>'+
    '<input id="ctxin" value="" maxlength="240" placeholder="'+esc(ph)+'">'+
    '<div class="acts" style="padding:6px 4px 2px"><button class="btn pri" type="button" data-cx="asksave">Ask Claude</button><button class="btn" type="button" data-cx="rcancel">Cancel</button></div>';
  ctxAskKind=kind;const i=$('ctxin');i.focus();
}
let ctxAskKind=null;

/* ---------- hover preview ---------- */
let peekT=null,peekFor=null,peekArm=null;
function hidePeek(){clearTimeout(peekT);peekT=null;peekFor=null;peekArm=null;$('peek').hidden=true}
function showPeek(code,el){
  const s=BY[code];if(!s)return;
  const sh=(s.shots||[]).slice(0,3);
  $('peek').innerHTML='<div class="pm"><span>'+code+'</span>'+(s.ap?'<span class="apchip">approved</span>':'')+'<span>'+catLabel(catOf(code)).toUpperCase()+'</span><span>'+esc(term('evn',s.evn))+'</span><span>'+esc(s.mins)+' '+T('min')+'</span></div>'+
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
  const add=t.closest('[data-add]');if(add){if(place(add.dataset.add,state.cols.length-1)){persist();render();toast('tAdded',{s:colName(state.cols[state.cols.length-1])})}return}
  const mo=t.closest('[data-more]');if(mo){const r=mo.getBoundingClientRect();hidePeek();ctxScene(mo.dataset.more,r.left-4,r.bottom+4);return}
  const fo=t.closest('[data-fold]');if(fo){toggleFold(fo.dataset.fold);return}
  const sq=t.closest('[data-seq]');if(sq){seqPanel(sq.dataset.seq);return}
  const del=t.closest('[data-del]');if(del){delSeq(del.dataset.del);return}
  if(t.id==='newcol'){addSeq();return}
  if(t.id==='delboard'){delBoard();return}
  const bt=t.closest('[data-board]');if(bt){switchBoard(bt.dataset.board);return}
  if(t.id==='dupboard'){dupBoard();return}
  if(t.id==='btn-read'){readThrough();return}
  if(t.id==='rclose'){closeRead();return}
  if(t.id==='rmj'){rdMj=!rdMj;readThrough(true);return}
  if(t.id==='rprint'){window.print();return}
  const op=t.closest('[data-open]');if(op){scenePanel(op.dataset.open);return}
  if(t.closest('#ctx')){
    const b=t.closest('button[data-cx]');if(!b||!ctxFor)return;
    const a=b.dataset.cx,k=ctxFor.kind,id=ctxFor.id;
    if(a==='rename'){
      if(k==='scene'&&sceneAp(id)){hideCtx();toast(LOCKED_SCENE);return}
      if(k==='seq'&&seqApId(id)){hideCtx();toast(LOCKED_SEQ);return}
      ctxRename(k==='scene'?sc(BY[id],'t'):colName(state.cols.find(c=>c.id===id)||{name:''}));return}
    if(a==='ask'){if(sceneAp(id)){hideCtx();toast(LOCKED_SCENE);return}
      ctxAsk('ask','e.g. make the turn land harder · give her the last line · move it to night');return}
    if(a==='askshots'){if(shotLocked(id)){hideCtx();toast(LOCKED_SCENE);return}
      ctxAsk('askshots','e.g. six shots, open on the lamp and end on her face');return}
    if(a==='asksave'){const v=$('ctxin').value.trim();const kk=ctxAskKind;hideCtx();
      if(v&&k==='scene'){scenePanel(id);runEdit((kk==='ask'?'s:':'h:')+id,v)}return}
    if(a==='rcancel'){hideCtx();return}
    if(a==='rsave'){const v=$('ctxin').value;hideCtx();if(k==='scene')renameScene(id,v);else renameSeq(id,v);return}
    hideCtx();
    if(k==='scene'){
      if(a==='open'){scenePanel(id)}
      else if(a==='shots'){scenePanel(id);const el=$('sect-shots');if(el)el.scrollIntoView({block:'start'})}
      else if(a==='approve'){setSceneAp(id,!sceneAp(id))}
    }else{
      if(a==='open'){seqPanel(id)}
      else if(a==='read'){readSeq(id)}
      else if(a==='approve'){setSeqAp(id,!seqApId(id))}
      else if(a==='after'){addSeq(id)}
      else if(a==='del'){delSeq(id)}
    }
    return;
  }
  if(t.closest('#drawer')){
    const b=t.closest('button');if(!b)return;
    if(b.id==='dclose'){closeDrawer();return}
    if(b.dataset.go){runEdit(b.dataset.go);return}
    if(b.dataset.stop){if(ctl)ctl.abort();return}
    if(b.dataset.ae){aeExport(b.dataset.ae,b.dataset.ae==='seq'?openSeq:openCode);return}
    if(b.dataset.aetpl){setAeTpl(openCode,b.dataset.aetpl);return}
    if(b.dataset.aetplall){const col=state.cols.find(c=>c.id===openSeq);
      if(col){col.ids.filter(aeReady).forEach(c=>setAeTpl(c,b.dataset.aetplall));
        toast('Every ready scene in this sequence will build as “'+AE_TPL[b.dataset.aetplall].label+'”');reopen()}
      return}
    if(b.dataset.mkshots){runEdit('h:'+openCode,b.dataset.mkshots==='again'
      ?'Write the shot list for this scene again from scratch.'
      :'Break this scene into the shots it needs, in order.');return}
    if(b.dataset.mkprompts){runEdit('m:'+openCode,'Write a Midjourney prompt for every approved shot that has not got one.');return}
    if(b.dataset.sceneap){setSceneAp(openCode,!sceneAp(openCode));return}
    if(b.dataset.shcheck!=null){checkShotImages(openCode,+b.dataset.shcheck);return}
    if(b.dataset.mjgen!=null){const i=+b.dataset.mjgen;genShotPrompt(openCode,i,!!(BY[openCode].shots||[])[i].mj);return}
    if(b.dataset.shpick){const q=b.dataset.shpick.split('_');shotSel[openCode+':'+q[0]]=+q[1];reopen();return}
    if(b.dataset.shrm){
      const q=b.dataset.shrm.split('_'),i=+q[0],k=+q[1],x=(BY[openCode].shots||[])[i];
      if(!x||!(x.imgs||[])[k])return;
      const id=x.imgs[k].id,imgs=x.imgs.slice();imgs.splice(k,1);
      if(assets&&id)assets.delete(id).catch(()=>{});
      shotSel[openCode+':'+i]=Math.max(0,k-1);
      shotPatch(openCode,i,{imgs:imgs.length?imgs:undefined,chk:undefined},'Image removed');return}
    if(b.id==='addshot'){shotEdit=-1;mjEdit=null;reopen();const x=$('shx');if(x)x.focus();return}
    if(b.dataset.shsave!=null){
      const i=+b.dataset.shsave,type=$('sht').value,txt=$('shx').value;
      const a=(BY[openCode].shots||[]).slice();
      if(i<0)a.push({t:type,x:txt});else a[i]=Object.assign({},a[i],{t:type,x:txt,te:''});
      shotEdit=null;setShots(openCode,a,i<0?'Shot added':'Shot saved');return;
    }
    if(b.dataset.shcancel){shotEdit=null;reopen();return}
    if(b.dataset.shed!=null){shotEdit=+b.dataset.shed;mjEdit=null;reopen();const x=$('shx');if(x)x.focus();return}
    if(b.dataset.shdel!=null){const a=(BY[openCode].shots||[]).slice();a.splice(+b.dataset.shdel,1);shotEdit=null;setShots(openCode,a,'Shot deleted');return}
    if(b.dataset.shup!=null){moveShot(openCode,+b.dataset.shup,-1);return}
    if(b.dataset.shdn!=null){moveShot(openCode,+b.dataset.shdn,1);return}
    if(b.dataset.ver!=null){histSel=+b.dataset.ver;histOpen=true;reopen();return}
    if(b.dataset.restore!=null){restoreVersion(openCode,+b.dataset.restore);return}
    if(b.dataset.setcat){const c=openCode;if(b.dataset.setcat===BASE[c].cat)delete state.cat[c];else state.cat[c]=b.dataset.setcat;persist(true);render();return}
    if(b.dataset.mv){if(move(openCode,+b.dataset.mv)){persist();render()}return}
    if(b.dataset.unplace){const w=where(openCode);if(!w)return;
      if(state.cols[w.ci].ap){toast(LOCKED_SEQ);return}
      state.cols[w.ci].ids.splice(w.i,1);persist();render();return}
    if(b.dataset.place){if(place(openCode,+$('dcol').value)){persist();render()}return}
    if(b.dataset.seqap){setSeqAp(b.dataset.seqap,!seqApId(b.dataset.seqap));return}
    if(b.dataset.seqread){readSeq(b.dataset.seqread);return}
    if(b.dataset.seqdel){delSeq(b.dataset.seqdel);return}
    if(b.dataset.shap!=null){const i=+b.dataset.shap,x=(BY[openCode].shots||[])[i];if(x)setShotAp(openCode,i,'a',!x.a);return}
    if(b.dataset.mjap!=null){const i=+b.dataset.mjap,x=(BY[openCode].shots||[])[i];if(x)setShotAp(openCode,i,'ma',!x.ma);return}
    if(b.dataset.mjcopy!=null){const x=(BY[openCode].shots||[])[+b.dataset.mjcopy];
      if(x&&x.mj&&navigator.clipboard)navigator.clipboard.writeText(mjClean(x.mj)).then(()=>toast('Prompt copied'),()=>toast('Could not copy'));return}
    if(b.id==='mjcopyall'){const s=BY[openCode],txt=(s.shots||[]).map((x,i)=>x.mj?((i+1)+'. '+mjClean(x.mj)):null).filter(Boolean).join('\n\n');
      if(txt&&navigator.clipboard)navigator.clipboard.writeText(sc(s,'t')+'\n\n'+txt).then(()=>toast('All the prompts copied'),()=>toast('Could not copy'));return}
    if(b.dataset.mjed!=null){mjEdit=+b.dataset.mjed;shotEdit=null;reopen();const x=$('mjx');if(x)x.focus();return}
    if(b.dataset.mjcancel){mjEdit=null;reopen();return}
    if(b.dataset.mjsave!=null){const i=+b.dataset.mjsave,v=$('mjx').value.trim();
      const a=(BY[openCode].shots||[]).slice();if(!a[i])return;
      a[i]=Object.assign({},a[i]);if(v)a[i].mj=mjClean(v);else delete a[i].mj;
      mjEdit=null;setShots(openCode,a,v?'Prompt saved':'Prompt cleared');return}
    if(b.dataset.copycode){if(navigator.clipboard)navigator.clipboard.writeText(openCode).then(()=>toast('Copied '+openCode),()=>{});return}
    if(b.dataset.opensrc){const r=SRC[openCode];if(r&&r.u)window.open(r.u,'_blank','noopener');return}
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
  if(state.cols[i].ap){toast(LOCKED_SEQ);return}
  const n=state.cols[i].ids.length;
  if(openSeq===id)closeDrawer();
  state.cols.splice(i,1);persist();render();
  toast(n?'tReturned':'tSeqDel',{n,w:T(n===1?'scene':'scenes')});
}
function renameSeq(id,v){
  const c=state.cols.find(x=>x.id===id);if(!c)return;
  if(c.ap){toast(LOCKED_SEQ);render();return}
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
  if(e.target.classList&&e.target.classList.contains('edp')){const k=e.target.dataset.k;if(k)draft[k]=e.target.value}
});
document.addEventListener('change',e=>{
  const t=e.target;if(!t.closest||!t.files||!t.files[0]||openCode==null)return;
  if(t.dataset.shadd!=null){addShotImage(openCode,+t.dataset.shadd,t.files[0]);t.value=''}
  else if(t.dataset.shrep!=null){const q=t.dataset.shrep.split('_');addShotImage(openCode,+q[0],t.files[0],+q[1]);t.value=''}
});
document.addEventListener('dragover',e=>{const d=e.target.closest&&e.target.closest('[data-drop]');if(d){e.preventDefault();d.classList.add('over')}});
document.addEventListener('dragleave',e=>{const d=e.target.closest&&e.target.closest('[data-drop]');if(d)d.classList.remove('over')});
document.addEventListener('drop',e=>{
  const d=e.target.closest&&e.target.closest('[data-drop]');if(!d)return;
  e.preventDefault();d.classList.remove('over');
  const f=e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files[0];
  if(f&&openCode!=null)addShotImage(openCode,+d.dataset.drop,f);
});
document.addEventListener('change',e=>{
  if(e.target.id==='bname'){const v=e.target.value.trim();if(v!==bName(curBoard())){if(isTe()){curBoard().te=curBoard().te||{};curBoard().te.name=v}else curBoard().name=v||('Board '+bid(active));persist()}renderTabs()}
  if(e.target.id==='dcol2'){if(place(openCode,+e.target.value)){persist();render()}else render()}
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
  if(e.target.classList&&e.target.classList.contains('edp')){if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();runEdit(e.target.dataset.k)}return}
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
$('btn-ae').addEventListener('click',()=>aeExport('board'));
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
