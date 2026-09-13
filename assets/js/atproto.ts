import { BskyAgent } from '@atproto/api';

// BookHive lexicon types (placeholder - need actual lexicon)
export interface BookHiveBook {
  $type: string;
  title: string;
  author: string;
  description?: string;
  cover?: string;
  // Add more fields from actual BookHive lexicon
}

export interface BookHiveProfile {
  $type: string;
  books?: BookHiveBook[];
}

// Initialize AT Protocol agent
export const createAgent = (service: string = 'https://bsky.bookhive.app') => {
  return new BskyAgent({ service });
};

// Fetch books for a user
export const getUserBooks = async (agent: BskyAgent, handle: string) => {
  try {
    // Need actual BookHive lexicon record type
    // This is placeholder - BookHive might use app.bsky.graph.list or custom
    const profile = await agent.getProfile({ actor: handle });
    return profile;
  } catch (err) {
    console.error('Failed to fetch books:', err);
    return null;
  }
};
