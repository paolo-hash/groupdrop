import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/*
  File location: middleware.ts  (root of the project, same level as package.json)

  Runs before every request. Checks:
    1. Is the user logged in?
    2. Do they have an active tier in their profile?

  Protected routes (must be logged in + have a tier):
    - /drops/:slug  — the individual drop pages

  Public routes (anyone can access):
    - /
    - /join
    - /login
    - /signup
    - /forgot-password
    - /reset-password
    - /api/*
*/

/* Routes that don't require auth */
const PUBLIC_ROUTES = [
  "/",
  "/join",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* Allow all public routes through immediately */
  const isPublic =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublic) {
    return NextResponse.next();
  }

  /*
    Create a Supabase client that works in middleware.
    Uses @supabase/ssr which handles cookie-based sessions correctly
    in Next.js server components and middleware.
  */
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  /* Check if user is logged in */
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    /*
      Not logged in — redirect to login.
      Pass the current URL as ?redirect= so we can send them
      back after they sign in.
    */
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  /*
    User is logged in — now check they have an active tier.
    Query their profile row.
  */
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.tier || (!profile?.stripe_customer_id && !profile?.stripe_subscription_id)) {
    /*
      Logged in but no active subscription — redirect to join page.
      This covers users who created an account but didn't complete payment.
    */
    return NextResponse.redirect(new URL("/join", req.url));
  }

  /* All checks passed — let the request through */
  return res;
}

/*
  Tell Next.js which routes to run this middleware on.
  We only need it on protected routes to keep it fast.
*/
export const config = {
  matcher: [
    "/drops/:path*",
  ],
};