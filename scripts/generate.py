"""
Daily menu generator.
Runs via GitHub Actions at 10 PM IST (16:30 UTC).
Generates next day's menu, sends to flatmate group via WhatsApp,
and writes menu.json + history.json for the PWA to display.
"""

import os
import json
import urllib.parse
import requests
from datetime import datetime, timedelta
from openai import OpenAI

# ---------- CONFIG ----------
OPENAI_API_KEY        = os.environ["OPENAI_API_KEY"]
WHATSAPP_TOKEN        = os.environ.get("WHATSAPP_TOKEN", "")
WHATSAPP_PHONE_ID     = os.environ.get("WHATSAPP_PHONE_ID", "")
FLATMATE_NUMBERS_RAW  = os.environ.get("FLATMATE_NUMBERS", "")
FLATMATE_NUMBERS      = [n.strip() for n in FLATMATE_NUMBERS_RAW.split(",") if n.strip()]

# Vizz's macro targets
TARGETS = {
    "calories":  2000,
    "protein_g": 110,
    "fat_g":     60,
    "carbs_g":   215,
}

# Diet rules
DIET_RULES = """
- All meals vegetarian. Boiled eggs allowed for Vizz and Flatmate-2 only.
- Flatmate-3: vegetarian, no eggs.
- Fruits: only Flatmate-3 eats them. Do not include fruits in shared meals.
- Cook has 45 min in morning (breakfast + lunch prep) and 45 min at night (dinner). Stay within this.
- Breakfast + lunch served to 2 people (Vizz + Flatmate-2). Dinner served to 3 people.
- Lunch must be office-portable, hold 4-5 hours unrefrigerated, microwave-reheatable.
- Avoid soggy items (dosa, puri) or salads that wilt. Good portable lunches: dal-rice, rajma-rice,
  chole-rice, pulao, paratha + sabzi, curd rice, pasta salad, grain bowls.
- Vizz needs: 2000 cal / 110g protein / 60g fat / 215g carbs daily.
- Vizz takes a 40g protein shake (plant protein + 500ml milk) — counts toward daily total but NOT
  part of cooked meals. Shake adds: 300 cal / 40g protein / 5g fat / 25g carbs.
- Cooked meals for Vizz must deliver: ~1700 cal / ~70g protein / ~45g fat / ~200g carbs
  across breakfast + lunch + dinner combined.
- CUISINE: Primarily Indian home cooking, but variety is strongly encouraged. Non-Indian meals are
  welcome — e.g. sprout salad, pasta, oats, continental breakfast, grain bowls, Asian noodles.
  Aim for at least 1 non-Indian meal every 2-3 days. No repeats from last 3 days.
- ACCOMPANIMENTS: Meals should feel complete. Include natural sides where they fit —
  raita, chutney, cut salad, pickle, curd, papad. List them as part of the dish.
  e.g. dish_english = "Rajma with Basmati Rice, Boondi Raita & Sliced Onion"
"""


# ---------- DATE HELPERS ----------
def format_date_display(dt: datetime) -> str:
    """'Monday, May 19'"""
    return dt.strftime("%A, %B %-d")

def format_date_short(dt: datetime) -> str:
    """'Mon · May 19'"""
    return dt.strftime("%a · %b %-d")


# ---------- MENU GENERATION ----------
def generate_menu(tomorrow: datetime, recent_menus: list = None) -> dict:
    client = OpenAI(api_key=OPENAI_API_KEY)

    date_str     = tomorrow.strftime("%Y-%m-%d (%A)")
    date_display = format_date_display(tomorrow)
    date_short   = format_date_short(tomorrow)

    recent_context = ""
    if recent_menus:
        recent_context = f"\n\nLast 3 days' menus (avoid repeats):\n{json.dumps(recent_menus, indent=2)}"

    prompt = f"""Generate tomorrow's ({date_str}) menu for an Indian household.

{DIET_RULES}
{recent_context}

Return ONLY valid JSON in this exact structure:
{{
  "date": "{date_str}",
  "date_display": "{date_display}",
  "date_short": "{date_short}",
  "generated_label": "Generated last night for today",
  "breakfast": {{
    "dish_hindi": "string (Devanagari, include accompaniments e.g. 'पोहा, बूँदी रायता')",
    "dish_english": "string (English, include accompaniments e.g. 'Poha with Peanut Chutney & Curd')",
    "ingredients_hindi": "string (comma-separated in Devanagari)",
    "ingredients_list_hi": ["individual", "Devanagari", "ingredients"],
    "ingredients_list_en": ["individual", "English", "ingredients"],
    "youtube_search_query": "string (3-5 words to search YouTube, e.g. 'poha recipe hindi')",
    "prep_notes_hi": "string (2-4 sentences in Devanagari: key technique tips for the cook)",
    "prep_notes_en": "string (2-4 sentences in English: same tips)",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "lunch": {{
    "dish_hindi": "string (include accompaniments)",
    "dish_english": "string (include accompaniments)",
    "ingredients_hindi": "string",
    "ingredients_list_hi": ["array"],
    "ingredients_list_en": ["array"],
    "youtube_search_query": "string (3-5 words)",
    "prep_notes_hi": "string (mention it must travel + reheat well)",
    "prep_notes_en": "string (mention it must travel + reheat well)",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "dinner": {{
    "dish_hindi": "string (include accompaniments)",
    "dish_english": "string (include accompaniments)",
    "ingredients_hindi": "string",
    "ingredients_list_hi": ["array"],
    "ingredients_list_en": ["array"],
    "youtube_search_query": "string (3-5 words)",
    "prep_notes_hi": "string",
    "prep_notes_en": "string",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "vizz_daily_total_from_meals": {{"cal": int, "protein": int, "fat": int, "carbs": int}},
  "vizz_daily_total_with_shake": {{"cal": int, "protein": int, "fat": int, "carbs": int}},
  "macro_check": "string (one line: does this hit 2000/110/60/215 target? note any gaps)"
}}

Rules for ingredients arrays:
- ingredients_list_hi: each item is a single ingredient in Devanagari (e.g. "पोहा", "प्याज")
- ingredients_list_en: each item is a single ingredient in English (e.g. "Poha (flattened rice)", "Onion")
- ingredients_hindi: the comma-separated string version for cook display
- youtube_search_query: just the search terms, NOT a URL — Python will build the link

MACRO RULES — be realistic, not aspirational:
- All macros are for 1 adult male serving (Vizz's portion only).
- Assume realistic home-cooked quantities: ~300-450g cooked weight per meal.
- Use these anchors to reason from:
    Rice 100g dry → cooked ~300g → 350 cal, 7g protein, 1g fat, 78g carbs
    Dal 100g dry → cooked ~300g → 340 cal, 22g protein, 2g fat, 60g carbs
    Paneer 100g → 265 cal, 18g protein, 20g fat, 3g carbs
    Wheat roti (40g each) → 120 cal, 4g protein, 1g fat, 25g carbs
    Egg (1 large, boiled) → 70 cal, 6g protein, 5g fat, 0g carbs
    Oats 80g dry → 300 cal, 12g protein, 5g fat, 52g carbs
    Pasta 80g dry → 290 cal, 10g protein, 1g fat, 58g carbs
- Do NOT overestimate protein. Pulao, upma, poha are low-protein (~6-12g). Dal/paneer/egg are the protein sources.
- If the dish can't realistically hit protein targets, say so in macro_check.

Boiled egg adds: ~70 cal / 6g protein / 5g fat — include where it fits.
Return ONLY the JSON, no markdown, no explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2500,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}]
    )

    menu = json.loads(response.choices[0].message.content)

    # Convert search queries → real YouTube URLs via Data API (or search URL fallback)
    for slot in ("breakfast", "lunch", "dinner"):
        q = menu[slot].pop("youtube_search_query", "") or menu[slot].get("dish_english", "")
        # If GPT hallucinated a URL instead of a query, use dish name as fallback query
        if q.startswith("http"):
            q = menu[slot]["dish_english"]
        menu[slot]["youtube_url"] = get_youtube_url(q)

    return menu


# ---------- MESSAGE FORMATTING ----------
def format_whatsapp_message(menu: dict) -> str:
    m = menu
    t = m.get("vizz_daily_total_with_shake", {})
    return f"""*Menu for {m.get('date_display', m['date'])}*

*Breakfast* (8 AM, for 2)
{m['breakfast']['dish_hindi']} ({m['breakfast']['dish_english']})
Recipe: {m['breakfast']['youtube_url']}

*Lunch* (packed by 9 AM, for 2)
{m['lunch']['dish_hindi']} ({m['lunch']['dish_english']})
Recipe: {m['lunch']['youtube_url']}

*Dinner* (9 PM, for 3)
{m['dinner']['dish_hindi']} ({m['dinner']['dish_english']})
Recipe: {m['dinner']['youtube_url']}

---
Vizz macros (with shake): {t.get('cal',0)} cal / {t.get('protein',0)}g P / {t.get('fat',0)}g F / {t.get('carbs',0)}g C
Target: 2000 / 110 / 60 / 215
{m.get('macro_check', '')}

View full menu + cook notes: https://cuecrew.github.io/menu-generator"""


def format_cook_message(menu: dict) -> str:
    m = menu
    return f"""कल का मेन्यू ({m.get('date_display', m['date'])})

*सुबह (2 लोगों के लिए)*
नाश्ता: {m['breakfast']['dish_hindi']}
सामग्री: {m['breakfast']['ingredients_hindi']}
रेसिपी: {m['breakfast']['youtube_url']}
नोट: {m['breakfast'].get('prep_notes_hi', '')}

लंच (टिफ़िन): {m['lunch']['dish_hindi']}
सामग्री: {m['lunch']['ingredients_hindi']}
रेसिपी: {m['lunch']['youtube_url']}
नोट: {m['lunch'].get('prep_notes_hi', '')}

*रात (3 लोगों के लिए)*
डिनर: {m['dinner']['dish_hindi']}
सामग्री: {m['dinner']['ingredients_hindi']}
रेसिपी: {m['dinner']['youtube_url']}
नोट: {m['dinner'].get('prep_notes_hi', '')}"""


# ---------- YOUTUBE ----------
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")

def get_youtube_url(search_query: str) -> str:
    """Return the top YouTube video URL for the query, or a search URL as fallback."""
    if not YOUTUBE_API_KEY:
        return (
            "https://www.youtube.com/results?search_query="
            + urllib.parse.quote(search_query + " recipe")
        )
    try:
        r = requests.get(
            "https://www.googleapis.com/youtube/v3/search",
            params={
                "part":             "snippet",
                "q":                search_query + " recipe",
                "type":             "video",
                "maxResults":       1,
                "relevanceLanguage":"hi",
                "regionCode":       "IN",
                "key":              YOUTUBE_API_KEY,
            },
            timeout=10,
        )
        items = r.json().get("items", [])
        if items:
            video_id = items[0]["id"]["videoId"]
            print(f"  YouTube: found https://www.youtube.com/watch?v={video_id} for '{search_query}'")
            return f"https://www.youtube.com/watch?v={video_id}"
    except Exception as e:
        print(f"  YouTube API error for '{search_query}': {e}")
    # Fallback
    return (
        "https://www.youtube.com/results?search_query="
        + urllib.parse.quote(search_query + " recipe")
    )


# ---------- WHATSAPP ----------
def send_whatsapp(to_number: str, message: str) -> dict:
    url = f"https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages"
    headers = {
        "Authorization": f"Bearer {WHATSAPP_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "messaging_product": "whatsapp",
        "to": to_number,
        "type": "text",
        "text": {"body": message},
    }
    r = requests.post(url, headers=headers, json=payload, timeout=15)
    return {"status": r.status_code, "body": r.json() if r.content else None}


# ---------- HISTORY ----------
HISTORY_FILE  = "data/history.json"
MENU_FILE     = "data/menu.json"
TOMORROW_FILE = "data/tomorrow.json"

def load_history() -> list:
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, encoding="utf-8") as f:
        return json.load(f)

def save_files(menu: dict, tomorrow_menu: dict):
    os.makedirs("data", exist_ok=True)

    # Today's menu (D+1 from run time)
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(menu, f, indent=2, ensure_ascii=False)
    print(f"Saved {MENU_FILE}")

    # Tomorrow's menu (D+2 from run time) — for grocery planning
    with open(TOMORROW_FILE, "w", encoding="utf-8") as f:
        json.dump(tomorrow_menu, f, indent=2, ensure_ascii=False)
    print(f"Saved {TOMORROW_FILE}")

    # Append today's menu to history (keep last 30 days)
    history = load_history()
    history.append(menu)
    history = history[-30:]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)
    print(f"Updated {HISTORY_FILE} ({len(history)} entries)")


# ---------- MAIN ----------
def main():
    now       = datetime.now()
    tomorrow  = now + timedelta(days=1)
    day_after = now + timedelta(days=2)

    history = load_history()
    recent_dishes = [
        {
            "date":      h.get("date", ""),
            "breakfast": h["breakfast"]["dish_english"],
            "lunch":     h["lunch"]["dish_english"],
            "dinner":    h["dinner"]["dish_english"],
        }
        for h in history[-3:]
    ]

    # ── D+1: promote yesterday's "tomorrow" if it matches, else generate fresh ──
    # This ensures the menu the user saw in the Next tab is the same one
    # that appears as Today the following day — no surprise changes.
    expected_date_prefix = tomorrow.strftime("%Y-%m-%d")
    menu = None

    if os.path.exists(TOMORROW_FILE):
        with open(TOMORROW_FILE, encoding="utf-8") as f:
            cached = json.load(f)
        if cached.get("date", "").startswith(expected_date_prefix):
            menu = cached
            print(f"Promoting pre-generated menu for {format_date_display(tomorrow)} (no re-generation)")

    if menu is None:
        print(f"Generating menu for {format_date_display(tomorrow)}…")
        menu = generate_menu(tomorrow, recent_dishes)

    # ── D+2: always generate fresh for the Next tab ──
    recent_plus_tomorrow = recent_dishes + [{
        "date":      menu.get("date", ""),
        "breakfast": menu["breakfast"]["dish_english"],
        "lunch":     menu["lunch"]["dish_english"],
        "dinner":    menu["dinner"]["dish_english"],
    }]
    print(f"Generating menu for {format_date_display(day_after)}…")
    tomorrow_menu = generate_menu(day_after, recent_plus_tomorrow)

    flatmate_msg = format_whatsapp_message(menu)
    cook_msg     = format_cook_message(menu)

    print("\n=== FLATMATE MESSAGE ===")
    print(flatmate_msg)
    print("\n=== COOK MESSAGE ===")
    print(cook_msg)

    save_files(menu, tomorrow_menu)

    # Send WhatsApp if credentials are present
    if WHATSAPP_TOKEN and FLATMATE_NUMBERS:
        for number in FLATMATE_NUMBERS:
            result = send_whatsapp(number, flatmate_msg)
            print(f"Sent to {number}: {result['status']}")
    else:
        print("WhatsApp credentials not set — skipping send.")

    print("\nDone.")


if __name__ == "__main__":
    main()
