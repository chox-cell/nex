export function upsertById<T extends { id: string }>(records: T[], nextRecord: T): void {
  const index = records.findIndex((record) => record.id === nextRecord.id);

  if (index === -1) {
    records.push(nextRecord);
    return;
  }

  records[index] = nextRecord;
}

export function sortByPosition<T extends { position: number }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.position - right.position);
}

export function sortByOrder<T extends { order: number }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.order - right.order);
}

export function sortByRank<T extends { rank: number }>(records: T[]): T[] {
  return [...records].sort((left, right) => left.rank - right.rank);
}

export function sortByCreatedAtDesc<T extends { createdAt: string }>(records: T[]): T[] {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

