import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, Sparkles, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { motion } from "framer-motion";
import { useFamilyMember } from "@/context/FamilyMemberContext";
import { format } from "date-fns";

const DEFAULT_GOALS = { calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 };

export default function RecipeSuggester() {
  const { currentMemberId, currentMemberName } = useFamilyMember();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [recipes, setRecipes] = useState(null);
  const [preferences, setPreferences] = useState("");

  useEffect(() => {
    loadLogs();
  }, [currentMemberId]);

  const loadLogs = async () => {
    try {
      const today = format(new Date(), "yyyy-MM-dd");
      const filter = currentMemberId
        ? { family_member_id: currentMemberId, date: today }
        : { date: today };
      const data = await base44.entities.NutritionLog.filter(filter, "-created_date", 50);
      setLogs(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const totals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein_g: acc.protein_g + (l.protein_g || 0),
      carbs_g: acc.carbs_g + (l.carbs_g || 0),
      fat_g: acc.fat_g + (l.food_name?.toLowerCase().includes("avocado") ? 0 : (l.fat_g || 0)),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  // Fix fat calculation
  const realTotals = logs.reduce(
    (acc, l) => ({
      calories: acc.calories + (l.calories || 0),
      protein_g: acc.protein_g + (l.protein_g || 0),
      carbs_g: acc.carbs_g + (l.carbs_g || 0),
      fat_g: acc.fat_g + (l.fat_g || 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );

  const remaining = {
    calories: Math.max(0, DEFAULT_GOALS.calories - realTotals.calories),
    protein_g: Math.max(0, DEFAULT_GOALS.protein_g - realTotals.protein_g),
    carbs_g: Math.max(0, DEFAULT_GOALS.carbs_g - realTotals.carbs_g),
    fat_g: Math.max(0, DEFAULT_GOALS.fat_g - realTotals.fat_g),
  };

  const generateRecipes = async () => {
    setGenerating(true);
    try {
      const consumedItems = logs.map((l) => `${l.food_name} (${l.meal_type}, ${l.calories}cal, ${l.protein_g}p/${l.carbs_g}c/${l.fat_g}f)`).join("; ") || "Nothing logged yet today";

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a nutritionist AI. A user wants healthy meal recipe suggestions based on their daily nutrition progress.

User: ${currentMemberName}
Daily Goals: ${DEFAULT_GOALS.calories} calories, ${DEFAULT_GOALS.protein_g}g protein, ${DEFAULT_GOALS.carbs_g}g carbs, ${DEFAULT_GOALS.fat_g}g fat

Already consumed today: ${consumedItems}
Consumed totals: ${realTotals.calories}cal, ${realTotals.protein_g}g protein, ${realTotals.carbs_g}g carbs, ${realTotals.fat_g}g fat
Remaining to hit goals: ${remaining.calories}cal, ${remaining.protein_g}g protein, ${remaining.carbs_g}g carbs, ${remaining.fat_g}g fat

${preferences ? `User dietary preferences/restrictions: ${preferences}` : ""}

Suggest 3 healthy recipes that would help the user meet their remaining caloric and nutrient goals. For each recipe provide:
- Name
- Brief description
- Estimated calories per serving
- Protein, carbs, fat in grams
- Key ingredients (list)
- Simple cooking instructions (2-3 sentences)

Focus on meals that specifically help fill the nutrient gaps (e.g., if protein is low, suggest high-protein meals). Keep recipes practical and accessible.`,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            recipes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  calories: { type: "number" },
                  protein_g: { type: "number" },
                  carbs_g: { type: "number" },
                  fat_g: { type: "number" },
                  ingredients: { type: "array", items: { type: "string" } },
                  instructions: { type: "string" },
                },
              },
            },
          },
        },
      });
      setRecipes(response);
    } catch (e) { console.error(e); }
    setGenerating(false);
  };

  const macros = [
    { label: "Calories", icon: Flame, value: realTotals.calories, goal: DEFAULT_GOALS.calories, unit: "cal", color: "text-orange-600", bg: "bg-orange-100" },
    { label: "Protein", icon: Beef, value: realTotals.protein_g, goal: DEFAULT_GOALS.protein_g, unit: "g", color: "text-red-600", bg: "bg-red-100" },
    { label: "Carbs", icon: Wheat, value: realTotals.carbs_g, goal: DEFAULT_GOALS.carbs_g, unit: "g", color: "text-amber-600", bg: "bg-amber-100" },
    { label: "Fat", icon: Droplet, value: realTotals.fat_g, goal: DEFAULT_GOALS.fat_g, unit: "g", color: "text-yellow-600", bg: "bg-yellow-100" },
  ];

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">AI Recipe Suggestions</h3>
          <p className="text-xs text-muted-foreground">Personalized meals based on today's nutrition · {currentMemberName}</p>
        </div>
      </div>

      {/* Today's Progress */}
      {!loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {macros.map((m) => {
            const pct = Math.min(100, Math.round((m.value / m.goal) * 100));
            return (
              <div key={m.label} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <span className="text-[10px] font-medium text-muted-foreground">{m.label}</span>
                </div>
                <p className="text-sm font-bold">
                  {Math.round(m.value)}<span className="text-xs text-muted-foreground">/{m.goal}{m.unit}</span>
                </p>
                <div className="h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                  <div className={`h-full rounded-full ${m.bg.replace("100", "400")}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[9px] text-muted-foreground mt-0.5">{pct}% of daily goal</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Preferences */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Dietary preferences (e.g., vegetarian, gluten-free, no dairy)..."
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          className="w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <Button
        onClick={generateRecipes}
        disabled={generating || loading}
        className="w-full bg-gradient-to-r from-lime-500 to-green-600 hover:from-lime-600 hover:to-green-700"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        {generating ? "Finding recipes..." : "Suggest Recipes for My Goals"}
      </Button>

      {/* Results */}
      {recipes && (
        <div className="mt-5 space-y-4">
          {recipes.summary && (
            <div className="p-3 bg-lime-50 border border-lime-200 rounded-lg">
              <p className="text-xs text-lime-800">{recipes.summary}</p>
            </div>
          )}
          {recipes.recipes?.map((recipe, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold">{recipe.name}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{recipe.calories} cal</span>
                </div>
                {recipe.description && <p className="text-xs text-muted-foreground">{recipe.description}</p>}
                <div className="flex items-center gap-3 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">P: {recipe.protein_g}g</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">C: {recipe.carbs_g}g</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">F: {recipe.fat_g}g</span>
                </div>
                {recipe.ingredients?.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">INGREDIENTS</p>
                    <div className="flex flex-wrap gap-1">
                      {recipe.ingredients.map((ing, idx) => (
                        <span key={idx} className="text-[10px] px-1.5 py-0.5 bg-muted rounded">{ing}</span>
                      ))}
                    </div>
                  </div>
                )}
                {recipe.instructions && <p className="text-xs text-muted-foreground pt-1 border-t">{recipe.instructions}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
        </div>
      )}
    </Card>
  );
}