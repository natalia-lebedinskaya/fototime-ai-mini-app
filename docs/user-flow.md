# User Flow

## Main User Journey

### Step 1. Open Telegram Mini App

The user launches the application from the Telegram bot.

Expected result:

- Mini App opens successfully;
- event configuration loading starts automatically;
- user sees the welcome screen.

---

### Step 2. Load Event Configuration

Frontend requests:

GET /api/event-config

Expected result:

- active event configuration is returned;
- available participants are loaded;
- available styles are loaded;
- participant-style relations are loaded.

---

### Step 3. Select Participant

The user selects a participant type.

Examples:

- Male
- Female
- Couple
- Family
- Child

Expected result:

- selected participant is highlighted;
- style list is filtered accordingly.

---

### Step 4. Select Style

The user selects an AI style.

Expected result:

- only compatible styles are displayed;
- selected style is highlighted;
- selected style is stored for generation.

---

### Step 5. Upload Photo

The user uploads a photo.

Supported formats:

- JPG
- JPEG
- PNG

Expected result:

- file validation passes;
- selected file name is displayed;
- generation becomes available.

---

### Step 6. Start Generation

Frontend sends:

POST /api/generate

Expected result:

- button becomes disabled;
- loading state appears;
- duplicate requests are prevented.

---

### Step 7. Backend Processing

Backend:

- validates request;
- resolves style mapping;
- selects generation provider;
- uploads image;
- starts generation;
- polls generation status;
- receives final image.

Expected result:

- generation completes successfully;
- metadata is stored.

---

### Step 8. Display Result

Expected result:

- generated image is displayed;
- success state is shown;
- user can download image;
- user can share image;
- user can start a new generation.

---

### Step 9. History

Expected result:

- generated image is stored in local history;
- user can review previous generations;
- history persists between sessions.

## Alternative Flows

### Event Configuration Failed

Expected result:

- error state is shown;
- retry action is available.

### No Styles Available

Expected result:

- empty state is shown;
- generation is unavailable.

### Invalid File

Expected result:

- validation error is shown;
- generation remains disabled.

### Provider Failure

Expected result:

- user sees a friendly error message;
- technical details remain hidden.
