// Cloudflare Pages deployment refresh; no functional changes.
(()=>{"use strict";
function init(){
 const forms=[...document.querySelectorAll("form.mw-contact-form")];
 if(!forms.length)return;
 const widgets=new Map();
 let ready=false,failed="";
 function notice(form,msg,error=false){const el=form.querySelector(".mw-status");el.textContent=msg;el.classList.toggle("is-error",error);}
 function fail(msg){failed=msg;for(const form of forms)notice(form,msg,true);}
 (async()=>{
  try{
   const configResponse=await fetch("/api/contact",{cache:"no-store"});
   if(!configResponse.ok)throw Error("Contact service is unavailable. Please try again later.");
   const config=await configResponse.json();
   if(!config.turnstileSiteKey)throw Error("Contact security has not been configured.");
   const script=document.createElement("script");
   script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
   script.async=true;
   script.onerror=()=>fail("Security verification could not load. Please refresh.");
   script.onload=()=>{
    try{for(const form of forms)widgets.set(form,window.turnstile.render(form.querySelector(".mw-turnstile"),{sitekey:config.turnstileSiteKey,theme:"auto"}));ready=true;}
    catch(e){fail("Security verification failed to initialize. Please refresh.");console.error(e);}
   };
   document.head.appendChild(script);
  }catch(e){fail(e.message||"Contact service is unavailable.");console.error(e);}
 })();
 for(const form of forms)form.addEventListener("submit",async event=>{
  event.preventDefault();event.stopImmediatePropagation();
  const data=Object.fromEntries(new FormData(form));
  for(const field of ["name","email","phone","subject","message"])data[field]=String(data[field]||"").trim();
  if(!data.name||!data.email||!data.phone||!data.subject||!data.message){notice(form,"Please complete all required fields.",true);return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)){notice(form,"Please enter a valid email address.",true);return;}
  const digits=data.phone.replace(/\D/g,"");
  if(digits.length<7||digits.length>15){notice(form,"Please enter a valid phone number.",true);return;}
  if(!ready||!window.turnstile||!widgets.has(form)){notice(form,failed||"Security verification is loading.",true);return;}
  const widget=widgets.get(form),token=window.turnstile.getResponse(widget);
  if(!token){notice(form,"Please complete the security check.",true);return;}
  const button=form.querySelector(".mw-send");button.disabled=true;notice(form,"Sending your message…");
  try{
   const response=await fetch("/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,turnstileToken:token})});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.ok)throw Error(result.error||"Message could not be sent. Please try again.");
   form.querySelector(".mw-form-fields").hidden=true;
   const confirmation=form.querySelector(".mw-confirmation");confirmation.hidden=false;confirmation.focus({preventScroll:true});
  }catch(error){notice(form,error.message||"Message could not be sent.",true);window.turnstile.reset(widget);}
  finally{button.disabled=false;}
 },true);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();