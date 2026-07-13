import { jsPDF } from "jspdf";

const guideSections = [
  {
    title: "Clean Drinking Water",
    icon: "💧",
    priority: "CRITICAL",
    content: [
      "Never drink from stagnant or cloudy water sources — always seek flowing water.",
      "Boil water for at least 1 minute (3 minutes at altitudes above 6,500 ft).",
      "If boiling is not possible, use water purification tablets (iodine or chlorine dioxide).",
      "Solar disinfection: fill a clear plastic bottle and leave in direct sunlight for 6+ hours.",
      "Build a simple filter: layer cloth, sand, charcoal, and gravel in a container.",
      "Collect rainwater using tarps or broad leaves — it's generally safe to drink.",
      "Collect morning dew by tying clean cloth around your ankles and walking through tall grass, then wring into a container.",
      "Dig a solar still: dig a hole, place a container in the center, cover with plastic sheet weighted in the middle.",
      "Avoid drinking: saltwater, urine, blood, contaminated flood water, or water with dead animals nearby.",
      "Signs of contaminated water: unusual color, odor, foam, or algae blooms.",
    ],
  },
  {
    title: "Bug Bites & Stings",
    icon: "🦟",
    priority: "MODERATE",
    content: [
      "Remove stingers by scraping sideways with a credit card or fingernail — never use tweezers (squeezes more venom in).",
      "Wash the bite area thoroughly with soap and clean water.",
      "Apply a cold compress or ice pack wrapped in cloth for 10-20 minutes to reduce swelling.",
      "Apply hydrocortisone cream or a paste of baking soda and water to reduce itching.",
      "Take an antihistamine (diphenhydramine) for severe itching or allergic reactions.",
      "For tick bites: grasp the tick close to the skin with fine-tipped tweezers and pull straight up steadily.",
      "Watch for Lyme disease signs: a bullseye rash, fever, or joint pain within 3-30 days.",
      "Prevent infection: keep the bite clean and avoid scratching.",
      "Seek immediate help for signs of allergic reaction: difficulty breathing, swelling of face/throat, dizziness, or hives.",
      "Apply insect repellent containing DEET (20-30%) to exposed skin and clothing.",
      "For spider bites, see the spider bite section — some require different treatment.",
    ],
  },
  {
    title: "Snake Bites",
    icon: "🐍",
    priority: "HIGH",
    content: [
      "Call emergency services immediately — snake bite is a medical emergency.",
      "Move away from the snake to prevent a second bite. Do NOT try to catch or kill it.",
      "Keep the victim calm and still — movement spreads venom faster through the bloodstream.",
      "Keep the bitten limb immobilized and at or slightly below heart level.",
      "Remove rings, watches, and tight clothing near the bite — swelling will occur.",
      "Wash the bite gently with soap and water — do NOT scrub.",
      "Cover the bite with a clean, dry dressing.",
      "DO NOT apply a tourniquet — cutting off blood flow causes tissue death.",
      "DO NOT cut the wound or try to suck out the venom — this does not work and causes infection.",
      "DO NOT apply ice or cold packs — this does not neutralize venom.",
      "DO NOT give the victim alcohol or caffeine — these speed up venom absorption.",
      "Note the snake's color and shape if safely possible — do not risk a second bite to identify it.",
      "Mark the edge of swelling with a pen and note the time to track venom spread.",
      "Monitor breathing and consciousness — be ready to perform CPR if needed.",
    ],
  },
  {
    title: "Spider Bites",
    icon: "🕷️",
    priority: "HIGH",
    content: [
      "Wash the bite area with soap and water immediately.",
      "Apply a cold compress to reduce pain and swelling — 10 minutes on, 10 minutes off.",
      "Keep the bitten area elevated above the heart if possible.",
      "Take over-the-counter pain relievers (acetaminophen or ibuprofen).",
      "Apply antibiotic ointment to prevent secondary infection.",
      "For suspected black widow or brown recluse bites: seek emergency medical care immediately.",
      "Black widow signs: severe muscle cramps, abdominal rigidity, sweating, nausea, high blood pressure.",
      "Brown recluse signs: blistering ulcer that grows over days, flu-like symptoms, fever, chills.",
      "Capture the spider if safely possible for identification — do not risk another bite.",
      "DO NOT apply heat — this speeds venom spread.",
      "DO NOT cut or drain the wound.",
      "Watch for spreading redness, red streaks, or increasing pain — signs of infection.",
      "Antivenom may be needed for severe bites — get to a hospital as fast as possible.",
    ],
  },
  {
    title: "Broken Limbs & Fractures",
    icon: "🦴",
    priority: "HIGH",
    content: [
      "Do NOT try to realign a badly deformed limb — stabilize it in the position found.",
      "Immobilize the fracture with a splint: use sticks, rolled magazines, or trekking poles.",
      "Pad the splint with clothing or cloth before applying to prevent pressure sores.",
      "Secure the splint above and below the fracture site — not directly on it.",
      "Check for circulation: pinch a fingernail/toenail — it should return pink within 2 seconds.",
      "For open fractures (bone through skin): cover with sterile dressing, do NOT push bone back.",
      "Apply gentle pressure around (not on) open wounds to control bleeding.",
      "Keep the injured limb elevated to reduce swelling.",
      "Apply cold packs (wrapped in cloth) to reduce swelling — never directly on skin.",
      "Do not give the victim food or water in case surgery is needed.",
      "For a suspected spinal injury: do NOT move the person. Stabilize head and neck.",
      "Transport only if absolutely necessary — movement can worsen fractures.",
      "Signs of fracture: deformity, swelling, bruising, inability to bear weight, grating sound/feeling.",
      "Treat for shock: keep warm, elevate legs if no spinal/leg injury, reassure the victim.",
    ],
  },
  {
    title: "Dehydration",
    icon: "🏜️",
    priority: "CRITICAL",
    content: [
      "Recognize early signs: thirst, dry mouth, headache, dark yellow urine, dizziness.",
      "Severe signs: no urination, sunken eyes, rapid heartbeat, rapid breathing, confusion, fainting.",
      "Sip water slowly — gulping can cause vomiting and further fluid loss.",
      "Prepare oral rehydration solution: 1 liter clean water + 6 level teaspoons sugar + ½ teaspoon salt.",
      "If no sugar/salt available, dilute any available fluid and sip frequently.",
      "Rest in shade immediately — stop all physical activity.",
      "Remove excess clothing and cool the body with damp cloth.",
      "Drink cool (not ice cold) water — it absorbs faster.",
      "Avoid: alcohol, caffeine, and very sugary drinks — these worsen dehydration.",
      "Monitor urine color: pale yellow is good, dark amber means severe dehydration.",
      "In hot environments, drink ½ liter of water per hour of moderate activity.",
      "For severe dehydration with vomiting: seek medical help — IV fluids may be needed.",
      "Prevent dehydration: drink before you feel thirsty — thirst means you're already 1-2% dehydrated.",
    ],
  },
  {
    title: "Fever",
    icon: "🌡️",
    priority: "MODERATE",
    content: [
      "Rest in a cool, shaded area — avoid exertion.",
      "Drink plenty of fluids — water, broth, or oral rehydration solution.",
      "Remove excess clothing and blankets — do not bundle up.",
      "Apply cool, damp cloths to the forehead, wrists, and neck.",
      "Sponge with lukewarm (not cold) water — evaporation cools the body.",
      "Take antipyretics if available: acetaminophen or ibuprofen.",
      "Do NOT use ice baths or rubbing alcohol — causes shivering which raises core temperature.",
      "Monitor temperature if a thermometer is available.",
      "Seek help if: fever above 103°F (39.4°C), lasts more than 3 days, or is accompanied by stiff neck, severe headache, rash, or confusion.",
      "These additional symptoms may indicate serious conditions like meningitis or malaria.",
      "In wilderness settings, fever may indicate infection from a wound — inspect all injuries.",
      "Keep the person nourished with light, easily digestible foods.",
    ],
  },
  {
    title: "Fatigue & Exhaustion",
    icon: "😴",
    priority: "MODERATE",
    content: [
      "Stop and rest immediately — pushing through exhaustion leads to collapse.",
      "Find or create shelter from sun, wind, and rain.",
      "Drink water and consume high-energy foods: nuts, dried fruit, granola, chocolate.",
      "Elevate legs slightly to improve blood return to the heart.",
      "If in a cold environment, change out of sweaty clothes to prevent hypothermia.",
      "Take short naps (20-30 minutes) if in a safe location.",
      "Assess for underlying causes: dehydration, low blood sugar, altitude sickness, heat exhaustion.",
      "For heat exhaustion: move to shade, cool the body, drink fluids with electrolytes.",
      "For low blood sugar: eat fast-acting carbohydrates — candy, honey, dried fruit.",
      "For altitude sickness: descend immediately — do not go higher.",
      "Break tasks into small, manageable steps with frequent rest breaks.",
      "Set a slow, sustainable pace — the talking test: if you can't hold a conversation, slow down.",
      "If confusion, slurred speech, or loss of coordination occurs — this is a medical emergency.",
    ],
  },
  {
    title: "Fear, Panic & Anxiety",
    icon: "😨",
    priority: "HIGH",
    content: [
      "STOP: Stop, Think, Observe, Plan — the #1 wilderness survival rule.",
      "Recognize that fear is normal — it's your body's survival response. Name it to tame it.",
      "Breathe: 4-7-8 technique — inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times.",
      "Box breathing: inhale 4 seconds, hold 4, exhale 4, hold 4. Repeat.",
      "Sit down. A physical seat helps calm the nervous system.",
      "Focus on one immediate, small task: build a fire, find water, make shelter.",
      "Small accomplishments restore a sense of control and reduce panic.",
      "Talk out loud — verbalizing your plan engages the rational brain and calms the emotional brain.",
      "Hug a tree or hold a fixed object — grounding physically reduces anxiety.",
      "Do NOT make impulsive decisions — especially about moving or navigating.",
      "Conserve energy: avoid running or frantic movement — it wastes calories and increases injury risk.",
      "Use the rule of 3: you can survive 3 minutes without air, 3 hours without shelter in extreme conditions, 3 days without water, 3 weeks without food. Prioritize accordingly.",
      "If with others: assign tasks, communicate clearly, and reassure each other.",
      "Remember: rescue is often possible within 72 hours if you stay put and signal.",
    ],
  },
  {
    title: "Exposure to Elements",
    icon: "🌤️",
    priority: "CRITICAL",
    content: [
      "HEAT: Recognize heat stroke — hot dry skin, confusion, no sweating, body temp above 104°F.",
      "For heat stroke: cool immediately — immerse in water, spray with water, fan vigorously. This is a medical emergency.",
      "For heat exhaustion: cool, pale, clammy skin, heavy sweating, nausea, dizziness — rest in shade, drink fluids.",
      "COLD: Recognize hypothermia — shivering, confusion, slurred speech, drowsiness, cold skin.",
      "For hypothermia: move to warmth, remove wet clothes, wrap in dry layers, share body heat.",
      "Build a fire if possible — even a small one provides significant warmth.",
      "FROSTBITE: numbness, white/waxy skin, hard or rubbery texture to skin.",
      "For frostbite: warm the area gradually in warm (not hot) water 99-104°F. Do NOT rub.",
      "Do NOT rewarm frostbite if there's a chance it will refreeze — refreezing causes worse damage.",
      "SUN: Apply sunscreen SPF 30+, wear a hat, cover exposed skin.",
      "WIND: Wind chill dramatically increases heat loss — seek shelter, cover exposed skin.",
      "RAIN: Wet clothing loses 90% of its insulating value — change to dry clothes immediately.",
      "Build shelter: lean-to, debris hut, or tarp shelter — insulation from ground is critical.",
      "Layer clothing: base layer (wicking), mid layer (insulation), outer layer (wind/water protection).",
      "The ground conducts heat away from the body 240x faster than air — always insulate from below.",
    ],
  },
  {
    title: "Starvation & Nutrition",
    icon: "🍎",
    priority: "MODERATE",
    content: [
      "Remember: you can survive 3 weeks without food — prioritize water and shelter first.",
      "Do NOT eat if you have no water — digestion requires water and will worsen dehydration.",
      "Universal edibility test: rub a small piece on your skin, wait 15 min. If no reaction, hold on lip 3 min. If no burning, chew and hold in mouth 15 min. If no reaction, swallow and wait 8 hours. If no nausea, eat a small amount.",
      "Safe wild foods: most berries that are blue or black are edible. Avoid white, yellow, and red berries unless certain.",
      "Avoid: mushrooms unless 100% certain of identification — many are deadly.",
      "Safe protein: grasshoppers, crickets, grubs, and earthworms — remove legs/wings and cook.",
      "Cook all wild meat thoroughly to kill parasites.",
      "Edible common plants: dandelion (entire plant), clover, cattail, pine needles (tea), acorns (leach tannins).",
      "Avoid plants with: milky sap, thorns, fine hairs, bitter/almond taste, or three-leaved growth pattern.",
      "Fishing: if near water, fashion a hook from a pin or bone, use insects as bait.",
      "Trapping: simple snare loops from cordage can catch small game along animal trails.",
      "Ration your available food — eat small, frequent portions rather than one large meal.",
      "Conserve energy to reduce caloric needs — a person at rest needs ~1,500 calories/day vs 3,500+ when active.",
      "Never eat unknown berries or plants in quantity — even small amounts of toxic plants can be fatal.",
    ],
  },
  {
    title: "Wound Care & Infection Prevention",
    icon: "🩹",
    priority: "HIGH",
    content: [
      "Stop bleeding first: apply firm, direct pressure with a clean cloth for 10-15 minutes.",
      "For severe bleeding: apply pressure and elevate the wound above the heart.",
      "If bleeding won't stop: apply a tourniquet 2-3 inches above the wound (not on a joint). Note the time.",
      "Wash wounds with clean water — irrigate with a squeezed water bottle to flush debris.",
      "Do NOT use hydrogen peroxide or alcohol on wounds — they damage healthy tissue.",
      "Apply antibiotic ointment if available, then cover with sterile dressing.",
      "Change dressings daily or when wet/dirty.",
      "Watch for infection signs: increasing redness, warmth, swelling, pus, red streaks, fever.",
      "For deep puncture wounds: do not close the opening — let it drain to prevent infection.",
      "Tetanus risk: any deep or dirty wound warrants a tetanus booster if more than 5 years since last.",
      "For burns: cool with running water 10+ min, do not pop blisters, cover loosely with clean cloth.",
      "For impaled objects: do NOT remove — stabilize in place and seek medical help.",
    ],
  },
  {
    title: "Navigation & Rescue Signaling",
    icon: "🧭",
    priority: "HIGH",
    content: [
      "If lost: STOP. Do not keep moving — staying put increases rescue chances.",
      "Signal methods: fire (three fires in a triangle = international distress signal).",
      "Smoke signal: add green leaves/branches to a fire for thick white smoke.",
      "Signal mirror: flash toward aircraft or distant searchers — can be seen for miles.",
      "Ground signals: lay out rocks or branches in a large 'X' (need help) or 'SOS' in open areas.",
      "Whistle: three short blasts = international distress signal. Carry one always.",
      "Bright clothing: spread bright items in open areas for aerial visibility.",
      "If you must move: follow water downstream — it usually leads to civilization.",
      "Navigate by sun: sun rises in the east, sets in the west. At noon, it's roughly south (northern hemisphere).",
      "Navigate by stars: find the North Star (Polaris) using the Big Dipper's pointer stars — it marks true north.",
      "Leave markers: break branches, stack rocks, or blaze trees to show your path.",
      "Stay on trails when possible — off-trail travel increases risk of getting lost.",
    ],
  },
  {
    title: "Shelter Building",
    icon: "⛺",
    priority: "CRITICAL",
    content: [
      "Prioritize shelter before dark — it's far harder to build at night.",
      "Location: choose high, flat, dry ground. Avoid: dry riverbeds, avalanche zones, under dead branches (widowmakers).",
      "Insulate from the ground: a layer of leaves, pine needles, or branches at least 4 inches thick.",
      "Lean-to: prop a long branch against a low tree branch or rock, lay branches at an angle on both sides, cover with leaves/debris.",
      "Debris hut: build a frame with a ridgepole and rib sticks, pile debris 2+ feet thick, add more branches to hold it in place.",
      "Size: make the shelter just large enough for your body — smaller = warmer.",
      "Face the entrance away from prevailing wind (usually west/northwest in most of the US).",
      "Tarp shelter: if you have a tarp or emergency blanket, string it between trees as an A-frame or lean-to.",
      "Snow shelter: dig a snow cave or build an igloo — snow is an excellent insulator.",
      "Add a door: stuff clothing or a debris bundle in the entrance to retain heat.",
      "Build your fire in front of the shelter entrance, with a reflector wall of rocks/logs behind the fire.",
      "Natural shelters: caves, overhangs, hollow trees, and fallen tree root wads can provide instant shelter.",
    ],
  },
  {
    title: "Fire Building",
    icon: "🔥",
    priority: "CRITICAL",
    content: [
      "Gather three times more wood than you think you need before starting.",
      "Tinder: dry grass, birch bark, pine needles, cattail fluff, dry moss — catches a spark.",
      "Kindling: small twigs and sticks pencil-thin — builds the flame.",
      "Fuel: larger branches and logs — sustains the fire.",
      "Fire lay: teepee or log cabin arrangement — allows airflow.",
      "Lighting: use matches, lighter, ferro rod, or a magnifying lens focused on tinder.",
      "Friction fire: bow drill or hand drill — difficult but possible with practice.",
      "If wood is wet: split logs — the inside is usually dry. Look for dead branches still on trees (drier than ground wood).",
      "Birch bark burns even when wet — an excellent fire starter.",
      "Pine sap/resin is highly flammable — scrape from damaged bark.",
      "Build a fire reflector: stack rocks or green logs behind the fire to reflect heat toward you.",
      "Never build fire under overhanging branches or on peat/duff — can spread underground.",
      "Keep fire small and controlled — a small fire is easier to manage and safer.",
      "Extinguish completely: drown with water, stir ashes, drown again. It should be cold to the touch.",
    ],
  },
];

export function generateWildernessEmergencyPdf() {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed) => {
    if (y + needed > pageHeight - margin - 10) {
      doc.addPage();
      y = margin;
    }
  };

  // Cover Page
  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("Wilderness Medical", pageWidth / 2, 80, { align: "center" });
  doc.text("Emergency Guide", pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 220, 190);
  doc.text("Essential survival medical tips for the outdoors", pageWidth / 2, 120, { align: "center" });

  // Icons / decorative line
  doc.setDrawColor(100, 180, 120);
  doc.setLineWidth(1);
  doc.line(60, 135, 150, 135);

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  const coverItems = [
    "Clean Drinking Water    Bug Bites    Snake Bites",
    "Spider Bites    Broken Limbs    Dehydration",
    "Fever    Fatigue    Fear & Panic",
    "Exposure to Elements    Starvation & Nutrition",
    "Wound Care    Navigation & Rescue    Shelter    Fire",
  ];
  coverItems.forEach((line, i) => {
    doc.text(line, pageWidth / 2, 155 + i * 10, { align: "center" });
  });

  doc.setFontSize(9);
  doc.setTextColor(180, 200, 190);
  doc.text("Health Me Medical Center — Health Intelligence Platform", pageWidth / 2, 230, { align: "center" });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 238, { align: "center" });

  doc.setFontSize(8);
  doc.setTextColor(220, 180, 180);
  doc.text("DISCLAIMER: This guide is for informational purposes only and is not a substitute", pageWidth / 2, 265, { align: "center" });
  doc.text("for professional medical care. In any life-threatening emergency, call 911 immediately.", pageWidth / 2, 271, { align: "center" });

  // Table of Contents
  doc.addPage();
  y = margin;
  doc.setTextColor(20, 83, 45);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Table of Contents", margin, y + 5);
  y += 14;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  guideSections.forEach((section, i) => {
    ensureSpace(8);
    doc.setTextColor(60, 60, 60);
    doc.text(`${i + 1}.`, margin, y);
    doc.setTextColor(20, 83, 45);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, margin + 8, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 180);
    doc.text(`[${section.priority}]`, pageWidth - margin - 25, y);
    y += 8;
  });

  // Content pages
  guideSections.forEach((section) => {
    doc.addPage();
    y = margin;

    // Section header
    doc.setFillColor(20, 83, 45);
    doc.rect(0, 0, pageWidth, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`${section.icon}  ${section.title}`, margin, 13);

    // Priority badge
    const priorityColors = {
      CRITICAL: [220, 38, 38],
      HIGH: [234, 88, 12],
      MODERATE: [202, 138, 4],
    };
    const pc = priorityColors[section.priority] || [100, 100, 100];
    doc.setFillColor(pc[0], pc[1], pc[2]);
    doc.roundedRect(pageWidth - margin - 28, 4, 24, 9, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(section.priority, pageWidth - margin - 16, 10, { align: "center" });

    y = 30;

    // Content
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    section.content.forEach((tip, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${tip}`, contentWidth - 5);
      const needed = lines.length * 5.5 + 2;
      ensureSpace(needed);

      // Bullet marker
      doc.setFillColor(20, 83, 45);
      doc.circle(margin + 1.5, y - 1.5, 1, "F");

      doc.setTextColor(50, 50, 50);
      lines.forEach((line, j) => {
        if (j === 0) {
          doc.text(line, margin + 5, y);
        } else {
          y += 5.5;
          ensureSpace(5.5);
          doc.text(line, margin + 5, y);
        }
      });
      y += 5.5 + 2;
    });

    // Key takeaway box at bottom
    ensureSpace(20);
    y += 4;
    doc.setFillColor(240, 248, 240);
    doc.setDrawColor(20, 83, 45);
    doc.setLineWidth(0.3);
    const boxHeight = 14;
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, "FD");
    doc.setTextColor(20, 83, 45);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("KEY RULE:", margin + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const rule = section.content[0];
    const ruleLines = doc.splitTextToSize(rule, contentWidth - 30);
    ruleLines.forEach((line, j) => {
      doc.text(line, margin + 22, y + 6 + j * 4.5);
    });
  });

  // Final page — Emergency Contacts & Rule of 3
  doc.addPage();
  y = margin;

  doc.setFillColor(20, 83, 45);
  doc.rect(0, 0, pageWidth, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Quick Reference", margin, 13);

  y = 30;

  // Rule of 3
  doc.setFillColor(240, 248, 240);
  doc.roundedRect(margin, y, contentWidth, 45, 3, 3, "F");
  doc.setTextColor(20, 83, 45);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("The Rule of 3", margin + 5, y + 8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const ruleOf3 = [
    "3 MINUTES without air",
    "3 HOURS without shelter (extreme conditions)",
    "3 DAYS without water",
    "3 WEEKS without food",
  ];
  ruleOf3.forEach((rule, i) => {
    doc.text(`  •  ${rule}`, margin + 5, y + 18 + i * 7);
  });

  y += 55;

  // STOP rule
  doc.setFillColor(255, 247, 230);
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, "F");
  doc.setTextColor(180, 83, 9);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("STOP — The Survival Acronym", margin + 5, y + 8);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  const stopRules = [
    "S — Stop: Do not panic. Sit down.",
    "T — Think: Assess your situation and resources.",
    "O — Observe: Note your surroundings, hazards, and tools.",
    "P — Plan: Decide on your best course of action before moving.",
  ];
  stopRules.forEach((rule, i) => {
    doc.text(rule, margin + 5, y + 16 + i * 5.5);
  });

  y += 45;

  // Emergency numbers
  doc.setTextColor(20, 83, 45);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Emergency Numbers", margin, y + 5);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const numbers = [
    ["Emergency Services", "911"],
    ["Poison Control", "1-800-222-1222"],
    ["Suicide & Crisis Lifeline", "988"],
    ["Forest Service Info", "1-800-832-1355"],
  ];
  numbers.forEach(([name, num]) => {
    ensureSpace(8);
    doc.setTextColor(50, 50, 50);
    doc.text(name, margin, y);
    doc.setTextColor(220, 38, 38);
    doc.setFont("helvetica", "bold");
    doc.text(num, pageWidth - margin, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  y += 10;
  ensureSpace(20);
  doc.setFillColor(254, 226, 226);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F");
  doc.setTextColor(185, 28, 28);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("DISCLAIMER", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(120, 50, 50);
  const disclaimer = "This guide provides general wilderness emergency information for educational purposes. It is not a substitute for professional medical training or care. Always seek proper wilderness first aid training before venturing into remote areas. In any life-threatening situation, call 911 or your local emergency number immediately.";
  const discLines = doc.splitTextToSize(disclaimer, contentWidth - 8);
  discLines.forEach((line, i) => {
    doc.text(line, margin + 4, y + 11 + i * 4);
  });

  return doc.output("blob");
}