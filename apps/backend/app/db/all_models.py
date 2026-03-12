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
from app.models.construction.photo import ConstructionPhoto  # noqa: F401
from app.models.construction.comment import ConstructionComment  # noqa: F401
from app.models.construction.daily_log import ConstructionDailyLog, WeatherCondition  # noqa: F401
from app.models.construction.subcontractor import ConstructionSubcontractor  # noqa: F401
from app.models.construction.permit import ConstructionPermit  # noqa: F401
from app.models.construction.change_order import ConstructionChangeOrder  # noqa: F401
from app.models.construction.audit_log import ConstructionAuditLog  # noqa: F401
from app.models.construction.document import ConstructionDocument  # noqa: F401
from app.models.construction.project_favorite import ConstructionProjectFavorite  # noqa: F401
from app.models.construction.shipment import ConstructionShipment  # noqa: F401
from app.models.construction.project_member import ConstructionProjectMember  # noqa: F401
from app.models.construction.budget_line import ConstructionBudgetLine  # noqa: F401
from app.models.construction.safety_incident import ConstructionSafetyIncident  # noqa: F401
from app.models.construction.invoice import ConstructionInvoice  # noqa: F401
from app.models.construction.punch_list_item import ConstructionPunchListItem  # noqa: F401
from app.models.construction.rfi import ConstructionRFI  # noqa: F401
