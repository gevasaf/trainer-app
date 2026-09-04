// @ts-nocheck
import React, { useState } from "react";
import { CLR } from "../lib/utils";
import { Btn, ConfirmModal } from "./ui";
import { journeyRange } from "./JourneyView";

export function JourneysModal({ t, lang, journeys, onView, onDelete, onClose }) {
  const [confirmDelete, setConfirmDelete] = useState(null);
  // Newest first
  const list = [...(journeys || [])].sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 16, direction: t.dir }}>
      <div style={{ background: CLR.card, borderRadius: 16, width: "100%", maxWidth: 440, maxHeight: "85dvh", border: "1px solid " + CLR.border, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 20px", borderBottom: "1px solid " + CLR.border }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: CLR.purple }}>🗂 {t.pastJourneysTitle}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: CLR.muted, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px 16px" }}>
          {list.length === 0 && (
            <div style={{ color: CLR.dim, fontSize: 13, lineHeight: 1.6, textAlign: "center", padding: "28px 8px" }}>{t.noJourneys}</div>
          )}
          {list.map((j) => {
            const name = j.name || (j.appData && j.appData.profile && j.appData.profile.name) || t.journeyViewing;
            const nEntries = (j.entries || []).filter(e => e.type === "food" || e.type === "activity").length;
            const nMeas = (j.bodyPoints || []).length;
            return (
              <div key={j.id} style={{ background: CLR.card2, border: "1px solid " + CLR.border, borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: CLR.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                    <div style={{ fontSize: 11, color: CLR.muted, marginTop: 2 }}>{journeyRange(j, lang)}</div>
                    <div style={{ fontSize: 11, color: CLR.dim, marginTop: 4 }}>{nEntries} {t.journeyEntries} · {nMeas} {t.journeyMeasurements}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                    <Btn onClick={() => onView(j)} style={{ padding: "6px 12px", fontSize: 12 }}>{t.journeyView}</Btn>
                    <button onClick={() => setConfirmDelete(j)} title={t.deleteJourney} style={{ background: "none", border: "none", color: CLR.dim, cursor: "pointer", fontSize: 15, padding: "4px 4px", lineHeight: 1, opacity: 0.7 }}>🗑</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title={t.deleteJourneyTitle} message={t.deleteJourneyMsg}
          confirmText={t.deleteJourneyConfirm} danger
          onConfirm={() => { onDelete(confirmDelete.id); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}
