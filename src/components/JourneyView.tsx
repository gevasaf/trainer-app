// @ts-nocheck
import React, { useState } from "react";
import { CLR, fmtDate } from "../lib/utils";
import { TimelineTab } from "./TimelineTab";
import { AssistantTab } from "./AssistantTab";
import { LogTab } from "./LogTab";

const noop = () => {};

export function journeyRange(journey, lang) {
  const start = journey?.startDate ? new Date(journey.startDate) : (journey?.archivedAt ? new Date(journey.archivedAt) : null);
  const end = journey?.archivedAt ? new Date(journey.archivedAt) : null;
  const s = start ? fmtDate(start, lang) : "";
  const e = end ? fmtDate(end, lang) : "";
  return s && e ? s + " → " + e : (s || e);
}

// Read-only view of an archived journey. Reuses the Timeline / Log / Assistant
// tabs with editing disabled. (Today / Week are "current day" views and carry
// no meaning for a finished journey, so they're intentionally omitted here.)
export function JourneyView({ journey, t, lang, toggleLang, onBack }) {
  const [tab, setTab] = useState(0);
  const data = journey.appData || {};
  const entries = journey.entries || [];
  const bodyPoints = journey.bodyPoints || [];
  const chatHistory = journey.chatHistory || [];
  const name = journey.name || (data.profile && data.profile.name) || "";
  const range = journeyRange(journey, lang);

  const tabs = [t.timeline, t.log, t.assistant];

  return (
    <div style={{ height: "100dvh", background: CLR.bg, color: CLR.text, fontFamily: "system-ui,sans-serif", direction: t.dir, display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ width: "100%", maxWidth: 680, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "14px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <button onClick={onBack} style={{ background: "none", border: "1px solid " + CLR.border, color: CLR.muted, borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>{t.dir === "rtl" ? "→ " + t.back : "← " + t.back}</button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{"🗂 " + (name || t.journeyViewing)}</div>
            <div style={{ fontSize: 11, color: CLR.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{range}</div>
          </div>
        </div>
        <span style={{ flexShrink: 0, background: CLR.card2, border: "1px solid " + CLR.border, color: CLR.amber, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>👁 {t.readOnlyBadge}</span>
      </div>

      {/* Tab bar */}
      <div style={{ width: "100%", maxWidth: 680, flexShrink: 0, display: "flex", borderBottom: "1px solid " + CLR.border, margin: "10px 0 0", padding: "0 8px", overflowX: "auto" }}>
        {tabs.map((tb, i) => (
          <button key={i} onClick={() => setTab(i)}
            style={{ background: "none", border: "none", color: tab === i ? CLR.purple : CLR.muted, borderBottom: tab === i ? "2px solid " + CLR.purple : "2px solid transparent", padding: "10px 14px", cursor: "pointer", fontSize: 13, fontWeight: tab === i ? 600 : 400, whiteSpace: "nowrap", flexShrink: 0 }}>
            {tb}
          </button>))}
      </div>

      {/* Content */}
      <div style={{ width: "100%", maxWidth: 680, flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {tab === 0 && <TimelineTab t={t} appData={data} bodyPoints={bodyPoints} setBodyPoints={noop} onMeasurement={noop} lang={lang} deleteBodyPoint={noop} readOnly />}
        {tab === 1 && <LogTab t={t} entries={entries} bodyPoints={bodyPoints} profile={data.profile} deleteEntry={noop} deleteBodyPoint={noop} readOnly />}
        {tab === 2 && <AssistantTab t={t} appData={data} entries={entries} bodyPoints={bodyPoints} chatHistory={chatHistory} setChatHistory={noop} unreadCount={0} setUnreadCount={noop} lang={lang} status={null} setStatus={noop} readOnly />}
      </div>
    </div>
  );
}
