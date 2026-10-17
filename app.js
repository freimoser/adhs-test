(function(){
"use strict";
var Q=window.ADHS_Q, A=window.ASRS, KEY="adhs-check-v1", root=document.getElementById("app");
if(!root) return;
var REL=["Partner/in","Familie","Freund/in","Kolleg/in","kennt mich seit Kindheit"];
function $(s,e){return (e||document).querySelector(s)}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function rid(){var b=crypto.getRandomValues(new Uint8Array(9));return b64u(b)}
function b64u(b){var s="";for(var i=0;i<b.length;i++)s+=String.fromCharCode(b[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function ub64(s){s=s.replace(/-/g,"+").replace(/_/g,"/");while(s.length%4)s+="=";var r=atob(s),b=new Uint8Array(r.length);for(var i=0;i<r.length;i++)b[i]=r.charCodeAt(i);return b}
async function pipe(bytes,stream){return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer())}
async function key(pw,salt){var k=await crypto.subtle.importKey("raw",new TextEncoder().encode(pw),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:250000,hash:"SHA-256"},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function pack(obj,pw){var z=await pipe(new TextEncoder().encode(JSON.stringify(obj)),new CompressionStream("deflate-raw"));
 if(!pw)return "p"+b64u(z);var salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 var ct=new Uint8Array(await crypto.subtle.encrypt({name:"AES-GCM",iv:iv},await key(pw,salt),z));var o=new Uint8Array(28+ct.length);o.set(salt);o.set(iv,16);o.set(ct,28);return "e"+b64u(o)}
async function unpack(s,pw){var t=s[0],b=ub64(s.slice(1));
 if(t==="e"){if(!pw)throw new Error("pw");b=new Uint8Array(await crypto.subtle.decrypt({name:"AES-GCM",iv:b.slice(16,28)},await key(pw,b.slice(0,16)),b.slice(28)))}
 return JSON.parse(new TextDecoder().decode(await pipe(b,new DecompressionStream("deflate-raw"))))}
var BASE=location.origin+location.pathname;
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function copyBtn(txt){return '<button type="button" class="btn small" data-copy="'+esc(txt)+'">Link kopieren</button>'}
document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(b){var t=b.getAttribute("data-copy");(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Kopiert ✓"},function(){prompt("Link kopieren:",t)});return}
 var s=e.target.closest("[data-share]");if(s&&navigator.share){navigator.share({title:"ADHS-Check zu dritt",text:s.getAttribute("data-text"),url:s.getAttribute("data-share")}).catch(function(){})}});
var LIC='ASRS-V1.1 Screener © New York University and the President and Fellows of Harvard College · Kessler RC, Adler L, Ames M et al. Psychological Medicine 2005; 35(2): 245–256 · <a href="https://license.tov.med.nyu.edu/product/asrs6Qscreener" rel="noopener">Lizenz (NYU)</a>';
var MARKNOTE='<span class="mk" aria-hidden="true"></span> Markierte Felder zählen für die Auswertung – wie im Originalformular.';

/* ---------- Wizard: eine Frage pro Bildschirm ---------- */
var WZ=null;
function buildSteps(withAsrs){var st=[],n=0;if(withAsrs){st.push({t:"intro",p:1});A.items.forEach(function(q,i){st.push({t:"q",p:1,i:i,n:++n})})}
 st.push({t:"intro",p:2});Q.items.forEach(function(q,i){st.push({t:"q",p:2,i:i,n:++n})});return st}
function partLabel(p){return p===1?"Teil 1: Offizieller Kurztest":'Teil 2: Eigene Fragen <span class="tag">nicht wissenschaftlich geprüft</span>'}
function wizard(c){WZ=c;c.lock=false;
 root.innerHTML='<section class="wz noprint" id="wz" aria-label="Fragebogen"><div class="wz-top"><div class="wz-meta"><span class="wz-part" id="wzpart"></span><span class="wz-count" id="wzcount"></span></div>'+
 '<div class="wz-bar" id="wzbar" role="progressbar" aria-label="Fortschritt" aria-valuemin="0" aria-valuemax="'+c.total+'" aria-valuenow="0" aria-valuetext=""><i></i></div></div>'+
 '<div class="wz-card" id="wzc"></div><div id="wzfoot"></div><p class="sr-only" id="wzlive" aria-live="polite"></p></section>';
 show(c.pos,c.pos>0?2:0)}
function answeredCount(c){return c.steps.filter(function(st){return st.t==="q"&&c.val(st)!=null}).length}
function ensureVisible(){var w=$("#wz");if(!w)return;var r=w.getBoundingClientRect();if(r.top<0||r.top>window.innerHeight*0.3)w.scrollIntoView({block:"start"})}
function show(pos,dir){var c=WZ;if(!c)return;
 if(pos>=c.steps.length){var miss=-1;c.steps.some(function(st,k){if(st.t==="q"&&c.val(st)==null){miss=k;return true}});
  if(miss>=0){c.missNote=true;pos=miss}else{c.save(c.steps.length);WZ=null;c.done();return}}
 c.pos=pos;c.save(pos);
 var st=c.steps[pos],h="",foot="",done=answeredCount(c),bar=$("#wzbar");
 $("#wzpart").innerHTML=c.partLabel(st.p);
 $("#wzcount").textContent=st.t==="q"?"Frage "+st.n+" von "+c.total:(done?done+" von "+c.total+" beantwortet":c.total+" Fragen");
 bar.setAttribute("aria-valuenow",done);bar.setAttribute("aria-valuetext",done+" von "+c.total+" Fragen beantwortet");bar.firstChild.style.width=(done/c.total*100)+"%";
 if(st.t==="intro"){h=c.intro(st)+'<div class="wz-nav">'+(pos>0?'<button type="button" class="btn" id="wzback">← Zurück</button>':'<span></span>')+'<button type="button" class="btn pri big" id="wznext">'+(done&&st.p===1?"Weiter →":"Los geht's →")+'</button></div>'}
 else{var isA=st.p===1,v=c.val(st),labels=isA?A.scale:Q.scale,shade=isA?A.shaded[st.i]:null,text=isA?A.items[st.i]:Q.items[st.i][c.which],area=isA?"ASRS-V1.1 · Frage "+(st.i+1)+" von 6":Q.areas[Q.items[st.i][0]];
  var ch=c.missNote?"Hier fehlt noch eine Antwort.":c.cheer(st);c.missNote=false;
  h=(ch?'<p class="wz-cheer">'+ch+'</p>':"")+'<div class="wz-area">'+esc(area)+'</div>'+(isA?'<p class="wz-instr">'+esc(A.intro)+'</p>':"")+
  '<h2 class="wz-q" id="wzq" tabindex="-1">'+esc(text)+'</h2><div class="ans-list" role="radiogroup" aria-labelledby="wzq">'+
  labels.map(function(l,k){var sh=shade!=null&&k>=shade;return '<button type="button" class="ans'+(sh?" sh":"")+'" role="radio" aria-checked="'+(v===k)+'" data-v="'+k+'"><span class="k" aria-hidden="true">'+(k+1)+'</span><span class="l">'+esc(isA?l:cap(l))+'</span>'+(sh?'<span class="sr-only"> (markiertes Feld)</span>':"")+'</button>'}).join("")+
  (c.allowSkip&&!isA&&Q.items[st.i][0]==="K"?'<button type="button" class="ans skip" role="radio" aria-checked="'+(v===-1)+'" data-v="-1"><span class="k" aria-hidden="true">?</span><span class="l">Weiß ich nicht / kannte die Person damals nicht</span></button>':"")+
  '</div><div class="wz-nav"><button type="button" class="btn" id="wzback">← Zurück</button><button type="button" class="btn" id="wznext"'+(v==null?" disabled":"")+'>Weiter →</button></div><p class="wz-kbd">Tastatur: <kbd>1</kbd>–<kbd>5</kbd> antworten · <kbd>←</kbd> zurück · <kbd>→</kbd> weiter</p>';
  if(isA)foot='<p class="wz-lic">'+MARKNOTE+'<br>'+LIC+'</p>'}
 foot+=c.foot?c.foot():"";
 var card=$("#wzc");card.innerHTML=h;$("#wzfoot").innerHTML=foot;
 if(dir){card.classList.remove("in","back");void card.offsetWidth;card.classList.add("in");if(dir<0)card.classList.add("back");void card.offsetWidth;requestAnimationFrame(function(){card.classList.remove("in","back")})}
 card.querySelectorAll(".ans").forEach(function(b){b.onclick=function(){pick(+b.getAttribute("data-v"))}});
 var bk=$("#wzback");if(bk)bk.onclick=back;var nx=$("#wznext");if(nx)nx.onclick=function(){if(c.beforeNext&&c.beforeNext(st)===false)return;show(pos+1,1)};
 if(c.bind)c.bind(st);
 $("#wzlive").textContent=st.t==="q"?"Frage "+st.n+" von "+c.total:"";
 if(dir){ensureVisible();var f=$("#wzq")||card.querySelector("h2");if(f)f.focus({preventScroll:true})}}
function pick(k){var c=WZ;if(!c||c.lock)return;var st=c.steps[c.pos];if(st.t!=="q")return;
 c.setVal(st,k);$("#wzc").querySelectorAll(".ans").forEach(function(b){b.setAttribute("aria-checked",+b.getAttribute("data-v")===k?"true":"false")});
 var nx=$("#wznext");if(nx)nx.disabled=false;c.lock=true;var p=c.pos;
 setTimeout(function(){if(WZ!==c)return;c.lock=false;if(c.pos===p){var ae=document.activeElement;if(ae&&ae.blur&&ae.classList&&ae.classList.contains("ans"))ae.blur();show(p+1,1)}},250)}
function back(){var c=WZ;if(!c||c.pos<=0)return;c.lock=false;show(c.pos-1,-1)}
document.addEventListener("keydown",function(e){var c=WZ;if(!c||!$("#wz")||e.ctrlKey||e.metaKey||e.altKey)return;var tg=e.target.tagName;if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT")return;
 var st=c.steps[c.pos];if(!st)return;
 if(st.t==="q"&&/^[1-5]$/.test(e.key)){e.preventDefault();pick(+e.key-1);return}
 if(e.key==="Backspace"||e.key==="ArrowLeft"){if(c.pos>0){e.preventDefault();back()}return}
 if(e.key==="ArrowRight"||(e.key==="Enter"&&tg!=="BUTTON"&&tg!=="A")){var nx=$("#wznext");if(nx&&!nx.disabled){e.preventDefault();nx.click()}}});
function cheerFor(total,who){return function(st){var n=st.n,half=Math.floor(total/2)+1;
 if(n===total)return "Letzte Frage – gleich geschafft!";
 if(n===total-4)return "Nur noch 5 Fragen. Du bist fast durch!";
 if(n===half)return "Halbzeit! Die Hälfte hast du schon – weiter so.";
 if(st.p===2&&Q.items[st.i][0]==="K"&&(st.i===0||Q.items[st.i-1][0]!=="K"))return who?"Jetzt kurz zurück in die Kindheit von "+who+". Wenn du sie damals nicht kanntest, tipp auf „Weiß ich nicht“.":"Jetzt geht's kurz zurück in deine Kindheit.";
 return ""}}

/* ---------- Freund/in: Einladung beantworten ---------- */
async function friend(raw){
 var inv;try{inv=JSON.parse(new TextDecoder().decode(ub64(raw)));if(!inv||!inv.id)throw 0}catch(e){WZ=null;root.innerHTML='<p class="warn">Dieser Einladungslink ist unvollständig. Bitte den ganzen Link erneut öffnen.</p>';return}
 var who=esc(inv.n||"Jemand"),FK=KEY+"-f-"+inv.id;
 var d;try{d=JSON.parse(localStorage.getItem(FK))}catch(e){}if(!d||!Array.isArray(d.o)||d.o.length!==Q.items.length)d={o:Q.items.map(function(){return null}),pos:0,name:""};
 function persist(){localStorage.setItem(FK,JSON.stringify(d))}
 var steps=buildSteps(false);
 wizard({steps:steps,total:Q.items.length,which:2,allowSkip:true,pos:Math.min(d.pos||0,steps.length-1),
  partLabel:function(){return 'Deine Sicht auf '+who+' <span class="tag">nicht wissenschaftlich geprüft</span>'},
  val:function(st){return d.o[st.i]},setVal:function(st,v){d.o[st.i]=v;persist()},save:function(p){d.pos=p;persist()},
  cheer:cheerFor(Q.items.length,who),
  intro:function(){return '<h2 tabindex="-1">'+who+' bittet dich um deine Einschätzung</h2><p>'+who+' möchte vor einem möglichen Arztgespräch wissen, wie du sie oder ihn im Alltag erlebst. Es gibt kein Richtig oder Falsch. Antworte so, wie du die Person in den letzten 6 Monaten erlebt hast. Die Fragen zur Kindheit kannst du mit „Weiß ich nicht“ beantworten, wenn du die Person damals nicht kanntest und es auch nicht aus Erzählungen weißt.</p>'+
   '<p class="small">'+Q.items.length+' Fragen, ca. 5 Minuten. Eine Frage pro Bildschirm – tipp einfach an, es geht automatisch weiter. Die Fragen hat Thomas Freimoser selbst geschrieben; sie sind nicht wissenschaftlich geprüft und werden nicht gezählt.</p>'+
   '<p class="small">Die Antworten von '+who+' sind in diesem Link nicht enthalten, und du siehst sie auch nicht. Dein Fortschritt wird nur in diesem Browser zwischengespeichert, damit du nach dem Neuladen weitermachen kannst. Am Ende bekommst du einen Antwortlink, den du nur an '+who+' schickst.</p>'+
   '<label class="fld">Dein Vorname oder Spitzname (optional)<input id="fo" maxlength="40" autocomplete="off" value="'+esc(d.name)+'"></label><p class="small">Gilt für die Person: <strong>'+who+'</strong>'+(inv.r?' · du bist: '+esc(inv.r):"")+'</p>'},
  bind:function(st){var fo=$("#fo");if(fo)fo.oninput=function(){d.name=fo.value.trim().slice(0,40);persist()}},
  foot:function(){return '<p class="wz-del"><button type="button" class="linkbtn" id="wzdel">Zwischenspeicher löschen</button></p>'},
  done:finish});
 bindDel(function(){localStorage.removeItem(FK);friend(raw)});
 function finish(){WZ=null;
  root.innerHTML='<section class="panel ok"><h2 tabindex="-1" id="fdone">Fertig – danke!</h2><p>Du hast alle Fragen über '+who+' beantwortet. Jetzt nur noch den Antwortlink erstellen und an '+who+' schicken.</p>'+
  (inv.p?'<label class="fld">Passwort von '+who+' (hat sie/er dir separat gegeben)<input id="fp" type="password" autocomplete="off" required></label>':"")+
  '<div class="btns left"><button class="btn pri big" type="button" id="fmk">Antwortlink erstellen</button><button class="btn" type="button" id="fedit">← Antworten ändern</button></div><div id="fout"></div>'+
  '<p class="small"><button type="button" class="linkbtn" id="fclr">Zwischenspeicher in diesem Browser löschen</button></p></section>';
  $("#fdone").focus({preventScroll:true});$("#fdone").scrollIntoView({block:"center"});
  $("#fedit").onclick=function(){d.pos=steps.length-1;persist();friend(raw)};
  $("#fclr").onclick=function(){if(confirm("Deine Antworten aus diesem Browser löschen? Ein bereits erstellter Antwortlink bleibt gültig.")){localStorage.removeItem(FK);friend(raw)}};
  $("#fmk").onclick=async function(){var pw=inv.p?$("#fp").value:"";if(inv.p&&!pw){$("#fp").focus();return}
   var a=d.o.map(function(v){return v==null||v<0?null:v});
   var s=await pack({v:1,id:inv.id,o:(d.name||"").trim().slice(0,40),a:a},pw);
   var link=BASE+"#a="+inv.id+"."+s;
   $("#fout").innerHTML='<div class="panel ok"><h3>Dein Antwortlink</h3><p>Schick diesen Link <strong>nur an '+who+'</strong>. Er enthält deine Einschätzung (Gesundheitsdaten)'+(pw?", verschlüsselt mit dem Passwort":"")+'.</p><textarea readonly id="alink" rows="3">'+esc(link)+'</textarea><div class="btns left">'+copyBtn(link)+(navigator.share?'<button type="button" class="btn" id="shr">Teilen …</button>':"")+'</div></div>';
   var sh=$("#shr");if(sh)sh.onclick=function(){navigator.share({title:"Meine Einschätzung",text:"Hier meine Antworten für deinen ADHS-Check:",url:link}).catch(function(){})};
   $("#fout").scrollIntoView({behavior:"smooth"})}}
}
function bindDel(fn){if(WZ)WZ.onDel=fn}
document.addEventListener("click",function(e){if(e.target.closest("#wzdel")&&WZ&&WZ.onDel&&confirm("Wirklich alle Antworten aus diesem Browser löschen?"))WZ.onDel()});

/* ---------- Selbst ---------- */
function asrsCount(a){return a.reduce(function(n,v,i){return n+(v!=null&&v>=A.shaded[i]?1:0)},0)}
function wipeAll(){Object.keys(localStorage).forEach(function(k){if(k.indexOf(KEY)===0)localStorage.removeItem(k)})}
function self(){
 var s=load();
 if(s.asrs&&s.own&&!s.draft){WZ=null;root.innerHTML='<div id="res"></div>';results(false);return}
 var d=s.draft;if(!d||!Array.isArray(d.a)||!Array.isArray(d.o)||d.o.length!==Q.items.length)d={a:A.items.map(function(){return null}),o:Q.items.map(function(){return null}),pos:0};
 function persist(){var x=load();x.draft=d;save(x)}
 var steps=buildSteps(true),total=A.items.length+Q.items.length;
 wizard({steps:steps,total:total,which:1,pos:Math.min(d.pos||0,steps.length-1),partLabel:partLabel,
  val:function(st){return (st.p===1?d.a:d.o)[st.i]},setVal:function(st,v){(st.p===1?d.a:d.o)[st.i]=v;persist()},save:function(p){d.pos=p;persist()},
  cheer:cheerFor(total,""),
  intro:function(st){if(st.p===1)return '<h2 tabindex="-1">Teil 1: Offizieller Kurztest</h2><p>Los geht\'s mit den sechs Fragen des ASRS-V1.1 Screeners. Tipp einfach die passende Antwort an, dann geht es automatisch weiter. Mit „Zurück“ kannst du jederzeit etwas ändern. Insgesamt sind es '+total+' Fragen, ca. 10 Minuten.</p>'+
   '<blockquote class="wz-official">'+esc(A.intro)+'</blockquote>'+
   '<p class="small">Offizieller Kurztest, unverändert übernommen. © New York University and the President and Fellows of Harvard College. Entwickelt von Dr. Lenard Adler (NYU) und Dr. Ronald Kessler (Harvard). Quelle: Kessler RC, Adler L, Ames M et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychological Medicine 2005; 35(2): 245–256. <a href="https://license.tov.med.nyu.edu/product/asrs6Qscreener" rel="noopener">Lizenz (NYU)</a>. Historischer Hinweis: Das Originalformular nennt © World Health Organization 2004. Für Personen ab 18 Jahren. Die <span class="shk">markierten</span> Antwortfelder entsprechen den schattierten Kästchen des Originalbogens. Der offizielle Kurztest ist im Original gesiezt und bleibt deshalb unverändert.</p>'+
   '<p class="small">Dein Fortschritt wird nur in diesem Browser gespeichert. Du kannst die Seite schließen und später an derselben Stelle weitermachen.</p>';
   return '<p class="wz-cheer">Stark, Teil 1 ist geschafft! 🎉</p><h2 tabindex="-1">Teil 2: Eigene Fragen <span class="tag">nicht wissenschaftlich geprüft</span></h2><p>Jetzt kommen '+Q.items.length+' Fragen, die genauer auf deinen Alltag schauen: Aufmerksamkeit, Unruhe, Kindheit und was das im Leben ausmacht. Gleiche Antwortskala, gleiches Prinzip: antippen, weiter.</p><p class="small">Diese Fragen hat Thomas Freimoser selbst geschrieben, entlang der Symptombereiche aus DSM-5 und ICD-11. Sie werden nicht gezählt und haben keinen Grenzwert. Sie dienen nur dazu, ein Profil zu sehen und es mit der Sicht anderer zu vergleichen. Genau diese Fragen beantworten später auch deine Freunde über dich.</p>'},
  foot:function(){return '<p class="wz-del"><button type="button" class="linkbtn" id="wzdel">🗑️ Alles löschen und neu starten</button></p>'},
  done:function(){var x=load();x.asrs=d.a.slice();x.own=d.o.slice();delete x.draft;save(x);root.innerHTML='<div id="res"></div>';results(true)}});
 bindDel(function(){wipeAll();self();window.scrollTo(0,0)});
 if(d.pos>0)ensureVisible();
}
function editAnswers(){var x=load();if(!x.asrs||!x.own)return;x.draft={a:x.asrs.slice(),o:x.own.slice(),pos:1};save(x);self();var w=$("#wz");if(w){w.scrollIntoView({block:"start"});var q=$("#wzq");if(q)q.focus({preventScroll:true})}}
function waText(link,pw){return "Hey! Ich mache gerade den „ADHS-Check zu dritt“ und würde gern wissen, wie du mich im Alltag erlebst. Es dauert ca. 5 Minuten, es gibt kein Richtig oder Falsch, und deine Antworten bekomme nur ich zurück: "+link+(pw?"\nDas Passwort sag ich dir separat.":"")}
function word(v){return v==null?"–":Q.scale[Math.round(v)]}
function avg(a){a=a.filter(function(v){return v!=null});return a.length?a.reduce(function(x,y){return x+y},0)/a.length:null}
function bar(v,cls){return v==null?'<span class="bar empty">–</span>':'<span class="bar '+(cls||"")+'"><i style="width:'+(v/4*100)+'%"></i><b>'+word(v)+'</b></span>'}
function results(scroll){
 var s=load(),out=$("#res");if(!s.asrs||!s.own){out.innerHTML="";return}
 var n=asrsCount(s.asrs),obs=s.obs||[],inv=s.invites||[];
 var h='<p class="printonly"><strong>ADHS-Check zu dritt – Ausdruck vom '+new Date().toLocaleDateString("de-DE")+'</strong> · freimoser.github.io/adhs-test · Selbsteinschätzung, keine Diagnose</p><section class="panel result" id="ergebnis"><h2>Lohnt sich ein Gespräch mit dem Arzt?</h2>';
 h+=n>=4?'<p class="verdict yes"><strong>ASRS-Screener: '+n+' von 6 Antworten im markierten Bereich.</strong> Das passt zu ADHS – bitte fachärztlich abklären lassen.</p>'
  :'<p class="verdict no"><strong>ASRS-Screener: '+n+' von 6 Antworten im markierten Bereich.</strong> Der Kurztest zeigt damit kein auffälliges Ergebnis. Wenn du trotzdem im Alltag deutlich leidest, ist ein Arztgespräch genauso sinnvoll – ein Screening kann auch danebenliegen.</p>';
 h+='<p class="small">Offizielle Auswertung (Originaltext, Häkchen im dunklen Bereich zählen): „'+esc(A.resultText)+'“</p>';
 h+='<div class="note">Dies ist eine Selbsteinschätzung zur Vorbereitung auf das Arztgespräch – <strong>keine Diagnose und kein Medizinprodukt</strong>. Eine ADHS-Diagnose kann nur eine Fachärztin, ein Facharzt oder eine Psychotherapeutin bzw. ein Psychotherapeut nach ausführlicher Untersuchung stellen. Anlaufstellen: Hausarztpraxis, Facharzt für Psychiatrie und Psychotherapie, psychologische und ärztliche Psychotherapeuten, Terminservice der Kassenärztlichen Vereinigung unter <a href="tel:116117">116117</a>.</div>';
 h+='<div class="crisis">Geht es dir gerade richtig schlecht? Die TelefonSeelsorge ist rund um die Uhr kostenlos und anonym erreichbar: <a href="tel:08001110111">0800 111 0 111</a>. Im Notfall: <a href="tel:112">112</a>.</div><p class="noprint ctarow"><a class="btn pri big" href="#einladen" id="ctaj">👥 Jetzt Freunde einladen</a></p></section>';
 // Einladungen
 h+='<section class="panel cta noprint" id="einladen"><h2>👥 Jetzt Freunde einladen</h2><p><strong>Wie sehen dich deine Freunde?</strong> Lade Menschen ein, die dich gut kennen. Am aussagekräftigsten sind <strong>3–4 Personen aus verschiedenen Lebensbereichen</strong>, zum Beispiel Partner/in, Familie, ein Freund und jemand von der Arbeit. Du kannst beliebig viele Links erstellen; jeder hat eine eigene Zufalls-ID.</p>'+
  '<p class="small">Der Einladungslink enthält nur die Fragen-Version, die ID und den Namen, den du einträgst – <strong>nie deine eigenen Antworten</strong>. Mit Passwort wird der Antwortlink deiner Vertrauensperson verschlüsselt (AES-GCM). Das Passwort gibst du ihr auf einem anderen Weg, z. B. mündlich.</p>'+
  '<form id="invf" class="invf"><label class="fld">Dein Name für die Einladung<input id="in" maxlength="40" required placeholder="z. B. Thomas"></label><label class="fld">Die Person ist für dich<select id="ir">'+REL.map(function(r){return "<option>"+r+"</option>"}).join("")+'</select></label><label class="fld">Passwort (optional)<input id="ip" type="text" autocomplete="off" maxlength="64" placeholder="leer = ohne Verschlüsselung"></label><button class="btn pri" type="submit">Einladungslink erstellen</button></form><div id="invlist">';
 inv.slice().reverse().forEach(function(v){var got=obs.filter(function(o){return o.id===v.id}).length;var link=BASE+"#i="+b64u(new TextEncoder().encode(JSON.stringify({v:1,id:v.id,n:v.n,r:v.r,q:Q.version,p:v.pw?1:0})));
  var wt=waText(link,v.pw);
  h+='<div class="inv" data-id="'+esc(v.id)+'"><div><strong>'+esc(v.r)+'</strong> · ID '+esc(v.id)+(v.pw?' · 🔒 Passwort: <code>'+esc(v.pw)+'</code>':"")+(got?' · <span class="okc">Antwort da ✓</span>':' · wartet')+'</div><input readonly value="'+esc(link)+'" aria-label="Einladungslink"><div class="btns left"><a class="btn wa" href="https://wa.me/?text='+encodeURIComponent(wt)+'" target="_blank" rel="noopener">WhatsApp</a>'+(navigator.share?'<button type="button" class="btn small" data-share="'+esc(link)+'" data-text="'+esc(wt.replace(link,"").replace(/:\s*$/,":").trim())+'">Teilen …</button>':"")+copyBtn(link)+'</div></div>'});
 h+='</div><h3>Antwortlink einfügen</h3><p class="small">Wenn deine Vertrauensperson dir ihren Antwortlink schickt, öffne ihn einfach in diesem Browser – oder füge ihn hier ein.</p><form id="impf" class="imp"><textarea id="imp" rows="2" placeholder="https://…#a=…"></textarea><button class="btn pri" type="submit">Antwort hinzufügen</button></form><p id="impmsg" class="small" role="status"></p></section>';
 // Profil + Vergleich
 var areas=Object.keys(Q.areas);
 h+='<section class="panel" id="vergleich"><h2>Dein Profil'+(obs.length?" im Vergleich":"")+' <span class="tag">nicht wissenschaftlich geprüft</span></h2><p class="small">Kein Zählwert, kein Grenzwert: Die Balken zeigen nur, wie oft etwas im Schnitt beschrieben wurde.</p><div class="tw"><table class="cmp"><thead><tr><th>Bereich</th><th>Du</th>'+obs.map(function(o){return "<th>"+esc(o.o||"Person")+"<br><small>"+esc(o.r||"")+"</small></th>"}).join("")+(obs.length?"<th>Ø andere</th>":"")+'</tr></thead><tbody>';
 areas.forEach(function(ar){var idx=[];Q.items.forEach(function(it,i){if(it[0]===ar)idx.push(i)});var me=avg(idx.map(function(i){return s.own[i]}));var os=obs.map(function(o){return avg(idx.map(function(i){return o.a[i]}))});
  h+='<tr><th>'+esc(Q.areas[ar])+'</th><td>'+bar(me,"me")+'</td>'+os.map(function(v){return "<td>"+bar(v)+"</td>"}).join("")+(obs.length?"<td>"+bar(avg(os),"av")+"</td>":"")+'</tr>'});
 h+='</tbody></table></div>';
 if(obs.length){h+='<h3>Frage für Frage</h3><p class="small">🟢 <strong>alle sehen es</strong>: alle Vertrauenspersonen sagen mindestens „oft“. 🟡 <strong>nur eine Person</strong>: nur eine von mehreren sagt „oft“ oder mehr. ↔ <strong>großer Unterschied</strong>: deine Sicht weicht stark vom Durchschnitt der anderen ab. Das sind gute Gesprächsthemen – auch fürs Arztgespräch.</p><div class="tw"><table class="cmp items"><thead><tr><th>Frage</th><th>Du</th>'+obs.map(function(o){return "<th>"+esc(o.o||"Person")+"</th>"}).join("")+'<th>Ø</th><th>Hinweis</th></tr></thead><tbody>';
  Q.items.forEach(function(it,i){var vs=obs.map(function(o){return o.a[i]}),known=vs.filter(function(v){return v!=null}),av=avg(vs),hi=known.filter(function(v){return v>=3}).length,fl=[];
   if(known.length>=2&&hi===known.length)fl.push("🟢 alle sehen es");else if(known.length>=2&&hi===1)fl.push("🟡 nur eine Person");
   if(av!=null&&s.own[i]!=null&&Math.abs(s.own[i]-av)>=1.5)fl.push("↔ großer Unterschied");
   h+='<tr'+(fl.length?' class="flag"':"")+'><td>'+(i+1)+'. '+esc(it[1])+'</td><td>'+word(s.own[i])+'</td>'+vs.map(function(v){return "<td>"+word(v)+"</td>"}).join("")+'<td>'+(av==null?"–":av.toFixed(1).replace(".",","))+'</td><td>'+fl.join("<br>")+'</td></tr>'});
  h+='</tbody></table></div><p class="small">Ø = Durchschnitt auf der Skala 0 (nie) bis 4 (sehr oft).</p>'}
 else h+='<p>Noch keine Einschätzungen von anderen. Erstelle oben einen Einladungslink.</p>';
 h+='<div class="btns noprint"><button class="btn pri" type="button" id="prt">🖨️ Für den Arzttermin drucken</button><button class="btn" type="button" id="edit">✏️ Antworten ändern</button><button class="btn danger" type="button" id="del">🗑️ Alles löschen</button></div><p class="small noprint">Alles, was du hier siehst, ist nur im Speicher dieses Browsers (localStorage) gespeichert. Es gibt keinen Server und kein Konto. Achtung: Einladungs- und Antwortlinks enthalten Gesundheitsdaten – verschick sie nur an die gemeinte Person.</p></section>';
 h+='<section class="printonly" id="antworten"><h2>Alle Antworten</h2><h3>Teil 1: ASRS-V1.1 Screener</h3><p class="small">'+esc(A.intro)+'</p><table class="cmp"><thead><tr><th>Frage</th><th>Antwort</th></tr></thead><tbody>'+
  A.items.map(function(q,i){var v=s.asrs[i],c=v!=null&&v>=A.shaded[i];return '<tr><td>'+(i+1)+'. '+esc(q)+'</td><td'+(c?' class="shp"':"")+'>'+(v==null?"–":esc(A.scale[v]))+(c?" ■":"")+'</td></tr>'}).join("")+
  '</tbody></table><p class="small">■ = markiertes Feld (schattiertes Kästchen im Originalbogen). '+LIC.replace(/<[^>]+>/g,"")+'</p><h3>Teil 2: Eigene Fragen (nicht wissenschaftlich geprüft)</h3><table class="cmp"><thead><tr><th>Frage</th><th>Antwort</th></tr></thead><tbody>'+
  Q.items.map(function(it,i){return '<tr><td>'+(i+1)+'. '+esc(it[1])+'</td><td>'+esc(cap(word(s.own[i])))+'</td></tr>'}).join("")+'</tbody></table></section>';
 out.innerHTML=h;
 $("#invf").onsubmit=function(ev){ev.preventDefault();var st=load();st.invites=st.invites||[];st.invites.push({id:rid(),n:$("#in").value.trim().slice(0,40),r:$("#ir").value,pw:$("#ip").value,at:Date.now()});st.lastName=$("#in").value.trim();save(st);results(false);var ni=$("#invlist .inv");if(ni){ni.classList.add("new");ni.scrollIntoView({block:"center"});var w=ni.querySelector(".wa");if(w)w.focus({preventScroll:true})}};
 if(s.lastName)$("#in").value=s.lastName;
 $("#impf").onsubmit=function(ev){ev.preventDefault();var v=$("#imp").value.trim(),m=v.indexOf("#a=");importAnswer(m>=0?v.slice(m+3):v)};
 $("#prt").onclick=function(){window.print()};
 $("#edit").onclick=editAnswers;
 $("#ctaj").onclick=function(e){e.preventDefault();$("#einladen").scrollIntoView({behavior:"smooth",block:"start"});setTimeout(function(){$("#in").focus({preventScroll:true})},400)};
 $("#del").onclick=function(){if(confirm("Wirklich alle Antworten, Einladungen und Einschätzungen aus diesem Browser löschen?")){wipeAll();self();window.scrollTo(0,0)}};
 if(scroll)$("#ergebnis").scrollIntoView({behavior:"smooth"});
}
async function importAnswer(raw){
 var msg=function(t){var e=$("#impmsg");if(e)e.textContent=t;else alert(t)};
 var dot=raw.indexOf(".");if(dot<1){msg("Das sieht nicht nach einem gültigen Antwortlink aus.");return false}
 var id=raw.slice(0,dot),body=raw.slice(dot+1),s=load(),inv=(s.invites||[]).filter(function(v){return v.id===id})[0];
 if(!inv){msg("Zu diesem Antwortlink gibt es in diesem Browser keine Einladung. Öffne ihn im selben Browser, in dem du die Einladung erstellt hast.");return false}
 var d;try{d=await unpack(body,inv.pw)}catch(e){if(body[0]!=="e"){msg("Der Antwortlink ist unvollständig oder beschädigt. Bitte den ganzen Link noch einmal kopieren.");return false}var pw=prompt(inv.pw?"Entschlüsseln fehlgeschlagen – der Link ist unvollständig oder das Passwort stimmt nicht. Passwort erneut eingeben:":"Bitte das Passwort für diese Einladung eingeben:");if(!pw){msg("Abgebrochen. Passwort falsch oder Link unvollständig – bitte den ganzen Link noch einmal kopieren.");return false}try{d=await unpack(body,pw)}catch(e2){msg("Passwort falsch oder Link unvollständig.");return false}}
 if(!d||d.id!==id||!Array.isArray(d.a)||d.a.length!==Q.items.length){msg("Der Link passt nicht zu dieser Fragen-Version.");return false}
 s.obs=(s.obs||[]).filter(function(o){return !(o.id===id)});s.obs.push({id:id,r:inv.r,o:d.o||"",a:d.a.map(function(v){return v==null?null:Math.max(0,Math.min(4,v|0))}),at:Date.now()});save(s);
 if(s.asrs&&s.own&&!s.draft&&$("#res")){results(false);msg("Antwort von "+(d.o||inv.r)+" hinzugefügt ✓");$("#vergleich").scrollIntoView()}else{self();alert("Antwort gespeichert. Füll jetzt deinen eigenen Teil aus, dann siehst du den Vergleich.")}
 return true}
async function route(){var h=location.hash;
 if(h.indexOf("#i=")===0){friend(h.slice(3));return}
 self();
 if(h.indexOf("#a=")===0){var r=h.slice(3);history.replaceState(null,"",location.pathname);await importAnswer(r)}}
window.addEventListener("hashchange",function(){if(/^#[ia]=/.test(location.hash))route()});
route();
})();
