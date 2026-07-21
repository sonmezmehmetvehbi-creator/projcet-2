"use strict";(()=>{var e={};e.id=933,e.ids=[933],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},92556:(e,a,t)=>{t.r(a),t.d(a,{originalPathname:()=>x,patchFetch:()=>f,requestAsyncStorage:()=>c,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var r={};t.r(r),t.d(r,{POST:()=>l});var p=t(49303),o=t(88716),i=t(60670),n=t(87070),s=t(3370),d=t(82591);async function l(e){try{let a=new d.R(process.env.RESEND_API_KEY),{name:t,email:r,reason:p,additional:o}=await e.json(),i=(0,s.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY);return await i.from("tutor_appeals").insert({name:t,email:r,reason:p,additional:o,status:"pending"}),await a.emails.send({from:"AceForge <noreply@aceforge.app>",to:"contactinfo21342@gmail.com",subject:`⚖️ Tutor Appeal: ${t}`,html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#a32d2d">New Tutor Appeal Submitted</h2>
          <p><strong>Name:</strong> ${t}</p>
          <p><strong>Email:</strong> ${r}</p>
          <h3>Reason for Appeal:</h3>
          <p style="background:#faf5f5;border:1px solid #f0d0d0;border-radius:8px;padding:16px">${p}</p>
          ${o?`<h3>Additional Info:</h3><p style="background:#f8f8f8;border:1px solid #ddd;border-radius:8px;padding:16px">${o}</p>`:""}
          <a href="https://aceforge.app/admin/appeals" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">
            Review Appeal in Admin →
          </a>
        </div>
      `}),await a.emails.send({from:"AceForge <noreply@aceforge.app>",to:r,subject:"We received your appeal — AceForge",html:`
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#22550e">Appeal Received</h2>
          <p>Hi ${t},</p>
          <p>We've received your appeal and will review it carefully within 3-5 business days.</p>
          <a href="https://aceforge.app/login" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Log In →</a>
          <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
        </div>
      `}),n.NextResponse.json({success:!0})}catch(e){return n.NextResponse.json({error:e.message},{status:500})}}let u=new p.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/tutor/appeal/route",pathname:"/api/tutor/appeal",filename:"route",bundlePath:"app/api/tutor/appeal/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/tutor/appeal/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:c,staticGenerationAsyncStorage:g,serverHooks:m}=u,x="/api/tutor/appeal/route";function f(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}}};var a=require("../../../../webpack-runtime.js");a.C(e);var t=e=>a(a.s=e),r=a.X(0,[9276,8456,5972,2591],()=>t(92556));module.exports=r})();