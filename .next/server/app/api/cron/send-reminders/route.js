"use strict";(()=>{var e={};e.id=7951,e.ids=[7951],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},56090:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>h,patchFetch:()=>_,requestAsyncStorage:()=>u,routeModule:()=>m,serverHooks:()=>f,staticGenerationAsyncStorage:()=>c});var s={};o.r(s),o.d(s,{GET:()=>g,dynamic:()=>l});var r=o(49303),i=o(88716),n=o(60670),a=o(3370),p=o(87070),d=o(82591);let l="force-dynamic";async function g(e){let t=new d.R(process.env.RESEND_API_KEY);if(e.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return p.NextResponse.json({error:"Unauthorized"},{status:401});let o=(0,a.createClient)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),s=new Date,r=new Date(s.getTime()+9e5),i=new Date(s.getTime()+864e5),{data:n}=await o.from("tutoring_sessions").select("*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)").eq("status","confirmed").eq("reminder_15min_sent",!1).gte("scheduled_at",new Date(r.getTime()-3e5).toISOString()).lte("scheduled_at",new Date(r.getTime()+3e5).toISOString()),{data:l}=await o.from("tutoring_sessions").select("*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)").eq("status","confirmed").eq("reminder_24hr_sent",!1).gte("scheduled_at",new Date(i.getTime()-3e5).toISOString()).lte("scheduled_at",new Date(i.getTime()+3e5).toISOString()),g=0;for(let e of n??[])try{let{data:s}=await o.from("profiles").select("email").eq("id",e.tutor_profiles?.user_id).single(),r=new Date(e.scheduled_at).toLocaleString(),i=e.meet_link;await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:e.profiles?.email,subject:"⏰ Your tutoring session starts in 15 minutes!",html:`
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
            <p>Hi ${e.profiles?.display_name?.split(" ")[0]},</p>
            <p>Your tutoring session with <strong>${e.tutor_profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
            <p><strong>Subject:</strong> ${e.subject}</p>
            <p><strong>Time:</strong> ${r}</p>
            ${i?`<a href="${i}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet Now →</a>`:""}
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `}),s?.email&&await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:s.email,subject:"⏰ Your tutoring session starts in 15 minutes!",html:`
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
              <p>Your session with <strong>${e.profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
              <p><strong>Subject:</strong> ${e.subject}</p>
              <p><strong>Time:</strong> ${r}</p>
              ${i?`<a href="${i}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet →</a>`:""}
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `}),await o.from("tutoring_sessions").update({reminder_15min_sent:!0}).eq("id",e.id),g+=2}catch(e){console.error(e)}for(let e of l??[])try{let{data:s}=await o.from("profiles").select("email").eq("id",e.tutor_profiles?.user_id).single(),r=new Date(e.scheduled_at).toLocaleString();await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:e.profiles?.email,subject:"\uD83D\uDCC5 Reminder: Tutoring session tomorrow",html:`
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">📅 Session Reminder</h2>
            <p>Hi ${e.profiles?.display_name?.split(" ")[0]},</p>
            <p>Just a reminder that your tutoring session with <strong>${e.tutor_profiles?.display_name}</strong> is tomorrow!</p>
            <p><strong>Subject:</strong> ${e.subject}</p>
            <p><strong>Time:</strong> ${r}</p>
            <p>Your tutor will send a Google Meet link before the session.</p>
            <a href="https://aceforge.app/tutoring/sessions" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Session Details →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `}),s?.email&&await t.emails.send({from:"AceForge <onboarding@resend.dev>",to:s.email,subject:"\uD83D\uDCC5 Reminder: Tutoring session tomorrow",html:`
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">📅 Session Reminder</h2>
              <p>Reminder: You have a tutoring session with <strong>${e.profiles?.display_name}</strong> tomorrow!</p>
              <p><strong>Subject:</strong> ${e.subject}</p>
              <p><strong>Time:</strong> ${r}</p>
              <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Dashboard →</a>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `}),await o.from("tutoring_sessions").update({reminder_24hr_sent:!0}).eq("id",e.id),g+=2}catch(e){console.error(e)}return p.NextResponse.json({success:!0,emailsSent:g})}let m=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/cron/send-reminders/route",pathname:"/api/cron/send-reminders",filename:"route",bundlePath:"app/api/cron/send-reminders/route"},resolvedPagePath:"/Users/aysesamanci/projcet-2/src/app/api/cron/send-reminders/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:u,staticGenerationAsyncStorage:c,serverHooks:f}=m,h="/api/cron/send-reminders/route";function _(){return(0,n.patchFetch)({serverHooks:f,staticGenerationAsyncStorage:c})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),s=t.X(0,[9276,8456,5972,2591],()=>o(56090));module.exports=s})();