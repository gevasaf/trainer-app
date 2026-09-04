// @ts-nocheck
import React, { useState, useEffect } from "react";
import { CLR } from "./lib/utils";
import { T } from "./i18n";
import { storageGet, storageSet, getJourneys, archiveAndStart, saveJourneys } from "./lib/storage";
import { supabase } from "./lib/supabase";
import { SetupFlow } from "./components/SetupFlow";
import { MainApp } from "./components/MainApp";
import { JourneyView } from "./components/JourneyView";

export default function FitnessApp(){
  const [lang,setLang]=useState("en");
  const [appData,setAppData]=useState(null);
  const [journeys,setJourneys]=useState([]);
  const [viewJourney,setViewJourney]=useState(null);
  // When the user chooses "Start new journey" we snapshot the current journey
  // here and show setup. Nothing is archived until they submit the new setup —
  // until then the current journey stays fully active and this is cancelable.
  const [pendingArchive,setPendingArchive]=useState(null);
  const [startingNew,setStartingNew]=useState(false);
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
  // Enter the "new journey" setup. Does NOT touch any data yet.
  function beginNewJourney(current){
    setPendingArchive(current);
    setStartingNew(true);
  }
  function cancelNewJourney(){
    setStartingNew(false);
    setPendingArchive(null);
  }
  // Setup submitted. If we're starting a new journey, archive the current one
  // and install the new setup as active — all on submit, in one write.
  async function handleComplete(data){
    if(startingNew&&pendingArchive){
      const cur=pendingArchive;
      const journey={
        id:(globalThis.crypto?.randomUUID?.()||("j"+Date.now())),
        name:cur.appData?.profile?.name||"",
        startDate:cur.appData?.goals?.startDate||null,
        archivedAt:Date.now(),
        appData:cur.appData,
        entries:cur.entries||[],
        bodyPoints:cur.bodyPoints||[],
        chatHistory:cur.chatHistory||[],
      };
      try{
        await archiveAndStart(journey,data);   // archive old + set new active + clear logs, one write
      }catch(e){
        alert("Couldn't start the new journey — your current data was not changed. Please check your connection and try again.");
        return;
      }
      setJourneys(prev=>[...prev,journey]);
      setPendingArchive(null);
      setStartingNew(false);
      setAppData(data);
      setGreetOnMount(true);
      return;
    }
    // First-ever setup
    setAppData(data);
    setGreetOnMount(true);
    try{await storageSet("appData",JSON.stringify(data));}catch(e){}
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
  if(startingNew||!appData)return<SetupFlow onComplete={handleComplete} onCancel={startingNew?cancelNewJourney:undefined} newJourney={startingNew} t={t} lang={lang} toggleLang={toggleLang}/>;
  return<MainApp data={appData} t={t} lang={lang} toggleLang={toggleLang} onLogout={handleLogout} greetOnMount={greetOnMount} journeys={journeys} onStartNewJourney={beginNewJourney} onViewJourney={setViewJourney} onDeleteJourney={handleDeleteJourney}/>;
}
