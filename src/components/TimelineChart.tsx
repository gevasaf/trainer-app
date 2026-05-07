// @ts-nocheck
import React, { useRef, useState } from "react";
import { CLR, addWeeks, fmtDate, fmtDateShort, mergeGroups, buildTimeline } from "../lib/utils";

export function TimelineChart({weeks,breakWeeks,startDate,goals,realPoints,lang}){
  const svgRef=useRef(null);
  const [active,setActive]=useState("weight");
  const [tip,setTip]=useState(null);
  const svgW=620,svgH=240,padL=50,padR=20,padT=28,padB=38;
  const chartW=svgW-padL-padR,chartH=svgH-padT-padB;
  const n=weeks; if(!n||n<1) return null;
  const proj=buildTimeline(n,breakWeeks,goals.deficit,goals.startWeight,goals.startFat||20,goals.startWaist,goals.workoutsPerWeek||4,goals.proteinPerKg||1.8,goals.gender||"male");
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
  function niceTicks(mn,mx,count=5){
    const r=mx-mn,step=Math.pow(10,Math.floor(Math.log10(r/count)));
    const ns=([1,2,2.5,5,10].find(s=>r/(s*step)<=count)||10)*step;
    const ticks=[];
    for(let t=Math.ceil(mn/ns)*ns;t<=mx+ns*0.01;t=Math.round((t+ns)*1e6)/1e6) ticks.push(Math.round(t*10)/10);
    return ticks;
  }
  const lines=[
    {key:"weight",label:"Weight",color:CLR.purple,proj:allW,mn:minW,mx:maxW,unit:"kg",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.weight})).filter(p=>p.v)},
    {key:"fat",label:"Fat %",color:CLR.amber,proj:allF,mn:minF,mx:maxF,unit:"%",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.fat})).filter(p=>p.v)},
    {key:"waist",label:"Waist",color:CLR.teal,proj:allWs,mn:minWs,mx:maxWs,unit:"cm",real:realPoints.map(p=>({wk:wkOfDate(p.date),v:p.waist})).filter(p=>p.v)},
  ];
  const tickStep=Math.max(1,Math.round(n/10));
  const al=lines.find(l=>l.key===active);
  const yTicks=niceTicks(al.mn,al.mx);
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
          <button key={key} onClick={()=>setActive(key)}
            style={{display:"flex",alignItems:"center",gap:6,padding:"4px 10px",borderRadius:20,fontSize:11,cursor:"pointer",
              background:active===key?"transparent":CLR.card2,border:"1px solid "+(active===key?color:CLR.border),color:active===key?color:CLR.dim,opacity:active===key?1:0.55}}>
            <span style={{display:"inline-block",width:12,height:0,borderTop:"2px dashed "+(active===key?color:CLR.dim)}}/>{label}
          </button>))}
      </div>
      <svg ref={svgRef} viewBox={"0 0 "+svgW+" "+svgH} style={{width:"100%",display:"block",cursor:"crosshair"}} onMouseMove={handleMM} onMouseLeave={()=>setTip(null)}>
        {groups.map((g,i)=><rect key={i} x={xOf(g[0]-1)} y={padT} width={xOf(g[g.length-1])-xOf(g[0]-1)} height={chartH} fill="#1e3a5f" opacity="0.4"/>)}
        {yTicks.map(t=><line key={t} x1={padL} x2={svgW-padR} y1={yOf(t,al.mn,al.mx)} y2={yOf(t,al.mn,al.mx)} stroke={CLR.border} strokeWidth="0.5"/>)}
        {yTicks.map(t=><text key={"yt"+t} x={padL-4} y={yOf(t,al.mn,al.mx)+4} textAnchor="end" fontSize="9" fill={CLR.muted}>{t}</text>)}
        {lines.map(({key,color,proj,mn,mx})=>key===active&&<polyline key={key} points={proj.map((v,i)=>xOf(i)+","+yOf(v,mn,mx)).join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.4"/>)}
        {lines.map(({key,color,real,mn,mx})=>key===active&&real.length>1&&<polyline key={key+"r"} points={real.map(p=>xOf(Math.min(p.wk,n))+","+yOf(p.v,mn,mx)).join(" ")} fill="none" stroke={color} strokeWidth="2.5"/>)}
        {lines.map(({key,color,real,mn,mx})=>key===active&&real.map((p,i)=><circle key={key+i} cx={xOf(Math.min(p.wk,n))} cy={yOf(p.v,mn,mx)} r="4" fill={color} stroke={CLR.bg} strokeWidth="2"/>))}
        {lines.map(({key,color,proj,mn,mx})=>key===active&&[0,n].map(i=><circle key={key+i} cx={xOf(i)} cy={yOf(proj[i],mn,mx)} r="3" fill={color} opacity="0.4"/>))}
        {tip&&(()=>{
          const bx=tip.x>svgW*0.65?tip.x-120:tip.x+10,by=padT+4;
          return <g>
            <line x1={tip.x} x2={tip.x} y1={padT} y2={padT+chartH} stroke="#fff" strokeWidth="0.5" opacity="0.2"/>
            <circle cx={tip.x} cy={yOf(al.proj[tip.idx],al.mn,al.mx)} r="4" fill={al.color} stroke={CLR.bg} strokeWidth="2"/>
            <rect x={bx} y={by} width={112} height={38} rx="6" fill="#1e1e35" stroke={CLR.border} strokeWidth="0.5"/>
            <text x={bx+8} y={by+14} fontSize="10" fill={CLR.muted}>{fmtDateShort(tip.date)}</text>
            <text x={bx+8} y={by+28} fontSize="11" fill={al.color}>{al.label+": "+Math.round(al.proj[tip.idx]*10)/10+al.unit}</text>
          </g>;
        })()}
        {Array.from({length:Math.ceil(n/tickStep)+1},(_,j)=>{const i=j*tickStep;if(i>n)return null;return<g key={i}><line x1={xOf(i)} x2={xOf(i)} y1={padT+chartH} y2={padT+chartH+4} stroke={CLR.border} strokeWidth="1"/><text x={xOf(i)} y={padT+chartH+14} textAnchor="middle" fontSize="9" fill={CLR.muted}>{fmtDateShort(addWeeks(new Date(startDate),i))}</text></g>;})}
        <rect x={svgW-padR-78} y={6} width={10} height={10} fill="#1e3a5f" opacity="0.8"/>
        <text x={svgW-padR-64} y={15} fontSize="10" fill={CLR.muted}>Break wk</text>
        <line x1={svgW-padR-78} x2={svgW-padR-64} y1={26} y2={26} stroke={al.color} strokeWidth="1.5" strokeDasharray="4 3" opacity="0.5"/>
        <text x={svgW-padR-60} y={30} fontSize="10" fill={CLR.muted}>Projected</text>
        <line x1={svgW-padR-78} x2={svgW-padR-64} y1={42} y2={42} stroke={al.color} strokeWidth="2.5"/>
        <text x={svgW-padR-60} y={46} fontSize="10" fill={CLR.muted}>Actual</text>
      </svg>
    </div>
  );
}
