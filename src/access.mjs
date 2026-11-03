const decode = part => Uint8Array.from(atob(part.replaceAll('-','+').replaceAll('_','/')), c => c.charCodeAt(0));
let cached;
export async function roleFor(request, env) {
 const issuer = env.ACCESS_ISSUER;
 if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !env.ACCESS_AUD) return null;
 const raw = request.headers.get('Cf-Access-Jwt-Assertion') || '';
 const parts = raw.split('.');
 if (parts.length !== 3) return null;
 try {
  const [header, claims] = parts.slice(0,2).map(p => JSON.parse(new TextDecoder().decode(decode(p))));
  const now = Date.now()/1000;
  if (header.alg !== 'RS256' || !header.kid || claims.iss !== issuer || ![claims.aud].flat().includes(env.ACCESS_AUD) ||
      !Number.isFinite(claims.exp) || claims.exp <= now || (claims.nbf !== undefined && !(claims.nbf <= now))) return null;
  if (!cached || cached.issuer !== issuer || cached.until <= now) {
   const response = await fetch(issuer + '/cdn-cgi/access/certs');
   if (!response.ok) return null;
   cached = {issuer, until:now+300, keys:(await response.json()).keys};
  }
  const jwk = cached.keys.find(k => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
  if (!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decode(parts[2]),new TextEncoder().encode(parts.slice(0,2).join('.')))) return null;
  const mail = String(claims.email || '').trim().toLowerCase();
  const contains = list => mail && (list || '').toLowerCase().split(',').map(s=>s.trim()).includes(mail);
  return contains(env.PARENT_EMAILS) ? 'parent' : contains(env.STUDENT_EMAILS) ? 'student' : null;
 } catch { return null; }
}
