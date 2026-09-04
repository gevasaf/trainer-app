// @ts-nocheck
import React, { useState, useRef, useEffect, memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CLR, round1 } from "../lib/utils";
import { Btn, inp } from "./ui";
import { callAssistant } from "../lib/api";

const mdComponents = {
  h1: ({children}) => <div style={{fontSize:18,fontWeight:700,color:CLR.purple,margin:'10px 0 4px',lineHeight:1.3}}>{children}</div>,
  h2: ({children}) => <div style={{fontSize:16,fontWeight:700,color:CLR.purple,margin:'8px 0 4px',lineHeight:1.3}}>{children}</div>,
  h3: ({children}) => <div style={{fontSize:14,fontWeight:600,color:CLR.purple,margin:'6px 0 3px',lineHeight:1.3}}>{children}</div>,
  p: ({children}) => <div style={{margin:'4px 0',lineHeight:1.6}}>{children}</div>,
  strong: ({children}) => <strong style={{color:CLR.text,fontWeight:700}}>{children}</strong>,
  em: ({children}) => <em style={{color:CLR.muted}}>{children}</em>,
  ul: ({children}) => <ul style={{margin:'4px 0',paddingLeft:20,lineHeight:1.6}}>{children}</ul>,
  ol: ({children}) => <ol style={{margin:'4px 0',paddingLeft:20,lineHeight:1.6}}>{children}</ol>,
  li: ({children}) => <li style={{margin:'2px 0'}}>{children}</li>,
  blockquote: ({children}) => <blockquote style={{borderLeft:'3px solid '+CLR.purple,margin:'6px 0',paddingLeft:10,color:CLR.muted}}>{children}</blockquote>,
  hr: () => <hr style={{border:'none',borderTop:'1px solid '+CLR.border,margin:'8px 0'}}/>,
  a: ({href,children}) => <a href={href} target="_blank" rel="noopener noreferrer" style={{color:CLR.purple,textDecoration:'underline'}}>{children}</a>,
  code: ({inline, children}) => inline
    ? <code style={{background:CLR.card,color:CLR.green,padding:'1px 5px',borderRadius:4,fontSize:12,fontFamily:'monospace'}}>{children}</code>
    : null,
  pre: ({children}) => <pre style={{background:CLR.card,border:'1px solid '+CLR.border,borderRadius:8,padding:'10px 12px',overflowX:'auto',fontSize:12,fontFamily:'monospace',margin:'6px 0',color:CLR.text,lineHeight:1.5}}>{children}</pre>,
  table: ({children}) => <div style={{overflowX:'auto',margin:'6px 0'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>{children}</table></div>,
  thead: ({children}) => <thead>{children}</thead>,
  tbody: ({children}) => <tbody>{children}</tbody>,
  tr: ({children}) => <tr>{children}</tr>,
  th: ({children}) => <th style={{background:CLR.card,padding:'6px 10px',textAlign:'left',fontWeight:600,color:CLR.muted,borderBottom:'1px solid '+CLR.border,whiteSpace:'nowrap'}}>{children}</th>,
  td: ({children}) => <td style={{padding:'5px 10px',borderBottom:'1px solid '+CLR.border+'44',color:CLR.text,whiteSpace:'nowrap'}}>{children}</td>,
};

const remarkPlugins = [remarkGfm];
const typeIcon = {eod:"🌙",measurement:"⚖️",week:"📊"};

const ChatMessage = memo(function ChatMessage({msg, appData, t}) {
  if(msg.hidden) return null;
  if(msg.eventType){
    return(
      <div style={{margin:"10px 0"}}>
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
    <div style={{display:"flex",flexDirection:isUser?"row-reverse":"row",marginBottom:10}}>
      <div style={{maxWidth:"82%",background:isUser?CLR.purpleBg:CLR.card2,borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",padding:"10px 14px",fontSize:13,lineHeight:1.6,color:isUser?"#e9d5ff":CLR.text,border:isUser?"none":"1px solid "+CLR.border,wordBreak:"break-word"}}>
        {isUser
          ? <span style={{whiteSpace:'pre-wrap'}}>{msg.content}</span>
          : <ReactMarkdown remarkPlugins={remarkPlugins} components={mdComponents}>{msg.content}</ReactMarkdown>}
      </div>
    </div>
  );
});

export function AssistantTab({t,appData,entries,bodyPoints,chatHistory,setChatHistory,setUnreadCount,lang,status,setStatus,readOnly=false}){
  const [input,setInput]=useState("");
  const bottomRef=useRef(null);
  const textareaRef=useRef(null);
  const isFirstRender=useRef(true);

  useEffect(()=>{
    const behavior=isFirstRender.current?"instant":"smooth";
    isFirstRender.current=false;
    bottomRef.current?.scrollIntoView({behavior});
    setUnreadCount(0);
  },[chatHistory]);

  async function send(){
    if(!input.trim()||status)return;
    const userMsg=input.trim(); setInput("");
    if(textareaRef.current){ textareaRef.current.style.height='auto'; }
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

  function handleInputChange(e){
    setInput(e.target.value);
    const ta=textareaRef.current;
    if(ta){ ta.style.height='auto'; ta.style.height=Math.min(ta.scrollHeight,120)+'px'; }
  }

  function handleKeyDown(e){
    if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); }
  }

  return(
    <div style={{height:"100%",display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Scrollable messages */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 16px 8px"}}>
        {readOnly&&chatHistory.length===0&&(
          <div style={{textAlign:"center",color:CLR.dim,fontSize:13,padding:"40px 0"}}>{t.noLogs}</div>
        )}
        {chatHistory.map((msg,i)=>(
          <ChatMessage key={msg.ts??i} msg={msg} appData={appData} t={t}/>
        ))}
        {status&&(
          <div style={{display:"flex",alignItems:"center",gap:8,padding:"8px 4px"}}>
            <div style={{display:"flex",gap:4}}>{[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:"50%",background:CLR.purple,animation:"pulse 1.2s infinite",animationDelay:i*0.2+"s"}}/>)}</div>
            <span style={{fontSize:12,color:CLR.muted}}>{status==="searching"?t.searching:t.thinking}</span>
          </div>)}
        <div ref={bottomRef}/>
      </div>

      {/* Fixed bottom: input (hidden in read-only journey view) */}
      {!readOnly&&<div style={{flexShrink:0,padding:"8px 16px 16px",borderTop:"1px solid "+CLR.border}}>
        <div style={{display:"flex",gap:8,alignItems:"flex-end"}}>
          <textarea ref={textareaRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown}
            placeholder={t.typeMsg} rows={1}
            style={{flex:1,...inp,padding:"10px 14px",resize:"none",overflowY:"hidden",lineHeight:1.5,minHeight:42}}/>
          <Btn onClick={send} disabled={!input.trim()||!!status} style={{padding:"10px 18px",flexShrink:0}}>{t.send}</Btn>
        </div>
        <div style={{fontSize:11,color:CLR.dim,marginTop:4,paddingLeft:2}}>Enter to send · Shift+Enter for new line</div>
      </div>}
      <style>{`@keyframes pulse{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
    </div>
  );
}
