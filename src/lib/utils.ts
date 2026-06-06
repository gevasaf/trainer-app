// @ts-nocheck
export const CLR = {
  bg:"#0f0f17", card:"#17172a", card2:"#1e1e35", border:"#2a2a45",
  purple:"#a78bfa", purpleDark:"#7c3aed", purpleBg:"#4c1d95",
  green:"#34d399", blue:"#38bdf8", amber:"#fbbf24", red:"#f87171", teal:"#2dd4bf",
  text:"#e5e5f0", muted:"#888", dim:"#555"
};

export function todayKey() {
  const d=new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
export function localDateStr(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
export function weekStart(dateStr) {
  const [y,m,day]=dateStr.split("-").map(Number);
  const d=new Date(y,m-1,day); // local midnight — avoids UTC shift
  d.setDate(d.getDate()-d.getDay()); return localDateStr(d);
}
export function nextSunday() {
  const d = new Date(); const du = (7-d.getDay())%7||7;
  d.setDate(d.getDate()+du); d.setHours(0,0,0,0); return d;
}
export function addWeeks(date,weeks) { const d=new Date(date); d.setDate(d.getDate()+weeks*7); return d; }
export function fmtDate(d,lang) { return d.toLocaleDateString(lang==="he"?"he-IL":"en-US",{day:"numeric",month:"short",year:"numeric"}); }
export function fmtDateShort(d) { return d.getDate()+"/"+(d.getMonth()+1); }
export function mergeGroups(weeks) {
  if(!weeks.length) return [];
  const s=[...weeks].sort((a,b)=>a-b); const g=[]; let r=[s[0]];
  for(let i=1;i<s.length;i++){if(s[i]===s[i-1]+1)r.push(s[i]);else{g.push(r);r=[s[i]];}}
  g.push(r); return g;
}
export function breakWeekLabel(weeks,startDate,lang) {
  if(!weeks.length) return null;
  return mergeGroups(weeks).map(g=>{
    const from=addWeeks(startDate,g[0]-1),to=addWeeks(startDate,g[g.length-1]);
    to.setDate(to.getDate()-1);
    return (g.length>1?"Wks "+g[0]+"–"+g[g.length-1]:"Wk "+g[0])+": "+fmtDate(from,lang)+" – "+fmtDate(to,lang);
  }).join("  •  ");
}
export function calcFatPct(gender,bmi,height=null,waist=null){
  if(height&&waist){
    // Relative Fat Mass formula (Woolcott & Bergman 2018) — more accurate than BMI alone
    const rfm=gender==="male"?64-(20*height/waist):76-(20*height/waist);
    return Math.round(Math.max(3,Math.min(60,rfm))*10)/10;
  }
  if(!bmi)return null;
  return gender==="male"?Math.round((1.20*bmi+0.23*30-16.2)*10)/10:Math.round((1.20*bmi+0.23*30-5.4)*10)/10;
}
export function calcTDEE(p){
  const bmr=p.gender==="male"?10*p.weight+6.25*p.height-5*p.age+5:10*p.weight+6.25*p.height-5*p.age-161;
  return Math.round(bmr*p.actMult);
}
export function autoNutrition(tdee,deficit,proteinG,weight){
  const tc=tdee-deficit,pc=proteinG*4,fatCal=Math.round(tc*0.28),fatG=Math.round(fatCal/9),
        carbCal=Math.max(0,tc-pc-fatCal),carbG=Math.round(carbCal/4),
        fiberG=Math.round(14*(tc/1000)),waterL=Math.round(weight*0.033*10)/10;
  return {targetCal:tc,protein:proteinG,carbs:carbG,fat:fatG,fiber:fiberG,water:waterL};
}
export function programWeekOf(startDate, dateKey) {
  const days=Math.floor((new Date(dateKey+"T00:00:00").getTime()-new Date(startDate+"T00:00:00").getTime())/(1000*60*60*24));
  if(days<0) return null;
  return Math.floor(days/7)+1;
}
export function buildTimeline(weeks,breakWeeks,deficit,sw,sf,sws,workoutsPerWeek=4,proteinPerKg=1.8,gender="male"){
  const waistPerKgFat=gender==="female"?0.9:1.0;
  function fatFracDeficit(wo,ppk){
    return Math.min(0.95,0.70+Math.min((ppk-1.0)/1.4,1)*0.15+Math.min(wo/4,1)*0.10);
  }
  function fatFracSurplus(wo,ppk){
    return Math.max(0.30,0.85-Math.min((ppk-1.0)/1.4,1)*0.25-Math.min(wo/4,1)*0.20);
  }
  let w=sw,f=sf,ws=sws; const pts=[{w,f,ws}];
  for(let i=1;i<=weeks;i++){
    if(breakWeeks.includes(i)){
      const dkw=(deficit/2*7)/7700;
      const ff=fatFracSurplus(Math.floor(workoutsPerWeek/2),proteinPerKg);
      const fatGained=dkw*ff;
      const fatMass=Math.max(0,w*(f/100)+fatGained);
      w+=dkw; f=(fatMass/w)*100; ws+=fatGained*waistPerKgFat;
    } else {
      const dkw=(deficit*7)/7700;
      const ff=fatFracDeficit(workoutsPerWeek,proteinPerKg);
      const fatLost=dkw*ff;
      const fatMass=Math.max(0,w*(f/100)-fatLost);
      w-=dkw; f=Math.max(4,(fatMass/Math.max(w,1))*100); ws-=fatLost*waistPerKgFat;
    }
    pts.push({w,f,ws});
  }
  return pts;
}
export function dayTotals(entries, dateKey) {
  return entries.filter(e=>e.date===dateKey).reduce((a,e)=>{
    if(e.type==="food"){a.cal+=e.calories||0;a.protein+=e.protein||0;a.carbs+=e.carbs||0;a.fat+=e.fat||0;a.fiber+=e.fiber||0;a.water+=e.water||0;}
    if(e.type==="activity")a.burned+=e.calories_burned||0;
    return a;
  },{cal:0,protein:0,carbs:0,fat:0,fiber:0,water:0,burned:0});
}
export function round1(n){return Math.round(n*10)/10;}

export function buildEODContext(entries, dateKey, goals, isNewWeek, allEntries, isAuto = true) {
  const dt = dayTotals(entries, dateKey);
  const g = goals.nutrition;
  const netCal = Math.round(dt.cal - dt.burned);
  const ws = weekStart(dateKey);
  const weekWorkouts = [...new Set(allEntries.filter(e=>e.type==="activity"&&e.date>=ws&&e.date<=dateKey).map(e=>e.date))].length;
  const currentWeek = programWeekOf(goals.startDate, dateKey);
  const isBreakWk = currentWeek!=null && (goals.breakWeeks||[]).includes(currentWeek);
  const effectiveWorkoutGoal = isBreakWk ? Math.floor((goals.workoutsPerWeek||0)/2) : (goals.workoutsPerWeek||0);
  const effectiveCal = isBreakWk ? Math.round(g.targetCal + (goals.deficit||0)*1.5) : g.targetCal;
  let text = `[END OF DAY: ${dateKey}]${isBreakWk?" [BREAK WEEK "+currentWeek+"]":""}${isAuto?"":" [USER COMMITTED — they chose to close their day and will not eat again tonight]"}\nNet calories: ${netCal} / ${effectiveCal} kcal | Eaten: ${Math.round(dt.cal)} kcal | Burned: ${Math.round(dt.burned)} kcal | Protein: ${Math.round(dt.protein)}g / ${g.protein}g | Carbs: ${Math.round(dt.carbs)}g / ${g.carbs}g | Fat: ${Math.round(dt.fat)}g / ${g.fat}g | Fiber: ${Math.round(dt.fiber)}g / ${g.fiber}g | Water: ${round1(dt.water)}L / ${g.water}L | Workouts this week: ${weekWorkouts} / ${effectiveWorkoutGoal}`;
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
export function buildMeasurementContext(bodyPoints, newPoint) {
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
