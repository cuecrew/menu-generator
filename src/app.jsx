// ThaliApp — root component
// Fetches menu.json + history.json, manages tab/detail/lang state.

const { useState, useEffect } = React;

const IS_LOCAL = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const BASE = IS_LOCAL ? '' : 'https://cuecrew.github.io/menu-generator';
const MENU_URL     = BASE + '/data/menu.json';
const TOMORROW_URL = BASE + '/data/tomorrow.json';
const HISTORY_URL  = BASE + '/data/history.json';

// ── Helpers ──────────────────────────────────────────────────────────────

function formatDateShort(rawDate) {
  try {
    const d = new Date((rawDate || '').substring(0, 10));
    if (isNaN(d)) return rawDate || '—';
    const days   = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}`;
  } catch { return rawDate || '—'; }
}

function formatDateDisplay(rawDate) {
  try {
    const d = new Date((rawDate || '').substring(0, 10));
    if (isNaN(d)) return rawDate || '—';
    const days   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch { return rawDate || '—'; }
}

// Transform a full menu object (from history.json) → HistoryScreen summary row
function toHistoryEntry(entry) {
  if (!entry) return null;
  // Already in summary format (has breakfast_en key)
  if (entry.breakfast_en !== undefined) return entry;
  // Full menu format — extract summary fields
  const rawDate = entry.date || '';
  return {
    date_display: entry.date_display || formatDateDisplay(rawDate),
    date_short:   entry.date_short   || formatDateShort(rawDate),
    breakfast_en: entry.breakfast?.dish_english || '',
    breakfast_hi: entry.breakfast?.dish_hindi   || '',
    lunch_en:     entry.lunch?.dish_english     || '',
    lunch_hi:     entry.lunch?.dish_hindi       || '',
    dinner_en:    entry.dinner?.dish_english    || '',
    dinner_hi:    entry.dinner?.dish_hindi      || '',
  };
}

// ── Loading splash ────────────────────────────────────────────────────────

function LoadingSplash() {
  const T = window.THALI_T;
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: T.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16,
    }}>
      <div style={{
        fontFamily: T.fontDisplay, fontSize: 40, fontWeight: 600, letterSpacing: -1.5,
      }}>
        <span style={{ color: T.saffron }}>थ</span>
        <span style={{ color: T.cream }}>ali</span>
      </div>
      <div style={{
        fontFamily: T.fontMono, fontSize: 11, color: T.creamSubtle,
        letterSpacing: 1, textTransform: 'uppercase',
      }}>
        Loading menu…
      </div>
    </div>
  );
}

// ── No-menu placeholder ───────────────────────────────────────────────────

function EmptyMenu() {
  const T = window.THALI_T;
  return {
    date: '—',
    date_display: '—',
    date_short: '—',
    generated_label: 'Menu generates tonight at 10 PM IST',
    breakfast: {
      dish_hindi: '—', dish_english: 'Not generated yet',
      ingredients_hindi: '', ingredients_list_hi: [], ingredients_list_en: [],
      youtube_url: '', prep_notes_hi: '', prep_notes_en: '', prep_notes: '',
      vizz_macros: { cal: 0, protein: 0, fat: 0, carbs: 0 },
    },
    lunch: {
      dish_hindi: '—', dish_english: 'Not generated yet',
      ingredients_hindi: '', ingredients_list_hi: [], ingredients_list_en: [],
      youtube_url: '', prep_notes_hi: '', prep_notes_en: '', prep_notes: '',
      vizz_macros: { cal: 0, protein: 0, fat: 0, carbs: 0 },
    },
    dinner: {
      dish_hindi: '—', dish_english: 'Not generated yet',
      ingredients_hindi: '', ingredients_list_hi: [], ingredients_list_en: [],
      youtube_url: '', prep_notes_hi: '', prep_notes_en: '', prep_notes: '',
      vizz_macros: { cal: 0, protein: 0, fat: 0, carbs: 0 },
    },
    vizz_daily_total_from_meals: { cal: 0, protein: 0, fat: 0, carbs: 0 },
    vizz_daily_total_with_shake: { cal: 0, protein: 0, fat: 0, carbs: 0 },
    macro_check: '',
  };
}

// ── Root app ──────────────────────────────────────────────────────────────

function ThaliApp() {
  const [menu,     setMenu]    = useState(null);   // null = loading
  const [tomorrow, setTomorrow] = useState(null);
  const [history,  setHistory] = useState([]);
  const [tab,      setTab]     = useState('today');
  const [detail,   setDetail]  = useState(null);  // slot string: 'breakfast'|'lunch'|'dinner'
  const [offline,  setOffline] = useState(false);
  const [lang,     setLang]    = useState('en');
  const T = window.THALI_T;

  // ── Data fetching ──────────────────────────────────────────────────────
  useEffect(() => {
    // Menu
    fetch(MENU_URL + '?t=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        localStorage.setItem('thali_menu', JSON.stringify(data));
        setMenu(data);
        setOffline(false);
      })
      .catch(() => {
        const cached = localStorage.getItem('thali_menu');
        if (cached) { setMenu(JSON.parse(cached)); setOffline(true); }
        else setMenu(EmptyMenu());
      });

    // Tomorrow's menu (for grocery planning)
    fetch(TOMORROW_URL + '?t=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        localStorage.setItem('thali_tomorrow', JSON.stringify(data));
        setTomorrow(data);
      })
      .catch(() => {
        const cached = localStorage.getItem('thali_tomorrow');
        if (cached) setTomorrow(JSON.parse(cached));
      });

    // History
    fetch(HISTORY_URL + '?t=' + Date.now())
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => {
        localStorage.setItem('thali_history', JSON.stringify(data));
        // Reverse so newest is first, transform to summary format
        setHistory([...data].reverse().map(toHistoryEntry).filter(Boolean));
      })
      .catch(() => {
        const cached = localStorage.getItem('thali_history');
        if (cached) {
          setHistory(JSON.parse(cached).reverse().map(toHistoryEntry).filter(Boolean));
        }
      });

    // Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────
  if (!menu) return <LoadingSplash />;

  const isCook = tab === 'cook';
  const bg = isCook ? T.cookBg : T.bg;

  // Common screen scroll container style
  const scrollBox = {
    position: 'absolute', inset: 0,
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: bg,
      overflow: 'hidden',
      transition: 'background 0.25s ease',
    }}>
      {/* ── Main screen area ── */}
      {!detail && (
        <div style={scrollBox}>
          {tab === 'today' && (
            <HomeScreen
              menu={menu}
              onOpenMeal={(slot) => setDetail(slot)}
              dark={true}
              offline={offline}
              lang={lang}
              onChangeLang={setLang}
            />
          )}
          {tab === 'cook' && (
            <CookScreen menu={menu} />
          )}
          {tab === 'next' && (
            <NextScreen
              menu={tomorrow}
              dark={true}
              lang={lang}
              onChangeLang={setLang}
            />
          )}
          {tab === 'history' && (
            <HistoryScreen
              history={history}
              onOpenDay={() => {}}
              dark={true}
              lang={lang}
              onChangeLang={setLang}
            />
          )}
        </div>
      )}

      {/* ── Meal detail overlay ── */}
      {detail && (
        <div style={{
          ...scrollBox,
          background: T.bg,
          zIndex: 20,
        }}>
          <MealDetailScreen
            slot={detail}
            meal={menu[detail]}
            onBack={() => setDetail(null)}
            dark={true}
            lang={lang}
            onChangeLang={setLang}
          />
        </div>
      )}

      {/* ── Tab bar (hidden when detail is open) ── */}
      {!detail && (
        <TabBar active={tab} onChange={setTab} dark={!isCook} />
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ThaliApp />);
