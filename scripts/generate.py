"""
Daily menu generator.
Runs via GitHub Actions at 10 PM IST.
Generates next day's menu, sends to flatmate group via WhatsApp,
and writes menu.json + history.json for the PWA to display.
"""

import os
import json
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
    "calories": 2000,
    "protein_g": 110,
    "fat_g": 60,
    "carbs_g": 215,
}

# Diet rules
DIET_RULES = """
- All meals vegetarian. Boiled eggs allowed for Vizz and Flatmate-2 only.
- Flatmate-3: vegetarian, no eggs.
- Fruits: only Flatmate-3 eats them. Do not include fruits in shared meals; can suggest as optional add-on for Flatmate-3.
- Cook has 45 min in morning (breakfast + lunch) and 45 min at night (dinner). Stay within this budget.
- Breakfast + lunch served to 2 people (Vizz + Flatmate-2). Dinner served to 3 people.
- Lunch must be office-portable, hold for 4-5 hours unrefrigerated, microwave-reheatable.
- Avoid: soggy items (dosa, puri), wilting salads, anything that separates badly.
- Good lunch candidates: dal-rice, rajma-rice, chole-rice, pulao, paratha + sabzi, curd rice, biryani-style.
- Vizz needs to hit: 2000 cal / 110g protein / 60g fat / 215g carbs daily.
- Vizz takes a 40g protein shake (plant protein + 500ml milk) — counts toward daily total but NOT part of cooked meals.
- Cooked meals for Vizz must deliver: ~1700 cal / 70g protein / ~45g fat / ~200g carbs across breakfast + lunch + dinner.
- Indian cuisine focus. Variety across the week. No repeats from last 3 days.
"""

# ---------- MENU GENERATION ----------
def generate_menu(date_str: str, recent_menus: list = None) -> dict:
    client = OpenAI(api_key=OPENAI_API_KEY)

    recent_context = ""
    if recent_menus:
        recent_context = f"\n\nLast 3 days' menus (avoid repeats):\n{json.dumps(recent_menus, indent=2)}"

    prompt = f"""Generate tomorrow's ({date_str}) menu for an Indian household.

{DIET_RULES}
{recent_context}

Return ONLY valid JSON in this exact structure:
{{
  "date": "{date_str}",
  "breakfast": {{
    "dish_hindi": "string (Hindi/Hinglish name for cook)",
    "dish_english": "string",
    "ingredients_hindi": "string (comma-separated, in Hindi/Hinglish)",
    "youtube_url": "string (a real YouTube recipe URL)",
    "prep_notes": "string (Hindi, brief instruction to cook)",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "lunch": {{
    "dish_hindi": "string",
    "dish_english": "string",
    "ingredients_hindi": "string",
    "youtube_url": "string",
    "prep_notes": "string (mention it must travel + reheat well)",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "dinner": {{
    "dish_hindi": "string",
    "dish_english": "string",
    "ingredients_hindi": "string",
    "youtube_url": "string",
    "prep_notes": "string",
    "vizz_macros": {{"cal": int, "protein": int, "fat": int, "carbs": int}}
  }},
  "vizz_daily_total_from_meals": {{"cal": int, "protein": int, "fat": int, "carbs": int}},
  "vizz_daily_total_with_shake": {{"cal": int, "protein": int, "fat": int, "carbs": int}},
  "macro_check": "string (one line: does this hit 2000/110/60/215 target? any gaps?)"
}}

Protein shake adds: 300 cal, 40g protein, 5g fat, 25g carbs.
Boiled egg adds: ~70 cal / 6g protein / 5g fat — include where it fits.
Return ONLY the JSON, no markdown, no explanation."""

    response = client.chat.completions.create(
        model="gpt-4o",
        max_tokens=2000,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content": prompt}]
    )

    return json.loads(response.choices[0].message.content)


# ---------- MESSAGE FORMATTING ----------
def format_whatsapp_message(menu: dict) -> str:
    m = menu
    return f"""*Menu for {m['date']}*

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
Vizz macros (with shake): {m['vizz_daily_total_with_shake']['cal']} cal / {m['vizz_daily_total_with_shake']['protein']}g P / {m['vizz_daily_total_with_shake']['fat']}g F / {m['vizz_daily_total_with_shake']['carbs']}g C
Target: 2000 / 110 / 60 / 215
{m['macro_check']}

Reply *YES* to approve or *NO* + reason to revise."""


def format_cook_message(menu: dict) -> str:
    m = menu
    return f"""कल का मेन्यू ({m['date']})

*सुबह (2 लोगों के लिए)*
नाश्ता: {m['breakfast']['dish_hindi']}
सामग्री: {m['breakfast']['ingredients_hindi']}
रेसिपी: {m['breakfast']['youtube_url']}
नोट: {m['breakfast']['prep_notes']}

लंच (टिफ़िन): {m['lunch']['dish_hindi']}
सामग्री: {m['lunch']['ingredients_hindi']}
रेसिपी: {m['lunch']['youtube_url']}
नोट: {m['lunch']['prep_notes']}

*रात (3 लोगों के लिए)*
डिनर: {m['dinner']['dish_hindi']}
सामग्री: {m['dinner']['ingredients_hindi']}
रेसिपी: {m['dinner']['youtube_url']}
नोट: {m['dinner']['prep_notes']}"""


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
HISTORY_FILE = "data/history.json"
MENU_FILE    = "data/menu.json"

def load_history() -> list:
    if not os.path.exists(HISTORY_FILE):
        return []
    with open(HISTORY_FILE, encoding="utf-8") as f:
        return json.load(f)

def save_files(menu: dict):
    os.makedirs("data", exist_ok=True)

    # Write today's menu for the PWA
    with open(MENU_FILE, "w", encoding="utf-8") as f:
        json.dump(menu, f, indent=2, ensure_ascii=False)

    # Append to history (keep last 30 days)
    history = load_history()
    history.append(menu)
    history = history[-30:]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

    print(f"Saved menu.json and history.json")


# ---------- MAIN ----------
def main():
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d (%A)")

    history = load_history()
    recent_dishes = [
        {
            "date": h["date"],
            "breakfast": h["breakfast"]["dish_english"],
            "lunch": h["lunch"]["dish_english"],
            "dinner": h["dinner"]["dish_english"],
        }
        for h in history[-3:]
    ]

    print(f"Generating menu for {tomorrow}...")
    menu = generate_menu(tomorrow, recent_dishes)

    flatmate_msg = format_whatsapp_message(menu)
    cook_msg     = format_cook_message(menu)

    print("\n=== FLATMATE MESSAGE ===\n")
    print(flatmate_msg)
    print("\n=== COOK MESSAGE ===\n")
    print(cook_msg)

    save_files(menu)

    # Send WhatsApp if credentials are present
    if WHATSAPP_TOKEN and FLATMATE_NUMBERS:
        for number in FLATMATE_NUMBERS:
            result = send_whatsapp(number, flatmate_msg)
            print(f"Sent to {number}: {result['status']}")
    else:
        print("WhatsApp credentials not set — skipping send.")

    # Save cook message as a file too
    cook_file = f"data/cook_{menu['date'][:10]}.txt"
    with open(cook_file, "w", encoding="utf-8") as f:
        f.write(cook_msg)
    print(f"Cook message saved to {cook_file}")


if __name__ == "__main__":
    main()
