// @ts-nocheck
import React from "react";
import { CLR, fmtDate, addWeeks } from "../lib/utils";
import { Card } from "./ui";

function Row({ label, value, color }) {
  if (value == null || value === "" ) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "7px 0", borderBottom: "1px solid " + CLR.border, fontSize: 13 }}>
      <span style={{ color: CLR.muted }}>{label}</span>
      <span style={{ color: color || CLR.text, fontWeight: 600, textAlign: "end" }}>{value}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: CLR.purple, marginBottom: 6 }}>{title}</div>
      <div>{children}</div>
    </Card>
  );
}

// Read-only rendering of everything captured when the journey was set up.
export function JourneyParamsBody({ t, lang, appData }) {
  const p = (appData && appData.profile) || {};
  const g = (appData && appData.goals) || {};
  const n = g.nutrition || {};
  const act = (t.actLevels && p.actIdx != null) ? t.actLevels[p.actIdx] : null;
  const start = g.startDate ? new Date(g.startDate) : null;
  const end = start && g.durationWeeks ? addWeeks(start, g.durationWeeks) : null;
  const breaks = Array.isArray(g.breakWeeks) && g.breakWeeks.length ? g.breakWeeks.join(", ") : t.none;

  return (
    <div style={{ padding: "12px 16px 20px" }}>
      <Section title={t.sectionProfile}>
        <Row label={t.name} value={p.name} />
        <Row label={t.age} value={p.age} />
        <Row label={t.gender} value={p.gender === "female" ? t.female : p.gender === "male" ? t.male : p.gender} />
        <Row label={t.height} value={p.height != null ? p.height + " cm" : null} />
        <Row label={t.activity} value={act ? act.label : null} />
        <Row label={t.bmi} value={p.bmi ?? appData?.bmi} color={CLR.blue} />
        <Row label={t.fatPct} value={(p.fatPct ?? appData?.fatPct) != null ? (p.fatPct ?? appData?.fatPct) + "%" : null} color={CLR.amber} />
        <Row label={t.tdee} value={appData?.tdee != null ? appData.tdee + " kcal" : null} color={CLR.purple} />
      </Section>

      <Section title={t.startingStats}>
        <Row label={t.weight} value={g.startWeight != null ? g.startWeight + " kg" : (p.weight != null ? p.weight + " kg" : null)} color={CLR.purple} />
        <Row label={t.waist} value={g.startWaist != null ? g.startWaist + " cm" : (p.waist != null ? p.waist + " cm" : null)} color={CLR.teal} />
        <Row label={t.fatPct} value={g.startFat != null ? Number(g.startFat).toFixed(1) + "%" : null} color={CLR.amber} />
      </Section>

      <Section title={t.sectionProgram}>
        <Row label={t.startDateLabel} value={start ? fmtDate(start, lang) : null} />
        <Row label={t.endDateLabel} value={end ? fmtDate(end, lang) : null} />
        <Row label={t.durationWeeks} value={g.durationWeeks} />
        <Row label={t.breakWeeks} value={breaks} color={CLR.blue} />
        <Row label={t.calDeficit} value={g.deficit != null ? "-" + g.deficit + " kcal" : null} />
        <Row label={t.protein} value={g.proteinPerKg != null ? g.proteinPerKg + " g/kg" : null} color={CLR.green} />
        <Row label={t.workoutsPerWeek} value={g.workoutsPerWeek} />
      </Section>

      <Section title={t.calculatedNutrition}>
        <Row label={t.calories} value={n.targetCal != null ? n.targetCal + " kcal" : null} color={CLR.purple} />
        <Row label={t.protein} value={n.protein != null ? n.protein + " g" : null} color={CLR.green} />
        <Row label={t.carbs} value={n.carbs != null ? n.carbs + " g" : null} color={CLR.amber} />
        <Row label={t.fat} value={n.fat != null ? n.fat + " g" : null} color={CLR.red} />
        <Row label={t.fiber} value={n.fiber != null ? n.fiber + " g" : null} color={CLR.teal} />
        <Row label={t.water} value={n.water != null ? n.water + " L" : null} color={CLR.blue} />
      </Section>

      <Section title={t.projectedGoals}>
        <Row label={t.targetWeight} value={g.targetWeight != null ? g.targetWeight + " kg" : null} color={CLR.purple} />
        <Row label={t.targetFat} value={g.targetFat != null ? g.targetFat + "%" : null} color={CLR.amber} />
        <Row label={t.targetWaist} value={g.targetWaist != null ? g.targetWaist + " cm" : null} color={CLR.teal} />
      </Section>
    </div>
  );
}

// Modal wrapper for viewing the CURRENT journey's parameters from the menu.
export function JourneyParamsModal({ t, lang, appData, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16, direction: t.dir }}>
      <div style={{ background: CLR.bg, borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "88dvh", border: "1px solid " + CLR.border, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 18px", borderBottom: "1px solid " + CLR.border }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: CLR.purple }}>📋 {t.journeyDetails}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: CLR.muted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>✕</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <JourneyParamsBody t={t} lang={lang} appData={appData} />
        </div>
      </div>
    </div>
  );
}
