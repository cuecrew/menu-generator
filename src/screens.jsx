// All four screens of Thali. Each accepts data + dark/cook props so they
// can be embedded in either the live prototype or the cook-mode artboard.

const { useState, useEffect, useRef } = React;

// ───────────────────────── Voice / TTS ─────────────────────────

function SpeakButton({ dish, ingredients, prepNotes, accent }) {
  const [state, setState] = useState('idle'); // idle | speaking | unsupported

  useEffect(() => {
    if (!window.speechSynthesis) setState('unsupported');
    return () => { window.speechSynthesis && window.speechSynthesis.cancel(); };
  }, []);

  function buildScript() {
    const parts = [];
    if (dish)       parts.push(dish);
    if (ingredients) parts.push('सामग्री। ' + ingredients);
    if (prepNotes)   parts.push('बनाने का तरीक़ा। ' + prepNotes);
    return parts.join('। ');
  }

  function toggle() {
    if (state === 'unsupported') return;
    if (state === 'speaking') {
      window.speechSynthesis.cancel();
      setState('idle');
      return;
    }
    const text = buildScript();
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang  = 'hi-IN';
    u.rate  = 0.82;
    u.pitch = 1;
    // Prefer a Hindi voice if available
    const voices = window.speechSynthesis.getVoices();
    const hindi  = voices.find(v => v.lang.startsWith('hi'));
    if (hindi) u.voice = hindi;
    u.onend   = () => setState('idle');
    u.onerror = () => setState('idle');
    window.speechSynthesis.speak(u);
    setState('speaking');
  }

  if (state === 'unsupported') return null;

  const T = window.THALI_T;
  const speaking = state === 'speaking';
  return (
    <button onClick={toggle} style={{
      all: 'unset', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 10,
      width: '100%',
      padding: '13px 16px',
      borderRadius: 14,
      background: speaking ? accent + '22' : 'rgba(35,25,21,0.04)',
      border: `1.5px solid ${speaking ? accent : T.cookHairline}`,
      transition: 'all 0.2s',
      marginBottom: 10,
    }}>
      {/* animated waveform / mic icon */}
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: speaking ? accent : T.cookWarm,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, transition: 'background 0.2s',
      }}>
        {speaking ? (
          // Simple animated bars
          <svg width="18" height="18" viewBox="0 0 18 18" fill={accent === T.cookHairline ? '#888' : '#fff'}>
            <rect x="1"  y="5" width="3" height="8" rx="1.5" opacity="0.6">
              <animate attributeName="height" values="8;14;8" dur="0.6s" repeatCount="indefinite"/>
              <animate attributeName="y" values="5;2;5" dur="0.6s" repeatCount="indefinite"/>
            </rect>
            <rect x="7"  y="2" width="3" height="14" rx="1.5">
              <animate attributeName="height" values="14;6;14" dur="0.6s" begin="0.15s" repeatCount="indefinite"/>
              <animate attributeName="y" values="2;6;2" dur="0.6s" begin="0.15s" repeatCount="indefinite"/>
            </rect>
            <rect x="13" y="5" width="3" height="8" rx="1.5" opacity="0.6">
              <animate attributeName="height" values="8;14;8" dur="0.6s" begin="0.3s" repeatCount="indefinite"/>
              <animate attributeName="y" values="5;2;5" dur="0.6s" begin="0.3s" repeatCount="indefinite"/>
            </rect>
          </svg>
        ) : (
          // Speaker icon
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.cookInkMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: T.fontDeva, fontSize: 16, fontWeight: 600,
          color: T.cookInk, letterSpacing: -0.2,
        }}>
          {speaking ? 'सुन रहे हैं…' : 'सुनें — Listen aloud'}
        </div>
        <div style={{
          fontFamily: T.fontUI, fontSize: 11, color: T.cookInkMuted, marginTop: 2,
        }}>
          {speaking ? 'tap to stop' : 'Hindi · dish + ingredients + prep notes'}
        </div>
      </div>
    </button>
  );
}

// ───────────────────────── Home — Today's Menu ─────────────────────────

function HomeScreen({ menu, onOpenMeal, dark = true, cardStyle = 'bordered', showMacroStrip = true, offline = false, refreshing = false, lang = 'en', onChangeLang = () => {} }) {
  const T = window.THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;
  const subtle = dark ? T.creamSubtle : T.cookInkMuted;

  return (
    <div style={{
      padding: '70px 20px 140px',
      color: fg, fontFamily: T.fontUI,
      minHeight: '100%',
    }}>
      {/* Header — wordmark left, lang toggle right */}
      <div style={{
        marginBottom: 14,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: T.fontDisplay,
            fontSize: 36, fontWeight: 600, letterSpacing: -1.2,
            lineHeight: 1, color: fg,
          }}>
            <span style={{ color: T.saffron }}>थ</span>ali
          </div>
          <div style={{
            fontSize: 13, color: muted, marginTop: 6, fontWeight: 500,
            letterSpacing: -0.1,
          }}>
            {menu.date_display || menu.date}
          </div>
        </div>
        <LangToggle lang={lang} onChange={onChangeLang} dark={dark}/>
      </div>

      {/* Status row: Fresh/Offline badge + generated label */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 20,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px 5px 8px',
          borderRadius: 999,
          background: offline ? 'rgba(227,107,46,0.14)' : (dark ? 'rgba(244,178,60,0.08)' : 'rgba(244,178,60,0.16)'),
          border: `1px solid ${offline ? 'rgba(227,107,46,0.32)' : 'rgba(244,178,60,0.22)'}`,
          fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase',
          color: offline ? T.terra : T.saffron,
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999,
            background: offline ? T.terra : T.saffron,
            animation: offline ? 'none' : 'thali-pulse 2s ease-in-out infinite',
          }}/>
          {offline ? 'Offline' : 'Fresh'}
        </div>
        <div style={{
          fontSize: 11.5, color: subtle, fontFamily: T.fontMono,
          letterSpacing: 0,
        }}>
          ✦ {menu.generated_label || 'Generated last night for today'}
        </div>
      </div>

      {/* Meal cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {['breakfast', 'lunch', 'dinner'].map(slot => (
          <MealCard
            key={slot}
            slot={slot}
            meal={menu[slot]}
            onTap={() => onOpenMeal(slot)}
            dark={dark}
            cardStyle={cardStyle}
            lang={lang}
          />
        ))}
      </div>

      {/* Macro strip */}
      {showMacroStrip && menu.vizz_daily_total_with_shake && menu.vizz_daily_total_with_shake.cal > 0 && (
        <div style={{ marginTop: 26 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
              color: muted,
            }}>
              Vizz's macros — today · approx
            </div>
            <div style={{ fontSize: 11, color: subtle, fontFamily: T.fontMono }}>
              incl. shake
            </div>
          </div>
          <div style={{
            display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            <MacroChip value={menu.vizz_daily_total_with_shake.cal} unit="" label="cal" color={T.macroCal} dark={dark}/>
            <MacroChip value={menu.vizz_daily_total_with_shake.protein} unit="g" label="protein" color={T.macroProtein} dark={dark}/>
            <MacroChip value={menu.vizz_daily_total_with_shake.fat} unit="g" label="fat" color={T.macroFat} dark={dark}/>
            <MacroChip value={menu.vizz_daily_total_with_shake.carbs} unit="g" label="carbs" color={T.macroCarbs} dark={dark}/>
          </div>
          {menu.macro_check && (
            <div style={{
              marginTop: 12, padding: '10px 12px',
              borderRadius: 12,
              background: dark ? 'rgba(143,184,97,0.07)' : 'rgba(143,184,97,0.12)',
              border: `1px solid rgba(143,184,97,0.25)`,
              display: 'flex', gap: 8, alignItems: 'flex-start',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: 999, background: T.pista,
                marginTop: 6, flexShrink: 0,
              }}/>
              <div style={{
                fontSize: 12, lineHeight: 1.45, color: dark ? T.cream : T.cookInk,
                fontWeight: 500,
              }}>
                {menu.macro_check}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MealCard({ slot, meal, onTap, dark = true, cardStyle = 'bordered', lang = 'en' }) {
  const T = window.THALI_T;
  const tok = window.MEAL_TOKENS[slot];
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;

  const filled = cardStyle === 'filled';
  const minimal = cardStyle === 'minimal';

  const primary   = lang === 'hi' ? meal.dish_hindi   : meal.dish_english;
  const secondary = lang === 'hi' ? meal.dish_english : meal.dish_hindi;
  const primaryFont = lang === 'hi' ? T.fontDeva : T.fontDisplay;
  const secondaryFont = lang === 'hi' ? T.fontUI : T.fontDeva;

  return (
    <button onClick={onTap} style={{
      all: 'unset',
      display: 'block', width: '100%',
      position: 'relative',
      borderRadius: 18,
      background: filled
        ? `linear-gradient(135deg, ${tok.accentSoft}, ${dark ? 'rgba(246,239,230,0.02)' : 'rgba(35,25,21,0.02)'})`
        : (minimal ? 'transparent' : (dark ? 'rgba(246,239,230,0.025)' : 'rgba(35,25,21,0.025)')),
      border: minimal ? 'none' : `1px solid ${dark ? T.hairline : T.cookHairline}`,
      padding: '16px 18px 16px 22px',
      overflow: 'hidden',
      cursor: 'pointer',
      boxSizing: 'border-box',
    }}>
      {/* left accent strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: minimal ? 3 : 4,
        background: tok.accent,
        borderTopLeftRadius: 18, borderBottomLeftRadius: 18,
      }}/>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* meal label row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginBottom: 7,
          }}>
            <span style={{ color: tok.accent, display: 'inline-flex' }}>
              <MealGlyph kind={tok.glyph} size={13} color={tok.accent}/>
            </span>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: 0.9,
              textTransform: 'uppercase', color: tok.accent,
            }}>
              {tok.label}
            </span>
            <span style={{
              fontSize: 11, color: muted, fontWeight: 500,
              fontFamily: T.fontMono, letterSpacing: 0,
            }}>
              · {tok.timeWindow}
            </span>
          </div>

          {/* dish name — primary lang big, secondary below */}
          <div style={{
            fontFamily: primaryFont,
            fontSize: lang === 'hi' ? 24 : 22, fontWeight: 600, lineHeight: 1.15,
            color: fg, letterSpacing: lang === 'hi' ? -0.4 : -0.6,
          }}>
            {primary}
          </div>
          <div style={{
            fontFamily: secondaryFont,
            fontSize: 13, color: muted, fontWeight: 500,
            marginTop: 3, letterSpacing: -0.1,
          }}>
            {secondary}
          </div>
        </div>

        <Chevron dir="right" size={13} color={dark ? T.creamSubtle : T.cookInkMuted} stroke={1.8}/>
      </div>

      {/* tiny macro footer */}
      <div style={{
        display: 'flex', gap: 14, marginTop: 12, paddingTop: 11,
        borderTop: `1px solid ${dark ? T.hairline : T.cookHairline}`,
        fontFamily: T.fontMono, fontSize: 11,
        color: muted,
      }}>
        <span><b style={{ color: fg, fontWeight: 600 }}>{meal.vizz_macros.cal}</b> cal</span>
        <span><b style={{ color: fg, fontWeight: 600 }}>{meal.vizz_macros.protein}</b>g P</span>
        <span><b style={{ color: fg, fontWeight: 600 }}>{meal.vizz_macros.fat}</b>g F</span>
        <span><b style={{ color: fg, fontWeight: 600 }}>{meal.vizz_macros.carbs}</b>g C</span>
      </div>
    </button>
  );
}

// ───────────────────────── Meal detail ─────────────────────────

function MealDetailScreen({ slot, meal, onBack, dark = true, lang = 'en', onChangeLang = () => {} }) {
  const T = window.THALI_T;
  const tok = window.MEAL_TOKENS[slot];
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;

  const primary   = lang === 'hi' ? meal.dish_hindi   : meal.dish_english;
  const secondary = lang === 'hi' ? meal.dish_english : meal.dish_hindi;
  const primaryFont = lang === 'hi' ? T.fontDeva : T.fontDisplay;
  const secondaryFont = lang === 'hi' ? T.fontUI : T.fontDeva;

  // Support both new array format and old comma-separated string
  const ingredients = lang === 'hi'
    ? (meal.ingredients_list_hi || (meal.ingredients_hindi ? meal.ingredients_hindi.split(',').map(s => s.trim()) : []))
    : (meal.ingredients_list_en || (meal.ingredients_hindi ? meal.ingredients_hindi.split(',').map(s => s.trim()) : []));
  const prepNotes = lang === 'hi'
    ? (meal.prep_notes_hi || meal.prep_notes || '')
    : (meal.prep_notes_en || meal.prep_notes || '');

  return (
    <div style={{
      padding: '70px 0 140px',
      color: fg, fontFamily: T.fontUI,
      minHeight: '100%',
    }}>
      {/* top bar — back · meal pill · lang toggle */}
      <div style={{
        padding: '0 14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
      }}>
        <button onClick={onBack} style={{
          all: 'unset', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 12px 8px 8px',
          borderRadius: 999,
          background: dark ? 'rgba(246,239,230,0.06)' : 'rgba(35,25,21,0.05)',
          border: `1px solid ${dark ? T.hairline : T.cookHairline}`,
          color: fg, fontSize: 13, fontWeight: 500,
          flexShrink: 0,
        }}>
          <Chevron dir="left" size={11} color={fg} stroke={2.2}/>
          Today
        </button>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '6px 11px', borderRadius: 999,
          background: tok.accentSoft,
          fontSize: 11, fontWeight: 600, letterSpacing: 0.7, textTransform: 'uppercase',
          color: tok.accent,
          flex: '0 1 auto', minWidth: 0,
        }}>
          <MealGlyph kind={tok.glyph} size={12} color={tok.accent}/>
          {tok.label}
        </div>
        <LangToggle lang={lang} onChange={onChangeLang} dark={dark}/>
      </div>

      {/* dish name big */}
      <div style={{ padding: '4px 22px 18px' }}>
        <div style={{
          fontFamily: primaryFont,
          fontSize: lang === 'hi' ? 44 : 40, fontWeight: 600, lineHeight: 1.05,
          color: fg, letterSpacing: lang === 'hi' ? -1.5 : -2,
        }}>
          {primary}
        </div>
        <div style={{
          fontFamily: secondaryFont,
          fontSize: 16, color: muted, fontWeight: 500, marginTop: 8,
          letterSpacing: -0.2,
        }}>
          {secondary}
        </div>
      </div>

      {/* Ingredients */}
      <SectionHeader label="Ingredients" hindiLabel="सामग्री" dark={dark} lang={lang}/>
      <div style={{
        display: 'flex', gap: 6, overflowX: 'auto',
        padding: '0 20px 18px',
        scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
      }}>
        {ingredients.map((ing, i) => (
          <div key={i} style={{
            flexShrink: 0,
            padding: '8px 13px',
            borderRadius: 999,
            background: dark ? 'rgba(246,239,230,0.05)' : 'rgba(35,25,21,0.04)',
            border: `1px solid ${dark ? T.hairline : T.cookHairline}`,
            fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI,
            fontSize: lang === 'hi' ? 14 : 13, color: fg, fontWeight: 500,
            letterSpacing: lang === 'hi' ? 0 : -0.1,
          }}>
            {ing}
          </div>
        ))}
      </div>

      {/* Prep notes */}
      {prepNotes ? (
        <>
          <SectionHeader label="Prep notes" hindiLabel="बनाने का तरीक़ा" dark={dark} lang={lang}/>
          <div style={{ padding: '0 20px 22px' }}>
            <div style={{
              padding: '16px 18px',
              borderRadius: 16,
              background: dark ? 'rgba(246,239,230,0.03)' : '#FFFFFF',
              border: `1px solid ${dark ? T.hairline : T.cookHairline}`,
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: 14, right: 14,
                fontFamily: T.fontMono, fontSize: 9.5, letterSpacing: 1,
                color: muted, textTransform: 'uppercase',
              }}>
                For the cook
              </div>
              <div style={{
                fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI,
                fontSize: lang === 'hi' ? 15 : 14, lineHeight: 1.55,
                color: fg, fontWeight: 400, marginRight: 70,
                letterSpacing: lang === 'hi' ? 0 : -0.1,
              }}>
                {prepNotes}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* Watch recipe */}
      {meal.youtube_url ? (
        <div style={{ padding: '0 20px 22px' }}>
          <a href={meal.youtube_url} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            textDecoration: 'none',
            padding: '14px 16px',
            borderRadius: 16,
            background: dark ? 'rgba(227,107,46,0.10)' : 'rgba(227,107,46,0.10)',
            border: `1px solid rgba(227,107,46,0.32)`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 12,
              background: '#FF0033',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255,0,51,0.32)',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: fg, letterSpacing: -0.2 }}>
                Watch recipe
              </div>
              <div style={{ fontSize: 11, color: muted, marginTop: 2, fontFamily: T.fontMono }}>
                youtube.com / opens in browser
              </div>
            </div>
            <Chevron dir="right" size={13} color={muted} stroke={2}/>
          </a>
        </div>
      ) : null}

      {/* Vizz macros 2x2 */}
      <SectionHeader label="Vizz's macros · approx" hindiLabel="विज़ के मैक्रोज़ · अनुमान" dark={dark} lang={lang}/>
      <div style={{
        padding: '0 20px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        <StatTile value={meal.vizz_macros.cal} unit="" label="Calories" color={T.macroCal} dark={dark}/>
        <StatTile value={meal.vizz_macros.protein} unit="g" label="Protein" color={T.macroProtein} dark={dark}/>
        <StatTile value={meal.vizz_macros.fat} unit="g" label="Fat" color={T.macroFat} dark={dark}/>
        <StatTile value={meal.vizz_macros.carbs} unit="g" label="Carbs" color={T.macroCarbs} dark={dark}/>
      </div>
    </div>
  );
}

// ───────────────────────── Cook view — cream paper, big text ─────────────────────────

function CookScreen({ menu }) {
  const T = window.THALI_T;
  return (
    <div style={{
      padding: '60px 18px 130px',
      background: T.cookBg, color: T.cookInk,
      fontFamily: T.fontUI, minHeight: '100%',
    }}>
      {/* header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
        marginBottom: 18, paddingBottom: 12,
        borderBottom: `1px solid ${T.cookHairline}`,
      }}>
        <div>
          <div style={{
            fontFamily: T.fontDeva, fontSize: 28, fontWeight: 600,
            color: T.cookInk, letterSpacing: -0.6, lineHeight: 1,
          }}>
            कल का खाना
          </div>
          <div style={{
            fontSize: 13, color: T.cookInkMuted, marginTop: 6, fontWeight: 500,
          }}>
            {menu.date_display || menu.date}
          </div>
        </div>
        <div style={{
          padding: '5px 10px', borderRadius: 999,
          background: 'rgba(227,107,46,0.14)',
          border: '1px solid rgba(227,107,46,0.32)',
          fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase',
          color: T.terra, fontFamily: T.fontUI,
        }}>
          Cook view
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {['breakfast', 'lunch', 'dinner'].map(slot => (
          <CookMealCard key={slot} slot={slot} meal={menu[slot]}/>
        ))}
      </div>
    </div>
  );
}

function CookMealCard({ slot, meal }) {
  const T = window.THALI_T;
  const tok = window.MEAL_TOKENS[slot];
  const timeLabels = {
    breakfast: 'सुबह का नाश्ता',
    lunch: 'लंच / टिफ़िन',
    dinner: 'रात का खाना',
  };
  const timeWindows = {
    breakfast: '८ बजे',
    lunch: '१ बजे',
    dinner: '९ बजे',
  };

  // Support both old and new schema
  const ingredientsText = meal.ingredients_hindi || '';
  const prepText = meal.prep_notes_hi || meal.prep_notes || '';

  return (
    <div style={{
      background: T.cookBgRaised,
      borderRadius: 18,
      border: `1px solid ${T.cookHairline}`,
      borderLeft: `5px solid ${tok.accent}`,
      padding: '16px 18px 18px',
      boxShadow: '0 1px 0 rgba(35,25,21,0.04), 0 8px 24px -16px rgba(35,25,21,0.18)',
    }}>
      {/* time header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12, paddingBottom: 10,
        borderBottom: `1px dashed ${T.cookHairline}`,
      }}>
        <div style={{
          fontFamily: T.fontDeva, fontSize: 18, fontWeight: 600,
          color: T.cookInk, letterSpacing: -0.3,
        }}>
          {timeLabels[slot]}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', borderRadius: 999,
          background: tok.accentSoft,
          fontFamily: T.fontDeva,
          fontSize: 14, fontWeight: 600, color: tok.accent,
        }}>
          {timeWindows[slot]}
        </div>
      </div>

      {/* dish */}
      <div style={{
        fontFamily: T.fontDeva, fontSize: 28, fontWeight: 700, lineHeight: 1.15,
        color: T.cookInk, letterSpacing: -0.6, marginBottom: 14,
      }}>
        {meal.dish_hindi}
      </div>

      {/* ingredients */}
      <div style={{
        fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        color: T.cookInkMuted, marginBottom: 6, fontFamily: T.fontUI,
      }}>
        सामग्री
      </div>
      <div style={{
        fontFamily: T.fontDeva, fontSize: 18, lineHeight: 1.5, fontWeight: 500,
        color: T.cookInk, marginBottom: prepText ? 16 : 0,
      }}>
        {ingredientsText}
      </div>

      {/* prep notes */}
      {prepText ? (
        <>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: T.cookInkMuted, marginBottom: 6, fontFamily: T.fontUI,
          }}>
            बनाने का तरीक़ा
          </div>
          <div style={{
            fontFamily: T.fontDeva, fontSize: 17, lineHeight: 1.55, fontWeight: 400,
            color: T.cookInk, marginBottom: 16,
            background: T.cookWarm,
            padding: '12px 14px',
            borderRadius: 12,
          }}>
            {prepText}
          </div>
        </>
      ) : null}

      {/* speak button */}
      <SpeakButton
        dish={meal.dish_hindi}
        ingredients={ingredientsText}
        prepNotes={prepText}
        accent={tok.accent}
      />

      {/* youtube button */}
      {meal.youtube_url ? (
        <a href={meal.youtube_url} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', gap: 12,
          textDecoration: 'none',
          padding: '14px 16px',
          borderRadius: 14,
          background: '#FF0033',
          color: '#fff',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <div style={{
            fontFamily: T.fontDeva,
            fontSize: 17, fontWeight: 700, letterSpacing: -0.2,
            flex: 1,
          }}>
            वीडियो देखें · Watch recipe
          </div>
          <Chevron dir="right" size={14} color="#fff" stroke={2.4}/>
        </a>
      ) : null}
    </div>
  );
}

// ───────────────────────── History ─────────────────────────

function HistoryScreen({ history, onOpenDay, dark = true, lang = 'en', onChangeLang = () => {} }) {
  const T = window.THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;
  const subtle = dark ? T.creamSubtle : T.cookInkMuted;

  return (
    <div style={{
      padding: '70px 20px 130px',
      color: fg, fontFamily: T.fontUI,
      minHeight: '100%',
    }}>
      <div style={{
        marginBottom: 22, display: 'flex',
        alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: T.fontDisplay,
            fontSize: 32, fontWeight: 600, letterSpacing: -1, lineHeight: 1,
            color: fg,
          }}>
            History
          </div>
          <div style={{
            fontSize: 13, color: muted, marginTop: 6, fontWeight: 500,
          }}>
            {history.length > 0 ? `${history.length} days of menus` : 'No history yet'}
          </div>
        </div>
        <LangToggle lang={lang} onChange={onChangeLang} dark={dark}/>
      </div>

      {history.length === 0 ? (
        <div style={{
          marginTop: 40, textAlign: 'center',
          fontSize: 13, color: subtle, fontFamily: T.fontUI, lineHeight: 1.6,
        }}>
          Menus will appear here after the<br/>first nightly generation.
        </div>
      ) : (
        <>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase',
            color: subtle, marginBottom: 12, fontFamily: T.fontUI,
          }}>
            Recent menus
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((day, i) => (
              <HistoryRow key={i} day={day} onTap={() => onOpenDay && onOpenDay(i)} dark={dark} lang={lang}/>
            ))}
          </div>
          <div style={{
            marginTop: 22, textAlign: 'center',
            fontSize: 11, fontFamily: T.fontMono, color: subtle,
            letterSpacing: 0.4,
          }}>
            ✦ end of history ✦
          </div>
        </>
      )}
    </div>
  );
}

function HistoryRow({ day, onTap, dark = true, lang = 'en' }) {
  const T = window.THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  const muted = dark ? T.creamMuted : T.cookInkMuted;
  const subtle = dark ? T.creamSubtle : T.cookInkMuted;

  return (
    <button onClick={onTap} style={{
      all: 'unset', cursor: 'pointer', display: 'block', width: '100%',
      boxSizing: 'border-box',
      padding: '14px 16px',
      borderRadius: 16,
      background: dark ? 'rgba(246,239,230,0.025)' : 'rgba(35,25,21,0.025)',
      border: `1px solid ${dark ? T.hairline : T.cookHairline}`,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 10,
      }}>
        <div style={{
          fontFamily: T.fontMono, fontSize: 11,
          color: subtle, letterSpacing: 0.6, textTransform: 'uppercase',
        }}>
          {day.date_short}
        </div>
        <Chevron dir="right" size={11} color={subtle} stroke={1.8}/>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        <MealRowMini accent={T.saffron} label="B" name={lang === 'hi' ? day.breakfast_hi : day.breakfast_en} lang={lang} dark={dark}/>
        <MealRowMini accent={T.pista}   label="L" name={lang === 'hi' ? day.lunch_hi     : day.lunch_en}     lang={lang} dark={dark}/>
        <MealRowMini accent={T.terra}   label="D" name={lang === 'hi' ? day.dinner_hi    : day.dinner_en}    lang={lang} dark={dark}/>
      </div>
    </button>
  );
}

function MealRowMini({ accent, label, name, dark = true, lang = 'en' }) {
  const T = window.THALI_T;
  const fg = dark ? T.cream : T.cookInk;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        width: 18, height: 18, borderRadius: 6,
        background: 'transparent', border: `1px solid ${accent}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent, fontSize: 9.5, fontWeight: 700, letterSpacing: 0.4,
        fontFamily: T.fontUI, flexShrink: 0,
      }}>{label}</span>
      <span style={{
        fontSize: lang === 'hi' ? 14.5 : 13.5,
        fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI,
        color: fg, fontWeight: 500, letterSpacing: lang === 'hi' ? 0 : -0.1,
      }}>
        {name}
      </span>
    </div>
  );
}

// ───────────────────────── Next day + Grocery list ─────────────────────────

function NextScreen({ menu, dark = true, lang = 'en', onChangeLang = () => {} }) {
  const T = window.THALI_T;
  const { useState: useLocalState } = React;
  const fg     = dark ? T.cream    : T.cookInk;
  const muted  = dark ? T.creamMuted  : T.cookInkMuted;
  const subtle = dark ? T.creamSubtle : T.cookInkMuted;

  // Build consolidated unique ingredient list from all 3 meals
  const allIngredients = React.useMemo(() => {
    if (!menu) return [];
    const seen = new Set();
    const list = [];
    for (const slot of ['breakfast', 'lunch', 'dinner']) {
      const meal = menu[slot];
      const items = lang === 'hi'
        ? (meal.ingredients_list_hi || [])
        : (meal.ingredients_list_en || []);
      for (const item of items) {
        const key = item.trim().toLowerCase();
        if (key && !seen.has(key)) { seen.add(key); list.push({ item: item.trim(), slot }); }
      }
    }
    return list;
  }, [menu, lang]);

  // Grocery checklist — persisted per date so it resets for each new day
  const storageKey = `thali_groceries_${menu?.date?.substring(0, 10) || 'next'}`;
  const [checked, setChecked] = useLocalState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
    catch { return {}; }
  });

  const toggle = (item) => {
    setChecked(prev => {
      const next = { ...prev, [item]: !prev[item] };
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const checkedCount = Object.values(checked).filter(Boolean).length;

  if (!menu || !menu.breakfast?.dish_english || menu.breakfast.dish_english === 'Not generated yet') {
    return (
      <div style={{ padding: '70px 20px 130px', color: fg, fontFamily: T.fontUI }}>
        <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 600, letterSpacing: -1, color: fg, marginBottom: 8 }}>
          Next
        </div>
        <div style={{ fontSize: 13, color: muted, marginTop: 40, lineHeight: 1.6 }}>
          Tomorrow's menu will appear here after the first nightly generation.
        </div>
      </div>
    );
  }

  const slotAccent = { breakfast: T.saffron, lunch: T.pista, dinner: T.terra };

  return (
    <div style={{ padding: '70px 20px 130px', color: fg, fontFamily: T.fontUI, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: T.fontDisplay, fontSize: 32, fontWeight: 600, letterSpacing: -1, lineHeight: 1, color: fg }}>
            Next
          </div>
          <div style={{ fontSize: 13, color: muted, marginTop: 6, fontWeight: 500 }}>
            {menu.date_display || menu.date}
          </div>
        </div>
        <LangToggle lang={lang} onChange={onChangeLang} dark={dark}/>
      </div>

      {/* Compact meal previews */}
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase',
        color: subtle, marginBottom: 10,
      }}>
        Menu
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {['breakfast', 'lunch', 'dinner'].map(slot => {
          const tok  = window.MEAL_TOKENS[slot];
          const meal = menu[slot];
          const name = lang === 'hi' ? meal.dish_hindi : meal.dish_english;
          return (
            <div key={slot} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderRadius: 14,
              background: dark ? 'rgba(246,239,230,0.025)' : 'rgba(35,25,21,0.025)',
              border: `1px solid ${dark ? T.hairline : T.cookHairline}`,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: tok.accent, borderRadius: '14px 0 0 14px' }}/>
              <div style={{ marginLeft: 4, flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: tok.accent, marginBottom: 3 }}>
                  {tok.label}
                </div>
                <div style={{
                  fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI,
                  fontSize: lang === 'hi' ? 15 : 14, fontWeight: 600,
                  color: fg, letterSpacing: -0.2, lineHeight: 1.2,
                }}>
                  {name}
                </div>
              </div>
              <div style={{ fontFamily: T.fontMono, fontSize: 10.5, color: subtle }}>
                {tok.timeWindow}
              </div>
            </div>
          );
        })}
      </div>

      {/* Grocery checklist */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: subtle }}>
          Groceries
        </div>
        <div style={{ fontSize: 11, color: subtle, fontFamily: T.fontMono }}>
          {checkedCount}/{allIngredients.length}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 3, borderRadius: 999, marginBottom: 14,
        background: dark ? 'rgba(246,239,230,0.08)' : 'rgba(35,25,21,0.08)',
      }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: T.pista,
          width: `${allIngredients.length ? (checkedCount / allIngredients.length) * 100 : 0}%`,
          transition: 'width 0.3s ease',
        }}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {allIngredients.map(({ item, slot }, i) => {
          const isChecked = !!checked[item];
          const accent = slotAccent[slot];
          return (
            <button
              key={i}
              onClick={() => toggle(item)}
              style={{
                all: 'unset', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 4px',
                borderBottom: i < allIngredients.length - 1 ? `1px solid ${dark ? T.hairline : T.cookHairline}` : 'none',
              }}
            >
              {/* Checkbox */}
              <div style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `1.5px solid ${isChecked ? T.pista : (dark ? T.creamSubtle : T.cookInkMuted)}`,
                background: isChecked ? T.pista : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}>
                {isChecked && (
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#0E0B09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              {/* Slot dot */}
              <div style={{ width: 6, height: 6, borderRadius: 999, background: accent, flexShrink: 0, opacity: 0.7 }}/>
              {/* Name */}
              <span style={{
                fontFamily: lang === 'hi' ? T.fontDeva : T.fontUI,
                fontSize: lang === 'hi' ? 15 : 14,
                color: isChecked ? subtle : fg,
                fontWeight: 500,
                textDecoration: isChecked ? 'line-through' : 'none',
                transition: 'color 0.15s',
                letterSpacing: lang === 'hi' ? 0 : -0.1,
                flex: 1,
              }}>
                {item}
              </span>
            </button>
          );
        })}
      </div>

      {checkedCount === allIngredients.length && allIngredients.length > 0 && (
        <div style={{
          marginTop: 20, padding: '12px 16px', borderRadius: 12,
          background: dark ? 'rgba(143,184,97,0.07)' : 'rgba(143,184,97,0.12)',
          border: `1px solid rgba(143,184,97,0.25)`,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 999, background: T.pista, flexShrink: 0 }}/>
          <div style={{ fontSize: 13, color: dark ? T.cream : T.cookInk, fontWeight: 500 }}>
            All groceries sorted ✓
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  HomeScreen, MealCard, MealDetailScreen, CookScreen, CookMealCard,
  HistoryScreen, HistoryRow, MealRowMini, NextScreen,
});
