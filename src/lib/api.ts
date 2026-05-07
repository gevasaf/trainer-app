// @ts-nocheck
import { getSession } from "./supabase";

export async function fetchWithRetry(url, options, retries=3, baseDelay=1000) {
  for(let i=0;i<retries;i++){
    try{
      const res = await fetch(url, options);
      if(res.ok || res.status < 500) return res; // don't retry 4xx
      if(i===retries-1) return res;
    }catch(e){
      if(i===retries-1) throw e;
    }
    await new Promise(r=>setTimeout(r, baseDelay * 2**i));
  }
}
export async function parseFood(desc) {
  const session = await getSession();
  const res = await fetchWithRetry("/api/analyze", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({type:"food",description:desc}),
  });
  return res.json();
}
export async function parseActivity(desc, weightKg) {
  const session = await getSession();
  const res = await fetchWithRetry("/api/analyze", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({type:"activity",description:desc,weightKg}),
  });
  return res.json();
}
export async function callAssistant(mode, userMsg, chatHistory, appData, allEntries, bodyPoints, eventContext) {
  const session = await getSession();
  const now = new Date();
  const clientNow = now.toLocaleString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const utcOffset = -now.getTimezoneOffset(); // minutes east of UTC
  const todayISO = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");
  const res = await fetchWithRetry("/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({mode,userMsg,chatHistory,appData,allEntries,bodyPoints,eventContext,clientNow,utcOffset,todayISO}),
  });
  return res.json();
}
