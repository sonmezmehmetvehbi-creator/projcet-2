"use strict";(()=>{var e={};e.id=341,e.ids=[341],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},50093:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>m,patchFetch:()=>g,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>h,staticGenerationAsyncStorage:()=>f});var s={};r.r(s),r.d(s,{POST:()=>u});var a=r(49303),o=r(88716),i=r(60670),n=r(6943),c=r(87070);let l=new(r(54214)).ZP({apiKey:process.env.OPENAI_API_KEY});async function u(e){try{let t;let r=await (0,n.f)(),{data:{user:s}}=await r.auth.getUser();if(!s)return c.NextResponse.json({error:"Unauthorized"},{status:401});let{module:a,questionCount:o,difficulty:i}=await e.json(),{data:u}=await r.from("profiles").select("is_premium").eq("id",s.id).single();if(!u?.is_premium){let e=new Date().toISOString().split("T")[0],{data:t}=await r.from("daily_usage").select("sat").eq("user_id",s.id).eq("date",e).single();if((t?.sat??0)>=1)return c.NextResponse.json({error:"sat_limit_reached"},{status:429})}let d="math_no_calc"===a||"math_calc"===a,p="math_calc"===a,f={easy:"Easy (College Board difficulty 1-2): straightforward, single-concept, one clear path to the answer",medium:"Medium (College Board difficulty 3): requires applying a concept or interpreting information, 1-2 steps",hard:"Hard (College Board difficulty 4-5): multi-step reasoning, synthesis of multiple concepts, sophisticated distractors"},h=`You are an expert SAT question writer with 15+ years of experience writing for College Board. You have deep knowledge of the SAT format, question types, difficulty calibration, and distractor construction.

Your questions must be INDISTINGUISHABLE from real College Board SAT questions in terms of:
- Wording style (precise, unambiguous, formal but accessible)
- Distractor quality (each wrong answer targets a specific, common student error)
- Difficulty calibration (exactly matching CB's 1-5 scale)
- Question type variety (matching real SAT module distribution)
- Context and scenario realism

DIFFICULTY: ${f[i]??f.medium}

${d?`
SAT MATH RULES:
- Calculator allowed: ${p?"YES":"NO — questions must be solvable by hand in ~90 seconds"}
- Every question must present a specific, solvable math problem — never ask for definitions
- Include a mix of: word problems with real context (science, economics, social studies), pure math, data interpretation
- Question types to include: linear equations, systems, quadratics, functions, ratios/proportions, percentages, statistics, geometry, trigonometry (calc only at hard)
- Distractors must be: results of specific wrong approaches (e.g. sign error, wrong operation, misread), NOT random numbers
- All answer choices must be distinct and non-overlapping
- Word problems must give ALL necessary information in the stem
- For hard questions: require multiple steps, function composition, or system solving
- Never use LaTeX — write math in plain text: x^2, sqrt(x), x/y
- Answer choices for MC: exactly 4 options labeled A, B, C, D
- Some questions should be student-produced response style (grid-in) — for these, type is "grid" and there are no options, just the numeric answer
`:`
SAT READING & WRITING RULES:
- EVERY question must include a passage of 3-6 sentences before the question
- Passage topics: literature excerpts, social science, natural science, humanities — rotate between them
- Question types to include (rotate through all):
  * Words in Context: "As used in line X, [word] most nearly means..."
  * Main Idea/Purpose: "The main purpose of the passage is to..."
  * Evidence: "Which choice best supports the claim that..."
  * Inference: "Based on the passage, it can be inferred that..."
  * Transition/Rhetorical: "Which choice most effectively transitions..."
  * Grammar/Usage: sentence with blank, choose grammatically correct option
  * Vocabulary: choose the most precise word for the context
- Passages must be well-written, content-rich, and feel like real academic text
- Distractors must be: too broad, too narrow, opposite meaning, or plausible but unsupported by the text
- Never ask questions answerable without reading the passage
`}

FORMATTING: Always respond in valid JSON only — no markdown, no preamble, no backticks.`,m="";m=d?`Generate ${o} SAT Math questions for the ${p?"Calculator":"No-Calculator"} module at ${i} difficulty.

Mix question types naturally — word problems, pure math, data interpretation. Include 1-2 grid-in (student-produced response) questions if questionCount >= 10.

For each MC question:
- id (number)
- type: "mc"
- calculator: ${p}
- question (string) — the full question stem with all necessary information
- options (array of exactly 4 strings: ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer ("A", "B", "C", or "D")
- explanation (string) — 4-6 sentences: state the correct approach step by step, show the key calculation, identify what error each main distractor represents, end with a tip for similar questions
- topic (string) — specific math skill e.g. "Linear equations", "Quadratic functions", "Data analysis"
- difficulty_rating (number 1-5 matching CB scale)

For each grid-in question:
- id (number)
- type: "grid"
- calculator: ${p}
- question (string)
- correctAnswer (string) — the numeric answer
- explanation (string) — same quality as MC
- topic (string)
- difficulty_rating (number 1-5)

Return JSON: { "questions": [...] }`:`Generate ${o} SAT Reading and Writing questions at ${i} difficulty.

Rotate through different question types and passage topics. Each question must have its own unique passage.

For each question:
- id (number)
- type: "mc"
- passage (string) — 3-6 sentences of well-written, content-rich text. Must feel like real academic writing. Include specific details, data, or quotes where appropriate.
- question (string) — ONLY the question stem itself, nothing else. Example: "As used in line 2, 'documented' most nearly means..." — do NOT include the answer or explanation in this field
- options (array of exactly 4 strings: ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer ("A", "B", "C", or "D")
- explanation (string) — 4-6 sentences: identify the correct answer and cite specific evidence from the passage, explain why each main distractor fails (too broad/narrow/unsupported/opposite), end with a strategy tip
- question_type (string) — one of: "Words in Context", "Main Idea", "Evidence", "Inference", "Transition", "Grammar", "Vocabulary"
- topic (string) — passage topic e.g. "Natural science", "Social studies", "Literature", "Humanities"
- difficulty_rating (number 1-5)

Return JSON: { "questions": [...] }`;let g=((await l.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:h},{role:"user",content:m}],temperature:.7,max_tokens:6e3})).choices[0].message.content??"{}").replace(/```json|```/g,"").trim();g=g.replace(/[\u0000-\u001F\u007F-\u009F]/g," ").trim();try{t=JSON.parse(g)}catch{g=g.replace(/\\(?!["\\/bfnrtu])/g,"\\\\");try{t=JSON.parse(g)}catch{throw Error("Failed to parse AI response. Please try again.")}}let{data:y,error:w}=await r.from("sessions").insert({user_id:s.id,subject:"SAT",grade:"college",topic:"math_no_calc"===a?"SAT Math (No Calculator)":"math_calc"===a?"SAT Math (Calculator)":"SAT Reading & Writing",output_type:"questions",content:t,difficulty:i,is_sat:!0,sat_module:a}).select("id").single();if(w)throw w;if(!u?.is_premium){let e=new Date().toISOString().split("T")[0],{data:t}=await r.from("daily_usage").select("id, sat").eq("user_id",s.id).eq("date",e).single();t?await r.from("daily_usage").update({sat:(t.sat??0)+1}).eq("id",t.id):await r.from("daily_usage").insert({user_id:s.id,date:e,sat:1})}return c.NextResponse.json({sessionId:y.id})}catch(e){return console.error("SAT generate error:",e),c.NextResponse.json({error:e.message||"Generation failed"},{status:500})}}let d=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/sat-generate/route",pathname:"/api/sat-generate",filename:"route",bundlePath:"app/api/sat-generate/route"},resolvedPagePath:"/workspaces/projcet-2/src/app/api/sat-generate/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:p,staticGenerationAsyncStorage:f,serverHooks:h}=d,m="/api/sat-generate/route";function g(){return(0,i.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:f})}},71615:(e,t,r)=>{var s=r(88757);r.o(s,"cookies")&&r.d(t,{cookies:function(){return s.cookies}})},33085:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return o}});let s=r(45869),a=r(6278);class o{get isEnabled(){return this._provider.isEnabled}enable(){let e=s.staticGenerationAsyncStorage.getStore();return e&&(0,a.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=s.staticGenerationAsyncStorage.getStore();return e&&(0,a.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{cookies:function(){return p},draftMode:function(){return f},headers:function(){return d}});let s=r(68996),a=r(53047),o=r(92044),i=r(72934),n=r(33085),c=r(6278),l=r(45869),u=r(54580);function d(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return a.HeadersAdapter.seal(new Headers({}));(0,c.trackDynamicDataAccessed)(t,e)}return(0,u.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return s.RequestCookiesAdapter.seal(new o.RequestCookies(new Headers({})));(0,c.trackDynamicDataAccessed)(t,e)}let r=(0,u.getExpectedRequestStore)(e),a=i.actionAsyncStorage.getStore();return(null==a?void 0:a.isAction)||(null==a?void 0:a.isAppRoute)?r.mutableCookies:r.cookies}function f(){let e=(0,u.getExpectedRequestStore)("draftMode");return new n.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{HeadersAdapter:function(){return o},ReadonlyHeadersError:function(){return a}});let s=r(38238);class a extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new a}}class o extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,r,a){if("symbol"==typeof r)return s.ReflectAdapter.get(t,r,a);let o=r.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);if(void 0!==i)return s.ReflectAdapter.get(t,i,a)},set(t,r,a,o){if("symbol"==typeof r)return s.ReflectAdapter.set(t,r,a,o);let i=r.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===i);return s.ReflectAdapter.set(t,n??r,a,o)},has(t,r){if("symbol"==typeof r)return s.ReflectAdapter.has(t,r);let a=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===a);return void 0!==o&&s.ReflectAdapter.has(t,o)},deleteProperty(t,r){if("symbol"==typeof r)return s.ReflectAdapter.deleteProperty(t,r);let a=r.toLowerCase(),o=Object.keys(e).find(e=>e.toLowerCase()===a);return void 0===o||s.ReflectAdapter.deleteProperty(t,o)}})}static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"append":case"delete":case"set":return a.callable;default:return s.ReflectAdapter.get(e,t,r)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new o(e)}append(e,t){let r=this.headers[e];"string"==typeof r?this.headers[e]=[r,t]:Array.isArray(r)?r.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[r,s]of this.entries())e.call(t,s,r,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),r=this.get(t);yield[t,r]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,r)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var r in t)Object.defineProperty(e,r,{enumerable:!0,get:t[r]})}(t,{MutableRequestCookiesAdapter:function(){return d},ReadonlyRequestCookiesError:function(){return i},RequestCookiesAdapter:function(){return n},appendMutableCookies:function(){return u},getModifiedCookieValues:function(){return l}});let s=r(92044),a=r(38238),o=r(45869);class i extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new i}}class n{static seal(e){return new Proxy(e,{get(e,t,r){switch(t){case"clear":case"delete":case"set":return i.callable;default:return a.ReflectAdapter.get(e,t,r)}}})}}let c=Symbol.for("next.mutated.cookies");function l(e){let t=e[c];return t&&Array.isArray(t)&&0!==t.length?t:[]}function u(e,t){let r=l(t);if(0===r.length)return!1;let a=new s.ResponseCookies(e),o=a.getAll();for(let e of r)a.set(e);for(let e of o)a.set(e);return!0}class d{static wrap(e,t){let r=new s.ResponseCookies(new Headers);for(let t of e.getAll())r.set(t);let i=[],n=new Set,l=()=>{let e=o.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),i=r.getAll().filter(e=>n.has(e.name)),t){let e=[];for(let t of i){let r=new s.ResponseCookies(new Headers);r.set(t),e.push(r.toString())}t(e)}};return new Proxy(r,{get(e,t,r){switch(t){case c:return i;case"delete":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){n.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return a.ReflectAdapter.get(e,t,r)}}})}}},6943:(e,t,r)=>{r.d(t,{f:()=>o});var s=r(93452),a=r(71615);async function o(){let e=await (0,a.cookies)();return(0,s.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:r,options:s})=>e.set(t,r,s))}catch{}}}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9276,8456,3452,5972,4214],()=>r(50093));module.exports=s})();