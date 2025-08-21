export enum WordType {
  Noun = 'Nomen',
  Verb = 'Verb',
  Adjective = 'Adjektiv',
  Adverb = 'Adverb',
  Pronoun = 'Pronoun',
  Preposition = 'Preposition',
  Conjunction = 'Conjunction',
  Interjection = 'Interjection',
  Other = 'Other'
}

export enum Kasus {
  Nominativ = 'Nominativ',
  Akkusativ = 'Akkusativ',
  Dativ = 'Dativ',
  Genitiv = 'Genitiv',
  None = 'None'
}

export enum ArticleType {
  Definit = 'Definit',
  Indefinit = 'Indefinit',
  Ohne = 'Ohne',
  None = 'None'
}

export enum Preposition {
  Mit = 'mit',
  Nach = 'nach',
  Auf = 'auf',
  Von = 'von',
  In = 'in',
  An = 'an',
  Ueber = 'über',
  Unter = 'unter',
  Vor = 'vor',
  Hinter = 'hinter',
  Neben = 'neben',
  Zwischen = 'zwischen',
  Durch = 'durch',
  Fuer = 'für',
  Gegen = 'gegen',
  Ohne = 'ohne',
  Um = 'um',
  Aus = 'aus',
  Bei = 'bei',
  Gegenueber = 'gegenüber',
  Seit = 'seit',
  Zu = 'zu',
  Entlang = 'entlang'
}

export interface Word {
  id: string;
  originalWord: string;
  translation: string;
  wordType: WordType;
  learnStatus?: number;
  learningLevel?: number;
  article?: ArticleType;
  plural?: string;
  preposition?: Preposition;
  kasus?: Kasus;
  reflexive?: boolean;
  description?: string;
  sources?: string[];
}
