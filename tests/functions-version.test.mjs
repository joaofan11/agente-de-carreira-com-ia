import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@base44/sdk';
import axios from 'axios';
import { resolveFunctionsVersion } from '../src/lib/functionsVersion.js';

test('Base44 embedded preview uses draft functions even when its build declares prod',()=>{
  assert.equal(resolveFunctionsVersion({configuredVersion:'prod',embedded:true,referrer:'https://app.base44.com/apps/synthetic/editor/preview'}),'preview');
  assert.equal(resolveFunctionsVersion({embedded:true,referrer:'https://app.base44.com/'}),'preview');
});
test('browser ancestor origin identifies preview when referrer is suppressed',()=>{
  assert.equal(resolveFunctionsVersion({configuredVersion:'prod',embedded:true,referrer:'',ancestorOrigins:['https://app.base44.com']}),'preview');
});
test('standalone public app stays on prod even after navigation from Base44',()=>{
  assert.equal(resolveFunctionsVersion(),'prod');
  assert.equal(resolveFunctionsVersion({embedded:false,referrer:'https://app.base44.com/'}),'prod');
  assert.equal(resolveFunctionsVersion({configuredVersion:'prod'}),'prod');
});
test('untrusted iframe or lookalike origin cannot select the draft',()=>{
  for(const referrer of ['https://app.base44.com.evil.invalid/','https://evil.invalid/?from=https://app.base44.com','http://app.base44.com/','not-a-url']){
    assert.equal(resolveFunctionsVersion({configuredVersion:'prod',embedded:true,referrer}),'prod');
  }
  assert.equal(resolveFunctionsVersion({embedded:true,ancestorOrigins:['https://untrusted.invalid']}),'prod');
});
test('explicit draft configuration still supports standalone preview and unknown versions fail closed',()=>{
  assert.equal(resolveFunctionsVersion({configuredVersion:'preview'}),'preview');
  assert.equal(resolveFunctionsVersion({configuredVersion:'untrusted'}),'prod');
});
test('actual installed SDK sends resolved preview/prod header without changing app, auth or server',async()=>{
  const previousAdapter=axios.defaults.adapter;
  const calls=[];
  axios.defaults.adapter=async config=>{calls.push({url:config.baseURL+config.url,headers:new Headers(config.headers.toJSON())});return {status:200,statusText:'OK',headers:{},data:{ok:true},config};};
  try {
    for(const embedded of [true,false]){
      const client=createClient({appId:'synthetic-app',token:'synthetic-test-token',serverUrl:'https://example.invalid',functionsVersion:resolveFunctionsVersion({configuredVersion:'prod',embedded,referrer:'https://app.base44.com/'}),analytics:{enabled:false}});
      try { await client.functions.invoke('manageCandidateDocument',{action:'upload'}); }
      finally { client.cleanup(); }
    }
    assert.deepEqual(calls.map(c=>c.headers.get('Base44-Functions-Version')),['preview','prod']);
    assert.ok(calls.every(c=>c.headers.get('Authorization')==='Bearer synthetic-test-token'));
    assert.ok(calls.every(c=>c.headers.get('X-App-Id')==='synthetic-app'));
    assert.ok(calls.every(c=>c.url==='https://example.invalid/api/apps/synthetic-app/functions/manageCandidateDocument'));
  } finally { axios.defaults.adapter=previousAdapter; }
});
