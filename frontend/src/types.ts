export enum TranscriptionStatus {
  NEW = "NEW",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

interface AbstractEntry<DateFormat> {
  uuid: string;
  title: string;
  date: DateFormat;
  url: string;
  excerpt: string[];
  audioFileUrl: string;
  transcriptFileUrl: string;
  transcriptionStatus: TranscriptionStatus;
  entities: Array<any>;
}

export type RawEntry = AbstractEntry<string>;
export type Entry = AbstractEntry<Date>;

interface Alternative<T> {
  confidence: T;
  content: string;
}

interface Item<TimeType, ConfidenceType> {
  start_time: TimeType;
  end_time: TimeType;
  alternatives: Alternative<ConfidenceType>[];
  type: "pronunciation" | "punctuation";
}

interface AbstractTranscription<TimeType, ConfidenceType> {
  jobName: string;
  status: TranscriptionStatus;
  results: {
    items: Item<TimeType, ConfidenceType>[];
    transcripts: [{ transcript: string }];
  };
}

export type RawTranscription = AbstractTranscription<string, string>;
export type Transcription = AbstractTranscription<number, number>;

export interface Subscribable<T> {
  emit(value: T): void;
  subscribe(callback: (value: T) => void): void;
}

export interface Phrase {
  phrase: string;
  soundsLike: string;
  ipa: string;
  displayAs: string;
}
