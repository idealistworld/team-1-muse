export interface ContentPost {
  id: number;
  title: string;
  author: string;
  timeAgo: string;
  isHighlighted: boolean;
  creatorId: number;
  postUrl?: string;
  postRaw?: string;
}

export interface Profile {
  id: number;
  name: string;
  connections: string;
}

export interface CreatorProfile {
  creator_id: number;
  profile_url: string;
  platform: string;
  created_at: string;
  updated_at: string;
}

export interface CreatorContent {
  content_id: number;
  creator_id: number;
  post_url: string;
  post_raw?: string;
  created_at: string;
  updated_at: string;
}
