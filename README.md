# AI-KEA - AI-Powered Modular Furniture Design Platform

AI-KEA is a full-stack web application that allows users to design custom modular furniture using a **Hybrid Intelligence** system. It combines the ease of AI natural language with the precision of paramatric engineering.

## 🚀 Key Features

### 🏛️ Platform Capabilities
- **Dual Design Modes**:
  - 🤖 **AI Mode**: Natural language design (e.g., "Scanning complete... Desk with 3 shelves").
  - 📐 **Manual Mode**: Granular control over dimensions, materials, and colors.
- **User Accounts**: Firebase-backed profiles to save, edit, and track designs.
- **3D Visualization**: Real-time Interactive 3D preview using ThreeJS.
- **Order Management**: Complete lifecycle tracking from "Design" to "Delivered".

### 🧠 Hybrid Engineering Engine (Updated V4)
- **Hybrid Intelligence**: Combines AI intent parsing with Regex precision.
  - *Example*: "Partitions 3:2:5" overrides AI to force exact spacing.
- **Desk V4 Geometry**:
  - **Floating Box Topology**: Precision alignment for complex side storage.
  - **Load-Adaptive Structure**: Walls thicken (1.5cm → 5.0cm) dynamically based on load (e.g., 600kg), while shelves remain efficient.
- **Smart Logic**:
  - **Bookshelves**: Complex partition ratios and range-based rules.
  - **Side Storage**: Horizontal shelf generation with authentic carpentry logic (Bottom + N shelves).

### 🪑 Furniture Catalog
- **Smart Desks**: Customizable storage, aprons, and load ratings.
- **Bookshelves**: Variable partitioning and shelf counts.
- **Tables & Chairs**: Parametric templates with stability analysis.
- **Bed Frames**: Structural integrity checks and slat generation.

### 🏭 Manufacturing & Output
- **Precision BOM**: Parts list grouped by **Name + Dimensions** to prevent manufacturing errors.
- **Cost Analysis**: Real-time pricing based on material volume (Wood/Metal/Plastic).
- **Assembly Instructions**: Step-by-step guides generated directly from the 3D model.
- **Export Options**: PDF blueprints and CSV data.

## Tech Stack

### Frontend
- **React 19** - Modern UI library with hooks and Suspense
- **Vite 6** - Fast build tool with code splitting
- **Tailwind CSS** - Utility-first CSS framework with IKEA-inspired design system
- **React Router v6** - Client-side routing with lazy loading
- **jsPDF** - PDF generation for exports
- **html2canvas** - Design visualization

### Backend
- **Firebase Authentication** - Secure user authentication
- **Cloud Firestore** - NoSQL database for designs and orders
- **Firebase Storage** - File storage for design assets
- **Google Gemini AI** - AI-powered natural language processing (gemini-2.5-flash model)

### Styling & UX
- IKEA-inspired color palette (#0058A3 blue, #FFDB00 yellow, earth tones)
- Fully responsive design (mobile-first approach)
- Smooth animations and transitions
- Loading skeletons for better perceived performance
- Error boundaries for robust error handling
- Accessibility features (ARIA labels, keyboard navigation)
- PWA support with manifest

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Firebase

You'll need to set up a Firebase project to use authentication and Firestore.

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**
3. Follow the setup wizard (name your project, enable Google Analytics if desired)

#### Enable Firebase Services

1. **Authentication**:
   - In your Firebase project, go to **Authentication** > **Sign-in method**
   - Enable **Email/Password** provider
   - Click **Save**

2. **Firestore Database**:
   - Go to **Firestore Database** > **Create database**
   - Start in **Test mode** (or Production mode with custom rules)
   - Choose a location closest to your users
   - Click **Enable**

#### Get Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "AI-KEA Web")
5. Copy the Firebase configuration object

#### Create Environment File

Create a `.env` file in the project root:

```bash
# In the project root directory
touch .env
```

Add your Firebase configuration to `.env`:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important**: Replace all `your_*` placeholders with actual values from your Firebase project settings.

### 4. Configure Google Gemini AI (Optional - for AI Mode)

The AI-powered design mode requires a Google Gemini API key.

#### Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy the generated API key

#### Add to Environment File

Add the Gemini API key to your `.env` file:

```env
# Google Gemini AI Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: If you skip this step, the app will still work, but AI mode will be disabled. Users can still use Manual mode to create designs.

#### Free Tier Limits (Gemini)
- **Rate limit**: 10 requests/minute
- **Daily quota**: 250 requests/day

### 5. Start the Development Server

```bash
npm run dev
```

The app will be available at: **http://localhost:5173**

## Usage

### Creating Your First Design

1. **Sign Up**: Click "Sign In" → "Create Account" and register with email/password
2. **Navigate to Create**: Click "Start Designing" from the homepage
3. **Choose a Mode**:
   - **AI Mode**: Type a description like "I need a modern office desk in black metal, 150cm wide, with drawers"
   - **Manual Mode**: Select furniture type, material, color, and optional dimensions
4. **Generate Design**: Click the generate button and view your design preview
5. **Save Design**: Click "Save Design" to store it in your account
6. **View Designs**: Go to "My Designs" to see all your saved designs

### Example AI Prompts

- "A rustic wooden dining table, 200cm long, seats 6-8 people"
- "Modern minimalist bookshelf in white, 180cm tall, 5 shelves"
- "Ergonomic office chair with lumbar support, mesh back, adjustable height"
- "Small bedside table in walnut wood, 2 drawers, 50cm wide"

## Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── auth/           # Login, Signup forms
│   │   ├── common/         # Reusable UI components (Button, Input, Toast, etc.)
│   │   └── design/         # Design-related components
│   ├── contexts/           # React contexts (Auth, Toast)
│   ├── pages/              # Page components (Home, Create, MyDesigns, etc.)
│   ├── services/           # Business logic and API services
│   │   ├── authService.js
│   │   ├── designService.js
│   │   ├── designGenerator.js
│   │   └── hybridDesignGenerator.js
│   ├── App.jsx             # Main app component with routes
│   ├── main.jsx            # App entry point
│   └── index.css           # Global styles
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── .env                    # Environment variables (create this)
```

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint

# Deploy to Firebase (after setup)
npm run deploy
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Firebase Hosting setup
- Environment configuration
- Security rules
- Custom domain setup
- Analytics integration
- Performance monitoring

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Yes |
| `VITE_GEMINI_API_KEY` | Google Gemini API key | No (AI mode only) |

## Firestore Data Structure

The app uses multiple Firestore collections:

### Collections
- `users` - User profiles and settings
- `designs` - Furniture designs
- `orders` - Order information and tracking

### Design Document Schema

```javascript
{
  id: "auto-generated-id",
  userId: "firebase-user-uid",
  type: "design",
  furnitureType: "table" | "chair" | "bookshelf" | "desk" | "bed frame",
  material: "wood" | "metal" | "plastic",
  materialColor: "#hex-color",
  dimensions: {
    length: 120,  // cm
    width: 80,    // cm
    height: 75    // cm
  },
  parts: [
    {
      name: "Table Top",
      material: "wood",
      dimensions: { length: 120, width: 80, thickness: 2 },
      quantity: 1,
      cost: 45.50
    }
    // ... more parts
  ],
  instructions: [
    "Step 1: Lay out all parts...",
    "Step 2: Attach legs to table top..."
    // ... more steps
  ],
  totalCost: 156.80,
  assemblyTime: 45,  // minutes
  aiEnhanced: false,
  userQuery: null,   // Original AI prompt if AI-generated
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Order Document Schema

```javascript
{
  id: "auto-generated-id",
  userId: "firebase-user-uid",
  type: "order",
  designId: "design-doc-id",
  designSnapshot: { /* Full design object */ },
  customerInfo: {
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 9876543210",
    address: "123 Main St",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001"
  },
  status: "processing" | "confirmed" | "manufacturing" | "shipped" | "delivered" | "cancelled",
  statusHistory: [
    {
      status: "processing",
      timestamp: Timestamp
    }
    // ... status changes
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Security Rules (Firestore)

For production, update your Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /mydb/{docId} {
      // Allow users to read/write their own designs
      allow read, write: if request.auth != null
                        && request.resource.data.userId == request.auth.uid;

      // Allow users to create new designs
      allow create: if request.auth != null;
    }
  }
}
```

## Troubleshooting

### Issue: "Firebase not configured" error
**Solution**: Make sure your `.env` file exists and contains all required Firebase variables. Restart the dev server after creating/modifying `.env`.

### Issue: AI mode shows "API key not configured"
**Solution**: Add `VITE_GEMINI_API_KEY` to your `.env` file with a valid Gemini API key.

### Issue: "Port 5173 is in use"
**Solution**: Vite will automatically use the next available port (5174, 5175, etc.). Check the terminal output for the actual URL.

### Issue: Authentication not working
**Solution**:
1. Verify Firebase Authentication is enabled in Firebase Console
2. Check that Email/Password provider is enabled
3. Ensure `.env` has correct Firebase configuration

### Issue: Designs not saving to Firestore
**Solution**:
1. Verify Firestore is enabled in Firebase Console
2. Check Firestore rules allow authenticated users to write
3. Open browser console to see detailed error messages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by IKEA's furniture design philosophy
- Powered by Google Gemini AI for natural language processing
- Built with modern React and Firebase technologies

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Built with ❤️ using React, Firebase, and Google Gemini AI**
