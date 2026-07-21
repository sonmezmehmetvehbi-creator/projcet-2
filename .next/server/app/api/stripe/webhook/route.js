"use strict";(()=>{var e={};e.id=2757,e.ids=[2757],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},17702:e=>{e.exports=require("events")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},21764:e=>{e.exports=require("util")},24284:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>y,patchFetch:()=>b,requestAsyncStorage:()=>f,routeModule:()=>g,serverHooks:()=>h,staticGenerationAsyncStorage:()=>x});var r={};i.r(r),i.d(r,{POST:()=>m});var o=i(49303),s=i(88716),a=i(60670),n=i(87070),p=i(39256),d=i(93452),l=i(82591);let c=process.env.NEXT_PUBLIC_APP_URL??"https://aceforge.app";async function u(e,t,i){try{let r=new l.R(process.env.RESEND_API_KEY);await r.emails.send({from:"AceForge <noreply@aceforge.app>",to:t,subject:e,html:i})}catch(e){console.error("Stripe webhook email failed:",e?.message)}}async function m(e){let t;let i=new p.Z(process.env.STRIPE_SECRET_KEY,{apiVersion:"2025-02-24.acacia"}),r=await e.text(),o=e.headers.get("stripe-signature");try{t=i.webhooks.constructEvent(r,o,process.env.STRIPE_WEBHOOK_SECRET)}catch(e){return console.error("Webhook signature verification failed:",e.message),n.NextResponse.json({error:"Invalid signature"},{status:400})}let s=(0,d.l)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{cookies:{getAll:()=>[],setAll:()=>{}}});switch(t.type){case"checkout.session.completed":{let e=t.data.object,i=e.metadata?.supabase_user_id,r=e.subscription;if(i){await s.from("profiles").update({is_premium:!0,stripe_subscription_id:r,premium_since:new Date().toISOString()}).eq("id",i);let{data:e}=await s.from("profiles").select("email, display_name").eq("id",i).single();e?.email&&await u("⚡ Welcome to AceForge Premium!",e.email,function(e){let t=e?.split(" ")[0]||"there";return`
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e;font-size:24px">⚡ Welcome to AceForge Premium!</h2>
      <p>Congrats ${t}, you're now <strong>Premium</strong>! 🎉</p>
      <div style="background:#f8faf5;border:1px solid #d1e8c7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:700;color:#22550e">Benefits unlocked:</p>
        <p style="margin:0 0 8px">✅ <strong>Unlimited generations</strong></p>
        <p style="margin:0 0 8px">✅ <strong>No wait time</strong></p>
        <p style="margin:0">✅ <strong>Premium tutor rate</strong> — $34.99/hr</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${c}/dashboard" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Start Studying →
        </a>
      </div>
      <p style="color:#6b6b58;font-size:13px">
        Billing: <strong>$5.99/month</strong>. Cancel anytime from your settings.
      </p>
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `}(e.display_name))}break}case"customer.subscription.deleted":{let e=t.data.object,i=e.metadata?.supabase_user_id;if(!i){let{data:t}=await s.from("profiles").select("id").eq("stripe_subscription_id",e.id).single();i=t?.id}if(i){await s.from("profiles").update({is_premium:!1,stripe_subscription_id:null}).eq("id",i);let{data:e}=await s.from("profiles").select("email, display_name").eq("id",i).single();e?.email&&await u("Your AceForge Premium has ended",e.email,function(e){let t=e?.split(" ")[0]||"there";return`
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <h2 style="color:#22550e;font-size:24px">Your AceForge Premium has ended</h2>
      <p>Hi ${t}, your Premium subscription has ended and you've been moved to the <strong>Free plan</strong> (2 questions/day).</p>
      <div style="background:#fdf6f6;border:1px solid #f0d7d7;border-radius:12px;padding:20px;margin:20px 0">
        <p style="margin:0 0 12px;font-weight:700;color:#a32d2d">What you'll miss:</p>
        <p style="margin:0 0 8px">• Unlimited generations</p>
        <p style="margin:0">• No wait time</p>
      </div>
      <div style="text-align:center;margin:28px 0">
        <a href="${c}/pricing" style="display:inline-block;background:#22550e;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
          Reactivate Premium →
        </a>
      </div>
      <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
    </div>
  `}(e.display_name))}break}case"invoice.payment_failed":{let e=t.data.object.customer,{data:i}=await s.from("profiles").select("id").eq("stripe_customer_id",e).single();i&&await s.from("profiles").update({is_premium:!1}).eq("id",i.id)}}return n.NextResponse.json({received:!0})}let g=new o.AppRouteRouteModule({definition:{kind:s.x.APP_ROUTE,page:"/api/stripe/webhook/route",pathname:"/api/stripe/webhook",filename:"route",bundlePath:"app/api/stripe/webhook/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/stripe/webhook/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:f,staticGenerationAsyncStorage:x,serverHooks:h}=g,y="/api/stripe/webhook/route";function b(){return(0,a.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:x})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[9276,8456,3452,5972,2591,9256],()=>i(24284));module.exports=r})();