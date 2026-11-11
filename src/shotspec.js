/* shotspec — the one document every application downstream of the board reads.

   A shot on the board is a line of prose with a type. A shot in a CG pipeline
   is a set, a cast, a camera and a duration. This module is the only place
   that turns one into the other, so After Effects, Blender and everything
   after them agree about what a shot is.

   Two rules are built in here rather than left to each exporter:

   1. Identity never encodes position. A shot's id comes from the scene code
      and the shot itself. Where it falls in the film lives under `view`, and
      nothing may be named from `view`.
   2. Anything the board worked out rather than was told is marked `derived`,
      so a guess can always be told from a decision.

   Runs in the page (the build inlines it) and in Node (scripts/shotspec.js). */
const ShotSpec=(function(){
  const VERSION='1.0.0',FORMAT='shotspec/1',FPS=24,FRAME=[1680,720];

  /* how much of a scene's time a kind of shot takes when nobody has said */
  const W={EWS:1.5,WIDE:1.4,WS:1.4,ESTABLISHING:1.5,POV:1.2,TRACKING:1.2,DOLLY:1.2,CRANE:1.3,AERIAL:1.4,OVER:1.1,OTS:1.1,MS:1,MEDIUM:1,CLOSE:1,CU:1,MCU:1,ECU:.9,INSERT:.7,MACRO:.7,DETAIL:.7,CUTAWAY:.8};
  /* the camera a kind of shot starts from: lens, height, angle, move, and how
     many frame-heights tall a standing figure is (0.42 = full figure with
     room, 4.2 = a face) */
  const CAM={
    EWS:[18,6,'high','static',.12],ESTABLISHING:[18,6,'high','static',.12],AERIAL:[18,40,'top','drift',.05],
    WIDE:[24,1.6,'eye','static',.42],WS:[24,1.6,'eye','static',.42],
    MS:[50,1.5,'eye','static',1.8],MEDIUM:[50,1.5,'eye','static',1.8],
    OVER:[50,1.6,'eye','static',1.4],OTS:[50,1.6,'eye','static',1.4],
    POV:[35,1.6,'eye','static',.55],
    CLOSE:[85,1.55,'eye','static',4.2],CU:[85,1.55,'eye','static',4.2],MCU:[70,1.5,'eye','static',2.8],
    ECU:[100,1.6,'eye','static',11],
    INSERT:[100,1,'high','static',4.2],MACRO:[100,.6,'high','static',11],DETAIL:[100,1,'high','static',4.2],
    CUTAWAY:[50,1.5,'eye','static',1.8],
    TRACKING:[35,1.5,'eye','track',.8],DOLLY:[40,1.5,'eye','push',1],CRANE:[28,5,'high','crane',.3]};
  const DEF_CAM=[35,1.6,'eye','static',.8];

  function kind(t){
    const ws=String(t||'').toUpperCase().split(/[^A-Z-]+/).filter(Boolean);
    for(const w of ws)if(W[w]||CAM[w])return w;
    return ws[0]||'';
  }
  const r3=n=>Math.round(n*1000)/1000,r6=n=>Math.round(n*1e6)/1e6;
  function plain(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[’‘]/g,"'")}
  function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
  /* the part of a shot's id that belongs to the shot: stored once and kept,
     or — until it has been stored — worked out from the words, which an
     approved shot cannot change */
  function sidOf(shot,taken){
    let s=String(shot.sid||'').replace(/[^a-z0-9]/g,'').slice(0,8);
    if(!s){
      const base=String(shot.t||'')+'|'+String(shot.x||'');
      let n=0;
      do{s=('0000'+hash(base+(n?'#'+n:''))).slice(-5);n++}while(taken&&taken[s]);
    }
    if(taken)taken[s]=1;
    return s;
  }
  /* give every shot in a list its sid, keeping the ones it has */
  function stamp(shots){
    const taken={};
    (shots||[]).forEach(x=>{if(x&&x.sid)taken[x.sid]=1});
    return (shots||[]).map(x=>x&&!x.sid?Object.assign({},x,{sid:sidOf(x,taken)}):x);
  }
  const shotId=(code,sid)=>code+'_'+sid;
  const safe=id=>String(id).replace(/[^A-Za-z0-9_]/g,'');

  /* seconds per shot: what was set stays, the rest of the scene's time is
     shared by kind */
  function durations(shots,total){
    const set=shots.map(x=>{const d=x.cam&&Number(x.cam.dur);return isFinite(d)&&d>0?d:0});
    const fixed=set.reduce((a,b)=>a+b,0);
    const ws=shots.map((x,i)=>set[i]?0:(W[kind(x.t)]||1)),sum=ws.reduce((a,b)=>a+b,0);
    const open=shots.length-set.filter(Boolean).length;
    const left=Math.max(total-fixed,open*1);
    return shots.map((x,i)=>set[i]?{d:set[i],src:'authored'}:{d:sum?left*ws[i]/sum:0,src:'derived'});
  }
  function todOf(text,fallback){
    const t=plain(text);
    if(/\b(night|moon|moonlight|midnight|torch|torchlight|lamp|stars?|sleeps?|sleeping|asleep)\b/.test(t))return 'night';
    if(/\b(dawn|pre-dawn|sunrise|first light)\b/.test(t))return 'dawn';
    if(/\b(dusk|evening|sunset|twilight)\b/.test(t))return 'dusk';
    return fallback||'day';
  }
  function find(text,alias){
    let at=-1;
    for(const a of alias||[]){
      const m=new RegExp('(^|[^a-z])'+a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'([^a-z]|$)').exec(text);
      if(m&&(at<0||m.index<at))at=m.index;
    }
    return at;
  }
  /* who a shot's words put in frame, out of the people its scene holds, in the
     order the words reach them */
  function castOf(text,ent,ents){
    const t=plain(text),hit=[];
    const pool=(ent.cast||[]).concat(ent.off||[]).filter((c,i,a)=>a.indexOf(c)===i);
    pool.forEach(id=>{
      const c=ents.characters[id];if(!c)return;
      let al=c.alias||[];
      if(id==='krishna'&&ent.krishna&&ent.krishna!=='face')al=al.concat(ents.oblique||[]);
      const at=find(t,al);
      if(at>=0)hit.push([at,id]);
    });
    return hit.sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
  }
  function propsOf(text,ent,ents){
    const t=plain(text);
    return (ent.props||[]).filter(id=>ents.props[id]&&find(t,ents.props[id].alias)>=0);
  }

  /* which picture is a shot's picture: the one its check kept */
  function pick(sh){
    const imgs=sh.imgs||[];if(!imgs.length)return null;
    const chk=sh.chk||{},b=chk.best;
    if(typeof b==='number'&&b>=0&&b<imgs.length)return{id:imgs[b].id,why:'checked: picture '+(b+1)+' of '+imgs.length+' kept'};
    if(typeof b==='number'&&b<0)return null;      /* the check said none of them is the shot */
    const ok=(chk.per||[]).filter(p=>p&&p.ok&&typeof p.i==='number');
    if(ok.length&&ok[0].i<imgs.length)return{id:imgs[ok[0].i].id,why:'checked: picture '+(ok[0].i+1)+' passed'};
    return{id:imgs[0].id,why:imgs.length===1?'one picture, not checked':imgs.length+' pictures, not checked — the first is used'};
  }

  /* one scene, resolved.
     rec   the scene record, with its shots
     ent   its row in scene_entities
     ents  the entity lists
     opts  {all:true} to include shots that are not approved,
           pick(shot) -> {id,why}|null to say which picture is the shot's */
  function scene(code,rec,ent,ents,opts){
    opts=opts||{};ent=ent||{set:'',sub:'',cast:[]};
    const stamped=stamp(rec.shots||[]);
    const got=stamped.filter(x=>opts.all||x.a);
    const total=(rec.mid||1.5)*60,ds=durations(got,total);
    const sceneTod=todOf((rec.pl||'')+' '+(rec.sum||'')+' '+got.map(x=>x.x||'').join(' '),'day');
    let at=0,prev=null;
    const off=ent.off||[];
    const shots=got.map((x,i)=>{
      const k=kind(x.t),c=CAM[k]||DEF_CAM,cam=x.cam||{},d=ds[i];
      const authoredCast=Array.isArray(x.cast)&&x.cast.length;
      const cast=authoredCast?x.cast.slice():castOf(x.x,ent,ents);
      const place=(typeof x.set==='string'&&x.set.indexOf('/')>0)?x.set:(ent.set?ent.set+'/'+ent.sub:'');
      const img=opts.pick?opts.pick(x):null;
      const id=shotId(code,x.sid);
      const cont=x.cont||{};
      const s={
        id:id,n:i+1,type:x.t||'SHOT',kind:k,text:x.x||'',approved:!!x.a,
        set:place,
        cast:cast.filter(c2=>off.indexOf(c2)<0),
        off:cast.filter(c2=>off.indexOf(c2)>=0),
        cast_src:authoredCast?'authored':'derived',
        props:propsOf(x.x,ent,ents),
        camera:{
          lens_mm:Number(cam.lens)>0?Number(cam.lens):c[0],
          height_m:Number(cam.h)>0?Number(cam.h):c[1],
          angle:cam.ang||c[2],move:cam.mv||c[3],fill:c[4],
          src:(Number(cam.lens)>0||Number(cam.h)>0||cam.ang||cam.mv)?'authored':'derived',
          start_s:r6(at),duration_s:r6(d.d),duration_src:d.src},
        continuity:{prev:prev,screen_direction:cont.dir||'L2R',
          time_of_day:cont.tod||todOf(x.x,sceneTod),src:(cont.dir||cont.tod)?'authored':'derived'},
        image:img?{id:img.id,why:img.why,count:(x.imgs||[]).length}:null,
        images:(x.imgs||[]).length,
        prompt:x.mj||'',dialogue:x.dlg||'',
        status:x.pv||{}};
      if(ent.krishna&&ent.krishna!=='face'&&(s.cast.indexOf('krishna')>=0||s.off.indexOf('krishna')>=0))
        s.withheld={krishna:ent.krishna};
      /* a fingerprint of what the shot is — not where it falls. Anything made
         from the shot carries it, and is stale the moment it no longer matches */
      s.rev=('000000'+hash([s.type,s.text,s.set,s.cast.join(','),s.off.join(','),s.props.join(','),
        s.camera.lens_mm,s.camera.height_m,s.camera.angle,s.camera.move,
        /* a length that is only a guess moves when its neighbours are set; that is not a change to this shot */
        s.camera.duration_src==='authored'?r3(s.camera.duration_s):'~',
        s.continuity.time_of_day,s.continuity.screen_direction,JSON.stringify(s.withheld||'')].join('|'))).slice(-6);
      at+=d.d;prev=id;
      return s;
    });
    return {code:code,src:rec.src||'',title:opts.title||rec.t||'',category:opts.cat||rec.cat||'D',rasa:rec.rasa||'',
      place:rec.pl||'',set:ent.set||'',sub:ent.sub||'',also:ent.also||[],
      cast:ent.cast||[],off:off,props:ent.props||[],krishna:ent.krishna||'absent',
      duration_s:r6(at),shots:shots,view:opts.view||null};
  }

  /* the whole document for a scene, a sequence or a board */
  function build(o){
    const ents=o.entities,used={sets:{},characters:{},props:{}};
    const scenes=o.scenes;
    scenes.forEach(sc=>{
      const mark=(place)=>{const st=String(place).split('/')[0];if(ents.sets[st])used.sets[st]=ents.sets[st]};
      mark(sc.set);(sc.also||[]).forEach(mark);
      sc.cast.concat(sc.off).forEach(c=>{if(ents.characters[c])used.characters[c]={name:ents.characters[c].name,kind:ents.characters[c].kind}});
      sc.props.forEach(p=>{if(ents.props[p])used.props[p]={name:ents.props[p].name}});
      sc.shots.forEach(sh=>mark(sh.set));
    });
    return {spec:FORMAT,
      provenance:{board_version:o.boardVersion||'',board:o.board||null,
        generated_at:o.now||new Date().toISOString(),generator_version:VERSION},
      scope:o.scope||{kind:'scene',id:'',title:''},
      fps:FPS,frame:FRAME.slice(),
      entities:used,scenes:scenes};
  }
  /* a name for the state of a board that changes when its order or contents do */
  function boardVersion(id,board){
    const order=(board&&board.cols||[]).map(c=>c.id+':'+(c.ids||[]).join(',')).join('|');
    return id+'@'+('0000000'+hash(order)).slice(-7);
  }

  /* ---- the authority rule ----
     The board says what a shot is. An application reports what it made of it.
     A report may carry these fields and nothing else. */
  const REPORT_FIELDS=['shot_id','app','status','version','files','at','note','generator_version','board_version','params','shot_rev'];
  const REPORT_STATUS=['queued','built','rendered','failed','stale'];
  const APPS=['ae','blender','comfyui','houdini','nuke','unreal'];
  const STRUCTURE=['set','cast','off','props','camera','continuity','duration_s','text','type','kind','approved','lens_mm','height_m','id','n'];
  function checkReport(r){
    const errs=[];
    if(!r||typeof r!=='object'||Array.isArray(r))return ['a report is an object'];
    Object.keys(r).forEach(k=>{
      if(REPORT_FIELDS.indexOf(k)>=0)return;
      errs.push(STRUCTURE.indexOf(k)>=0
        ?'“'+k+'” is the board’s to say. Change it on the board and regenerate — an application reports status, files and versions only.'
        :'“'+k+'” is not part of a report.');
    });
    if(!r.shot_id||typeof r.shot_id!=='string')errs.push('a report names its shot_id');
    if(APPS.indexOf(r.app)<0)errs.push('app is one of '+APPS.join(', '));
    if(REPORT_STATUS.indexOf(r.status)<0)errs.push('status is one of '+REPORT_STATUS.join(', '));
    if(r.version!==undefined&&!(Number.isInteger(r.version)&&r.version>0))errs.push('version is a whole number from 1');
    if(r.files!==undefined){
      if(!r.files||typeof r.files!=='object'||Array.isArray(r.files))errs.push('files is a map of name to path');
      else Object.keys(r.files).forEach(k=>{if(typeof r.files[k]!=='string')errs.push('files.'+k+' is a path')});
    }
    if(r.params!==undefined&&(!r.params||typeof r.params!=='object'||Array.isArray(r.params)))errs.push('params is a map of the application’s own settings');
    return errs;
  }

  return {VERSION,FORMAT,FPS,FRAME,W,CAM,kind,plain,hash,sidOf,stamp,shotId,safe,durations,todOf,
    castOf,propsOf,pick,scene,build,boardVersion,checkReport,REPORT_FIELDS,REPORT_STATUS,APPS,STRUCTURE};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=ShotSpec;
