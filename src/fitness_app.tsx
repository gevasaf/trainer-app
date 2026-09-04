// @ts-nocheck
import React, { useState, useEffect } from "react";
import { CLR } from "./lib/utils";
import { T } from "./i18n";
import { storageGet, storageSet, getJourneys, archiveCurrentJourney, saveJourneys } from "./lib/storage";
import { supabase } from "./lib/supabase";
import { SetupFlow } from "./components/SetupFlow";
import { MainApp } from "./components/MainApp";
import { JourneyView } from "./components/JourneyView";

export default function FitnessApp(){
  const [lang,setLang]=useState("en");
  const [appData,setAppData]=useState(null);
  const [journeys,setJourneys]=useState([]);
  const [viewJourney,setViewJourney]=useState(null);
  const [ready,setReady]=useState(false);
  const [greetOnMount,setGreetOnMount]=useState(false);
  const t=T[lang];
  const toggleLang=()=>setLang(l=>l==="en"?"he":"en");
  useEffect(()=>{
    (async()=>{
      try{const r=await storageGet("appData"); if(r?.value)setAppData(JSON.parse(r.value));}catch(e){}
      try{setJourneys(await getJourneys());}catch(e){}
      setReady(true);
    })();
  },[]);
  async function handleComplete(data){
    setAppData(data);
    setGreetOnMount(true);
    try{await storageSet("appData",JSON.stringify(data));}catch(e){}
  }
  async function handleStartNewJourney(current){
    const journey={
      id:(globalThis.crypto?.randomUUID?.()||("j"+Date.now())),
      name:current.appData?.profile?.name||"",
      startDate:current.appData?.goals?.startDate||null,
      archivedAt:Date.now(),
      appData:current.appData,
      entries:current.entries||[],
      bodyPoints:current.bodyPoints||[],
      chatHistory:current.chatHistory||[],
    };
    try{
      await archiveCurrentJourney(journey);   // archives + clears active data in one write
    }catch(e){
      alert("Couldn't start a new journey — your data was not changed. Please check your connection and try again.");
      return;
    }
    setJourneys(prev=>[...prev,journey]);
    setGreetOnMount(false);
    setAppData(null);                 // -> SetupFlow for the fresh journey
  }
  async function handleDeleteJourney(id){
    const next=journeys.filter(j=>j.id!==id);
    setJourneys(next);
    if(viewJourney?.id===id) setViewJourney(null);
    try{await saveJourneys(next);}catch(e){}
  }
  async function handleLogout(){await supabase.auth.signOut();}
  if(!ready)return<div style={{minHeight:"100dvh",background:CLR.bg,display:"flex",alignItems:"center",justifyContent:"center",color:CLR.muted,fontSize:14}}>Loading…</div>;
  if(viewJourney)return<JourneyView journey={viewJourney} t={t} lang={lang} toggleLang={toggleLang} onBack={()=>setViewJourney(null)}/>;
  if(!appData)return<SetupFlow onComplete={handleComplete} t={t} lang={lang} toggleLang={toggleLang}/>;
  return<MainApp data={appData} t={t} lang={lang} toggleLang={toggleLang} onLogout={handleLogout} greetOnMount={greetOnMount} journeys={journeys} onStartNewJourney={handleStartNewJourney} onViewJourney={setViewJourney} onDeleteJourney={handleDeleteJourney}/>;
}
