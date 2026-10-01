import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

/**
 * Shareable language links: any page accepts `?lang=sq|en|sr`. The proxy
 * stores the choice in a cookie and redirects to the same URL without the
 * parameter, so the address stays clean and the route keeps working.
 */
export function proxy(request: NextRequest) {
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang === null) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.searchParams.delete("lang");
  const response = NextResponse.redirect(url);
  if (isLocale(lang)) {
    response.cookies.set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }
  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|photos|favicon.ico).*)"],
};
