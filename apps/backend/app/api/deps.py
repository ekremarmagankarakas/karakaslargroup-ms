from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import AsyncSessionLocal
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
    payload = decode_token(credentials.credentials)
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    user = await UserRepository(db).get_by_id(int(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_roles(*roles: UserRole):
    """Factory: returns a dependency that enforces role membership."""
    async def _check(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user
    return _check


# Pre-built role guards
CurrentUser = Annotated[User, Depends(get_current_user)]
ManagerOrAdmin = Annotated[User, Depends(require_roles(UserRole.manager, UserRole.admin))]
ManagerOrAccountantOrAdmin = Annotated[User, Depends(require_roles(UserRole.manager, UserRole.accountant, UserRole.admin))]
AccountantDep = Annotated[User, Depends(require_roles(UserRole.accountant, UserRole.admin))]
AdminOnly = Annotated[User, Depends(require_roles(UserRole.admin))]
EmployeeDep = Annotated[User, Depends(require_roles(UserRole.employee, UserRole.admin))]
