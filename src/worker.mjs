import {roleFor} from './access.mjs';
import {lessons,promptFor} from './lessons.mjs';
const endpoint = 'https://tiqidcoyvfdotjbfqgjn.supabase.co/rest/v1/pablo_observations';
const levels = ['Je bloque','Je cherche encore','Je peux expliquer'];
const esLevels = ['Expresa bloqueo','Tiene dudas','Se ve capaz de explicarlo'];
const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const security = {'Cache-Control':'private, no-store','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",'Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const css = 'body{margin:0;background:#f6f4ec;color:#183b33;font:18px/1.55 system-ui}main{max-width:680px;margin:auto;padding:32px 20px}header{border-bottom:2px solid #276b56;padding-bottom:14px;letter-spacing:.12em;font-size:.83em;font-weight:700}article,fieldset{background:white;border:1px solid #cbd8cf;border-radius:15px;padding:20px;margin:18px 0}h1{font: bold clamp(2rem,6vw,3rem)/1.1 Georgia}label,textarea,select{display:block;margin:9px 0}textarea,select{box-sizing:border-box;width:100%;font:inherit;padding:9px;border:1px solid #71877d;border-radius:7px}button,.btn{display:inline-block;background:#175c49;color:white;border:0;border-radius:8px;padding:11px 17px;font:inherit;margin:5px 5px 5px 0;text-decoration:none}a{color:#165b47}small{color:#456459}blockquote{margin:10px 0;border-left:3px solid #97bdae;padding-left:12px;white-space:pre-wrap;overflow-wrap:anywhere}';
function page(title,body,status=200,lang='fr') {
 return new Response('<!doctype html><html lang="'+lang+'"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' · Pablo Math Lab</title><style>'+css+'</style><main><header>PABLO MATH LAB</header><h1>'+esc(title)+'</h1>'+body+'</main></html>',{status,headers:{...security,'Content-Type':'text/html; charset=utf-8'}});
}
const link = (path,label) => '<a class="btn" href="'+path+'">'+label+'</a>';
function report(rows) {
 const finished = rows.filter(r=>r.phase===1).length;
 return page('Cuaderno de observación','<p>Calcul littéral · '+finished+' de 14 actividades revisadas.</p><p>Lee las dos explicaciones en paralelo. La confianza es la que declara Pablo. Una respuesta distinta puede ser una corrección o una nueva hipótesis.</p>'+(!rows.length?'<article>Aún no hay observaciones. El informe empezará con la primera respuesta.</article>':'')+rows.filter(r=>r.phase===0).map(a=>{
 const b=rows.find(r=>r.item===a.item && r.phase===1);
 const quote=r=>'<blockquote lang="fr">'+esc(r.answer)+'<br>'+esc(r.reasoning)+'</blockquote><small>'+esLevels[r.confidence]+'</small>';
 return '<article><small>Sesión '+(1+Math.floor(a.item/2))+'</small><h2>'+esc(lessons[a.item][0])+'</h2><p lang="fr">'+esc(lessons[a.item][1])+'</p><b>Primer intento</b>'+quote(a)+(b?'<p><b>Después de la pregunta del tutor</b></p><p lang="fr">'+esc(promptFor(a.item,a))+'</p>'+quote(b)+'<p>Pistas adicionales consultadas: '+b.hints+'.</p>':'<p>La revisión está pendiente.</p>')+'<p><b>Qué observar.</b> '+lessons[a.item][4]+'</p></article>';
 }).join('')+link('/','Volver al inicio'),200,'es');
}
function exercise(i,first,hints=0,draft={}) {
 const [title,question,h1,h2]=lessons[i];
 const phase=Number(Boolean(first));
 const help=first?'<article><b>Ton premier essai</b><blockquote>'+esc(first.answer)+'<br>'+esc(first.reasoning)+'</blockquote><b>Une question pour toi</b><p>'+esc(promptFor(i,first))+'</p>'+[h1,h2].filter(h=>!promptFor(i,first).includes(h)).slice(0,hints).map(h=>'<p>Indice · '+esc(h)+'</p>').join('')+'</article>':'';
 const remaining=[h1,h2].filter(h=>!first || !promptFor(i,first).includes(h)).length;
 return page(title,'<small>SÉANCE '+(1+Math.floor(i/2))+' / 7 · QUESTION '+(1+i%2)+' / 2</small><p>'+question+'</p>'+help+'<form method="post" action="/atelier"><input type="hidden" name="item" value="'+i+'"><input type="hidden" name="phase" value="'+phase+'"><input type="hidden" name="hints" value="'+hints+'"><label>'+ (first?'Après réflexion, que proposes-tu ?':'Ton idée, même incomplète')+'<textarea required maxlength="480" name="answer">'+esc(draft.answer||'')+'</textarea></label><label>Comment as-tu réfléchi ? Tu peux aussi décrire ce qui te bloque.<textarea required maxlength="900" name="reasoning">'+esc(draft.reasoning||'')+'</textarea></label><label>Comment te sens-tu ?<select required name="confidence"><option value="">Choisir…</option>'+levels.map((s,n)=>'<option value="'+n+'" '+(String(n)===draft.confidence?'selected':'')+'>'+s+'</option>').join('')+'</select></label><button name="act" value="save">'+(first?'Enregistrer ma réflexion':'Discuter de mon idée')+'</button>'+(first&&hints<remaining?'<button formnovalidate name="act" value="hint">Un indice</button>':'')+'</form><p><a href="/">Retour à l’accueil</a></p>');
}
export async function handle(req,role,db) {
 const {pathname,origin}=new URL(req.url);
 if (!role || (pathname==='/parents'&&role!=='parent')) return page('Accès privé','',403);
 if (!['/','/atelier','/parents'].includes(pathname)) return page('Page inconnue','',404);
 if(req.method!=='GET' && !(req.method==='POST' && pathname==='/atelier')) return page('Méthode refusée','',405);
 if(req.method==='POST' && req.headers.get('origin')!==origin) return page('Origine refusée','',403);
 const rows=await db.read();
 if(pathname==='/parents') return report(rows);
 const i=lessons.findIndex((_,n)=>!rows.some(r=>r.item===n&&r.phase===1));
 const first=rows.find(r=>r.item===i&&r.phase===0);
 if(pathname==='/') return page(i<0?'Parcours terminé':'Ton atelier de maths','<small>5ÈME · CALCUL LITTÉRAL</small><p>'+ (i<0?'Tes réflexions sont enregistrées.': 'Deux questions à ton rythme. Explique ton idée avec tes mots, puis explore une question du tuteur.')+'</p>'+(i<0?'':link('/atelier','Ouvrir la séance '+(1+Math.floor(i/2))))+(role==='parent'?link('/parents','Informe para padres'):''));
 const redirect=path=>new Response(null,{status:303,headers:{...security,Location:path}});
 if(i<0) return redirect('/');
 if(req.method==='GET') return exercise(i,first);
 const form=Object.fromEntries(await req.formData());
 if(form.item!==String(i)||form.phase!==String(Number(Boolean(first)))) return redirect('/');
 const hints=Number(form.hints);
 if(!Number.isInteger(hints)||hints<0||hints>2||!first&&hints!==0) return page('Données invalides','',400);
 if(form.act==='hint' && first) return exercise(i,first,Math.min(2,hints+1),form);
 const answer=String(form.answer||'').trim(),reasoning=String(form.reasoning||'').trim();
 if(form.act!=='save'||!answer||answer.length>480||!reasoning||reasoning.length>900||!['0','1','2'].includes(form.confidence)) return page('Réponse incomplète','<p>Reviens au formulaire pour compléter ton essai.</p>',400);
 await db.save({item:i,phase:Number(Boolean(first)),answer,reasoning,confidence:Number(form.confidence),hints});
 return redirect(first&&i%2===1?'/':'/atelier');
}
export default {async fetch(req,env) {
 try {
 const role=await roleFor(req,env);
 const headers={apikey:env.SUPABASE_SECRET_KEY,'Content-Type':'application/json'};
 async function call(query,init={}) {
  const r=await fetch(endpoint+query,{...init,headers:{...headers,...init.headers}});
  if(!r.ok) throw Error('storage');
  return r;
 }
 return await handle(req,role,{read:async()=> (await call('?select=item,phase,answer,reasoning,confidence,hints&order=item,phase')).json(),save:data=>call('',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(data)})});
 } catch { return page('Atelier momentanément indisponible','<p>Réessaie dans un instant. Si tu viens d’envoyer une réponse, retourne à l’accueil pour vérifier ta progression.</p>'+link('/','Accueil'),503); }
}};
