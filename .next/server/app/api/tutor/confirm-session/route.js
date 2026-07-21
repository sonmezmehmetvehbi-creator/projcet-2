"use strict";(()=>{var e={};e.id=6210,e.ids=[6210],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},83835:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>y,patchFetch:()=>x,requestAsyncStorage:()=>f,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var o={};r.r(o),r.d(o,{POST:()=>c});var s=r(49303),n=r(88716),i=r(60670),a=r(6943),d=r(3370),l=r(87070),p=r(82591);async function c(e){try{let t=new p.Resend(process.env.RESEND_API_KEY),r=await (0,a.f)(),{data:{user:o}}=await r.auth.getUser();if(!o)return l.NextResponse.json({error:"Unauthorized"},{status:401});let{sessionId:s,meetLink:n}=await e.json(),i=(0,d.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),{data:c}=await i.from("tutoring_sessions").update({status:"confirmed",meet_link:n}).eq("id",s).select("*").single();if(!c)return l.NextResponse.json({error:"Session not found"},{status:404});let u=new Date(c.scheduled_at),f=new Date(u.getTime()-36e5),g=new Date(u.getTime()-9e5);await i.from("tutoring_sessions").update({reminder_1hr_due:f.toISOString(),reminder_15min_due:g.toISOString(),reminder_1hr_sent:!1,reminder_15min_sent:!1}).eq("id",s);let{data:m}=await i.from("profiles").select("email, display_name").eq("id",c.student_id).single(),{data:y}=await i.from("tutor_profiles").select("display_name, user_id").eq("id",c.tutor_id).single(),{data:x}=await i.from("profiles").select("email").eq("id",y?.user_id).single(),h=new Date(c.scheduled_at).toLocaleString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}),b=e=>e.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,""),v=b(u),w=b(new Date(u.getTime()+(c.session_length??60)*6e4)),_=`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent("AceForge Tutoring: "+c.subject)}&dates=${v}/${w}&details=${encodeURIComponent("Join at: "+n)}&location=${encodeURIComponent(n)}`,A=`<a href="${_}" style="display:inline-block;background:#fff;color:#22550e;border:1px solid #22550e;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:12px">📅 Add to Google Calendar</a>`,k=(u.getTime()-Date.now())/36e5,S=k>1?`<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
           <p style="color:#1e40af;margin:0;font-size:14px">
             ⏰ <strong>You will receive a reminder 1 hour before your session.</strong>${k>24?" Since your session is more than 24 hours away, we'll also send you reminders as it approaches.":""}
           </p>
         </div>`:"";return await t.emails.send({from:"AceForge <noreply@aceforge.app>",to:m?.email,subject:"\uD83D\uDCC5 Session confirmed — Add to your calendar",html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Your session is confirmed! 🎓</h2>
          <p>Hi ${m?.display_name?.split(" ")[0]},</p>
          <p>Great news — <strong>${y?.display_name}</strong> has confirmed your tutoring session!</p>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${c.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${c.topic}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${h}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${c.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${c.language}</p>
          </div>

          <div style="background:#22550e;border-radius:12px;padding:20px;margin:20px 0;text-align:center">
            <p style="color:white;font-weight:700;font-size:18px;margin:0 0 12px">🎥 Join Your Session</p>
            <a href="${n}" style="display:inline-block;background:white;color:#22550e;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
              Join Google Meet →
            </a>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin:12px 0 0">Or copy this link: ${n}</p>
          </div>

          <div style="text-align:center">${A}</div>

          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#1e40af;margin:0;font-size:14px">⏰ <strong>You'll receive a reminder 1 hour before your session.</strong></p>
          </div>

          ${S}

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
      `}),await t.emails.send({from:"AceForge <noreply@aceforge.app>",to:x?.email,subject:"\uD83D\uDCC5 Session confirmed — Reminder details",html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Session Confirmed ✅</h2>
          <p>You've confirmed a tutoring session. Here's everything you need to know:</p>

          <div style="background:#eef6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#1e40af;margin:0;font-size:14px">💬 <strong>${m?.display_name?.split(" ")[0]}</strong> is your student for this session. Use the <strong>session chat</strong> in your dashboard to coordinate any details before you meet.</p>
          </div>

          <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
            <p style="margin:0 0 8px"><strong>👤 Student:</strong> ${m?.display_name}</p>
            <p style="margin:0 0 8px"><strong>📧 Student Email:</strong> <a href="mailto:${m?.email}" style="color:#22550e">${m?.email}</a></p>
            <p style="margin:0 0 8px"><strong>📚 Subject:</strong> ${c.subject}</p>
            <p style="margin:0 0 8px"><strong>📝 Topic:</strong> ${c.topic}</p>
            <p style="margin:0 0 8px"><strong>🎓 Grade:</strong> ${c.grade}</p>
            <p style="margin:0 0 8px"><strong>📅 Date & Time:</strong> ${h}</p>
            <p style="margin:0 0 8px"><strong>⏱ Duration:</strong> ${c.session_length} minutes</p>
            <p style="margin:0 0 8px"><strong>🌐 Language:</strong> ${c.language}</p>
            <p style="margin:0 0 8px"><strong>💰 Your Payout:</strong> $${c.tutor_payout} (paid within 24hrs after session)</p>
            <p style="margin:0"><strong>🎥 Meet Link you provided:</strong> <a href="${n}" style="color:#22550e">${n}</a></p>
          </div>

          ${c.wants_continuing?`
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin:20px 0">
            <p style="color:#166534;margin:0">🔁 <strong>Ongoing sessions interest:</strong> This student is interested in regular sessions. Feel free to discuss a recurring schedule with them!</p>
          </div>
          `:""}

          ${c.file_urls?.length>0?`
          <div style="background:#f8f8f8;border:1px solid #e0e0e0;border-radius:12px;padding:16px;margin:20px 0">
            <p style="font-weight:700;margin:0 0 8px">📎 Student uploaded files (${c.file_urls.length}):</p>
            ${c.file_urls.map((e,t)=>`<p style="margin:0 0 4px"><a href="${e}" style="color:#22550e">📄 File ${t+1} →</a></p>`).join("")}
          </div>
          `:""}

          <div style="background:#1e1e2e;border-radius:12px;padding:20px;margin:20px 0">
            <p style="color:white;font-weight:700;margin:0 0 12px">📋 Your Checklist</p>
            <p style="color:rgba(255,255,255,0.8);margin:0 0 8px;font-size:14px">
              ☐ Review student's topic and any uploaded files before the session<br>
              ☐ Join the Google Meet on time: ${h}<br>
              ☐ Mark session as complete in your dashboard after it ends<br>
              ☐ Payout will be sent within 24hrs after completion
            </p>
          </div>

          <div style="text-align:center">${A}</div>

          ${S}

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
      `}),l.NextResponse.json({success:!0})}catch(e){return console.error("Confirm session error:",e),l.NextResponse.json({error:e.message},{status:500})}}let u=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/tutor/confirm-session/route",pathname:"/api/tutor/confirm-session",filename:"route",bundlePath:"app/api/tutor/confirm-session/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/tutor/confirm-session/route.ts",nextConfigOutput:"",userland:o}),{requestAsyncStorage:f,staticGenerationAsyncStorage:g,serverHooks:m}=u,y="/api/tutor/confirm-session/route";function x(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},71615:(e,t,r)=>{var o=r(88757);r.o(o,"cookies")&&r.d(t,{cookies:function(){return o.cookies}})},33085:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return n}});let o=r(45869),s=r(6278);class n{get isEnabled(){return this._provider.isEnabled}enable(){let e=o.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=o.staticGenerationAsyncStorage.getStore();return e&&(0,s.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return u},draftMode:function(){return f},headers:function(){return c}});let o=r(68996),s=r(53047),n=r(92044),i=r(72934),a=r(33085),d=r(6278),l=r(45869),p=r(54580);function c(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.HeadersAdapter.seal(new Headers({}));(0,d.trackDynamicDataAccessed)(t,e)}return(0,p.getExpectedRequestStore)(e).headers}function u(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return o.RequestCookiesAdapter.seal(new n.RequestCookies(new Headers({})));(0,d.trackDynamicDataAccessed)(t,e)}let r=(0,p.getExpectedRequestStore)(e),s=i.actionAsyncStorage.getStore();return(null==s?void 0:s.isAction)||(null==s?void 0:s.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,p.getExpectedRequestStore)("draftMode");return new a.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return n},ReadonlyHeadersError:function(){return s}});let o=r(38238);class s extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new s}}class n extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,s){if("symbol"==typeof r)return o.ReflectAdapter.get(t,r,s);let n=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===n);if(void 0!==i)return o.ReflectAdapter.get(t,i,s)},set(t,r,s,n){if("symbol"==typeof r)return o.ReflectAdapter.set(t,r,s,n);let i=r.toLowerCase(),a=Object.keys(e).find(e=>e.toLowerCase()===i);return o.ReflectAdapter.set(t,a??r,s,n)},has(t,r){if("symbol"==typeof r)return o.ReflectAdapter.has(t,r);let s=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0!==n&&o.ReflectAdapter.has(t,n)},deleteProperty(t,r){if("symbol"==typeof r)return o.ReflectAdapter.deleteProperty(t,r);let s=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===s);return void 0===n||o.ReflectAdapter.deleteProperty(t,n)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return s.callable;default:return o.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new n(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,o]of this.entries())e.call(t,o,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return c},ReadonlyRequestCookiesError:function(){return i},RequestCookiesAdapter:function(){return a},appendMutableCookies:function(){return p},getModifiedCookieValues:function(){return l}});let o=r(92044),s=r(38238),n=r(45869);class i extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new i}}class a{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return i.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}}let d=Symbol.for("next.mutated.cookies");function l(e){let t=e[d];return t&&Array.isArray(t)&&0!==t.length?t:[]}function p(e,t){let r=l(t);if(0===r.length)return!1;let s=new o.ResponseCookies(e),n=s.getAll();for(let e of r)s.set(e);for(let e of n)s.set(e);return!0}class c{static wrap(e,t){let r=new o.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let i=[],a=new Set,l=()=>{let e=n.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),i=r.getAll().filter(e=>a.has(e.name)),t){let e=[];for(let t of i){let r=new o.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case d:return i;case"delete":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return s.ReflectAdapter.get(e,t,r)}}})}}},6943:(e,t,r)=>{r.d(t,{f:()=>n});var o=r(93452),s=r(71615);async function n(){let e=await (0,s.cookies)();return(0,o.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:o})=>e.set(t,r,o))}catch{}}}})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[9276,8456,3452,5972,2591],()=>r(83835));module.exports=o})();