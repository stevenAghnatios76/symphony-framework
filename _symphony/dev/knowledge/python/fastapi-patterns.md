# Python — FastAPI Patterns

**Principle:** Leverage dependency injection, Pydantic for validation, async for I/O-bound work, and auto-generated OpenAPI for documentation.

## Pattern Examples

### 1. Dependency Injection
```python
from fastapi import Depends, FastAPI
from sqlalchemy.ext.asyncio import AsyncSession

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    user = await db.get(User, decode_token(token).user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@app.get("/users/me")
async def read_me(user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(user)
```

### 2. Pydantic Models for Request/Response
```python
from pydantic import BaseModel, EmailStr, Field

class CreateUserRequest(BaseModel):
    name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    age: int | None = Field(default=None, ge=0, le=150)

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str

@app.post("/users", response_model=UserResponse, status_code=201)
async def create_user(body: CreateUserRequest, db: AsyncSession = Depends(get_db)):
    user = User(**body.model_dump())
    db.add(user)
    await db.commit()
    return user
```

### 3. Middleware and Error Handling
```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("X-Request-ID", str(uuid4()))
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(status_code=exc.status_code, content={"type": exc.code, "detail": exc.message})
```

## Anti-Patterns
- **Synchronous I/O in async routes** — use `async` DB drivers, httpx, aiofiles
- **No response model** — always specify `response_model` to control serialization
- **Business logic in route functions** — extract to service layer, inject via `Depends`
- **Ignoring OpenAPI docs** — add `summary`, `tags`, and `description` to every route

## Integration Points
- **OpenAPI:** Auto-generated at `/docs` (Swagger UI) and `/redoc` (ReDoc)
- **Background tasks:** `BackgroundTasks` for fire-and-forget, Celery/ARQ for durable queues
- **Testing:** `TestClient` (sync) or `httpx.AsyncClient` with `ASGITransport` for async tests
