# Import all models so Alembic autogenerate can discover them.
# Only imported by alembic/env.py — never from application code.
from app.models.favorite import Favorite  # noqa: F401
from app.models.requirement import Requirement  # noqa: F401
from app.models.requirement_image import RequirementImage  # noqa: F401
from app.models.user import User  # noqa: F401
