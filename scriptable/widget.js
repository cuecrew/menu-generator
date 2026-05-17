// Thali — Scriptable home screen widget
// Setup: paste this into a new Scriptable script, then add a Scriptable widget
// pointing to this script. Works in small, medium, and large widget sizes.

const MENU_URL = "https://cuecrew.github.io/menu-generator/data/menu.json";

async function fetchMenu() {
  try {
    const req = new Request(MENU_URL);
    req.timeoutInterval = 10;
    return await req.loadJSON();
  } catch (e) {
    return null;
  }
}

function mealColor(meal) {
  if (meal === "breakfast") return new Color("#F4B23C");
  if (meal === "lunch")     return new Color("#34C77A");
  return new Color("#FB923C");
}

async function createWidget() {
  const menu = await fetchMenu();
  const w = new ListWidget();
  w.backgroundColor = new Color("#0E0B09");
  w.setPadding(14, 14, 14, 14);

  if (!menu || menu.date === "Waiting for first generation...") {
    const t = w.addText("Thali");
    t.textColor = new Color("#F4B23C");
    t.font = Font.boldSystemFont(16);
    w.addSpacer(6);
    const s = w.addText("No menu yet");
    s.textColor = new Color("#6E665D");
    s.font = Font.systemFont(13);
    return w;
  }

  // Header
  const header = w.addStack();
  const title = header.addText("Thali");
  title.textColor = new Color("#F4B23C");
  title.font = Font.boldSystemFont(15);
  header.addSpacer();
  const dateStr = menu.date.split(" ")[0]; // just YYYY-MM-DD
  const dateText = header.addText(dateStr);
  dateText.textColor = new Color("#6E665D");
  dateText.font = Font.systemFont(11);

  w.addSpacer(10);

  const meals = [
    { key: "breakfast", label: "नाश्ता" },
    { key: "lunch",     label: "लंच" },
    { key: "dinner",    label: "डिनर" },
  ];

  for (const { key, label } of meals) {
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();

    // Colour dot
    const dot = row.addText("●");
    dot.textColor = mealColor(key);
    dot.font = Font.systemFont(9);
    row.addSpacer(6);

    // Label
    const lbl = row.addText(label + "  ");
    lbl.textColor = new Color("#A89E92");
    lbl.font = Font.systemFont(11);

    // Dish name
    const dish = row.addText(menu[key].dish_hindi);
    dish.textColor = new Color("#F6EFE6");
    dish.font = Font.boldSystemFont(12);
    dish.lineLimit = 1;

    w.addSpacer(6);
  }

  // Macros strip
  if (menu.vizz_daily_total_with_shake) {
    w.addSpacer(4);
    const mac = menu.vizz_daily_total_with_shake;
    const macRow = w.addStack();
    macRow.layoutHorizontally();
    const macText = macRow.addText(
      `${mac.cal} kcal · ${mac.protein}g P · ${mac.fat}g F · ${mac.carbs}g C`
    );
    macText.textColor = new Color("#6E665D");
    macText.font = Font.systemFont(10);
  }

  return w;
}

const widget = await createWidget();

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentSmall();
}

Script.complete();
