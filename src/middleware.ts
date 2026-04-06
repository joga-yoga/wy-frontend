import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|images/.*|robots.txt).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")!;

  // Remove port number for local development
  const currentHost = hostname.replace(`:${url.port}`, "");
  const workshopHosts = new Set(["wydarzenia.yoga", "wydarzenia.localhost"]);

  if (workshopHosts.has(currentHost)) {
    if (url.pathname === "/classes" || url.pathname === "/classes/") {
      return NextResponse.next();
    }

    if (url.pathname.startsWith("/classes/") && !url.pathname.startsWith("/classes/classes/")) {
      const classSlug = url.pathname.replace(/^\/classes\//, "");
      url.pathname = `/classes/classes/${classSlug}`;
      return NextResponse.rewrite(url);
    }
  }

  // Define your domain mappings
  const domainMappings = {
    "wyjazdy.yoga": "retreats",
    "wydarzenia.yoga": "workshops",
    "joga.yoga": "classes",
    "app.joga.yoga": "profile",
    // Local development domains
    localhost: "retreats",
    "wydarzenia.localhost": "workshops",
    "classes.localhost": "classes",
    "app.localhost": "profile",
  };

  const mappedPath = domainMappings[currentHost as keyof typeof domainMappings];

  if (mappedPath) {
    if (
      url.pathname === `/${mappedPath}/${mappedPath}` ||
      url.pathname.startsWith(`/${mappedPath}/${mappedPath}/`)
    ) {
      return NextResponse.next();
    }

    url.pathname = `/${mappedPath}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
