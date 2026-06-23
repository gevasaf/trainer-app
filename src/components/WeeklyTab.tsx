// @ts-nocheck
import React, { useState } from "react";
import { CLR, todayKey, weekStart, dayTotals, round1, programWeekOf } from "../lib/utils";
import { Card, Ring } from "./ui";

export function WeeklyTab({t, appData, entries, lang}) {
  const today = todayKey();
  const wkStart = weekStart(today);
  const goals = appData.goals.nutrition;

  // Distinct dates this week (Sun–today) that have an EOD marker
  const eodDates = [...new Set(
    entries.filter(e => e.type === "eod" && e.date >= wkStart && e.date <= today).map(e => e.date)
  )].sort();

  // Include today if it has logged data but no EOD yet
  const todayInEod = eodDates.includes(today);
  const todayRaw = dayTotals(entries, today);
  const todayHasData = todayRaw.cal > 0 || todayRaw.burned > 0;
  const allDates = (!todayInEod && todayHasData) ? [...eodDates, today].sort() : eodDates;

  // Per-day totals for all displayed dates
  const allDayData = allDates.map(d => ({ date: d, ...dayTotals(entries, d) }));

  // Toggle state: default on for past EOD days, off for today
  const [enabled, setEnabled] = useState({});
  const isDayEnabled = (date) => date in enabled ? enabled[date] : date !== today;
  const toggleDay = (date) => setEnabled(prev => ({ ...prev, [date]: !isDayEnabled(date) }));

  // Averages over enabled days only
  const enabledData = allDayData.filter(d => isDayEnabled(d.date));
  const n = enabledData.length;

  const avgOf = key => n > 0 ? round1(enabledData.reduce((s, d) => s + (d[key] || 0), 0) / n) : 0;
  const avgNet = n > 0 ? Math.round(enabledData.reduce((s, d) => s + (d.cal - d.burned), 0) / n) : 0;
  const avgEaten = n > 0 ? Math.round(enabledData.reduce((s, d) => s + d.cal, 0) / n) : 0;
  const avgBurned = n > 0 ? Math.round(enabledData.reduce((s, d) => s + d.burned, 0) / n) : 0;

  // Break week / effective targets
  const currentWeek = programWeekOf(appData.goals.startDate, today);
  const isBreakWeek = currentWeek != null && (appData.goals.breakWeeks || []).includes(currentWeek);
  const breakCal = Math.round(goals.targetCal + (appData.goals.deficit || 0) * 1.5);
  const effectiveCal = isBreakWeek ? breakCal : goals.targetCal;
  const workoutTarget = isBreakWeek
    ? Math.floor((appData.goals.workoutsPerWeek || 0) / 2)
    : (appData.goals.workoutsPerWeek || 0);

  // Weekly workouts (distinct days with counted activities)
  const weekWorkouts = [...new Set(
    entries
      .filter(e => e.type === "activity" && e.date >= wkStart && e.date <= today && e.countsTowardGoal !== false)
      .map(e => e.date)
  )].length;

  const avgScale = effectiveCal > 0 ? (effectiveCal + avgBurned) / effectiveCal : 1;
  const rings = [
    { label: t.calories, value: avgNet,          max: effectiveCal,                          color: CLR.purple, unit: "",  direction: "under" },
    { label: t.protein,  value: avgOf("protein"), max: Math.round(goals.protein * avgScale),  color: CLR.green,  unit: "g", direction: "over"  },
    { label: t.carbs,    value: avgOf("carbs"),   max: Math.round(goals.carbs * avgScale),    color: CLR.amber,  unit: "g", direction: "under" },
    { label: t.fat,      value: avgOf("fat"),     max: Math.round(goals.fat * avgScale),      color: CLR.red,    unit: "g", direction: "under" },
    { label: t.fiber,    value: avgOf("fiber"),   max: Math.round(goals.fiber * avgScale),    color: CLR.teal,   unit: "g", direction: "over"  },
    { label: t.water,    value: avgOf("water"),   max: Math.round(goals.water * avgScale * 10) / 10, color: CLR.blue, unit: "L", direction: "over" },
  ];

  const locale = lang === "he" ? "he-IL" : "en-US";
  function fmtDay(dateStr) {
    return new Date(dateStr + "T00:00:00").toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
  }
  const avgLabel = lang === "he"
    ? `ממוצע של ${n} ${n === 1 ? "יום" : "ימים"}`
    : `avg of ${n} day${n !== 1 ? "s" : ""}`;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Fixed top */}
      <div style={{ flexShrink: 0, padding: "12px 16px 0" }}>
        {/* Summary row */}
        <Card style={{ marginBottom: 10, padding: "10px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            {[
              [t.eaten, avgEaten, "kcal", CLR.purple],
              [t.burned, avgBurned, "kcal", CLR.amber],
              [t.net, avgNet, "kcal", n === 0 ? CLR.muted : avgNet > effectiveCal ? CLR.red : CLR.green],
            ].map(([l, v, u, c]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: CLR.muted }}>{l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{n > 0 ? v : "—"}</div>
                <div style={{ fontSize: 10, color: CLR.dim }}>{u}</div>
              </div>
            ))}
          </div>
          {n > 0 && (
            <div style={{ textAlign: "center", fontSize: 11, color: CLR.dim, marginTop: 6 }}>
              {avgLabel}
            </div>
          )}
        </Card>

        {/* Progress rings */}
        <Card style={{ marginBottom: 10, padding: "12px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 6 }}>
            {rings.map(r => <Ring key={r.label} {...r} />)}
          </div>
        </Card>

        {/* Workout bar */}
        {workoutTarget > 0 && (
          <Card style={{ marginBottom: 10, padding: "10px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: CLR.muted }}>🏋️ {t.workoutsThisWeek}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: weekWorkouts >= workoutTarget ? CLR.green : CLR.muted }}>
                {weekWorkouts} / {workoutTarget}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {Array.from({ length: workoutTarget }, (_, i) => (
                <div key={i} style={{ flex: 1, height: 5, borderRadius: 3, background: i < weekWorkouts ? CLR.green : CLR.border }} />
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Scrollable day list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>
        <Card>
          <div style={{ fontSize: 13, fontWeight: 600, color: CLR.muted, marginBottom: 10 }}>
            {t.weekDays}
          </div>

          {allDates.length === 0 ? (
            <div style={{ color: CLR.dim, fontSize: 13, textAlign: "center", padding: "20px 8px", lineHeight: 1.7 }}>
              {t.noWeekEOD}
            </div>
          ) : (
            [...allDates].reverse().map(date => {
              const d = allDayData.find(x => x.date === date);
              const net = Math.round(d.cal - d.burned);
              const isToday = date === today;
              const hasEOD = eodDates.includes(date);
              const active = isDayEnabled(date);
              return (
                <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid " + CLR.border, opacity: active ? 1 : 0.45 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: CLR.text, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                      {fmtDay(date)}
                      {isToday && !hasEOD && (
                        <span style={{ fontSize: 10, color: CLR.amber, background: CLR.border, padding: "1px 5px", borderRadius: 4 }}>
                          {lang === "he" ? "עד כה" : "so far"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: CLR.muted, marginTop: 2 }}>
                      {Math.round(d.protein)}g prot · {Math.round(d.carbs)}g carbs · {Math.round(d.fat)}g fat
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: net > effectiveCal ? CLR.red : CLR.green }}>
                        {net > 0 ? "+" : ""}{net}
                      </div>
                      <div style={{ fontSize: 10, color: CLR.dim }}>{t.netKcal}</div>
                    </div>
                    <div
                      onClick={() => toggleDay(date)}
                      style={{
                        width: 32, height: 18, borderRadius: 9,
                        background: active ? CLR.purple : CLR.border,
                        position: "relative", cursor: "pointer", flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                    >
                      <div style={{
                        position: "absolute",
                        width: 14, height: 14, borderRadius: 7,
                        background: "white",
                        top: 2, left: active ? 16 : 2,
                        transition: "left 0.15s",
                      }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card>
      </div>
    </div>
  );
}
