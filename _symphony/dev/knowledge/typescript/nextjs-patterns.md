# TypeScript — Next.js Patterns

**Principle:** Use the framework's conventions. Server-first rendering. File-based routing. Edge-ready middleware.

## Pattern Examples

### 1. App Router with Typed Params
```typescript
// app/users/[id]/page.tsx
interface PageProps { params: Promise<{ id: string }> }
export default async function UserPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();
  return <UserProfile user={user} />;
}
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getUser(id);
  return { title: user?.name ?? 'User' };
}
```

### 2. Route Handlers
```typescript
// app/api/users/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1');
  const users = await listUsers({ page, perPage: 20 });
  return NextResponse.json(users);
}
export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 422 });
  const user = await createUser(parsed.data);
  return NextResponse.json(user, { status: 201 });
}
```

### 3. Middleware
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}
export const config = { matcher: ['/dashboard/:path*', '/api/:path*'] };
```

## Anti-Patterns
- **Client components for static content** — server components are default, use `'use client'` only for interactivity
- **Fetching in useEffect** — use server components or route handlers
- **Not using loading.tsx/error.tsx** — built-in Suspense boundaries are free
- **Hardcoded revalidation** — use `revalidateTag`/`revalidatePath` for on-demand ISR

## Integration Points
- **Rendering:** SSR (dynamic), SSG (static), ISR (revalidate), streaming (Suspense)
- **Data:** Server Actions, Route Handlers, direct DB access in server components
- **Auth:** NextAuth.js / Auth.js, middleware-based protection
