// @ts-nocheck
import React, { useState, useRef } from "react";
import { CLR } from "../lib/utils";

export function Card({children,style}){return <div style={{background:CLR.card,borderRadius:14,padding:18,border:"1px solid "+CLR.border,...style}}>{children}</div>;}
export function Btn({children,onClick,style,disabled,variant="primary"}){
  const v={primary:{background:CLR.purpleDark,color:"#fff",border:"none"},ghost:{background:CLR.card2,color:CLR.muted,border:"1px solid "+CLR.border}};
  return <button onClick={disabled?undefined:onClick} style={{borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...v[variant],...style}}>{children}</button>;
}
export const inp = {width:"100%",background:CLR.card2,border:"1px solid "+CLR.border,borderRadius:9,padding:"9px 12px",color:CLR.text,fontSize:14,boxSizing:"border-box"};

export function InfoTip({text,below=false}){
  const [open,setOpen]=useState(false);
  const btnRef=useRef(null);
  const [hAlign,setHAlign]=useState("left");
  function toggle(e){
    e.stopPropagation();
    if(!open&&btnRef.current){
      const rect=btnRef.current.getBoundingClientRect();
      setHAlign(rect.left>window.innerWidth/2?"right":"left");
    }
    setOpen(o=>!o);
  }
  const vPos=below?{top:"calc(100% + 6px)"}:{bottom:"calc(100% + 6px)"};
  return(
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <button ref={btnRef} onClick={toggle} style={{background:"none",border:"none",cursor:"pointer",color:CLR.muted,fontSize:14,lineHeight:1,padding:"0 2px"}}>ⓘ</button>
      {open&&<>
        <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:299}}/>
        <div style={{position:"absolute",...vPos,...(hAlign==="right"?{right:0}:{left:0}),background:CLR.card,border:"1px solid "+CLR.border,borderRadius:10,padding:"10px 12px",fontSize:12,color:CLR.muted,lineHeight:1.5,width:240,zIndex:300,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          {text}
        </div>
      </>}
    </span>
  );
}

export function Ring({value,max,color,label,unit,size=68}){
  const pct=Math.min(1,max>0?value/max:0),over=value>max&&max>0;
  const r=26,cx=size/2,cy=size/2,circ=2*Math.PI*r;
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={CLR.border} strokeWidth="5"/>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={over?CLR.red:color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ*(1-pct)} strokeLinecap="round" transform={"rotate(-90 "+cx+" "+cy+")"}/>
        <text x={cx} y={cy+4} textAnchor="middle" fontSize="11" fontWeight="600" fill={over?CLR.red:color}>{Math.round(value)}</text>
      </svg>
      <div style={{fontSize:10,color:CLR.muted,textAlign:"center",lineHeight:1.3}}>{label}<br/><span style={{color:CLR.dim}}>/{max}{unit}</span></div>
    </div>
  );
}

export function ConfirmModal({title,message,confirmText,danger=false,onConfirm,onCancel}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:16}}>
      <div style={{background:CLR.card,borderRadius:16,padding:24,width:"100%",maxWidth:380,border:"1px solid "+CLR.border}}>
        <div style={{fontSize:16,fontWeight:700,color:CLR.text,marginBottom:10}}>{title}</div>
        <div style={{fontSize:13,color:CLR.muted,lineHeight:1.6,marginBottom:20}}>{message}</div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="ghost" onClick={onCancel}>Cancel</Btn>
          <Btn onClick={onConfirm} style={{background:danger?"#7f1d1d":CLR.purpleDark,color:"#fff",border:"none"}}>{confirmText}</Btn>
        </div>
      </div>
    </div>
  );
}
