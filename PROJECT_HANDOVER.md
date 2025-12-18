# Project Handover: AI Furniture Design (Dec 2025)

**Status:** Stability & Refinement Phase
**Deployment:** Live @ `https://game-71a25.web.app` (Firebase Hosting)

---

## 1. Core Objectives Accomplished
The project has evolved from a basic furniture generator to a robust, engineered system with precise control over physical layout.

### ✅ Partition Logic Refinement (The "Bookshelf Saga")
*   **Terminology Shift:** "Partitions" now strictly means **Physical Dividers (Boards)**.
    *   *Old Logic:* "4 Partitions" = 4 spaces (3 boards).
    *   *New Logic:* "4 Partitions" = 4 boards (5 spaces).
*   **Prompt Logic:** AI System Prompt updated to reflect this. `aiDesignParser.js` enforces `Terminology: "Partitions" = "Dividers"`.

### ✅ Rule Prioritization (Conflict Resolution)
*   **Issue:** A "Range Rule" (e.g., "Shelves 1-3 have 2 partitions") was overriding a "Specific Rule" (e.g., "Shelf 2 has 4 partitions") because the AI wasn't outputting the specific rule, assuming the range covered it.
*   **Solution:**
    1.  **AI Instruction:** Force AI to output **BOTH** conflicting rules. "Do not optimize/merge."
    2.  **Engineering Engine:** `furnitureEngineering.js` iterates intervals. It checks Priority 1 (Specific Target) *before* Priority 2 (Pattern/Range).
    *   **Result:** Specific rules strictly override global/range rules.

### ✅ "Phantom Partition" Fix
*   **Issue:** Unused shelves (e.g., Shelf 4) were generating default partitions even when specific rules existed for others.
*   **Solution:** Modified `aiDesignParser.js` to **force** `partitionStrategy: 'none'` whenever `shelfModifiers` are present. This ensures no "fallback" partitions appear on undefined shelves.

### ✅ UI/UX Polish
*   **Snowfall Background (`SnowfallBackground.jsx`):**
    *   **Logic:** 90% Snow (Neutral) / 10% Confetti (Vibrant).
    *   **Theme Aware:** 
        *   Dark Mode: Snow is `#F1F5F9` (Soft White).
        *   Light Mode: Snow is `#94A3B8` (Cool Silver) for visibility against white backgrounds.
*   **Build Optimization:** Fixed "Mixed Static/Dynamic Imports" in `AIDesignInput.jsx` to clear Vite build warnings.

---

## 2. Key Challenges & "Gotchas" (Read This!)

### ⚠️ AI "Over-Optimization"
*   **The Trap:** The LLM often tries to "be smart" by merging logic (e.g., collapsing a specific rule into a range rule).
*   **The Fix:** Explicitly tell the AI to be "dumb" and verbose. Let the deterministic Javascript code (`furnitureEngineering.js`) handle the logic/priority. **Do not let the AI decide physics.**

### ⚠️ Coordinate Systems
*   **Vertical Indexing:** 
    *   system uses **1-based Top-Down** indexing for shelves (1=Top).
    *   Internally, 3D parts are often generated Bottom-Up (Y-axis 0 to Height).
    *   *Critical:* `furnitureEngineering.js` calculates `visualIdx = totalIntervals - intervalIdx` to bridge this gap.

### ⚠️ Phantom Parts in BOM
*   **The Trap:** Generating "Logical" parts (like a virtual "Partition Manager") that accidentally get counted in the Bill of Materials.
*   **The Fix:** 
    *   BOM generation now counts **Actual 3D Objects** in the scene (`positionedParts`), not the high-level design request.
    *   Virtual parts must have `type: 'virtual'` or be filtered out.

---

## 3. Important Files

*   **Logic Core:** `src/utils/furnitureEngineering.js`
    *   Contains `applyAnchorPoints`. This is the "Engine" that converts abstract rules into 3D coordinates.
    *   Handles the Conflict Resolution (Specific > Range).
*   **AI Brain:** `src/services/aiDesignParser.js`
    *   Contains the System Prompt.
    *   *Crucial:* Has the safety rule `if (shelfModifiers) strategy = 'none'`.
*   **UI Entry:** `src/components/design/AIDesignInput.jsx`
    *   Handles the API call to Gemini.
    *   Recent fix: Standardized imports (Static only).

---

## 4. Known Issues / Next Steps

1.  **Large Chunk Size (>1MB):**
    *   `CreateDesignPage` bundles Three.js and heavy logic.
    *   *Next Step:* Investigate `React.lazy` for the 3D Canvas or `manualChunks` in Vite config to split vendor libs.

2.  **Deployment Warnings:**
3.  **Mobile 3D Scaling:**
    *   **Issue:** The "Create Design" page 3D viewer uses a fixed camera position (`[250, 200, 250]`) and FOV (`45`). On mobile portrait screens (narrow aspect ratio), this reduces the horizontal field of view, causing furniture to appear "zoomed in" or cropped.
    *   **Fix:** Implement a "Fit to Screen" logic in `ThreeJSViewer.jsx` that adjusts camera distance based on viewport aspect ratio and object bounding box (`Box3`).

---

## 5. Debugging Tools
*   `reproduce_conflict_bug.js`: A specialized script created to test the "Range vs Specific" priority logic without running the UI. Use `node reproduce_conflict_bug.js` to verify core logic changes.
*   `debug_bookshelf_logic.js`: Validates shelf counting and crowding checks.

**Good luck! The logic is currently verified and stable.**
