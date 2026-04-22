import { randomUUID } from "node:crypto";

export type IsoDateString = string;

export interface BaseEntity {
  id: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export function nowIso(): IsoDateString {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

export function createBaseEntity(id: string, timestamp = nowIso()): BaseEntity {
  return {
    id,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

