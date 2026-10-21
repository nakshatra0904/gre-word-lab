(function(root){
'use strict';
const DAY=86400000, VERSION=1;
const seed=`aver abeyance amicable abet aberrant abate abhor abide aberration frugal germane guileless fortuitous gainsay hackneyed forestall glib fortitude gratuitous fractious harbinger fungible gauche furtive harried galvanize garrulous fraught headstrong grovel haphazard gossamer forthcoming glut gall heed forlorn heady grievance futile gregarious hamper gaffe foreseeable haughty gullible forsake harangue fruitful gawky fret frailty gratify goad glum frivolous frustrate fulcrum hegemony heretic abstruse abscond acerbic accentuate abjure accolade abstain acolyte accessible abreast acclaim abound abstract acquiesce acumen adulterate adamant affectation acquisitive acrimonious alacrity amenable adroit ambivalent ameliorate anachronistic affinity admonish amorphous aggrandize altruistic ambiguous abject amalgamate aesthete adverse alienate analogous aloof allusive adept alleviate admonitory amalgam aesthetic corroborate ephemeral bolster disinterested fastidious cogent enervate banal deference feckless capitulate equanimity bucolic desultory fallacious clandestine erudite brazen deleterious capricious exculpate diffident chicanery fervent belie disseminate eclectic contrite feasible bombastic disingenuous elicit circumspect burgeon dogmatic esoteric conciliatory fledgling debunk candid emulate craven dilatory ebullient chary flout dearth equivocate callow fallow dissonance benign empirical cursory facetious disparate cajole egregious boorish delineate copious extemporize churlish discrete forbear decorum censure expedient buttress dissemble connoisseur elucidate commensurate duplicitous buoyant exacerbate contingent didactic fickle coalesce equivocal benevolent divulge fervid complacent enigma chagrin dispassionate flamboyant circumvent endemic daunting credible extraneous denigrate blithe eschew convoluted feign commiserate dubious embellish castigate fallible demur conspicuous exonerate byzantine deride expedite austere condone discreet extant canny dissent efficacious bereft contravene feint eloquent curb dogged covert decry`.split(' ');
const fresh=()=>({version:VERSION,seedEnabled:true,stats:{},events:[],seq:0,session:null,settings:{scope:'all',size:20,mode:'smart',format:'mixed'}});
const blank=()=>({attempts:0,correct:0,misses:0,hints:0,streak:0,level:0,due:0,retryAt:null,relearning:0,last:0,days:[],confusions:{},bookmarked:false,variants:0});
function stat(s,id){return s.stats[id]||blank();}
function seen(s,w){return stat(s,w.id).attempts>0||(s.seedEnabled&&seed.includes(w.word));}
function mastered(s,id){const t=stat(s,id);return t.streak>=3&&t.days.length>=3&&t.relearning===0;}
function due(s,id,now=Date.now()){const t=stat(s,id);return t.attempts>0&&(t.due<=now||(t.retryAt!==null&&s.seq>=t.retryAt));}
function shuffled(arr,rng=Math.random){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
// Restrict distractors by distinct meanings and exclude common synonym families.
const families=[
'abate attenuate diminish subside wane curtail curb temper alleviate ameliorate assuage mitigate mollify appease placate pacify',
'aberrant anomalous eccentric peculiar quirky outlandish idiosyncratic heterodox',
'abjure renounce recant repudiate forsake relinquish',
'abhor loathe disdain scorn contempt antipathy animosity enmity animus ire',
'abstruse arcane esoteric recondite obscure cryptic enigmatic inscrutable opaque',
'accessible lucid pellucid limpid articulate eloquent',
'acerbic caustic mordant astringent scathing trenchant incisive',
'acclaim accolade approbation exalt laudable lionize deify venerate estimable meritorious',
'acquiesce capitulate concede yield comply relent',
'acquisitive avaricious rapacious covet mercenary venal miserly parsimonious frugal economical',
'acrimonious belligerent pugnacious truculent contentious antagonize irascible fractious churlish boorish obstreperous',
'acumen astute canny sagacious judicious prudent circumspect wary chary',
'adamant obstinate obdurate headstrong intransigent implacable pertinacious dogged resolute steadfast stalwart',
'adept adroit deft proficient competent nimble',
'admonish chastise berate castigate censure decry denounce excoriate lambaste upbraid reproach deprecate deride denigrate disparage',
'adverse deleterious pernicious noxious inimical harmful malignant virulent malign',
'advocate espouse endorse support',
'affectation pretentious ostentatious ostentation pomposity pompous bombastic grandiose flamboyant florid baroque',
'affinity penchant predilection proclivity propensity inclined partial',
'affront aspersion calumny slander',
'aggrandize augment bolster buttress substantiate corroborate strengthen',
'agitate foment engender provoke goad galvanize exhort',
'alacrity fervor zeal fervent fervid ardent zealous',
'alienate estranged disaffected',
'aloof reticent retiring taciturn laconic terse pithy',
'altruistic benevolent beneficent philanthropic munificent magnanimous largesse generous',
'amalgam hodgepodge amalgamate coalesce heterogeneous',
'ambiguous equivocal evasive equivocate prevaricate dissemble disingenuous duplicitous mendacity chicanery skullduggery sophistry specious fallacious',
'ambivalent irresolute vacillate waver',
'amenable tractable pliant malleable plastic supple',
'amicable cordial congenial convivial comity gregarious sociable',
'amorphous inchoate nascent fledgling',
'anachronistic archaic obsolete',
'analogous homogeneous interchangeable fungible',
'apathetic indolent lethargic sluggish torpor somnolent languid listless',
'apocryphal bogus spurious sham fabricate false',
'apogee zenith nadir',
'apprehension timorous diffident fearful',
'apt apropos pertinent germane felicitous appropriate',
'arbitrary capricious fickle erratic mercurial volatile haphazard desultory',
'arduous onerous daunting exigent exacting',
'ascetic austere spartan',
'artless ingenuous guileless candid naive gullible callow neophyte',
'artful cunning wily astute canny',
'audacious audacity temerity bravado brazen intrepid plucky valor mettlesome courageous prowess',
'auspicious propitious providential fortuitous',
'august eminent magisterial noble dignified',
'banal banality hackneyed platitude pedestrian prosaic mundane humdrum monotonous tedious vapid insipid',
'barren fallow fecund fruitful prolific fertile',
'befuddled flummoxed nonplussed confound bewildered',
'benign innocuous harmless',
'bereft forlorn lugubrious morose glum crestfallen woeful distressed melancholy',
'blatant flagrant egregious conspicuous patent overt manifest palpable discernible tangible',
'blithe nonchalant cavalier complacent',
'boisterous clamorous vociferous cacophonous cacophony clangor shrill',
'buoyant sanguine jocund jovial jubilant ebullient euphoric elated vivacious',
'burgeon proliferate propagate disseminate spread',
'cajole wheedle inveigle coax fawn grovel ingratiate obsequious subservient',
'cataclysmic tempestuous turbulent volatile',
'cathartic salutary salubrious edifying edify',
'chagrin vexation ire gall umbrage',
'chary wary circumspect prudent scrupulous judicious vigilant',
'circumscribe curb restrict constrain inhibit hinder hamper impede frustrate foil forestall preclude obviate',
'clandestine covert furtive surreptitious secret',
'cogent compelling credible sound conclusive incontrovertible ironclad tenable',
'cogitate ruminate pensive deliberate',
'collude conspire collaborate',
'commensurate proportional equitable impartial disinterested dispassionate fair',
'conciliatory appease placate mollify reconcile',
'conjectural fanciful quixotic illusory delusion',
'connoisseur aesthete dilettante philistine',
'contempt disdain scorn',
'contrite contrition remorse',
'conventional conformist orthodox',
'convoluted byzantine involved tortuous cumbersome',
'copious profuse myriad prodigious abundant',
'corporeal bodily temporal',
'countenance condone brook tolerate',
'craven timorous cowardly',
'cursory perfunctory superficial',
'dearth scant sparse negligible nominal trifling trivial slight minute diminutive',
'debilitating enervate impair vitiate weaken undermine undercut subvert',
'debunk refute disprove',
'decipher elucidate expound explain delineate construe',
'decorous decorum propriety punctilious tact deferential deference obeisance chivalrous urbane',
'despotic dictatorial imperious authoritarian',
'diatribe tirade harangue',
'didactic edifying edify instructional',
'discreet discrete',
'discrepancy dissonance divergent disparate incongruous',
'disentangle extricate separate',
'disperse scatter diffuse',
'dissent dissident schism strife',
'divulge betray reveal',
'doctrinaire dogmatic intransigent',
'droll facetious satirical lampoon irreverent whimsical',
'dupe swindle deceive',
'duress coercion',
'economical frugal economy parsimonious miserly',
'elicit evoke engender produce yield',
'enchant enthrall intrigue engross',
'encyclopedic erudite polymath scholarly',
'entrenched ingrained inveterate chronic incessant perennial ubiquitous omnipresent pervasive endemic',
'ephemeral evanescent transient transitory momentary short-lived',
'equanimity poise serene tranquil placid imperturbable phlegmatic stolid stoic calm',
'eradicate exorcise banish eliminate oust depose quash nullify neutralize',
'eschew abstain forbear avoid evade skirt circumvent',
'exasperated irksome nettlesome vexation',
'exculpate exonerate clear',
'exhaustive thorough painstaking meticulous fastidious finicky punctilious',
'exhilarating heady invigorate vitality verve panache energy',
'exorbitant extravagant lavish prodigal profligate spendthrift squander opulence',
'expatiate prolix verbose verbosity',
'expedient pragmatic utilitarian practical viable feasible',
'extemporize improvise',
'extraneous superfluous peripheral tangential incidental marginal',
'falter waver vacillate',
'feckless negligent lax careless',
'feign dissemble affectation',
'feint ploy ruse',
'figurative metaphorical hyperbole',
'fortitude perseverance valor courage',
'frailty feeble languid weakness',
'futile useless ineffective',
'garrulous loquacious talkative',
'gauche gawky maladroit bumbling awkward',
'gratify satisfy please',
'gossamer delicate tenuous',
'heady exhilarating euphoric euphoric',
'hegemony dominance',
'heretic heterodox iconoclast iconoclastic maverick radical',
'histrionic hysterical dramatic',
'ignoble ignominious base turpitude dishonorable',
'imminent impending',
'immutable irrevocable inviolate fixed',
'impetuous imprudent precipitate precipitous foolhardy reckless',
'impertinent impudent insolent presumptuous disrespectful',
'implicit tacit understood',
'implacable inexorable inevitable',
'inborn intrinsic innate',
'incendiary provocative inflammatory',
'incessant incessant perennial perpetual',
'indefatigable industrious sedulous diligent',
'indiscriminate indiscriminate universal',
'indispensable essential necessary',
'insidious pernicious harmful',
'insular parochial provincial xenophobic chauvinistic jingoism',
'intermittent sporadic occasional',
'inundate overwhelm flood',
'irrevocable irreversible permanent',
'itinerant traveling',
'jeopardize endanger perilous precarious risky',
'jettison relinquish discard',
'laudable meritorious estimable praiseworthy',
'lax negligent slack',
'libertine decadent prodigal profligate indulgent',
'loquacious garrulous prolix verbose',
'macabre morbid',
'malfeasance miscreant misconduct turpitude',
'mawkish sentimental',
'misnomer incorrect name',
'mitigate ameliorate assuage alleviate',
'modest understated retiring',
'modish fashionable',
'munificent lavish generous philanthropic beneficent benevolent',
'mutiny revolt rebellion subvert',
'myopic parochial insular',
'nascent inchoate fledgling',
'numinous spiritual',
'obdurate obstinate obstreperous intransigent',
'oblivious unaware',
'odious repugnant loathsome',
'ominous portend harbinger foretell prophetic prescient visionary',
'opprobrium censure condemnation',
'oust depose remove',
'panacea remedy',
'patent manifest obvious conspicuous',
'pedant pedantic punctilious',
'perseverance dogged pertinacious persistent',
'phlegmatic stolid stoic imperturbable',
'poignant plaintive mournful',
'pompous pomposity pretentious grandiose',
'pristine immaculate pure',
'probity veracity verisimilitude honesty',
'profound profundity deep',
'propriety decorum appropriate',
'prurient bawdy salacious',
'puerile callow immature',
'qualm apprehension unease',
'quandary predicament imbroglio dilemma',
'quiescent dormant inactive',
'rapacious avaricious acquisitive greedy',
'recant renounce repudiate reject',
'recondite esoteric arcane abstruse',
'redoubtable formidable daunting',
'regress recede',
'remuneration compensation',
'reproach censure berate chastise rebuke',
'restive fractious obstreperous',
'robust resilient strong',
'rudimentary elementary basic',
'sanctimonious pious self-righteous',
'scrupulous meticulous conscientious',
'sham bogus spurious fake',
'skittish timorous nervous',
'slight trifling trivial negligible',
'slovenly dowdy untidy',
'somnolent soporific sleepy lethargic',
'sparse scant dearth',
'stolid phlegmatic impassive stoic',
'stringent strict exacting rigorous rigor',
'subordinate subservient lower',
'supersede supplant replace',
'supplicate grovel beg',
'surmount overcome',
'tacit taciturn laconic',
'tarnish vitiate damage',
'tendentious partial biased',
'tentative provisional',
'terse pithy laconic concise',
'timorous craven fearful',
'torpor lethargic sluggish somnolent',
'transgression peccadillo offense',
'truculent pugnacious belligerent aggressive',
'unprecedented novel unique',
'unseemly indecorous inappropriate',
'vacillate waver irresolute',
'vanquish defeat',
'vapid banal insipid dull',
'venerate deify exalt lionize',
'veritable genuine actual',
'vigilant wary watchful',
'virulent pernicious noxious toxic',
'wayward headstrong unruly',
'weary exhausted lethargic'
].map(x=>new Set(x.split(' ')));
function choices(w,words,rng=Math.random){
 const blocked=new Set([w.word]);for(const f of families)if(f.has(w.word))for(const x of f)blocked.add(x);
 const tokens=x=>new Set(x.toLowerCase().match(/[a-z]{5,}/g)||[]);
 const a=tokens(w.meaning+' '+w.sentence);
 let pool=words.filter(x=>!blocked.has(x.word)&&x.meaning!==w.meaning&&!([...tokens(x.meaning)].some(t=>a.has(t))));
 return shuffled([w.id,...shuffled(pool,rng).slice(0,3).map(x=>x.id)],rng);
}
function record(s,id,chosen,hint=false,now=Date.now()){
 const t={...blank(),...stat(s,id)};t.days=[...t.days];t.confusions={...t.confusions};
 const ok=id===chosen; s.seq++;t.attempts++;t.variants++;t.last=now;
 const day=new Date(now).toLocaleDateString('en-CA');
 if(ok){t.correct++;if(hint){t.hints++;t.streak=0;t.days=[];t.due=now+600000;t.retryAt=s.seq+3;t.relearning=Math.max(1,t.relearning);}
 else {t.streak++;
  if(!t.days.includes(day))t.days.push(day);
  if(t.relearning){t.relearning--;t.retryAt=t.relearning?s.seq+5:null;t.due=t.relearning?now+600000:now+DAY;t.level=1;}
  else if(!t.due||now>=t.due){t.level=Math.min(5,t.level+1);t.due=now+[1,3,7,14,30][t.level-1]*DAY;t.retryAt=null;}
 }}else{t.misses++;t.streak=0;t.level=0;t.days=[];t.relearning=2;t.retryAt=s.seq+3;t.due=now+600000;if(chosen)t.confusions[chosen]=(t.confusions[chosen]||0)+1;}
 s.stats[id]=t;s.events.push({id,chosen,ok,hint,at:now});return {ok,t};
}
function scopeWords(words,scope){if(scope==='first500')return words.slice(0,500);if(String(scope).startsWith('section:'))return words.filter(w=>w.section===Number(scope.split(':')[1]));return words;}
function next(s,words,session,rng=Math.random,now=Date.now()){
 const pool=scopeWords(words,session.scope);const ids=new Set(session.used||[]);const last=session.last;
 let eligible=pool.filter(w=>w.id!==last);
 const overdue=eligible.filter(w=>due(s,w.id,now));
 let chosen;
 if(session.mode==='mistakes'){
  const missed=eligible.filter(w=>stat(s,w.id).misses>0);
  chosen=shuffled(missed.filter(w=>due(s,w.id,now)),rng).sort((a,b)=>stat(s,b.id).misses-stat(s,a.id).misses)[0];
  if(!chosen)chosen=shuffled(missed.filter(w=>!ids.has(w.id)),rng).sort((a,b)=>stat(s,b.id).misses-stat(s,a.id).misses)[0];
 }else if(session.mode==='due')chosen=shuffled(overdue,rng).sort((a,b)=>stat(s,a.id).due-stat(s,b.id).due)[0];
 else if(session.mode==='new')chosen=shuffled(eligible.filter(w=>!seen(s,w)&&!ids.has(w.id)),rng)[0];
 else {
  chosen=shuffled(overdue,rng).sort((a,b)=>stat(s,b.id).misses-stat(s,a.id).misses)[0];
  if(!chosen)chosen=shuffled(eligible.filter(w=>!seen(s,w)&&!ids.has(w.id)),rng)[0];
  if(!chosen)chosen=shuffled(eligible.filter(w=>!ids.has(w.id)&&!stat(s,w.id).attempts),rng)[0];
  if(!chosen)chosen=shuffled(eligible.filter(w=>!ids.has(w.id)),rng)[0];
 }
 return chosen||null;
}
function validateBackup(raw,words){
 if(!raw||raw.version!==VERSION||!raw.stats||typeof raw.stats!=='object'||Array.isArray(raw.stats))throw Error('This is not a supported Word Lab backup.');
 const ids=new Set(words.map(w=>w.id));const out=fresh();out.seedEnabled=raw.seedEnabled!==false;out.seq=Number.isSafeInteger(raw.seq)&&raw.seq>=0?raw.seq:0;
 for(const [k,v] of Object.entries(raw.stats)){
  if(!ids.has(Number(k))||!v||typeof v!=='object')throw Error('Backup contains unknown word IDs.');
  const t=blank();for(const key of ['attempts','correct','misses','hints','streak','level','relearning','variants']){if(!Number.isSafeInteger(v[key])||v[key]<0)throw Error('Invalid progress counters.');t[key]=v[key];}
  if(t.correct+t.misses!==t.attempts||t.hints>t.correct||t.level>5||t.relearning>2||t.streak>t.attempts)throw Error('Inconsistent progress counters.');
  for(const key of ['last','due']){if(!Number.isFinite(v[key])||v[key]<0)throw Error('Invalid dates.');t[key]=v[key];}
  if(v.retryAt!==null&&(!Number.isSafeInteger(v.retryAt)||v.retryAt<0))throw Error('Invalid review schedule.');t.retryAt=v.retryAt;
  if(!Array.isArray(v.days)||v.days.length>10000||v.days.some(d=>typeof d!=='string'||d.length>20))throw Error('Invalid review days.');t.days=[...new Set(v.days)];
  t.bookmarked=!!v.bookmarked;for(const [other,n]of Object.entries(v.confusions||{})){if(!ids.has(Number(other))||!Number.isSafeInteger(n)||n<0)throw Error('Invalid confusion counts.');t.confusions[other]=n;}
  out.stats[k]=t;
 }
 if(!Array.isArray(raw.events)||raw.events.length>200000)throw Error('Invalid answer history.');
 out.events=raw.events.map(e=>{if(!ids.has(e.id)||!(e.chosen===null||ids.has(e.chosen))||typeof e.ok!=='boolean'||e.ok!==(e.id===e.chosen)||!Number.isFinite(e.at)||e.at<0)throw Error('Invalid answer history.');return {id:e.id,chosen:e.chosen,ok:e.ok,hint:!!e.hint,at:e.at};});
 if(raw.settings&&['all','first500',...Array.from({length:20},(_,i)=>'section:'+(i+1))].includes(raw.settings.scope))out.settings.scope=raw.settings.scope;
 return out;
}
root.GRE={DAY,seed,fresh,blank,stat,seen,mastered,due,shuffled,choices,record,scopeWords,next,validateBackup};
if(typeof module!=='undefined')module.exports=root.GRE;
})(typeof window==='undefined'?globalThis:window);
