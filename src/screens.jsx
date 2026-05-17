// All four screens of Thali. Each accepts data + dark/cook props so they
// can be embedded in either the live prototype or the cook-mode artboard.

const { useState, useEffect, useRef } = React;

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
              Vizz's macros — today
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
      <SectionHeader label="Vizz's macros" hindiLabel="विज़ के मैक्रोज़" dark={dark} lang={lang}/>
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

Object.assign(window, {
  HomeScreen, MealCard, MealDetailScreen, CookScreen, CookMealCard,
  HistoryScreen, HistoryRow, MealRowMini,
});
