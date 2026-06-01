"use strict";(()=>{var e={};e.id=7951,e.ids=[7951],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},57466:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>f,patchFetch:()=>h,requestAsyncStorage:()=>u,routeModule:()=>g,serverHooks:()=>c,staticGenerationAsyncStorage:()=>m});var s={};o.r(s),o.d(s,{GET:()=>l});var r=o(49303),i=o(88716),n=o(60670),a=o(3370),p=o(87070);let d=new(o(82591)).R(process.env.RESEND_API_KEY);async function l(e){if(e.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)return p.NextResponse.json({error:"Unauthorized"},{status:401});let t=(0,a.eI)(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY),o=new Date,s=new Date(o.getTime()+9e5),r=new Date(o.getTime()+864e5),{data:i}=await t.from("tutoring_sessions").select("*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)").eq("status","confirmed").eq("reminder_15min_sent",!1).gte("scheduled_at",new Date(s.getTime()-3e5).toISOString()).lte("scheduled_at",new Date(s.getTime()+3e5).toISOString()),{data:n}=await t.from("tutoring_sessions").select("*, tutor_profiles(display_name, user_id), profiles!tutoring_sessions_student_id_fkey(email, display_name)").eq("status","confirmed").eq("reminder_24hr_sent",!1).gte("scheduled_at",new Date(r.getTime()-3e5).toISOString()).lte("scheduled_at",new Date(r.getTime()+3e5).toISOString()),l=0;for(let e of i??[])try{let{data:o}=await t.from("profiles").select("email").eq("id",e.tutor_profiles?.user_id).single(),s=new Date(e.scheduled_at).toLocaleString(),r=e.meet_link;await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:e.profiles?.email,subject:"⏰ Your tutoring session starts in 15 minutes!",html:`
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
            <p>Hi ${e.profiles?.display_name?.split(" ")[0]},</p>
            <p>Your tutoring session with <strong>${e.tutor_profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
            <p><strong>Subject:</strong> ${e.subject}</p>
            <p><strong>Time:</strong> ${s}</p>
            ${r?`<a href="${r}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet Now →</a>`:""}
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `}),o?.email&&await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:o.email,subject:"⏰ Your tutoring session starts in 15 minutes!",html:`
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">⏰ Session Starting Soon!</h2>
              <p>Your session with <strong>${e.profiles?.display_name}</strong> starts in <strong>15 minutes</strong>!</p>
              <p><strong>Subject:</strong> ${e.subject}</p>
              <p><strong>Time:</strong> ${s}</p>
              ${r?`<a href="${r}" style="display:inline-block;background:#22550e;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px;font-size:16px">🎥 Join Google Meet →</a>`:""}
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `}),await t.from("tutoring_sessions").update({reminder_15min_sent:!0}).eq("id",e.id),l+=2}catch(e){console.error(e)}for(let e of n??[])try{let{data:o}=await t.from("profiles").select("email").eq("id",e.tutor_profiles?.user_id).single(),s=new Date(e.scheduled_at).toLocaleString();await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:e.profiles?.email,subject:"\uD83D\uDCC5 Reminder: Tutoring session tomorrow",html:`
          <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
            <h2 style="color:#22550e">📅 Session Reminder</h2>
            <p>Hi ${e.profiles?.display_name?.split(" ")[0]},</p>
            <p>Just a reminder that your tutoring session with <strong>${e.tutor_profiles?.display_name}</strong> is tomorrow!</p>
            <p><strong>Subject:</strong> ${e.subject}</p>
            <p><strong>Time:</strong> ${s}</p>
            <p>Your tutor will send a Google Meet link before the session.</p>
            <a href="https://aceforge.app/tutoring/sessions" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Session Details →</a>
            <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
          </div>
        `}),o?.email&&await d.emails.send({from:"AceForge <onboarding@resend.dev>",to:o.email,subject:"\uD83D\uDCC5 Reminder: Tutoring session tomorrow",html:`
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
              <h2 style="color:#22550e">📅 Session Reminder</h2>
              <p>Reminder: You have a tutoring session with <strong>${e.profiles?.display_name}</strong> tomorrow!</p>
              <p><strong>Subject:</strong> ${e.subject}</p>
              <p><strong>Time:</strong> ${s}</p>
              <a href="https://aceforge.app/tutor/dashboard" style="display:inline-block;background:#22550e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">View Dashboard →</a>
              <p style="color:#888;font-size:13px;margin-top:24px">— The AceForge Team</p>
            </div>
          `}),await t.from("tutoring_sessions").update({reminder_24hr_sent:!0}).eq("id",e.id),l+=2}catch(e){console.error(e)}return p.NextResponse.json({success:!0,emailsSent:l})}let g=new r.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/cron/send-reminders/route",pathname:"/api/cron/send-reminders",filename:"route",bundlePath:"app/api/cron/send-reminders/route"},resolvedPagePath:"/workspaces/projcet-2/src/app/api/cron/send-reminders/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:u,staticGenerationAsyncStorage:m,serverHooks:c}=g,f="/api/cron/send-reminders/route";function h(){return(0,n.patchFetch)({serverHooks:c,staticGenerationAsyncStorage:m})}}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),s=t.X(0,[9276,8456,5972,2591],()=>o(57466));module.exports=s})();