// Thali — design tokens + shared components
// Adapted from Claude Design handoff for PWA use.
// StatusBar replaced with safe-area spacer. TabBar uses env(safe-area-inset-bottom).

const THALI_T = {
  bg: '#0E0B09',
  bgRaised: '#171210',
  bgCard: '#181311',
  cream: '#F6EFE6',
  creamMuted: 'rgba(246,239,230,0.62)',
  creamSubtle: 'rgba(246,239,230,0.42)',
  hairline: 'rgba(246,239,230,0.08)',
  hairlineStrong: 'rgba(246,239,230,0.14)',
  saffron: '#F4B23C',
  saffronSoft: 'rgba(244,178,60,0.16)',
  pista: '#8FB861',
  pistaSoft: 'rgba(143,184,97,0.16)',
  terra: '#E36B2E',
  terraSoft: 'rgba(227,107,46,0.16)',
  macroCal: '#F4B23C',
  macroProtein: '#E36B2E',
  macroFat: '#C58CDB',
  macroCarbs: '#8FB861',
  cookBg: '#FAF6F0',
  cookBgRaised: '#FFFFFF',
  cookInk: '#231915',
  cookInkMuted: 'rgba(35,25,21,0.62)',
  cookHairline: 'rgba(35,25,21,0.10)',
  cookWarm: '#F0E6D2',
  fontDisplay: '"Bricolage Grotesque", "Noto Sans Devanagari", system-ui, sans-serif',
  fontUI: '"Geist", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  fontDeva: '"Noto Sans Devanagari", "Bricolage Grotesque", system-ui, sans-serif',
  fontMono: '"Geist Mono", ui-monospace, SFMono-Regular, monospace',
};

const MEAL_TOKENS = {
  breakfast: { label: 'Breakfast', timeLabel: 'सुबह का नाश्ता', timeWindow: '8:00 am', accent: THALI_T.saffron, accentSoft: THALI_T.saffronSoft, glyph: 'sunrise' },
  lunch:     { label: 'Lunch',     timeLabel: 'लंच / टिफ़िन',   timeWindow: '1:00 pm', accent: THALI_T.pista,   accentSoft: THALI_T.pistaSoft,   glyph: 'sun'     },
  dinner:    { label: 'Dinner',    timeLabel: 'रात का खाना',    timeWindow: '9:00 pm', accent: THALI_T.terra,   accentSoft: THALI_T.terraSoft,   glyph: 'moon'    },
};

function MealGlyph({ kind, size = 16, color = 'currentColor' }) {
  const s = size;
  if (kind === 'sunrise') return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18"/><path d="M7 18a5 5 0 0 1 10 0"/><path d="M12 4v3M5.2 7.2l2 2M18.8 7.2l-2 2"/></svg>;
  if (kind === 'sun')     return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4"/></svg>;
  if (kind === 'moon')    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>;
  return null;
}

function Chevron({ dir = 'right', size = 14, color = 'currentColor', stroke = 2 }) {
  const rot = { right: 0, left: 180, down: 90, up: -90 }[dir];
  return <svg width={size} height={size} viewBox="0 0 14 14" fill="none" style={{ transform: `rotate(${rot}deg)` }}><path d="M5 2l5 5-5 5" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"/></svg>;
}

function MacroChip({ value, unit, label, color, dark = true }) {
  const T = THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamSubtle : T.cookInkMuted;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4, padding: '7px 11px 7px 9px', borderRadius: 999, background: dark ? 'rgba(246,239,230,0.04)' : 'rgba(35,25,21,0.04)', border: `1px solid ${dark ? T.hairline : T.cookHairline}`, fontFamily: T.fontUI }}>
      <span style={{ width: 6, height: 6, borderRadius: 999, background: color, alignSelf: 'center', marginRight: 4 }}/>
      <span style={{ fontSize: 13, fontWeight: 600, color: fg, letterSpacing: -0.1 }}>{value}</span>
      <span style={{ fontSize: 10.5, color: muted, fontWeight: 500, textTransform: 'lowercase' }}>{unit}</span>
      <span style={{ fontSize: 10.5, color: muted, fontWeight: 500, marginLeft: 2 }}>{label}</span>
    </div>
  );
}

function StatTile({ value, unit, label, color, dark = true }) {
  const T = THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;
  return (
    <div style={{ padding: '14px 14px 13px', borderRadius: 14, background: dark ? 'rgba(246,239,230,0.03)' : '#FFFFFF', border: `1px solid ${dark ? T.hairline : T.cookHairline}`, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: color, opacity: 0.85 }}/>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: muted, marginBottom: 6, fontFamily: T.fontUI }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: fg, fontFamily: T.fontDisplay, letterSpacing: -0.6 }}>{value}</span>
        <span style={{ fontSize: 12, color: muted, fontWeight: 500 }}>{unit}</span>
      </div>
    </div>
  );
}

function TabBar({ active, onChange, dark = true }) {
  const T = THALI_T;
  const bg = dark ? 'rgba(14,11,9,0.85)' : 'rgba(250,246,240,0.92)';
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamSubtle : T.cookInkMuted;
  const hair = dark ? T.hairline : T.cookHairline;
  const tabs = [
    { id: 'today',   label: 'Today',   icon: 'today'   },
    { id: 'cook',    label: 'Cook',    icon: 'cook'    },
    { id: 'history', label: 'History', icon: 'history' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 'max(env(safe-area-inset-bottom), 16px)', paddingTop: 10, background: bg, backdropFilter: 'blur(24px) saturate(180%)', WebkitBackdropFilter: 'blur(24px) saturate(180%)', borderTop: `1px solid ${hair}`, display: 'flex', justifyContent: 'space-around', fontFamily: T.fontUI, zIndex: 30 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{ background: 'transparent', border: 0, padding: '4px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: active === t.id ? fg : muted, cursor: 'pointer' }}>
          <TabIcon kind={t.icon} active={active === t.id}/>
          <span style={{ fontSize: 10.5, fontWeight: active === t.id ? 600 : 500, letterSpacing: 0.1 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function TabIcon({ kind, active }) {
  const c = 'currentColor'; const w = active ? 1.9 : 1.5;
  if (kind === 'today')   return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>{active && <circle cx="12" cy="15" r="1.6" fill={c} stroke="none"/>}</svg>;
  if (kind === 'cook')    return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M6 11h12l-1.2 7.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 11z"/><path d="M5 11h14"/><path d="M8 8c0-1.5 1-2 2-2s2 .5 2 2-1 2 0 3M14 8c0-1.5 1-2 2-2"/></svg>;
  if (kind === 'history') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/></svg>;
  return null;
}

function LangToggle({ lang, onChange, dark = true }) {
  const T = THALI_T;
  const muted = dark ? T.creamSubtle : T.cookInkMuted;
  const hair = dark ? T.hairlineStrong : T.cookHairline;
  const opts = [{ id: 'en', label: 'EN' }, { id: 'hi', label: 'हिं' }];
  return (
    <div style={{ display: 'inline-flex', position: 'relative', background: dark ? 'rgba(246,239,230,0.05)' : 'rgba(35,25,21,0.05)', border: `1px solid ${hair}`, borderRadius: 999, padding: 3, fontFamily: T.fontUI }}>
      <div style={{ position: 'absolute', top: 3, bottom: 3, left: lang === 'en' ? 3 : 'calc(50%)', width: 'calc(50% - 3px)', background: T.saffron, borderRadius: 999, transition: 'left 0.22s cubic-bezier(.5,.1,.3,1.2)', boxShadow: '0 1px 4px rgba(244,178,60,0.35)' }}/>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{ all: 'unset', cursor: 'pointer', position: 'relative', zIndex: 1, padding: '4px 11px', minWidth: 24, textAlign: 'center', fontSize: 11.5, fontWeight: 700, letterSpacing: 0.4, fontFamily: o.id === 'hi' ? T.fontDeva : T.fontUI, color: lang === o.id ? '#0E0B09' : muted, transition: 'color 0.18s' }}>{o.label}</button>
      ))}
    </div>
  );
}

function SectionHeader({ label, hindiLabel, dark = true, lang = 'en' }) {
  const T = THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;
  const main = lang === 'hi' ? hindiLabel : label;
  const side = lang === 'hi' ? label : hindiLabel;
  return (
    <div style={{ padding: '4px 22px 10px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
      <div style={{ fontSize: lang === 'hi' ? 13 : 11, fontWeight: 600, letterSpacing: lang === 'hi' ? 0 : 1, textTransform: lang === 'hi' ? 'none' : 'uppercase', fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI, color: fg }}>{main}</div>
      <div style={{ fontSize: 12, color: muted, fontFamily: lang === 'hi' ? T.fontUI : T.fontDeva, fontWeight: 500 }}>{side}</div>
    </div>
  );
}

// Safe area spacer — replaces fake status bar for PWA
function SafeTop({ dark = true }) {
  return <div style={{ height: 'max(env(safe-area-inset-top), 44px)', flexShrink: 0 }} />;
}

window.THALI_T = THALI_T;
window.MEAL_TOKENS = MEAL_TOKENS;
window.MealGlyph = MealGlyph;
window.Chevron = Chevron;
window.MacroChip = MacroChip;
window.StatTile = StatTile;
window.TabBar = TabBar;
window.LangToggle = LangToggle;
window.SectionHeader = SectionHeader;
window.SafeTop = SafeTop;
