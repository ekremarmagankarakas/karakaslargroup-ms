# Import all models so Alembic autogenerate can discover them.
# Only imported by alembic/env.py — never from application code.
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.budget_limit import BudgetLimit  # noqa: F401
from app.models.favorite import Favorite  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
from app.models.requirement import Requirement  # noqa: F401
from app.models.requirement_comment import RequirementComment  # noqa: F401
from app.models.requirement_image import RequirementImage  # noqa: F401
from app.models.user import User  # noqa: F401
