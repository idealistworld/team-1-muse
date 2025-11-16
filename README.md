# Muse - Get Inspired

## Team & Contribution

- Pierre: Built the initial versions for the creator list and the content list components
- Joyce: Built the feature functionality for the filtering and search for the content list
- Claire: Built the nav bar and inputted the logo for branding
- Chris: Built the edit post component and adjust other components for data and increased functionality

## What It Does

Our app (Muse) takes in data from sources of successful creators on LinkedIn (and in the future other business platforms) then allows end-user to adjust the original content to reflect their company. We use the OpenAI API for text generation and voice. The core use case is making content generation faster and more accurate as a GTM solution for small teams or solo founders.

## Tech Stack

### Frontend
- **Framework**: Next.js 15.5.4 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui, Radix UI
- **State Management**: React Hooks
- **Notifications**: react-toastify

### Backend
- **API**: Next.js Route Handlers (App Router)
- **Runtime**: Node.js
- **Authentication**: Supabase Auth (JWT)
- **Language**: TypeScript

### Database
- **Platform**: Supabase
- **Database**: PostgreSQL
- **ORM**: Supabase Client (@supabase/supabase-js)

### AI & External Services
- **AI Provider**: OpenAI
- **Models**:
  - GPT-4o-mini (text generation)
  - TTS-1 (text-to-speech)
- **Features**: Content editing, Q&A, voice synthesis

### Development Tools
- **Linting**: ESLint
- **Package Manager**: npm
- **Build Tool**: Next.js with Turbopack

## Database Schema

### Tables

#### creator_profiles

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| creator_id | bigint | NO | - | PRIMARY KEY |
| profile_url | text | NO | - | |
| platform | text | NO | - | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

#### creator_content

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| content_id | bigint | NO | - | PRIMARY KEY |
| creator_id | bigint | NO | - | FK → creator_profiles(creator_id) |
| post_url | text | NO | - | |
| post_raw | text | YES | - | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

#### user_profiles

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_id | uuid | NO | - | PRIMARY KEY |
| subscription_tier | text | NO | - | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

#### user_follows

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | - | FK → user_profiles(user_id), UNIQUE(user_id, creator_id) |
| creator_id | bigint | NO | - | FK → creator_profiles(creator_id), UNIQUE(user_id, creator_id) |
| created_at | timestamptz | NO | now() | |

---

#### user_posts

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| post_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| user_id | uuid | NO | - | FK → user_profiles(user_id) |
| raw_text | text | YES | - | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

#### post_inspirations

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | bigint | NO | - | PRIMARY KEY |
| post_id | uuid | NO | - | FK → user_posts(post_id), UNIQUE(post_id, content_id) |
| content_id | bigint | NO | - | FK → creator_content(content_id), UNIQUE(post_id, content_id) |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

#### user_media

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| user_media_id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| post_id | uuid | NO | - | FK → user_posts(post_id) |
| media_url | text | NO | - | |
| media_type | text | YES | - | |
| created_at | timestamptz | NO | now() | |
| updated_at | timestamptz | NO | now() | |

---

### Relationships

```
user_profiles
├─→ user_follows (user_id)
└─→ user_posts (user_id)

creator_profiles
├─→ creator_content (creator_id)
└─→ user_follows (creator_id)

user_posts
├─→ post_inspirations (post_id)
└─→ user_media (post_id)

creator_content
└─→ post_inspirations (content_id)
```

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in your credentials:

   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:

   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
   - `OPEN_AI_API_KEY` - Your OpenAI API key

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## API Endpoints

### Creator Endpoints

#### `GET /api/creators/get-all-creators`

Retrieves all creator profiles from the database.

**Request:**

- Method: `GET`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`

**Response:**

```json
{
  "data": [
    {
      "creator_id": 1,
      "profile_url": "https://linkedin.com/in/username",
      "platform": "LinkedIn",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**

- `200`: Success
- `401`: Unauthorized
- `500`: Server error

#### `GET /api/creators/get-followed-creators`

Returns all creators that the authenticated user follows.

**Request:**

- Method: `GET`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
- Query Parameters:
  - `user_id` (required): UUID of the user

**Example:**

```
GET /api/creators/get-followed-creators?user_id=abc123
```

**Response:**

```json
{
  "data": [
    {
      "creator_id": 1,
      "profile_url": "https://linkedin.com/in/username",
      "platform": "LinkedIn",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**

- `200`: Success
- `400`: Missing or invalid user_id
- `401`: Unauthorized
- `500`: Server error

#### `POST /api/creators/follow`

Follow a creator.

**Request:**

- Method: `POST`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:

```json
{
  "creatorId": 1
}
```

**Response:**

```json
{
  "data": {
    "user_id": "abc123",
    "creator_id": 1,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "isFollowed": true
}
```

**Status Codes:**

- `200`: Success
- `400`: Missing or invalid creatorId
- `401`: Unauthorized
- `500`: Server error

#### `DELETE /api/creators/unfollow`

Unfollow a creator.

**Request:**

- Method: `DELETE`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:

```json
{
  "creatorId": 1
}
```

**Response:**

```json
{
  "data": {
    "user_id": "abc123",
    "creator_id": 1
  },
  "isFollowed": false
}
```

**Status Codes:**

- `200`: Success
- `400`: Missing or invalid creatorId
- `401`: Unauthorized
- `500`: Server error

### Content Endpoints

#### `GET /api/posts/get-all-posts`

Retrieves all creator content posts.

**Request:**

- Method: `GET`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`

**Response:**

```json
{
  "data": [
    {
      "content_id": 1,
      "creator_id": 1,
      "post_url": "https://linkedin.com/posts/...",
      "post_raw": "Post content text...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

**Status Codes:**

- `200`: Success
- `401`: Unauthorized
- `500`: Server error

### AI Endpoints

#### `POST /api/ai/generate-edit`

Generate AI-powered content edits based on user feedback.

**Request:**

- Method: `POST`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:

```json
{
  "text": "Original content to edit",
  "prompt": "Make it more professional",
  "context": {
    "industry": "Technology",
    "tone": "professional"
  },
  "conversationHistory": [
    { "role": "user", "content": "Previous message" },
    { "role": "assistant", "content": "Previous response" }
  ]
}
```

**Response:**

```json
{
  "originalText": "Original content to edit",
  "suggestedText": "Edited content...",
  "additions": 5,
  "deletions": 3
}
```

**Status Codes:**

- `200`: Success
- `400`: Missing required text field
- `401`: Unauthorized
- `500`: Server error

#### `POST /api/ai/ask-question`

Ask AI questions about content with conversation history support.

**Request:**

- Method: `POST`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:

```json
{
  "postContent": "Content to ask about",
  "conversationHistory": [
    { "role": "user", "content": "What is this about?" },
    { "role": "assistant", "content": "This content discusses..." }
  ]
}
```

**Response:**

```json
{
  "ready": false,
  "question": "What industry does your company operate in?"
}
```

OR (when ready to generate):

```json
{
  "ready": true
}
```

**Note:** The AI will ask 3-5 questions to gather context before returning `ready: true`

**Status Codes:**

- `200`: Success
- `400`: Missing required postContent field
- `401`: Unauthorized
- `500`: Server error

#### `POST /api/ai/text-to-speech`

Convert text to speech using AI voice synthesis.

**Request:**

- Method: `POST`
- Authentication: Required (Bearer token)
- Headers:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`
- Body:

```json
{
  "text": "Text to convert to speech",
  "voice": "alloy"
}
```

**Note:** Voice parameter is optional and defaults to "alloy"

**Response:**

- Content-Type: `audio/mpeg`
- Body: Binary audio data (MP3 format)

**Status Codes:**

- `200`: Success (returns audio file)
- `400`: Missing required text field
- `401`: Unauthorized
- `500`: Server error

## Mock Data

As of now we use real data for both our creators and content. It's not 100% complete and some of the endpoints need to be updated, but the data displayed is real.
