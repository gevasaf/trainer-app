// @ts-nocheck
import { useState, useRef, useEffect } from "react";
import React from "react";
import { storageGet, storageSet, clearUserData } from "./lib/storage";
import { getSession } from "./lib/supabase";

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────
const T = {
  en: {
    dir:"ltr", setup:"Setup", dashboard:"Dashboard", timeline:"Timeline",
    assistant:"Assistant", log:"Log",
    step1:"About You", step2:"Your Goals", next:"Next →",
    name:"Name", age:"Age (yrs)", gender:"Gender", male:"Male", female:"Female",
    height:"Height (cm)", weight:"Weight (kg)", waist:"Waist (cm)",
    activity:"Activity Level",
    actLevels:[
      {label:"Sedentary",desc:"Desk job, drive everywhere",mult:1.2},
      {label:"Lightly active",desc:"Some walking, mostly sitting",mult:1.375},
      {label:"Moderately active",desc:"On your feet most of the day",mult:1.55},
      {label:"Very active",desc:"Physical job or very active lifestyle",mult:1.725},
      {label:"Athlete",desc:"Hard physical work all day",mult:1.9},
    ],
    actLevelInfo:"Pick the level that matches your everyday background movement — your commute, job, and general lifestyle. Workouts you log separately are counted on top of this.",
    activityLogInfo:"Log intentional workouts only — gym sessions, runs, cycling, sports, etc. Everyday movement like walking to the shops or household chores is already captured in your activity level.",
    tdee:"TDEE", fatPct:"Est. Body Fat %", bmi:"BMI",
    durationWeeks:"Program duration (weeks)", breakWeeks:"Break weeks",
    calDeficit:"Avg calorie deficit / day",
    protein:"Protein", carbs:"Carbs", fat:"Fat", fiber:"Fiber", water:"Water",
    workoutsPerWeek:"Workouts per week",
    projectedGoals:"Projected at end of program",
    targetWeight:"Target weight", targetFat:"Target body fat %", targetWaist:"Target waist",
    applyBtn:"Looks good — let's go!", comingSoon:"Coming soon",
    calculatedNutrition:"Calculated daily nutrition",
    addFood:"Add food / water", addActivity:"Add activity", endOfDay:"End of day",
    describeFood:"e.g. 2 eggs, toast with butter and a coffee with milk",
    describeActivity:"e.g. 45 min run at moderate pace",
    analyzing:"Analyzing…", add:"Add", cancel:"Cancel",
    todayLog:"Today's log", net:"Net", burned:"Burned", eaten:"Eaten",
    remaining:"Remaining", goal:"Goal",
    endOfDayMsg:"You've committed to not eating until tomorrow. Well done!",
    logTab:"Log", filterType:"Type", filterDate:"Date range",
    all:"All", food:"Food", activityType:"Activity", bodyType:"Body", system:"End of day",
    noLogs:"No entries yet",
    recordWeight:"Record body stats",
    weightLabel:"Weight (kg)", waistLabel:"Waist (cm)",
    save:"Save", realData:"Your progress", projected:"Projected",
    typeMsg:"Message your trainer…", send:"Send",
    thinking:"Thinking…", searching:"Searching logs…",
    endOfDaySummary:"End of day", weekSummary:"Week summary", newMeasurement:"New measurement",
    unread:"unread",
    calories:"Calories",
    settings:"Settings", language:"Language",
    deleteData:"Delete all data", deleteDataTitle:"Delete all data?",
    deleteDataMsg:"This will permanently erase all your logs, measurements, and training program. Your account (email & password) stays. You'll be taken back to setup.",
    deleteDataConfirm:"Yes, delete everything",
    eodConfirmTitle:"End your day?",
    eodConfirmMsg:"This means you're done eating for today. You won't be able to add food until tomorrow.",
    eodConfirmBtn:"Yes, end my day",
  },
  he: {
    dir:"rtl", setup:"הגדרה", dashboard:"לוח בקרה", timeline:"ציר זמן",
    assistant:"מאמן", log:"יומן",
    step1:"על עצמך", step2:"היעדים שלך", next:"הבא →",
    name:"שם", age:"גיל", gender:"מין", male:"זכר", female:"נקבה",
    height:"גובה (ס\"מ)", weight:"משקל (ק\"ג)", waist:"מותניים (ס\"מ)",
    activity:"רמת פעילות",
    actLevels:[
      {label:"יושבני",desc:"עבודת משרד, נסיעה בכל מקום",mult:1.2},
      {label:"קצת פעיל",desc:"קצת הליכה, בעיקר ישיבה",mult:1.375},
      {label:"בינוני",desc:"על הרגליים רוב היום",mult:1.55},
      {label:"פעיל מאוד",desc:"עבודה פיזית או אורח חיים פעיל מאוד",mult:1.725},
      {label:"אתלט",desc:"עבודה פיזית קשה כל היום",mult:1.9},
    ],
    actLevelInfo:"בחר את הרמה שמתאימה לתנועה היומיומית שלך — נסיעות, עבודה ואורח חיים כללי. אימונים שאתה מתעד בנפרד נספרים בנוסף לכך.",
    activityLogInfo:"תעד רק אימונים מכוונים — חדר כושר, ריצה, רכיבה על אופניים, ספורט וכו'. תנועה יומיומית כמו הליכה לחנות או עבודות בית כבר נלקחת בחשבון ברמת הפעילות שלך.",
    tdee:"TDEE", fatPct:"אחוז שומן", bmi:"BMI",
    durationWeeks:"משך התוכנית (שבועות)", breakWeeks:"שבועות הפסקה",
    calDeficit:"גירעון קלורי יומי ממוצע",
    protein:"חלבון", carbs:"פחמימות", fat:"שומן", fiber:"סיבים", water:"מים",
    workoutsPerWeek:"אימונים בשבוע",
    projectedGoals:"יעדים בסוף התוכנית",
    targetWeight:"משקל יעד", targetFat:"אחוז שומן יעד", targetWaist:"מותניים יעד",
    applyBtn:"מעולה — יאללה!", comingSoon:"בקרוב",
    calculatedNutrition:"תזונה יומית מחושבת",
    addFood:"הוסף אוכל / שתייה", addActivity:"הוסף פעילות", endOfDay:"סיום יום",
    describeFood:"למשל: 2 ביצים, טוסט עם חמאה וקפה עם חלב",
    describeActivity:"למשל: ריצה של 45 דקות בקצב מתון",
    analyzing:"מנתח…", add:"הוסף", cancel:"ביטול",
    todayLog:"יומן היום", net:"נטו", burned:"נשרף", eaten:"נאכל",
    remaining:"נותר", goal:"יעד",
    endOfDayMsg:"התחייבת לא לאכול עד מחר. כל הכבוד!",
    logTab:"יומן", filterType:"סוג", filterDate:"טווח תאריכים",
    all:"הכל", food:"אוכל", activityType:"פעילות", bodyType:"גוף", system:"סיום יום",
    noLogs:"אין רשומות עדיין",
    recordWeight:"רשום מדדי גוף",
    weightLabel:"משקל (ק\"ג)", waistLabel:"מותניים (ס\"מ)",
    save:"שמור", realData:"ההתקדמות שלך", projected:"תחזית",
    typeMsg:"שלח הודעה למאמן…", send:"שלח",
    thinking:"חושב…", searching:"מחפש ביומן…",
    endOfDaySummary:"סיכום יום", weekSummary:"סיכום שבוע", newMeasurement:"מדידה חדשה",
    unread:"חדש",
    calories:"קלוריות",
    settings:"הגדרות", language:"שפה",
    deleteData:"מחק את כל הנתונים", deleteDataTitle:"למחוק את כל הנתונים?",
    deleteDataMsg:"פעולה זו תמחק לצמיתות את כל היומנים, המדידות ותוכנית האימון שלך. החשבון (אימייל וסיסמה) יישמר. תועבר חזרה למסך ההגדרה.",
    deleteDataConfirm:"כן, מחק הכל",
    eodConfirmTitle:"לסיים את היום?",
    eodConfirmMsg:"כלומר סיימת לאכול להיום. לא תוכל להוסיף אוכל עד מחר.",
    eodConfirmBtn:"כן, לסיים",
  }
};

// ─── CONSTANTS / HELPERS ──────────────────────────────────────────────────────
const CLR = {
  bg:"#0f0f17", card:"#17172a", card2:"#1e1e35", border:"#2a2a45",
  purple:"#a78bfa", purpleDark:"#7c3aed", purpleBg:"#4c1d95",
  green:"#34d399", blue:"#38bdf8", amber:"#fbbf24", red:"#f87171", teal:"#2dd4bf",
  text:"#e5e5f0", muted:"#888", dim:"#555"
};

function todayKey() {
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
function weekStart(dateStr) {
  const d = new Date(dateStr); const day = d.getDay();
  d.setDate(d.getDate() - day); return d.toISOString().slice(0,10);
}
function nextSunday() {
  const d = new Date(); const du = (7-d.getDay())%7||7;
  d.setDate(d.getDate()+du); d.setHours(0,0,0,0); return d;
}
function addWeeks(date,weeks) { const d=new Date(date); d.setDate(d.getDate()+weeks*7); return d; }
function fmtDate(d,lang) { return d.toLocaleDateString(lang==="he"?"he-IL":"en-US",{day:"numeric",month:"short",year:"numeric"}); }
function fmtDateShort(d) { return d.getDate()+"/"+(d.getMonth()+1); }
function mergeGroups(weeks) {
  if(!weeks.length) return [];
  const s=[...weeks].sort((a,b)=>a-b); const g=[]; let r=[s[0]];
  for(let i=1;i<s.length;i++){if(s[i]===s[i-1]+1)r.push(s[i]);else{g.push(r);r=[s[i]];}}
  g.push(r); return g;
}
function breakWeekLabel(weeks,startDate,lang) {
  if(!weeks.length) return null;
  return mergeGroups(weeks).map(g=>{
    const from=addWeeks(startDate,g[0]-1),to=addWeeks(startDate,g[g.length-1]);
    to.setDate(to.getDate()-1);
    return (g.length>1?"Wks "+g[0]+"–"+g[g.length-1]:"Wk "+g[0])+": "+fmtDate(from,lang)+" – "+fmtDate(to,lang);
  }).join("  •  ");
}
function calcFatPct(gender,bmi,height=null,waist=null){
  if(height&&waist){
    // Relative Fat Mass formula (Woolcott & Bergman 2018) — more accurate than BMI alone
    const rfm=gender==="male"?64-(20*height/waist):76-(20*height/waist);
    return Math.round(Math.max(3,Math.min(60,rfm)));
  }
  if(!bmi)return null;
  return gender==="male"?Math.round(1.20*bmi+0.23*30-16.2):Math.round(1.20*bmi+0.23*30-5.4);
}
function calcTDEE(p){
  const bmr=p.gender==="male"?10*p.weight+6.25*p.height-5*p.age+5:10*p.weight+6.25*p.height-5*p.age-161;
  return Math.round(bmr*p.actMult);
}
function autoNutrition(tdee,deficit,proteinG,weight){
  const tc=tdee-deficit,pc=proteinG*4,fatCal=Math.round(tc*0.28),fatG=Math.round(fatCal/9),
        carbCal=Math.max(0,tc-pc-fatCal),carbG=Math.round(carbCal/4),
        fiberG=Math.round(14*(tc/1000)),waterL=Math.round(weight*0.033*10)/10;
  return {targetCal:tc,protein:proteinG,carbs:carbG,fat:fatG,fiber:fiberG,water:waterL};
}
function buildTimeline(weeks,breakWeeks,deficit,sw,sf,sws){
  const dkw=(deficit*7)/7700; let w=sw,f=sf,ws=sws; const pts=[{w,f,ws}];
  for(let i=1;i<=weeks;i++){
    const b=breakWeeks.includes(i);
    if(b){w+=dkw*0.15;f+=0.08;ws+=0.06;}
    else{w-=dkw;f-=Math.max(0,(f*dkw/Math.max(w,1))*0.65);ws-=0.09;}
    pts.push({w:Math.round(w*10)/10,f:Math.max(4,Math.round(f*10)/10),ws:Math.round(ws*10)/10});
  }
  return pts;
}
function dayTotals(entries, dateKey) {
  return entries.filter(e=>e.date===dateKey).reduce((a,e)=>{
    if(e.type==="food"){a.cal+=e.calories||0;a.protein+=e.protein||0;a.carbs+=e.carbs||0;a.fat+=e.fat||0;a.fiber+=e.fiber||0;a.water+=e.water||0;}
    if(e.type==="activity")a.burned+=e.calories_burned||0;
    return a;
  },{cal:0,protein:0,carbs:0,fat:0,fiber:0,water:0,burned:0});
}
function round1(n){return Math.round(n*10)/10;}

// ─── CONTEXT BUILDERS ─────────────────────────────────────────────────────────
function buildEODContext(entries, dateKey, goals, isNewWeek, allEntries) {
  const dt = dayTotals(entries, dateKey);
  const g = goals.nutrition;
  const netCal = Math.round(dt.cal - dt.burned);
  let text = `[END OF DAY: ${dateKey}]\nNet calories: ${netCal} / ${g.targetCal} kcal | Eaten: ${Math.round(dt.cal)} kcal | Burned: ${Math.round(dt.burned)} kcal | Protein: ${Math.round(dt.protein)}g / ${g.protein}g | Carbs: ${Math.round(dt.carbs)}g / ${g.carbs}g | Fat: ${Math.round(dt.fat)}g / ${g.fat}g | Fiber: ${Math.round(dt.fiber)}g / ${g.fiber}g | Water: ${round1(dt.water)}L / ${g.water}L`;
  if (isNewWeek) {
    const ws = weekStart(dateKey);
    const days = [...new Set(allEntries.filter(e=>weekStart(e.date)===ws&&e.date<=dateKey).map(e=>e.date))].sort();
    if (days.length > 1) {
      const tots = days.map(d=>({date:d,...dayTotals(allEntries,d)}));
      const avg = (key) => round1(tots.reduce((s,d)=>s+(d[key]||0),0)/tots.length);
      const avgNet = round1(tots.reduce((s,d)=>s+(d.cal-d.burned),0)/tots.length);
      text += `\n\n[WEEK SUMMARY: week of ${ws} — ${days.length} logged days]\nAvg net calories: ${avgNet} kcal (goal ${g.targetCal}) | Avg eaten: ${avg("cal")} kcal | Avg burned: ${avg("burned")} kcal | Avg protein: ${avg("protein")}g | Avg carbs: ${avg("carbs")}g | Avg fat: ${avg("fat")}g | Avg fiber: ${avg("fiber")}g | Avg water: ${avg("water")}L`;
    }
  }
  return text;
}
function buildMeasurementContext(bodyPoints, newPoint) {
  const prev = [...bodyPoints].reverse().find(p=>p.date < newPoint.date);
  let text = `[NEW MEASUREMENT: ${newPoint.date}]\nWeight: ${newPoint.weight||"n/a"} kg | Waist: ${newPoint.waist||"n/a"} cm | Est. body fat: ${newPoint.fat||"n/a"}%`;
  if (prev) {
    const dw = newPoint.weight && prev.weight ? round1(newPoint.weight-prev.weight) : null;
    const dws = newPoint.waist && prev.waist ? round1(newPoint.waist-prev.waist) : null;
    text += `\nVs previous (${prev.date}): weight ${dw!=null?(dw>0?"+":"")+dw+"kg":"n/a"} | waist ${dws!=null?(dws>0?"+":"")+dws+"cm":"n/a"}`;
  }
  if (bodyPoints.length > 0)
    text += `\nFull measurement history: `+bodyPoints.map(p=>`${p.date}: ${p.weight||"?"}kg / ${p.waist||"?"}cm / ${p.fat||"?"}%`).join(" | ");
  return text;
}

// ─── API CALLS ────────────────────────────────────────────────────────────────
async function fetchWithRetry(url, options, retries=3, baseDelay=1000) {
  for(let i=0;i<retries;i++){
    try{
      const res = await fetch(url, options);
      if(res.ok || res.status < 500) return res; // don't retry 4xx
      if(i===retries-1) return res;
    }catch(e){
      if(i===retries-1) throw e;
    }
    await new Promise(r=>setTimeout(r, baseDelay * 2**i));
  }
}
async function parseFood(desc) {
  const session = await getSession();
  const res = await fetchWithRetry("/api/analyze", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({type:"food",description:desc}),
  });
  return res.json();
}
async function parseActivity(desc, weightKg) {
  const session = await getSession();
  const res = await fetchWithRetry("/api/analyze", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({type:"activity",description:desc,weightKg}),
  });
  return res.json();
}
async function callAssistant(mode, userMsg, chatHistory, appData, allEntries, bodyPoints, eventContext) {
  const session = await getSession();
  const now = new Date();
  const clientNow = now.toLocaleString("en-GB",{weekday:"long",year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});
  const utcOffset = -now.getTimezoneOffset(); // minutes east of UTC
  const res = await fetchWithRetry("/api/chat", {
    method:"POST",
    headers:{"Content-Type":"application/json","Authorization":`Bearer ${session?.access_token}`},
    body:JSON.stringify({mode,userMsg,chatHistory,appData,allEntries,bodyPoints,eventContext,clientNow,utcOffset}),
  });
  return res.json();
}

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Card({children,style}){return <div style={{background:CLR.card,borderRadius:14,padding:18,border:"1px solid "+CLR.border,...style}}>{children}</div>;}
function Btn({children,onClick,style,disabled,variant="primary"}){
  const v={primary:{background:CLR.purpleDark,color:"#fff",border:"none"},ghost:{background:CLR.card2,color:CLR.muted,border:"1px solid "+CLR.border}};
  return <button onClick={disabled?undefined:onClick} style={{borderRadius:10,padding:"10px 16px",fontSize:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,...v[variant],...style}}>{children}</button>;
}
const inp = {width:"100%",background:CLR.card2,border:"1px solid "+CLR.border,borderRadius:9,padding:"9px 12px",color:CLR.text,fontSize:14,boxSizing:"border-box"};

function InfoTip({text}){
  const [open,setOpen]=useState(false);
  return(
    <span style={{position:"relative",display:"inline-flex",alignItems:"center"}}>
      <button onClick={e=>{e.stopPropagation();setOpen(o=>!o);}} style={{background:"none",border:"none",cursor:"pointer",color:CLR.muted,fontSize:14,lineHeight:1,padding:"0 2px"}}>ⓘ</button>
      {open&&<>
        <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:299}}/>
        <div style={{position:"absolute",bottom:"calc(100% + 6px)",left:"50%",transform:"translateX(-50%)",background:CLR.card,border:"1px solid "+CLR.border,borderRadius:10,padding:"10px 12px",fontSize:12,color:CLR.muted,lineHeight:1.5,width:240,zIndex:300,boxShadow:"0 4px 20px rgba(0,0,0,0.5)"}}>
          {text}
        </div>
      </>}
    </span>
  );
}

function Ring({value,max,color,label,unit,size=68}){
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

// ─── BODY STAT MODAL ──────────────────────────────────────────────────────────
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

// ─── TIMELINE CHART ───────────────────────────────────────────────────────────
function TimelineChart({weeks,breakWeeks,startDate,goals,realPoints,lang}){
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

// ─── SETUP FLOW ───────────────────────────────────────────────────────────────
function SetupFlow({onComplete,t,lang,toggleLang}){
  const [step,setStep]=useState(1);
  const [p,setP]=useState({name:"",age:30,gender:"male",height:175,weight:80,waist:85,actIdx:2});
  const act=t.actLevels[p.actIdx];
  const bmi=p.height&&p.weight?Math.round((p.weight/((p.height/100)**2))*10)/10:null;
  const fatPct=p.height&&p.waist?calcFatPct(p.gender,bmi,p.height,p.waist):bmi?calcFatPct(p.gender,bmi):null;
  const profile={...p,actMult:act.mult,bmi,fatPct,date:new Date().toISOString().slice(0,10)};
  const tdee=p.height&&p.weight&&p.age?calcTDEE(profile):null;
  const startDate=nextSunday();
  const [dur,setDur]=useState(12);
  const [breakWks,setBreakWks]=useState([]);
  const [deficit,setDeficit]=useState(400);
  const [proteinPerKg,setProteinPerKg]=useState(1.8);
  const [workoutsPerWeek,setWorkoutsPerWeek]=useState(4);
  const proteinG=Math.round(p.weight*proteinPerKg);
  const nutrition=tdee?autoNutrition(tdee,deficit,proteinG,p.weight):null;
  const activeWeeks=dur-breakWks.length,dkw=(deficit*7)/7700;
  const projW=Math.round((p.weight-dkw*activeWeeks)*10)/10;
  const projFat=fatPct?Math.round((fatPct-fatPct*(dkw*activeWeeks/Math.max(p.weight,1))*0.6)*10)/10:null;
  const projWaist=Math.round((p.waist-0.09*activeWeeks)*10)/10;
  function toggleBreak(w){setBreakWks(prev=>prev.includes(w)?prev.filter(x=>x!==w):[...prev,w].sort((a,b)=>a-b));}
  function apply(){
    onComplete({profile,tdee,fatPct,bmi,
      goals:{deficit,nutrition,proteinPerKg,workoutsPerWeek,durationWeeks:dur,breakWeeks:breakWks,
        startDate:startDate.toISOString().slice(0,10),
        startWeight:p.weight,startFat:fatPct,startWaist:p.waist,
        targetWeight:projW,targetFat:projFat,targetWaist:projWaist}});
  }
  return(
    <div style={{height:"100dvh",background:CLR.bg,color:CLR.text,fontFamily:"system-ui,sans-serif",direction:t.dir,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden"}}>
      {/* Fixed header */}
      <div style={{width:"100%",maxWidth:540,flexShrink:0,padding:"24px 16px 0"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div><div style={{fontSize:22,fontWeight:700,color:CLR.purple}}>{"💪 "+t.setup}</div>
            <div style={{fontSize:12,color:CLR.muted,marginTop:2}}>{"Step "+step+" of 2"}</div></div>
          <button onClick={toggleLang} style={{background:CLR.card,border:"1px solid "+CLR.border,color:CLR.muted,borderRadius:8,padding:"6px 14px",cursor:"pointer",fontSize:13}}>{lang==="en"?"עב":"EN"}</button>
        </div>
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
            <div style={{fontSize:12,color:CLR.muted,marginBottom:8}}>{t.breakWeeks}</div>
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
            <TimelineChart weeks={dur} breakWeeks={breakWks} startDate={startDate} goals={{deficit,startWeight:p.weight,startFat:fatPct||20,startWaist:p.waist}} realPoints={[]} lang={lang}/>
          </Card>
          <div style={{display:"flex",gap:10}}><Btn variant="ghost" onClick={()=>setStep(1)} style={{flex:0}}>← Back</Btn><Btn onClick={apply} style={{flex:1}}>{t.applyBtn+" 🚀"}</Btn></div>
        </div>)}
      </div>
    </div>
  );
}


// ─── CONFIRM MODAL ────────────────────────────────────────────────────────────
function ConfirmModal({title,message,confirmText,danger=false,onConfirm,onCancel}){
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

// ─── ADD ENTRY MODAL ──────────────────────────────────────────────────────────
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

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab({t,appData,entries,setEntries,onEOD}){
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
  const rings=[
    {label:t.calories,value:net,max:goals.targetCal,color:CLR.purple,unit:""},
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
        <Card style={{marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px"}}>
          {[[t.eaten,Math.round(tots.cal),"kcal",CLR.purple],[t.burned,Math.round(tots.burned),"kcal",CLR.amber],[t.net,net,"kcal",net>goals.targetCal?CLR.red:CLR.green]].map(([l,v,u,c])=>(
            <div key={l} style={{textAlign:"center"}}><div style={{fontSize:11,color:CLR.muted}}>{l}</div><div style={{fontSize:20,fontWeight:700,color:c}}>{v}</div><div style={{fontSize:10,color:CLR.dim}}>{u}</div></div>))}
        </Card>
        <Card style={{marginBottom:10,padding:"12px 8px"}}>
          <div style={{display:"flex",justifyContent:"space-around",flexWrap:"wrap",gap:6}}>{rings.map(r=><Ring key={r.label} {...r}/>)}</div>
        </Card>
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

// ─── TIMELINE TAB ─────────────────────────────────────────────────────────────
function TimelineTab({t,appData,bodyPoints,setBodyPoints,onMeasurement,lang}){
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
            goals={{deficit:goals.deficit,startWeight:goals.startWeight,startFat:goals.startFat||20,startWaist:goals.startWaist}}
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

// ─── ASSISTANT TAB ────────────────────────────────────────────────────────────
function AssistantTab({t,appData,entries,bodyPoints,chatHistory,setChatHistory,setUnreadCount,lang}){
  const [input,setInput]=useState("");
  const [status,setStatus]=useState(null);
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
        {chatHistory.length===0&&(
          <div style={{textAlign:"center",padding:"40px 20px",color:CLR.dim}}>
            <div style={{fontSize:32,marginBottom:8}}>🤖</div>
            <div style={{fontSize:14,color:CLR.muted}}>Your AI trainer is ready.</div>
            <div style={{fontSize:12,marginTop:4}}>Ask anything about your progress, food, training, or plans.</div>
          </div>)}
        {chatHistory.map((msg,i)=>{
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

// ─── LOG TAB ──────────────────────────────────────────────────────────────────
function LogTab({t,entries,bodyPoints}){
  const [filterType,setFilterType]=useState("all"),[fromDate,setFromDate]=useState(""),[toDate,setToDate]=useState("");
  const typeIcon={food:"🍽",activity:"🏃",eod:"🌙",body:"⚖️"};
  const typeColor={food:CLR.purple,activity:CLR.green,eod:CLR.amber,body:CLR.teal};
  const all=[...entries,...bodyPoints.map(p=>({...p,type:"body",label:"Weight: "+(p.weight||"?")+"kg  Waist: "+(p.waist||"?")+"cm"+(p.fat?"  Fat: "+p.fat+"%":"")}))].sort((a,b)=>b.ts-a.ts);
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
            <div style={{fontSize:11,color:CLR.dim,flexShrink:0,textAlign:"right"}}><div>{e.date}</div><div style={{color:typeColor[e.type]||CLR.dim}}>{e.type}</div></div>
          </div>))}
      </div>
    </div>
  );
}

// ─── MENU DROPDOWN ────────────────────────────────────────────────────────────
function MenuDropdown({t,lang,toggleLang,onDeleteData,onClose}){
  const [confirmDelete,setConfirmDelete]=useState(false);
  if(confirmDelete) return(
    <ConfirmModal
      title={t.deleteDataTitle} message={t.deleteDataMsg}
      confirmText={t.deleteDataConfirm} danger
      onConfirm={onDeleteData} onCancel={()=>setConfirmDelete(false)}/>
  );
  const row=(label,right,onClick,red=false)=>(
    <button onClick={onClick} style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",background:"none",border:"none",borderTop:"1px solid "+CLR.border,padding:"12px 16px",cursor:"pointer",color:red?CLR.red:CLR.text,fontSize:14,gap:16}}>
      <span>{label}</span><span style={{color:red?CLR.red:CLR.muted,fontSize:13,whiteSpace:"nowrap"}}>{right}</span>
    </button>);
  const side=t.dir==="rtl"?{right:0}:{left:0};
  return(
    <>
      <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:299}}/>
      <div style={{position:"absolute",top:"calc(100% + 6px)",...side,zIndex:300,background:CLR.card,borderRadius:12,border:"1px solid "+CLR.border,minWidth:220,boxShadow:"0 8px 24px rgba(0,0,0,0.4)",overflow:"hidden"}}>
        {row(t.language, lang==="en"?"🇮🇱 עברית":"🇺🇸 English", toggleLang)}
        {row("⚠️ "+t.deleteData, "→", ()=>setConfirmDelete(true), true)}
      </div>
    </>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function MainApp({data,t,lang,toggleLang,onReset,greetOnMount}){
  const [tab,setTab]=useState(0);
  const [entries,setEntries]=useState([]);
  const [bodyPoints,setBodyPoints]=useState([]);
  const [chatHistory,setChatHistory]=useState([]);
  const [unreadCount,setUnreadCount]=useState(0);
  const [storeReady,setStoreReady]=useState(false);
  const [menuOpen,setMenuOpen]=useState(false);
  const lastEODCheck=useRef(null);

  async function handleDeleteData(){
    await clearUserData();
    onReset();
  }

  useEffect(()=>{
    (async()=>{
      try{
        const e=await storageGet("entries"); if(e?.value)setEntries(JSON.parse(e.value));
        const b=await storageGet("bodyPoints"); if(b?.value)setBodyPoints(JSON.parse(b.value));
        const c=await storageGet("chatHistory"); if(c?.value)setChatHistory(JSON.parse(c.value));
      }catch(er){}
      setStoreReady(true);
    })();
  },[]);

  useEffect(()=>{ if(!storeReady)return; storageSet("entries",JSON.stringify(entries)).catch(()=>{}); },[entries,storeReady]);
  useEffect(()=>{ if(!storeReady)return; storageSet("bodyPoints",JSON.stringify(bodyPoints)).catch(()=>{}); },[bodyPoints,storeReady]);
  useEffect(()=>{ if(!storeReady)return; storageSet("chatHistory",JSON.stringify(chatHistory)).catch(()=>{}); },[chatHistory,storeReady]);

  useEffect(()=>{
    if(!storeReady||!greetOnMount)return;
    callAssistant("greeting",null,[],data,entries,bodyPoints,null)
      .then(res=>{if(res?.text){setChatHistory([{role:"assistant",content:res.text,ts:Date.now()}]);setUnreadCount(1);}})
      .catch(()=>{});
  },[storeReady]);

  useEffect(()=>{
    if(!storeReady)return;
    const today=todayKey();
    if(lastEODCheck.current===today)return;
    lastEODCheck.current=today;
    const daysWithEntries=[...new Set(entries.filter(e=>e.date<today&&e.type!=="eod").map(e=>e.date))].sort();
    if(!daysWithEntries.length)return;
    const lastDay=daysWithEntries[daysWithEntries.length-1];
    if(entries.some(e=>e.date===lastDay&&e.type==="eod"))return;
    const eodEntry={type:"eod",date:lastDay,ts:new Date(lastDay+"T23:59:00").getTime(),label:"Auto end-of-day recorded",auto:true};
    setEntries(prev=>[...prev,eodEntry]);
    triggerEODEvent(eodEntry,[...entries,eodEntry]);
  },[storeReady]);

  async function triggerEODEvent(eodEntry, allEntries) {
    const dateKey=eodEntry.date;
    const isNewWeek = weekStart(dateKey) !== weekStart(todayKey());
    const eodCtx=buildEODContext(allEntries,dateKey,data.goals,isNewWeek,allEntries);
    const dt=dayTotals(allEntries,dateKey);
    const eventCard={role:"event",eventType:"eod",data:{...dt,net:Math.round(dt.cal-dt.burned)},date:dateKey,ts:eodEntry.ts};
    let newHistory=[...chatHistory,eventCard];
    if(isNewWeek){
      const ws=weekStart(dateKey);
      const days=[...new Set(allEntries.filter(e=>weekStart(e.date)===ws).map(e=>e.date))].sort();
      const tots=days.map(d=>dayTotals(allEntries,d));
      const avg=k=>round1(tots.reduce((s,d)=>s+(d[k]||0),0)/Math.max(tots.length,1));
      const avgNet=round1(tots.reduce((s,d)=>s+(d.cal-d.burned),0)/Math.max(tots.length,1));
      newHistory=[...newHistory,{role:"event",eventType:"week",data:{cal:avg("cal"),protein:avg("protein"),carbs:avg("carbs"),fat:avg("fat"),fiber:avg("fiber"),water:avg("water"),burned:avg("burned"),net:avgNet},ts:eodEntry.ts}];
    }
    setChatHistory(newHistory);
    try{
      const res=await callAssistant("eod",null,newHistory,data,allEntries,[],eodCtx);
      setChatHistory(h=>[...h,{role:"assistant",content:res.text,ts:Date.now()}]);
      setUnreadCount(c=>c+1);
    }catch(e){}
  }

  async function handleMeasurement(pt){
    const ctx=buildMeasurementContext(bodyPoints,pt);
    const eventCard={role:"event",eventType:"measurement",data:pt,ts:pt.ts};
    const newHistory=[...chatHistory,eventCard];
    setChatHistory(newHistory);
    try{
      const res=await callAssistant("measurement",null,newHistory,data,entries,[...bodyPoints,pt],ctx);
      setChatHistory(h=>[...h,{role:"assistant",content:res.text,ts:Date.now()}]);
      setUnreadCount(c=>c+1);
    }catch(e){}
  }

  const tabs=[t.dashboard,t.timeline,t.assistant,t.log];

  return(
    <div style={{height:"100dvh",background:CLR.bg,color:CLR.text,fontFamily:"system-ui,sans-serif",direction:t.dir,display:"flex",flexDirection:"column",alignItems:"center",overflow:"hidden"}}>
      {/* Header */}
      <div style={{width:"100%",maxWidth:680,flexShrink:0,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative"}}>
            <button onClick={()=>setMenuOpen(o=>!o)} style={{background:menuOpen?CLR.purple:"none",border:"1px solid "+(menuOpen?CLR.purple:CLR.border),color:menuOpen?"#fff":CLR.muted,borderRadius:8,padding:"4px 10px",cursor:"pointer",fontSize:16,lineHeight:1.4,flexShrink:0}}>☰</button>
            {menuOpen&&<MenuDropdown t={t} lang={lang} toggleLang={()=>{toggleLang();setMenuOpen(false);}} onDeleteData={handleDeleteData} onClose={()=>setMenuOpen(false)}/>}
          </div>
          <div>
            <div style={{fontSize:18,fontWeight:700}}>{"👋 "+data.profile.name}</div>
            <div style={{fontSize:11,color:CLR.muted,display:"flex",gap:6,alignItems:"center"}}>
              <span>{new Date().toLocaleDateString(lang==="he"?"he-IL":"en-US",{weekday:"long",month:"long",day:"numeric"})}</span>
              <span style={{opacity:0.4}}>·</span>
              <span style={{opacity:0.5}}>{"v"+ __APP_VERSION__}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{width:"100%",maxWidth:680,flexShrink:0,display:"flex",borderBottom:"1px solid "+CLR.border,margin:"10px 0 0",padding:"0 8px",overflowX:"auto"}}>
        {tabs.map((tb,i)=>(
          <button key={i} onClick={()=>setTab(i)}
            style={{background:"none",border:"none",color:tab===i?CLR.purple:CLR.muted,borderBottom:tab===i?"2px solid "+CLR.purple:"2px solid transparent",padding:"10px 14px",cursor:"pointer",fontSize:13,fontWeight:tab===i?600:400,whiteSpace:"nowrap",flexShrink:0,position:"relative"}}>
            {tb}
            {i===2&&unreadCount>0&&tab!==2&&(
              <span style={{position:"absolute",top:6,right:4,background:CLR.red,color:"#fff",borderRadius:10,fontSize:9,fontWeight:700,padding:"1px 5px",minWidth:14,textAlign:"center"}}>{unreadCount}</span>)}
          </button>))}
      </div>

      {/* Content area — each tab manages its own scroll */}
      <div style={{width:"100%",maxWidth:680,flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {tab===0&&<DashboardTab t={t} appData={data} entries={entries} setEntries={setEntries} onEOD={triggerEODEvent}/>}
        {tab===1&&<TimelineTab t={t} appData={data} bodyPoints={bodyPoints} setBodyPoints={setBodyPoints} onMeasurement={handleMeasurement} lang={lang}/>}
        {tab===2&&<AssistantTab t={t} appData={data} entries={entries} bodyPoints={bodyPoints} chatHistory={chatHistory} setChatHistory={setChatHistory} unreadCount={unreadCount} setUnreadCount={setUnreadCount} lang={lang}/>}
        {tab===3&&<LogTab t={t} entries={entries} bodyPoints={bodyPoints}/>}
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
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
