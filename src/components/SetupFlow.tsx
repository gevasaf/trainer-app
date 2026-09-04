// @ts-nocheck
import React, { useState } from "react";
import { CLR, calcFatPct, calcTDEE, autoNutrition, nextSunday, addWeeks, fmtDate, breakWeekLabel, mergeGroups, buildTimeline, localDateStr, todayKey } from "../lib/utils";
import { Card, Btn, inp, InfoTip } from "./ui";
import { TimelineChart } from "./TimelineChart";

declare const __APP_VERSION__: string;

export function SetupFlow({onComplete,onCancel,newJourney=false,t,lang,toggleLang}){
  const [step,setStep]=useState(1);
  const [p,setP]=useState({name:"",age:30,gender:"male",height:175,weight:80,waist:85,actIdx:2});
  const act=t.actLevels[p.actIdx];
  const bmi=p.height&&p.weight?Math.round((p.weight/((p.height/100)**2))*10)/10:null;
  const fatPct=p.height&&p.waist?calcFatPct(p.gender,bmi,p.height,p.waist):bmi?calcFatPct(p.gender,bmi):null;
  const profile={...p,actMult:act.mult,bmi,fatPct,date:todayKey()};
  const tdee=p.height&&p.weight&&p.age?calcTDEE(profile):null;
  const startDate=nextSunday();
  const [dur,setDur]=useState(12);
  const [breakWks,setBreakWks]=useState([]);
  const [deficit,setDeficit]=useState(400);
  const [proteinPerKg,setProteinPerKg]=useState(1.8);
  const [workoutsPerWeek,setWorkoutsPerWeek]=useState(4);
  const proteinG=Math.round(p.weight*proteinPerKg);
  const nutrition=tdee?autoNutrition(tdee,deficit,proteinG,p.weight):null;
  const tlEnd=fatPct?buildTimeline(dur,breakWks,deficit,p.weight,fatPct,p.waist,workoutsPerWeek,proteinPerKg,p.gender).at(-1):null;
  const projW=tlEnd?Math.round(tlEnd.w*10)/10:null;
  const projFat=tlEnd?Math.round(tlEnd.f*10)/10:null;
  const projWaist=tlEnd?Math.round(tlEnd.ws*10)/10:null;
  function toggleBreak(w){setBreakWks(prev=>prev.includes(w)?prev.filter(x=>x!==w):[...prev,w].sort((a,b)=>a-b));}
  function apply(){
    onComplete({profile,tdee,fatPct,bmi,
      goals:{deficit,nutrition,proteinPerKg,workoutsPerWeek,durationWeeks:dur,breakWeeks:breakWks,
        startDate:localDateStr(startDate),
        startWeight:p.weight,startFat:fatPct,startWaist:p.waist,
        targetWeight:projW,targetFat:projFat,targetWaist:projWaist}});
  }
  return(
    <div style={{height:"100dvh",background:CLR.bg,color:CLR.text,fontFamily:"system-ui,sans-serif",direction:t.dir,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden"}}>
      {/* Fixed header */}
      <div style={{width:"100%",maxWidth:540,flexShrink:0,padding:"24px 16px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:22,fontWeight:700,color:CLR.purple}}>{(newJourney?"✨ "+t.newJourney:"💪 "+t.setup)}</div>
            <div style={{fontSize:12,color:CLR.muted,marginTop:2,display:"flex",gap:6,alignItems:"center"}}><span>{"Step "+step+" of 2"}</span><span style={{opacity:0.4}}>·</span><span style={{opacity:0.5}}>{"v"+__APP_VERSION__}</span></div></div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {onCancel&&<button onClick={onCancel} style={{background:CLR.card,border:"1px solid "+CLR.border,color:CLR.muted,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>{t.cancel}</button>}
            <button onClick={toggleLang} style={{background:CLR.card,border:"1px solid "+CLR.border,color:CLR.muted,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>{lang==="en"?"עב":"EN"}</button>
          </div>
        </div>
        {newJourney&&<div style={{background:CLR.card,border:"1px solid "+CLR.border,borderRadius:10,padding:"10px 12px",marginBottom:14,fontSize:12,color:CLR.muted,lineHeight:1.5}}>{t.newJourneyMsg}</div>}
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[1,2].map(s=><div key={s} style={{flex:1,height:4,borderRadius:4,background:step>=s?CLR.purple:CLR.border}}/>)}
        </div>
      </div>
      {/* Scrollable content */}
      <div style={{width:"100%",maxWidth:540,flex:1,overflowY:"auto",padding:"4px 16px 60px"}}>
        {step===1&&(<div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:16,color:CLR.purple}}>{t.step1}</div>
          <div style={{marginBottom:12}}><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.name}</div><input value={p.name} onChange={e=>setP(x=>({...x,name:e.target.value}))} style={inp}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{marginBottom:12}}><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.age}</div><input type="number" value={p.age} onChange={e=>setP(x=>({...x,age:+e.target.value}))} style={inp}/></div>
            <div style={{marginBottom:12}}><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.gender}</div>
              <div style={{display:"flex",gap:6}}>{["male","female"].map(g=><button key={g} onClick={()=>setP(x=>({...x,gender:g}))} style={{flex:1,padding:"9px 0",background:p.gender===g?CLR.purpleBg:CLR.card2,border:"1px solid "+(p.gender===g?CLR.purple:CLR.border),borderRadius:9,color:p.gender===g?"#fff":CLR.muted,cursor:"pointer",fontSize:13}}>{g==="male"?t.male:t.female}</button>)}</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}>
            {[[t.height,"height"],[t.weight,"weight"],[t.waist,"waist"]].map(([lbl,k])=><div key={k}><div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{lbl}</div><input type="number" value={p[k]} onChange={e=>setP(x=>({...x,[k]:+e.target.value}))} style={inp}/></div>)}
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>{t.activity}<InfoTip text={t.actLevelInfo}/></div>
            {t.actLevels.map((a,i)=><button key={i} onClick={()=>setP(x=>({...x,actIdx:i}))} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"10px 14px",marginBottom:6,background:p.actIdx===i?CLR.purpleBg:CLR.card2,border:"1px solid "+(p.actIdx===i?CLR.purple:CLR.border),borderRadius:10,color:p.actIdx===i?"#fff":CLR.muted,cursor:"pointer",textAlign:"start"}}><span style={{fontSize:13,fontWeight:p.actIdx===i?600:400}}>{a.label}</span><span style={{fontSize:11,color:p.actIdx===i?"#c4b5fd":CLR.dim}}>{a.desc}</span></button>)}
          </div>
          {tdee&&<Card style={{marginBottom:20,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
            {[[t.tdee,tdee,"kcal/day",CLR.purple],[t.bmi,bmi,"",CLR.blue],[t.fatPct,fatPct?fatPct+"%":"--","",CLR.amber]].map(([l,v,u,c])=><div key={l}><div style={{fontSize:11,color:CLR.muted}}>{l}</div><div style={{fontSize:22,fontWeight:700,color:c}}>{v}</div>{u&&<div style={{fontSize:11,color:CLR.dim}}>{u}</div>}</div>)}
          </Card>}
          <Btn onClick={()=>setStep(2)} disabled={!p.name||!tdee} style={{width:"100%"}}>{t.next}</Btn>
        </div>)}
        {step===2&&(<div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:4,color:CLR.purple}}>{t.step2}</div>
          <div style={{fontSize:12,color:CLR.muted,marginBottom:18}}>{"TDEE: "}<span style={{color:CLR.purple,fontWeight:600}}>{tdee+" kcal"}</span></div>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:5}}>{t.durationWeeks}</div>
            <input type="number" value={dur} min={4} max={52} onChange={e=>{const v=+e.target.value;setDur(v);setBreakWks(bw=>bw.filter(w=>w<=v));}} style={{...inp,marginBottom:6}}/>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:12,display:"flex",gap:8}}><span>{"📅 "+fmtDate(startDate,lang)}</span><span style={{color:CLR.dim}}>→</span><span style={{color:CLR.purple}}>{fmtDate(addWeeks(startDate,dur),lang)}</span></div>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>{t.breakWeeks}<InfoTip text={`Break weeks use a small calorie surplus (your deficit ÷ 2 = +${Math.round(deficit/2)} kcal/day) and half your usual workouts (${Math.floor(workoutsPerWeek/2)}), allowing recovery while minimising fat gain.`}/></div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:8}}>{Array.from({length:dur},(_,i)=>i+1).map(w=>{const isBrk=breakWks.includes(w);return<button key={w} onClick={()=>toggleBreak(w)} style={{width:32,height:28,borderRadius:7,fontSize:11,fontWeight:600,border:"1px solid "+(isBrk?CLR.blue:CLR.border),background:isBrk?"#1e3a5f":CLR.card2,color:isBrk?CLR.blue:CLR.dim,cursor:"pointer"}}>{w}</button>;})}</div>
            <div style={{fontSize:11,color:CLR.dim,lineHeight:1.7}}>{breakWks.length>0?breakWeekLabel(breakWks,startDate,lang):"Tap week numbers to mark as break weeks"}</div>
          </Card>
          <Card style={{marginBottom:14}}>
            <div style={{marginBottom:14}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:CLR.muted,marginBottom:3}}><span>{t.calDeficit}</span><span style={{color:CLR.text}}>{"-"+deficit+" kcal → "+(tdee-deficit)+" kcal/day"}</span></div>
              <input type="range" min={0} max={1000} step={50} value={deficit} onChange={e=>setDeficit(+e.target.value)} style={{width:"100%",accentColor:CLR.purple}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:CLR.dim}}><span>0</span><span>−500</span><span>−1000</span></div>
            </div>
            <div style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:CLR.muted,marginBottom:3}}><span>{t.protein}</span><span style={{color:CLR.text}}>{proteinPerKg.toFixed(1)+" g/kg = "}<span style={{color:CLR.green,fontWeight:600}}>{proteinG+" g"}</span></span></div>
              <input type="range" min={1.0} max={3.0} step={0.1} value={proteinPerKg} onChange={e=>setProteinPerKg(+e.target.value)} style={{width:"100%",accentColor:CLR.green}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:CLR.dim}}><span>1.0</span><span>1.8</span><span>3.0</span></div>
            </div>
            {nutrition&&<div style={{background:CLR.card2,borderRadius:10,padding:"12px 14px",marginTop:4}}>
              <div style={{fontSize:11,color:CLR.muted,marginBottom:10}}>{t.calculatedNutrition}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[[t.carbs,nutrition.carbs+"g",CLR.amber],[t.fat,nutrition.fat+"g",CLR.red],[t.fiber,nutrition.fiber+"g",CLR.green],[t.water,nutrition.water+"L",CLR.blue],["Total",nutrition.targetCal+" kcal",CLR.purple]].map(([l,v,c])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:10,color:CLR.muted}}>{l}</div><div style={{fontSize:14,fontWeight:600,color:c}}>{v}</div></div>)}
              </div></div>}
          </Card>
          <Card style={{marginBottom:14}}>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:8}}>{t.workoutsPerWeek}</div>
            <div style={{display:"flex",gap:6}}>{[1,2,3,4,5,6,7].map(n=><button key={n} onClick={()=>setWorkoutsPerWeek(n)} style={{flex:1,padding:"8px 0",background:workoutsPerWeek===n?CLR.purpleBg:CLR.card2,border:"1px solid "+(workoutsPerWeek===n?CLR.purple:CLR.border),borderRadius:9,color:workoutsPerWeek===n?"#fff":CLR.muted,cursor:"pointer",fontSize:13,fontWeight:600}}>{n}</button>)}</div>
          </Card>
          <Card style={{marginBottom:14,background:"#12122a"}}>
            <div style={{fontSize:13,fontWeight:600,color:CLR.green,marginBottom:12}}>{t.projectedGoals}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
              {[[t.targetWeight,projW,"kg",CLR.purple],[t.targetFat,projFat?projFat+"%":"--","",CLR.amber],[t.targetWaist,projWaist,"cm",CLR.teal]].map(([l,v,u,c])=><div key={l} style={{background:CLR.card,borderRadius:10,padding:"10px 6px"}}><div style={{fontSize:10,color:CLR.muted,marginBottom:4}}>{l}</div><div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div>{u&&<div style={{fontSize:10,color:CLR.dim}}>{u}</div>}</div>)}
            </div>
          </Card>
          <Card style={{marginBottom:20,padding:"14px 10px"}}>
            <div style={{fontSize:12,color:CLR.muted,marginBottom:10}}>Projected timeline</div>
            <TimelineChart weeks={dur} breakWeeks={breakWks} startDate={startDate} goals={{deficit,startWeight:p.weight,startFat:fatPct||20,startWaist:p.waist,workoutsPerWeek,proteinPerKg,gender:p.gender}} realPoints={[]} lang={lang}/>
          </Card>
          <div style={{display:"flex",gap:10}}><Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:0}}>← Back</Btn><Btn onClick={apply} style={{flex:1}}>{t.applyBtn+" 🚀"}</Btn></div>
        </div>)}
      </div>
    </div>
  );
}
