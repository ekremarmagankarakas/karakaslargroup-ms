# Migration Plan: PHP → FastAPI + React

## Stack Comparison

| Concern | Current (PHP) | New |
|---|---|---|
| Backend | PHP 8, procedural includes + OOP classes | FastAPI (Python 3.12) |
| Database | MySQL (`ooplogin`) | PostgreSQL 16 |
| ORM | Raw PDO | SQLAlchemy 2.x (async) |
| Migrations | None | Alembic |
| Validation | Manual PHP functions | Pydantic v2 |
| Auth | PHP sessions | JWT (access + refresh, localStorage) |
| Frontend | Server-rendered PHP + vanilla JS | React 18 + TypeScript + Vite |
| UI Library | Custom CSS | MUI v6 |
| HTTP Client | PHP form POSTs | Axios |
| Data Fetching | Page reload | TanStack React Query v5 |
| File Storage | `/uploads/` on disk | AWS S3 (LocalStack in dev) |
| Email | PHPMailer + Hostinger SMTP | aiosmtplib + Hostinger SMTP |
| Routing | Multi-page PHP | React Router v6 (SPA) |
| Containerisation | None | Docker + Docker Compose |

---

## Repository Structure

```
karakaslargroup/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── api/
│   │   │   ├── deps.py
│   │   │   └── endpoints/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── requirements.py
│   │   │       ├── favorites.py
│   │   │       └── statistics.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── requirement.py
│   │   │   ├── requirement_image.py
│   │   │   └── favorite.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── user.py
│   │   │   ├── requirement.py
│   │   │   ├── image.py
│   │   │   ├── favorite.py
│   │   │   └── statistics.py
│   │   ├── repositories/
│   │   │   ├── user_repository.py
│   │   │   ├── requirement_repository.py
│   │   │   ├── image_repository.py
│   │   │   └── favorite_repository.py
│   │   └── services/
│   │       ├── auth_service.py
│   │       ├── user_service.py
│   │       ├── requirement_service.py
│   │       ├── favorite_service.py
│   │       ├── email_service.py
│   │       └── storage_service.py
│   ├── alembic/
│   │   ├── env.py
│   │   └── versions/
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── api/
│   │   │   ├── axios.ts
│   │   │   └── endpoints/
│   │   │       ├── auth.ts
│   │   │       ├── requirements.ts
│   │   │       ├── favorites.ts
│   │   │       ├── users.ts
│   │   │       └── statistics.ts
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppHeader.tsx
│   │   │   │   ├── AppSidebar.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   ├── requirements/
│   │   │   │   ├── RequirementCard.tsx
│   │   │   │   ├── RequirementRow.tsx
│   │   │   │   ├── RequirementModal.tsx
│   │   │   │   ├── RequirementForm.tsx
│   │   │   │   └── RequirementFilters.tsx
│   │   │   ├── statistics/
│   │   │   │   └── StatisticsPanel.tsx
│   │   │   ├── favorites/
│   │   │   │   └── FavoritesSection.tsx
│   │   │   └── common/
│   │   │       ├── ProtectedRoute.tsx
│   │   │       ├── ConfirmDialog.tsx
│   │   │       └── PaginationControls.tsx
│   │   ├── hooks/
│   │   │   ├── useRequirements.ts
│   │   │   ├── useFavorites.ts
│   │   │   ├── useStatistics.ts
│   │   │   ├── useUsers.ts
│   │   │   └── useAuth.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── DashboardPage.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── localStorage.ts
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## Backend: Layered Architecture

### Layer Responsibilities

```
HTTP Request
     ↓
[ api/endpoints/ ]   ← Parse request, call service, return response schema
     ↓
[ services/ ]        ← Business logic, orchestrates repos, triggers emails/storage
     ↓
[ repositories/ ]    ← Pure database queries via SQLAlchemy Session
     ↓
[ models/ ]          ← SQLAlchemy ORM table definitions
     ↓
[ PostgreSQL ]

[ schemas/ ]         ← Pydantic models for request validation and response serialisation
[ core/security.py ] ← JWT encode/decode, password hashing
[ services/storage_service.py ] ← S3/LocalStack abstraction
[ services/email_service.py ]   ← SMTP email abstraction
```

### Dependency Injection (`api/deps.py`)

Three reusable FastAPI dependencies:

- `get_db` → yields `AsyncSession`
- `get_current_user` → decodes JWT, returns `UserModel`
- `require_roles(*roles)` → factory that returns a dependency raising 403 if user role not in allowed list

---

## Database Schema (PostgreSQL)

### Design Decisions vs Current MySQL

| Decision | Old | New | Reason |
|---|---|---|---|
| Status values | `'Accepted'`, `'Declined'`, `'Pending'` (strings) | PostgreSQL ENUM `pending`, `accepted`, `declined` (lowercase) | Type safety, prevents typos |
| User roles | String column `user_type` | PostgreSQL ENUM `user_role` | Type safety |
| `admin` role | Hardcoded username check `"Yusuf"` | Proper `admin` role in ENUM | Correct RBAC |
| Images | JSON string in `requirements.images` | Separate `requirement_images` table | Normalised; allows individual image deletion, S3 key tracking, querying |
| `paid` column | `TINYINT` 0/1 | `BOOLEAN` | Idiomatic PostgreSQL |
| Timestamps | `DATETIME` (naive) | `TIMESTAMPTZ` (timezone-aware) | Correct for multi-timezone use |
| `permission_by` | References `users_id` | `approved_by` (renamed for clarity) | Clarity |

### Enums

```sql
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'accountant', 'admin');
CREATE TYPE requirement_status AS ENUM ('pending', 'accepted', 'declined');
```

### Table: `users`

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    username    VARCHAR(255) NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'employee',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Constraints carried over:
- Username: alphanumeric + Turkish characters only (validated in Pydantic, not DB constraint)
- Email: valid email format (validated in Pydantic)
- Username + email uniqueness enforced at DB level

### Table: `requirements`

```sql
CREATE TABLE requirements (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    item_name   VARCHAR(500) NOT NULL,
    price       NUMERIC(12, 2) NOT NULL,
    explanation TEXT,
    status      requirement_status NOT NULL DEFAULT 'pending',
    paid        BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_requirements_user_id ON requirements(user_id);
CREATE INDEX idx_requirements_status ON requirements(status);
CREATE INDEX idx_requirements_paid ON requirements(paid);
CREATE INDEX idx_requirements_created_at ON requirements(created_at);
```

### Table: `requirement_images` (replaces JSON column)

```sql
CREATE TABLE requirement_images (
    id              SERIAL PRIMARY KEY,
    requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    s3_key          VARCHAR(1000) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type       VARCHAR(10) NOT NULL,   -- 'image' or 'pdf'
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_req_images_requirement_id ON requirement_images(requirement_id);
```

S3 key format: `requirements/{requirement_id}/{uuid4}.{ext}`

### Table: `favorites`

```sql
CREATE TABLE favorites (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requirement_id  INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, requirement_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);
```

---

## SQLAlchemy Models (`app/models/`)

### `user.py`
```python
class UserRole(str, enum.Enum):
    employee  = "employee"
    manager   = "manager"
    accountant = "accountant"
    admin     = "admin"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.employee)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    requirements: Mapped[list["Requirement"]] = relationship(back_populates="user")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="user")
```

### `requirement.py`
```python
class RequirementStatus(str, enum.Enum):
    pending  = "pending"
    accepted = "accepted"
    declined = "declined"

class Requirement(Base):
    __tablename__ = "requirements"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    item_name: Mapped[str] = mapped_column(String(500), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    explanation: Mapped[str | None] = mapped_column(Text)
    status: Mapped[RequirementStatus] = mapped_column(SAEnum(RequirementStatus), default=RequirementStatus.pending)
    paid: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    approved_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    user: Mapped["User"] = relationship(foreign_keys=[user_id], back_populates="requirements")
    approver: Mapped["User | None"] = relationship(foreign_keys=[approved_by])
    images: Mapped[list["RequirementImage"]] = relationship(back_populates="requirement", cascade="all, delete-orphan")
    favorites: Mapped[list["Favorite"]] = relationship(back_populates="requirement", cascade="all, delete-orphan")
```

### `requirement_image.py`
```python
class RequirementImage(Base):
    __tablename__ = "requirement_images"
    id: Mapped[int] = mapped_column(primary_key=True)
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"))
    s3_key: Mapped[str] = mapped_column(String(1000), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(10), nullable=False)  # 'image' | 'pdf'
    uploaded_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    requirement: Mapped["Requirement"] = relationship(back_populates="images")
```

### `favorite.py`
```python
class Favorite(Base):
    __tablename__ = "favorites"
    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    requirement_id: Mapped[int] = mapped_column(ForeignKey("requirements.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(TIMESTAMPTZ, server_default=func.now())

    __table_args__ = (UniqueConstraint("user_id", "requirement_id"),)

    user: Mapped["User"] = relationship(back_populates="favorites")
    requirement: Mapped["Requirement"] = relationship(back_populates="favorites")
```

---

## Pydantic Schemas (`app/schemas/`)

### `auth.py`
```python
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

### `user.py`
```python
class UserRole(str, Enum):
    employee   = "employee"
    manager    = "manager"
    accountant = "accountant"
    admin      = "admin"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: UserRole = UserRole.employee

    @field_validator("username")
    def username_alphanumeric(cls, v):
        # Allow alphanumeric + Turkish characters (matches PHP regex)
        if not re.match(r'^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ]+$', v):
            raise ValueError("Invalid username characters")
        return v

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: UserRole
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self
```

### `requirement.py`
```python
class RequirementStatus(str, Enum):
    pending  = "pending"
    accepted = "accepted"
    declined = "declined"

class RequirementCreate(BaseModel):
    item_name: str
    price: Decimal
    explanation: str | None = None

class RequirementStatusUpdate(BaseModel):
    status: Literal[RequirementStatus.accepted, RequirementStatus.declined]

class ImageResponse(BaseModel):
    id: int
    s3_key: str
    original_filename: str
    file_type: str
    url: str  # presigned S3 URL, generated at serialisation time
    model_config = ConfigDict(from_attributes=True)

class RequirementResponse(BaseModel):
    id: int
    user_id: int
    username: str
    item_name: str
    price: Decimal
    explanation: str | None
    status: RequirementStatus
    paid: bool
    approved_by: int | None
    approved_by_username: str | None
    images: list[ImageResponse]
    is_favorited: bool          # computed per current user in service layer
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaginatedRequirementsResponse(BaseModel):
    items: list[RequirementResponse]
    total: int
    page: int
    limit: int
    total_pages: int
```

### `statistics.py`
```python
class StatisticsResponse(BaseModel):
    total_count: int
    pending_count: int
    accepted_count: int
    declined_count: int
    total_price: Decimal
    pending_price: Decimal
    accepted_price: Decimal
    declined_price: Decimal
```

---

## API Endpoints

All endpoints prefixed with `/api/`.

### Auth (`/api/auth/`)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login, returns access + refresh tokens |
| POST | `/api/auth/refresh` | Public | Exchange refresh token for new access token |

### Users (`/api/users/`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/users/` | manager, admin | List all users (for filter dropdown) |
| POST | `/api/users/` | manager, admin | Create new user |
| PATCH | `/api/users/me/password` | All | Change own password |

### Requirements (`/api/requirements/`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/requirements/` | All | Paginated + filtered list (role-scoped) |
| POST | `/api/requirements/` | employee | Create new requirement |
| POST | `/api/requirements/{id}/images` | employee | Upload images (multipart/form-data) |
| PATCH | `/api/requirements/{id}/status` | manager, admin | Accept or decline |
| PATCH | `/api/requirements/{id}/paid` | accountant | Toggle paid status |
| DELETE | `/api/requirements/{id}` | admin | Delete requirement |

### Favorites (`/api/favorites/`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/favorites/` | All | Paginated favorites for current user |
| POST | `/api/favorites/{requirement_id}` | All | Add to favorites |
| DELETE | `/api/favorites/{requirement_id}` | All | Remove from favorites |

### Statistics (`/api/statistics/`)

| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/api/statistics/` | All | Aggregated stats, same filters as requirements |

---

## Query Parameters: `GET /api/requirements/`

| Param | Type | Description |
|---|---|---|
| `page` | int (default 1) | Page number |
| `limit` | int (default 10) | Items per page |
| `search` | str | Searches `item_name` and `explanation` |
| `user_id` | int | Filter by user (manager/admin/accountant only; ignored for employee) |
| `status` | `pending`\|`accepted`\|`declined` | Filter by status |
| `paid` | bool | Filter by paid status |
| `month` | int 1–12 | Filter by creation month |
| `year` | int | Filter by creation year |

**Role-scoped visibility:**
- `employee`: only sees own requirements; `user_id` filter ignored
- `manager` / `admin`: sees all requirements
- `accountant`: sees only `status=accepted`; `paid` defaults to `False` in service if not provided

**Note on N+1 fix:** The PHP implementation called `isFavorited()` inside a loop causing N+1 queries per page load. The new repository must resolve this by fetching the set of favorited requirement IDs for the current user in a single query and annotating results in the service layer.

---

## Role-Based Access Control

| Action | employee | manager | accountant | admin |
|---|---|---|---|---|
| View own requirements | Yes | — | — | Yes |
| View all requirements | — | Yes | Yes (accepted only) | Yes |
| Submit requirement | Yes | — | — | Yes |
| Upload images | Yes | — | — | Yes |
| Accept / Decline | — | Yes | — | Yes |
| Toggle paid | — | — | Yes | Yes |
| Delete requirement | — | — | — | Yes |
| Create users | — | Yes | — | Yes |
| List users | — | Yes | Yes | Yes |
| Change own password | Yes | Yes | Yes | Yes |
| View statistics | Yes | Yes | Yes | Yes |
| Manage favorites | Yes | Yes | Yes | Yes |

**Admin** replaces the hardcoded `username === "Yusuf"` check. Any user with `role = admin` can delete requirements and has all manager permissions.

---

## Authentication Design

### JWT Strategy

- **Access token**: RS256 or HS256 signed JWT, lifetime **15 minutes**
- **Refresh token**: separate JWT, lifetime **7 days**
- Both stored in **localStorage** on the frontend
- Tokens are stateless (no server-side store); logout is client-side only (clear localStorage)

### Token Payload

```json
// Access token
{
  "sub": "42",
  "role": "manager",
  "exp": 1234567890,
  "type": "access"
}

// Refresh token
{
  "sub": "42",
  "exp": 1234567890,
  "type": "refresh"
}
```

### Backend Flow (`core/security.py`)

- `create_access_token(user_id, role)` → JWT string
- `create_refresh_token(user_id)` → JWT string
- `decode_token(token)` → payload dict or raises 401
- `hash_password(plain)` → bcrypt hash (using `passlib[bcrypt]`)
- `verify_password(plain, hashed)` → bool

### Frontend Axios Interceptor (`api/axios.ts`)

```
Request interceptor:
  - Read access_token from localStorage
  - Set Authorization: Bearer {access_token}

Response interceptor (on 401):
  - Read refresh_token from localStorage
  - POST /api/auth/refresh with { refresh_token }
  - On success: store new access_token, retry original request
  - On failure: clear localStorage, redirect to /login
```

---

## File Upload & Storage

### Architecture

```
Browser → POST /api/requirements/{id}/images (multipart)
        → backend streams file to S3/LocalStack
        → stores s3_key + metadata in requirement_images table
        → returns list of ImageResponse

Browser → GET /api/requirements/ (includes images)
        → backend generates presigned S3 URLs per image (1 hour expiry)
        → returns presigned URLs in ImageResponse.url
```

### S3 Configuration

**Production:**
- Provider: AWS S3
- Bucket: `karakaslar-uploads` (private, no public access)
- Region: configured via env var
- Auth: IAM role on EC2 or access key + secret in env

**Local development:**
- Provider: LocalStack
- Endpoint: `http://localstack:4566`
- Bucket: auto-created on container startup via init script
- Fake credentials: `test` / `test`

### `storage_service.py`

```python
class StorageService:
    def __init__(self, settings: Settings):
        kwargs = {"region_name": settings.AWS_REGION}
        if settings.USE_LOCALSTACK:
            kwargs["endpoint_url"] = settings.LOCALSTACK_ENDPOINT
            kwargs["aws_access_key_id"] = "test"
            kwargs["aws_secret_access_key"] = "test"
        self.client = boto3.client("s3", **kwargs)
        self.bucket = settings.S3_BUCKET_NAME

    async def upload_file(self, file: UploadFile, requirement_id: int) -> str:
        ext = Path(file.filename).suffix.lower()
        key = f"requirements/{requirement_id}/{uuid4()}{ext}"
        self.client.upload_fileobj(file.file, self.bucket, key)
        return key

    def get_presigned_url(self, s3_key: str, expiry: int = 3600) -> str:
        return self.client.generate_presigned_url(
            "get_object",
            Params={"Bucket": self.bucket, "Key": s3_key},
            ExpiresIn=expiry,
        )
```

### Allowed File Types

Carried over from PHP: `jpg`, `jpeg`, `png`, `gif`, `pdf`

Validation done via MIME type check in FastAPI (`python-magic` or `filetype` library), not just extension.

---

## Email Service (`services/email_service.py`)

SMTP credentials are the same as current config (Hostinger).

### Emails

**1. New requirement submitted** (triggered in `requirement_service.create_requirement`)
- Recipients: all users with `role = manager` or `role = admin`
- Fetched from DB via `user_repository.get_emails_by_roles(['manager', 'admin'])`
- Content: submitter username, item name, formatted price, explanation, link to dashboard

**2. Status changed** (triggered in `requirement_service.update_status`)
- Recipients: requirement owner (always)
- Additional recipients if status = `accepted`: all users with `role = accountant`
- Content: item name, price, explanation, new status (Turkish labels), link

### Implementation

Use `aiosmtplib` for async SMTP to avoid blocking the event loop.

```python
class EmailService:
    async def send(self, to: list[str], subject: str, html_body: str): ...
    async def send_new_requirement(self, requirement, submitter_username): ...
    async def send_status_update(self, requirement, new_status): ...
```

Emails triggered via FastAPI `BackgroundTasks` so the HTTP response is not blocked.

---

## Frontend Architecture

### React Router Routes

```
/               → redirect to /dashboard (if authenticated) or /login
/login          → LoginPage (public)
/dashboard      → DashboardPage (protected, all roles)
*               → redirect to /dashboard
```

`ProtectedRoute` component wraps `/dashboard`. If no access token in localStorage, redirects to `/login`.

### Auth Context (`context/AuthContext.tsx`)

Stores `{ user, accessToken, refreshToken }` in React context, seeded from localStorage on mount.

```typescript
interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'employee' | 'manager' | 'accountant' | 'admin';
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}
```

### React Query Keys

```typescript
export const queryKeys = {
  requirements: (filters: RequirementFilters) => ['requirements', filters] as const,
  requirementById: (id: number) => ['requirements', id] as const,
  favorites: (page: number) => ['favorites', page] as const,
  statistics: (filters: StatisticsFilters) => ['statistics', filters] as const,
  users: () => ['users'] as const,
}
```

### Query / Mutation Mapping

| React Query Hook | Calls | Invalidates |
|---|---|---|
| `useRequirements(filters)` | GET /api/requirements/ | — |
| `useFavorites(page)` | GET /api/favorites/ | — |
| `useStatistics(filters)` | GET /api/statistics/ | — |
| `useUsers()` | GET /api/users/ | — |
| `useCreateRequirement()` | POST /api/requirements/ | requirements, statistics |
| `useUploadImages(id)` | POST /api/requirements/{id}/images | requirements |
| `useUpdateStatus(id)` | PATCH /api/requirements/{id}/status | requirements, statistics, favorites |
| `useTogglePaid(id)` | PATCH /api/requirements/{id}/paid | requirements, statistics |
| `useDeleteRequirement(id)` | DELETE /api/requirements/{id} | requirements, statistics, favorites |
| `useToggleFavorite(reqId)` | POST or DELETE /api/favorites/{id} | favorites, requirements |
| `useCreateUser()` | POST /api/users/ | users |
| `useChangePassword()` | PATCH /api/users/me/password | — |

### Dashboard UI State

The following UI state from the PHP app is preserved in the React frontend:

| Preference | Storage | Implementation |
|---|---|---|
| Statistics panel visible | localStorage | `useState` seeded from localStorage, synced on change |
| Inbox visible | localStorage | same |
| Favorites visible | localStorage | same |
| Sidebar hidden | localStorage | same |
| Entries layout (grid/list) | localStorage | same |
| Favorites layout (grid/list) | localStorage | same |
| Style preference (sectioned/all) | localStorage | same (not available to accountant) |

`utils/localStorage.ts` provides typed get/set helpers for all these keys.

### Sectioned View Logic (manager/employee only)

The sectioned view (Pending / Accepted / Declined columns) requires three separate data sets. In the new implementation, a single `GET /api/requirements/` call returns all items for the current filter+page. The frontend splits them client-side into three columns by `status`. This avoids the three separate paginated backend queries the PHP app made.

**Exception:** The accountant view never has a sectioned option (already only shows accepted) — same as current PHP behaviour.

### Year Filter (dynamic)

The PHP app hardcoded years 2020–2025. The new frontend generates years dynamically:

```typescript
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - 2020 + 1 }, (_, i) => 2020 + i);
```

No backend endpoint needed.

### Price Input Handling

The PHP app stripped non-numeric characters and converted commas to dots before submission. Replicate this in the MUI `TextField` using `onChange` formatting and a `parseFloat` on submit. Store and send price as a plain decimal string to the API.

---

## `core/config.py` (Pydantic BaseSettings)

```python
class Settings(BaseSettings):
    # Database
    DATABASE_URL: str               # postgresql+asyncpg://user:pass@db:5432/karakaslar

    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # S3
    S3_BUCKET_NAME: str = "karakaslar-uploads"
    AWS_REGION: str = "eu-central-1"
    AWS_ACCESS_KEY_ID: str | None = None
    AWS_SECRET_ACCESS_KEY: str | None = None
    USE_LOCALSTACK: bool = False
    LOCALSTACK_ENDPOINT: str = "http://localstack:4566"

    # SMTP
    SMTP_HOST: str = "smtp.hostinger.com"
    SMTP_PORT: int = 465
    SMTP_USERNAME: str
    SMTP_PASSWORD: str
    SMTP_FROM_EMAIL: str
    SMTP_FROM_NAME: str = "KarakaslarGroup Yonetim"

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = SettingsConfigDict(env_file=".env")
```

---

## Alembic Setup

- `alembic init alembic`
- `alembic/env.py` imports `Base` from `app.db.base` and reads `DATABASE_URL` from settings
- Initial migration generated from SQLAlchemy models
- Subsequent schema changes via `alembic revision --autogenerate -m "description"`

Migration commands (run inside backend container):
```bash
alembic upgrade head          # apply all migrations
alembic downgrade -1          # rollback one
alembic revision --autogenerate -m "add column x"
```

---

## Docker Compose

### Services

```
nginx          ← port 80 (prod: 443) reverse proxy
  ├── /api/*  → backend:8000
  └── /*      → frontend:80

frontend       ← nginx serving static React build (Vite output)
backend        ← FastAPI via uvicorn, port 8000
db             ← PostgreSQL 16, port 5432 (internal only)
localstack     ← LocalStack latest, port 4566 (internal + exposed for debug)
```

### `docker-compose.yml` (development)

```yaml
version: "3.9"

services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: karakaslar
      POSTGRES_USER: karakaslar
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U karakaslar"]
      interval: 5s
      retries: 5

  localstack:
    image: localstack/localstack:latest
    restart: unless-stopped
    environment:
      SERVICES: s3
      DEFAULT_REGION: eu-central-1
      AWS_DEFAULT_REGION: eu-central-1
    volumes:
      - localstack_data:/var/lib/localstack
      - ./scripts/init-localstack.sh:/etc/localstack/init/ready.d/init-s3.sh
    ports:
      - "4566:4566"

  backend:
    build: ./backend
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
      localstack:
        condition: service_started
    environment:
      DATABASE_URL: postgresql+asyncpg://karakaslar:${DB_PASSWORD}@db:5432/karakaslar
      JWT_SECRET_KEY: ${JWT_SECRET_KEY}
      USE_LOCALSTACK: "true"
      LOCALSTACK_ENDPOINT: http://localstack:4566
      S3_BUCKET_NAME: karakaslar-uploads
      SMTP_HOST: smtp.hostinger.com
      SMTP_PORT: 465
      SMTP_USERNAME: ${SMTP_USERNAME}
      SMTP_PASSWORD: ${SMTP_PASSWORD}
      SMTP_FROM_EMAIL: ${SMTP_FROM_EMAIL}
      ALLOWED_ORIGINS: "http://localhost,http://localhost:3000"
    volumes:
      - ./backend:/app    # dev only: live reload

  frontend:
    build: ./frontend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - backend
      - frontend

volumes:
  postgres_data:
  localstack_data:
```

### `docker-compose.prod.yml` (overrides for production)

```yaml
services:
  backend:
    environment:
      USE_LOCALSTACK: "false"
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
      AWS_REGION: ${AWS_REGION}
      ALLOWED_ORIGINS: "https://karakaslar.online"
    volumes: []   # no bind mount in prod

  localstack:
    profiles: ["dev"]   # excluded from prod
```

### LocalStack Init Script (`scripts/init-localstack.sh`)

```bash
#!/bin/bash
awslocal s3 mb s3://karakaslar-uploads --region eu-central-1
awslocal s3api put-bucket-cors --bucket karakaslar-uploads --cors-configuration file:///etc/localstack/cors.json
```

### Backend `Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

Production CMD drops `--reload` and adds `--workers 2`.

### Frontend `Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

### Nginx Reverse Proxy (`nginx/nginx.conf`)

```nginx
upstream backend {
    server backend:8000;
}

upstream frontend {
    server frontend:80;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 20M;

    location /api/ {
        proxy_pass http://backend/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        proxy_pass http://frontend/;
        proxy_set_header Host $host;
    }
}
```

### Frontend Nginx Config (`frontend/nginx.conf`)

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # React Router: serve index.html for all non-asset routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Python Dependencies (`requirements.txt`)

```
fastapi>=0.115
uvicorn[standard]>=0.30
sqlalchemy[asyncio]>=2.0
asyncpg              # async PostgreSQL driver
alembic>=1.13
pydantic[email]>=2.0
pydantic-settings>=2.0
python-jose[cryptography]  # JWT
passlib[bcrypt]            # password hashing
python-multipart           # file uploads
boto3                      # S3 / LocalStack
aiosmtplib                 # async SMTP
filetype                   # MIME validation for uploads
python-dotenv
```

## Frontend Dependencies (`package.json`)

```json
{
  "dependencies": {
    "@mui/material": "^6",
    "@mui/icons-material": "^6",
    "@emotion/react": "^11",
    "@emotion/styled": "^11",
    "@tanstack/react-query": "^5",
    "axios": "^1",
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6"
  },
  "devDependencies": {
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "vite": "^5",
    "@vitejs/plugin-react": "^4"
  }
}
```

---

## Environment Variables (`.env.example`)

```bash
# Database
DB_PASSWORD=changeme

# JWT
JWT_SECRET_KEY=change-this-to-a-long-random-secret

# S3 (production only; dev uses LocalStack)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=eu-central-1

# SMTP (same Hostinger credentials)
SMTP_USERNAME=info@karakaslargroupyonetim.online
SMTP_PASSWORD=
SMTP_FROM_EMAIL=info@karakaslargroupyonetim.online
```

---

## Key Migration Decisions & Rationale

| Decision | Rationale |
|---|---|
| Separate `requirement_images` table | Allows per-image deletion, individual S3 key tracking, avoids JSON parsing in SQL, easier to query |
| Status as lowercase PostgreSQL ENUM | Type-safe, prevents invalid values at DB level; frontend and backend both use lowercase consistently |
| `admin` role for delete | Removes hardcoded `username === "Yusuf"` check; any user can be promoted to admin without code changes |
| Stateless JWT (no DB token store) | Simpler infra; 7-day refresh window is acceptable for an internal tool. If revocation is ever needed, add a `revoked_tokens` table later |
| Accountant default paid=False in service layer | Mirrors current PHP behaviour: if accountant calls `/api/requirements/` with no `paid` param, service injects `paid=False` before querying |
| Single-query favorite resolution | Replace PHP N+1 loop with one `SELECT requirement_id FROM favorites WHERE user_id = ?` then set-membership check in Python |
| Sectioned view split client-side | Avoids 3 separate paginated backend queries; one request returns page of items, frontend splits by status. Total counts still come from `/api/statistics/` |
| BackgroundTasks for email | HTTP response not blocked by SMTP; email failures do not cause request failures |
| Presigned S3 URLs (1 hour expiry) | Files remain private; no public bucket policy needed; URLs regenerated on each requirements fetch |
| `USE_LOCALSTACK` env flag | Single codebase for dev and prod; StorageService switches endpoint based on flag |
| Dynamic year list in frontend | Eliminates hardcoded 2020–2025; auto-extends each year without code changes |
| All text stays Turkish | No i18n library; Turkish strings hardcoded in components as-is from the PHP templates |

---

## Supplementary Implementation Details

These details were present in the PHP source but not captured above. A new session must read this section to avoid incorrect implementations.

---

### Status Toggle Business Logic

The PHP `handleEntry.inc.php` uses a **toggle**, not a simple set. The behavior for `PATCH /api/requirements/{id}/status`:

```
toggleAccept:
  if current status == 'accepted'  → set status to 'pending',  clear approved_by
  if current status != 'accepted'  → set status to 'accepted', set approved_by = current_user.id

toggleDecline:
  if current status == 'declined'  → set status to 'pending',  clear approved_by
  if current status != 'declined'  → set status to 'declined', set approved_by = current_user.id
```

The `RequirementStatusUpdate` schema body `{ status: "accepted" | "declined" }` maps to one of these two branches. The service layer reads current status from DB and applies the toggle. Email is sent on every toggle (including back to pending).

---

### Statistics Scope Per Role

In the PHP app, statistics counts and prices are computed across **all statuses for all roles**, including accountant. Only the **entry list** is filtered to `status=accepted` for accountant. The `GET /api/statistics/` endpoint must NOT apply the accountant accepted-only restriction. All four counts (total, pending, accepted, declined) and all four prices are always returned regardless of the caller's role.

The statistics endpoint accepts the same filter params as requirements (`search`, `user_id`, `month`, `year`, `paid`) but `status` is never applied as a filter — stats always aggregate across all three statuses.

---

### Image Display Rule (Frontend)

In the PHP UI, images are hidden in both grid cards and list rows, and are **only visible inside the modal**. The React implementation must follow the same rule:

- `RequirementCard.tsx` (grid) — render no images
- `RequirementRow.tsx` (list) — render no images
- `RequirementModal.tsx` — render all images; inline `<img>` for jpg/jpeg/png/gif, `<a target="_blank">` for pdf

The `images` array is still included in every `RequirementResponse` so the modal can use it without a second request.

---

### Search: Use ILIKE (Case-Insensitive)

MySQL `LIKE` is case-insensitive by default. PostgreSQL `LIKE` is case-sensitive. All `search` queries against `item_name` and `explanation` must use `ILIKE` in SQLAlchemy:

```python
or_(
    Requirement.item_name.ilike(f"%{search}%"),
    Requirement.explanation.ilike(f"%{search}%"),
)
```

---

### `isFavorited` Batch Resolution Algorithm

In `requirement_service.list_requirements()`, after fetching the paginated requirements:

```python
# 1. Collect all requirement IDs on this page
req_ids = [r.id for r in requirements]

# 2. Single query: which of these are favorited by current user?
favorited_ids = await favorite_repository.get_favorited_ids_for_user(
    db, user_id=current_user.id, requirement_ids=req_ids
)
# Returns: set[int]

# 3. Annotate each requirement before building response
for req in requirements:
    req.is_favorited = req.id in favorited_ids
```

`favorite_repository.get_favorited_ids_for_user` executes:
```sql
SELECT requirement_id FROM favorites
WHERE user_id = :user_id AND requirement_id = ANY(:ids)
```

---

### `approved_by_username` Join in Repository

`RequirementResponse.approved_by_username` requires a LEFT JOIN to `users` on `approved_by`. The repository paginated query must eagerly load the approver relationship or use an explicit join:

```python
stmt = (
    select(Requirement)
    .options(
        joinedload(Requirement.user),           # for username
        joinedload(Requirement.approver),       # for approved_by_username
        selectinload(Requirement.images),       # for images list
    )
    .where(...)
    .order_by(Requirement.created_at.desc())
    .offset(offset)
    .limit(limit)
)
```

In the service layer, map to schema:
```python
approved_by_username = req.approver.username if req.approver else None
```

---

### Price Display Format (Turkish Locale)

All prices displayed in the UI must use Turkish number format: **comma as decimal separator, dot as thousands separator**.

Example: `1234.56` stored in DB → displayed as `1.234,56` → shown as `1.234,56tl`

PHP used: `number_format((float)$price, 2, ',', '.')`

Frontend `utils/formatters.ts`:
```typescript
export function formatPrice(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  // Result: "1.234,56" → append "tl" in component
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString('tr-TR');
}
```

Price input: on change, strip everything except digits, commas, dots. On submit, replace commas with dots then parse as float before sending to API.

---

### Login Response Must Include User Data

`AuthContext` needs `id`, `username`, `email`, and `role` immediately after login to render the UI correctly without a second round-trip. The `TokenResponse` schema must be extended:

```python
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse          # include full user object
```

The `auth_service.login()` fetches the user, creates both tokens, and returns all three together. There is **no separate `GET /api/users/me` endpoint** needed if login returns user data. The refresh endpoint returns only a new `access_token` (no user data needed since it is already stored in context from login).

If the page is hard-refreshed, `AuthContext` re-reads tokens from localStorage but has no user object. Two options — pick one during implementation:
- **Option A (recommended):** Also store the user object in localStorage (`auth_user` key) at login, restore on mount.
- **Option B:** Add `GET /api/users/me` endpoint and call it on mount if token present.

---

### `app/main.py` Structure

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.api.endpoints import auth, users, requirements, favorites, statistics

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: nothing required; run alembic upgrade head as a separate
    # docker-compose command or entrypoint script, not here.
    yield
    # Shutdown

def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="KarakaslarGroup API", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.ALLOWED_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(auth.router,         prefix="/api/auth",         tags=["auth"])
    app.include_router(users.router,        prefix="/api/users",        tags=["users"])
    app.include_router(requirements.router, prefix="/api/requirements",  tags=["requirements"])
    app.include_router(favorites.router,    prefix="/api/favorites",     tags=["favorites"])
    app.include_router(statistics.router,   prefix="/api/statistics",   tags=["statistics"])

    return app

app = create_app()
```

Alembic migrations run via the backend container entrypoint before uvicorn starts:
```dockerfile
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
```

---

### `db/session.py` and `db/base.py`

**`db/base.py`:**
```python
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

# Import all models here so Alembic autogenerate sees them
from app.models.user import User                        # noqa
from app.models.requirement import Requirement          # noqa
from app.models.requirement_image import RequirementImage  # noqa
from app.models.favorite import Favorite               # noqa
```

**`db/session.py`:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,   # must start with postgresql+asyncpg://
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
```

---

### Alembic Async `env.py` Pattern

Async SQLAlchemy requires a specific Alembic env.py. The default generated one will not work:

```python
# alembic/env.py
import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from alembic import context
from app.db.base import Base       # imports all models
from app.core.config import get_settings

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline():
    url = get_settings().DATABASE_URL
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    settings = get_settings()
    connectable = create_async_engine(settings.DATABASE_URL)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
```

---

### `api/deps.py` Concrete Implementation

```python
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.core.security import decode_token
from app.models.user import User, UserRole
from app.repositories.user_repository import UserRepository

bearer_scheme = HTTPBearer()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    payload = decode_token(credentials.credentials)   # raises 401 if invalid/expired
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user = await UserRepository(db).get_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_roles(*roles: UserRole):
    """Factory: returns a dependency that enforces role membership."""
    async def _check(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return _check

# Pre-built role guards used in endpoint signatures
CurrentUser   = Annotated[User, Depends(get_current_user)]
ManagerOrAdmin = Annotated[User, Depends(require_roles(UserRole.manager, UserRole.admin))]
AccountantDep  = Annotated[User, Depends(require_roles(UserRole.accountant, UserRole.admin))]
AdminOnly      = Annotated[User, Depends(require_roles(UserRole.admin))]
EmployeeDep    = Annotated[User, Depends(require_roles(UserRole.employee, UserRole.admin))]
```

Usage in endpoint:
```python
@router.post("/")
async def create_requirement(
    body: RequirementCreate,
    current_user: EmployeeDep,
    db: Annotated[AsyncSession, Depends(get_db)],
): ...
```

---

### TypeScript Interfaces (`types/index.ts`)

```typescript
export type UserRole = 'employee' | 'manager' | 'accountant' | 'admin';
export type RequirementStatus = 'pending' | 'accepted' | 'declined';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface RequirementImage {
  id: number;
  s3_key: string;
  original_filename: string;
  file_type: string;   // 'image' | 'pdf'
  url: string;         // presigned S3 URL
}

export interface Requirement {
  id: number;
  user_id: number;
  username: string;
  item_name: string;
  price: string;       // Decimal serialised as string from FastAPI
  explanation: string | null;
  status: RequirementStatus;
  paid: boolean;
  approved_by: number | null;
  approved_by_username: string | null;
  images: RequirementImage[];
  is_favorited: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface StatisticsResponse {
  total_count: number;
  pending_count: number;
  accepted_count: number;
  declined_count: number;
  total_price: string;
  pending_price: string;
  accepted_price: string;
  declined_price: string;
}

export interface RequirementFilters {
  page?: number;
  limit?: number;
  search?: string;
  user_id?: number;
  status?: RequirementStatus;
  paid?: boolean;
  month?: number;
  year?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}
```

---

### localStorage Key Names

The exact key strings from the PHP app carried forward to the React app (`utils/localStorage.ts`):

| Key | Type | Default |
|---|---|---|
| `statisticsVisible` | `'true'`\|`'false'` | `'false'` |
| `inboxVisible` | `'true'`\|`'false'` | `'true'` |
| `favoritesVisible` | `'true'`\|`'false'` | `'false'` |
| `sidebarHidden` | `'true'`\|`'false'` | `'false'` |
| `layoutPreference` | `'grid-layout'`\|`'list-layout'` | `'grid-layout'` |
| `layoutPreferenceFav` | `'grid-layout'`\|`'list-layout'` | `'grid-layout'` |
| `stylePreference` | `'sectioned'`\|`'all'` | `'sectioned'` |
| `auth_access_token` | string | — |
| `auth_refresh_token` | string | — |
| `auth_user` | JSON string of `User` | — |

---

### Vite Dev Proxy (Local Development Without Docker)

Add to `vite.config.ts` so API calls work during `npm run dev` without needing Docker Compose running:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

### Two-Step Image Upload Flow (Frontend)

Images are submitted in a separate step after the requirement is created, because the S3 key includes the requirement ID. The `RequirementForm` must implement this sequence:

```
1. User fills form (item_name, price, explanation) and selects files
2. User clicks submit
3. POST /api/requirements/  → receives { id, ... }
4. If files selected: POST /api/requirements/{id}/images (multipart)
5. Invalidate requirements query
6. Close/reset form
```

If step 4 fails, the requirement still exists with no images. This is acceptable; the user can retry or a future feature can allow adding images to existing requirements.

Max file size per upload: enforced by Nginx `client_max_body_size 20M` (total request body). Individual file type validated by MIME check in backend.

---

### `PATCH /api/requirements/{id}/paid` — No Request Body

This endpoint is a **pure server-side toggle** with no request body. The accountant clicks a button; the backend reads the current `paid` value and flips it:

```python
@router.patch("/{id}/paid", status_code=204)
async def toggle_paid(id: int, current_user: AccountantDep, db: ...):
    requirement = await requirement_repository.get_by_id(db, id)
    await requirement_repository.set_paid(db, requirement, not requirement.paid)
```

No Pydantic schema needed for the request. Returns `204 No Content`.

---

### `GET /api/statistics/` — Exact Filter Parameters

The statistics endpoint accepts these query params (subset of requirements filters — **no `status` param**):

| Param | Type | Notes |
|---|---|---|
| `search` | str | Same ILIKE search on item_name + explanation |
| `user_id` | int | Manager/admin/accountant only; ignored for employee |
| `paid` | bool | Optional paid filter |
| `month` | int 1–12 | Filter by creation month |
| `year` | int | Filter by creation year |

`status` is intentionally excluded — statistics always aggregate across all three statuses simultaneously. The service computes all counts and prices in a single SQL query using `CASE` expressions:

```sql
SELECT
  COUNT(*)                                          AS total_count,
  COUNT(*) FILTER (WHERE status = 'pending')        AS pending_count,
  COUNT(*) FILTER (WHERE status = 'accepted')       AS accepted_count,
  COUNT(*) FILTER (WHERE status = 'declined')       AS declined_count,
  COALESCE(SUM(price), 0)                           AS total_price,
  COALESCE(SUM(price) FILTER (WHERE status = 'pending'),  0) AS pending_price,
  COALESCE(SUM(price) FILTER (WHERE status = 'accepted'), 0) AS accepted_price,
  COALESCE(SUM(price) FILTER (WHERE status = 'declined'), 0) AS declined_price
FROM requirements r
[JOIN / WHERE clauses from active filters]
```

---

### `core/security.py` — JWT Implementation Pattern

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status
from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: int, role: str) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user_id), "role": role, "type": "access", "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def create_refresh_token(user_id: int) -> str:
    settings = get_settings()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return jwt.encode(
        {"sub": str(user_id), "type": "refresh", "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, get_settings().JWT_SECRET_KEY, algorithms=[get_settings().JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
```

---

### `GET /api/users/` — Minimal Response for Filter Dropdown

The users list is only used to populate the filter dropdown (needs `id` + `username`). Do **not** return emails in this response. Add a separate slim schema:

```python
class UserDropdownItem(BaseModel):
    id: int
    username: str
    model_config = ConfigDict(from_attributes=True)
```

`GET /api/users/` returns `list[UserDropdownItem]`, not `list[UserResponse]`. This prevents leaking email addresses to accountants who can also access this endpoint.

---

### Email Status Labels (Turkish)

When sending status update emails, map enum values to Turkish display strings:

```python
STATUS_LABELS = {
    "accepted": "Onaylandı",
    "declined": "Reddedildi",
    "pending":  "Beklemede",
}
```

Subject: `"Istek Durum Guncellemesi"`
New requirement subject: `"Yeni Istek Olusturuldu"`

---

## Known PHP Bugs Not To Carry Over

| Bug | Description | Fix in new system |
|---|---|---|
| Login second query passes plaintext password | `Login::getUser()` second SELECT passes `$pwd` as raw string to `users_pwd` column in WHERE clause (never actually compares hash, but is reachable code) | New auth service does a single query, then `verify_password()` |
| N+1 favorite queries | `isFavorited()` called in a loop per entry | Batch fetch favorited IDs for user, resolve in memory |
| `getDateRangeCondition()` dead code | Defined in `Requirement` class but never called | Not ported |
| `filterEntries.inc.php` empty file | Exists but is 1 blank line | Not ported |
| `register.php` missing | Referenced in sidebar link but not in repo | Replaced by manager-only POST `/api/users/` + frontend modal |
| CSRF via session token in `submitRequirement` + `Requirement::submitRequirement()` double-check | Checked in both handler and class, inconsistent | Replaced by JWT auth; CSRF not relevant for token-based API |

---

## Migration Checklist (Implementation Order)

### Phase 1: Backend Foundation
- [ ] Init FastAPI project, configure `core/config.py`
- [ ] Set up SQLAlchemy async session and `db/base.py`
- [ ] Write all four SQLAlchemy models
- [ ] Run first Alembic migration (`alembic revision --autogenerate -m "initial"`)
- [ ] Implement `core/security.py` (JWT + bcrypt)
- [ ] Implement `api/deps.py` (get_db, get_current_user, require_roles)

### Phase 2: Auth & Users
- [ ] `user_repository.py` (get_by_username, get_by_id, create, get_emails_by_roles)
- [ ] `auth_service.py` (login, refresh)
- [ ] `user_service.py` (create_user, change_password)
- [ ] `auth.py` endpoint (POST /api/auth/login, POST /api/auth/refresh)
- [ ] `users.py` endpoint (GET, POST /api/users/, PATCH /api/users/me/password)

### Phase 3: Requirements Core
- [ ] `requirement_repository.py` (paginated query with all filters, role-scoped)
- [ ] `favorite_repository.py` (add, remove, get_ids_for_user)
- [ ] `image_repository.py` (bulk insert, get by requirement)
- [ ] `storage_service.py` (upload, presigned URL)
- [ ] `requirement_service.py` (create, list, update_status, toggle_paid, delete)
- [ ] `requirements.py` endpoint (all routes)

### Phase 4: Favorites & Statistics
- [ ] `favorite_service.py` (toggle, paginated list)
- [ ] `favorites.py` endpoint
- [ ] `statistics_service.py` (aggregate query with filters)
- [ ] `statistics.py` endpoint

### Phase 5: Email
- [ ] `email_service.py` with aiosmtplib
- [ ] Wire into requirement_service (background tasks)

### Phase 6: Docker
- [ ] Backend Dockerfile
- [ ] LocalStack init script
- [ ] docker-compose.yml
- [ ] nginx/nginx.conf

### Phase 7: Frontend Foundation
- [ ] Vite + React + TypeScript + MUI setup
- [ ] `api/axios.ts` with interceptors
- [ ] `AuthContext.tsx`
- [ ] React Router setup in `App.tsx`
- [ ] `ProtectedRoute.tsx`
- [ ] `LoginPage.tsx`

### Phase 8: Dashboard
- [ ] `DashboardLayout.tsx` (Header + Sidebar)
- [ ] `RequirementFilters.tsx`
- [ ] `useRequirements`, `useStatistics`, `useFavorites`, `useUsers` hooks
- [ ] `RequirementCard.tsx` (grid mode)
- [ ] `RequirementRow.tsx` (list mode)
- [ ] `RequirementModal.tsx`
- [ ] `StatisticsPanel.tsx`
- [ ] `FavoritesSection.tsx`
- [ ] `RequirementForm.tsx` (employee only)
- [ ] All mutations wired with optimistic updates or invalidation

### Phase 9: Frontend Dockerfile & Nginx
- [ ] Frontend Dockerfile (build + serve)
- [ ] `frontend/nginx.conf` (SPA fallback)
- [ ] Add frontend service to docker-compose.yml

### Phase 10: Final
- [ ] `docker-compose.prod.yml` overrides
- [ ] `.env.example`
- [ ] End-to-end test of all role flows

