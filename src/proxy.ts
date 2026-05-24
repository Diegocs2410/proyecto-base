import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/auth");
  const isOnboarding = pathname.startsWith("/onboarding");
  const isUnirme = pathname.startsWith("/unirme");

  if (!user && !isAuthRoute && !isUnirme) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && !isAuthRoute && !isOnboarding && !isUnirme) {
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );

    const { data: membresia } = await admin
      .from("tenant_users")
      .select("role, tenants!tenant_id(slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!membresia) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    const isPlatformAdmin = membresia.role === "platform_admin";
    const isOrgRoute = pathname.startsWith("/org/");
    const isGlobalRoute = !isOrgRoute && !isOnboarding;

    const tenant = Array.isArray(membresia.tenants)
      ? membresia.tenants[0]
      : membresia.tenants;
    const slug = (tenant as { slug: string } | null)?.slug;

    if (!isPlatformAdmin && isGlobalRoute && slug) {
      return NextResponse.redirect(new URL(`/org/${slug}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
