export type TimestampString = string;

export interface BaseRecord {
  id: string;
  created_at: TimestampString;
  updated_at?: TimestampString;
}

export function nowIso(): TimestampString {
  return new Date().toISOString();
}
