/**
 * Server-side failures are thrown with English messages by the data layer.
 * Actions redirect back to the page with a short, fixed CODE (never the raw
 * text), and the page shows the translated message for that code. Unknown
 * messages become "generic", so a visitor can neither see an untranslated
 * sentence nor inject their own text through the URL.
 */
const PATTERNS: [RegExp, string][] = [
  [/Add this person as a friend before inviting/i, "friend_first"],
  [/You can only message friends/i, "friends_only_message"],
  [/Date must be in YYYY-MM-DD/i, "bad_date"],
  [/Start time must be in HH:MM/i, "bad_time"],
  [/That activity is not available/i, "activity_unavailable"],
  [/Activity not found/i, "activity_not_found"],
  [/Community not found/i, "community_not_found"],
  [/Friend not found|not a demo friend/i, "friend_not_found"],
  [/Only the invited person can respond/i, "only_invited"],
  [/Demo login is turned off/i, "demo_off"],
  [/The demo is busy/i, "demo_busy"],
  [/A reason is required/i, "reason_required"],
  [/Write a message first/i, "message_empty"],
  [/Sign-in required/i, "signin_required"],
  [/This activity was canceled/i, "activity_canceled"],
  [/cannot add yourself|cannot block yourself|cannot connect with yourself|cannot report yourself/i, "self_action"],
  [/blocked/i, "blocked"],
  [/Friend limit reached/i, "friend_limit"],
  [/already happened/i, "activity_past"],
  [/Message limit reached/i, "message_limit"],
  [/Invitation limit reached/i, "invite_limit"],
  [/This activity is full/i, "activity_full"],
  [/Demo accounts can hold up to/i, "rsvp_limit"],
  [/Choose an activity to invite/i, "choose_activity"],
  [/Capacity must be at least 1/i, "capacity_min"],
  [/Location coordinates are required/i, "coords_required"],
  [/Paid activities need a cost detail/i, "paid_detail"],
  [/ is required\.?$|are required\.?$/i, "field_required"],
  [/must be \d+ characters or fewer/i, "too_long"],
  [/Check-in opens once/i, "checkin_closed"],
  [/This action requires one of/i, "role_required"],
  [/Only this community's organizer/i, "organizer_only"],
  [/organizer cannot leave/i, "organizer_cannot_leave"],
  [/requires a shared interest/i, "connect_needs_shared"],
  [/Volunteers needed must be at least 1/i, "volunteers_min"],
  [/Only the recipient can respond/i, "recipient_only"],
  [/only edit your own profile/i, "own_profile"],
  [/Enter your email and password/i, "credentials_missing"],
  [/Invalid email or password/i, "credentials_invalid"],
];

export function errorCodeFor(message: string): string {
  for (const [re, code] of PATTERNS) if (re.test(message)) return code;
  return "generic";
}

export function errorCodeOf(err: unknown): string {
  return errorCodeFor(err instanceof Error ? err.message : String(err));
}

/** Query-string value for `?error=…`. */
export function errorParam(err: unknown): string {
  return encodeURIComponent(errorCodeOf(err));
}

export const ERROR_CODES = [...new Set(PATTERNS.map(([, c]) => c)), "generic"];

/** Translated message for an `?error=` code from the URL; anything unknown shows the generic message. */
export function errorMessage(t: (key: string) => string, code: string | undefined): string | null {
  if (!code) return null;
  return t(ERROR_CODES.includes(code) ? `err.${code}` : "err.generic");
}
