import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
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
  const isReservar = pathname.startsWith("/reservar");
  const isPostReset =
    pathname.startsWith("/auth/nueva-clave") || pathname.startsWith("/auth/confirm");
  const isLanding = pathname === "/";

  if (!user && !isAuthRoute && !isUnirme && !isLanding && !isReservar) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (user && isAuthRoute && !isPostReset) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (user && !isAuthRoute && !isOnboarding && !isUnirme && !isReservar) {
    const admin = createAdminClient();

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
    const slug = membresia.tenants?.slug;

    if (!isPlatformAdmin && isGlobalRoute && slug) {
      return NextResponse.redirect(new URL(`/org/${slug}`, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
