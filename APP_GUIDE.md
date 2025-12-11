# Muse - Application Guide

## Table of Contents
- [Overview](#overview)
- [User Journey](#user-journey)
- [Page-by-Page Breakdown](#page-by-page-breakdown)
- [Key Features](#key-features)
- [Architecture Flow](#architecture-flow)

---

## Overview

**Muse** is an AI-powered content creation platform that helps you create engaging LinkedIn posts by learning from successful creators. The app analyzes high-performing content, gathers context about your business, and generates personalized posts tailored to your voice and industry.

### Core Value Proposition
1. **Learn from the best** - Browse content from top LinkedIn creators
2. **Personalize with AI** - AI learns your business context through conversation
3. **Create faster** - Generate, edit, and refine posts with AI assistance
4. **Iterate confidently** - Save drafts, track changes, and perfect your content

---

## User Journey

### First-Time User Flow
```
1. Sign In (Supabase Auth)
   ↓
2. Personal Info → Fill out business context (voice-enabled)
   ↓
3. Creators → Follow creators you admire
   ↓
4. Content Library → Browse their posts, identify "bangers"
   ↓
5. Create → Highlight inspiration posts, generate your content
   ↓
6. Notebook → Save drafts, refine over time
```

### Returning User Flow
```
1. Sign In
   ↓
2. Content Library → Discover new top-performing posts
   ↓
3. Create → Generate content from inspiration
   ↓
4. AI Assistant → Refine with conversational edits
   ↓
5. Notebook → Manage drafts and published posts
```

---

## Page-by-Page Breakdown

### 1. 🔐 **Login Page** (`/login`)

**Purpose:** Authentication gateway

**What It Does:**
- Handles user authentication via Supabase Auth
- Supports email/password and OAuth providers
- Creates user profile on first sign-in
- Redirects to dashboard on success

**Technical Stack:**
- Supabase Auth (JWT tokens)
- Server-side session management
- Protected routes with middleware

**File Location:** `app/login/page.tsx`

---

### 2. 📝 **Personal Info** (`/dashboard/personal-info`)

**Purpose:** Build your AI context profile through conversational input

**What It Does:**
- Collects 40+ data points about your business
- Categories: Company, Role, Products, Audience, Goals, Voice
- **Voice Mode**: Speak naturally to fill out fields
- Auto-saves every change (1-second debounce)
- AI extracts structured data from voice transcripts

**Key Features:**
- ✅ Real-time speech-to-text (Web Speech API)
- ✅ Auto-save with debouncing
- ✅ Progress tracking (% complete)
- ✅ Collapsible categories
- ✅ AI-powered field extraction

**How It Works:**
1. User clicks "Voice Mode"
2. Speaks naturally: *"I run a SaaS company called Acme Corp that helps small businesses manage inventory. We're targeting restaurants and retail stores..."*
3. AI processes transcript and fills relevant fields:
   - Company Name → "Acme Corp"
   - Industry → "SaaS"
   - Target Audience → "Small businesses, restaurants, retail stores"
   - Product Description → "Inventory management software"
4. User reviews/edits auto-filled data
5. Changes auto-save to `user_data` table (JSONB)

**Architecture:**
- **ViewModel:** `usePersonalInfoViewModel` - Manages form state, auto-save
- **Service:** `userProfileService` - Business logic for saving/loading
- **Repository:** `userDataRepository` - Database operations on `user_data` table
- **API Route:** `/api/extract-field-value` - AI field extraction

**Tech:**
- Web Speech API (voice input)
- Audio visualization (Web Audio API)
- OpenAI GPT-4o-mini (field extraction)

**File Locations:**
- View: `app/dashboard/personal-info/page.tsx`
- ViewModel: `app/dashboard/personal-info/personalInfoViewModel.ts`
- Data definitions: `app/dashboard/personal-info/personalInfoDataPoints.ts`

---

### 3. 👥 **Creators** (`/dashboard/creators`)

**Purpose:** Discover and follow top LinkedIn creators

**What It Does:**
- Browse all available creator profiles
- Follow/unfollow creators
- Search by name
- Filter: All, Following, Discover
- Sort by: Recommended, Recently followed, Most posts, Highest reactions, Name A-Z

**Key Metrics:**
- Post count per creator
- Average reactions (likes + comments)
- Platform (LinkedIn)
- Profile URL

**How Following Works:**
1. User clicks "Follow" on a creator
2. Optimistic UI update (instant feedback)
3. API call to `/api/creators/follow`
4. Record added to `user_follows` table
5. Creator's posts appear in Content Library
6. If error, rollback UI change + show toast

**Architecture:**
- **ViewModel:** `useCreatePostViewModel` (shared with Create page)
- **Service:** `creatorService` - Follow/unfollow logic
- **Repository:** `creatorRepository`, `userFollowRepository`
- **API Routes:** `/api/creators/follow`, `/api/creators/unfollow`

**File Locations:**
- View: `app/dashboard/creators/page.tsx`
- Component: `app/dashboard/components/CreatorProfiles/ProfileCard.tsx`

---

### 4. 📚 **Content Library** (`/dashboard/content`)

**Purpose:** Browse high-performing posts from creators you follow

**What It Does:**
- Displays all LinkedIn posts from followed creators
- Performance analysis: Identifies "bangers" and "mid" posts
- Infinite scroll (20 posts per page)
- Filter by performance: All, Bangers (1.5x+ avg), Mid (<0.7x avg)
- Sort by: Newest, Oldest, Most reactions, Most comments, Most reposts, Biggest outperformers
- Add new creators via LinkedIn URL scraping

**Performance Multiplier Logic:**
```typescript
// "Banger" = Post that significantly outperforms creator's average
avgReactions = creator's average reactions per post
postReactions = this specific post's reactions
multiplier = postReactions / avgReactions

if (multiplier >= 1.5) → 🔥 Banger
if (multiplier < 0.7) → 📉 Mid
```

**Example:**
- Creator's average: 100 reactions/post
- This post: 200 reactions
- Multiplier: 2.0x → Labeled as "Banger"

**Add Creator Flow:**
1. User pastes LinkedIn profile URL
2. API scrapes profile using Apify actor
3. Fetches 10-20 recent posts
4. Stores in `creator_profiles` + `creator_content` tables
5. Auto-follows creator for user
6. Shows success: "Added creator and fetched 15 posts!"

**Architecture:**
- **ViewModel:** `useContentPageViewModel` - State, filtering, sorting
- **Service:** `contentService` - Post transformation, aggregation
- **Service:** `contentSortingService` - Filter/sort algorithms
- **Service:** `linkedinScraperService` - LinkedIn scraping orchestration
- **Repository:** `contentRepository`, `creatorRepository`
- **API Route:** `/api/scrape/linkedin`

**Key Optimizations:**
- Loads 1000 posts at once (pagination at DB level)
- Client-side filtering/sorting (fast)
- Infinite scroll for UX (slice array)

**File Locations:**
- View: `app/dashboard/content/page.tsx`
- ViewModel: `app/dashboard/content/contentPageViewModel.ts`
- Service: `services/contentService.ts`
- Service: `services/contentSortingService.ts`

---

### 5. ✍️ **Create** (`/dashboard/create`)

**Purpose:** Your AI-powered content creation workspace

**What It Does:**
This is the heart of the app - a three-panel workspace where magic happens:

#### **Left Panel: Content Feed**
- Browse posts from creators you follow
- Search/filter content
- **"Highlight"** posts for inspiration (yellow border)
- Click post to expand and read full text
- Selected posts become inspiration for AI generation

#### **Center Panel: Content Editor**
- Main text editor for your post
- AI generates initial draft from highlighted posts
- Real-time character/word count
- **Edit History** - Track all AI-suggested changes
- Save snapshot to Notebook
- Text-to-speech (hear your post read aloud)

#### **Right Panel: AI Assistant**
- **Conversational editing**: "Make this more professional"
- **Context-aware**: Uses your Personal Info data
- **Suggested Edits Card**: Get AI recommendations
- **Edit history**: See before/after comparisons

**The AI Generation Flow:**

**Step 1: Highlight Inspiration**
```
User highlights 2-3 high-performing posts
↓
System: "Would you like to use these as inspiration?"
→ Option A: "Use as inspiration" (triggers AI flow)
→ Option B: "No, I'll write from scratch"
```

**Step 2: Context Gathering (First-Time Only)**
```
If user's Personal Info is empty:
  AI asks 3-5 questions via modal:
  - "What industry does your company operate in?"
  - "Who is your target audience?"
  - "What tone do you want? (Professional, casual, etc.)"

User answers conversationally
↓
Responses saved to Personal Info for future use
```

**Step 3: Content Generation**
```
AI receives:
- Highlighted posts (inspiration)
- User context (from Personal Info)
- Conversation history (if any)

AI generates:
- Original post in user's voice
- Adapted hooks/structure from inspiration
- Personalized to user's industry/audience

Output appears in editor
```

**Step 4: Iterative Refinement**
```
User: "Make the opening line more punchy"
↓
AI: Generates new version
↓
Edit History shows:
  ❌ Old: "I've been thinking about..."
  ✅ New: "Here's the truth nobody talks about:"
↓
User: Accept or reject change
```

**Architecture:**
- **ViewModel:** `useCreatePostViewModel` - Feed state, highlights, follow/unfollow
- **ViewModel:** `useContentEditorViewModel` - Editor state, AI generation, context modal
- **ViewModel:** `useSuggestedEditsViewModel` - AI edit suggestions
- **Service:** `contentService` - Fetch content feed
- **Service:** `userPostService` - Save/load drafts
- **API Routes:**
  - `/api/ai/ask-question` - Context gathering
  - `/api/ai/generate-edit` - Content generation/editing
  - `/api/ai/text-to-speech` - Voice synthesis
  - `/api/ai/analyze-post` - Post analysis

**Key Features:**
- ✅ Multi-post highlighting
- ✅ Context gathering modal
- ✅ Real-time AI editing
- ✅ Edit history with diff view
- ✅ Snapshot saving
- ✅ Text-to-speech playback
- ✅ Load drafts from Notebook

**File Locations:**
- View: `app/dashboard/create/page.tsx`
- ViewModels: `app/dashboard/create/*.tsx`
- Components: `app/dashboard/create/components/*`
- Edit History: `app/dashboard/components/EditHistory/EditHistory.tsx`

---

### 6. 📓 **Notebook** (`/dashboard/notebook`)

**Purpose:** Your draft management system

**What It Does:**
- Stores all saved snapshots from Create workspace
- Two-panel layout: Draft list (left) + Editor (right)
- Search drafts by title or content
- Edit drafts inline
- Quick save (manual)
- Delete drafts with confirmation
- "Edit in Create" - Opens draft in full Create workspace

**Snapshot System:**
```
Create page → "Save snapshot" button
↓
Prompt: "Title this snapshot"
User: "Q4 Product Launch Post - Draft 1"
↓
Saved to user_posts table:
  - post_id: UUID
  - user_id: User's ID
  - raw_text: Post content
  - title: User-provided title
  - updated_at: Timestamp

Shows in Notebook sorted by most recent
```

**Edit vs Create:**
- **Notebook Edit:** Quick inline editing, manual save
- **Create Edit:** Full AI workspace, load draft as starting point

**Draft Lifecycle:**
```
1. Create → Save snapshot → Notebook (draft)
2. Notebook → Edit inline → Save
3. Notebook → "Edit in Create" → Full AI editing
4. Notebook → Delete (when published externally)
```

**Architecture:**
- **ViewModel:** `useNotebookViewModel` - Draft state, search, CRUD
- **Service:** `userPostService` - Draft operations
- **Repository:** `userPostRepository` - `user_posts` table

**Key Features:**
- ✅ Search across titles and content
- ✅ Inline editing
- ✅ Draft metadata (word count, last updated)
- ✅ Quick navigation
- ✅ Integration with Create workspace

**File Locations:**
- View: `app/dashboard/notebook/page.tsx`
- ViewModel: `app/dashboard/notebook/notebookViewModel.ts`

---

## Key Features

### 🎯 **AI Content Generation**

**Context-Aware Generation:**
- Uses your Personal Info profile
- Adapts tone, industry language, and audience targeting
- Learns from high-performing inspiration posts

**How AI Understands Context:**
```javascript
User Profile (from Personal Info):
{
  company_name: "Acme Corp",
  industry: "SaaS",
  target_audience: "Small business owners",
  product: "Inventory management software",
  tone: "Professional but approachable"
}

Highlighted Posts:
[
  "Post 1: Hook + Story + CTA structure",
  "Post 2: Data-driven with statistics",
  "Post 3: Personal experience narrative"
]

AI Prompt:
"Generate a LinkedIn post for {company_name} in the {industry} space.
Target audience: {target_audience}
Product: {product}
Tone: {tone}

Use these high-performing posts as structural inspiration:
{Highlighted Posts}

Create an original post that:
1. Uses proven hooks from inspiration
2. Speaks directly to target audience
3. Incorporates company/product naturally
4. Matches desired tone"
```

**Result:** Original content that feels authentic to your brand while using proven engagement patterns.

---

### 🎤 **Voice Mode (Personal Info)**

**How It Works:**
1. **Activation:** Click "Start Voice Mode"
2. **Permission:** Browser requests microphone access
3. **Audio Analysis:** Real-time visualization shows you're being heard
4. **Speech Recognition:** Web Speech API transcribes in real-time
5. **AI Processing:** Transcript sent to OpenAI
6. **Field Extraction:** AI identifies field-value pairs
7. **Auto-Fill:** Fields populate automatically
8. **User Review:** Edit any auto-filled data

**Example Transcript:**
> "Hey, so I'm the founder of TechStart Solutions. We're a B2B SaaS company, been around for 3 years. We mainly work with enterprise clients in the healthcare space, helping them manage patient data more efficiently. My role is CEO but I also handle a lot of the sales and marketing. Our product is a HIPAA-compliant data platform. Typical customer? Large hospitals and clinic networks. I'd say our voice is professional but not stuffy - we want to be trustworthy but still approachable."

**AI Extracts:**
- Company Name: "TechStart Solutions"
- Industry: "B2B SaaS"
- Company Age: "3 years"
- Target Audience: "Enterprise clients in healthcare"
- Product Description: "HIPAA-compliant data platform"
- Typical Customer: "Large hospitals and clinic networks"
- Role: "CEO"
- Voice: "Professional but approachable, trustworthy"

**Technical Implementation:**
- Browser API: `SpeechRecognition` (Chrome, Edge, Safari)
- Continuous mode: Transcribes until user stops
- Interim results: Shows text as you speak
- Final results: Sent to AI for processing
- Fallback: Manual text input if browser unsupported

---

### 🔥 **Performance Analysis (Content Library)**

**The "Banger" Algorithm:**

Every creator has an average engagement baseline:
```
Creator's Average = (Sum of all reactions) / (Number of posts)
```

Each post is compared to this average:
```
Post Multiplier = (Post reactions) / (Creator's average)
```

**Categories:**
- 🔥 **Banger** (multiplier ≥ 1.5): Significantly outperformed average
- 📊 **Normal** (0.7 ≤ multiplier < 1.5): Typical performance
- 📉 **Mid** (multiplier < 0.7): Underperformed

**Why This Matters:**
- **For learning:** Study what makes "bangers" work
- **For inspiration:** Use high-performing structures
- **For filtering:** Focus on proven content

**Example Data:**
```
Creator: @sarahjohnson (Tech CEO)
Total Posts: 50
Total Reactions: 10,000
Average: 200 reactions/post

Post A: 450 reactions → 2.25x avg → 🔥 BANGER
Post B: 180 reactions → 0.9x avg → 📊 Normal
Post C: 80 reactions → 0.4x avg → 📉 Mid
```

---

### ✏️ **Edit History & Version Control**

**How It Works:**
1. User requests AI edit: *"Make this more concise"*
2. AI generates new version
3. System creates diff comparison:
   - ❌ Red = Deleted text
   - ✅ Green = Added text
4. User sees side-by-side:
   - Left: Original
   - Right: Suggested edit
5. User accepts or rejects
6. History saved in UI state

**Edit History Stack:**
```javascript
[
  {
    timestamp: "2024-01-15 10:30 AM",
    prompt: "Make this more professional",
    before: "Hey everyone! Check this out...",
    after: "I'm excited to share...",
    accepted: true
  },
  {
    timestamp: "2024-01-15 10:35 AM",
    prompt: "Add a call-to-action",
    before: "...that's my take on it.",
    after: "...that's my take on it. What's yours?",
    accepted: true
  }
]
```

**Benefits:**
- See exactly what changed
- Undo by reverting to earlier version
- Learn what prompts work best
- Maintain control over voice

---

### 💾 **Auto-Save System**

**Personal Info Auto-Save:**
- **Trigger:** Any field change
- **Debounce:** 1 second delay
- **Method:** Debounced `useEffect` hook
- **Storage:** `user_data` table (JSONB column)
- **Feedback:** Toast notification on completion

```typescript
useEffect(() => {
  const timer = setTimeout(async () => {
    if (hasChanges) {
      await userProfileService.savePersonalInfo(userId, formData);
      // Shows "Saved!" toast
    }
  }, 1000); // 1-second debounce

  return () => clearTimeout(timer);
}, [formData]); // Re-runs on every change
```

**Notebook Manual Save:**
- **Trigger:** User clicks "Save" button
- **Method:** Explicit API call
- **Storage:** `user_posts` table
- **Feedback:** "Draft saved" toast

**Why Different Approaches?**
- **Personal Info:** Small changes, auto-save prevents data loss
- **Notebook:** Content-heavy, user controls when to commit changes

---

## Architecture Flow

### Request Lifecycle Example: "Generate Content"

```
┌─────────────────────────────────────────┐
│  USER ACTION                            │
│  Clicks "Use as inspiration"            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  VIEW (create/page.tsx)                 │
│  - Handles button click                 │
│  - Calls ViewModel method               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  VIEWMODEL (contentEditorViewModel)     │
│  - Gathers highlighted posts            │
│  - Checks if context exists             │
│  - Opens context modal OR generates     │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  SERVICE (userProfileService)           │
│  - Loads user's Personal Info           │
│  - Formats for AI prompt                │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  HTTP CLIENT (aiClient)                 │
│  - Sends request to backend             │
│  POST /api/ai/generate-edit             │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  API ROUTE (/api/ai/generate-edit)      │
│  - Authenticates request                │
│  - Validates input                      │
│  - Calls OpenAI service                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  SERVICE (openaiService)                │
│  - Builds AI prompt                     │
│  - Calls OpenAI API                     │
│  - Processes response                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  EXTERNAL API (OpenAI GPT-4o-mini)      │
│  - Generates content                    │
│  - Returns suggested text               │
└──────────────┬──────────────────────────┘
               │
               │ (Response bubbles back up)
               │
┌──────────────▼──────────────────────────┐
│  VIEW (create/page.tsx)                 │
│  - Displays generated content           │
│  - Updates editor                       │
│  - Shows edit history                   │
└─────────────────────────────────────────┘
```

### Data Flow: "Follow Creator"

```
┌─────────────────────────────────────────┐
│  USER ACTION                            │
│  Clicks "Follow" button                 │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  VIEW (creators/page.tsx)               │
│  - Optimistic UI update (instant)       │
│  - Calls ViewModel method               │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  VIEWMODEL (createPostViewModel)        │
│  - Updates UI state                     │
│  - Calls HTTP client                    │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  HTTP CLIENT (creatorClient)            │
│  - POST /api/creators/follow            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  API ROUTE (/api/creators/follow)       │
│  - Authenticates user                   │
│  - Validates creatorId                  │
│  - Calls service                        │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  SERVICE (creatorService)               │
│  - Business logic                       │
│  - Calls repositories                   │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  REPOSITORY (userFollowRepository)      │
│  - Upsert into user_follows table       │
│  - Returns relationship data            │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│  DATABASE (Supabase PostgreSQL)         │
│  INSERT INTO user_follows               │
│  (user_id, creator_id, created_at)      │
└──────────────┬──────────────────────────┘
               │
               │ (Success response)
               │
┌──────────────▼──────────────────────────┐
│  VIEW (creators/page.tsx)               │
│  - Confirms optimistic update           │
│  OR                                     │
│  - Rolls back on error + shows toast    │
└─────────────────────────────────────────┘
```

---

## Technical Implementation Details

### State Management Strategy

**Global State (Shared Across Pages):**
- None - Each page manages its own state via ViewModels
- User authentication state via `useAuth` hook (Supabase)

**Page State (ViewModel Pattern):**
- Each page has dedicated ViewModel(s)
- ViewModels return clean interface:
  ```typescript
  {
    // Data
    posts: ContentPost[],
    creators: Profile[],

    // UI State
    isLoading: boolean,
    error: string | null,

    // Actions
    handleSubmit: () => Promise<void>,
    handleDelete: (id: string) => void,
  }
  ```

**Benefits:**
- Predictable data flow
- Easy testing (mock ViewModel)
- Reusable business logic
- Separation of concerns

### Optimistic Updates

**Pattern Used For:**
- Following/unfollowing creators
- Highlighting posts
- Accepting AI edits

**Implementation:**
```typescript
async function followCreator(creatorId: number) {
  // 1. Save current state (for rollback)
  const previousState = creatorProfiles;

  // 2. Update UI immediately
  setCreatorProfiles(prev =>
    prev.map(p =>
      p.id === creatorId
        ? { ...p, isFollowed: true }
        : p
    )
  );

  try {
    // 3. Make API call
    await creatorClient.followCreator(creatorId);
    toast.success("Creator followed");
  } catch (error) {
    // 4. Rollback on error
    setCreatorProfiles(previousState);
    toast.error("Failed to follow creator");
  }
}
```

**Why?**
- Instant feedback (feels faster)
- Better perceived performance
- Handles errors gracefully

### Debouncing Strategy

**Used For:**
- Auto-save in Personal Info
- Search queries
- Resize handlers

**Implementation:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    // Execute after delay
    performExpensiveOperation();
  }, delayMs);

  return () => clearTimeout(timer); // Cleanup
}, [dependencies]);
```

**Benefits:**
- Reduces API calls
- Improves performance
- Better UX (not interrupting typing)

### Error Handling Philosophy

**Layers of Error Handling:**

1. **Repository Layer** - Throws errors
   ```typescript
   if (error) throw new Error(error.message);
   ```

2. **Service Layer** - Transforms errors
   ```typescript
   try {
     await repository.create(data);
   } catch (error) {
     throw new Error("Failed to create post");
   }
   ```

3. **ViewModel Layer** - Handles UI state
   ```typescript
   try {
     await service.doSomething();
   } catch (error) {
     setError(error.message);
     toast.error(error.message);
   }
   ```

4. **API Route Layer** - Returns HTTP codes
   ```typescript
   try {
     const result = await service.process();
     return Response.json(result, { status: 200 });
   } catch (error) {
     logger.error("API error", error);
     return Response.json(
       { error: "Internal server error" },
       { status: 500 }
     );
   }
   ```

---

## User Experience Patterns

### Loading States

**Types:**
- **Full-page loading:** Initial data fetch (spinner overlay)
- **Skeleton loading:** Placeholder components
- **Button loading:** Spinner in button ("Saving...")
- **Inline loading:** Small spinner next to text

**Implementation:**
```typescript
{isLoading ? (
  <Loader2 className="w-6 h-6 animate-spin" />
) : (
  <ContentComponent data={data} />
)}
```

### Empty States

**Every list has an empty state:**
- Content Library: "No posts yet. Add a creator!"
- Notebook: "Capture your first idea"
- Creators: "Discover creators to follow"

**Pattern:**
- Icon
- Heading
- Description
- Call-to-action button

### Toast Notifications

**When to use:**
- ✅ Success actions: "Draft saved", "Creator followed"
- ❌ Errors: "Failed to load posts"
- ℹ️ Info: "Draft loaded from Notebook"

**Implementation:**
```typescript
import { toast } from "react-toastify";

toast.success("Operation successful");
toast.error("Something went wrong");
toast.info("Here's some information");
```

### Modals & Dialogs

**Used For:**
- Context gathering (first-time content generation)
- Post expansion (full post view)
- Choice dialogs ("Use as inspiration?")
- Confirmations ("Delete this draft?")

---

## Performance Optimizations

### Content Library
- **Batch loading:** Fetch 1000 posts at once
- **Client-side filtering:** No server round-trips
- **Memoization:** Cached filter/sort results
- **Infinite scroll:** Progressive rendering

### Create Workspace
- **Lazy loading:** Load content feed on demand
- **Debounced search:** Reduce filter operations
- **Optimistic UI:** Instant highlighting feedback

### Personal Info
- **Debounced save:** Batch updates to reduce writes
- **Local state:** Changes only in memory until saved
- **Progressive enhancement:** Voice mode optional

---

## Security & Authentication

### Authentication Flow
```
1. User signs in → Supabase Auth
2. JWT token stored in httpOnly cookie
3. Middleware validates token on every request
4. Token passed to API routes
5. API routes verify token
6. User ID extracted from token
7. Database queries scoped to user ID
```

### Row-Level Security (RLS)
- Supabase RLS policies enforce data access
- Users can only see their own drafts
- Users can only modify their own follows
- Public creator data accessible to all

### API Security
- All routes require authentication
- User ID from JWT (not request body)
- Input validation on all endpoints
- Rate limiting (via Vercel)

---

## Data Models

### Key Relationships

```
User Profile (user_profiles)
├── Has many → User Posts (user_posts)
├── Has many → User Follows (user_follows)
└── Has one → User Data (user_data) [JSONB]

Creator Profile (creator_profiles)
├── Has many → Creator Content (creator_content)
└── Has many → User Follows (user_follows)

User Post (user_posts)
└── Inspired by many → Creator Content (post_inspirations)
```

### JSONB Storage (user_data)

**Why JSONB?**
- Flexible schema (40+ dynamic fields)
- No migrations for new fields
- Queryable with PostgreSQL
- Fast lookups

**Structure:**
```json
{
  "company_name": "Acme Corp",
  "industry": "SaaS",
  "target_audience": "Small businesses",
  "product_description": "Inventory management",
  "tone": "Professional but approachable",
  ...
}
```

---

## Future Enhancements

### Planned Features
- [ ] Schedule posts for publishing
- [ ] Multi-platform support (Twitter, Instagram)
- [ ] Team collaboration
- [ ] Analytics dashboard (track post performance)
- [ ] Chrome extension (save posts while browsing)
- [ ] Mobile app
- [ ] A/B testing for post variations

### Architecture Improvements
- [ ] Unit tests for services
- [ ] Integration tests for API routes
- [ ] E2E tests with Playwright
- [ ] Storybook for component library
- [ ] Performance monitoring
- [ ] Error tracking (Sentry)

---

## Troubleshooting

### Common Issues

**Voice mode not working:**
- Check browser compatibility (Chrome, Edge, Safari only)
- Allow microphone permissions
- Ensure HTTPS (required for mic access)

**Posts not loading:**
- Check network tab for API errors
- Verify Supabase connection
- Ensure user is authenticated

**Auto-save not triggering:**
- Check if changes were actually made
- Look for JavaScript errors in console
- Verify debounce delay (1 second)

**AI generation slow:**
- OpenAI API response times vary
- Longer posts take more time to generate
- Check API rate limits

---

## Contributing

### Code Style
- TypeScript strict mode
- ESLint configuration enforced
- Prettier for formatting
- Component naming: PascalCase
- File naming: camelCase for utilities, PascalCase for components

### Architecture Rules
1. **Views** only render UI - no business logic
2. **ViewModels** manage state + UI logic - call Services
3. **Services** contain business logic - call Repositories
4. **Repositories** only do database queries
5. **API Routes** authenticate, validate, call Services

### Pull Request Checklist
- [ ] Follows MVVM + Repository pattern
- [ ] No direct database queries outside repositories
- [ ] No business logic in Views
- [ ] Error handling at all layers
- [ ] TypeScript types defined
- [ ] Manual testing performed

---

## Support

For questions or issues:
- Check [CLAUDE.md](./CLAUDE.md) for architecture details
- Review [README.md](./README.md) for setup instructions
- Check code comments for implementation details

---

**Built with ❤️ by Team Muse**
