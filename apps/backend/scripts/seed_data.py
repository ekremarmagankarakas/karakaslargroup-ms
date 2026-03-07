"""
Seed script — creates sample requirements and favorites.
Requires seed.py to have been run first (users must exist).
Run inside the backend container:
    uv run python scripts/seed_data.py
"""
import asyncio
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import get_settings
import app.db.all_models  # noqa: F401 — registers all models
from app.models.favorite import Favorite
from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User

SEED_REQUIREMENTS = [
    {
        "item_name": "MacBook Pro 16 inch",
        "price": Decimal("75000.00"),
        "explanation": "Geliştirme ortamı için yüksek performanslı dizüstü bilgisayar gereksinimi.",
        "status": RequirementStatus.accepted,
        "paid": True,
        "user": "employee",
        "approved_by": "manager",
    },
    {
        "item_name": "Ergonomik Ofis Koltuğu",
        "price": Decimal("8500.00"),
        "explanation": "Uzun çalışma saatleri için bel desteği sağlayan koltuk.",
        "status": RequirementStatus.accepted,
        "paid": False,
        "user": "employee",
        "approved_by": "manager",
    },
    {
        "item_name": "27 inch 4K Monitör",
        "price": Decimal("15000.00"),
        "explanation": None,
        "status": RequirementStatus.pending,
        "paid": False,
        "user": "employee",
        "approved_by": None,
    },
    {
        "item_name": "Yazılım Lisansı - JetBrains All Products",
        "price": Decimal("4200.00"),
        "explanation": "Yıllık takım lisansı.",
        "status": RequirementStatus.pending,
        "paid": False,
        "user": "admin",
        "approved_by": None,
    },
    {
        "item_name": "USB-C Hub",
        "price": Decimal("1200.00"),
        "explanation": None,
        "status": RequirementStatus.declined,
        "paid": False,
        "user": "employee",
        "approved_by": None,
    },
    {
        "item_name": "Mekanik Klavye",
        "price": Decimal("3500.00"),
        "explanation": "Günlük yoğun yazım için sessiz anahtarlı mekanik klavye.",
        "status": RequirementStatus.accepted,
        "paid": True,
        "user": "admin",
        "approved_by": "manager",
    },
    {
        "item_name": "Harici SSD 2TB",
        "price": Decimal("2800.00"),
        "explanation": None,
        "status": RequirementStatus.pending,
        "paid": False,
        "user": "employee",
        "approved_by": None,
    },
    {
        "item_name": "Webcam 4K",
        "price": Decimal("2200.00"),
        "explanation": "Uzaktan toplantılar için yüksek kaliteli kamera.",
        "status": RequirementStatus.declined,
        "paid": False,
        "user": "admin",
        "approved_by": None,
    },
]

# username → requirement item_names to favorite
SEED_FAVORITES = {
    "manager": [
        "MacBook Pro 16 inch",
        "Yazılım Lisansı - JetBrains All Products",
        "27 inch 4K Monitör",
    ],
    "admin": [
        "Ergonomik Ofis Koltuğu",
        "Mekanik Klavye",
    ],
}


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        # Load users
        result = await db.execute(select(User))
        users = {u.username: u for u in result.scalars().all()}

        missing = {"employee", "manager", "admin"} - users.keys()
        if missing:
            print(f"Missing required users: {missing}. Run 'make seed' first.")
            return

        # Seed requirements
        req_map: dict[str, Requirement] = {}
        for data in SEED_REQUIREMENTS:
            result = await db.execute(
                select(Requirement).where(Requirement.item_name == data["item_name"])
            )
            existing = result.scalar_one_or_none()
            if existing:
                print(f"  skip  requirement '{data['item_name']}' (already exists)")
                req_map[data["item_name"]] = existing
                continue

            approver_id = users[data["approved_by"]].id if data["approved_by"] else None
            req = Requirement(
                user_id=users[data["user"]].id,
                item_name=data["item_name"],
                price=data["price"],
                explanation=data["explanation"],
                status=data["status"],
                paid=data["paid"],
                approved_by=approver_id,
            )
            db.add(req)
            await db.flush()  # get id before commit
            req_map[data["item_name"]] = req
            print(f"  create requirement '{data['item_name']}' ({data['status'].value})")

        # Seed favorites
        for username, item_names in SEED_FAVORITES.items():
            user = users.get(username)
            if not user:
                print(f"  skip  favorites for '{username}' (user not found)")
                continue
            for item_name in item_names:
                req = req_map.get(item_name)
                if not req:
                    print(f"  skip  favorite '{item_name}' (requirement not found)")
                    continue

                result = await db.execute(
                    select(Favorite).where(
                        Favorite.user_id == user.id,
                        Favorite.requirement_id == req.id,
                    )
                )
                if result.scalar_one_or_none():
                    print(f"  skip  favorite '{item_name}' for {username} (already exists)")
                    continue

                db.add(Favorite(user_id=user.id, requirement_id=req.id))
                print(f"  create favorite '{item_name}' for {username}")

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
