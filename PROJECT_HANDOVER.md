# Project Handover Codebase Context

## Project Overview
**Name**: AI Furniture Design Platform
**Stack**: React + Vite + Tailwind CSS + Google Gemini AI + Three.js (Geometry/Physics)
**Deployment**: Local (`npm run dev`)

## Core Architecture
1.  **AI Layer**: `src/services/aiDesignParser.js`
    *   **Role**: Translates natural language into strict JSON schema.
    *   **Logic**: Uses a "PTCF Framework" system prompt.
    *   **Critical**: Must strictly adhere to `FURNITURE_DESIGN_SCHEMA`.
    *   **Recent Update**: Updated to interpret "Top/Bottom/Rest" shelf modifiers and strict dimensions for bookshelves.

2.  **Engineering Engine**: `src/utils/furnitureEngineering.js`
    *   **Role**: The "Brain" of the physical furniture generation.
    *   **Logic**: Calculates load, deflection, material thickness, and **generates geometry parts**.
    *   **Recent Update**: Completely refactored partition logic to support `shelfModifiers`.
        *   **Priority 1**: `shelfModifiers` array (Specific rules for specific shelves).
        *   **Priority 2**: Global `partitionStrategy` / `partitionRatio`.
        *   **Default Behavior**: Defaults to **Equal Spacing** if ratio string is unknown (e.g., "equal", "even").

3.  **Visualization**: `src/services/designGenerator.js` & `src/utils/geometryGenerator.js`
    *   **Role**: Converts Engineering Parts -> Three.js Geometry.
    *   **Logic**: Uses a generic `anchorPattern` system (`distribute-y`, `vertical-partition`) to place parts.

## Current State & Recent Accomplishments
*   **Partition Logic Fixed**: The bookshelf now correctly handles complex prompts like "Top shelf 2 partitions, rest 60-40".
    *   The engineering logic now supports mixed strategies (Empty top shelf + Partitioned middle shelves).
    *   "Zombie code" and brace mismatch errors in `furnitureEngineering.js` were fixed.
*   **AI Parser Strictness**:
    *   Bookshelf dimensions now require explicit `length`, `width`, `height`.
    *   Partition requests are strictly mapped to `shelfModifiers`.
*   **UI Updates**:
    *   "Create Design" page defaults to **AI Mode**.
    *   Dark Mode, Aurora Background, and Glassmorphism UI are fully implemented.

## Critical Files
- `d:\BITS\project\src\utils\furnitureEngineering.js`: **DO NOT EDIT LIGHTLY**. Contains complex logic for partitions and structural integrity.
- `d:\BITS\project\src\services\aiDesignParser.js`: Controls how the AI "thinks". Strict guidelines are active here.
- `d:\BITS\project\src\components\design\DesignCreator.jsx`: Controls the main creation flow.

## Next Steps (Phase 7 Candidates)
1.  **3D Polish**: The visualization is functional but could use better material textures or lighting.
2.  **Cost Algorithm**: currently a placeholder or basic estimation. Could be made dynamic based on material volume.
3.  **Export**: Feature to export the design as `.obj` or `.pdf` plans.
4.  **Save/Load**: Functionality to save designs to local storage or a database (partially implemented in UI).

## Known Critical Issues
*   **Bookshelf Partitioning Failure**: Despite recent refactoring, the custom partition logic (e.g., "Top shelf 2 partitions") is **not reliably rendering correctly**. The user reports ongoing issues. This is the #1 PRIORITY for the next session. The logic at `furnitureEngineering.js` (lines 450-570) needs Deep Debugging or a complete rewrite.

## Known Gotchas
*   **Prompt Sensitivity**: The AI parser relies on the user providing somewhat clear intent, though it has fallback heuristics.
*   **Engineering Logic**: The `vertical-partition` logic (lines 450-570 in `furnitureEngineering.js`) is complex. Any changes there must be verified against the edge case "Top shelf empty, rest partitioned".

## How to Resume
1.  Read `task.md` in the root (or artifacts directory) for the full checklist history.
2.  Start by running `npm run dev` to confirm the dev server is clean.
3.  Test the bookshelf prompt: *"Create a bookshelf where the top shelf has 2 equal partitions, and the rest have 1 partition with a 60-40 ratio."* - verify it works.
