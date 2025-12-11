/**
 * Client for scraper API endpoints
 */

import type { ApiMaestroPost } from "./linkedinScraperService";

export interface ScrapeLinkedInRequest {
  profileUrls: string[];
}

export interface ScrapeLinkedInResponse {
  success: boolean;
  postsScraped?: number;
  posts?: ApiMaestroPost[];
  error?: string;
  urlsSent?: string[];
}

class ScraperClient {
  async scrapeLinkedInProfiles(profileUrls: string[]): Promise<ScrapeLinkedInResponse> {
    const response = await fetch("/api/scrape/linkedin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileUrls }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    return response.json();
  }
}

export const scraperClient = new ScraperClient();
