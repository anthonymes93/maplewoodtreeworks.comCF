const reply=(data,status=200)=>Response.json(data,{status,headers:{"Cache-Control":"no-store"}});
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const validEmail=s=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)&&s.length<=254;
const validPhone=s=>{const digits=s.replace(/\D/g,"");return digits.length>=7&&digits.length<=15};
export const onRequestGet=({env})=>reply({turnstileSiteKey:env.TURNSTILE_SITE_KEY||null});
export async function onRequestPost({request,env}){
 try{
  if(!env.RESEND_API_KEY||!env.CONTACT_TO_EMAIL||!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET_KEY)return reply({error:"Contact service is not configured."},503);
  if(Number(request.headers.get("content-length")||0)>16000)return reply({error:"Request too large."},413);
  if(!request.headers.get("content-type")?.startsWith("application/json"))return reply({error:"Invalid request."},415);
  const origin=request.headers.get("origin");
  if(origin&&new URL(origin).host!==new URL(request.url).host)return reply({error:"Invalid origin."},403);
  const data=await request.json();
  if(!data||typeof data!=="object"||Array.isArray(data))return reply({error:"Invalid request."},400);
  if(data.company_site)return reply({ok:true});
  const clean=(value,max)=>typeof value==="string"?value.trim().slice(0,max+1):"";
  const name=clean(data.name,120),email=clean(data.email,254),phone=clean(data.phone,32),subject=clean(data.subject,200),message=clean(data.message,5000),token=clean(data.turnstileToken,2048);
  if(!name||name.length>120||!validEmail(email)||!phone||phone.length>32||!validPhone(phone)||!subject||subject.length>200||!message||message.length>5000)return reply({error:"Please complete all required fields with valid details."},400);
  if(!token||token.length>2048)return reply({error:"Please complete the security check."},400);
  const verifyResponse=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token,remoteip:request.headers.get("CF-Connecting-IP")||undefined})});
  if(!verifyResponse.ok)return reply({error:"Security verification is unavailable."},502);
  const verified=await verifyResponse.json();
  if(!verified.success||(verified.hostname&&verified.hostname!==new URL(request.url).hostname))return reply({error:"Security verification failed. Please try again."},403);
  const from=env.CONTACT_FROM_EMAIL||"emails@rtuino.com";
  if(!validEmail(from))return reply({error:"Sender email is not configured."},503);
  const row=(label,value)=>'<tr><td style="padding:12px 0;border-bottom:1px solid #e9edf3;color:#748198;width:105px;vertical-align:top;font-size:13px">'+label+'</td><td style="padding:12px 0;border-bottom:1px solid #e9edf3;color:#24354d;font-size:14px;font-weight:600;word-break:break-word">'+esc(value)+'</td></tr>';
  const emailAction='<a href="'+esc("mailto:"+email+"?subject=Re%3A%20Website%20Enquiries")+'" style="display:inline-block;background:#346aeb;color:#fff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:8px;margin:0 10px 10px 0">Reply to customer</a>';
  const callAction='<a href="'+esc("tel:"+phone.replace(/[^+\d]/g,""))+'" style="display:inline-block;background:#198657;color:#fff;text-decoration:none;font-weight:bold;padding:14px 20px;border-radius:8px">Call customer</a>';
  const html='<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:30px 12px;background:#f2f5f9;font-family:Arial,sans-serif;color:#243954"><div style="max-width:600px;margin:auto"><p style="font-size:14px;font-weight:bold;margin:0 0 18px">Maplewood Tree Works <span style="float:right;color:#8493a8;font-size:11px">WEBSITE ENQUIRIES</span></p><div style="background:#fff;border:1px solid #e3e8f1;border-radius:12px;overflow:hidden"><div style="height:5px;background:#346aeb"></div><div style="padding:30px 27px"><p style="font-size:11px;color:#346aeb;font-weight:bold;letter-spacing:1px">NEW WEBSITE MESSAGE</p><h1 style="font-size:27px;margin:14px 0 8px">You have a new enquiry.</h1><p style="font-size:14px;color:#77859b;margin:0 0 24px">A customer sent a message through Maplewood Tree Works.</p><table width="100%" role="presentation" cellpadding="0" cellspacing="0">'+row("Name",name)+row("Email",email)+row("Phone",phone)+row("Subject",subject)+'</table><p style="font-size:12px;color:#8090a4;font-weight:bold;letter-spacing:1px;margin:27px 0 12px">MESSAGE</p><div style="background:#f6f8fc;border:1px solid #e9eef5;padding:18px;border-radius:9px;line-height:1.7;font-size:14px;overflow-wrap:anywhere">'+esc(message).replace(/\r?\n/g,"<br>")+'</div><div style="margin-top:28px">'+emailAction+callAction+'</div></div></div><p style="font-size:12px;color:#8a97aa;text-align:center;margin-top:20px">Sent from maplewoodtreeworks.com</p></div></body></html>';
  const payload={from:"Website Enquiries <"+from+">",to:[env.CONTACT_TO_EMAIL],subject:"Maplewood Tree Works",html,text:"Maplewood Tree Works website enquiry\nName: "+name+"\nEmail: "+email+"\nPhone: "+phone+"\nSubject: "+subject+"\nMessage: "+message,reply_to:email};
  const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify(payload)});
  if(!sent.ok){console.error("Resend delivery issue",sent.status,await sent.text());return reply({error:"Unable to send your message. Please try again."},502);}
  return reply({ok:true});
 }catch(error){console.error("Contact form error",error);return reply({error:"Unable to send your message. Please try again."},500);}
}
