import test from 'node:test';
import assert from 'node:assert/strict';
import worker,{handle} from '../src/worker.mjs';
import {roleFor} from '../src/access.mjs';
const origin='https://math.example';
const get=path=>new Request(origin+path);
const post=(fields,site=origin)=>new Request(origin+'/atelier',{method:'POST',headers:{Origin:site},body:new URLSearchParams(fields)});
test('seven sessions: independent attempts, hints, resumption and parent evidence',async()=>{
 const rows=[],db={read:async()=>rows,save:async r=>rows.push(r)};
 assert.equal((await handle(get('/parents'),'student',db)).status,403);
 assert.equal((await worker.fetch(get('/'),{})).status,403);
 for(let item=0;item<14;item++){
  const fields={item,phase:0,act:'save',answer:item===2?'7a + 3':'<script>essai</script>',reasoning:'Je dessine des groupes.',confidence:'1',hints:'0'};
  assert.equal((await handle(post(fields,'https://elsewhere.example'),'student',db)).status,403);
  assert.equal((await handle(post({...fields,reasoning:''}),'student',db)).status,400);
  assert.equal((await handle(post(fields),'student',db)).status,303);
  await handle(post(fields),'student',db);
  const follow=await (await handle(get('/atelier'),'student',db)).text();
  assert.match(follow,/Ton premier essai/);
  if(item===2) assert.match(follow,/trois unités/);
  fields.phase=1;
  const hinted=await (await handle(post({...fields,act:'hint'}),'student',db)).text();
  assert.match(hinted,/Indice ·/);
  const done=await handle(post({...fields,hints:'1',confidence:'2'}),'student',db);
  assert.equal(done.headers.get('Location'),item%2?'/':'/atelier');
 }
 assert.equal(rows.length,28);
 assert.match(await (await handle(get('/'),'student',db)).text(),/Parcours terminé/);
 const report=await (await handle(get('/parents'),'parent',db)).text();
 assert.match(report,/14 de 14/);assert.match(report,/Pistas adicionales consultadas: 1/);
 assert.doesNotMatch(report,/<script>/);
});
test('Access checks signature, audience, expiration and role',async t=>{
 const issuer='https://pablo-test.cloudflareaccess.com';
 const env={ACCESS_ISSUER:issuer,ACCESS_AUD:'lab',PARENT_EMAILS:'parent@example.org',STUDENT_EMAILS:'student@example.org'};
 const key=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
 const jwk=await crypto.subtle.exportKey('jwk',key.publicKey);
 t.mock.method(globalThis,'fetch',async()=>Response.json({keys:[{...jwk,kid:'k'}]}));
 async function token(overrides={},tamper=false){
  const encode=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
  const head=encode({alg:'RS256',kid:'k'}),claims={aud:['lab'],iss:issuer,exp:Date.now()/1000+60,email:'student@example.org',...overrides};
  const body=encode(claims);
  const signature=Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key.privateKey,Buffer.from(head+'.'+body))).toString('base64url');
  return new Request(origin,{headers:{'Cf-Access-Jwt-Assertion':[head,tamper?encode({...claims,email:'parent@example.org'}):body,signature].join('.')}});
 }
 for(const [claims,expected] of [[{},'student'],[{email:'parent@example.org'},'parent'],[{email:'outside@example.org'},null],[{aud:['other']},null],[{exp:1},null]]) assert.equal(await roleFor(await token(claims),env),expected);
 assert.equal(await roleFor(await token({},true),env),null);
});
