# MadrassaPlay - Comprehensive Project Overview

## Table of Contents
1. [Project Summary](#project-summary)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [User Roles & Permissions](#user-roles--permissions)
5. [Data Models](#data-models)
6. [API Endpoints](#api-endpoints)
7. [Game System](#game-system)
8. [Finance System](#finance-system)
9. [Landing Page Builder](#landing-page-builder)
10. [Real-time Features](#real-time-features)
11. [Client Application](#client-application)
12. [Deployment](#deployment)
13. [File Structure](#file-structure)

---

## Project Summary

**MadrassaPlay** is a comprehensive educational management platform designed for private schools (Madrassas). It combines:

- **School Management System (SMS)**: Student enrollment, attendance, payments, class management
- **Learning Management System (LMS)**: Game-based learning, assignments, badges, leaderboards
- **Finance Management**: Student payments, teacher payouts, employee salaries, financial reporting
- **Marketing Tools**: Landing page builder with analytics, contact form management
- **Real-time Gaming**: Live multiplayer game sessions with Socket.IO

### Target Users
- **Algeria-focused**: Currency in DZD (Algerian Dinar), educational levels (primary/middle/high school with streams)
- **Private Schools**: Support lessons, review courses, vocational training, language courses

---

## Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | - | Runtime environment |
| Express | 5.1.0 | Web framework |
| MongoDB | - | Database |
| Mongoose | 8.17.1 | ODM |
| Socket.IO | 4.8.1 | Real-time communication |
| JWT | 9.0.2 | Authentication tokens |
| bcryptjs | 3.0.2 | Password hashing |
| Multer | 2.0.2 | File uploads |
| express-async-handler | 1.2.0 | Async error handling |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.1 | UI library |
| Vite | 7.0.3 | Build tool |
| Tailwind CSS | 3.4.17 | Styling |
| React Router | 7.6.2 | Routing |
| Axios | 1.10.0 | HTTP client |
| Socket.IO Client | 4.8.1 | Real-time client |
| Chart.js | 4.5.0 | Data visualization |
| Three.js | 0.175.0 | 3D model viewing |
| i18next | 25.1.3 | Internationalization |
| html2canvas | 1.4.1 | Screenshot/PDF export |
| jsPDF | 3.0.1 | PDF generation |

### DevOps
| Tool | Purpose |
|------|---------|
| PM2 | Process manager |
| Nginx | Reverse proxy (production) |
| Jest | Testing framework |
| ESLint | Code linting |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React + Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │  Admin   │ │ Manager  │ │ Teacher  │ │ Student  │           │
│  │Dashboard │ │Dashboard │ │Dashboard │ │Dashboard │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Context Providers: AuthContext, LanguageContext, Socket   │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API / WebSocket
┌───────────────────────────▼─────────────────────────────────────┐
│                      Server (Node.js + Express)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Routes: 31 route files → Controllers → Models              │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Middleware: auth, upload, permissions                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Socket.IO: Real-time game sessions (socketHandler.js)      │ │
│  └────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Services: Logging, Payout, Finance, Enrollment             │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                       MongoDB Database                           │
│  36 Collections (Models)                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## User Roles & Permissions

### Role Hierarchy

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | Platform administrator | Global access, manages schools/templates |
| **manager** | School owner/manager | School-wide access, finances, staff |
| **principal** | School principal | School oversight (limited) |
| **teacher** | Class instructor | Own classes, games, assignments |
| **staff** | Administrative staff | Attendance, payments (configurable) |
| **employee** | Non-teaching staff | Limited platform access |
| **student** | Enrolled learner | Own assignments, games, profile |

### User Model Fields
```javascript
{
  firstName, lastName, email, password, role,
  school: ObjectId,           // School reference
  
  // Gamification (all roles, mainly students)
  xp: Number,                 // Experience points
  level: Number,              // Current level (1+)
  totalPoints: Number,        // Lifetime points
  
  // Student-specific
  studentCode: String,        // Unique per-school code
  balance: Number,            // Session balance
  enrollmentStatus: 'active' | 'suspended' | 'inactive'
}
```

---

## Data Models

### Core Entities (36 Models)

#### School Management
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **School** | School entity | name, address, managers[], trial system, landingPage config |
| **SchoolCatalog** | Course offerings | supportLessons[], reviewCourses[], vocationalTrainings[], languages[] |
| **Room** | Physical spaces | name, capacity, activityTypes[] |
| **Equipment** | School assets | majorType, itemName, units[] with state tracking |

#### User & Access
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | All platform users | Unified model for all roles (see above) |
| **Employee** | Staff records | name, role, salaryType (fixed/hourly), salaryValue, permissions |

#### Class & Enrollment
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Class** | Course/class | teacher, catalogItem, schedules[], paymentModel, teacherCut, absenceRule |
| **Enrollment** | Student-class link | studentId, classId, balance (session credits), pricingSnapshot |
| **Attendance** | Session records | enrollmentId, dates[], consumed session tracking |

#### Payments & Finance
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **Payment** | Student payments | studentId, amount, sessionsPurchased, debtImpact |
| **StudentFinancial** | Student debt tracking | debt (positive = owes school) |
| **TeacherPayout** | Teacher earnings | calculatedIncome, paidAmount, remainingDebt, payoutHistory[] |
| **EmployeeSalaryTransaction** | Salary payments | year, month, calculatedSalary, paidAmount |
| **ManualTransaction** | Manual income/expense | type (income/expense), category, amount |
| **MonthlyFinancialSummary** | Monthly aggregates | totalIncome, totalExpenses, teacherEarnings, isFrozen |

#### Gaming & Learning
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **GameTemplate** | Game engine templates | name, manifest, formSchema, enginePath, iconUrl |
| **GameCreation** | Teacher-created games | templateId, gameData (settings/content), status |
| **Assignment** | Homework assignments | classes[], students[], games[], startDate, endDate, attemptLimit |
| **GameResult** | Play results | student, gameCreation, score, attemptNumber, xpAwarded, answers[] |
| **LiveSession** | Real-time sessions | hostId, gameCreationId, roomCode, status, classes[] |
| **LiveParticipant** | Session players | sessionId, studentId, score, correct, wrong, timeMs |

#### Badges & Gamification
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **TemplateBadge** | Badge definitions | template, name, evaluationMode, variants[] with thresholds |
| **EarnedTemplateBadge** | Earned badges | user, templateBadge, variantLabel, percentage |

#### Landing Page & Marketing
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **ContactInquiry** | Lead capture | school, name, email, message, status |
| **LandingPageAnalytics** | Daily metrics | pageViews, uniqueVisitors, ctaClicks, conversionRate |

#### Logging & Audit
| Model | Purpose | Key Fields |
|-------|---------|------------|
| **ActivityLog** | Audit trail | action (50+ types), category, severity, relatedEntity |
| **StudentLog** | Student history | action (transfer/unenroll/suspend), summary, details |

---

## API Endpoints

### Route Structure (31 Route Files)

```
/api/users          → Authentication, profile, gamification
/api/schools        → School CRUD, landing page config
/api/catalog        → School catalog management
/api/classes        → Class management, resources
/api/teachers       → Teacher CRUD (manager access)
/api/students       → Student management (CRUD, enroll, transfer, suspend)
/api/enrollments    → Enrollment management
/api/attendance     → Mark/undo attendance, history
/api/payments       → Payment recording, debt management
/api/finance        → Financial overview, teacher payouts, analytics
/api/employees      → Employee CRUD
/api/rooms          → Room management
/api/equipment      → Equipment tracking
/api/advertisements → School announcements
/api/templates      → Game template management (admin)
/api/creations      → Game creation (teacher)
/api/assignments    → Assignment management
/api/results        → Game results
/api/leaderboard    → XP leaderboards
/api/live-sessions  → Real-time game sessions
/api/logs           → Activity logs
/api/template-badges → Badge definitions
/api/public/*       → Public landing pages, contact forms
/api/school-documents → PDF document management
/api/reporting      → Reports generation
/api/staff          → Staff management
```

### Authentication Flow
1. Login: `POST /api/users/login` → Returns JWT token
2. Token stored in localStorage, attached as `Authorization: Bearer {token}`
3. `protect` middleware validates token on protected routes
4. Role-based middleware: `admin`, `manager`, `teacher`, `authorize(...roles)`

---

## Game System

### Template-Based Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Game Template                              │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐  │
│  │  manifest.json │  │ form-schema.json│  │   engine/          │  │
│  │  - name        │  │  - settings     │  │   - index.html     │  │
│  │  - version     │  │  - content      │  │   - game logic     │  │
│  │  - xp rules    │  │    (questions)  │  │                    │  │
│  └────────────────┘  └────────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Game Creation (Teacher)                      │
│  - References template                                            │
│  - Contains gameData: { settings: {...}, content: [...] }        │
│  - Status: draft/published/archived                               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Assignment                                 │
│  - Links games[] to classes[] or specific students[]             │
│  - Date range (startDate, endDate)                                │
│  - Attempt limit                                                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Game Result                                │
│  - Student's play record                                          │
│  - score, attemptNumber, xpAwarded                                │
│  - answers[] for per-question analysis                            │
└──────────────────────────────────────────────────────────────────┘
```

### Available Game Templates
1. **Quiz Game** - Multiple choice questions
2. **Memory Match** - Card matching game
3. **Word Builder** - Word construction
4. **Arithmetic Sprint** - Math problems
5. **Sentence Order** - Sentence ordering
6. **Target Sum** - Number addition game

### XP System
- XP awarded on assignment completion (configurable per template)
- `firstAttemptOnly` option for XP
- Levels calculated from XP thresholds
- Leaderboards per class/school

### Live Sessions (Multiplayer)
```
Teacher                              Students
   │                                    │
   ├──host-game──────────────►          │
   │                                    │
   │◄──room-created──────────           │
   │                                    │
   │           ◄──join-game─────────────┤
   │                                    │
   ├──player-joined────────────────────►│
   │                                    │
   ├──start-game───────────────────────►│
   │                                    │
   │           ◄──score-update──────────┤
   │                                    │
   ├──end-game─────────────────────────►│
```

---

## Finance System

### Payment Models

#### Per-Session Pricing
- Student purchases sessions (e.g., 10 sessions for X DZD)
- Balance decremented on attendance
- `Enrollment.balance` is source of truth

#### Per-Cycle Pricing
- Fixed period pricing (e.g., monthly)
- No session tracking needed

### Teacher Compensation
```javascript
teacherCut: {
  type: 'percentage' | 'fixed',
  value: Number  // % or fixed DZD per session
}
absenceRule: Boolean  // Deduct for absent students?
```

### Financial Data Flow
```
Payments ──┐
           ├──► MonthlyFinancialSummary
Expenses ──┤         │
           │         ├── totalIncome
TeacherPayouts ──────├── totalExpenses
           │         ├── teacherEarnings
EmployeeSalaries ────├── netBalance
                     └── isFrozen (lock for audit)
```

### Debt Management
- `StudentFinancial.debt`: Positive = student owes school
- Manual adjustments via `/api/payments/adjust-debt`
- Debt payment recording with receipt system

---

## Landing Page Builder

### Configuration Structure
```javascript
School.landingPage = {
  enabled: Boolean,
  publishedAt: Date,
  
  config: {
    theme: {
      primaryColor, secondaryColor, accentColor,
      fontFamily, heroStyle
    },
    seo: {
      title, description, keywords[],
      ogImage, favicon
    },
    sections: [
      { type: 'hero', enabled: true, order: 0, content: {...} },
      { type: 'about', enabled: true, order: 1, content: {...} },
      { type: 'services', enabled: true, order: 2, content: {...} },
      { type: 'gallery', enabled: true, order: 3, content: {...} },
      { type: 'testimonials', enabled: true, order: 4, content: {...} },
      { type: 'contact', enabled: true, order: 5, content: {...} }
    ]
  },
  
  revisions: [...]  // Version history for rollback
}
```

### Builder Tabs
1. **Content Tab** - Section content editing
2. **Design Tab** - Theme customization
3. **Media Tab** - Image uploads
4. **SEO Tab** - Meta tags, Open Graph
5. **Analytics Tab** - Page views, conversions
6. **Revisions Tab** - Version history

### Analytics Tracking
- Page views (unique visitors via fingerprinting)
- CTA clicks by section
- Contact form submissions
- Conversion rate calculation
- Device/browser breakdown

---

## Real-time Features

### Socket.IO Events

#### Server → Client
| Event | Description |
|-------|-------------|
| `room-created` | Confirms game room creation |
| `player-joined` | Player list update |
| `game-started` | Game session begins |
| `game-ended` | Session terminated |
| `live:session-count` | Participant count update |
| `leaderboard-update` | Live score updates |

#### Client → Server
| Event | Description |
|-------|-------------|
| `identify` | Client role/user identification |
| `host-game` | Teacher creates game room |
| `join-game` | Student joins room |
| `start-game` | Begin gameplay |
| `end-game` | Terminate session |
| `score-update` | Player score submission |
| `leave-game` | Player exits |

### State Management
```javascript
// server/realtimeState.js
liveGames = {
  [roomCode]: {
    players: [{ id, userId, name }],
    sessionId: ObjectId,
    gameCreationId: ObjectId,
    status: 'lobby' | 'running' | 'ended'
  }
}
```

---

## Client Application

### Page Structure

```
/                          → LandingPage (public marketing)
/login                     → Login
/tutorial                  → TutorialVideo
/admin/dashboard           → AdminDashboard
/manager/dashboard         → ManagerDashboard
/manager/finance           → Finance
/manager/landing-page-builder → LandingPageBuilder
/manager/inquiries         → InquiriesManager
/teacher/dashboard         → TeacherDashboard
/teacher/create-game/:id   → CreateGame
/teacher/host-lobby/:id    → HostLobby
/student/dashboard         → StudentDashboard
/student/play-game/:id     → PlayGame
/student/lobby/:roomCode   → PlayerLobby
/school/:schoolId          → PublicSchoolLandingPage
/profile                   → Profile (all roles)
```

### Context Providers
- **AuthContext**: User authentication state, login/logout
- **LanguageContext**: i18n, RTL support
- **SocketContext**: Socket.IO connection
- **TemplateContext**: Game template state

### Component Organization
```
src/components/
  ├── admin/          # Admin-specific components
  ├── manager/        # Manager dashboard components
  │   └── builder/    # Landing page builder tabs
  ├── teacher/        # Teacher components
  ├── student/        # Student components
  ├── finance/        # Finance-related components
  ├── shared/         # Reusable components
  └── layout/         # Layout components
```

---

## Deployment

### PM2 Configuration
```javascript
// ecosystem.config.js
{
  name: 'madrassaplay-api',
  script: 'server/server.js',
  instances: 1,
  autorestart: true,
  watch: false,
  max_memory_restart: '1G',
  env_production: {
    NODE_ENV: 'production',
    PORT: 5000
  }
}
```

### Environment Variables
```env
# Required
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://yourdomain.com

# Optional
ENABLE_SCHOOL_DELETION_CRON=true
BACKUP_ON_START=true
```

### Static File Serving
- Client build: `client/dist/` served by Nginx
- API: `http://localhost:5000` proxied by Nginx
- Uploads: `server/public/uploads/` served as `/uploads/`

---

## File Structure

```
madrassaplay/
├── client/                      # React frontend
│   ├── src/
│   │   ├── pages/               # Page components (22 files)
│   │   ├── components/          # UI components by role
│   │   ├── context/             # React contexts
│   │   ├── services/            # API services
│   │   └── utils/               # Utilities
│   ├── game-bundle/             # Game engine templates
│   │   ├── quiz-game/
│   │   ├── memory-match/
│   │   └── ...
│   └── public/                  # Static assets
│
├── server/                      # Node.js backend
│   ├── models/                  # Mongoose schemas (36 files)
│   ├── controllers/             # Request handlers (32 files)
│   ├── routes/                  # API routes (31 files)
│   ├── middleware/              # Auth, upload, permissions
│   ├── services/                # Business logic
│   │   ├── loggingService.js
│   │   ├── teacherPayoutService.js
│   │   ├── monthlyAggregationService.js
│   │   └── ...
│   ├── socket/                  # Socket.IO handlers
│   ├── config/                  # DB, migrations
│   └── public/uploads/          # Uploaded files
│
├── docs/                        # Documentation
│   ├── deployment/              # Deployment guides
│   ├── features/                # Feature documentation
│   └── archive/                 # Legacy docs
│
└── ecosystem.config.js          # PM2 configuration
```

---

## Key Business Rules

### Attendance & Session Consumption
1. When attendance is marked, `Enrollment.balance` is decremented
2. Balance cannot go below 0 (creates debt if StudentFinancial tracking enabled)
3. Undo attendance restores the balance

### Enrollment Lifecycle
```
create student → enroll in class → purchase sessions → 
mark attendance → balance decreases → renew or unenroll
```

### Assignment Attempt Gating
1. Check assignment status (not canceled/completed)
2. Check time window (startDate ≤ now < endDate)
3. Check attempt count vs limit
4. Block if any condition fails

### Teacher Payout Calculation
1. Sum student payments for teacher's classes in period
2. Apply teacher cut (percentage or fixed per session)
3. Track payments via TeacherPayout.payoutHistory[]

---

## Summary Statistics

| Category | Count |
|----------|-------|
| MongoDB Models | 36 |
| API Route Files | 31 |
| Controllers | 32 |
| Client Pages | 22 |
| Game Templates | 6 |
| User Roles | 7 |
| Socket Events | 12+ |
| Activity Log Actions | 50+ |

---

*Last Updated: Auto-generated comprehensive overview*
*Project: MadrassaPlay - Educational Gaming Platform for Private Schools*
