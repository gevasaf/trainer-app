// @ts-nocheck
import React, { useState } from "react";
import { CLR, calcFatPct } from "../lib/utils";
import { Card, inp } from "./ui";

export function LogTab({t,entries,bodyPoints,profile,deleteEntry,deleteBodyPoint,readOnly=false}){
  const [filterType,setFilterType]=useState("all"),[fromDate,setFromDate]=useState(""),[toDate,setToDate]=useState("");
  const [pendingDelete,setPendingDelete]=useState(null);
  const typeIcon={food:"🍽",activity:"🏃",eod:"🌙",body:"⚖️"};
  const typeColor={food:CLR.purple,activity:CLR.green,eod:CLR.amber,body:CLR.teal};
  function deriveFat(p){
    if(p.waist&&profile?.height) return calcFatPct(profile.gender,null,profile.height,p.waist);
    if(p.weight&&profile?.height) return calcFatPct(profile.gender,Math.round(p.weight/((profile.height/100)**2)*10)/10);
    return p.fat??null;
  }
  const all=[...entries,...bodyPoints.map(p=>{const fat=deriveFat(p);return{...p,type:"body",label:"Weight: "+(p.weight||"?")+"kg  Waist: "+(p.waist||"?")+"cm"+(fat!=null?"  Fat: "+Number(fat).toFixed(1)+"%":"")};})].sort((a,b)=>b.ts-a.ts);
  const filtered=all.filter(e=>{
    if(filterType!=="all"&&e.type!==filterType)return false;
    if(fromDate&&e.date<fromDate)return false;
    if(toDate&&e.date>toDate)return false;
    return true;
  });
  const types=[["all",t.all],["food",t.food],["activity",t.activityType],["body",t.bodyType],["eod",t.system]];
  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Fixed filters */}
      <div style={{flexShrink:0,padding:"12px 16px 0"}}>
        <Card style={{marginBottom:0}}>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
            {types.map(([k,l])=><button key={k} onClick={()=>setFilterType(k)} style={{padding:"4px 10px",borderRadius:20,fontSize:12,cursor:"pointer",border:"1px solid "+(filterType===k?CLR.purple:CLR.border),background:filterType===k?CLR.purpleBg:CLR.card2,color:filterType===k?CLR.purple:CLR.muted}}>{l}</button>)}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {[["from",fromDate,setFromDate],["to",toDate,setToDate]].map(([lbl,val,set])=>(
              <div key={lbl}><div style={{fontSize:11,color:CLR.muted,marginBottom:3}}>{lbl}</div><input type="date" value={val} onChange={e=>set(e.target.value)} style={{...inp,fontSize:12,padding:"7px 10px"}}/></div>))}
          </div>
        </Card>
      </div>

      {/* Scrollable entries */}
      <div style={{flex:1,overflowY:"auto",padding:"10px 16px 16px"}}>
        {filtered.length===0&&<div style={{textAlign:"center",color:CLR.dim,padding:"40px 0"}}>{t.noLogs}</div>}
        {filtered.map((e,i)=>(
          <div key={i} style={{display:"flex",gap:10,padding:"10px 0",borderBottom:"1px solid "+CLR.border,alignItems:"flex-start"}}>
            <span style={{fontSize:18,flexShrink:0}}>{typeIcon[e.type]||"📝"}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,color:CLR.text,marginBottom:2}}>{e.label}</div>
              {e.type==="food"&&<div style={{fontSize:11,color:CLR.muted}}>{Math.round(e.calories||0)} kcal · {Math.round(e.protein||0)}g P · {Math.round(e.carbs||0)}g C · {Math.round(e.fat||0)}g F</div>}
              {e.type==="activity"&&<div style={{fontSize:11,color:CLR.muted}}>{e.calories_burned} kcal burned · {e.duration_min} min</div>}
            </div>
            <div style={{display:"flex",alignItems:"flex-start",gap:6,flexShrink:0}}>
              <div style={{fontSize:11,color:CLR.dim,textAlign:"right"}}><div>{e.date}</div><div style={{color:typeColor[e.type]||CLR.dim}}>{e.type}</div></div>
              {!readOnly&&(pendingDelete===e.ts
                ?<div style={{display:"flex",gap:4,alignItems:"center"}}>
                    <button onClick={()=>setPendingDelete(null)} style={{background:"none",border:"1px solid "+CLR.border,color:CLR.muted,cursor:"pointer",fontSize:11,padding:"2px 7px",borderRadius:6,lineHeight:1.5}}>Cancel</button>
                    <button onClick={()=>{e.type==="body"?deleteBodyPoint(e.ts):deleteEntry(e.ts);setPendingDelete(null);}} style={{background:CLR.red,border:"none",color:"#fff",cursor:"pointer",fontSize:11,padding:"2px 7px",borderRadius:6,lineHeight:1.5}}>Delete</button>
                  </div>
                :<button onClick={()=>setPendingDelete(e.ts)} style={{background:"none",border:"none",color:CLR.dim,cursor:"pointer",fontSize:14,padding:"2px 4px",lineHeight:1,opacity:0.6,marginTop:1}} title="Delete entry">🗑</button>)}
            </div>
          </div>))}
      </div>
    </div>
  );
}
