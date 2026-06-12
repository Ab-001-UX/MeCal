# Skill: Gemini App Integration

## Purpose
This skill guide details how to integrate the Google Gemini API into MeCal for food recognition and meal recommendations. It ensures compliance with free tier limits and project-specific localization requirements.

## Core Rules
- **Model**: `gemini-1.5-flash` only. Do not switch models.
- **Free Tier Limits**: 1,500 requests/day, 1M tokens/day, 15 RPM.
- **Location**: All calls must go through `server/services/gemini.service.js`.
- **Constraint**: Never call Gemini directly from the client.
- **Constraint**: Always cache responses where possible (especially meal recommendations) to protect free tier quota.
- **Error Handling**: Handle rate limit errors gracefully. Show a friendly retry message; never expose raw API errors to users.

## Implementation Flow

### 1. Service Setup (`server/services/gemini.service.js`)
- Initialize the Gemini API client using the API key stored in server environment variables.
- Create a central function to handle calls to `gemini-1.5-flash`.

### 2. Food Scanning Analysis
- **Trigger**: Called by the scan controller after a user uploads an image.
- **Task**: Analyze the image and return structured data.
- **Prompting Strategy**: Instruct Gemini to return a JSON string that can be parsed into the required schema.
- **Expected Schema**:
  ```json
  {
    "foodName": "string",
    "calorieEstimate": "number or range",
    "confidenceLevel": "High" | "Medium" | "Low",
    "nutritionalBreakdown": {
      "carbs": "string",
      "protein": "string",
      "fat": "string"
    },
    "servingEstimation": "string"
  }
  ```
- **Localization**: Always include the user's country in the prompt to improve local food recognition (e.g., distinguishing between Jollof rice and fried rice).

### 3. Meal Recommendations
- **Trigger**: Called when a user requests meal suggestions or during onboarding summary generation.
- **Inputs**: Calorie goal, country, tribe (if set), lifestyle, budget, food availability, time of day.
- **Prompting Strategy**: Ask Gemini to suggest realistic, accessible meals based on the profile.
- **Cultural Grounding**: Instruct the model to avoid unrealistic imported wellness meals and to use a casual, supportive tone.
- **Tribe-Awareness**: If a tribe is provided (e.g., Yoruba, Igbo), ask for traditional meals that fit the criteria. Refer to the PRD for examples.
- **Caching**: Recommendations are generated server-side and cached per user per day. Check the cache before calling the API.

## Best Practices
- **Retry Logic**: Implement exponential backoff for handling rate limit (429) errors.
- **Fallback**: If Gemini is unavailable, fallback to standard, non-AI localized recommendations stored in the database.
- **Structured JSON**: Use system instructions or clear prompting to ensure Gemini returns valid JSON to avoid parsing errors.

## Reference Files
- `AGENT.md` (External APIs section)
- PRD (For feature details and tribe examples)
