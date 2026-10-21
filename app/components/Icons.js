"use client";

const base = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

export function IconCopy() {
  return (<svg {...base}><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>);
}
export function IconShare() {
  return (<svg {...base}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>);
}
export function IconUp() {
  return (<svg {...base}><path d="M7 10v11H3V10z" /><path d="M7 10l4-7a2 2 0 0 1 2 2v4h6.5a2 2 0 0 1 2 2.3l-1.3 7.5A2 2 0 0 1 18.2 21H7" /></svg>);
}
export function IconDown() {
  return (<svg {...base}><g transform="rotate(180 12 12)"><path d="M7 10v11H3V10z" /><path d="M7 10l4-7a2 2 0 0 1 2 2v4h6.5a2 2 0 0 1 2 2.3l-1.3 7.5A2 2 0 0 1 18.2 21H7" /></g></svg>);
}
export function IconSpeaker() {
  return (<svg {...base}><path d="M11 5L6 9H3v6h3l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>);
}
export function IconRegen() {
  return (<svg {...base}><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></svg>);
}
export function IconPencil() {
  return (<svg {...base}><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>);
}
export function IconWave() {
  return (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10v4" /></svg>);
}
