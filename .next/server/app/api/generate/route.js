"use strict";(()=>{var e={};e.id=8290,e.ids=[8290],e.modules={72934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},55315:e=>{e.exports=require("path")},68621:e=>{e.exports=require("punycode")},76162:e=>{e.exports=require("stream")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},6162:e=>{e.exports=require("worker_threads")},71568:e=>{e.exports=require("zlib")},87561:e=>{e.exports=require("node:fs")},84492:e=>{e.exports=require("node:stream")},72477:e=>{e.exports=require("node:stream/web")},16880:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>f,patchFetch:()=>g,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>m,staticGenerationAsyncStorage:()=>h});var r={};s.r(r),s.d(r,{POST:()=>u});var o=s(49303),i=s(88716),n=s(60670),a=s(6943),c=s(87070),l=s(54214);async function u(e){let t=new l.ZP({apiKey:process.env.OPENAI_API_KEY});try{let s;let r=await (0,a.f)(),{data:{user:o}}=await r.auth.getUser();if(!o)return c.NextResponse.json({error:"Unauthorized"},{status:401});let{subject:i,grade:n,topic:l,focus:u,outputType:d,questionCount:p,questionTypes:h,uploadedText:m,isRetry:f,difficulty:g}=await e.json(),{data:y}=await r.from("profiles").select("is_premium").eq("id",o.id).single();if(!y?.is_premium){let e=new Date().toISOString().split("T")[0],{data:t}=await r.from("daily_usage").select("questions, worksheets").eq("user_id",o.id).eq("date",e).single();if(("questions"===d?t?.questions??0:t?.worksheets??0)>=2)return c.NextResponse.json({error:"daily_limit_reached"},{status:429})}let w={mathematics:`
- Always present a concrete problem, not a definition question ("Solve..." not "What is...").
- For MC: make sure exactly one answer is mathematically correct; verify all distractors are wrong.
- Distractors must reflect real student errors: sign mistakes, order-of-operations errors, wrong formula application.
- Show all necessary given information in the question stem — never assume unstated values.
- Vary question format: some numeric answers, some "which of the following is true", some "find and interpret".
- Never ask the same concept twice in one set.`,calculus:`
- Questions must involve an actual function, limit expression, integral, or derivative — never abstract definitions alone.
- For limits: specify the point and direction (left/right) when relevant.
- For derivatives: name the rule being tested (chain, product, quotient, implicit) in your internal planning but NOT in the question.
- For integrals: specify definite vs indefinite; include bounds for definite integrals.
- For FRQs: structure as multi-part (a, b, c) mirroring AP Calc FRQ style — set up, solve, interpret.
- Distractors: missing chain rule, wrong sign on integration, forgetting +C, differentiating instead of integrating.
- Use functions that produce clean answers at the difficulty level specified.`,algebra:`
- Always include an equation, expression, or word problem — never a pure vocabulary question.
- Cover a range: linear equations, systems, quadratics, inequalities, functions, word problems.
- Word problems must give all necessary values and ask for a specific numeric or algebraic answer.
- Distractors: arithmetic sign errors, wrong order of operations, forgetting to apply operation to both sides.
- For quadratics: require the student to choose the correct method (factor, quadratic formula, complete the square) at hard/expert.
- Systems of equations: specify the method or let the student choose; always have a unique solution at easy/medium.`,"pre-calculus":`
- Cover: functions and inverses, trigonometry, polar coordinates, vectors, sequences/series, conic sections.
- Trig questions must specify the quadrant or unit circle position when relevant.
- For inverse functions: always confirm the domain restriction is stated.
- Sequence/series questions must specify arithmetic vs geometric and what is being asked (nth term, sum, convergence).
- Distractors: wrong quadrant sign, forgetting domain restrictions, confusing arithmetic/geometric formulas.`,statistics:`
- Questions must reference a realistic scenario or dataset — never abstract statistics in a vacuum.
- Cover: descriptive stats, probability, distributions, hypothesis testing, confidence intervals, regression.
- Always state sample size, significance level, or distribution type when relevant.
- For hypothesis testing: require the student to state H0 and H1, choose the test, and interpret the p-value.
- Distractors: confusing p-value with probability of H0, wrong degrees of freedom, correlation vs causation errors.
- Avoid questions with ambiguous interpretations of probability.`,biology:`
- Frame questions around a scenario, organism, or experimental result — not pure definition recall at medium+.
- Cover cellular processes, genetics, evolution, ecology, physiology, and molecular biology as appropriate to topic.
- For genetics: use Punnett squares or genotype/phenotype problems with specific crosses.
- For experimental questions: provide a hypothesis and data, then ask for interpretation or conclusion.
- Distractors: common misconceptions (evolution is directed, mitosis produces gametes, DNA is made of amino acids).
- Free response: require the student to explain a mechanism step-by-step, not just name it.`,chemistry:`
- Always include actual chemical formulas, equations, or numeric data — never pure vocabulary at medium+.
- Balance chemical equations in the question if stoichiometry is involved; verify balance before including.
- For mole/stoichiometry problems: provide molar masses or specify that students should use periodic table values.
- Cover: atomic structure, bonding, reactions, stoichiometry, thermodynamics, equilibrium, kinetics, acids/bases, electrochemistry.
- Distractors: common errors — forgetting to balance, wrong mole ratios, confusing exothermic/endothermic signs.
- Free response: show the setup, calculation steps, and unit analysis.`,physics:`
- Every question must include numeric values, units, or a described physical scenario.
- Always specify the reference frame, direction of forces, and whether to ignore friction/air resistance when relevant.
- Cover: kinematics, dynamics, energy/work, momentum, waves, electricity, magnetism, optics, modern physics.
- For vector questions: specify components or angles given.
- Distractors: sign errors on direction, forgetting to square in kinetic energy, confusing mass and weight.
- Free response: require a free body diagram description, equation setup, substitution, and final answer with units.`,"us history":`
- Ground every question in a specific event, period, person, document, or turning point — no vague generalities.
- Periods to draw from: Colonial, Revolution, Early Republic, Civil War, Reconstruction, Gilded Age, Progressive Era, WWI, Great Depression, WWII, Cold War, Civil Rights, Modern.
- At medium+: include cause-and-effect, significance, or comparison questions — not just "when did X happen."
- Primary source style: present a short quote or document excerpt and ask the student to identify author, context, or significance.
- Distractors: plausible-sounding but factually wrong dates, figures, or outcomes.
- Free response: require thesis + evidence + analysis, mirroring AP US History SAQ/LEQ style.`,"world history":`
- Span multiple civilizations, time periods, and regions — avoid Eurocentrism unless the topic requires it.
- Ground every question in a specific civilization, event, trade route, empire, ideology, or turning point.
- Include cross-cultural comparisons and global connections at medium+.
- Primary source style: present a short excerpt and ask for context, author's purpose, or historical significance.
- Distractors: confusing similar empires, wrong centuries, mixing up cause/effect of major events.
- Free response: compare two civilizations or analyze a historical change over time with evidence.`,"ap us history":`
- Mirror APUSH exam style precisely: stimulus-based MC, SAQ, LEQ, DBQ structure for FR.
- MC questions must be stimulus-based (quote, map, image description, or data).
- SAQ style FR: three-part questions (a) describe, (b) explain, (c) evaluate/compare.
- Cover APUSH periods 1-9 with appropriate weighting (periods 3-8 are most heavily tested).
- Distractors: must reflect actual common APUSH student misconceptions.
- Use APUSH vocabulary: continuity and change over time, periodization, causation, contextualization.`,literature:`
- Questions must reference specific literary elements: theme, motif, character development, narrative structure, point of view, symbolism, tone, diction, imagery.
- At medium+: ask the student to interpret or analyze — not just identify.
- For MC: provide a short passage excerpt (2-4 sentences) and ask an analytical question about it.
- Avoid plot summary questions at hard/expert — focus on meaning and craft.
- Distractors: plausible misreadings of tone, theme confusion, surface vs deep interpretation errors.
- Free response: require a claim, textual evidence, and analysis (CEA format).`,grammar:`
- Present actual sentences — never ask about rules in the abstract.
- Cover: subject-verb agreement, pronoun antecedent, comma usage, semicolons, apostrophes, parallel structure, modifier placement, active/passive voice.
- For MC: underline or bracket the part of the sentence being tested.
- Distractors: grammatically plausible but technically incorrect alternatives.
- At hard/expert: combine multiple grammar issues in one sentence and ask which revision is best.`,"sat math":`
- Mirror College Board SAT Math format exactly.
- Two modules: no-calculator concepts (algebra, advanced math) and calculator-permitted (problem solving, data analysis).
- Question types: multiple choice (4 options) and student-produced response (grid-in).
- Always include a realistic context for word problems (science, social studies, careers).
- Distractors: must be the result of specific wrong approaches a student would actually make.
- Difficulty progression: easy questions test one skill; hard questions require multiple steps and concept connections.
- Specify if the question is Heart of Algebra, Problem Solving & Data Analysis, Passport to Advanced Math, or Additional Topics.`,"sat reading":`
- Mirror College Board SAT Reading format: passage-based questions only.
- Provide a short passage excerpt (3-6 sentences) for each question.
- Question types: main idea, inference, vocabulary in context, evidence support, author's purpose, data interpretation.
- Distractors: too broad, too narrow, opposite of correct, or out of scope.
- Paired evidence questions: ask for the best evidence to support the previous answer.`,"act math":`
- Mirror ACT Math format: 60 questions in 60 minutes style, no passage context needed.
- Cover: pre-algebra, elementary algebra, intermediate algebra, coordinate geometry, plane geometry, trigonometry.
- Questions should be solvable in ~1 minute at medium, ~1.5-2 minutes at hard/expert.
- Distractors: wrong formula, arithmetic error, misread question.
- Always provide 5 answer choices (A-E) for ACT Math.`,economics:`
- Frame questions around a real-world economic scenario, graph description, or policy decision.
- Cover: supply/demand, elasticity, market structures, GDP, inflation, monetary/fiscal policy, trade, opportunity cost.
- Graph questions: describe a supply/demand or production possibilities curve shift and ask what happens to price/quantity.
- Distractors: confusing shifts of vs movements along curves, wrong direction of policy effects, mixing micro/macro.
- Free response: require the student to draw (describe) a graph, explain the shift, and predict the outcome.`,geography:`
- Questions must reference specific regions, countries, physical features, or geographic concepts.
- Cover: physical geography, human geography, population, urbanization, political geography, economic geography, environmental issues.
- At medium+: require analysis of why a geographic pattern exists, not just identification.
- Distractors: plausible-sounding but factually incorrect locations, statistics, or cause-effect relationships.`},b=i?.toLowerCase().trim(),v=["math","mathematics","calculus","algebra","pre-calculus","statistics","geometry","trigonometry"].some(e=>b?.includes(e)),q=w[b]||(v?w.mathematics:""),A=g||"medium",x=`You are AceForge, an expert educational content creator with deep knowledge of standardized exams, curriculum standards, and pedagogical best practices.

Your job is to generate high-quality, accurate study questions that genuinely challenge students at the right level AND provide explanations that are genuinely educational — not just "the answer is X because X is correct."

DIFFICULTY: ${A.toUpperCase()}
${{easy:"Test direct recall and basic conceptual understanding. Questions should have one clearly correct answer with obviously wrong distractors. Use simple, unambiguous language. Suitable for first exposure to a topic.",medium:"Test understanding and application. Require the student to apply a concept to a new situation or interpret information. Distractors should be plausible but clearly wrong on reflection. Standard grade-level challenge.",hard:"Test analysis and multi-step reasoning. Questions should require combining multiple concepts, spotting subtle distinctions, or working through a problem with several steps. Distractors should reflect common misconceptions.",expert:"Test synthesis and evaluation at AP/college level. Questions should involve edge cases, non-obvious applications, or require the student to evaluate competing approaches. Distractors should be sophisticated and reflect deep misconceptions."}[A]}

SUBJECT-SPECIFIC RULES FOR ${i?.toUpperCase()}:
${q||`
- Questions must be specific and grounded — no vague or trivially easy questions.
- Every question must have exactly one defensibly correct answer.
- Distractors must reflect real student misconceptions, not random wrong answers.
- Vary the cognitive level: recall, comprehension, application, analysis.
- Free response answers must be substantive and model excellent student work.`}

EXPLANATION QUALITY RULES (CRITICAL — this is what separates AceForge from other apps):

For CORRECT answers — the explanation must:
1. State the underlying concept, rule, or principle being tested (not just "the answer is B")
2. Walk through the reasoning step by step — show HOW you arrive at the answer
3. Explain WHY this is correct using the actual subject knowledge
4. For math/science: show the key step or formula that makes it work
5. End with a memorable tip or pattern the student can apply to similar questions

For WRONG answers — the explanation must also:
6. Identify the most tempting wrong answer and explain exactly why students pick it
7. Clarify the misconception behind that wrong choice
8. If relevant, explain the difference between the correct and most-tempting answer

EXPLANATION EXAMPLES OF WHAT NOT TO DO:
BAD: "The answer is B. Thylakoid membranes are where light reactions occur."
BAD: "Correct! The answer is mitosis because cells divide during mitosis."
BAD: "The Battle of Gettysburg was in 1863, making A correct."

EXPLANATION EXAMPLES OF WHAT TO DO:
GOOD: "The light-dependent reactions require direct access to sunlight, which means they must occur in the part of the chloroplast that contains chlorophyll — the thylakoid membrane. Chlorophyll is embedded in the thylakoid membrane's protein complexes (Photosystem I and II), where it absorbs photons to split water molecules and generate ATP and NADPH. The stroma (choice A) is where the Calvin cycle occurs — a common mix-up because both stages happen in the chloroplast. Remember: thylakoid = light, stroma = dark (Calvin cycle)."
GOOD: "To solve 3x + 7 = 22, first isolate the variable term by subtracting 7 from both sides: 3x = 15. Then divide both sides by 3: x = 5. The most common mistake is dividing before subtracting (getting x = 22/3 - 7), which violates order of operations. Always eliminate addition/subtraction before multiplication/division when isolating a variable."

FORMATTING RULES (STRICTLY ENFORCED):
- Do NOT use LaTeX notation. Write math in plain text: ^ for exponents (x^2), / for fractions (1/2), * for multiplication.
- Never use \\frac, \\times, \\( \\), \\[ \\], or any LaTeX commands.
- All options must start with "A. ", "B. ", "C. ", "D. " exactly.
- correctAnswer must be exactly "A", "B", "C", or "D".
- Always respond in valid JSON only — no markdown, no preamble, no backticks.

QUALITY CHECKS before responding:
- Every MC question has exactly one correct answer — verify this.
- No two questions test the exact same concept or skill.
- Each explanation teaches the underlying concept, not just states the answer.
- Distractors are plausible but unambiguously wrong.`,k=m?`

IMPORTANT: Base ALL questions/content ONLY on the following student notes. Do not add information from outside these notes:

---
${m}
---
`:"",C=h?.includes("mc"),S=h?.includes("fr"),R="";R="questions"===d?`Generate ${p} ${A.toUpperCase()} difficulty study questions about "${l}" in ${i} for a ${n} student.${u?` Focus specifically on: ${u}.`:""}${k}

Include ${C&&S?"a mix of multiple choice and free response":S?"ONLY free response — do not include any multiple choice questions":"ONLY multiple choice — do not include any free response questions"} questions. This is strictly enforced — if the type says ONLY, do not include any other type.

For each MC question provide:
- id (number)
- type: "mc"
- question (string) — must be a complete, specific question
- options (array of 4 strings like ["A. ...", "B. ...", "C. ...", "D. ..."])
- correctAnswer (string: "A", "B", "C", or "D")
- explanation (string) — MUST follow this structure:
  * Sentence 1-2: Explain the underlying concept/rule/principle and WHY the correct answer is right — use subject knowledge, not circular reasoning
  * Sentence 3-4: Walk through the key reasoning step or calculation that confirms the answer
  * Sentence 5: Identify the most tempting wrong answer and explain the specific misconception behind it
  * End with a memory tip or pattern rule the student can reuse (e.g. "Remember: X always means Y in this context")
  * Total: 5-7 sentences. Be specific, educational, and thorough.
- topic (string: the specific subtopic this question covers, e.g. "Chain Rule", "Mitosis", "Supply and Demand")

For each FR question provide:
- id (number)
- type: "fr"
- question (string) — must be a complete, specific, thought-provoking question
- modelAnswer (string) — MUST follow this structure:
  * Sentence 1: State the direct answer clearly
  * Sentence 2-3: Explain the underlying mechanism, process, or reasoning in detail
  * Sentence 4-5: Support with specific evidence, examples, steps, or data
  * Sentence 6: Connect to a broader concept or real-world significance
  * Total: 5-7 sentences. This should model what an A+ student response looks like.
- topic (string: the specific subtopic this question covers)

Ensure questions span different aspects of "${l}" — do not repeat the same concept.

Return JSON: { "questions": [...] }`:`Create a COMPREHENSIVE and DEEPLY EDUCATIONAL study worksheet about "${l}" in ${i} for a ${n} student at ${A.toUpperCase()} difficulty.${u?` Focus on: ${u}.`:""}${k}

${m?"CRITICAL: The student uploaded their own notes/materials. Your worksheet must be built ENTIRELY from the content in those notes. Every concept, vocabulary term, step, and practice question must come directly from the uploaded content. Do not add outside information. Cover every major topic and subtopic mentioned in the notes thoroughly.":`Build a thorough, curriculum-aligned worksheet that covers "${l}" in depth — not a surface-level overview. Include specific facts, formulas, processes, and examples a student would actually need to know for an exam.`}

The worksheet must have:
- A vocabulary section with ALL key terms relevant to the topic (minimum 5 terms), each with a precise, educational definition
- At least 4 detailed steps/sections that cover the topic thoroughly — each with real educational content, not generic filler
- A summary with specific, memorable bullet points
- Exactly 5 practice questions (mix of MC and FR)

Each explanation section must:
- Include specific facts, data, formulas, or processes — not vague descriptions
- Explain the WHY behind concepts, not just the WHAT
- Use examples where helpful
- Be detailed enough that a student could learn this topic from scratch just from the worksheet

Return JSON with this exact structure:
{
  "worksheet": {
    "introduction": {
      "text": "3-4 sentence engaging intro that explains what this topic is, why it matters, and what the student will learn",
      "vocabulary": [
        {"term": "...", "definition": "precise, educational definition with context — not a dictionary definition"}
      ]
    },
    "steps": [
      {
        "title": "Specific concept or section title",
        "explanation": "4-6 sentences of detailed, specific educational content. Include actual facts, formulas, processes, or mechanisms. Explain the concept deeply enough that a student learns something, not just recalls a label.",
        "visualDescription": "Describe a specific diagram, table, graph, or visual aid that would help illustrate this concept — be specific about what it shows",
        "keyTakeaway": "One precise, memorable sentence the student should remember"
      }
    ],
    "summary": {
      "bullets": ["Specific, testable fact or rule — not vague summaries", "Another key point with actual content"],
      "quickCheck": ["True or False: [specific statement about ${l}]", "Fill in the blank: [specific sentence about ${l}]", "Quick question: [something testable from the worksheet]"]
    },
    "practiceQuestions": [
      {
        "id": 1,
        "type": "mc",
        "question": "Specific question grounded in the worksheet content",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "A",
        "explanation": "Explain the underlying concept, walk through the reasoning step by step, identify the main wrong answer and its misconception, end with a reusable tip",
        "topic": "specific subtopic"
      },
      {
        "id": 2,
        "type": "mc",
        "question": "...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "B",
        "explanation": "...",
        "topic": "..."
      },
      {
        "id": 3,
        "type": "mc",
        "question": "...",
        "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
        "correctAnswer": "C",
        "explanation": "...",
        "topic": "..."
      },
      {
        "id": 4,
        "type": "fr",
        "question": "A thoughtful free response question that requires the student to explain, analyze, or apply a concept from this worksheet",
        "modelAnswer": "5-6 sentence model answer: state the answer directly, explain the mechanism/reasoning in depth, support with specific evidence or examples from the topic, connect to a broader concept",
        "topic": "..."
      },
      {
        "id": 5,
        "type": "fr",
        "question": "Another free response question testing a different concept from the worksheet",
        "modelAnswer": "5-6 sentence model answer following the same quality standard",
        "topic": "..."
      }
    ]
  }
}`;let D=((await t.chat.completions.create({model:"gpt-4o",messages:[{role:"system",content:x},{role:"user",content:R}],temperature:.7,max_tokens:6e3})).choices[0].message.content??"{}").replace(/```json|```/g,"").trim();D=D.replace(/[\u0000-\u001F\u007F-\u009F]/g," ").replace(/\n/g," ").trim();try{s=JSON.parse(D)}catch(e){D=D.replace(/\\(?!["\\/bfnrtu])/g,"\\\\");try{s=JSON.parse(D)}catch(e){throw console.error("JSON parse failed:",D.substring(0,500)),Error("Failed to parse AI response. Please try again.")}}if(f)return c.NextResponse.json({sessionId:"retry",outputType:d,content:s});let{data:E,error:T}=await r.from("sessions").insert({user_id:o.id,subject:i,grade:n,topic:l,focus:u||null,output_type:d,content:s,difficulty:A}).select("id").single();if(T)throw T;let O=new Date().toISOString().split("T")[0],P="questions"===d?"questions":"worksheets",{data:F}=await r.from("daily_usage").select("id, questions, worksheets").eq("user_id",o.id).eq("date",O).single();return F?await r.from("daily_usage").update({[P]:F[P]+1}).eq("id",F.id):await r.from("daily_usage").insert({user_id:o.id,date:O,[P]:1}),c.NextResponse.json({sessionId:E.id,outputType:d})}catch(e){return console.error("Generate error:",e),c.NextResponse.json({error:e.message||"Generation failed"},{status:500})}}let d=new o.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/generate/route",pathname:"/api/generate",filename:"route",bundlePath:"app/api/generate/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/generate/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:p,staticGenerationAsyncStorage:h,serverHooks:m}=d,f="/api/generate/route";function g(){return(0,n.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:h})}},71615:(e,t,s)=>{var r=s(88757);s.o(r,"cookies")&&s.d(t,{cookies:function(){return r.cookies}})},33085:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),Object.defineProperty(t,"DraftMode",{enumerable:!0,get:function(){return i}});let r=s(45869),o=s(6278);class i{get isEnabled(){return this._provider.isEnabled}enable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,o.trackDynamicDataAccessed)(e,"draftMode().enable()"),this._provider.enable()}disable(){let e=r.staticGenerationAsyncStorage.getStore();return e&&(0,o.trackDynamicDataAccessed)(e,"draftMode().disable()"),this._provider.disable()}constructor(e){this._provider=e}}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},88757:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var s in t)Object.defineProperty(e,s,{enumerable:!0,get:t[s]})}(t,{cookies:function(){return p},draftMode:function(){return h},headers:function(){return d}});let r=s(68996),o=s(53047),i=s(92044),n=s(72934),a=s(33085),c=s(6278),l=s(45869),u=s(54580);function d(){let e="headers",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return o.HeadersAdapter.seal(new Headers({}));(0,c.trackDynamicDataAccessed)(t,e)}return(0,u.getExpectedRequestStore)(e).headers}function p(){let e="cookies",t=l.staticGenerationAsyncStorage.getStore();if(t){if(t.forceStatic)return r.RequestCookiesAdapter.seal(new i.RequestCookies(new Headers({})));(0,c.trackDynamicDataAccessed)(t,e)}let s=(0,u.getExpectedRequestStore)(e),o=n.actionAsyncStorage.getStore();return(null==o?void 0:o.isAction)||(null==o?void 0:o.isAppRoute)?s.mutableCookies:s.cookies}function h(){let e=(0,u.getExpectedRequestStore)("draftMode");return new a.DraftMode(e.draftMode)}("function"==typeof t.default||"object"==typeof t.default&&null!==t.default)&&void 0===t.default.__esModule&&(Object.defineProperty(t.default,"__esModule",{value:!0}),Object.assign(t.default,t),e.exports=t.default)},53047:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var s in t)Object.defineProperty(e,s,{enumerable:!0,get:t[s]})}(t,{HeadersAdapter:function(){return i},ReadonlyHeadersError:function(){return o}});let r=s(38238);class o extends Error{constructor(){super("Headers cannot be modified. Read more: https://nextjs.org/docs/app/api-reference/functions/headers")}static callable(){throw new o}}class i extends Headers{constructor(e){super(),this.headers=new Proxy(e,{get(t,s,o){if("symbol"==typeof s)return r.ReflectAdapter.get(t,s,o);let i=s.toLowerCase(),n=Object.keys(e).find(e=>e.toLowerCase()===i);if(void 0!==n)return r.ReflectAdapter.get(t,n,o)},set(t,s,o,i){if("symbol"==typeof s)return r.ReflectAdapter.set(t,s,o,i);let n=s.toLowerCase(),a=Object.keys(e).find(e=>e.toLowerCase()===n);return r.ReflectAdapter.set(t,a??s,o,i)},has(t,s){if("symbol"==typeof s)return r.ReflectAdapter.has(t,s);let o=s.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);return void 0!==i&&r.ReflectAdapter.has(t,i)},deleteProperty(t,s){if("symbol"==typeof s)return r.ReflectAdapter.deleteProperty(t,s);let o=s.toLowerCase(),i=Object.keys(e).find(e=>e.toLowerCase()===o);return void 0===i||r.ReflectAdapter.deleteProperty(t,i)}})}static seal(e){return new Proxy(e,{get(e,t,s){switch(t){case"append":case"delete":case"set":return o.callable;default:return r.ReflectAdapter.get(e,t,s)}}})}merge(e){return Array.isArray(e)?e.join(", "):e}static from(e){return e instanceof Headers?e:new i(e)}append(e,t){let s=this.headers[e];"string"==typeof s?this.headers[e]=[s,t]:Array.isArray(s)?s.push(t):this.headers[e]=t}delete(e){delete this.headers[e]}get(e){let t=this.headers[e];return void 0!==t?this.merge(t):null}has(e){return void 0!==this.headers[e]}set(e,t){this.headers[e]=t}forEach(e,t){for(let[s,r]of this.entries())e.call(t,r,s,this)}*entries(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase(),s=this.get(t);yield[t,s]}}*keys(){for(let e of Object.keys(this.headers)){let t=e.toLowerCase();yield t}}*values(){for(let e of Object.keys(this.headers)){let t=this.get(e);yield t}}[Symbol.iterator](){return this.entries()}}},68996:(e,t,s)=>{Object.defineProperty(t,"__esModule",{value:!0}),function(e,t){for(var s in t)Object.defineProperty(e,s,{enumerable:!0,get:t[s]})}(t,{MutableRequestCookiesAdapter:function(){return d},ReadonlyRequestCookiesError:function(){return n},RequestCookiesAdapter:function(){return a},appendMutableCookies:function(){return u},getModifiedCookieValues:function(){return l}});let r=s(92044),o=s(38238),i=s(45869);class n extends Error{constructor(){super("Cookies can only be modified in a Server Action or Route Handler. Read more: https://nextjs.org/docs/app/api-reference/functions/cookies#cookiessetname-value-options")}static callable(){throw new n}}class a{static seal(e){return new Proxy(e,{get(e,t,s){switch(t){case"clear":case"delete":case"set":return n.callable;default:return o.ReflectAdapter.get(e,t,s)}}})}}let c=Symbol.for("next.mutated.cookies");function l(e){let t=e[c];return t&&Array.isArray(t)&&0!==t.length?t:[]}function u(e,t){let s=l(t);if(0===s.length)return!1;let o=new r.ResponseCookies(e),i=o.getAll();for(let e of s)o.set(e);for(let e of i)o.set(e);return!0}class d{static wrap(e,t){let s=new r.ResponseCookies(new Headers);for(let t of e.getAll())s.set(t);let n=[],a=new Set,l=()=>{let e=i.staticGenerationAsyncStorage.getStore();if(e&&(e.pathWasRevalidated=!0),n=s.getAll().filter(e=>a.has(e.name)),t){let e=[];for(let t of n){let s=new r.ResponseCookies(new Headers);s.set(t),e.push(s.toString())}t(e)}};return new Proxy(s,{get(e,t,s){switch(t){case c:return n;case"delete":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{e.delete(...t)}finally{l()}};case"set":return function(...t){a.add("string"==typeof t[0]?t[0]:t[0].name);try{return e.set(...t)}finally{l()}};default:return o.ReflectAdapter.get(e,t,s)}}})}}},6943:(e,t,s)=>{s.d(t,{f:()=>i});var r=s(93452),o=s(71615);async function i(){let e=await (0,o.cookies)();return(0,r.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,{cookies:{getAll:()=>e.getAll(),setAll(t){try{t.forEach(({name:t,value:s,options:r})=>e.set(t,s,r))}catch{}}}})}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[9276,8456,3452,5972,4214],()=>s(16880));module.exports=r})();