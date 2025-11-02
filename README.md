# Muse - Get Inspired

## Team & Contribution

- Pierre: Built the initial versions for the creator list and the content list components
- Joyce: Built the feature functionality for the filtering and search for the content list
- Claire: Built the nav bar and inputted the logo for branding
- Chris: Built the edit post component and adjust other components for data and increased functionality

## What It Does

Our app (Muse) takes in data from sources of successful creators on LinkedIn (and in the future other business platforms) then allows end-user to adjust the original content to reflect their company. We use the OpenAI API for text generation and voice. The core use case is making content generation faster and more accurate as a GTM solution for small teams or solo founders.

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

## Mock Data

As of now we use real data for both our creator and content. It's not 100% complete and some of the endpoints need to be updated, but the data displayed is real.
