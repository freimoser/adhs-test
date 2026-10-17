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
function scaleRow(name,labels,val,shade){return '<div class="scale" role="radiogroup">'+labels.map(function(l,i){return '<label class="opt'+(shade!=null&&i>=shade?" sh":"")+'"><input type="radio" name="'+name+'" value="'+i+'"'+(val===i?" checked":"")+' required><span>'+esc(l)+'</span></label>'}).join("")+'</div>'}
function ownForm(prefix,which,vals){var h="",last="";Q.items.forEach(function(it,i){if(it[0]!==last){last=it[0];h+='<h3 class="area">'+esc(Q.areas[last])+'</h3>'}
 h+='<fieldset class="q"><legend><span class="n">'+(i+1)+'.</span> '+esc(it[which])+'</legend>'+scaleRow(prefix+i,Q.scale,vals?vals[i]:null)+'</fieldset>'});return h}
function read(form,prefix,n){var r=[];for(var i=0;i<n;i++){var c=form.querySelector('input[name="'+prefix+i+'"]:checked');r.push(c?+c.value:null)}return r}
function firstMissing(form,prefix,arr){var i=arr.indexOf(null);if(i<0)return false;var el=form.querySelector('input[name="'+prefix+i+'"]');el.closest("fieldset").classList.add("miss");el.closest("fieldset").scrollIntoView({behavior:"smooth",block:"center"});return true}
function copyBtn(txt){return '<button type="button" class="btn small" data-copy="'+esc(txt)+'">Link kopieren</button>'}
document.addEventListener("click",function(e){var b=e.target.closest("[data-copy]");if(!b)return;var t=b.getAttribute("data-copy");(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Kopiert ✓"},function(){prompt("Link kopieren:",t)})});

/* ---------- Freund/in: Einladung beantworten ---------- */
async function friend(raw){
 var inv;try{inv=JSON.parse(new TextDecoder().decode(ub64(raw)))}catch(e){root.innerHTML='<p class="warn">Dieser Einladungslink ist unvollständig. Bitte den ganzen Link erneut öffnen.</p>';return}
 var who=esc(inv.n||"Jemand");
 root.innerHTML='<section class="panel"><h2>'+who+' bittet dich um deine Einschätzung</h2><p>'+who+' möchte vor einem möglichen Arztgespräch wissen, wie du sie oder ihn im Alltag erlebst. Es gibt kein Richtig oder Falsch. Antworte so, wie du die Person in den letzten 6 Monaten erlebt hast. Die Fragen zur Kindheit kannst du leer lassen, wenn du die Person damals nicht kanntest und es auch nicht aus Erzählungen weißt.</p>'+
 '<p class="small">Die Antworten von '+who+' sind in diesem Link nicht enthalten, und du siehst sie auch nicht. Deine Antworten werden nirgendwo gespeichert: Am Ende bekommst du einen Antwortlink, den du nur an '+who+' schickst.</p></section>'+
 '<form id="ff" class="panel" novalidate><label class="fld">Dein Vorname oder Spitzname (optional)<input id="fo" maxlength="40" autocomplete="off"></label>'+
 (inv.p?'<label class="fld">Passwort von '+who+' (hat sie/er dir separat gegeben)<input id="fp" type="password" autocomplete="off" required></label>':"")+
 '<p class="small">Gilt für die Person: <strong>'+who+'</strong>'+(inv.r?' · du bist: '+esc(inv.r):"")+'</p>'+ownForm("f",2)+
 '<button class="btn pri big" type="submit">Antwortlink erstellen</button><div id="fout"></div></form>';
 var f=$("#ff");Q.items.forEach(function(it,i){if(it[0]==="K")f.querySelectorAll('input[name="f'+i+'"]').forEach(function(x){x.required=false})});
 f.onsubmit=async function(ev){ev.preventDefault();var a=read(f,"f",Q.items.length);
  var need=a.map(function(v,i){return Q.items[i][0]==="K"?0:v}),miss=need.indexOf(null);
  if(miss>=0){firstMissing(f,"f",need);return}
  var pw=inv.p?$("#fp").value:"";if(inv.p&&!pw){$("#fp").focus();return}
  var s=await pack({v:1,id:inv.id,o:($("#fo").value||"").trim().slice(0,40),a:a},pw);
  var link=BASE+"#a="+inv.id+"."+s;
  $("#fout").innerHTML='<div class="panel ok"><h3>Fertig – danke!</h3><p>Schick diesen Link <strong>nur an '+who+'</strong>. Er enthält deine Einschätzung (Gesundheitsdaten)'+(pw?", verschlüsselt mit dem Passwort":"")+'.</p><textarea readonly id="alink" rows="3">'+esc(link)+'</textarea><div class="btns">'+copyBtn(link)+(navigator.share?'<button type="button" class="btn" id="shr">Teilen …</button>':"")+'</div></div>';
  var sh=$("#shr");if(sh)sh.onclick=function(){navigator.share({title:"Meine Einschätzung",text:"Hier meine Antworten für deinen ADHS-Check:",url:link}).catch(function(){})};
  $("#fout").scrollIntoView({behavior:"smooth"})};
}

/* ---------- Selbst ---------- */
function asrsCount(a){return a.reduce(function(n,v,i){return n+(v!=null&&v>=A.shaded[i]?1:0)},0)}
function self(){
 var s=load();
 var h='<form id="sf" novalidate><section class="panel"><h2>Teil 1: ASRS-V1.1 Screener (NYU / Harvard)</h2><p class="small">Offizieller Kurztest, unverändert übernommen. © New York University and the President and Fellows of Harvard College. Entwickelt von Dr. Lenard Adler (NYU) und Dr. Ronald Kessler (Harvard). Quelle: Kessler RC, Adler L, Ames M et al. The World Health Organization Adult ADHD Self-Report Scale (ASRS): a short screening scale for use in the general population. Psychological Medicine 2005; 35(2): 245–256. <a href="https://license.tov.med.nyu.edu/product/asrs6Qscreener" rel="noopener">Lizenz (NYU)</a>. Historischer Hinweis: Das Originalformular nennt © World Health Organization 2004. Für Personen ab 18 Jahren. Die <span class="shk">dunkel hinterlegten</span> Felder entsprechen den schattierten Kästchen des Originalbogens. Der offizielle Kurztest ist im Original gesiezt und bleibt deshalb unverändert.</p><p>'+esc(A.intro)+'</p>';
 A.items.forEach(function(q,i){h+='<fieldset class="q"><legend><span class="n">'+(i+1)+'.</span> '+esc(q)+'</legend>'+scaleRow("s"+i,A.scale,s.asrs?s.asrs[i]:null,A.shaded[i])+'</fieldset>'});
 h+='</section><section class="panel"><h2>Teil 2: Eigene Fragen <span class="tag">nicht wissenschaftlich geprüft</span></h2><p class="small">Diese Fragen hat Thomas Freimoser selbst geschrieben, entlang der Symptombereiche aus DSM-5 und ICD-11. Sie werden nicht gezählt und haben keinen Grenzwert. Sie dienen nur dazu, ein Profil zu sehen und es mit der Sicht anderer zu vergleichen.</p>'+ownForm("o",1,s.own)+
 '<button class="btn pri big" type="submit">Speichern &amp; Ergebnis ansehen</button></section></form><div id="res"></div>';
 root.innerHTML=h;
 var f=$("#sf");f.onsubmit=function(ev){ev.preventDefault();var a=read(f,"s",6),o=read(f,"o",Q.items.length);
  if(firstMissing(f,"s",a)||firstMissing(f,"o",o))return;var st=load();st.asrs=a;st.own=o;save(st);results(true)};
 f.addEventListener("change",function(e){var fs=e.target.closest("fieldset");if(fs)fs.classList.remove("miss")});
 if(s.asrs&&s.own)results(false);
}
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
 h+='<div class="crisis">Geht es dir gerade richtig schlecht? Die TelefonSeelsorge ist rund um die Uhr kostenlos und anonym erreichbar: <a href="tel:08001110111">0800 111 0 111</a>. Im Notfall: <a href="tel:112">112</a>.</div></section>';
 // Einladungen
 h+='<section class="panel noprint" id="einladen"><h2>Wie sehen dich deine Freunde?</h2><p>Lade Menschen ein, die dich gut kennen. Am aussagekräftigsten sind <strong>3–4 Personen aus verschiedenen Lebensbereichen</strong>, zum Beispiel Partner/in, Familie, ein Freund und jemand von der Arbeit. Du kannst beliebig viele Links erstellen; jeder hat eine eigene Zufalls-ID.</p>'+
  '<p class="small">Der Einladungslink enthält nur die Fragen-Version, die ID und den Namen, den du einträgst – <strong>nie deine eigenen Antworten</strong>. Mit Passwort wird der Antwortlink deiner Vertrauensperson verschlüsselt (AES-GCM). Das Passwort gibst du ihr auf einem anderen Weg, z. B. mündlich.</p>'+
  '<form id="invf" class="invf"><label class="fld">Dein Name für die Einladung<input id="in" maxlength="40" required placeholder="z. B. Thomas"></label><label class="fld">Die Person ist für dich<select id="ir">'+REL.map(function(r){return "<option>"+r+"</option>"}).join("")+'</select></label><label class="fld">Passwort (optional)<input id="ip" type="text" autocomplete="off" maxlength="64" placeholder="leer = ohne Verschlüsselung"></label><button class="btn pri" type="submit">Einladungslink erstellen</button></form><div id="invlist">';
 inv.slice().reverse().forEach(function(v){var got=obs.filter(function(o){return o.id===v.id}).length;var link=BASE+"#i="+b64u(new TextEncoder().encode(JSON.stringify({v:1,id:v.id,n:v.n,r:v.r,q:Q.version,p:v.pw?1:0})));
  h+='<div class="inv"><div><strong>'+esc(v.r)+'</strong> · ID '+esc(v.id)+(v.pw?' · 🔒 Passwort: <code>'+esc(v.pw)+'</code>':"")+(got?' · <span class="okc">Antwort da ✓</span>':' · wartet')+'</div><input readonly value="'+esc(link)+'" aria-label="Einladungslink">'+copyBtn(link)+'</div>'});
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
 h+='<div class="btns noprint"><button class="btn pri" type="button" id="prt">🖨️ Für den Arzttermin drucken</button><button class="btn danger" type="button" id="del">🗑️ Alles löschen</button></div><p class="small noprint">Alles, was du hier siehst, ist nur im Speicher dieses Browsers (localStorage) gespeichert. Es gibt keinen Server und kein Konto. Achtung: Einladungs- und Antwortlinks enthalten Gesundheitsdaten – verschick sie nur an die gemeinte Person.</p></section>';
 out.innerHTML=h;
 $("#invf").onsubmit=function(ev){ev.preventDefault();var st=load();st.invites=st.invites||[];st.invites.push({id:rid(),n:$("#in").value.trim().slice(0,40),r:$("#ir").value,pw:$("#ip").value,at:Date.now()});st.lastName=$("#in").value.trim();save(st);results(false);$("#einladen").scrollIntoView({block:"start"})};
 if(s.lastName)$("#in").value=s.lastName;
 $("#impf").onsubmit=function(ev){ev.preventDefault();var v=$("#imp").value.trim(),m=v.indexOf("#a=");importAnswer(m>=0?v.slice(m+3):v)};
 $("#prt").onclick=function(){window.print()};
 $("#del").onclick=function(){if(confirm("Wirklich alle Antworten, Einladungen und Einschätzungen aus diesem Browser löschen?")){localStorage.removeItem(KEY);self();window.scrollTo(0,0)}};
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
 if(s.asrs&&s.own){results(false);msg("Antwort von "+(d.o||inv.r)+" hinzugefügt ✓");$("#vergleich").scrollIntoView()}else{self();alert("Antwort gespeichert. Füll jetzt deinen eigenen Teil aus, dann siehst du den Vergleich.")}
 return true}
async function route(){var h=location.hash;
 if(h.indexOf("#i=")===0){friend(h.slice(3));return}
 self();
 if(h.indexOf("#a=")===0){var r=h.slice(3);history.replaceState(null,"",location.pathname);await importAnswer(r)}}
window.addEventListener("hashchange",function(){if(/^#[ia]=/.test(location.hash))route()});
route();
})();
