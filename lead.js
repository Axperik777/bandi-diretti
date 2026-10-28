export function validateLead(data){
 if(typeof data.name!=='string'||data.name.trim().length<2||data.name.length>100)return {field:'name',message:'Inserisci il tuo nome.'};
 if(typeof data.phone!=='string'||!/^[+\d\s().-]{6,35}$/.test(data.phone)||data.phone.replace(/\D/g,'').length<6||data.phone.replace(/\D/g,'').length>15)return {field:'phone',message:'Inserisci un numero di telefono valido, completo di prefisso.'};
 if(typeof data.email!=='string'||data.email.length>180||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))return {field:'email',message:'Inserisci un indirizzo email valido.'};
 if(typeof data.sector!=='string'||data.sector.trim().length<2||data.sector.length>150)return {field:'sector',message:'Indica il settore in cui opera la tua impresa.'};
 if(data.website)return {field:'website',message:'Impossibile preparare questa richiesta.'};return null;
}
export function composeRequest(data,attribution={}){const rows=['Buongiorno,','vorrei essere ricontattato per un primo confronto sui bandi UE a gestione diretta.','','Nome: '+data.name,'Telefono: '+data.phone,'Email: '+data.email,'Settore di attività: '+data.sector,'','Grazie.'];const safeKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term','fbclid','gclid','msclkid'];const tags=Object.entries(attribution).filter(([key,value])=>safeKeys.includes(key)&&typeof value==='string').map(([key,value])=>key+': '+value.replace(/[\r\n]/g,' ').slice(0,200));if(tags.length)rows.push('','Riferimenti della richiesta:',...tags);return rows.join('\n')}
export function buildMailto(email,subject,body){return 'mailto:'+email+'?subject='+encodeURIComponent(subject.replace(/[\r\n]/g,' '))+'&body='+encodeURIComponent(body)}
