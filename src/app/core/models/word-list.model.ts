export interface WordList {
  id: string; // Unique ID for the list
  name: string; // Name of the list (e.g., "German Verbs", "Travel Phrases")
  wordIds: string[]; // Array of Word originalWord values belonging to this list
}