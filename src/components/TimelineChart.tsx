// @ts-nocheck
import React, { useRef, useState } from "react";
import { CLR, addWeeks, fmtDate, fmtDateShort, mergeGroups, buildTimeline } from "../lib/utils";

export function TimelineChart({weeks,breakWeeks,startDate,goals,realPoints,lang}){
  const svgRef=useRef(null);
  const [vis,setVis]=useState({weight:true,fat:true,waist:true});
  const [tip,setTip]=useState(null);
  const svgW=620,svgH=240,padL=46,padR=20,padT=28,padB=38;
  const chartW=svgW-padL-padR,chartH=svgH-padT-padB;
  const n=weeks; if(!n||n<1) return null;
  const proj=buildTimeline(n,breakWeeks,goals.deficit,goals.startWeight,goals.startFat||20,goals.startWaist);
  const groups=mergeGroups(breakWeeks);
  function xOf(i){return padL+(i/n)*chartW;}
  function wkOfDate(d){return Math.round((new Date(d).getTime()-new Date(startDate).getTime())/(7*864e5));}
  const allW=proj.map(p=>p.w),allF=proj.map(p=>p.f),allWs=proj.map(p=>p.ws);
  const realW=realPoints.map(p=>p.weight).filter(Boolean);
  const realWs=realPoints.map(p=>p.waist).filter(Boolean);
  const realF=realPoints.map(p=>p.fat).filter(Boolean);
  function padRange(arr){const mn=Math.min(...arr),mx=Math.max(...arr),r=mx-mn||1;return[mn-r*0.12,mx+r*0.12];}
  const [minW,maxW]=padRange([...allW,...realW]);
  const [minF,maxF]=padRange([...allF,...realF]);
  const [minWs,maxWs]=padRange([...allWs,...realWs]);
  function yOf(v,mn,mx){return padT+chartH-((v-mn)/(mx-mn||1))*chartH;}
  const lines=[
    {key:"weight",label:"Weight",color:CLR.purple,proj:allW,mn:minW,mx:maxW,unit:"kg",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.weight})).filter(p=>p.v)},
    {key:"fat",label:"Fat %",color:CLR.amber,proj:allF,mn:minF,mx:maxF,unit:"%",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.fat})).filter(p=>p.v)},
    {key:"waist",label:"Waist",color:CLR.teal,proj:allWs,mn:minWs,mx:maxWs,unit:"cm",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.waist})).filter(p=>p.v)},
  ];
  const tickStep=Math.max(1,Math.round(n/10));
  function handleMM(e){
    const svg=svgRef.current;if(!svg)return;
    const rect=svg.getBoundingClientRect(),scaleX=svgW/rect.width;
    const mx=(e.clientX-rect.left)*scaleX,cx=mx-padL;
    if(cx<0||cx>chartW){setTip(null);return;}
    const idx=Math.max(0,Math.min(n,Math.round((cx/chartW)*n)));
    setTip({idx,x:xOf(idx),pt:proj[idx],date:addWeeks(new Date(startDate),idx)});
  }
  return(
    <div>
      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap"}}>
        {lines.map(({key,label,color})=>(
          <button key={key} onClick={()=>setVis(v=>({...v,[key]:!v[key]}))}
            style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",
              background:vis[key]?"transparent":CLR.card2,border:"1px solid "+(vis[key]?color:CLR.border),color:vis[key]?color:CLR.dim,opacity:vis[key]?1:0.55}}>
            <span style={{display:"inline-block",width:12,height:0,borderTop:"2px dashed "+(vis[key]?color:CLR.dim)}}/>{label}
          </button>))}
      </div>
      <svg ref={svgRef} viewBox={"0 0 "+svgW+" "+svgH} style={{width:"100%",display:"block",cursor:"crosshair"}} onMouseMove={handleMM} onMouseLeave={()=>setTip(null)}>
        {groups.map((g,i)=><rect key={i} x={xOf(g[0]-1)} y={padT} width={xOf(g[g.length-1])-xOf(g[0]-1)} height={chartH} fill="#1e3a5f" opacity="0.4"/>)}
        {[0,.25,.5,.75,1].map(t=><line key={t} x1={padL} x2={svgW-padR} y1={padT+chartH*(1-t)} y2={padT+chartH*(1-t)} stroke={CLR.border} strokeWidth="0.5"/>)}
        {lines.map(({key,color,proj,mn,mx})=>vis[key]&&<polyline key={key} points={proj.map((v,i)=>xOf(i)+","+yOf(v,mn,mx)).join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>)}
        {lines.map(({key,color,real,mn,mx})=>vis[key]&&real.length>1&&<polyline key={key+"r"} points={real.map(p=>xOf(Math.min(p.wk,n))+","+yOf(p.v,mn,mx)).join(" ")} fill="none" stroke={color} strokeWidth="2.5"/>)}
        {lines.map(({key,color,real,mn,mx})=>vis[key]&&real.map((p,i)=><circle key={key+i} cx={xOf(Math.min(p.wk,n))} cy={yOf(p.v,mn,mx)} r="4" fill={color} stroke={CLR.bg} strokeWidth="2"/>))}
        {lines.map(({key,color,proj,mn,mx})=>vis[key]&&[0,n].map(i=><circle key={key+i} cx={xOf(i)} cy={yOf(proj[i],mn,mx)} r="3" fill={color} opacity="0.4"/>))}
        {tip&&(()=>{
          const bx=tip.x>svgW*0.65?tip.x-128:tip.x+10,by=padT+4,vl=lines.filter(l=>vis[l.key]);
          return <g>
            <line x1={tip.x} x2={tip.x} y1={padT} y2={padT+chartH} stroke="#fff" strokeWidth="0.5" opacity="0.2"/>
            {vl.map(({key,color,proj,mn,mx})=><circle key={key} cx={tip.x} cy={yOf(proj[tip.idx],mn,mx)} r="4" fill={color} stroke={CLR.bg} strokeWidth="2"/>)}
            <rect x={bx} y={by} width={122} height={20+vl.length*18} rx="6" fill="#1e1e35" stroke={CLR.border} strokeWidth="0.5"/>
            <text x={bx+8} y={by+14} fontSize="10" fill={CLR.muted}>{fmtDateShort(tip.date)}</text>
            {vl.map(({key,label,color,proj,unit},i)=><text key={key} x={bx+8} y={by+28+i*18} fontSize="11" fill={color}>{label+": "+proj[tip.idx]+unit}</text>)}
          </g>;
        })()}
        {Array.from({length:Math.ceil(n/tickStep)+1},(_,j)=>{const i=j*tickStep;if(i>n)return null;return<g key={i}><line x1={xOf(i)} x2={xOf(i)} y1={padT+chartH} y2={padT+chartH+4} stroke={CLR.border} strokeWidth="1"/><text x={xOf(i)} y={padT+chartH+14} textAnchor="middle" fontSize="9" fill={CLR.muted}>{fmtDateShort(addWeeks(new Date(startDate),i))}</text></g>;})}
        <rect x={svgW-padR-78} y={6} width={10} height={10} fill="#1e3a5f" opacity="0.8"/>
        <text x={svgW-padR-64} y={15} fontSize="10" fill={CLR.muted}>Break wk</text>
        <line x1={svgW-padR-78} x2={svgW-padR-64} y1={26} y2={26} stroke={CLR.purple} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
        <text x={svgW-padR-60} y={30} fontSize="10" fill={CLR.muted}>Projected</text>
        <line x1={svgW-padR-78} x2={svgW-padR-64} y1={42} y2={42} stroke={CLR.purple} strokeWidth="2.5"/>
        <text x={svgW-padR-60} y={46} fontSize="10" fill={CLR.muted}>Actual</text>
      </svg>
    </div>
  );
}
