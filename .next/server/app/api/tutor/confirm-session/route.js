"use strict";(()=>{var e={};e.id=6210,e.ids=[6210],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},83835:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>h,requestAsyncStorage:()=>f,routeModule:()=>c,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var s={};r.r(s),r.d(s,{POST:()=>u});var o=r(49303),n=r(88716),i=r(60670),a=r(6943),d=r(3370),l=r(87070),p=r(82591);async function u(e){try{let t=new p.R(process.env.RESEND_API_KEY),r=await (0,a.f)(),{data:{user:s}}=await r.auth.getUser();if(!s)return l.NextResponse.json({error:"Unauthorized"},{status:401});let{sessionId:o,meetLink:n}=await e.json(),i=(0,d.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),{data:u}=await i.from("tutoring_sessions").update({status:"confirmed",meet_link:n}).eq("id",o).select("*").single();if(!u)return l.NextResponse.json({error:"Session not found"},{status:404});let c=new Date(u.scheduled_at),f=new Date(c.getTime()-36e5),g=new Date(c.getTime()-9e5);await i.from("tutoring_sessions").update({reminder_1hr_due:f.toISOString(),reminder_15min_due:g.toISOString(),reminder_1hr_sent:!1,reminder_15min_sent:!1}).eq("id",o);let{data:m}=await i.from("profiles").select("email, display_name").eq("id",u.student_id).single(),{data:y}=await i.from("tutor_profiles").select("display_name, user_id").eq("id",u.tutor_id).single(),{data:h}=await i.from("profiles").select("email").eq("id",y?.user_id).single(),x=new Date(u.scheduled_at).toLocaleString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),b=(c.getTime()-Date.now())/36e5,w=b>1?`<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
           <p style="color:#1e40af;margin:0;font-size:14px">
             ⏰ <strong>You will receive a reminder 1 hour before your session.</strong>${b>24?" Since your session is more than 24 hours away, we'll also send you reminders as it approaches.":""}
           </p>
         </div>`:"";return await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:m?.email,subject:"✅ Your tutoring session is confirmed!",html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Your session is confirmed! 🎓</h2>
          <p>Hi ${m?.display_name?.split(" ")[0]},</p>
          <p>Great news — <strong>${y?.display_name}</strong> has confirmed your tutoring session!</p>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${u.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${u.topic}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${x}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${u.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${u.language}</p>
          </div>

          <div style="background:#22550e;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="color:white;font-weight:700;font-size:18px;margin:0 0 12px">🎥 Join Your Session</p>
            <a href="${n}" style="display:inline-block;background:white;color:#22550e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              Join Google Meet →
            </a>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0">Or copy this link: ${n}</p>
          </div>

          ${w}

          <div style="background:#fff8f0;border:1px solid #fde68a;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#92400e;margin:0;font-size:14px">
              ⚠️ <strong>Recording notice:</strong> This session will be recorded for quality assurance and dispute resolution purposes only.
            </p>
          </div>

          <p style="color:#888;font-size:13px;margin-top:24px">
            Questions? Contact us at contactinfo21342@gmail.com<br>
            — The AceForge Team
          </p>
        </div>
      `}),await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:h?.email,subject:`📋 Session confirmed — Next steps for your session with ${m?.display_name?.split(" ")[0]}`,html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Session Confirmed ✅</h2>
          <p>You've confirmed a tutoring session. Here's everything you need to know:</p>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>👤 Student:</strong> ${m?.display_name}</p>
            <p style="margin:0 0 8px"><strong>📧 Student Email:</strong> <a href="mailto:${m?.email}" style="color:#22550e">${m?.email}</a></p>
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${u.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${u.topic}</p>
            <p style="margin:0 0 8px"><strong>🎓 Grade:</strong> ${u.grade}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${x}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${u.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${u.language}</p>
            <p style="margin:0 0 8px"><strong>💰 Your Payout:</strong> $${u.tutor_payout} (paid within 24hrs after session)</p>
            <p style="margin:0"><strong>🎥 Meet Link you provided:</strong> <a href="${n}" style="color:#22550e">${n}</a></p>
          </div>

          ${u.wants_continuing?`
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#166534;margin:0">🔁 <strong>Ongoing sessions interest:</strong> This student is interested in regular sessions. Feel free to discuss a recurring schedule with them!</p>
          </div>
          `:""}

          ${u.file_urls?.length>0?`
          <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:12px;padding:16px;margin:20px 0">
            <p style="font-weight:700;margin:0 0 8px">📎 Student uploaded files (${u.file_urls.length}):</p>
            ${u.file_urls.map((e,t)=>`<p style="margin:0 0 4px"><a href="${e}" style="color:#22550e">📄 File ${t+1} →</a></p>`).join("")}
          </div>
          `:""}

          <div style="background:#1e1e2e;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:white;font-weight:700;margin:0 0 12px">📋 Your Checklist</p>
            <p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">
              ☐ Review student's topic and any uploaded files before the session<br>
              ☐ Join the Google Meet on time: ${x}<br>
              ☐ Mark session as complete in your dashboard after it ends<br>
              ☐ Payout will be sent within 24hrs after completion
            </p>
          </div>

          ${w}

          <div style="background:#fff0f0;border:1px solid #fecaca;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#991b1b;margin:0;font-size:14px">
              ⚠️ <strong>Important:</strong> All sessions must be conducted through AceForge. Do not solicit students for outside sessions. This session will be recorded.
            </p>
          </div>

          <p style="color:#888;font-size:13px;margin-top:24px">
            Questions? Contact us at contactinfo21342@gmail.com<br>
            — The AceForge Team
          </p>
        </div>
      `}),l.NextResponse.json({success:!0})}catch(e){return console.error("Confirm session error:",e),l.NextResponse.json({error:e.message},{status:500})}}let c=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/tutor/confirm-session/route",pathname:"/api/tutor/confirm-session",filename:"route",bundlePath:"app/api/tutor/confirm-session/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/tutor/confirm-session/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:m}=c,y="/api/tutor/confirm-session/route";function h(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},71615:(e,t,r)=>{var s=r(88757);r.o(s,"cookies")&&r.d(t,{cookies:function(){return s.cookies}})},33085:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return n}});let s=r(45869),o=r(6278);class n{get isEnabled(){return this._provider.isEnabled}enable(){let e=s.staticGenerationAsyncStorage.getStore();return e&&(0,o.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=s.staticGenerationAsyncStorage.getStore();return e&&(0,o.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return c},draftMode:function(){return f},headers:function(){return u}});let s=r(68996),o=r(53047),n=r(92044),i=r(72934),a=r(33085),d=r(6278),l=r(45869),p=r(54580);function u(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return o.HeadersAdapter.seal(new Headers({}));(0,d.trackDynamicDataAccessed)(t,e)}return(0,p.getExpectedRequestStore)(e).headers}function c(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.RequestCookiesAdapter.seal(new n.RequestCookies(new Headers({})));(0,d.trackDynamicDataAccessed)(t,e)}let r=(0,p.getExpectedRequestStore)(e),o=i.actionAsyncStorage.getStore();return(null==o?void 0:o.isAction)||(null==o?void 0:o.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,p.getExpectedRequestStore)("draftMode");return new a.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return n},ReadonlyHeadersError:function(){return o}});let s=r(38238);class o extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new o}}class n extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,o){if("symbol"==typeof r)return s.ReflectAdapter.get(t,r,o);let n=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===n);if(void 0!==i)return s.ReflectAdapter.get(t,i,o)},set(t,r,o,n){if("symbol"==typeof r)return s.ReflectAdapter.set(t,r,o,n);let i=r.toLowerCase(),a=Object.keys(e).find(e=>e.toLowerCase()===i);return s.ReflectAdapter.set(t,a??r,o,n)},has(t,r){if("symbol"==typeof r)return s.ReflectAdapter.has(t,r);let o=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===o);return void 0!==n&&s.ReflectAdapter.has(t,n)},deleteProperty(t,r){if("symbol"==typeof r)return s.ReflectAdapter.deleteProperty(t,r);let o=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===o);return void 0===n||s.ReflectAdapter.deleteProperty(t,n)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return o.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new n(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,s]of this.entries())e.call(t,s,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return u},ReadonlyRequestCookiesError:function(){return i},RequestCookiesAdapter:function(){return a},appendMutableCookies:function(){return p},getModifiedCookieValues:function(){return l}});let s=r(92044),o=r(38238),n=r(45869);class i extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new i}}class a{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return i.callable;default:return o.ReflectAdapter.get(e,t,r)}}})}}let d=Symbol.for("next.mutated.cookies");function l(e){let t=e[d];return t&&Array.isArray(t)&&0!==t.length?t:[]}function p(e,t){let r=l(t);if(0===r.length)return!1;let o=new s.ResponseCookies(e),n=o.getAll();for(let e of r)o.set(e);for(let e of n)o.set(e);return!0}class u{static wrap(e,t){let r=new s.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let i=[],a=new Set,l=()=>{let e=n.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),i=r.getAll().filter(e=>a.has(e.name)),t){let e=[];for(let t of i){let r=new s.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case d:return i;case"delete":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return o.ReflectAdapter.get(e,t,r)}}})}}},6943:(e,t,r)=>{r.d(t,{f:()=>n});var s=r(93452),o=r(71615);async function n(){let e=await (0,o.cookies)();return(0,s.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:s})=>e.set(t,r,s))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9276,8456,3452,5972,2591],()=>r(83835));module.exports=s})();