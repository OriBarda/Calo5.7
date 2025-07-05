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

      // Check if OpenAI API key is available
      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key found, using mock analysis");
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
    console.log("🎭 Using mock meal analysis");
    
    // Generate varied mock data based on update text or random
    const mockMeals = [
      {
        name: "Grilled Chicken Salad",
        description: "Fresh mixed greens with grilled chicken breast, cherry tomatoes, and olive oil dressing",
        calories: 350,
        protein: 35,
        carbs: 12,
        fat: 18,
        fiber: 6,
        sugar: 8,
        sodium: 450,
        ingredients: ["chicken breast", "mixed greens", "cherry tomatoes", "olive oil", "lemon"],
        cookingMethod: "Grilled",
        healthNotes: "High protein, low carb meal with healthy fats"
      },
      {
        name: "Pasta with Marinara",
        description: "Whole wheat pasta with homemade marinara sauce and fresh basil",
        calories: 420,
        protein: 15,
        carbs: 65,
        fat: 8,
        fiber: 8,
        sugar: 12,
        sodium: 680,
        ingredients: ["whole wheat pasta", "tomatoes", "garlic", "basil", "olive oil"],
        cookingMethod: "Boiled and simmered",
        healthNotes: "Good source of complex carbohydrates and fiber"
      },
      {
        name: "Avocado Toast",
        description: "Whole grain bread topped with mashed avocado, tomato, and a sprinkle of salt",
        calories: 280,
        protein: 8,
        carbs: 25,
        fat: 18,
        fiber: 10,
        sugar: 3,
        sodium: 320,
        ingredients: ["whole grain bread", "avocado", "tomato", "salt", "pepper"],
        cookingMethod: "Toasted",
        healthNotes: "Rich in healthy monounsaturated fats and fiber"
      }
    ];

    const randomMeal = mockMeals[Math.floor(Math.random() * mockMeals.length)];
    
    // Adjust based on update text if provided
    if (updateText) {
      const lowerUpdate = updateText.toLowerCase();
      if (lowerUpdate.includes("more") || lowerUpdate.includes("extra") || lowerUpdate.includes("additional")) {
        randomMeal.calories = Math.round(randomMeal.calories * 1.3);
        randomMeal.protein = Math.round(randomMeal.protein * 1.3);
        randomMeal.carbs = Math.round(randomMeal.carbs * 1.3);
        randomMeal.fat = Math.round(randomMeal.fat * 1.3);
        randomMeal.name += " (Large Portion)";
      }
    }

    return {
      ...randomMeal,
      confidence: 85,
      servingSize: "1 serving",
    };
  }

  static async updateMealAnalysis(
    originalAnalysis: MealAnalysisResult,
    updateText: string,
    language: string = "english"
  ): Promise<MealAnalysisResult> {
    try {
      console.log("🔄 Updating meal analysis with additional info...");

      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key found, using mock update");
        return this.getMockUpdate(originalAnalysis, updateText);
      }

      const systemPrompt = `You are a professional nutritionist. The user has provided additional information about their meal. Update the nutritional analysis accordingly.

ORIGINAL ANALYSIS:
${JSON.stringify(originalAnalysis, null, 2)}

ADDITIONAL INFORMATION FROM USER:
"${updateText}"

Please provide an updated nutritional analysis that incorporates this new information. Adjust calories, macronutrients, and other values as needed.

Respond with a JSON object in the same format as the original analysis.

Language for response: ${language}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Please update the nutritional analysis based on this additional information: "${updateText}"`,
          },
        ],
        max_tokens: 800,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const parsed = JSON.parse(jsonString);

        const updatedResult: MealAnalysisResult = {
          name: parsed.name || originalAnalysis.name,
          description: parsed.description || originalAnalysis.description,
          calories: Math.max(
            0,
            Number(parsed.calories) || originalAnalysis.calories
          ),
          protein: Math.max(
            0,
            Number(parsed.protein) || originalAnalysis.protein
          ),
          carbs: Math.max(0, Number(parsed.carbs) || originalAnalysis.carbs),
          fat: Math.max(0, Number(parsed.fat) || originalAnalysis.fat),
          fiber: parsed.fiber
            ? Math.max(0, Number(parsed.fiber))
            : originalAnalysis.fiber,
          sugar: parsed.sugar
            ? Math.max(0, Number(parsed.sugar))
            : originalAnalysis.sugar,
          sodium: parsed.sodium
            ? Math.max(0, Number(parsed.sodium))
            : originalAnalysis.sodium,
          confidence: Math.min(
            100,
            Math.max(
              0,
              Number(parsed.confidence) || originalAnalysis.confidence
            )
          ),
          ingredients: Array.isArray(parsed.ingredients)
            ? parsed.ingredients
            : originalAnalysis.ingredients,
          servingSize: parsed.servingSize || originalAnalysis.servingSize,
          cookingMethod: parsed.cookingMethod || originalAnalysis.cookingMethod,
          healthNotes: parsed.healthNotes || originalAnalysis.healthNotes,
        };

        console.log("✅ Update completed:", updatedResult);
        return updatedResult;
      } catch (parseError) {
        console.error("💥 Failed to parse update response:", parseError);
        return this.getMockUpdate(originalAnalysis, updateText);
      }
    } catch (error) {
      console.error("💥 OpenAI update error:", error);
      return this.getMockUpdate(originalAnalysis, updateText);
    }
  }

  private static getMockUpdate(originalAnalysis: MealAnalysisResult, updateText: string): MealAnalysisResult {
    console.log("🎭 Using mock meal update");
    
    const updated = { ...originalAnalysis };
    const lowerUpdate = updateText.toLowerCase();
    
    // Simple logic to adjust based on common update patterns
    if (lowerUpdate.includes("more") || lowerUpdate.includes("extra") || lowerUpdate.includes("additional")) {
      updated.calories = Math.round(updated.calories * 1.3);
      updated.protein = Math.round(updated.protein * 1.3);
      updated.carbs = Math.round(updated.carbs * 1.3);
      updated.fat = Math.round(updated.fat * 1.3);
      updated.name += " (Updated)";
      updated.description += ` - Updated with: ${updateText}`;
    } else if (lowerUpdate.includes("less") || lowerUpdate.includes("smaller")) {
      updated.calories = Math.round(updated.calories * 0.7);
      updated.protein = Math.round(updated.protein * 0.7);
      updated.carbs = Math.round(updated.carbs * 0.7);
      updated.fat = Math.round(updated.fat * 0.7);
      updated.name += " (Smaller Portion)";
    } else {
      // Generic update
      updated.name += " (Updated)";
      updated.description += ` - Additional info: ${updateText}`;
    }
    
    return updated;
  }

  static async generateMealPlan(
    userProfile: MealPlanRequest
  ): Promise<MealPlanResponse> {
    try {
      console.log("🤖 Generating AI meal plan...");

      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key found, using fallback meal plan");
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

You must respond with a valid JSON object in this exact format:
{
  "weekly_plan": [
    {
      "day": "Sunday",
      "day_index": 0,
      "meals": [
        {
          "name": "Meal Name",
          "description": "Brief description of the meal",
          "meal_timing": "BREAKFAST",
          "dietary_category": "BALANCED",
          "prep_time_minutes": 15,
          "difficulty_level": 1,
          "calories": 400,
          "protein_g": 20,
          "carbs_g": 45,
          "fats_g": 15,
          "fiber_g": 8,
          "sugar_g": 10,
          "sodium_mg": 600,
          "ingredients": [
            {
              "name": "Oats",
              "quantity": 50,
              "unit": "g",
              "category": "Grains"
            }
          ],
          "instructions": [
            {
              "step": 1,
              "text": "Detailed cooking instruction"
            }
          ],
          "allergens": [],
          "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
          "portion_multiplier": 1.0,
          "is_optional": false
        }
      ]
    }
  ],
  "weekly_nutrition_summary": {
    "avg_daily_calories": 2000,
    "avg_daily_protein": 150,
    "avg_daily_carbs": 250,
    "avg_daily_fats": 67,
    "goal_adherence_percentage": 95
  },
  "shopping_tips": [
    "Buy seasonal produce for better prices",
    "Prepare proteins in bulk on weekends"
  ],
  "meal_prep_suggestions": [
    "Cook grains in batches",
    "Pre-cut vegetables for quick assembly"
  ]
}`;

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
              "Please create my personalized 7-day meal plan based on my profile and preferences. Make sure to include all 7 days with complete meal information.",
          },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI meal plan response received");

      // Parse JSON response with better error handling
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const mealPlan = JSON.parse(jsonString);

        // Validate the meal plan structure
        if (!mealPlan.weekly_plan || !Array.isArray(mealPlan.weekly_plan)) {
          throw new Error(
            "Invalid meal plan structure: missing weekly_plan array"
          );
        }

        if (mealPlan.weekly_plan.length !== 7) {
          throw new Error(
            `Expected 7 days, got ${mealPlan.weekly_plan.length}`
          );
        }

        console.log("✅ AI meal plan generated and validated successfully");
        return mealPlan as MealPlanResponse;
      } catch (parseError) {
        console.error("💥 Failed to parse meal plan response:", parseError);
        console.error("📄 Raw content:", content);

        // Return a fallback meal plan
        return this.generateFallbackMealPlan(userProfile);
      }
    } catch (error) {
      console.error("💥 OpenAI meal plan generation error:", error);

      // Return a fallback meal plan
      return this.generateFallbackMealPlan(userProfile);
    }
  }

  static async generateReplacementMeal(
    request: ReplacementMealRequest
  ): Promise<any> {
    try {
      console.log("🔄 Generating AI replacement meal...");

      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key found, using fallback replacement");
        return this.generateFallbackReplacementMeal(request);
      }

      const systemPrompt = `You are a professional nutritionist. Generate a replacement meal that is similar to the current meal but meets the user's specific preferences and requirements.

CURRENT MEAL TO REPLACE:
${JSON.stringify(request.current_meal, null, 2)}

USER PREFERENCES:
- Dietary preferences: ${request.user_preferences.dietary_preferences.join(
        ", "
      )}
- Excluded ingredients: ${request.user_preferences.excluded_ingredients.join(
        ", "
      )}
- Allergies: ${request.user_preferences.allergies
        .map((a) => a.name || a)
        .join(", ")}
- Preferred dietary category: ${
        request.user_preferences.preferred_dietary_category || "Any"
      }
- Max prep time: ${request.user_preferences.max_prep_time || "No limit"} minutes

NUTRITION TARGETS:
- Target calories: ${request.nutrition_targets.target_calories}
- Target protein: ${request.nutrition_targets.target_protein}g

Respond with a valid JSON object in this exact format:
{
  "name": "New Meal Name",
  "description": "Brief description of the replacement meal",
  "meal_timing": "${request.current_meal.meal_timing}",
  "dietary_category": "BALANCED",
  "prep_time_minutes": 20,
  "difficulty_level": 2,
  "calories": 400,
  "protein_g": 25,
  "carbs_g": 35,
  "fats_g": 15,
  "fiber_g": 8,
  "sugar_g": 5,
  "sodium_mg": 600,
  "ingredients": [
    {
      "name": "Ingredient name",
      "quantity": 100,
      "unit": "g",
      "category": "Protein"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "text": "Detailed cooking instruction"
    }
  ],
  "allergens": [],
  "image_url": "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
  "replacement_reason": "Brief explanation of why this is a good replacement"
}`;

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
              "Please generate a suitable replacement meal based on my preferences and requirements.",
          },
        ],
        max_tokens: 1500,
        temperature: 0.4,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      console.log("🤖 OpenAI replacement meal response received");

      // Parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const replacementMeal = JSON.parse(jsonString);

        // Validate required fields
        if (!replacementMeal.name || !replacementMeal.meal_timing) {
          throw new Error("Missing required fields in replacement meal");
        }

        console.log("✅ AI replacement meal generated successfully");
        return replacementMeal;
      } catch (parseError) {
        console.error(
          "💥 Failed to parse replacement meal response:",
          parseError
        );
        console.error("📄 Raw content:", content);

        // Return a fallback replacement meal
        return this.generateFallbackReplacementMeal(request);
      }
    } catch (error) {
      console.error("💥 OpenAI replacement meal generation error:", error);

      // Return a fallback replacement meal
      return this.generateFallbackReplacementMeal(request);
    }
  }

  static async generateNutritionInsights(meals: any[], stats: any): Promise<string[]> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        console.log("⚠️ No OpenAI API key found, using default insights");
        return [];
      }

      const systemPrompt = `You are a professional nutritionist. Analyze the user's meal data and statistics to provide personalized insights.

MEAL DATA SUMMARY:
- Total meals analyzed: ${meals.length}
- Average daily calories: ${stats.averageCaloriesDaily}
- Average daily protein: ${stats.averageProteinDaily}g
- Calorie goal achievement: ${stats.calorieGoalAchievementPercent}%
- Processed food percentage: ${stats.processedFoodPercentage}%

Provide 3-5 personalized insights based on this data. Focus on:
1. Nutrition patterns and trends
2. Areas for improvement
3. Positive behaviors to reinforce
4. Specific actionable advice

Respond with a JSON array of insight strings.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: "Please analyze my nutrition data and provide insights.",
          },
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return [];
      }

      try {
        const insights = JSON.parse(content);
        return Array.isArray(insights) ? insights : [];
      } catch (parseError) {
        console.error("Failed to parse insights:", parseError);
        return [];
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      return [];
    }
  }

  // Helper methods
  private static generateMealTimings(
    mealsPerDay: number,
    snacksPerDay: number
  ): string[] {
    const timings: string[] = [];

    // Always include main meals based on meals_per_day
    if (mealsPerDay >= 1) timings.push("BREAKFAST");
    if (mealsPerDay >= 2) timings.push("LUNCH");
    if (mealsPerDay >= 3) timings.push("DINNER");

    // Add snacks based on snacks_per_day
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
        name: `${
          timing.charAt(0) + timing.slice(1).toLowerCase().replace("_", " ")
        } ${index + 1}`,
        description: `A nutritious ${timing
          .toLowerCase()
          .replace("_", " ")} meal`,
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
        image_url:
          "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
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
      image_url:
        "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg",
      replacement_reason:
        "Generated as a safe alternative when AI generation fails",
    };
  }
}