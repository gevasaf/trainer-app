// @ts-nocheck
import React, { useState, useRef, useEffect } from "react";
import { CLR, round1 } from "../lib/utils";
import { Btn, inp } from "./ui";
import { callAssistant } from "../lib/api";

export function AssistantTab({t,appData,entries,bodyPoints,chatHistory,setChatHistory,setUnreadCount,lang,status,setStatus}){
  const [input,setInput]=useState("");
  const bottomRef=useRef(null);

  useEffect(()=>{
    bottomRef.current?.scrollIntoView({behavior:"smooth"});
    setUnreadCount(0);
  },[chatHistory]);

  async function send(){
    if(!input.trim()||status)return;
    const userMsg=input.trim(); setInput("");
    const userEntry={role:"user",content:userMsg,ts:Date.now()};
    setChatHistory(h=>[...h,userEntry]);
    setStatus("thinking");
    try{
      const res=await callAssistant("user",userMsg,[...chatHistory,userEntry],appData,entries,bodyPoints,null);
      if(res.usedTool) setStatus("searching");
      setChatHistory(h=>[...h,{role:"assistant",content:res.text,ts:Date.now()}]);
    }catch(e){
      setChatHistory(h=>[...h,{role:"assistant",content:"Sorry, something went wrong. Please try again.",ts:Date.now()}]);
    }
    setStatus(null);
  }

  const typeIcon={eod:"🌙",measurement:"⚖️",week:"📊"};

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Scrollable messages */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 8px"}}>
        {chatHistory.map((msg,i)=>{
          if(msg.hidden) return null;
          if(msg.eventType){
            return(
              <div key={i} style={{margin:"10px 0"}}>
                <div style={{background:CLR.card2,border:"1px solid "+CLR.border,borderRadius:12,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:CLR.muted,marginBottom:6}}>{typeIcon[msg.eventType]} {msg.eventType==="eod"?t.endOfDaySummary:msg.eventType==="measurement"?t.newMeasurement:t.weekSummary}</div>
                  {msg.eventType==="eod"&&msg.data&&(()=>{
                    const d=msg.data,g=appData.goals.nutrition;
                    return<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                      {[["🔥","Net cal",d.net??Math.round(d.cal-d.burned),g.targetCal,"kcal",CLR.purple],["💪","Prot",Math.round(d.protein),g.protein,"g",CLR.green],["💧","Water",round1(d.water),g.water,"L",CLR.blue],["🌾","Carbs",Math.round(d.carbs),g.carbs,"g",CLR.amber],["🥑","Fat",Math.round(d.fat),g.fat,"g",CLR.red],["🏃","Burned",Math.round(d.burned),"-","kcal",CLR.teal]].map(([ico,lbl,v,mx,u,c])=>(
                        <div key={lbl} style={{background:CLR.card,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:CLR.muted}}>{ico} {lbl}</div>
                          <div style={{fontSize:14,fontWeight:700,color:v>mx&&mx!=="-"?CLR.red:c}}>{v}</div>
                          <div style={{fontSize:10,color:CLR.dim}}>{mx!=="-"?"/"+mx:""} {u}</div>
                        </div>))}</div>;
                  })()}
                  {msg.eventType==="measurement"&&msg.data&&(()=>{
                    const d=msg.data;
                    return<div style={{display:"flex",gap:10}}>
                      {[[d.weight,"kg",CLR.purple,"⚖️"],[d.waist,"cm",CLR.teal,"📏"],[d.fat,"%",CLR.amber,"💪"]].filter(([v])=>v).map(([v,u,c,ico])=>(
                        <div key={u} style={{flex:1,background:CLR.card,borderRadius:8,padding:"8px",textAlign:"center"}}>
                          <div style={{fontSize:12}}>{ico}</div><div style={{fontSize:18,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:CLR.dim}}>{u}</div>
                        </div>))}
                    </div>;
                  })()}
                  {msg.eventType==="week"&&msg.data&&(()=>{
                    const d=msg.data,g=appData.goals.nutrition;
                    return<div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                      {[["Avg net cal",Math.round(d.net??d.cal),g.targetCal,"kcal",CLR.purple],["Avg Prot",Math.round(d.protein),g.protein,"g",CLR.green],["Avg Water",round1(d.water),g.water,"L",CLR.blue]].map(([lbl,v,mx,u,c])=>(
                        <div key={lbl} style={{background:CLR.card,borderRadius:8,padding:"6px 8px",textAlign:"center"}}>
                          <div style={{fontSize:10,color:CLR.muted}}>{lbl}</div><div style={{fontSize:14,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:CLR.dim}}>/{mx} {u}</div>
                        </div>))}</div>;
                  })()}
                </div>
              </div>
            );
          }
          const isUser=msg.role==="user";
          return(
            <div key={i} style={{display:"flex",flexDirection:isUser?"row-reverse":"row",marginBottom:10}}>
              <div style={{maxWidth:"82%",background:isUser?CLR.purpleBg:CLR.card2,borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,lineHeight:1.6,color:isUser?"#e9d5ff":CLR.text,border:isUser?"none":"1px solid "+CLR.border,whiteSpace:"pre-wrap",wordBreak:"break-word"}}>
                {msg.content}
              </div>
            </div>
          );
        })}
        {status&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px"}}>
            <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:CLR.purple,animation:"pulse 1.2s infinite",animationDelay:i*0.2+"s"}}/>)}</div>
            <span style={{fontSize:12,color:CLR.muted}}>{status==="searching"?t.searching:t.thinking}</span>
          </div>)}
        <div ref={bottomRef}/>
      </div>

      {/* Fixed bottom: input */}
      <div style={{flexShrink:0,padding:"8px 16px 16px",borderTop:"1px solid "+CLR.border}}>
        <div style={{display:"flex",gap:8}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder={t.typeMsg} style={{flex:1,...inp,padding:"10px 14px"}}/>
          <Btn onClick={send} disabled={!input.trim()||!!status} style={{padding:"10px 18px"}}>{t.send}</Btn>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}
