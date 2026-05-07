// @ts-nocheck
import React, { useState, useEffect } from "react";
import { CLR } from "./lib/utils";
import { T } from "./i18n";
import { storageGet, storageSet } from "./lib/storage";
import { SetupFlow } from "./components/SetupFlow";
import { MainApp } from "./components/MainApp";

export default function FitnessApp(){
  const [lang,setLang]=useState("en");
  const [appData,setAppData]=useState(null);
  const [ready,setReady]=useState(false);
  const [greetOnMount,setGreetOnMount]=useState(false);
  const t=T[lang];
  const toggleLang=()=>setLang(l=>l==="en"?"he":"en");
  useEffect(()=>{
    (async()=>{
      try{const r=await storageGet("appData"); if(r?.value)setAppData(JSON.parse(r.value));}catch(e){}
      setReady(true);
    })();
  },[]);
  async function handleComplete(data){
    setAppData(data);
    setGreetOnMount(true);
    try{await storageSet("appData",JSON.stringify(data));}catch(e){}
  }
  function handleReset(){setAppData(null);}
  if(!ready)return<div style={{minHeight:"100dvh",background:CLR.bg,display:"flex",alignItems:"center",justifyContent:"center",color:CLR.muted,fontSize:14}}>Loading…</div>;
  if(!appData)return<SetupFlow onComplete={handleComplete} t={t} lang={lang} toggleLang={toggleLang}/>;
  return<MainApp data={appData} t={t} lang={lang} toggleLang={toggleLang} onReset={handleReset} greetOnMount={greetOnMount}/>;
}
