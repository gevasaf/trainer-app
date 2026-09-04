// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { CLR, todayKey, weekStart, dayTotals, round1, buildEODContext, buildMeasurementContext } from "../lib/utils";
import { storageGet, storageSet } from "../lib/storage";
import { callAssistant } from "../lib/api";
import { ConfirmModal } from "./ui";
import { DashboardTab } from "./DashboardTab";
import { WeeklyTab } from "./WeeklyTab";
import { TimelineTab } from "./TimelineTab";
import { AssistantTab } from "./AssistantTab";
import { LogTab } from "./LogTab";
import { JourneysModal } from "./JourneysModal";

declare const __APP_VERSION__: string;

function MenuDropdown({t,lang,toggleLang,onNewJourney,onPastJourneys,journeysCount,onLogout,onClose}){
  const row=(label,right,onClick,red=false)=>(
    <button onClick={onClick} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",background:"none",border:"none",borderTop:"1px solid "+CLR.border,padding:"12px 16px",cursor:"pointer",color:red?CLR.red:CLR.text,fontSize:14,gap:16}}>
      <span>{label}</span><span style={{color:red?CLR.red:CLR.muted,fontSize:13,whiteSpace:"nowrap"}}>{right}</span>
    </button>);
  const side=t.dir==="rtl"?{right:0}:{left:0};
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:299}}/>
      <div style={{position:"absolute",top:"calc(100% + 6px)",...side,zIndex:300,background:CLR.card,borderRadius:12,border:"1px solid "+CLR.border,minWidth:240,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",overflow:"hidden"}}>
        {row(t.language, lang==="en"?"🇮🇱 עברית":"🇺🇸 English", toggleLang)}
        {row("🗂 "+t.pastJourneys, journeysCount>0?String(journeysCount):"→", onPastJourneys)}
        {row("✨ "+t.newJourney, "→", onNewJourney)}
        {row("🚪 "+t.logout, "→", onLogout)}
      </div>
    </>
  );
}

export function MainApp({data,t,lang,toggleLang,onLogout,greetOnMount,journeys,onStartNewJourney,onViewJourney,onDeleteJourney}){
  const [tab,setTab]=useState(0);
  const [entries,setEntries]=useState([]);
  const [bodyPoints,setBodyPoints]=useState([]);
  const [chatHistory,setChatHistory]=useState([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [storeReady,setStoreReady]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const [journeysOpen,setJourneysOpen]=useState(false);
  const [confirmNewJourney,setConfirmNewJourney]=useState(false);
  const [assistantStatus,setAssistantStatus]=useState(null);
  const lastEODCheck=useRef(null);

  function startNewJourney(){
    setConfirmNewJourney(false);
    setMenuOpen(false);
    onStartNewJourney({appData:data,entries,bodyPoints,chatHistory});
  }

  useEffect(()=>{
    (async()=>{
      try{
        const e=await storageGet("entries"); if(e?.value)setEntries(JSON.parse(e.value));
        const b=await storageGet("bodyPoints"); if(b?.value)setBodyPoints(JSON.parse(b.value));
        const c=await storageGet("chatHistory"); if(c?.value)setChatHistory(JSON.parse(c.value));
      }catch(er){}
      setStoreReady(true);
    })();
  },[]);

  useEffect(()=>{ if(!storeReady)return; storageSet("entries",JSON.stringify(entries)).catch(()=>{}); },[entries,storeReady]);
  useEffect(()=>{ if(!storeReady)return; storageSet("bodyPoints",JSON.stringify(bodyPoints)).catch(()=>{}); },[bodyPoints,storeReady]);
  const chatSaveTimer=useRef(null);
  useEffect(()=>{
    if(!storeReady)return;
    if(chatSaveTimer.current) clearTimeout(chatSaveTimer.current);
    chatSaveTimer.current=setTimeout(()=>{ storageSet("chatHistory",JSON.stringify(chatHistory)).catch(()=>{}); },1500);
    return()=>clearTimeout(chatSaveTimer.current);
  },[chatHistory,storeReady]);

  useEffect(()=>{
    if(!storeReady||!greetOnMount)return;
    setAssistantStatus("thinking");
    callAssistant("greeting",null,[],data,entries,bodyPoints,null)
      .then(res=>{if(res?.text){setChatHistory([{role:"assistant",content:res.text,ts:Date.now()}]);setUnreadCount(1);}}) 
      .catch(()=>{})
      .finally(()=>setAssistantStatus(null));
  },[storeReady]);

  useEffect(()=>{
    if(!storeReady)return;
    const today=todayKey();
    if(lastEODCheck.current===today)return;
    lastEODCheck.current=today;
    const daysWithEntries=[...new Set(entries.filter(e=>e.date<today&&e.type!=="eod").map(e=>e.date))].sort();
    if(!daysWithEntries.length)return;
    const lastDay=daysWithEntries[daysWithEntries.length-1];
    if(entries.some(e=>e.date===lastDay&&e.type==="eod"))return;
    const eodEntry={type:"eod",date:lastDay,ts:new Date(lastDay+"T23:59:00").getTime(),label:"Auto end-of-day recorded",auto:true};
    setEntries(prev=>[...prev,eodEntry]);
    triggerEODEvent(eodEntry,[...entries,eodEntry]);
  },[storeReady]);

  async function triggerEODEvent(eodEntry, allEntries) {
    setAssistantStatus("thinking");
    const dateKey=eodEntry.date;
    const isNewWeek = weekStart(dateKey) !== weekStart(todayKey());
    const eodCtx=buildEODContext(allEntries,dateKey,data.goals,isNewWeek,allEntries,eodEntry.auto??false);
    const dt=dayTotals(allEntries,dateKey);
    const eventCard={role:"event",eventType:"eod",data:{...dt,net:Math.round(dt.cal-dt.burned)},date:dateKey,ts:eodEntry.ts};
    let newHistory=[...chatHistory,eventCard];
    if(isNewWeek){
      const ws=weekStart(dateKey);
      const days=[...new Set(allEntries.filter(e=>weekStart(e.date)===ws).map(e=>e.date))].sort();
      const tots=days.map(d=>dayTotals(allEntries,d));
      const avg=k=>round1(tots.reduce((s,d)=>s+(d[k]||0),0)/Math.max(tots.length,1));
      const avgNet=round1(tots.reduce((s,d)=>s+(d.cal-d.burned),0)/Math.max(tots.length,1));
      newHistory=[...newHistory,{role:"event",eventType:"week",data:{cal:avg("cal"),protein:avg("protein"),carbs:avg("carbs"),fat:avg("fat"),fiber:avg("fiber"),water:avg("water"),burned:avg("burned"),net:avgNet},ts:eodEntry.ts}];
    }
    setChatHistory(newHistory);
    try{
      const res=await callAssistant("eod",null,newHistory,data,allEntries,[],eodCtx);
      setChatHistory(h=>[...h,{role:"assistant",content:res.text,ts:Date.now()}]);
      setUnreadCount(c=>c+1);
    }catch(e){}
    setAssistantStatus(null);
  }

  async function handleMeasurement(pt){
    setAssistantStatus("thinking");
    const ctx=buildMeasurementContext(bodyPoints,pt);
    const eventCard={role:"event",eventType:"measurement",data:pt,ts:pt.ts};
    const newHistory=[...chatHistory,eventCard];
    setChatHistory(newHistory);
    try{
      const res=await callAssistant("measurement",null,newHistory,data,entries,[...bodyPoints,pt],ctx);
      setChatHistory(h=>[...h,{role:"assistant",content:res.text,ts:Date.now()}]);
      setUnreadCount(c=>c+1);
    }catch(e){}
    setAssistantStatus(null);
  }

  const tabs=[t.today,t.week,t.timeline,t.assistant,t.log];

  return(
    <div style={{height:"100dvh",background:CLR.bg,color:CLR.text,fontFamily:"system-ui,sans-serif",direction:t.dir,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden"}}>
      {confirmNewJourney&&<ConfirmModal title={t.newJourneyTitle} message={t.newJourneyMsg} confirmText={t.newJourneyConfirm} onConfirm={startNewJourney} onCancel={()=>setConfirmNewJourney(false)}/>}
      {journeysOpen&&<JourneysModal t={t} lang={lang} journeys={journeys||[]} onView={j=>{setJourneysOpen(false);onViewJourney(j);}} onDelete={id=>onDeleteJourney(id)} onClose={()=>setJourneysOpen(false)}/>}

      {/* Header */}
      <div style={{width:"100%",maxWidth:680,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:menuOpen?CLR.purple:"none",border:"1px solid "+(menuOpen?CLR.purple:CLR.border),color:menuOpen?"#fff":CLR.muted,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:16,lineHeight:1.4,flexShrink:0}}>☰</button>
            {menuOpen&&<MenuDropdown t={t} lang={lang} toggleLang={()=>{toggleLang();setMenuOpen(false);}} journeysCount={(journeys||[]).length} onPastJourneys={()=>{setJourneysOpen(true);setMenuOpen(false);}} onNewJourney={()=>{setConfirmNewJourney(true);setMenuOpen(false);}} onLogout={onLogout} onClose={()=>setMenuOpen(false)}/>}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>{"👋 "+data.profile.name}</div>
            <div style={{fontSize:11,color:CLR.muted,display:"flex",gap:6,alignItems:"center"}}>
              <span>{new Date().toLocaleDateString(lang==="he"?"he-IL":"en-US",{weekday:"long",month:"long",day:"numeric"})}</span>
              <span style={{opacity:0.4}}>·</span>
              <span style={{opacity:0.5}}>{"v"+ __APP_VERSION__}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{width:"100%",maxWidth:680,flexShrink:0,display:"flex",borderBottom:"1px solid "+CLR.border,margin:"10px 0 0",padding:"0 8px",overflowX:"auto"}}>
        {tabs.map((tb,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{background:"none",border:"none",color:tab===i?CLR.purple:CLR.muted,borderBottom:tab===i?"2px solid "+CLR.purple:"2px solid transparent",padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:tab===i?600:400,whiteSpace:"nowrap",flexShrink:0,position:"relative"}}>
            {tb}
            {i===3&&unreadCount>0&&tab!==3&&(
              <span style={{position:"absolute",top:6,right:4,background:CLR.red,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{unreadCount}</span>)}
          </button>))}
      </div>

      {/* Content area — each tab manages its own scroll */}
      <div style={{width:"100%",maxWidth:680,flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab===0&&<DashboardTab t={t} appData={data} entries={entries} setEntries={setEntries} onEOD={triggerEODEvent} deleteEntry={ts=>setEntries(prev=>prev.filter(e=>e.ts!==ts))}/>}
        {tab===1&&<WeeklyTab t={t} appData={data} entries={entries} lang={lang}/>}
        {tab===2&&<TimelineTab t={t} appData={data} bodyPoints={bodyPoints} setBodyPoints={setBodyPoints} onMeasurement={handleMeasurement} lang={lang} deleteBodyPoint={ts=>setBodyPoints(prev=>prev.filter(p=>p.ts!==ts))}/>}
        {tab===3&&<AssistantTab t={t} appData={data} entries={entries} bodyPoints={bodyPoints} chatHistory={chatHistory} setChatHistory={setChatHistory} unreadCount={unreadCount} setUnreadCount={setUnreadCount} lang={lang} status={assistantStatus} setStatus={setAssistantStatus}/>}
        {tab===4&&<LogTab t={t} entries={entries} bodyPoints={bodyPoints} profile={data.profile} deleteEntry={ts=>setEntries(prev=>prev.filter(e=>e.ts!==ts))} deleteBodyPoint={ts=>setBodyPoints(prev=>prev.filter(p=>p.ts!==ts))}/>}
      </div>
    </div>
  );
}
