(function(root){
'use strict';
const DAY=86400000,VERSION=2;
const fresh=()=>({version:VERSION,bankVersion:'2026-10-31-v1',seq:0,stats:{},wordStats:{},events:[],session:null,settings:{section:'all',type:'all',mode:'adaptive',size:20}});
const blank=()=>({attempts:0,correct:0,misses:0,streak:0,days:[],level:0,relearning:0,retryAt:null,due:0,last:0});
const stat=(s,id)=>s.stats[id]||blank();
const shuffle=(a,rng=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const same=(a,b)=>Array.isArray(a)&&a.length===b.length&&new Set(a).size===a.length&&b.every(x=>a.includes(x));
const complete=(q,a)=>Array.isArray(a)&&a.length===q.answers.length&&a.every((v,i)=>Array.isArray(v)&&v.length===q.answers[i].length&&new Set(v).size===v.length&&v.every(x=>q.choices[i].includes(x)));
const grade=(q,a)=>q.answers.map((b,i)=>same(a?.[i],b));
const due=(s,id,now=Date.now())=>{const t=stat(s,id);return t.attempts>0&&(now>=t.due||(t.retryAt!==null&&s.seq>=t.retryAt));};
const mastered=(t)=>t.streak>=3&&t.days.length>=3&&t.relearning===0;
function update(t,ok,seq,now){
 t={...blank(),...t,days:[...(t.days||[])]};t.attempts++;t.last=now;
 const day=new Date(now).toLocaleDateString('en-CA');
 if(!ok){t.misses++;t.streak=0;t.days=[];t.level=0;t.relearning=2;t.retryAt=seq+3;t.due=now+600000;}
 else{t.correct++;t.streak++;if(!t.days.includes(day))t.days.push(day);
  if(t.relearning){t.relearning--;t.retryAt=t.relearning?seq+5:null;t.due=now+(t.relearning?600000:DAY);if(!t.relearning)t.level=1;}
  else if(!t.due||now>=t.due){t.level=Math.min(5,t.level+1);t.due=now+[1,3,7,14,30][t.level-1]*DAY;t.retryAt=null;}
 }
 return t;
}
function record(s,q,selection,{reveal=false,now=Date.now()}={}){
 if(!reveal&&!complete(q,selection))throw Error('Complete every blank, or select exactly two answers.');
 if(reveal)selection=q.answers.map(()=>[]);
 const checks=grade(q,selection),ok=checks.every(Boolean);s.seq++;
 s.stats[q.id]=update(stat(s,q.id),ok,s.seq,now);
 // One word gets one diagnostic outcome per question, even when repeated in two blanks.
 const outcomes=new Map();q.answers.forEach((group,i)=>group.forEach(word=>outcomes.set(word,(outcomes.get(word)??true)&&checks[i])));
 for(const [word,success] of outcomes){const t=s.wordStats[word]||{attempts:0,correct:0,misses:0,last:0};s.wordStats[word]={attempts:t.attempts+1,correct:t.correct+(success?1:0),misses:t.misses+(success?0:1),last:now};}
 const e={id:q.id,at:now,selection:selection.map(a=>[...a]),ok,reveal};s.events.push(e);return {ok,checks};
}
function pool(bank,config){return bank.filter(q=>(config.section==='all'||q.section===Number(config.section))&&(config.type==='all'||(config.type==='se'?q.type==='se':q.type==='tc'&&(config.type==='tc'||q.answers.length===Number(config.type.slice(2))))));}
function next(s,bank,session,rng=Math.random,now=Date.now()){
 const eligible=pool(bank,session),used=new Set(session.used),last=session.current?.id;let pick;
 const mixed=a=>{a=shuffle(a,rng);const lastQ=bank.find(q=>q.id===last);if(lastQ){const different=a.filter(q=>q.initial!==lastQ.initial);if(different.length)a=[...different,...a.filter(q=>q.initial===lastQ.initial)];}return a;};
 const newItems=eligible.filter(q=>!stat(s,q.id).attempts&&!used.has(q.id));
 const dueItems=eligible.filter(q=>q.id!==last&&due(s,q.id,now));
 if(session.mode==='coverage')pick=mixed(eligible.filter(q=>!used.has(q.id)))[0];
 else if(session.mode==='new')pick=mixed(newItems)[0];
 else if(session.mode==='due')pick=mixed(dueItems).sort((a,b)=>stat(s,a.id).due-stat(s,b.id).due)[0];
 else if(session.mode==='mistakes')pick=mixed(dueItems.filter(q=>stat(s,q.id).misses)).sort((a,b)=>stat(s,b.id).misses-stat(s,a.id).misses)[0]||mixed(eligible.filter(q=>stat(s,q.id).misses&&!used.has(q.id))).sort((a,b)=>stat(s,b.id).misses-stat(s,a.id).misses)[0];
 else pick=mixed(dueItems)[0]||mixed(newItems)[0]||mixed(eligible.filter(q=>!used.has(q.id)))[0];
 return pick||null;
}
function createSession(config){return {...config,done:0,correct:0,skips:0,used:[],current:null,started:Date.now()};}
function prepare(s,bank,rng=Math.random){const session=s.session;if(!session||session.done>=session.size){if(session)session.current=null;return null;}const q=next(s,bank,session,rng);if(!q){session.current=null;return null;}session.used.push(q.id);session.current={id:q.id,choices:q.choices.map(x=>shuffle(x,rng)),selection:q.answers.map(()=>[]),answered:false,result:null};return session.current;}
function submit(s,bank,reveal=false,now=Date.now()){const c=s.session?.current;if(!c||c.answered)throw Error('This question has already been submitted.');const q=bank.find(x=>x.id===c.id);const result=record(s,q,c.selection,{reveal,now});if(reveal)c.selection=q.answers.map(()=>[]);c.result=result;c.answered=true;s.session.done++;if(result.ok)s.session.correct++;return result;}
function validate(raw,bank,{resume=false}={}){
 if(!raw||raw.version!==VERSION||!raw.stats||!raw.wordStats||!Array.isArray(raw.events))throw Error('Choose a Quiz 2 backup. Quiz 1 uses its own backup.');
 const s=fresh(),byId=new Map(bank.map(q=>[q.id,q])),validWords=new Set(bank.flatMap(q=>q.answers.flat()));
 if(!Number.isSafeInteger(raw.seq)||raw.seq<0)throw Error('Invalid answer count.');s.seq=raw.seq;
 for(const [id,v] of Object.entries(raw.stats)){if(!byId.has(+id)||!v||typeof v!=='object')throw Error('Unknown question in backup.');const t=blank();for(const k of ['attempts','correct','misses','streak','level','relearning']){if(!Number.isSafeInteger(v[k])||v[k]<0)throw Error('Invalid scores.');t[k]=v[k];}if(t.correct+t.misses!==t.attempts||t.streak>t.correct||t.level>5||t.relearning>2)throw Error('Inconsistent scores.');for(const k of ['last','due']){if(!Number.isFinite(v[k])||v[k]<0)throw Error('Invalid review date.');t[k]=v[k];}if(v.retryAt!==null&&(!Number.isSafeInteger(v.retryAt)||v.retryAt<0))throw Error('Invalid retry.');t.retryAt=v.retryAt;if(!Array.isArray(v.days)||v.days.some(x=>typeof x!=='string'||x.length>24)||v.days.length>10000)throw Error('Invalid review days.');t.days=[...new Set(v.days)];s.stats[id]=t;}
 for(const [word,t] of Object.entries(raw.wordStats)){if(!validWords.has(word)||!t||['attempts','correct','misses'].some(k=>!Number.isSafeInteger(t[k])||t[k]<0)||t.correct+t.misses!==t.attempts||!Number.isFinite(t.last)||t.last<0)throw Error('Invalid vocabulary history.');s.wordStats[word]={attempts:t.attempts,correct:t.correct,misses:t.misses,last:t.last};}
 if(raw.events.length>200000)throw Error('Backup history is too large.');
 s.events=raw.events.map(e=>{const q=byId.get(e.id);if(!q||!Number.isFinite(e.at)||e.at<0||typeof e.reveal!=='boolean'||typeof e.ok!=='boolean')throw Error('Invalid answer history.');if(!e.reveal&&!complete(q,e.selection))throw Error('Invalid saved selection.');if(e.reveal&&(!Array.isArray(e.selection)||e.selection.length!==q.answers.length||e.selection.some(a=>!Array.isArray(a)||a.length)))throw Error('Invalid revealed answer.');if(e.ok!==grade(q,e.selection).every(Boolean))throw Error('Invalid grading in backup.');return {id:e.id,at:e.at,selection:e.selection.map(x=>[...x]),ok:e.ok,reveal:e.reveal};});
 const total=Object.values(s.stats).reduce((a,t)=>a+t.attempts,0);if(total!==s.seq||s.events.length!==s.seq)throw Error('Answer totals do not match.');
 const config=raw.settings||{};if(['all',...Array.from({length:20},(_,i)=>String(i+1))].includes(String(config.section)))s.settings.section=String(config.section);if(['all','tc','tc1','tc2','tc3','se'].includes(config.type))s.settings.type=config.type;if(['adaptive','new','coverage','due','mistakes'].includes(config.mode))s.settings.mode=config.mode;if([10,20,50].includes(config.size))s.settings.size=config.size;
 if(resume&&raw.session){const x=raw.session,c=x.current,q=byId.get(c?.id);if(q&&['all',...Array.from({length:20},(_,i)=>String(i+1))].includes(String(x.section))&&['all','tc','tc1','tc2','tc3','se'].includes(x.type)&&['adaptive','new','coverage','due','mistakes'].includes(x.mode)&&Number.isSafeInteger(x.done)&&x.done>=0&&[10,20,50].includes(x.size)&&x.done<=x.size&&Number.isSafeInteger(x.correct)&&x.correct>=0&&x.correct<=x.done&&Number.isSafeInteger(x.skips)&&x.skips>=0&&Array.isArray(x.used)&&x.used.every(id=>byId.has(id))&&Array.isArray(c.choices)&&c.choices.length===q.choices.length&&c.choices.every((a,i)=>same(a,q.choices[i]))&&Array.isArray(c.selection)&&c.selection.length===q.answers.length&&c.selection.every((a,i)=>Array.isArray(a)&&a.length<=q.answers[i].length&&new Set(a).size===a.length&&a.every(w=>q.choices[i].includes(w)))&&typeof c.answered==='boolean'&&(!c.answered||complete(q,c.selection)||c.selection.every(a=>a.length===0))){s.session={...createSession(s.settings),...x,current:{...c,result:c.answered?{ok:grade(q,c.selection).every(Boolean),checks:grade(q,c.selection)}:null}};}}
 return s;
}
root.GRE2={DAY,fresh,blank,stat,shuffle,same,complete,grade,due,mastered,record,pool,next,prepare,submit,createSession,validate};
if(typeof module!=='undefined')module.exports=root.GRE2;
})(typeof window==='undefined'?globalThis:window);
