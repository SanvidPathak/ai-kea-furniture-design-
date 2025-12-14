# AI-KEA Project Handover Documentation

**Last Updated:** December 14, 2025
**Project Status:** Production Deployed
**Live URL:** https://game-71a25.web.app

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Key Features](#key-features)
5. [Architecture & Design Patterns](#architecture--design-patterns)
6. [Getting Started](#getting-started)
7. [Development Workflow](#development-workflow)
8. [Firebase Configuration](#firebase-configuration)
9. [API & External Services](#api--external-services)
10. [Design System & Styling](#design-system--styling)
11. [Component Documentation](#component-documentation)
12. [Services & Utils](#services--utils)
13. [State Management](#state-management)
14. [Routing](#routing)
15. [Build & Deployment](#build--deployment)
16. [Testing Strategy](#testing-strategy)
17. [Known Issues & Limitations](#known-issues--limitations)
18. [Future Roadmap](#future-roadmap)
19. [Performance Optimizations](#performance-optimizations)
20. [Troubleshooting](#troubleshooting)

---

## Project Overview

**AI-KEA** is a furniture design platform that allows users to create custom furniture designs using both manual configuration and AI-powered natural language input. The platform generates detailed design specifications, cost breakdowns, assembly instructions, and allows users to place orders.

### Core Functionality

- **Manual Design Mode**: Users select furniture type, dimensions, material, and color through a form interface
- **AI Design Mode**: Users describe furniture in natural language (e.g., "a small wooden coffee table"), powered by Google Gemini 2.5 Flash
- **Design Management**: Save, view, edit, and delete custom furniture designs
- **Order Management**: Place orders with delivery information, track order status
- **Export Options**: Export designs as PDF, assembly instructions, or parts list (CSV)
- **Cost Calculation**: Automatic cost breakdown based on material, dimensions, and parts

### Business Context

The platform democratizes furniture design by making it accessible to non-designers while providing professional-grade specifications and cost estimates.

---

## Technology Stack

### Frontend
- **React 19.0.0** - Latest React with concurrent features
- **React Router DOM 7.1.1** - Client-side routing
- **Vite 6.0.3** - Build tool and dev server
- **Tailwind CSS 3.4.17** - Utility-first CSS framework

### Backend & Services
- **Firebase 11.1.0**
  - Authentication (Email/Password)
  - Cloud Firestore (Database)
  - Cloud Storage (File storage)
  - Hosting (Deployment)
- **Google Generative AI 0.21.0** - Gemini 2.5 Flash for AI design parsing

### PDF Generation
- **jsPDF 2.5.2** - PDF document generation
- **jsPDF-AutoTable 3.8.4** - Table generation in PDFs

### Development Tools
- **ESLint 9.17.0** - Code linting
- **PostCSS 8.4.49** - CSS processing
- **Autoprefixer 10.4.20** - CSS vendor prefixes

---

## Project Structure

```
project/
├── public/                          # Static assets
│   └── vite.svg                     # Favicon
├── src/
│   ├── components/                  # React components
│   │   ├── common/                  # Reusable UI components
│   │   │   ├── Button.jsx           # Primary button component
│   │   │   ├── ErrorMessage.jsx     # Error display component
│   │   │   ├── LoadingSpinner.jsx   # Loading state component
│   │   │   └── Logo.jsx             # App logo component
│   │   ├── design/                  # Design-related components
│   │   │   ├── CostBreakdown.jsx    # Cost analysis table
│   │   │   ├── DesignCard.jsx       # Design preview card
│   │   │   ├── DesignForm.jsx       # Manual design form
│   │   │   ├── DesignPartsTable.jsx # Parts list table
│   │   │   └── DesignPreview.jsx    # Design summary display
│   │   └── order/                   # Order-related components
│   │       ├── OrderCard.jsx        # Order preview card
│   │       ├── OrderForm.jsx        # Order placement form
│   │       └── OrderStatusTimeline.jsx # Order status tracker
│   ├── contexts/                    # React Context providers
│   │   ├── AuthContext.jsx          # Authentication state
│   │   └── ToastContext.jsx         # Toast notifications
│   ├── pages/                       # Route pages
│   │   ├── AccountPage.jsx          # User account management
│   │   ├── DesignDetailPage.jsx     # Individual design view
│   │   ├── ForgotPasswordPage.jsx   # Password reset
│   │   ├── HomePage.jsx             # Landing page with design form
│   │   ├── LoginPage.jsx            # User login
│   │   ├── MyDesignsPage.jsx        # User's saved designs
│   │   ├── MyOrdersPage.jsx         # User's orders
│   │   ├── OrderDetailPage.jsx      # Individual order view
│   │   └── SignupPage.jsx           # User registration
│   ├── services/                    # Business logic & API calls
│   │   ├── aiService.js             # Gemini AI integration
│   │   ├── authService.js           # Firebase Auth operations
│   │   ├── designGenerator.js       # Design generation algorithm
│   │   ├── designService.js         # Design CRUD operations
│   │   └── orderService.js          # Order CRUD operations
│   ├── utils/                       # Utility functions
│   │   ├── analytics.js             # User analytics tracking
│   │   ├── exportUtils.js           # PDF/CSV export functions
│   │   └── validation.js            # Form validation helpers
│   ├── App.jsx                      # Root component
│   ├── firebaseConfig.js            # Firebase initialization
│   ├── index.css                    # Global styles & Tailwind
│   └── main.jsx                     # App entry point
├── dist/                            # Production build output
├── .env                             # Environment variables (API keys)
├── .gitignore                       # Git ignore patterns
├── eslint.config.js                 # ESLint configuration
├── index.html                       # HTML entry point
├── package.json                     # Dependencies & scripts
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── vite.config.js                   # Vite build configuration
├── firebase.json                    # Firebase hosting config
├── .firebaserc                      # Firebase project config
├── PHASES.md                        # Completed development phases
├── ALGORITHM_PLAN.md                # Future algorithm roadmap
├── PROJECT_TIMELINE.csv             # Project timeline for tech leads
└── README.md                        # Project documentation
```

---

## Key Features

### 1. Manual Design Creation
- **Location**: `HomePage.jsx`, `DesignForm.jsx`
- **Flow**:
  1. User selects furniture type (table, chair, shelf, cabinet, desk, bed, wardrobe)
  2. Enters dimensions (length, width, height in cm)
  3. Selects material (wood, metal, plastic)
  4. Chooses material color (hex color picker)
  5. System generates design with parts list and cost

### 2. AI-Powered Design Creation
- **Location**: `HomePage.jsx`, `aiService.js`
- **Flow**:
  1. User enters natural language description
  2. Gemini 2.5 Flash parses the description
  3. AI extracts: furniture type, dimensions, material, color
  4. Same generation algorithm as manual mode
  5. Design flagged as `aiEnhanced: true`

### 3. Design Generation Algorithm
- **Location**: `designGenerator.js`
- **Key Functions**:
  - `generateDesign(params)` - Main entry point
  - `generateParts(type, dimensions, material)` - Creates parts list
  - `calculateTotalCost(parts, material)` - Calculates pricing
  - `generateAssemblyInstructions(type, parts)` - Creates step-by-step instructions
  - Material pricing: Wood (₹150/cm³), Metal (₹250/cm³), Plastic (₹80/cm³)

### 4. Cost Breakdown
- **Location**: `CostBreakdown.jsx`
- **Features**:
  - Expandable/collapsible table
  - Per-part cost analysis (volume, unit cost, total, percentage)
  - Summary cards (parts types, total pieces, volume, avg cost/part)
  - Real-time recalculation on design load

### 5. Order Management
- **Location**: `OrderForm.jsx`, `orderService.js`
- **Order States**: `processing`, `confirmed`, `shipped`, `delivered`
- **Fields**: Name, email, phone, address, city, state, pincode
- **Design Snapshot**: Full design saved with order (prevents changes affecting orders)

### 6. Export Options
- **Location**: `exportUtils.js`
- **Formats**:
  - **PDF Design**: Full design specifications with branding
  - **Assembly Instructions**: Step-by-step PDF guide
  - **Parts List CSV**: Spreadsheet with part details

---

## Architecture & Design Patterns

### Component Architecture
- **Container/Presentation Pattern**: Pages are containers, components are presentational
- **Composition**: Small, reusable components composed into larger features
- **Props Drilling Mitigation**: Context API for auth and toast notifications

### State Management Strategy
- **Local State**: `useState` for component-level state
- **Context API**: Global state for authentication and toasts
- **No Redux**: Deliberately avoided to reduce complexity for small-medium app

### Data Flow
```
User Input → Component State → Service Layer → Firebase/Gemini → Component State → UI Update
```

### Error Handling Pattern
```javascript
try {
  const result = await service.operation();
  showToast('Success message', 'success');
} catch (error) {
  console.error('Context:', error);
  showToast('User-friendly error message', 'error');
}
```

### Design Patterns Used
1. **Service Layer**: Business logic separated from UI components
2. **Context Providers**: Global state management
3. **Custom Hooks**: `useAuth()`, `useToast()`
4. **Higher-Order Components**: Toast provider wrapping
5. **Lazy Loading**: Code splitting for routes (planned, not yet implemented)

---

## Getting Started

### Prerequisites
```bash
Node.js >= 18.x
npm >= 9.x
Firebase CLI >= 13.x
```

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd project
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**

Create `.env` file in project root:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

4. **Start development server**
```bash
npm run dev
```

Server runs at: `http://localhost:5173`

### First-Time Setup Checklist
- [ ] Install Node.js and npm
- [ ] Install Firebase CLI: `npm install -g firebase-tools`
- [ ] Create Firebase project at https://console.firebase.google.com
- [ ] Enable Email/Password authentication
- [ ] Create Firestore database
- [ ] Enable Storage bucket
- [ ] Get Gemini API key from https://makersuite.google.com/app/apikey
- [ ] Configure `.env` file
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Test login/signup flow

---

## Development Workflow

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview

# Lint code
npm run lint

# Deploy to Firebase Hosting
npm run deploy
```

### Code Style Guidelines

1. **File Naming**
   - Components: PascalCase (e.g., `DesignCard.jsx`)
   - Services/Utils: camelCase (e.g., `designService.js`)
   - Pages: PascalCase with "Page" suffix (e.g., `HomePage.jsx`)

2. **Component Structure**
```javascript
// Imports
import { useState } from 'react';

// Component
export function ComponentName({ prop1, prop2 }) {
  // Hooks
  const [state, setState] = useState(null);

  // Event handlers
  const handleClick = () => {
    // Logic
  };

  // Render helpers
  const formatData = (data) => {
    // Logic
  };

  // Early returns
  if (!prop1) return null;

  // Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

3. **Tailwind CSS**
   - Use utility classes directly in JSX
   - Mobile-first responsive design (`sm:`, `md:`, `lg:`)
   - Custom colors from `tailwind.config.js`

4. **Error Handling**
   - Always log errors to console with context
   - Show user-friendly toast messages
   - Never expose technical errors to users

### Git Workflow (Recommended)

```bash
# Feature branch
git checkout -b feature/feature-name

# Make changes
git add .
git commit -m "feat: description of feature"

# Push to remote
git push origin feature/feature-name

# Create pull request
```

### Commit Message Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

---

## Firebase Configuration

### Firestore Database Structure

```
users/
  {userId}/
    displayName: string
    email: string
    createdAt: timestamp

designs/
  {designId}/
    userId: string
    furnitureType: string
    dimensions: { length, width, height }
    material: string
    materialColor: string
    parts: array
    totalCost: number
    assemblyTime: number
    instructions: array
    aiEnhanced: boolean
    userQuery: string (if AI-generated)
    createdAt: timestamp
    updatedAt: timestamp

orders/
  {orderId}/
    userId: string
    designId: string (or 'temp' if unsaved design)
    designSnapshot: object (full design data)
    customerInfo: {
      name: string
      email: string
      phone: string
      address: string
      city: string
      state: string
      pincode: string
    }
    status: string ('processing' | 'confirmed' | 'shipped' | 'delivered')
    createdAt: timestamp
    updatedAt: timestamp
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Users can read/write their own designs
    match /designs/{designId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }

    // Users can read/write their own orders
    match /orders/{orderId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### Firebase Authentication Setup

1. **Enable Email/Password Provider**
   - Go to Firebase Console > Authentication > Sign-in method
   - Enable Email/Password
   - Disable Email link sign-in

2. **Customize Email Templates** (Optional)
   - Password reset email
   - Email verification
   - Change email address

### Storage Rules (For Future File Uploads)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /designs/{userId}/{designId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## API & External Services

### Google Gemini AI Integration

**File**: `src/services/aiService.js`

**API Used**: Google Generative AI (Gemini 2.5 Flash)

**Configuration**:
```javascript
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

**Prompt Engineering**:
```javascript
const prompt = `Parse this furniture design request: "${userQuery}"

Extract:
1. furnitureType: table, chair, shelf, cabinet, desk, bed, or wardrobe
2. dimensions: { length, width, height } in cm
3. material: wood, metal, or plastic
4. materialColor: hex color code

Return ONLY valid JSON matching this structure:
{
  "furnitureType": "table",
  "dimensions": { "length": 120, "width": 60, "height": 75 },
  "material": "wood",
  "materialColor": "#8B4513"
}`;
```

**Rate Limits**: Gemini API has free tier limits (60 requests/minute)

**Error Handling**:
- Invalid JSON response → Parse and extract manually
- API failure → Show user-friendly error
- Quota exceeded → Inform user to try again later

### Analytics Integration

**File**: `src/utils/analytics.js`

**Events Tracked**:
- Design creation (manual/AI)
- Order placement
- Export actions (PDF/CSV)
- Design deletion
- User signup/login

**Usage**:
```javascript
import { trackEvent } from '../utils/analytics.js';

trackEvent('design_created', {
  type: design.furnitureType,
  source: 'manual',
  cost: design.totalCost
});
```

**Note**: Analytics currently logs to console. Can be integrated with:
- Google Analytics 4
- Firebase Analytics
- Mixpanel
- Amplitude

---

## Design System & Styling

### Tailwind Configuration

**File**: `tailwind.config.js`

**Custom Colors**:
```javascript
colors: {
  'ikea-blue': '#0058A3',
  'ikea-yellow': '#FFDB00',
  'ikea-electric': '#00A5E0',
  'earth-beige': '#F5F3ED',
  'neutral': { /* 50-950 scale */ }
}
```

**Custom Utilities**:
```javascript
boxShadow: {
  'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
  'medium': '0 4px 16px rgba(0, 0, 0, 0.12)'
}
```

### Design Tokens

**Typography Scale**:
- `text-xs`: 0.75rem (12px)
- `text-sm`: 0.875rem (14px)
- `text-base`: 1rem (16px)
- `text-lg`: 1.125rem (18px)
- `text-xl`: 1.25rem (20px)
- `text-2xl`: 1.5rem (24px)
- `text-3xl`: 1.875rem (30px)
- `text-4xl`: 2.25rem (36px)

**Spacing Scale**:
- Follows Tailwind's default 4px base unit
- Common spacings: 2, 4, 6, 8, 12, 16, 24, 32

**Responsive Breakpoints**:
```javascript
sm: '640px',  // Tablet
md: '768px',  // Small desktop
lg: '1024px', // Large desktop
xl: '1280px'  // Extra large desktop
```

### Component Styling Patterns

**Card Component**:
```css
.card {
  @apply bg-white rounded-lg shadow-soft p-6;
}
```

**Button Variants**:
- Primary: `bg-ikea-blue text-white hover:bg-ikea-blue/90`
- Secondary: `bg-neutral-200 text-neutral-900 hover:bg-neutral-300`
- Danger: `bg-red-600 text-white hover:bg-red-700`

**Mobile-First Responsive Text**:
```jsx
<h1 className="text-2xl sm:text-3xl md:text-4xl">
  Title
</h1>
```

### Accessibility Considerations

- Color contrast ratios meet WCAG AA standards
- Focus states on all interactive elements
- Semantic HTML elements used
- Alt text for icons (future improvement needed)
- Keyboard navigation support (partial)

---

## Component Documentation

### Common Components

#### Button (`src/components/common/Button.jsx`)

**Props**:
```typescript
{
  children: ReactNode,
  variant?: 'primary' | 'secondary',
  loading?: boolean,
  disabled?: boolean,
  className?: string,
  onClick?: Function,
  type?: 'button' | 'submit' | 'reset'
}
```

**Usage**:
```jsx
<Button variant="primary" loading={isLoading} onClick={handleSubmit}>
  Submit
</Button>
```

#### ErrorMessage (`src/components/common/ErrorMessage.jsx`)

**Props**:
```typescript
{
  message: string,
  onClose: Function
}
```

**Usage**:
```jsx
<ErrorMessage
  message={errorMessage}
  onClose={() => setErrorMessage('')}
/>
```

#### LoadingSpinner (`src/components/common/LoadingSpinner.jsx`)

**Props**:
```typescript
{
  size?: 'sm' | 'md' | 'lg' | 'xl'
}
```

**Usage**:
```jsx
<LoadingSpinner size="xl" />
```

### Design Components

#### CostBreakdown (`src/components/design/CostBreakdown.jsx`)

**Props**:
```typescript
{
  parts: Array<Part>,
  material: string,
  totalCost: number
}
```

**Features**:
- Expandable/collapsible
- Per-part cost calculation
- Summary statistics
- Responsive table design

**Part Structure**:
```typescript
{
  id: string,
  name: string,
  type: string,
  quantity: number,
  dimensions: { length, width, height },
  volume: number,
  unitCost: number,
  totalPartCost: number,
  percentage: number
}
```

#### DesignForm (`src/components/design/DesignForm.jsx`)

**Props**:
```typescript
{
  onSubmit: (design: Design) => void,
  initialData?: Design,
  loading?: boolean
}
```

**Validation**:
- Furniture type: required
- Dimensions: 1-500 cm range
- Material: required
- Color: valid hex code

#### DesignCard (`src/components/design/DesignCard.jsx`)

**Props**:
```typescript
{
  design: Design,
  onDelete: (designId: string) => void
}
```

**Features**:
- Click to view details
- Delete confirmation
- AI badge for AI-generated designs
- Hover effects

### Order Components

#### OrderForm (`src/components/order/OrderForm.jsx`)

**Props**:
```typescript
{
  design: Design,
  onSubmit: (customerInfo: CustomerInfo) => Promise<void>,
  onCancel: () => void
}
```

**Validation**:
- Name: required, min 2 chars
- Email: valid email format
- Phone: 10 digits
- Address: required
- City: required
- State: required
- Pincode: 6 digits

#### OrderStatusTimeline (`src/components/order/OrderStatusTimeline.jsx`)

**Props**:
```typescript
{
  order: Order
}
```

**Status Flow**:
```
Processing → Confirmed → Shipped → Delivered
```

**Visual Indicator**: Progress bar with colored steps

---

## Services & Utils

### Authentication Service (`src/services/authService.js`)

**Functions**:

```javascript
// Sign up new user
signUp(email, password, displayName)
  → Returns: { user, error }

// Sign in existing user
signIn(email, password)
  → Returns: { user, error }

// Sign out current user
signOut()
  → Returns: { error }

// Reset password
resetPassword(email)
  → Returns: { error }

// Get current user
getCurrentUser()
  → Returns: User | null
```

**User Object Structure**:
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  emailVerified: boolean,
  createdAt: timestamp
}
```

### Design Service (`src/services/designService.js`)

**Functions**:

```javascript
// Save new design
saveDesign(userId, designData)
  → Returns: designId

// Get all user designs
getUserDesigns(userId)
  → Returns: Array<Design>

// Get single design
getDesign(designId)
  → Returns: Design

// Update design
updateDesign(designId, userId, updates)
  → Returns: void

// Delete design
deleteDesign(designId, userId)
  → Returns: void
```

**Design Data Structure**:
```javascript
{
  id: string,
  userId: string,
  furnitureType: string,
  dimensions: { length, width, height },
  material: string,
  materialColor: string,
  parts: Array<Part>,
  totalCost: number,
  assemblyTime: number,
  instructions: Array<string>,
  aiEnhanced: boolean,
  userQuery: string?,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Order Service (`src/services/orderService.js`)

**Functions**:

```javascript
// Create new order
saveOrder(userId, orderData)
  → Returns: orderId

// Get all user orders
getUserOrders(userId)
  → Returns: Array<Order>

// Get single order
getOrder(orderId)
  → Returns: Order

// Update order status
updateOrderStatus(orderId, userId, newStatus)
  → Returns: void

// Delete/cancel order
deleteOrder(orderId, userId)
  → Returns: void

// Get status display config
getOrderStatusDisplay(status)
  → Returns: { label, color }
```

**Order Data Structure**:
```javascript
{
  id: string,
  userId: string,
  designId: string,
  designSnapshot: Design,
  customerInfo: {
    name: string,
    email: string,
    phone: string,
    address: string,
    city: string,
    state: string,
    pincode: string
  },
  status: 'processing' | 'confirmed' | 'shipped' | 'delivered',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Design Generator (`src/services/designGenerator.js`)

**Main Function**:
```javascript
generateDesign({
  furnitureType,
  dimensions,
  material,
  materialColor
})
  → Returns: Design
```

**Algorithm Overview**:

1. **Part Generation**: Based on furniture type
   - Tables: top, legs, crossbars
   - Chairs: seat, backrest, legs, armrests
   - Shelves: shelves, sides, back panel
   - Cabinets: frame, doors, shelves
   - Desks: top, legs, drawers
   - Beds: mattress support, headboard, frame
   - Wardrobes: frame, doors, shelves, rod

2. **Cost Calculation**:
   - Volume (cm³) = length × width × height
   - Material rates:
     - Wood: ₹150/cm³
     - Metal: ₹250/cm³
     - Plastic: ₹80/cm³
   - Part cost = volume × material rate
   - Total cost = sum of all part costs

3. **Assembly Time Estimation**:
   - Base time by furniture type (20-90 minutes)
   - Additional time per part (5 minutes)
   - Complexity multiplier for material

4. **Instruction Generation**:
   - Generic instructions based on furniture type
   - Step-by-step assembly guide
   - Safety warnings included

### Export Utils (`src/utils/exportUtils.js`)

**Functions**:

```javascript
// Export design as PDF
exportDesignAsPDF(design)
  → Downloads: design-{type}-{timestamp}.pdf

// Export assembly instructions
exportAssemblyInstructionsAsPDF(design)
  → Downloads: assembly-{type}-{timestamp}.pdf

// Export parts list as CSV
exportPartsAsCSV(design)
  → Downloads: parts-{type}-{timestamp}.csv
```

**PDF Structure**:
- Header with logo and branding
- Design summary (type, dimensions, material, cost)
- Parts list table
- Assembly instructions numbered list
- Footer with timestamp

**CSV Format**:
```csv
Part Name,Type,Quantity,Length (cm),Width (cm),Height (cm),Volume (cm³),Unit Cost (₹),Total Cost (₹)
Table Top,panel,1,120,60,3,21600,3240000.00,3240000.00
...
```

### Validation Utils (`src/utils/validation.js`)

**Functions**:

```javascript
// Validate email format
validateEmail(email)
  → Returns: boolean

// Validate password strength
validatePassword(password)
  → Returns: { valid: boolean, message: string }

// Validate phone number
validatePhone(phone)
  → Returns: boolean

// Validate pincode
validatePincode(pincode)
  → Returns: boolean

// Validate dimension range
validateDimension(value, min, max)
  → Returns: boolean

// Validate hex color
validateHexColor(color)
  → Returns: boolean
```

**Validation Rules**:
- Email: Standard email regex
- Password: Min 6 characters
- Phone: Exactly 10 digits
- Pincode: Exactly 6 digits
- Dimensions: 1-500 cm
- Hex Color: #RRGGBB format

---

## State Management

### Context API Structure

#### AuthContext (`src/contexts/AuthContext.jsx`)

**Provides**:
```javascript
{
  user: User | null,
  isAuthenticated: boolean,
  loading: boolean
}
```

**Usage**:
```javascript
import { useAuth } from '../contexts/AuthContext.jsx';

function MyComponent() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <div>Hello {user.displayName}</div>;
}
```

**Implementation**:
- Listens to Firebase `onAuthStateChanged`
- Automatically updates on auth state changes
- Persists across page refreshes

#### ToastContext (`src/contexts/ToastContext.jsx`)

**Provides**:
```javascript
{
  showToast: (message: string, type: 'success' | 'error' | 'info') => void
}
```

**Usage**:
```javascript
import { useToast } from '../contexts/ToastContext.jsx';

function MyComponent() {
  const { showToast } = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      showToast('Saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };
}
```

**Features**:
- Auto-dismiss after 3 seconds
- Positioned at top-right
- Color-coded by type (green/red/blue)
- Slide-in animation

### Local State Patterns

**Form State**:
```javascript
const [formData, setFormData] = useState({
  furnitureType: '',
  dimensions: { length: '', width: '', height: '' },
  material: '',
  materialColor: '#8B4513'
});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**Loading State**:
```javascript
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');

const fetchData = async () => {
  setLoading(true);
  setError('');
  try {
    const data = await api.getData();
    setData(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## Routing

### Route Configuration (`src/App.jsx`)

```javascript
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
  <Route path="/designs" element={<MyDesignsPage />} />
  <Route path="/designs/:id" element={<DesignDetailPage />} />
  <Route path="/orders" element={<MyOrdersPage />} />
  <Route path="/orders/:id" element={<OrderDetailPage />} />
  <Route path="/account" element={<AccountPage />} />
</Routes>
```

### Protected Routes Pattern

**Current Implementation**:
```javascript
// In each protected page
const { isAuthenticated, loading } = useAuth();

if (!loading && !isAuthenticated) {
  return <Navigate to="/login" replace />;
}
```

**Recommended Improvement** (Not yet implemented):
```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
}

// Usage
<Route path="/designs" element={
  <ProtectedRoute>
    <MyDesignsPage />
  </ProtectedRoute>
} />
```

### Navigation Patterns

**Programmatic Navigation**:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/designs');
navigate('/designs', { replace: true });
navigate(-1); // Go back
```

**Link Navigation**:
```javascript
import { Link } from 'react-router-dom';

<Link to="/designs">My Designs</Link>
<Link to={`/designs/${design.id}`}>View Design</Link>
```

---

## Build & Deployment

### Production Build Process

1. **Build Command**:
```bash
npm run build
```

2. **Build Output**:
- Location: `dist/`
- Assets optimized and minified
- File hashing for cache busting
- Vendor chunk splitting

3. **Build Configuration** (`vite.config.js`):
```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          'pdf-vendor': ['jspdf', 'jspdf-autotable']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### Firebase Deployment

**Prerequisites**:
```bash
npm install -g firebase-tools
firebase login
```

**Deployment Steps**:

1. **Build Production**:
```bash
npm run build
```

2. **Deploy to Firebase Hosting**:
```bash
firebase deploy --only hosting
```

3. **Deployment Configuration** (`firebase.json`):
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### Environment Variables

**Development** (`.env`):
```env
VITE_FIREBASE_API_KEY=dev_key
VITE_GEMINI_API_KEY=dev_key
```

**Production** (Firebase Hosting environment):
- Set via Firebase Console > Hosting > Environment Configuration
- Or via GitHub Actions secrets

### Continuous Deployment (Recommended)

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to Firebase Hosting

on:
  push:
    branches: [main]

jobs:
  build_and_deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: game-71a25
```

---

## Testing Strategy

### Current Testing Status
**Status**: No automated tests implemented yet

### Recommended Testing Approach

#### Unit Tests (Jest + React Testing Library)

**Setup**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Example Test** (`src/services/designGenerator.test.js`):
```javascript
import { generateDesign } from './designGenerator.js';

describe('Design Generator', () => {
  it('should generate table design with correct parts', () => {
    const design = generateDesign({
      furnitureType: 'table',
      dimensions: { length: 120, width: 60, height: 75 },
      material: 'wood',
      materialColor: '#8B4513'
    });

    expect(design.parts).toHaveLength(6); // top, 4 legs, crossbar
    expect(design.totalCost).toBeGreaterThan(0);
  });
});
```

#### Integration Tests

**Component Integration**:
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignForm } from './DesignForm.jsx';

test('submits form with valid data', async () => {
  const handleSubmit = jest.fn();
  render(<DesignForm onSubmit={handleSubmit} />);

  fireEvent.change(screen.getByLabelText('Furniture Type'), {
    target: { value: 'table' }
  });
  fireEvent.click(screen.getByText('Generate Design'));

  await waitFor(() => {
    expect(handleSubmit).toHaveBeenCalled();
  });
});
```

#### End-to-End Tests (Cypress/Playwright)

**User Flow Test**:
```javascript
describe('Design Creation Flow', () => {
  it('creates design from manual form', () => {
    cy.visit('/');
    cy.get('[data-testid="furniture-type"]').select('table');
    cy.get('[data-testid="length"]').type('120');
    cy.get('[data-testid="width"]').type('60');
    cy.get('[data-testid="height"]').type('75');
    cy.get('[data-testid="submit"]').click();

    cy.contains('Design created successfully');
    cy.url().should('include', '/designs/');
  });
});
```

### Manual Testing Checklist

**Authentication Flow**:
- [ ] Sign up with valid email/password
- [ ] Sign up with invalid email format
- [ ] Sign up with weak password
- [ ] Sign in with correct credentials
- [ ] Sign in with wrong password
- [ ] Password reset email sent
- [ ] Sign out functionality

**Design Creation**:
- [ ] Manual design with all furniture types
- [ ] AI design with natural language
- [ ] Form validation (dimensions, material)
- [ ] Cost calculation accuracy
- [ ] Save design to Firestore
- [ ] View saved design
- [ ] Delete design

**Order Management**:
- [ ] Create order from design
- [ ] Order form validation
- [ ] Order saved to Firestore
- [ ] View order details
- [ ] Order status timeline
- [ ] Cancel order

**Export Functions**:
- [ ] PDF export generates correctly
- [ ] Assembly instructions PDF
- [ ] CSV export format
- [ ] File naming convention

**Responsive Design**:
- [ ] Mobile view (320px-640px)
- [ ] Tablet view (640px-1024px)
- [ ] Desktop view (1024px+)
- [ ] Text scaling on mobile
- [ ] Button sizing on mobile
- [ ] Table overflow handling

---

## Known Issues & Limitations

### Current Issues

1. **AI Response Parsing**
   - **Issue**: Gemini sometimes returns markdown-formatted JSON
   - **Workaround**: Parser strips markdown code blocks
   - **Impact**: Occasional parsing failures
   - **Fix**: Improve prompt engineering or use structured output API

2. **Cost Calculation Realism**
   - **Issue**: Current pricing is simplified (per cm³)
   - **Impact**: Not production-ready for real furniture pricing
   - **Roadmap**: Phase 10 - Implement physics-based algorithm

3. **No 3D Preview**
   - **Issue**: Users can't visualize designs
   - **Impact**: Harder to understand final product
   - **Roadmap**: Phase 10 - Three.js integration

4. **No Image Upload**
   - **Issue**: Can't upload reference images for AI
   - **Impact**: Limited AI understanding
   - **Future**: Image-to-design feature

5. **Limited Material Properties**
   - **Issue**: Only 3 materials (wood, metal, plastic)
   - **Impact**: Reduced customization
   - **Future**: Add material variants (oak, pine, steel, aluminum, etc.)

6. **No Admin Panel**
   - **Issue**: Can't manage users/orders from UI
   - **Impact**: Must use Firebase Console
   - **Roadmap**: Phase 11 - Admin dashboard

7. **No Payment Integration**
   - **Issue**: Orders don't collect payment
   - **Impact**: Not e-commerce ready
   - **Roadmap**: Phase 12 - Razorpay integration

8. **No Email Notifications**
   - **Issue**: Users don't receive order confirmations
   - **Impact**: Poor user experience
   - **Future**: Firebase Cloud Functions for emails

### Browser Compatibility

**Tested Browsers**:
- Chrome 120+ ✅
- Firefox 120+ ✅
- Safari 17+ ✅
- Edge 120+ ✅

**Known Issues**:
- IE11: Not supported (uses modern JS features)
- Safari < 15: CSS grid issues

### Performance Limitations

1. **Large Design Lists**: 100+ designs may cause slow rendering
   - **Solution**: Implement pagination or virtualization

2. **PDF Generation**: Large designs take 2-3 seconds
   - **Solution**: Show loading state, consider server-side generation

3. **Firestore Queries**: No indexing on common queries
   - **Solution**: Add composite indexes in Firebase Console

---

## Future Roadmap

### Phase 10: 3D Algorithm & Preview (Planned: Nov 25 - Dec 15, 2025)

**Features**:
- Physics-based design generation
- Material strength calculations
- Load capacity validation
- Three.js 3D preview
- Realistic cost estimation

**Files to Create**:
- `src/services/physicsEngine.js`
- `src/components/design/Design3DViewer.jsx`
- `src/utils/three-helpers.js`

**Reference**: See `ALGORITHM_PLAN.md`

### Phase 11: Admin Panel (Planned: Dec 2 - Dec 22, 2025)

**Features**:
- Admin authentication
- User management dashboard
- Order management (update status)
- Design analytics
- Revenue reports

**Routes to Add**:
- `/admin/login`
- `/admin/dashboard`
- `/admin/users`
- `/admin/orders`
- `/admin/analytics`

### Phase 12: E-commerce Integration (Planned: Dec 23 - Jan 12, 2026)

**Features**:
- Razorpay payment gateway
- Shopping cart system
- Invoice generation
- Shipping calculator
- Order tracking

**Dependencies**:
- Razorpay SDK
- Invoice template library

### Future Enhancements (Post-Jan 2026)

**Mobile App**:
- React Native app
- Camera-based room measurement
- AR furniture preview

**AI Enhancements**:
- Image-to-design conversion
- Style transfer
- Design recommendations
- Chat-based design refinement

**Collaboration Features**:
- Share designs with others
- Comments on designs
- Design templates library
- Community designs marketplace

---

## Performance Optimizations

### Current Optimizations

1. **Code Splitting**
   - React Router lazy loading (not yet implemented)
   - Vendor chunk splitting in Vite config
   - Dynamic imports for heavy components

2. **Asset Optimization**
   - Image optimization via Vite
   - SVG for icons (lightweight)
   - CSS purging via Tailwind

3. **Database Optimization**
   - Firestore queries with `.limit()`
   - Index-only queries where possible
   - Client-side caching of user data

### Recommended Improvements

**1. Lazy Load Routes**:
```javascript
import { lazy, Suspense } from 'react';

const DesignDetailPage = lazy(() => import('./pages/DesignDetailPage.jsx'));

<Route path="/designs/:id" element={
  <Suspense fallback={<LoadingSpinner />}>
    <DesignDetailPage />
  </Suspense>
} />
```

**2. Memoize Expensive Calculations**:
```javascript
import { useMemo } from 'react';

const costBreakdown = useMemo(() =>
  calculateCostBreakdown(parts, material),
  [parts, material]
);
```

**3. Debounce Search/Filter**:
```javascript
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((query) => performSearch(query), 300),
  []
);
```

**4. Virtual Scrolling** (for large lists):
```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={designs.length}
  itemSize={120}
>
  {({ index, style }) => (
    <div style={style}>
      <DesignCard design={designs[index]} />
    </div>
  )}
</FixedSizeList>
```

**5. Image Lazy Loading**:
```jsx
<img loading="lazy" src={imageUrl} alt="Design" />
```

**6. Service Worker** (PWA):
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll(['/index.html', '/styles.css']);
    })
  );
});
```

### Performance Metrics

**Target Metrics**:
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

**Measurement Tools**:
- Chrome Lighthouse
- WebPageTest
- Firebase Performance Monitoring

---

## Troubleshooting

### Common Issues

#### 1. Firebase Authentication Errors

**Error**: `Firebase: Error (auth/configuration-not-found)`
```
Solution: Verify .env file has correct Firebase config
Check: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, etc.
```

**Error**: `Firebase: Error (auth/email-already-in-use)`
```
Solution: User already exists, use login instead
Or: Delete user from Firebase Console > Authentication
```

#### 2. Gemini API Errors

**Error**: `API key not valid`
```
Solution: Check VITE_GEMINI_API_KEY in .env
Verify: API key is active in Google AI Studio
```

**Error**: `Quota exceeded`
```
Solution: Free tier limit reached (60 req/min)
Wait: 1 minute before retrying
Or: Upgrade to paid plan
```

#### 3. Firestore Permission Errors

**Error**: `Missing or insufficient permissions`
```
Solution: Check Firestore security rules
Verify: User is authenticated (check AuthContext)
Debug: Log user.uid and document userId to console
```

#### 4. Build Errors

**Error**: `Module not found: Can't resolve 'X'`
```
Solution: Run npm install
Check: Import paths are correct (.jsx extension)
Clear: node_modules and reinstall
```

**Error**: `Vite build fails with memory error`
```
Solution: Increase Node memory limit
Run: NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

#### 5. Deployment Errors

**Error**: `Firebase deploy fails`
```
Solution: Run firebase login
Check: firebase.json has correct project ID
Verify: Build completed (dist/ folder exists)
```

**Error**: `Site loads blank page after deploy`
```
Solution: Check browser console for errors
Verify: Environment variables set in Firebase
Check: .env variables prefixed with VITE_
```

### Debugging Tips

**1. Enable Verbose Logging**:
```javascript
// In development
if (import.meta.env.DEV) {
  console.log('Debug:', data);
}
```

**2. Firebase Debugging**:
```javascript
import { enableIndexedDbPersistence } from 'firebase/firestore';

enableIndexedDbPersistence(db).catch((err) => {
  console.error('Persistence error:', err);
});
```

**3. Network Debugging**:
```javascript
// Monitor all Firestore operations
import { enableNetwork, disableNetwork } from 'firebase/firestore';

console.log('Network enabled');
enableNetwork(db);
```

**4. React DevTools**:
- Install React DevTools browser extension
- Inspect component props/state
- Profile component renders

**5. Firebase Emulator** (for local testing):
```bash
firebase emulators:start --only auth,firestore
```

---

## Quick Reference

### Key File Paths

```
Configuration:
  .env                              - Environment variables
  vite.config.js                    - Build configuration
  tailwind.config.js                - Design system
  firebase.json                     - Deployment config

Core Services:
  src/services/authService.js       - Authentication
  src/services/designService.js     - Design CRUD
  src/services/orderService.js      - Order CRUD
  src/services/aiService.js         - Gemini AI
  src/services/designGenerator.js   - Design algorithm

Main Pages:
  src/pages/HomePage.jsx            - Landing + design form
  src/pages/MyDesignsPage.jsx       - User's designs
  src/pages/MyOrdersPage.jsx        - User's orders
  src/pages/DesignDetailPage.jsx    - Design details
  src/pages/OrderDetailPage.jsx     - Order details

Key Components:
  src/components/design/DesignForm.jsx     - Manual design input
  src/components/design/CostBreakdown.jsx  - Cost analysis
  src/components/order/OrderForm.jsx       - Order placement
  src/contexts/AuthContext.jsx             - Auth state
```

### Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run preview                # Preview build locally

# Firebase
firebase login                 # Login to Firebase
firebase deploy                # Deploy to hosting
firebase emulators:start       # Start local emulators

# Debugging
npm run lint                   # Check code quality
firebase firestore:delete      # Clear Firestore data
firebase auth:export           # Export user data
```

### Environment Variables Reference

```env
# Firebase (Required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

# Google AI (Required for AI mode)
VITE_GEMINI_API_KEY=
```

### Contact & Support

**Project Lead**: [Your Name]
**Email**: [your-email@example.com]
**Repository**: [GitHub URL]
**Documentation**: This file
**Live Site**: https://game-71a25.web.app

---

## Appendix

### Related Documentation Files

1. **PHASES.md** - Completed development phases (1-9)
2. **ALGORITHM_PLAN.md** - Future 3D algorithm specification
3. **PROJECT_TIMELINE.csv** - Project schedule and milestones
4. **README.md** - User-facing documentation

### Glossary

- **Design**: Custom furniture specification created by user
- **Part**: Component of furniture (e.g., table leg, shelf panel)
- **Assembly Instructions**: Step-by-step guide to build furniture
- **Cost Breakdown**: Detailed analysis of material costs per part
- **AI-Enhanced**: Design created via natural language AI parsing
- **Design Snapshot**: Immutable copy of design saved with order
- **Manual Mode**: Traditional form-based design creation
- **Gemini**: Google's generative AI model (2.5 Flash)

### Version History

- **v1.0.0** (Oct 2024) - Initial release, Phases 1-9 completed
- **v1.1.0** (Nov 2024) - Mobile responsive improvements
- **v2.0.0** (Planned Jan 2026) - 3D preview, admin panel, payments

---

**Document Version**: 1.0
**Last Updated**: December 14, 2025
**Maintained By**: Development Team

---

*This document should be updated whenever significant changes are made to the project architecture, dependencies, or workflows.*
