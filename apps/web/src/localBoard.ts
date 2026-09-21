import { BoardState, initialBoard } from './domain';

const storageKey = 'universal-work-board:v1';

export function loadBoard(): BoardState {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return initialBoard;
    const parsed = JSON.parse(stored) as BoardState;
    return Array.isArray(parsed.items) && Array.isArray(parsed.outbox) ? parsed : initialBoard;
  } catch {
    return initialBoard;
  }
}

export function saveBoard(board: BoardState) {
  window.localStorage.setItem(storageKey, JSON.stringify(board));
}

export function makeId() {
  return crypto.randomUUID();
}
