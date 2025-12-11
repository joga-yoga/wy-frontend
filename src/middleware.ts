import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images|images/.*|robots.txt).*)"],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")!;

  // Remove port number for local development
  const currentHost = hostname.replace(`:${url.port}`, "");

  // Define your domain mappings
  const domainMappings = {
    "wyjazdy.yoga": "retreats",
    "wydarzenia.yoga": "workshops",
    "app.joga.yoga": "profile",
    // Local development domains
    localhost: "retreats",
    "wydarzenia.localhost": "workshops",
    "app.localhost": "profile",
  };

  const mappedPath = domainMappings[currentHost as keyof typeof domainMappings];

  if (mappedPath) {
    url.pathname = `/${mappedPath}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}
