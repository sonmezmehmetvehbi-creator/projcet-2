"use strict";(()=>{var e={};e.id=3652,e.ids=[3652],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},52272:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>m,patchFetch:()=>x,requestAsyncStorage:()=>c,routeModule:()=>p,serverHooks:()=>f,staticGenerationAsyncStorage:()=>u});var r={};o.r(r),o.d(r,{POST:()=>l});var i=o(49303),s=o(88716),a=o(60670),n=o(6943),d=o(87070);async function l(e){try{let t=await (0,n.f)(),{data:{user:o}}=await t.auth.getUser();if(!o)return d.NextResponse.json({error:"Unauthorized"},{status:401});let{sessionId:r}=await e.json(),{data:i}=await t.from("sessions").select("*").eq("id",r).eq("user_id",o.id).single();if(!i)return d.NextResponse.json({error:"Session not found"},{status:404});await t.from("sessions").update({pdf_downloaded:!0,pdf_downloaded_at:new Date().toISOString()}).eq("id",r);let s=function(e){let t="questions"===e.output_type,o=e.content?.questions??[],r=e.content?.worksheet;if(t){let t=o.map((e,t)=>`
      <div class="question">
        <p class="q-number">Question ${t+1} — ${"mc"===e.type?"Multiple Choice":"Free Response"}</p>
        <p class="q-text">${e.question}</p>
        ${"mc"===e.type?`
          <div class="options">
            ${e.options.map(e=>`<div class="option">${e}</div>`).join("")}
          </div>
        `:`
          <div class="answer-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        `}
      </div>
    `).join(""),r=o.map((e,t)=>`
      <div class="answer-item">
        <span class="answer-num">Q${t+1}:</span>
        ${"mc"===e.type?`<span><strong>${e.correctAnswer}</strong> — ${e.explanation}</span>`:`<span>${e.modelAnswer}</span>`}
      </div>
    `).join("");return`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a1a14; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #22550e; padding-bottom: 20px; margin-bottom: 32px; }
  .app-name { font-size: 14px; color: #22550e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .title { font-size: 28px; font-weight: bold; color: #1a1a14; margin-bottom: 4px; }
  .meta { font-size: 14px; color: #6b6b58; }
  .question { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb; }
  .q-number { font-size: 11px; font-weight: bold; color: #22550e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
  .q-text { font-size: 16px; line-height: 1.6; margin-bottom: 12px; font-weight: 600; }
  .options { display: flex; flex-direction: column; gap: 8px; }
  .option { padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; }
  .answer-lines { margin-top: 8px; }
  .line { border-bottom: 1px solid #d1d5db; margin-bottom: 16px; height: 24px; }
  .answer-key { margin-top: 48px; padding-top: 32px; border-top: 3px solid #22550e; }
  .answer-key h2 { font-size: 22px; margin-bottom: 20px; color: #22550e; }
  .answer-item { display: flex; gap: 12px; margin-bottom: 16px; font-size: 14px; line-height: 1.6; padding: 12px; background: #f0f7ea; border-radius: 6px; }
  .answer-num { font-weight: bold; color: #22550e; min-width: 32px; flex-shrink: 0; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">AceForge</div>
    <div class="title">${e.topic}</div>
    <div class="meta">${e.subject} \xb7 ${e.grade} \xb7 ${o.length} Questions \xb7 ${new Date(e.created_at).toLocaleDateString()}</div>
  </div>
  ${t}
  <div class="answer-key">
    <h2>Answer Key</h2>
    ${r}
  </div>
</body>
</html>`}let i=r?.steps??[],s=r?.introduction?.vocabulary??[],a=r?.summary?.bullets??[],n=r?.practiceQuestions??[];return`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; color: #1a1a14; padding: 48px; max-width: 800px; margin: 0 auto; }
  .header { border-bottom: 3px solid #22550e; padding-bottom: 20px; margin-bottom: 32px; }
  .app-name { font-size: 14px; color: #22550e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
  .title { font-size: 28px; font-weight: bold; margin-bottom: 4px; }
  .meta { font-size: 14px; color: #6b6b58; }
  .section { margin-bottom: 36px; }
  .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .section-num { width: 32px; height: 32px; border-radius: 50%; background: #22550e; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0; }
  .section-title { font-size: 20px; font-weight: bold; color: #22550e; }
  p { font-size: 15px; line-height: 1.8; margin-bottom: 12px; }
  .vocab-item { display: flex; gap: 12px; padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; font-size: 14px; }
  .vocab-term { font-weight: bold; color: #22550e; min-width: 120px; }
  .step { margin-bottom: 24px; padding: 16px; border-left: 3px solid #22550e; background: #f9fafb; border-radius: 0 8px 8px 0; }
  .step-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
  .visual-box { margin: 12px 0; padding: 12px; border: 1px dashed #22550e; border-radius: 6px; font-style: italic; font-size: 13px; color: #6b6b58; }
  .takeaway { padding: 8px 12px; background: #fef3c7; border-radius: 6px; font-size: 13px; margin-top: 8px; }
  .bullet { display: flex; gap: 8px; font-size: 14px; line-height: 1.7; margin-bottom: 8px; }
  .bullet-check { color: #22550e; font-weight: bold; }
  .practice-q { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e5e7eb; }
  .q-num { font-size: 11px; font-weight: bold; color: #22550e; text-transform: uppercase; margin-bottom: 6px; }
  .options { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
  .option { padding: 6px 10px; border: 1px solid #d1d5db; border-radius: 4px; font-size: 13px; }
  .answer-lines .line { border-bottom: 1px solid #d1d5db; margin-bottom: 14px; height: 20px; }
  .answer-key { margin-top: 48px; padding-top: 24px; border-top: 3px solid #22550e; }
  .answer-key h2 { font-size: 20px; color: #22550e; margin-bottom: 16px; }
  .answer-item { padding: 10px 12px; background: #f0f7ea; border-radius: 6px; margin-bottom: 10px; font-size: 13px; line-height: 1.6; }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">AceForge Worksheet</div>
    <div class="title">${e.topic}</div>
    <div class="meta">${e.subject} \xb7 ${e.grade} \xb7 ${new Date(e.created_at).toLocaleDateString()}</div>
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">1</div>
      <div class="section-title">Introduction</div>
    </div>
    <p>${r?.introduction?.text??""}</p>
    ${s.map(e=>`<div class="vocab-item"><span class="vocab-term">${e.term}</span><span>${e.definition}</span></div>`).join("")}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">2</div>
      <div class="section-title">Step-by-Step Explanation</div>
    </div>
    ${i.map((e,t)=>`
      <div class="step">
        <div class="step-title">Step ${t+1}: ${e.title}</div>
        <p>${e.explanation}</p>
        <div class="visual-box">📊 Visual: ${e.visualDescription}</div>
        <div class="takeaway">💡 Key takeaway: ${e.keyTakeaway}</div>
      </div>
    `).join("")}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">3</div>
      <div class="section-title">Summary</div>
    </div>
    ${a.map(e=>`<div class="bullet"><span class="bullet-check">✓</span><span>${e}</span></div>`).join("")}
  </div>

  <div class="section">
    <div class="section-header">
      <div class="section-num">4</div>
      <div class="section-title">Practice Questions</div>
    </div>
    ${n.map((e,t)=>`
      <div class="practice-q">
        <div class="q-num">Question ${t+1} \xb7 ${"mc"===e.type?"Multiple Choice":"Free Response"}</div>
        <p style="font-weight:600">${e.question}</p>
        ${"mc"===e.type?`
          <div class="options">${e.options.map(e=>`<div class="option">${e}</div>`).join("")}</div>
        `:`
          <div class="answer-lines"><div class="line"></div><div class="line"></div><div class="line"></div></div>
        `}
      </div>
    `).join("")}
  </div>

  <div class="answer-key">
    <h2>Answer Key</h2>
    ${n.map((e,t)=>`
      <div class="answer-item">
        <strong>Q${t+1}:</strong> ${"mc"===e.type?`${e.correctAnswer} — ${e.explanation}`:e.modelAnswer}
      </div>
    `).join("")}
  </div>
</body>
</html>`}(i);return new d.NextResponse(s,{headers:{"Content-Type":"text/html","X-Session-Topic":encodeURIComponent(i.topic)}})}catch(e){return d.NextResponse.json({error:e.message},{status:500})}}let p=new i.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/export-pdf/route",pathname:"/api/export-pdf",filename:"route",bundlePath:"app/api/export-pdf/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/export-pdf/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:u,serverHooks:f}=p,m="/api/export-pdf/route";function x(){return(0,a.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:u})}},71615:(e,t,o)=>{var r=o(88757);o.o(r,"cookies")&&o.d(t,{cookies:function(){return r.cookies}})},33085:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return s}});let r=o(45869),i=o(6278);class s{get isEnabled(){return this._provider.isEnabled}enable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,i.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,i.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{cookies:function(){return u},draftMode:function(){return f},headers:function(){return c}});let r=o(68996),i=o(53047),s=o(92044),a=o(72934),n=o(33085),d=o(6278),l=o(45869),p=o(54580);function c(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return i.HeadersAdapter.seal(new Headers({}));(0,d.trackDynamicDataAccessed)(t,e)}return(0,p.getExpectedRequestStore)(e).headers}function u(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return r.RequestCookiesAdapter.seal(new s.RequestCookies(new Headers({})));(0,d.trackDynamicDataAccessed)(t,e)}let o=(0,p.getExpectedRequestStore)(e),i=a.actionAsyncStorage.getStore();return(null==i?void 0:i.isAction)||(null==i?void 0:i.isAppRoute)?o.mutableCookies:o.cookies}function f(){let e=(0,p.getExpectedRequestStore)("draftMode");return new n.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{HeadersAdapter:function(){return s},ReadonlyHeadersError:function(){return i}});let r=o(38238);class i extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new i}}class s extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,o,i){if("symbol"==typeof o)return r.ReflectAdapter.get(t,o,i);let s=o.toLowerCase(),a=Object.keys(e).find(e=>e.toLowerCase()===s);if(void 0!==a)return r.ReflectAdapter.get(t,a,i)},set(t,o,i,s){if("symbol"==typeof o)return r.ReflectAdapter.set(t,o,i,s);let a=o.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===a);return r.ReflectAdapter.set(t,n??o,i,s)},has(t,o){if("symbol"==typeof o)return r.ReflectAdapter.has(t,o);let i=o.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===i);return void 0!==s&&r.ReflectAdapter.has(t,s)},deleteProperty(t,o){if("symbol"==typeof o)return r.ReflectAdapter.deleteProperty(t,o);let i=o.toLowerCase(),s=Object.keys(e).find(e=>e.toLowerCase()===i);return void 0===s||r.ReflectAdapter.deleteProperty(t,s)}})}static seal(e){return new Proxy(e,{get(e,t,o){switch(t){case"append":case"delete":case"set":return i.callable;default:return r.ReflectAdapter.get(e,t,o)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new s(e)}append(e,t){let o=this.headers[e];"string"==typeof o?this.headers[e]=[o,t]:Array.isArray(o)?o.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[o,r]of this.entries())e.call(t,r,o,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),o=this.get(t);yield[t,o]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,o)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var o in t)Object.defineProperty(e,o,{enumerable:!0,get:t[o]})}(t,{MutableRequestCookiesAdapter:function(){return c},ReadonlyRequestCookiesError:function(){return a},RequestCookiesAdapter:function(){return n},appendMutableCookies:function(){return p},getModifiedCookieValues:function(){return l}});let r=o(92044),i=o(38238),s=o(45869);class a extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new a}}class n{static seal(e){return new Proxy(e,{get(e,t,o){switch(t){case"clear":case"delete":case"set":return a.callable;default:return i.ReflectAdapter.get(e,t,o)}}})}}let d=Symbol.for("next.mutated.cookies");function l(e){let t=e[d];return t&&Array.isArray(t)&&0!==t.length?t:[]}function p(e,t){let o=l(t);if(0===o.length)return!1;let i=new r.ResponseCookies(e),s=i.getAll();for(let e of o)i.set(e);for(let e of s)i.set(e);return!0}class c{static wrap(e,t){let o=new r.ResponseCookies(new Headers);for(let t of e.getAll())o.set(t);let a=[],n=new Set,l=()=>{let e=s.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),a=o.getAll().filter(e=>n.has(e.name)),t){let e=[];for(let t of a){let o=new r.ResponseCookies(new Headers);o.set(t),e.push(o.toString())}t(e)}};return new Proxy(o,{get(e,t,o){switch(t){case d:return a;case"delete":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return i.ReflectAdapter.get(e,t,o)}}})}}},6943:(e,t,o)=>{o.d(t,{f:()=>s});var r=o(93452),i=o(71615);async function s(){let e=await (0,i.cookies)();return(0,r.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:o,options:r})=>e.set(t,o,r))}catch{}}}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),r=t.X(0,[9276,8456,3452,5972],()=>o(52272));module.exports=r})();