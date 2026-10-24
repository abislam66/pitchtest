/**
 * Orders created (or opened) on this device, kept in the browser only.
 * PitchTest has no accounts, so the dashboard never lists orders from the database;
 * it only loads the ids remembered here. Every storage access is wrapped in try/catch
 * because storage can be unavailable (private mode, blocked site data).
 */

export const STORAGE_KEY = "pitchtest:orders";
export const MAX_SAVED = 20;

export type SavedOrder = { id: string; companyName: string; createdAt: string };

type StorageLike = Pick<Storage, "getItem" | "setItem">;

const UUID_EXACT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UUID_ANYWHERE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

export const isUuid = (s: string) => UUID_EXACT.test(s);

/** Accepts a bare order UUID or any URL/path containing one (e.g. https://…/results/<id>). */
export function parseOrderRef(input: string): string | null {
  const match = input.trim().match(UUID_ANYWHERE);
  return match ? match[0].toLowerCase() : null;
}

/** Parses the `ids` search param: comma-separated, valid UUIDs only, de-duplicated, capped. */
export function parseIdsParam(raw: string | string[] | undefined): string[] {
  const joined = Array.isArray(raw) ? raw.join(",") : (raw ?? "");
  const out: string[] = [];
  for (const part of joined.split(",")) {
    const id = part.trim().toLowerCase();
    if (isUuid(id) && !out.includes(id)) out.push(id);
    if (out.length >= MAX_SAVED) break;
  }
  return out;
}

/** Keeps only well-formed entries; tolerates anything else being in storage. */
export function sanitizeSaved(value: unknown): SavedOrder[] {
  if (!Array.isArray(value)) return [];
  const out: SavedOrder[] = [];
  for (const v of value) {
    if (!v || typeof v !== "object") continue;
    const { id, companyName, createdAt } = v as Record<string, unknown>;
    if (typeof id !== "string" || !isUuid(id)) continue;
    const norm = id.toLowerCase();
    if (out.some((o) => o.id === norm)) continue;
    out.push({
      id: norm,
      companyName: typeof companyName === "string" ? companyName.slice(0, 120) : "",
      createdAt: typeof createdAt === "string" ? createdAt : "",
    });
    if (out.length >= MAX_SAVED) break;
  }
  return out;
}

/** Puts `entry` first, keeps an existing company name if the new one is blank, caps the list. */
export function mergeSaved(list: SavedOrder[], entry: SavedOrder): SavedOrder[] {
  const id = entry.id.toLowerCase();
  const existing = list.find((o) => o.id === id);
  const merged: SavedOrder = {
    id,
    companyName: entry.companyName || existing?.companyName || "",
    createdAt: existing?.createdAt || entry.createdAt,
  };
  return [merged, ...list.filter((o) => o.id !== id)].slice(0, MAX_SAVED);
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readSavedOrders(storage: StorageLike | null = browserStorage()): SavedOrder[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    return raw ? sanitizeSaved(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

function write(list: SavedOrder[], storage: StorageLike | null): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

/** Returns the saved list after the change, or null if storage is unavailable. */
export function rememberOrder(entry: SavedOrder, storage: StorageLike | null = browserStorage()): SavedOrder[] | null {
  if (!isUuid(entry.id)) return null;
  const next = mergeSaved(readSavedOrders(storage), entry);
  return write(next, storage) ? next : null;
}

/** Returns the saved list after the change, or null if storage is unavailable. */
export function forgetOrders(ids: string[], storage: StorageLike | null = browserStorage()): SavedOrder[] | null {
  const drop = new Set(ids.map((i) => i.toLowerCase()));
  const next = readSavedOrders(storage).filter((o) => !drop.has(o.id));
  return write(next, storage) ? next : null;
}

export const dashboardHref = (ids: string[]) => `/dashboard?ids=${ids.slice(0, MAX_SAVED).join(",")}`;
