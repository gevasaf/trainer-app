// @ts-nocheck
import React, { useState } from "react";
import { CLR, todayKey, weekStart, dayTotals, programWeekOf } from "../lib/utils";
import { parseFood, parseActivity } from "../lib/api";
import { Card, Btn, Ring, inp, InfoTip, ConfirmModal } from "./ui";

function AddEntryModal({type,t,weightKg,entries,onAdd,onClose}){
  const [text,setText]=useState(""),[loading,setLoading]=useState(false),[preview,setPreview]=useState(null);
  const [locked,setLocked]=useState(false);

  const suggestions=text.length>=2&&!locked
    ? [...new Map(
        (entries||[])
          .filter(e=>e.type===type&&(e.label||"").length<=100)
          .map(e=>[e.label.toLowerCase(),e])
      ).values()]
      .filter(e=>(e.label||"").toLowerCase().includes(text.toLowerCase()))
      .slice(0,6)
    : [];

  function previewFromEntry(e){
    if(type==="food") return{label:e.label,calories:e.calories,protein:e.protein,carbs:e.carbs,fat:e.fat,fiber:e.fiber,water:e.water};
    return{label:e.label,calories_burned:e.calories_burned,duration_min:e.duration_min};
  }

  function setField(field,val){setPreview(p=>({...p,[field]:parseFloat(val)||0}));}

  function pickSuggestion(e){setText(e.label);analyze(e.label);}

  async function runAI(txt){
    setLoading(true);
    try{
      if(type==="food"){const r=await parseFood(txt);setPreview({label:r.label||txt,calories:r.calories_kcal||r.calories,protein:r.protein_g,carbs:r.carbs_g,fat:r.fat_g,fiber:r.fiber_g,water:Math.round((r.water_ml||0)/1000*10)/10});}
      else{const r=await parseActivity(txt,weightKg);setPreview({label:r.label||txt,calories_burned:r.calories_burned,duration_min:r.duration_min});}
    }catch(e){setPreview({error:true});}
    setLoading(false);
  }

  async function analyze(txt){
    const s=String(txt||"").trim();
    if(!s)return;
    setLocked(true);
    const cached=(entries||[]).find(e=>e.type===type&&(e.label||"").toLowerCase()===s.toLowerCase());
    if(cached){setPreview(previewFromEntry(cached));return;}
    await runAI(s);
  }

  function confirm(){if(!preview||preview.error)return;onAdd({...preview,ts:Date.now(),date:todayKey()});onClose();}

  const numInp={background:"none",border:"none",textAlign:"center",fontSize:14,fontWeight:700,padding:0,outline:"none",width:"100%"};
  const nf=(ico,field,unit,color)=>(
    <div key={field} style={{textAlign:"center",background:CLR.card,borderRadius:8,padding:"6px 4px"}}>
      <div style={{fontSize:12}}>{ico}</div>
      <input type="number" value={preview?.[field]??0} onChange={ev=>setField(field,ev.target.value)} style={{...numInp,color}}/>
      <div style={{fontSize:10,color:CLR.dim}}>{unit}</div>
    </div>
  );

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:16}}>
      <div style={{background:CLR.card,borderRadius:16,padding:20,width:"100%",maxWidth:420,border:"1px solid "+CLR.border}}>
        <div style={{fontSize:15,fontWeight:600,marginBottom:14,color:CLR.purple,display:"flex",alignItems:"center",gap:6}}>{type==="food"?t.addFood:t.addActivity}{type==="activity"&&<InfoTip text={t.activityLogInfo}/>}</div>

        <textarea value={text} onChange={ev=>{if(!locked)setText(ev.target.value);}} readOnly={locked}
          placeholder={type==="food"?t.describeFood:t.describeActivity} rows={3}
          style={{...inp,resize:"none",marginBottom:4,fontSize:13,opacity:locked?0.55:1}}/>

        {suggestions.length>0&&(
          <div style={{background:CLR.card2,border:"1px solid "+CLR.border,borderRadius:10,marginBottom:8,overflow:"hidden"}}>
            {suggestions.map((sg,i)=>(
              <button key={i} onClick={()=>pickSuggestion(sg)}
                style={{display:"block",width:"100%",textAlign:"left",background:"none",border:"none",borderTop:i?("1px solid "+CLR.border):"none",color:CLR.text,padding:"8px 12px",cursor:"pointer",fontSize:13}}>
                {sg.label}
              </button>))}
          </div>)}

        {!locked&&<Btn onClick={()=>analyze(text)} disabled={!text.trim()} style={{width:"100%",marginBottom:8}}>✨ Analyze</Btn>}
        {locked&&!preview&&<div style={{textAlign:"center",color:CLR.muted,fontSize:13,marginBottom:8,padding:"8px 0"}}>{t.analyzing}</div>}

        {preview&&!preview.error&&(
          <div style={{background:CLR.card2,borderRadius:10,padding:12,marginBottom:12,fontSize:13}}>
            <div style={{fontWeight:600,marginBottom:8,color:CLR.text}}>{preview.label}</div>
            {type==="food"
              ?<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {nf("🔥","calories","kcal",CLR.purple)}
                {nf("💪","protein","g prot",CLR.green)}
                {nf("🌾","carbs","g carbs",CLR.amber)}
                {nf("🥑","fat","g fat",CLR.red)}
                {nf("🌿","fiber","g fiber",CLR.teal)}
                {nf("💧","water","L",CLR.blue)}
              </div>
              :<div style={{display:"flex",gap:12}}>
                {nf("🔥","calories_burned","kcal burned",CLR.amber)}
                {nf("⏱","duration_min","minutes",CLR.blue)}
              </div>}
          </div>)}

        {preview?.error&&<div style={{color:CLR.red,fontSize:13,marginBottom:8}}>Failed to analyze.</div>}

        <div style={{display:"flex",gap:8}}>
          {locked&&<Btn variant="ghost" onClick={()=>runAI(text)} disabled={loading}>🔄 {loading?t.analyzing:"Recalculate"}</Btn>}
          {preview&&!preview.error&&<Btn onClick={confirm} style={{flex:1}}>{t.add}</Btn>}
          <Btn variant="ghost" onClick={onClose}>{t.cancel}</Btn>
        </div>
      </div>
    </div>
  );
}

export function DashboardTab({t,appData,entries,setEntries,onEOD}){
  const [modal,setModal]=useState(null);
  const [eodConfirm,setEodConfirm]=useState(false);
  const goals=appData.goals.nutrition;
  const today=todayKey();
  const todayEntries=entries.filter(e=>e.date===today);
  const eod=todayEntries.find(e=>e.type==="eod");
  const tots=dayTotals(entries,today);
  const net=Math.round(tots.cal-tots.burned);
  function addEntry(entry){setEntries(prev=>[...prev,entry]);}
  function markEOD(){
    const eodEntry={type:"eod",date:today,ts:Date.now(),label:t.endOfDayMsg};
    setEntries(prev=>[...prev,eodEntry]);
    onEOD(eodEntry,entries);
    setEodConfirm(false);
  }
  const wkStart=weekStart(today);
  const weekWorkouts=[...new Set(entries.filter(e=>e.type==="activity"&&e.date>=wkStart&&e.date<=today).map(e=>e.date))].length;
  const currentWeek=programWeekOf(appData.goals.startDate,today);
  const isBreakWeek=currentWeek!=null&&(appData.goals.breakWeeks||[]).includes(currentWeek);
  const breakCal=Math.round(goals.targetCal+(appData.goals.deficit||0)*1.5);
  const effectiveCal=isBreakWeek?breakCal:goals.targetCal;
  const workoutTarget=isBreakWeek?Math.floor((appData.goals.workoutsPerWeek||0)/2):(appData.goals.workoutsPerWeek||0);
  const rings=[
    {label:t.calories,value:net,max:effectiveCal,color:CLR.purple,unit:""},
    {label:t.protein,value:tots.protein,max:goals.protein,color:CLR.green,unit:"g"},
    {label:t.carbs,value:tots.carbs,max:goals.carbs,color:CLR.amber,unit:"g"},
    {label:t.fat,value:tots.fat,max:goals.fat,color:CLR.red,unit:"g"},
    {label:t.fiber,value:tots.fiber,max:goals.fiber,color:CLR.teal,unit:"g"},
    {label:t.water,value:tots.water,max:goals.water,color:CLR.blue,unit:"L"},
  ];
  const typeIcon={food:"🍽",activity:"🏃",eod:"🌙",body:"⚖️"};
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {modal&&<AddEntryModal type={modal} t={t} weightKg={appData.profile.weight} entries={entries} onAdd={e=>addEntry({...e,type:modal})} onClose={()=>setModal(null)}/>}
      {eodConfirm&&<ConfirmModal title={t.eodConfirmTitle} message={t.eodConfirmMsg} confirmText={t.eodConfirmBtn} onConfirm={markEOD} onCancel={()=>setEodConfirm(false)}/>}

      {/* Fixed top: stats + rings + actions */}
      <div style={{flexShrink:0,padding:"12px 16px 0"}}>
        {isBreakWeek&&<div style={{background:"#0a1f3d",border:"1px solid #1e4a8f",borderRadius:12,padding:"10px 14px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:CLR.blue,marginBottom:2}}>🌊 Break Week {currentWeek}</div>
            <div style={{fontSize:11,color:"#7bafd4"}}>+{Math.round((appData.goals.deficit||0)/2)} kcal surplus · {workoutTarget} workout{workoutTarget!==1?"s":""} · Keep logging normally</div>
          </div>
          <InfoTip below text={`Break weeks use a small calorie surplus (your deficit ÷ 2 = +${Math.round((appData.goals.deficit||0)/2)} kcal/day, target ${breakCal} kcal) and half your usual workouts (${workoutTarget} this week) to let your body recover while minimising fat gain. Keep logging food and activity as normal — the targets above already reflect this week's goals.`}/>
        </div>}
        <Card style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px"}}>
          {[[t.eaten,Math.round(tots.cal),"kcal",CLR.purple],[t.burned,Math.round(tots.burned),"kcal",CLR.amber],[t.net,net,"kcal",net>effectiveCal?CLR.red:CLR.green]].map(([l,v,u,c])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:11,color:CLR.muted}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:CLR.dim}}>{u}</div></div>))}
        </Card>
        <Card style={{marginBottom:10,padding:"12px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:6}}>{rings.map(r=><Ring key={r.label} {...r}/>)}</div>
        </Card>
        {workoutTarget>0&&<Card style={{marginBottom:10,padding:"10px 14px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:12,color:CLR.muted}}>🏋️ Workouts this week</span>
            <span style={{fontSize:12,fontWeight:600,color:weekWorkouts>=workoutTarget?CLR.green:CLR.muted}}>{weekWorkouts} / {workoutTarget}</span>
          </div>
          <div style={{display:"flex",gap:4}}>
            {Array.from({length:workoutTarget},(_,i)=>(
              <div key={i} style={{flex:1,height:5,borderRadius:3,background:i<weekWorkouts?CLR.green:CLR.border}}/>
            ))}
          </div>
        </Card>}
        {!eod&&<div style={{display:"grid",gridTemplateColumns:new Date().getHours()>=19?"1fr 1fr 1fr":"1fr 1fr",gap:8,marginBottom:10}}>
          <Btn onClick={()=>setModal("food")} style={{fontSize:12,padding:"10px 6px"}}>🍽 {t.addFood}</Btn>
          <Btn onClick={()=>setModal("activity")} style={{fontSize:12,padding:"10px 6px",background:CLR.card2,color:CLR.green,border:"1px solid "+CLR.border}}>🏃 {t.addActivity}</Btn>
          {new Date().getHours()>=19&&<Btn onClick={()=>setEodConfirm(true)} variant="ghost" style={{fontSize:12,padding:"10px 6px",color:CLR.amber,border:"1px solid #4a3800"}}>🌙 {t.endOfDay}</Btn>}
        </div>}
        {eod&&<div style={{background:"#1a1a10",border:"1px solid #4a3800",borderRadius:12,padding:"10px 14px",marginBottom:10,fontSize:13,color:CLR.amber,textAlign:"center"}}>🌙 {t.endOfDayMsg}</div>}
      </div>

      {/* Scrollable log */}
      <div style={{flex:1,overflowY:"auto",padding:"0 16px 16px"}}>
        <Card>
          <div style={{fontSize:13,fontWeight:600,color:CLR.muted,marginBottom:10}}>{t.todayLog}</div>
          {todayEntries.length===0&&<div style={{color:CLR.dim,fontSize:13,textAlign:"center",padding:"16px 0"}}>{t.noLogs}</div>}
          {[...todayEntries].reverse().map((e,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"9px 0",borderBottom:"1px solid "+CLR.border}}>
              <div style={{display:"flex",gap:8,alignItems:"flex-start"}}>
                <span style={{fontSize:16}}>{typeIcon[e.type]||"📝"}</span>
                <div><div style={{fontSize:13,color:CLR.text}}>{e.label}</div>
                  {e.type==="food"&&<div style={{fontSize:11,color:CLR.muted}}>{Math.round(e.calories||0)} kcal · {Math.round(e.protein||0)}g prot · {Math.round(e.carbs||0)}g carbs</div>}
                  {e.type==="activity"&&<div style={{fontSize:11,color:CLR.muted}}>{e.calories_burned} kcal burned · {e.duration_min} min</div>}
                </div>
              </div>
              <div style={{fontSize:11,color:CLR.dim,whiteSpace:"nowrap"}}>{new Date(e.ts).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</div>
            </div>))}
        </Card>
      </div>
    </div>
  );
}
