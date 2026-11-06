// Per-user OAuth grants for background delivery. Tokens are never returned to the browser.
export function emailProvider(provider,secrets) {
  if(!['gmail','outlook'].includes(provider))throw new Error('Provedor inválido.');
  const prefix=provider==='gmail'?'GOOGLE':'MICROSOFT';
  const callback=secrets.get('EMAIL_OAUTH_CALLBACK_URL');
  const clientId=secrets.get(prefix+'_OAUTH_CLIENT_ID'),clientSecret=secrets.get(prefix+'_OAUTH_CLIENT_SECRET');
  const config=provider==='gmail'?{authorize:'https://accounts.google.com/o/oauth2/v2/auth',token:'https://oauth2.googleapis.com/token',scope:'openid email https://www.googleapis.com/auth/gmail.send'}:{authorize:'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',token:'https://login.microsoftonline.com/common/oauth2/v2.0/token',scope:'offline_access https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Send'};
  return {...config,clientId,clientSecret,callback,configured:!!(clientId&&clientSecret&&/^https:\/\//.test(callback||'')&&(secrets.get('EMAIL_TOKEN_ENCRYPTION_KEY')||'').length>=32)};
}
const b64=bytes=>btoa(String.fromCharCode(...bytes));
const unb64=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
export const base64url=bytes=>b64(bytes).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
export async function digest(value){return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))));}
export function randomSecret(){return base64url(crypto.getRandomValues(new Uint8Array(32)));}
async function encryptionKey(secrets){const key=secrets.get('EMAIL_TOKEN_ENCRYPTION_KEY');if(typeof key!=='string'||key.length<32)throw new Error('Proteção de tokens não configurada.');return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode(key)),'AES-GCM',false,['encrypt','decrypt']);}
export async function seal(value,context,secrets){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode(context)},await encryptionKey(secrets),new TextEncoder().encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(encrypted));}
export async function unseal(value,context,secrets){const [iv,data]=value.split('.');const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv),additionalData:new TextEncoder().encode(context)},await encryptionKey(secrets),unb64(data));return JSON.parse(new TextDecoder().decode(plaintext));}
export async function startEmailOAuth(client,userId,provider,secrets){
 const config=emailProvider(provider,secrets);if(!config.configured)throw new Error('OAuth de e-mail não configurado no backend.');
 const state=randomSecret(),verifier=randomSecret();
 await client.asServiceRole.entities.EmailOAuthState.create({owner_user_id:userId,provider,state_hash:await digest(state),verifier:await seal(verifier,userId+':'+provider+':state',secrets),expires_at:new Date(Date.now()+600000).toISOString(),used:false});
 const q=new URLSearchParams({client_id:config.clientId,redirect_uri:config.callback,response_type:'code',scope:config.scope,state,code_challenge:await digest(verifier),code_challenge_method:'S256'});
 if(provider==='gmail'){q.set('access_type','offline');q.set('prompt','consent');}else q.set('prompt','select_account');
 return {url:config.authorize+'?'+q};
}
async function tokenRequest(config,params){
 const response=await fetch(config.token,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:config.clientId,client_secret:config.clientSecret,...params}),signal:AbortSignal.timeout(20000)});
 let data;try{data=await response.json();}catch{throw new Error('Resposta OAuth inválida.');}
 if(!response.ok || !data.access_token)throw new Error('Autorização de e-mail recusada ou expirada. Reconecte sua conta.');return data;
}
export async function finishEmailOAuth(client,state,code,secrets){
 const table=client.asServiceRole.entities.EmailOAuthState;
 const page=await table.filter({state_hash:await digest(state),used:false},{limit:2});
 const grant=page.items?.[0];if(page.items?.length!==1 || Date.parse(grant.expires_at)<=Date.now())throw new Error('Autorização expirada ou já utilizada.');
 const config=emailProvider(grant.provider,secrets);if(!config.configured)throw new Error('OAuth não configurado.');
 const claim=await table.updateMany({id:grant.id,used:false,expires_at:grant.expires_at},{$set:{used:true}});if(claim?.updated!==1)throw new Error('Autorização já utilizada.');
 const verifier=await unseal(grant.verifier,grant.owner_user_id+':'+grant.provider+':state',secrets);
 const tokens=await tokenRequest(config,{grant_type:'authorization_code',code,redirect_uri:config.callback,code_verifier:verifier});
 if(!tokens.refresh_token)throw new Error('Acesso em segundo plano não autorizado. Revogue o acesso anterior e reconecte.');
 const scopes=new Set(String(tokens.scope||'').split(' '));const required=grant.provider==='gmail'?'https://www.googleapis.com/auth/gmail.send':'Mail.Send';
 if(![...scopes].some(s=>s===required || (grant.provider==='outlook'&&s==='https://graph.microsoft.com/Mail.Send')))throw new Error('Permissão para envio não concedida.');
 const response=await fetch(grant.provider==='gmail'?'https://www.googleapis.com/oauth2/v3/userinfo':'https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName',{headers:{Authorization:'Bearer '+tokens.access_token},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error('Não foi possível identificar a conta autorizada.');
 const info=await response.json(),email=grant.provider==='gmail'?info.email:(info.mail||info.userPrincipalName);
 if(typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||/[\r\n]/.test(email))throw new Error('Conta de e-mail inválida.');
 const account=await client.asServiceRole.entities.EmailAccount.create({owner_user_id:grant.owner_user_id,provider:grant.provider,email,active:false,token_ciphertext:await seal({refresh_token:tokens.refresh_token},grant.owner_user_id+':'+grant.provider,secrets),connected_at:new Date().toISOString()});
 await client.asServiceRole.entities.EmailAccount.updateMany({owner_user_id:grant.owner_user_id,provider:grant.provider,active:true},{$set:{active:false,token_ciphertext:null}});
 await client.asServiceRole.entities.EmailAccount.update(account.id,{active:true});
 await table.deleteMany({id:grant.id,used:true});
 return {provider:grant.provider,email};
}
export async function emailAccess(client,userId,provider,secrets){
 const config=emailProvider(provider,secrets);if(!config.configured)throw new Error('OAuth de e-mail não configurado.');
 const page=await client.asServiceRole.entities.EmailAccount.filter({owner_user_id:userId,provider,active:true},{limit:2});
 if(page.items?.length!==1)throw new Error('Conecte novamente a conta de e-mail em Configurações.');
 const account=page.items[0],tokens=await unseal(account.token_ciphertext,userId+':'+provider,secrets);
 const refreshed=await tokenRequest(config,{grant_type:'refresh_token',refresh_token:tokens.refresh_token,...(provider==='outlook'?{scope:config.scope}:{})});
 if(refreshed.refresh_token&&refreshed.refresh_token!==tokens.refresh_token)await client.asServiceRole.entities.EmailAccount.updateMany({id:account.id,active:true,token_ciphertext:account.token_ciphertext},{$set:{token_ciphertext:await seal({refresh_token:refreshed.refresh_token},userId+':'+provider,secrets)}});
 return {accessToken:refreshed.access_token,email:account.email,accountId:account.id};
}
