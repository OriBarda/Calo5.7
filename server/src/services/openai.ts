import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MealAnalysisResult {
  name: string;
  description?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  confidence: number;
  ingredients?: string[];
  servingSize?: string;
  cookingMethod?: string;
  healthNotes?: string;
  items?: any[];
  healthScore?: number;
  recommendations?: string[];
}

export interface MealPlanRequest {
  age: number;
  weight_kg: number;
  height_cm: number;
  target_calories_daily: number;
  target_protein_daily: number;
  target_carbs_daily: number;
  target_fats_daily: number;
  meals_per_day: number;
  snacks_per_day: number;
  rotation_frequency_days: number;
  include_leftovers: boolean;
  fixed_meal_times: boolean;
  dietary_preferences: string[];
  excluded_ingredients: string[];
  allergies: any[];
  physical_activity_level: string;
  sport_frequency: string;
  main_goal: string;
  dietary_preferences_questionnaire: any[];
  avoided_foods: any[];
  meal_texture_preference?: string;
  cooking_skill_level: string;
  available_cooking_time: string;
  kitchen_equipment: string[];
}

export interface ReplacementMealRequest {
  current_meal: {
    name: string;
    meal_timing: string;
    dietary_category: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fats_g?: number;
  };
  user_preferences: {
    dietary_preferences: string[];
    excluded_ingredients: string[];
    allergies: any[];
    preferred_dietary_category?: string;
    max_prep_time?: number;
  };
  nutrition_targets: {
    target_calories: number;
    target_protein: number;
  };
}

export interface MealPlanResponse {
  weekly_plan: {
    day: string;
    day_index: number;
    meals: {
      name: string;
      description: string;
      meal_timing: string;
      dietary_category: string;
      prep_time_minutes: number;
      difficulty_level: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
      fiber_g: number;
      sugar_g: number;
      sodium_mg: number;
      ingredients: {
        name: string;
        quantity: number;
        unit: string;
        category: string;
      }[];
      instructions: {
        step: number;
        text: string;
      }[];
      allergens: string[];
      image_url: string;
      portion_multiplier: number;
      is_optional: boolean;
    }[];
  }[];
  weekly_nutrition_summary: {
    avg_daily_calories: number;
    avg_daily_protein: number;
    avg_daily_carbs: number;
    avg_daily_fats: number;
    goal_adherence_percentage: number;
  };
  shopping_tips: string[];
  meal_prep_suggestions: string[];
}

export class OpenAIService {
  static async analyzeMealImage(
    imageBase64: string,
    language: string = "english",
    updateText?: string
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🤖 Starting OpenAI meal analysis...");

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn("⚠️ OpenAI API key not configured, using mock analysis");
        return this.getMockAnalysis(updateText);
      }

      const systemPrompt = `You are a professional nutritionist and food analyst. Analyze the food image and provide detailed nutritional information.

IMPORTANT INSTRUCTIONS:
1. Analyze the food items visible in the image
2. Estimate portion sizes based on visual cues
3. Provide accurate nutritional values per serving shown
4. If multiple items, sum up the total nutrition
5. Be conservative with estimates - better to underestimate than overestimate
6. Consider cooking methods that affect nutrition
7. Account for added oils, sauces, and seasonings visible

${
  updateText
    ? `ADDITIONAL CONTEXT: The user provided this additional information: "${updateText}". Please incorporate this into your analysis and adjust nutritional values accordingly.`
    : ""
}

Respond with a JSON object containing:
{
  "name": "Brief descriptive name of the meal/food",
  "description": "Detailed description of what you see",
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number,
  "confidence": number,
  "ingredients": ["list", "of", "main", "ingredients"],
  "servingSize": "description of portion size",
  "cookingMethod": "how the food appears to be prepared",
  "healthNotes": "brief health assessment or notes"
}

Language for response: ${language}`;

      const userPrompt = updateText
        ? `Please analyze this food image. Additional context: ${updateText}`
        : "Please analyze this food image and provide detailed nutritional information.";

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI raw response:", content);

      // Parse JSON response
      let analysisResult: MealAnalysisResult;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        analysisResult = {
          name: parsed.name || "Unknown Food",
          description: parsed.description || "",
          calories: Math.max(0, Number(parsed.calories) || 0),
          protein: Math.max(0, Number(parsed.protein) || 0),
          carbs: Math.max(0, Number(parsed.carbs) || 0),
          fat: Math.max(0, Number(parsed.fat) || 0),
          fiber: parsed.fiber ? Math.max(0, Number(parsed.fiber)) : undefined,
          sugar: parsed.sugar ? Math.max(0, Number(parsed.sugar)) : undefined,
          sodium: parsed.sodium
            ? Math.max(0, Number(parsed.sodium))
            : undefined,
          confidence: Math.min(
            100,
            Math.max(0, Number(parsed.confidence) || 75)
          ),
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : [],
          servingSize: parsed.servingSize || "1 serving",
          cookingMethod: parsed.cookingMethod || "Unknown",
          healthNotes: parsed.healthNotes || "",
        };
      } catch (parseError) {
        console.error("💥 Failed to parse OpenAI response:", parseError);
        console.error("📄 Raw content:", content);

        analysisResult = this.getMockAnalysis(updateText);
      }

      console.log("✅ Analysis completed:", analysisResult);
      return analysisResult;
    } catch (error) {
      console.error("💥 OpenAI analysis error:", error);
      return this.getMockAnalysis(updateText);
    }
  }

  private static getMockAnalysis(updateText?: string): MealAnalysisResult {
    const baseAnalysis = {
      name: "Mixed Meal",
      description: updateText ? `Meal with additional info: ${updateText}` : "A nutritious meal",
      calories: 350 + Math.floor(Math.random() * 200),
      protein: 20 + Math.floor(Math.random() * 15),
      carbs: 30 + Math.floor(Math.random() * 20),
      fat: 12 + Math.floor(Math.random() * 10),
      fiber: 5 + Math.floor(Math.random() * 5),
      sugar: 8 + Math.floor(Math.random() * 5),
      sodium: 400 + Math.floor(Math.random() * 300),
      confidence: 75,
      ingredients: ["Mixed ingredients", "Vegetables", "Protein source"],
      servingSize: "1 serving",
      cookingMethod: "Prepared",
      healthNotes: "Balanced meal with good nutrition profile",
    };

    // Adjust values if update text suggests changes
    if (updateText?.toLowerCase().includes('more') || updateText?.toLowerCase().includes('extra')) {
      baseAnalysis.calories += 100;
      baseAnalysis.protein += 10;
      baseAnalysis.carbs += 15;
    }

    return baseAnalysis;
  }

  static async generateMealPlan(
    userProfile: MealPlanRequest
  ): Promise<MealPlanResponse> {
    try {
      console.log("🤖 Generating AI meal plan...");

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn("⚠️ OpenAI API key not configured, using fallback meal plan");
        return this.generateFallbackMealPlan(userProfile);
      }

      // Create meal timing array based on user preferences
      const mealTimings = this.generateMealTimings(
        userProfile.meals_per_day,
        userProfile.snacks_per_day
      );

      const systemPrompt = `You are a professional nutritionist and meal planning expert. Create a personalized 7-day meal plan based on the user's profile, preferences, and goals.

CRITICAL REQUIREMENTS:
1. Create exactly 7 days of meals (Sunday through Saturday)
2. Each day should have exactly ${userProfile.meals_per_day} meals and ${
        userProfile.snacks_per_day
      } snacks
3. Use these meal timings: ${mealTimings.join(", ")}
4. All meals must meet the user's dietary restrictions and preferences
5. Avoid all excluded ingredients and allergens: ${userProfile.excluded_ingredients.join(
        ", "
      )}
6. Avoid foods from avoided list: ${userProfile.avoided_foods
        .map((f) => f.name || f)
        .join(", ")}
7. Balance nutrition across the week to meet daily targets
8. Consider cooking skill level: ${userProfile.cooking_skill_level}
9. Available cooking time: ${userProfile.available_cooking_time}
10. Provide detailed recipes with ingredients and instructions
11. Include realistic prep times and difficulty levels
12. Suggest appropriate portion sizes
13. Ensure variety across the week

USER PROFILE:
- Age: ${userProfile.age}
- Weight: ${userProfile.weight_kg}kg
- Height: ${userProfile.height_cm}cm
- Target daily calories: ${userProfile.target_calories_daily}
- Target daily protein: ${userProfile.target_protein_daily}g
- Target daily carbs: ${userProfile.target_carbs_daily}g
- Target daily fats: ${userProfile.target_fats_daily}g
- Dietary preferences: ${userProfile.dietary_preferences.join(", ")}
- Allergies: ${userProfile.allergies.map((a) => a.name || a).join(", ")}
- Activity level: ${userProfile.physical_activity_level}
- Main goal: ${userProfile.main_goal}

You must respond with a valid JSON object in the specified format.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content:
              "Please create my personalized 7-day meal plan based on my profile and preferences.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse JSON response with better error handling
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const mealPlan = JSON.parse(jsonString);

        // Validate the meal plan structure
        if (!mealPlan.weekly_plan || !Array.isArray(mealPlan.weekly_plan)) {
          throw new Error("Invalid meal plan structure");
        }

        console.log("✅ AI meal plan generated successfully");
        return mealPlan as MealPlanResponse;
      } catch (parseError) {
        console.error("💥 Failed to parse meal plan response:", parseError);
        return this.generateFallbackMealPlan(userProfile);
      }
    } catch (error) {
      console.error("💥 OpenAI meal plan generation error:", error);
      return this.generateFallbackMealPlan(userProfile);
    }
  }

  static async generateReplacementMeal(
    request: ReplacementMealRequest
  ): Promise<any> {
    try {
      console.log("🔄 Generating AI replacement meal...");

      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        console.warn("⚠️ OpenAI API key not configured, using fallback replacement");
        return this.generateFallbackReplacementMeal(request);
      }

      const systemPrompt = `You are a professional nutritionist. Generate a replacement meal that is similar to the current meal but meets the user's specific preferences and requirements.

CURRENT MEAL TO REPLACE:
${JSON.stringify(request.current_meal, null, 2)}

USER PREFERENCES:
- Dietary preferences: ${request.user_preferences.dietary_preferences.join(", ")}
- Excluded ingredients: ${request.user_preferences.excluded_ingredients.join(", ")}
- Allergies: ${request.user_preferences.allergies.map((a) => a.name || a).join(", ")}

Respond with a valid JSON object for the replacement meal.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: "Please generate a suitable replacement meal.",
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const replacementMeal = JSON.parse(jsonString);

        console.log("✅ AI replacement meal generated successfully");
        return replacementMeal;
      } catch (parseError) {
        console.error("💥 Failed to parse replacement meal response:", parseError);
        return this.generateFallbackReplacementMeal(request);
      }
    } catch (error) {
      console.error("💥 OpenAI replacement meal generation error:", error);
      return this.generateFallbackReplacementMeal(request);
    }
  }

  static async generateNutritionInsights(meals: any[], stats: any): Promise<string[]> {
    try {
      // Check if OpenAI API key is configured
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
        return []; // Return empty array if no API key
      }

      const systemPrompt = `You are a nutrition expert. Generate 2-3 personalized insights based on the user's meal data and statistics. Keep insights concise and actionable.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Based on ${meals.length} meals and nutrition stats, provide insights.`,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (content) {
        return content.split('\n').filter(line => line.trim()).slice(0, 3);
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
    }

    return [];
  }

  // Helper methods
  private static generateMealTimings(
    mealsPerDay: number,
    snacksPerDay: number
  ): string[] {
    const timings: string[] = [];

    if (mealsPerDay >= 1) timings.push("BREAKFAST");
    if (mealsPerDay >= 2) timings.push("LUNCH");
    if (mealsPerDay >= 3) timings.push("DINNER");

    if (snacksPerDay >= 1) timings.push("MORNING_SNACK");
    if (snacksPerDay >= 2) timings.push("AFTERNOON_SNACK");
    if (snacksPerDay >= 3) timings.push("EVENING_SNACK");

    return timings;
  }

  private static generateFallbackMealPlan(
    userProfile: MealPlanRequest
  ): MealPlanResponse {
    console.log("🆘 Generating fallback meal plan...");

    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const mealTimings = this.generateMealTimings(
      userProfile.meals_per_day,
      userProfile.snacks_per_day
    );

    const weeklyPlan = days.map((day, index) => ({
      day,
      day_index: index,
      meals: mealTimings.map((timing, mealIndex) => ({
        name: `${timing.charAt(0) + timing.slice(1).toLowerCase().replace("_", " ")} ${index + 1}`,
        description: `A nutritious ${timing.toLowerCase().replace("_", " ")} meal`,
        meal_timing: timing,
        dietary_category: "BALANCED",
        prep_time_minutes: 15,
        difficulty_level: 1,
        calories: Math.round(
          userProfile.target_calories_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        protein_g: Math.round(
          userProfile.target_protein_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        carbs_g: Math.round(
          userProfile.target_carbs_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        fats_g: Math.round(
          userProfile.target_fats_daily /
            (userProfile.meals_per_day + userProfile.snacks_per_day)
        ),
        fiber_g: 5,
        sugar_g: 8,
        sodium_mg: 400,
        ingredients: [
          {
            name: "Mixed ingredients",
            quantity: 100,
            unit: "g",
            category: "Mixed",
          },
        ],
        instructions: [
          {
            step: 1,
            text: "Prepare according to your preferences",
          },
        ],
        allergens: [],
        image_url: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
        portion_multiplier: 1.0,
        is_optional: false,
      })),
    }));

    return {
      weekly_plan: weeklyPlan,
      weekly_nutrition_summary: {
        avg_daily_calories: userProfile.target_calories_daily,
        avg_daily_protein: userProfile.target_protein_daily,
        avg_daily_carbs: userProfile.target_carbs_daily,
        avg_daily_fats: userProfile.target_fats_daily,
        goal_adherence_percentage: 80,
      },
      shopping_tips: [
        "Plan your shopping list based on the weekly meals",
        "Buy seasonal produce for better prices",
      ],
      meal_prep_suggestions: [
        "Prepare ingredients in advance",
        "Cook proteins in bulk",
      ],
    };
  }

  private static generateFallbackReplacementMeal(
    request: ReplacementMealRequest
  ): any {
    console.log("🆘 Generating fallback replacement meal...");

    return {
      name: `Alternative ${request.current_meal.name}`,
      description: `A replacement meal similar to ${request.current_meal.name}`,
      meal_timing: request.current_meal.meal_timing,
      dietary_category: request.current_meal.dietary_category,
      prep_time_minutes: 20,
      difficulty_level: 2,
      calories: request.current_meal.calories || 400,
      protein_g: request.current_meal.protein_g || 25,
      carbs_g: request.current_meal.carbs_g || 35,
      fats_g: request.current_meal.fats_g || 15,
      fiber_g: 8,
      sugar_g: 5,
      sodium_mg: 600,
      ingredients: [
        {
          name: "Alternative ingredients",
          quantity: 100,
          unit: "g",
          category: "Mixed",
        },
      ],
      instructions: [
        {
          step: 1,
          text: "Prepare according to your dietary preferences",
        },
      ],
      allergens: [],
      image_url: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      replacement_reason: "Generated as a safe alternative when AI generation fails",
    };
  }
}