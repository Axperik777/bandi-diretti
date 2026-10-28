import {config} from './config.js';
import {validateLead,composeRequest,buildMailto} from './lead.js';
const $=(s)=>document.querySelector(s); const $$=(s)=>[...document.querySelectorAll(s)];
const storage={get(key){try{return localStorage.getItem(key)}catch{return null}},set(key,value){try{localStorage.setItem(key,value)}catch{}}};
let consent={analytics:false,marketing:false};try{const saved=JSON.parse(storage.get('bd-consent-v1'));if(saved)consent={analytics:saved.analytics===true,marketing:saved.marketing===true}}catch{}
const params=new URLSearchParams(location.search);const tagKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];const clickKeys=['fbclid','gclid','msclkid'];const attribution={};
function syncAttribution(){
 const keys=[...(consent.analytics||consent.marketing?tagKeys:[]),...(consent.marketing?clickKeys:[])];
 for(const k of [...tagKeys,...clickKeys])delete attribution[k];
 let cached={};try{cached=JSON.parse(sessionStorage.getItem('bd-attribution')||'{}')}catch{}
 for(const key of keys){const value=params.get(key)||cached[key];if(typeof value==='string')attribution[key]=value.slice(0,200)}
 try{if(keys.length)sessionStorage.setItem('bd-attribution',JSON.stringify(attribution));else sessionStorage.removeItem('bd-attribution')}catch{}
}
syncAttribution();window.dataLayer=window.dataLayer||[];
function track(event,properties={}){if(!consent.analytics&&!consent.marketing)return;const safe={event,...properties};window.dataLayer.push(safe);if(consent.analytics&&typeof window.gtag==='function'&&config.ga4Id)window.gtag('event',event,properties);if(consent.marketing&&typeof window.fbq==='function'&&config.metaPixelId&&event!=='lead_received')window.fbq('trackCustom',event,properties)}
function injectScript(src){const script=document.createElement('script');script.async=true;script.src=src;document.head.append(script)}
let analyticsLoaded=false,marketingLoaded=false,gtmLoaded=false;
function applyTracking(){
 if(consent.analytics&&config.ga4Id&&!analyticsLoaded){analyticsLoaded=true;window.gtag=function(){window.dataLayer.push(arguments)};window.gtag('js',new Date());window.gtag('config',config.ga4Id,{send_page_view:true});injectScript('https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(config.ga4Id))}
 if(consent.marketing&&config.metaPixelId&&!marketingLoaded){marketingLoaded=true;const fbq=function(){fbq.callMethod?fbq.callMethod.apply(fbq,arguments):fbq.queue.push(arguments)};fbq.queue=[];fbq.loaded=true;fbq.version='2.0';window.fbq=fbq;window._fbq=fbq;fbq('init',config.metaPixelId);fbq('track','PageView');injectScript('https://connect.facebook.net/en_US/fbevents.js')}
 // GTM containers must enforce the same consent categories. Direct GA4/Meta IDs and GTM are mutually exclusive deployment choices.
 if(consent.analytics&&consent.marketing&&config.gtmId&&!gtmLoaded){gtmLoaded=true;window.dataLayer.push({'gtm.start':Date.now(),event:'gtm.js'});injectScript('https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(config.gtmId))}
}
applyTracking();
const consentDialog=$('#privacy-dialog');function openPreferences(){ $('#consent-analytics').checked=consent.analytics;$('#consent-marketing').checked=consent.marketing;consentDialog.showModal() }
function saveConsent(next){const revoke=(consent.analytics&&!next.analytics)||(consent.marketing&&!next.marketing);consent=next;storage.set('bd-consent-v1',JSON.stringify(next));syncAttribution();$('#cookie-banner').hidden=true;consentDialog.close();if(revoke&&(analyticsLoaded||marketingLoaded||gtmLoaded)){location.reload();return}applyTracking()}
$('#privacy-settings').addEventListener('click',openPreferences);$('#cookie-customize').addEventListener('click',openPreferences);$('#save-consent').addEventListener('click',()=>saveConsent({analytics:$('#consent-analytics').checked,marketing:$('#consent-marketing').checked}));$('#reject-consent').addEventListener('click',()=>saveConsent({analytics:false,marketing:false}));$('#cookie-reject').addEventListener('click',()=>saveConsent({analytics:false,marketing:false}));$('#cookie-accept').addEventListener('click',()=>saveConsent({analytics:true,marketing:true}));
if((config.ga4Id||config.metaPixelId||config.gtmId)&&!storage.get('bd-consent-v1'))$('#cookie-banner').hidden=false;
$$('[data-cta]').forEach(el=>el.addEventListener('click',()=>track('cta_clicked',{placement:el.dataset.cta})));

const menu=$('.menu-toggle');
function closeMenu(){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Apri menu');$('.nav').classList.remove('is-open')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');$('.nav').classList.toggle('is-open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});$$('.nav a').forEach(a=>a.addEventListener('click',closeMenu));
$$('a[href^="mailto:"]').filter(a=>a.id!=='email-send').forEach(a=>a.addEventListener('click',()=>track('contact_email_clicked',{page:document.body.dataset.route})));
$$('dialog .dialog-close').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));$$('dialog').forEach(dialog=>dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const box=dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)dialog.close()}));
const form=$('#lead-form');
if(form){
 let started=false,sending=false,eventId=null,requestBody='';
 form.addEventListener('input',()=>{if(!started){started=true;track('form_started')}$('#form-error').textContent='';for(const input of form.querySelectorAll('[aria-invalid]')){input.removeAttribute('aria-invalid');input.removeAttribute('aria-describedby')}});
 if(config.leadEndpoint){$('#submit-button').textContent='Richiedi un primo contatto';$('.privacy-explainer').replaceChildren(document.createTextNode('Prima di inviare consulta le '));const a=document.createElement('a');a.href='/bandi-diretti/privacy.html';a.textContent='informazioni sulla privacy.';$('.privacy-explainer').append(a)}
 form.addEventListener('submit',async e=>{e.preventDefault();if(sending)return;const raw=Object.fromEntries(new FormData(form));const data={website:String(raw.website||'')};for(const key of ['name','phone','email','sector'])data[key]=String(raw[key]||'').trim();const error=validateLead(data);if(error){$('#form-error').textContent=error.message;const invalid=form.elements[error.field];invalid?.setAttribute('aria-invalid','true');invalid?.setAttribute('aria-describedby','form-error');invalid?.focus();return}$('#form-error').textContent='';
  if(config.leadEndpoint){sending=true;$('#submit-button').disabled=true;$('#delivery-note').textContent='Invio in corso…';eventId??=crypto.randomUUID();try{const endpoint=new URL(config.leadEndpoint,location.origin);if(endpoint.protocol!=='https:'&&endpoint.origin!==location.origin)throw new Error('endpoint');const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,attribution,consent,event_id:eventId}),signal:controller.signal})}finally{clearTimeout(timeout)}const result=await response.json();if(!response.ok||result.accepted!==true)throw new Error('not-accepted');track('lead_received',{event_id:eventId});if(consent.marketing&&window.fbq&&config.metaPixelId)window.fbq('track','Lead',{}, {eventID:eventId});$('#delivery-note').textContent='Richiesta ricevuta. Ti contatteremo ai recapiti indicati.';form.reset();eventId=null;started=false;$('#submit-button').textContent='Richiesta ricevuta';}catch{$('#form-error').textContent='La richiesta non è stata confermata. Riprova oppure scrivi a '+config.email+'.';$('#delivery-note').textContent='Nessuna conferma di invio ricevuta.';$('#submit-button').disabled=false}finally{sending=false}return}
  requestBody=composeRequest(data,attribution);$('#request-preview').textContent=requestBody;$('#email-send').href=buildMailto(config.email,'Richiesta di primo contatto — '+data.name,requestBody);$('#copy-status').textContent='';$('#request-dialog').showModal();track('request_prepared');
 });
 $('#email-send').addEventListener('click',()=>track('email_handoff_opened'));
 $('.copy-request').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(requestBody);$('#copy-status').textContent='Messaggio copiato. Puoi incollarlo nella tua email.'}catch{$('#copy-status').textContent='Seleziona il testo e copialo manualmente.'}});
}
const sticky=$('.mobile-cta');const hero=$('.home-hero');const footer=$('.footer');let heroVisible=!!hero,footerVisible=false;
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.target===hero)heroVisible=entry.isIntersecting;if(entry.target===footer)footerVisible=entry.isIntersecting}sticky.classList.toggle('is-hidden',heroVisible||footerVisible)},{threshold:0});if(hero)observer.observe(hero);observer.observe(footer)}
if(hero)sticky.classList.add('is-hidden');
