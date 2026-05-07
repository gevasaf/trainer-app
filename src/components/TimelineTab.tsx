// @ts-nocheck
import React, { useState } from "react";
import { CLR, todayKey, calcFatPct } from "../lib/utils";
import { Card, Btn, inp } from "./ui";
import { TimelineChart } from "./TimelineChart";

function BodyStatModal({t,profile,onSave,onClose}){
  const [fw,setFw]=useState(""),[fws,setFws]=useState("");
  function save(){
    if(!fw&&!fws)return;
    const w=parseFloat(fw)||null,ws=parseFloat(fws)||null;
    const fat=profile.height&&ws?calcFatPct(profile.gender,null,profile.height,ws)
      :w&&profile.height?calcFatPct(profile.gender,Math.round((w/((profile.height/100)**2))*10)/10):null;
    onSave({date:todayKey(),weight:w,waist:ws,fat,ts:Date.now()});
    onClose();
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:CLR.card,borderRadius:16,padding:20,width:"100%",maxWidth:420,border:"1px solid "+CLR.border}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:16,color:CLR.purple}}>⚖️ {t.recordWeight}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <div><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.weightLabel}</div><input type="number" value={fw} onChange={e=>setFw(e.target.value)} style={inp}/></div>
          <div><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.waistLabel}</div><input type="number" value={fws} onChange={e=>setFws(e.target.value)} style={inp}/></div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn onClick={save} disabled={!fw&&!fws} style={{flex:1}}>{t.save}</Btn>
          <Btn variant="ghost" onClick={onClose}>{t.cancel}</Btn>
        </div>
      </div>
    </div>
  );
}

export function TimelineTab({t,appData,bodyPoints,setBodyPoints,onMeasurement,lang}){
  const [showModal,setShowModal]=useState(false);
  const goals=appData.goals;
  function handleSave(pt){
    setBodyPoints(prev=>[...prev,pt]);
    onMeasurement(pt);
  }
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {showModal&&<BodyStatModal t={t} profile={appData.profile} onSave={handleSave} onClose={()=>setShowModal(false)}/>}

      {/* Fixed top: chart + targets + button */}
      <div style={{flexShrink:0,padding:"12px 16px 0"}}>
        <Card style={{padding:"12px 10px",marginBottom:10}}>
          <TimelineChart weeks={goals.durationWeeks} breakWeeks={goals.breakWeeks} startDate={new Date(goals.startDate)}
            goals={{deficit:goals.deficit,startWeight:goals.startWeight,startFat:goals.startFat||20,startWaist:goals.startWaist,workoutsPerWeek:goals.workoutsPerWeek||4,proteinPerKg:goals.proteinPerKg||1.8,gender:appData.profile.gender||"male"}}
            realPoints={bodyPoints} lang={lang}/>
        </Card>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:10}}>
          {[[t.targetWeight,goals.targetWeight,"kg",CLR.purple],[t.targetFat,goals.targetFat?goals.targetFat+"%":"--","",CLR.amber],[t.targetWaist,goals.targetWaist,"cm",CLR.teal]].map(([l,v,u,c])=>(
            <div key={l} style={{background:CLR.card,borderRadius:12,padding:"10px 6px",textAlign:"center",border:"1px solid "+CLR.border}}>
              <div style={{fontSize:10,color:CLR.muted,marginBottom:3}}>{l}</div>
              <div style={{fontSize:16,fontWeight:700,color:c}}>{v}</div>
              {u&&<div style={{fontSize:10,color:CLR.dim}}>{u}</div>}
            </div>))}
        </div>
        <Btn onClick={()=>setShowModal(true)} style={{width:"100%",marginBottom:10}}>⚖️ {t.recordWeight}</Btn>
      </div>

      {/* Scrollable history */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
        {bodyPoints.length>0&&<Card>
          {[...bodyPoints].reverse().map((p,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid "+CLR.border,fontSize:13}}>
              <span style={{color:CLR.muted}}>{p.date}</span>
              <div style={{display:"flex",gap:12}}>
                {p.weight&&<span style={{color:CLR.purple}}>{p.weight} kg</span>}
                {p.waist&&<span style={{color:CLR.teal}}>{p.waist} cm</span>}
                {p.fat&&<span style={{color:CLR.amber}}>{p.fat}%</span>}
              </div>
            </div>))}
        </Card>}
        {bodyPoints.length===0&&<div style={{textAlign:"center",color:CLR.dim,padding:"32px 0",fontSize:13}}>No measurements yet — record your first above.</div>}
      </div>
    </div>
  );
}
