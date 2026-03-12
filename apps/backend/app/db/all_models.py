# Import all models so Alembic autogenerate can discover them.
# Only imported by alembic/env.py — never from application code.
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.procurement.category import Category  # noqa: F401
from app.models.location import Location  # noqa: F401
from app.models.procurement.budget_limit import BudgetLimit  # noqa: F401
from app.models.procurement.favorite import Favorite  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.password_reset_token import PasswordResetToken  # noqa: F401
from app.models.procurement.requirement import Requirement  # noqa: F401
from app.models.procurement.requirement_comment import RequirementComment  # noqa: F401
from app.models.procurement.requirement_image import RequirementImage  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.construction import ConstructionProject, ConstructionMaterial, ConstructionMilestone  # noqa: F401
from app.models.construction.issue import ConstructionIssue  # noqa: F401
