"""
Seed script — creates sample requirements and favorites.
Requires seed.py to have been run first (users must exist).
Run inside the backend container:
    uv run python scripts/seed_data.py
"""
import asyncio
import random
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.all_models  # noqa: F401 — registers all models
from app.core.config import get_settings
from app.models.favorite import Favorite
from app.models.requirement import Requirement, RequirementStatus
from app.models.user import User

TARGET = 200
SEED = 42
FAVORITE_COUNT = 40  # total favorites to spread across manager + admin

# ── Item pool ──────────────────────────────────────────────────────────────
# (item_name, price_min, price_max)

LAPTOPS = [
    ("MacBook Pro 14 inch M3", 65000, 95000),
    ("MacBook Pro 16 inch M3", 85000, 115000),
    ("MacBook Air M2", 45000, 65000),
    ("Dell XPS 15", 55000, 82000),
    ("Dell XPS 13", 40000, 58000),
    ("Lenovo ThinkPad X1 Carbon", 50000, 78000),
    ("Lenovo ThinkPad T14s", 36000, 52000),
    ("HP EliteBook 840 G10", 38000, 60000),
    ("HP ProBook 450 G10", 28000, 42000),
    ("ASUS ProArt StudioBook 16", 65000, 95000),
    ("Microsoft Surface Laptop 5", 48000, 72000),
    ("Samsung Galaxy Book3 Pro", 35000, 55000),
]

MONITORS = [
    ('Dell UltraSharp 27" 4K Monitör', 12000, 18000),
    ('LG 32" UltraWide QHD Monitör', 14000, 20000),
    ('Samsung 27" Curved Monitör', 8000, 14000),
    ('BenQ 32" 4K Profesyonel Monitör', 15000, 22000),
    ('ASUS ProArt 27" OLED Monitör', 18000, 28000),
    ("Apple Studio Display", 45000, 55000),
    ('LG UltraFine 5K Display', 35000, 48000),
]

PERIPHERALS = [
    ("Logitech MX Keys Klavye", 2800, 3800),
    ("Apple Magic Keyboard", 3200, 4200),
    ("Keychron K8 Mekanik Klavye", 2200, 3200),
    ("Logitech MX Master 3 Mouse", 2400, 3200),
    ("Apple Magic Mouse", 2800, 3600),
    ("Logitech MX Keys Combo Seti", 5000, 7000),
    ("Razer Pro Type Ultra Klavye", 3500, 4800),
    ("Microsoft Ergonomic Klavye + Mouse Seti", 2000, 3200),
]

STORAGE = [
    ("Samsung T7 Shield 2TB SSD", 2800, 3800),
    ("WD My Passport 4TB", 2200, 3200),
    ("Samsung 990 Pro 2TB NVMe", 2400, 3400),
    ("Seagate Expansion 8TB", 3200, 4500),
    ("OWC ThunderBay 4 RAID", 15000, 22000),
    ("Synology DS923+ NAS", 12000, 18000),
]

NETWORKING = [
    ("Cisco Catalyst 2960 Switch", 8000, 15000),
    ("UniFi AP WiFi 6 Erişim Noktası", 3500, 5500),
    ("APC Smart-UPS 1500VA", 8500, 13000),
    ("Cat6a UTP Kablo (305m)", 1200, 2000),
    ("Patch Panel 24 Port", 1500, 2800),
    ("Server Rack 42U", 18000, 30000),
    ("pfSense Firewall Cihazı", 6000, 10000),
]

AUDIO_VIDEO = [
    ("Logitech Brio 4K Webcam", 3200, 4800),
    ("Rode NT-USB Mini Mikrofon", 2200, 3500),
    ("Blue Yeti X Mikrofon", 3500, 5000),
    ("Jabra Evolve2 85 Kulaklık", 6500, 9500),
    ("Sony WH-1000XM5 Kulaklık", 7500, 10500),
    ("Elgato Key Light Air", 2800, 4200),
    ("Elgato Stream Deck MK.2", 3800, 5200),
    ("Epson EB-L200F Projektör", 28000, 42000),
    ('Samsung Flip 65" Etkileşimli Ekran', 85000, 120000),
    ("Jabra PanaCast 50 Konferans Kamera", 18000, 28000),
]

SOFTWARE = [
    ("Microsoft 365 Business Premium (10 kullanıcı)", 18000, 25000),
    ("Adobe Creative Cloud Ekip Planı (5 kullanıcı)", 12000, 18000),
    ("JetBrains All Products Pack (5 lisans)", 15000, 22000),
    ("Slack Business+ (20 kullanıcı)", 8000, 14000),
    ("Zoom Business (20 kullanıcı)", 6000, 10000),
    ("GitHub Team (15 kullanıcı)", 4000, 7000),
    ("Figma Professional (10 kullanıcı)", 8000, 13000),
    ("Notion Team (10 kullanıcı)", 3500, 6000),
    ("1Password Teams (15 kullanıcı)", 3000, 5000),
    ("Jira Software Cloud (25 kullanıcı)", 6000, 10000),
    ("Confluence Cloud (25 kullanıcı)", 5000, 9000),
    ("AWS Reserved Instance (1 yıl)", 25000, 60000),
    ("Google Workspace Business (10 kullanıcı)", 8000, 14000),
    ("Antivirus Kurumsal Lisans (50 cihaz)", 4000, 8000),
    ("Miro Team (10 kullanıcı)", 3000, 5500),
    ("Linear Business Plan (15 kullanıcı)", 2500, 4500),
]

FURNITURE = [
    ("Herman Miller Aeron Koltuk", 28000, 42000),
    ("Secretlab Titan XL Koltuk", 12000, 18000),
    ("FlexiSpot E7 Standing Desk", 8000, 14000),
    ("IKEA Bekant Çalışma Masası", 3500, 6000),
    ("Toplantı Masası 8 Kişilik", 12000, 22000),
    ("Misafir Sandalyesi (4 adet)", 4000, 8000),
    ("Ofis Kitaplığı", 2500, 5000),
    ("Metal Dosya Dolabı", 1800, 3500),
    ("Beyaz Tahta 120x180cm", 1500, 3000),
    ("Akustik Panel Seti (12 adet)", 3000, 6000),
    ("Locker Dolabı 10 Bölmeli", 5000, 9000),
    ("Telefon Kabini (Akustik)", 15000, 25000),
]

OFFICE_SUPPLIES = [
    ("A4 Fotokopi Kağıdı (10 koli)", 800, 1400),
    ("Lazer Yazıcı Toner Seti", 1200, 2200),
    ("Kağıt İmha Makinesi", 800, 2000),
    ("Projeksiyon Perdesi 180cm", 1500, 3000),
    ("Ofis Telefonu (IP Telefon)", 1200, 2500),
    ("Masa Düzenleyici Set", 400, 900),
]

TRAINING = [
    ("AWS Solutions Architect Sertifikası Eğitimi", 3000, 6000),
    ("Kubernetes CKA Sertifikası Kursu", 2500, 5000),
    ("Agile & Scrum Master Eğitimi", 2000, 4500),
    ("Python İleri Seviye Online Eğitim", 1500, 3500),
    ("UI/UX Tasarım Bootcamp", 3000, 6000),
    ("Liderlik ve Yönetim Eğitimi", 4000, 8000),
    ("CompTIA Security+ Sertifikası", 2500, 5000),
    ("İngilizce İş İletişimi Kursu (6 ay)", 2000, 4000),
    ("Microsoft Azure Fundamentals Kursu", 1500, 3500),
    ("Google Cloud Professional Eğitimi", 3500, 7000),
]

ACCESSORIES = [
    ("USB-C Docking Station 12-in-1", 3500, 6500),
    ("USB-C Hub 7-Port", 1200, 2200),
    ("Monitor Arm Stand Tekli", 800, 1800),
    ("Monitor Arm Stand Çiftli", 1500, 3000),
    ("Laptop Stand Aluminyum", 500, 1200),
    ("Kablo Yönetim Seti", 200, 600),
    ("USB-C Şarj Aleti 140W", 1200, 2200),
    ("Powerbank 20000mAh", 800, 1800),
    ("Mouse Pad XL", 150, 450),
    ("Göz Koruyucu Filtre 27 inch", 500, 1200),
    ("Laptop Sırt Çantası", 600, 1500),
    ("HDMI 2.1 Kablo (2m)", 200, 500),
]

ALL_ITEMS = (
    LAPTOPS + MONITORS + PERIPHERALS + STORAGE + NETWORKING
    + AUDIO_VIDEO + SOFTWARE + FURNITURE + OFFICE_SUPPLIES
    + TRAINING + ACCESSORIES
)

EXPLANATIONS = [
    "Ekip verimliliğini artırmak için gerekli.",
    "Mevcut ekipmanın güncellenmesi gerekmektedir.",
    "Uzaktan çalışma kapasitesini güçlendirmek için talep edildi.",
    "Proje gereksinimleri kapsamında ihtiyaç duyulmaktadır.",
    "Eski cihazın değiştirilmesi gerekmektedir.",
    "Takım çalışması verimliliğini artırmak amacıyla talep edildi.",
    "Yeni proje için ek kaynak gereksinimi.",
    "Departman büyümesi nedeniyle ek ekipman talep edilmektedir.",
    "Mevcut lisans kapasitesi yetersiz kalmaktadır.",
    "Müşteri toplantıları için gerekli ekipman.",
    "Güvenlik gereksinimlerini karşılamak amacıyla talep edildi.",
    "Yedek ekipman olarak stokta bulundurulması planlanmaktadır.",
]

STATUS_WEIGHTS = [
    (RequirementStatus.pending, 0.35),
    (RequirementStatus.accepted, 0.45),
    (RequirementStatus.declined, 0.20),
]

USER_WEIGHTS = [
    ("employee", 0.50),
    ("admin", 0.28),
    ("manager", 0.16),
    ("accountant", 0.06),
]


def weighted_choice(rng: random.Random, choices: list[tuple]) -> str:
    items, weights = zip(*choices)
    return rng.choices(items, weights=weights, k=1)[0]  # type: ignore[return-value]


def generate_requirements(n: int, offset: int, users: dict) -> list[dict]:
    rng = random.Random(SEED + offset)
    result = []
    approvers = [u for u in ("manager", "admin") if u in users]

    for _ in range(n):
        name, price_min, price_max = rng.choice(ALL_ITEMS)
        price = Decimal(str(round(rng.uniform(price_min, price_max), 2)))
        status = weighted_choice(rng, STATUS_WEIGHTS)
        username = weighted_choice(rng, USER_WEIGHTS)

        # Fallback if user not in db
        if username not in users and users:
            username = next(iter(users))

        approved_by = None
        if status in (RequirementStatus.accepted, RequirementStatus.declined) and approvers:
            approved_by = rng.choice(approvers)

        paid = False
        if status == RequirementStatus.accepted and rng.random() < 0.55:
            paid = True

        explanation = rng.choice(EXPLANATIONS + [None, None])  # type: ignore[list-item]

        result.append({
            "item_name": name,
            "price": price,
            "status": status,
            "user": username,
            "approved_by": approved_by,
            "paid": paid,
            "explanation": explanation,
        })

    return result


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        # Load users
        result = await db.execute(select(User))
        users = {u.username: u for u in result.scalars().all()}

        if not users:
            print("No users found. Run 'make seed' first.")
            return

        # Count existing requirements
        count_result = await db.execute(select(func.count()).select_from(Requirement))
        existing_count = count_result.scalar_one()

        to_create = TARGET - existing_count
        if to_create <= 0:
            print(f"  skip  requirements (already {existing_count} exist, target {TARGET})")
        else:
            print(f"  creating {to_create} requirements (existing: {existing_count}, target: {TARGET})...")
            items = generate_requirements(to_create, offset=existing_count, users=users)
            for item in items:
                approver_id = users[item["approved_by"]].id if item["approved_by"] and item["approved_by"] in users else None
                db.add(Requirement(
                    user_id=users[item["user"]].id,
                    item_name=item["item_name"],
                    price=item["price"],
                    explanation=item["explanation"],
                    status=item["status"],
                    paid=item["paid"],
                    approved_by=approver_id,
                ))
            await db.flush()
            print(f"  created {to_create} requirements")

        # Seed favorites — fetch all requirements and pick random subset
        result = await db.execute(select(Requirement))
        all_reqs = result.scalars().all()

        fav_users = {u: users[u] for u in ("manager", "admin") if u in users}
        if fav_users and all_reqs:
            rng = random.Random(SEED)
            sample = rng.sample(all_reqs, min(FAVORITE_COUNT, len(all_reqs)))
            half = len(sample) // 2
            assignments = (
                [(users[u], req) for u, reqs in [
                    (list(fav_users.keys())[0], sample[:half]),
                    (list(fav_users.keys())[-1], sample[half:]),
                ] for req in reqs]
                if len(fav_users) >= 2
                else [(list(fav_users.values())[0], req) for req in sample]
            )

            new_favs = 0
            for fav_user, req in assignments:
                exists = await db.execute(
                    select(Favorite).where(
                        Favorite.user_id == fav_user.id,
                        Favorite.requirement_id == req.id,
                    )
                )
                if not exists.scalar_one_or_none():
                    db.add(Favorite(user_id=fav_user.id, requirement_id=req.id))
                    new_favs += 1

            if new_favs:
                print(f"  created {new_favs} favorites")
            else:
                print(f"  skip  favorites (already exist)")

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
