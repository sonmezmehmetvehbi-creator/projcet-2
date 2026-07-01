"use strict";(()=>{var e={};e.id=341,e.ids=[341],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},58534:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>f,patchFetch:()=>y,requestAsyncStorage:()=>m,routeModule:()=>d,serverHooks:()=>g,staticGenerationAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{POST:()=>p});var i=r(49303),a=r(88716),o=r(60670),n=r(6943),c=r(26830),u=r(87070),l=r(54214);async function p(e){let t=new l.ZP({apiKey:process.env.OPENAI_API_KEY});try{let r;let s=await (0,n.f)(),{data:{user:i}}=await s.auth.getUser();if(!i)return u.NextResponse.json({error:"Unauthorized"},{status:401});let{module:a,questionCount:o,difficulty:l}=await e.json(),p=await (0,c.$o)(s,i.id,"sat");if(!p.allowed)return u.NextResponse.json({error:"Daily limit reached",limitReached:!0,isPremium:p.isPremium,bonusRemaining:p.bonus},{status:429});let d="math_no_calc"===a||"math_calc"===a,m="math_calc"===a,h={easy:"Easy (College Board difficulty 1-2): straightforward, single-concept, one clear path to the answer",medium:"Medium (College Board difficulty 3): requires applying a concept or interpreting information, 1-2 steps",hard:"Hard (College Board difficulty 4-5): multi-step reasoning, synthesis of multiple concepts, sophisticated distractors"},g=`You are an expert SAT question writer with 15+ years of experience writing for College Board. You have deep knowledge of the SAT format, question types, difficulty calibration, and distractor construction.

Your questions must be INDISTINGUISHABLE from real College Board SAT questions in terms of:
- Wording style (precise, unambiguous, formal but accessible)
- Distractor quality (each wrong answer targets a specific, common student error)
- Difficulty calibration (exactly matching CB's 1-5 scale)
- Question type variety (matching real SAT module distribution)
- Context and scenario realism

DIFFICULTY: ${h[l]??h.medium}

${d?`
SAT MATH RULES:
- Calculator allowed: ${m?"YES":"NO — questions must be solvable by hand in ~90 seconds"}
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

FORMATTING: Always respond in valid JSON only — no markdown, no preamble, no backticks.`,f="";f=d?`Generate ${o} SAT Math questions for the ${m?"Calculator":"No-Calculator"} module at ${l} difficulty.

Mix question types naturally — word problems, pure math, data interpretation. Include 1-2 grid-in (student-produced response) questions if questionCount >= 10.

For each MC question:
- id (number)
- type: "mc"
- calculator: ${m}
- question (string) — the full question stem with all necessary information
- options (array of exactly 4 strings: ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer ("A", "B", "C", or "D")
- explanation (string) — 4-6 sentences: state the correct approach step by step, show the key calculation, identify what error each main distractor represents, end with a tip for similar questions
- topic (string) — specific math skill e.g. "Linear equations", "Quadratic functions", "Data analysis"
- difficulty_rating (number 1-5 matching CB scale)

For each grid-in question:
- id (number)
- type: "grid"
- calculator: ${m}
- question (string)
- correctAnswer (string) — the numeric answer
- explanation (string) — same quality as MC
- topic (string)
- difficulty_rating (number 1-5)

Return JSON: { "questions": [...] }`:`Generate ${o} SAT Reading and Writing questions at ${l} difficulty.

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

Return JSON: { "questions": [...] }`;let y=((await t.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:g},{role:"user",content:f}],temperature:.7,max_tokens:6e3})).choices[0].message.content??"{}").replace(/```json|```/g,"").trim();y=y.replace(/[\u0000-\u001F\u007F-\u009F]/g," ").trim();try{r=JSON.parse(y)}catch{y=y.replace(/\\(?!["\\/bfnrtu])/g,"\\\\");try{r=JSON.parse(y)}catch{throw Error("Failed to parse AI response. Please try again.")}}let{data:x,error:q}=await s.from("sessions").insert({user_id:i.id,subject:"SAT",grade:"college",topic:"math_no_calc"===a?"SAT Math (No Calculator)":"math_calc"===a?"SAT Math (Calculator)":"SAT Reading & Writing",output_type:"questions",content:r,difficulty:l,is_sat:!0,sat_module:a}).select("id").single();if(q)throw q;return p.isPremium||await (0,c.BL)(s,i.id,"sat",p.usedBonus),u.NextResponse.json({sessionId:x.id})}catch(e){return console.error("SAT generate error:",e),u.NextResponse.json({error:e.message||"Generation failed"},{status:500})}}let d=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/sat-generate/route",pathname:"/api/sat-generate",filename:"route",bundlePath:"app/api/sat-generate/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/sat-generate/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:h,serverHooks:g}=d,f="/api/sat-generate/route";function y(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:h})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9276,8456,3452,5972,4214,199],()=>r(58534));module.exports=s})();