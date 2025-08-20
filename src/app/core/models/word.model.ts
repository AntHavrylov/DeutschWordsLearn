export interface Word {
  id: string;
  originalWord: string;
  translation: string;
  description?: string;
  wordType: WordType;
  article?: ArticleType;
  preposition?: string;
  kasus?: Kasus;
  reflexive?: boolean;
  learnStatus?: number; // Added learnStatus
  sources?: string[]; // Added this line
}

export enum WordType {
  Nomen = 'Nomen',
  Verb = 'Verb',
  Adjektiv = 'Adjektiv',
  Adverb = 'Adverb',
  Pronomen = 'Pronomen',
  Praeposition = 'Präposition',
  Konjunktion = 'Konjunktion',
  Interjektion = 'Interjektion',
  Numerale = 'Numerale',
  Artikel = 'Artikel',
  Other = 'Other'
}

export enum ArticleType {
  Der = 'der',
  Die = 'die',
  Das = 'das',
  Plural = 'die (Plural)',
  None = 'None'
}

export enum Kasus {
  Nominativ = 'Nominativ',
  Akkusativ = 'Akkusativ',
  Dativ = 'Dativ',
  Genitiv = 'Genitiv',
  None = 'None'
}
