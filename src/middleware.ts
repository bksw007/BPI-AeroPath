import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware สำหรับป้องกันการเข้าถึงหน้าที่ต้อง Login
 * และจัดการการ Redirect สำหรับ User ที่ Login แล้ว
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔸 กำหนดกลุ่มของ Public Routes
  const isPublicRoute = 
    pathname === "/" || 
    pathname.startsWith("/login") || 
    pathname.startsWith("/signup") ||
    pathname.startsWith("/public");

  // ในเวอร์ชันนี้เราจะปล่อยให้ Client-side (AuthContext) จัดการเป็นหลักก่อน 
  // เพราะ Firebase Auth token จัดการใน Server-side ของ Next.js middleware 
  // ต้องใช้ Firebase Admin SDK หรือ Cookie-based session ซึ่งอาจซับซ้อนเกินไปในตอนนี้

  // ✅ TODO: Implement Server-side session verification if needed
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
