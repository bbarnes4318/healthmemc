import React, { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import {
  ArrowLeft, Search, Download, Loader2, AlertTriangle,
  Droplet, Bug, Worm, HeartCrack, Bone, Thermometer, BatteryLow,
  CloudSun, UtensilsCrossed, Bandage, Compass, Tent, Flame, Phone,
} from "lucide-react";
import { generateWildernessEmergencyPdf } from "@/lib/generateWildernessEmergencyPdf";

const guideData = [
  {
    id: "water",
    title: "Clean Drinking Water",
    icon: Droplet,
    color: "from-blue-500 to-cyan-600",
    priority: "CRITICAL",
    priorityColor: "bg-red-100 text-red-700",
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
    id: "bug-bites",
    title: "Bug Bites & Stings",
    icon: Bug,
    color: "from-amber-500 to-orange-600",
    priority: "MODERATE",
    priorityColor: "bg-amber-100 text-amber-700",
    content: [
      "Remove stingers by scraping sideways with a credit card or fingernail — never use tweezers.",
      "Wash the bite area thoroughly with soap and clean water.",
      "Apply a cold compress or ice pack wrapped in cloth for 10-20 minutes to reduce swelling.",
      "Apply hydrocortisone cream or a paste of baking soda and water to reduce itching.",
      "Take an antihistamine (diphenhydramine) for severe itching or allergic reactions.",
      "For tick bites: grasp the tick close to the skin with fine-tipped tweezers and pull straight up steadily.",
      "Watch for Lyme disease signs: a bullseye rash, fever, or joint pain within 3-30 days.",
      "Prevent infection: keep the bite clean and avoid scratching.",
      "Seek immediate help for signs of allergic reaction: difficulty breathing, swelling of face/throat, dizziness, or hives.",
      "Apply insect repellent containing DEET (20-30%) to exposed skin and clothing.",
    ],
  },
  {
    id: "snake-bites",
    title: "Snake Bites",
    icon: Worm,
    color: "from-green-600 to-emerald-700",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "spider-bites",
    title: "Spider Bites",
    icon: HeartCrack,
    color: "from-purple-600 to-indigo-700",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "broken-limbs",
    title: "Broken Limbs & Fractures",
    icon: Bone,
    color: "from-gray-500 to-slate-600",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "dehydration",
    title: "Dehydration",
    icon: Droplet,
    color: "from-yellow-500 to-amber-600",
    priority: "CRITICAL",
    priorityColor: "bg-red-100 text-red-700",
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
    id: "fever",
    title: "Fever",
    icon: Thermometer,
    color: "from-red-500 to-rose-600",
    priority: "MODERATE",
    priorityColor: "bg-amber-100 text-amber-700",
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
    id: "fatigue",
    title: "Fatigue & Exhaustion",
    icon: BatteryLow,
    color: "from-indigo-500 to-blue-600",
    priority: "MODERATE",
    priorityColor: "bg-amber-100 text-amber-700",
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
    id: "fear",
    title: "Fear, Panic & Anxiety",
    icon: AlertTriangle,
    color: "from-violet-500 to-purple-600",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "elements",
    title: "Exposure to Elements",
    icon: CloudSun,
    color: "from-sky-500 to-blue-600",
    priority: "CRITICAL",
    priorityColor: "bg-red-100 text-red-700",
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
    id: "starvation",
    title: "Starvation & Nutrition",
    icon: UtensilsCrossed,
    color: "from-orange-500 to-red-600",
    priority: "MODERATE",
    priorityColor: "bg-amber-100 text-amber-700",
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
    id: "wounds",
    title: "Wound Care & Infection",
    icon: Bandage,
    color: "from-rose-500 to-pink-600",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "navigation",
    title: "Navigation & Rescue",
    icon: Compass,
    color: "from-teal-500 to-cyan-600",
    priority: "HIGH",
    priorityColor: "bg-orange-100 text-orange-700",
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
    id: "shelter",
    title: "Shelter Building",
    icon: Tent,
    color: "from-emerald-500 to-green-600",
    priority: "CRITICAL",
    priorityColor: "bg-red-100 text-red-700",
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
    id: "fire",
    title: "Fire Building",
    icon: Flame,
    color: "from-orange-500 to-red-600",
    priority: "CRITICAL",
    priorityColor: "bg-red-100 text-red-700",
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

export default function WildernessEmergencyGuide() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return guideData;
    const q = search.toLowerCase();
    return guideData.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.content.some((c) => c.toLowerCase().includes(q))
    );
  }, [search]);

  const handleDownload = () => {
    setGenerating(true);
    try {
      const blob = generateWildernessEmergencyPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Wilderness-Medical-Emergency-Guide.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Guide downloaded successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to generate PDF", variant: "destructive" });
    }
    setGenerating(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link to="/">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-emerald-700 to-green-800 border-0 text-white">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Tent className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold">Wilderness Medical Emergency Guide</h1>
                <p className="text-sm text-emerald-100 mt-1">
                  Essential survival tips for clean water, bites, fractures, exposure, and more — {guideData.length} emergency topics covered.
                </p>
              </div>
            </div>
            <Button onClick={handleDownload} disabled={generating} className="bg-white text-emerald-700 hover:bg-emerald-50 shrink-0">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
          </div>
        </Card>

        {/* Rule of 3 Quick Reference */}
        <Card className="p-4 mb-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-emerald-700" />
            <h2 className="text-sm font-bold text-emerald-800">The Rule of 3 — Survival Priorities</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { time: "3 min", label: "Without Air", color: "bg-red-100 text-red-700" },
              { time: "3 hours", label: "Without Shelter", color: "bg-orange-100 text-orange-700" },
              { time: "3 days", label: "Without Water", color: "bg-amber-100 text-amber-700" },
              { time: "3 weeks", label: "Without Food", color: "bg-yellow-100 text-yellow-700" },
            ].map((item) => (
              <div key={item.label} className={`rounded-lg p-3 text-center ${item.color}`}>
                <p className="text-lg font-bold">{item.time}</p>
                <p className="text-xs font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emergency topics or symptoms..."
            className="pl-10"
          />
        </div>

        {/* Guide Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((section, i) => {
            const Icon = section.icon;
            const isExpanded = expandedId === section.id;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${isExpanded ? "ring-1 ring-sky-300" : ""}`}
                  onClick={() => setExpandedId(isExpanded ? null : section.id)}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${section.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold">{section.title}</h3>
                      <Badge variant="outline" className={`text-[9px] mt-1 ${section.priorityColor}`}>
                        {section.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className={isExpanded ? "" : "line-clamp-3"}>
                    <ul className="space-y-1.5">
                      {section.content.map((tip, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {!isExpanded && section.content.length > 3 && (
                    <p className="text-xs text-sky-600 mt-2 font-medium">+ {section.content.length - 3} more tips — click to expand</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <Card className="p-8 text-center">
            <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No topics found for "{search}"</p>
          </Card>
        )}

        {/* Emergency Numbers */}
        <Card className="p-5 mt-6">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-red-600" />
            <h2 className="text-sm font-bold">Emergency Numbers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              { name: "Emergency Services", number: "911" },
              { name: "Poison Control", number: "1-800-222-1222" },
              { name: "Suicide & Crisis Lifeline", number: "988" },
              { name: "Forest Service Info", number: "1-800-832-1355" },
            ].map((contact) => (
              <a key={contact.number} href={`tel:${contact.number}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-sm text-red-600 font-bold">{contact.number}</span>
              </a>
            ))}
          </div>
        </Card>

        <div className="flex items-start gap-2 p-4 bg-amber-50 rounded-xl border border-amber-200 mt-4">
          <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-800">
            This guide provides general wilderness emergency information for educational purposes only. It is not a substitute for professional medical care or wilderness first aid training. In any life-threatening situation, call 911 or your local emergency number immediately.
          </p>
        </div>
      </motion.div>
    </div>
  );
}