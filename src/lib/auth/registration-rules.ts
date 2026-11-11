/** Pure sign-up validation, shared by the server action and tests. */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_NAME_LENGTH = 60;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
  isAdult: boolean;
  acceptsRules: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateRegistration(input: RegistrationInput): { name: string; email: string; password: string } {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (!name || !email || !input.password) throw new Error("Name, email and password are required.");
  if (name.length > MAX_NAME_LENGTH) throw new Error(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`);
  if (email.length > 254 || !EMAIL_RE.test(email)) throw new Error("Enter a valid email address.");
  if (input.password.length < MIN_PASSWORD_LENGTH) throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (input.password.length > 200) throw new Error("Password is too long.");
  if (!input.isAdult) throw new Error("You must confirm you are 18 or older.");
  if (!input.acceptsRules) throw new Error("You must accept the community rules.");
  return { name, email, password: input.password };
}
