"use strict";(()=>{var e={};e.id=933,e.ids=[933],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},44148:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>f,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var a={};r.r(a),r.d(a,{POST:()=>l});var o=r(49303),p=r(88716),i=r(60670),n=r(87070),s=r(3370);let d=new(r(82591)).R(process.env.RESEND_API_KEY);async function l(e){try{let{name:t,email:r,reason:a,additional:o}=await e.json(),p=(0,s.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);return await p.from("tutor_appeals").insert({name:t,email:r,reason:a,additional:o,status:"pending"}),await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:"contactinfo21342@gmail.com",subject:`⚖️ Tutor Appeal: ${t}`,html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#a32d2d">New Tutor Appeal Submitted</h2>
          <p><strong>Name:</strong> ${t}</p>
          <p><strong>Email:</strong> ${r}</p>
          <h3>Reason for Appeal:</h3>
          <p style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:8px;padding:16px">${a}</p>
          ${o?`<h3>Additional Info:</h3><p style="background:#f8f8f8;border:1px solid #ddd;border-radius:8px;padding:16px">${o}</p>`:""}
          <a href="https://aceforge.app/admin/appeals" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Review Appeal in Admin →
          </a>
        </div>
      `}),await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:r,subject:"We received your appeal — AceForge",html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Appeal Received</h2>
          <p>Hi ${t},</p>
          <p>We've received your appeal and will review it carefully within 3-5 business days.</p>
          <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Log In →</a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `}),n.NextResponse.json({success:!0})}catch(e){return n.NextResponse.json({error:e.message},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:p.x.APP_ROUTE,page:"/api/tutor/appeal/route",pathname:"/api/tutor/appeal",filename:"route",bundlePath:"app/api/tutor/appeal/route"},resolvedPagePath:"/workspaces/projcet-2/src/app/api/tutor/appeal/route.ts",nextConfigOutput:"",userland:a}),{requestAsyncStorage:c,staticGenerationAsyncStorage:g,serverHooks:m}=u,x="/api/tutor/appeal/route";function f(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[9276,8456,5972,2591],()=>r(44148));module.exports=a})();