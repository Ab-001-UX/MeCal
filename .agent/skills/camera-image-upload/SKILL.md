# Skill: Camera and Image Upload

## Purpose
This skill guide details how to implement the food scanning and image upload flow for MeCal. It ensures a consistent approach to handling images, interacting with Cloudinary, and analyzing food via the Gemini API.

## Implementation Flow

### 1. Frontend: Capture and Upload
- **Input Method**: Use standard HTML file input with mobile camera capture support.
  ```html
  <input type="file" accept="image/*" capture="environment">
  ```
- **Capabilities**: Support both direct camera capture and uploading from the gallery.
- **Payload**: Send the image file to the backend as `multipart/form-data`.
- **Constraint**: NEVER send images or call the Gemini API directly from the client.

### 2. Backend: Processing and Storage
- **Endpoint**: `POST /api/scan`
- **Storage**: Use Cloudinary (free tier) to store the uploaded image.
  - Upload the file received in the request.
  - Store only the returned `secure_url` in the database if the meal is saved. Do not store raw images.
- **Cleanup**: Ensure temporary files (if any) are cleaned up after upload.

### 3. AI Analysis (Gemini)
- **Service**: All calls must go through `server/services/gemini.service.js`.
- **Model**: Use `gemini-1.5-flash`.
- **Payload**: Pass the image data to Gemini with a structured prompt.
- **Expected Output**: Instruct Gemini to return a JSON object with:
  - `foodName`: Name of the detected food.
  - `calorieEstimate`: Estimated calories (or range).
  - `confidenceLevel`: "High", "Medium", or "Low".
  - `nutritionalBreakdown`: Carbs, protein, fat.
  - `servingEstimation`: Estimated serving size.

### 4. Client Display and Editing
- **Confidence Feedback**: Display the AI's confidence level clearly to the user (e.g., High / Medium / Low).
- **Editable Fields**: Allow the user to modify:
  - Food name
  - Serving quantity
  - Meal category (Breakfast, Lunch, Dinner, Snack)
  - Serving type (e.g., wraps, spoon, sachet, cup, pieces, slices)

## Best Practices
- **Graceful Error Handling**: If Cloudinary or Gemini fails, show a friendly message and allow the user to retry or enter the meal manually.
- **Prompt Engineering**: Ensure the prompt to Gemini includes context about the user's country (and tribe if provided) to improve recognition of local foods (e.g., Jollof Rice, Amala).
- **Security**: Never expose Cloudinary credentials to the client.

## Reference Files
- `AGENT.md` (Project overview and constraints)
- PRD (For feature details)
