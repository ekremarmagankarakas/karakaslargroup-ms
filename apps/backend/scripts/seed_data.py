"""
Seed script — creates sample data for all tables.
Requires seed.py to have been run first (users must exist).
Run inside the backend container:
    uv run python scripts/seed_data.py
"""
import asyncio
import hashlib
import random
import secrets
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.all_models  # noqa: F401 — registers all models
from app.core.config import get_settings
from app.models.audit_log import AuditAction, AuditLog
from app.models.budget_limit import BudgetLimit
from app.models.favorite import Favorite
from app.models.location import Location, user_locations
from app.models.notification import Notification
from app.models.requirement import Requirement, RequirementStatus
from app.models.requirement_comment import RequirementComment
from app.models.user import User

TARGET = 200
SEED = 42
FAVORITE_COUNT = 40

# ── Locations (shopping malls) ──────────────────────────────────────────────

LOCATIONS_DATA = [
    {
        "name": "Kanyon AVM",
        "address": "Büyükdere Cad. No:185, 34394 Levent/İstanbul",
        "managers": ["manager"],
        "employees": ["employee", "ali_demir", "ayse_kaya"],
    },
    {
        "name": "Forum İstanbul AVM",
        "address": "Kocatepe Mah. E-5 Yanyol No:2, 34295 Bayrampaşa/İstanbul",
        "managers": ["manager_forum"],
        "employees": ["mehmet_yilmaz", "fatma_celik"],
    },
    {
        "name": "Cevahir AVM",
        "address": "Büyükdere Cad. No:22, 34381 Şişli/İstanbul",
        "managers": ["manager_cevahir"],
        "employees": ["emre_arslan", "zeynep_sahin"],
    },
]

# ── Item pool ────────────────────────────────────────────────────────────────

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

COMMENT_BODIES = [
    "Bu talep için fiyat araştırması yapıldı, uygun görünüyor.",
    "Alternatif bir ürün de değerlendirilebilir, lütfen inceleyin.",
    "Bu ay bütçemiz doldu, gelecek aya aktarabilir miyiz?",
    "Acil ihtiyaç durumu var, önceliklendirilmesi gerekmektedir.",
    "Fiyat biraz yüksek, pazarlık yapılabilir mi?",
    "Tedarikçiyle görüşüldü, 2 hafta içinde teslim edilebilir.",
    "Ek belgeler eklendi, incelemenizi rica ederim.",
    "Bu ekipman başka departmanla paylaşılabilir mi?",
    "Onay süreci başlatıldı, takipte olunuz.",
    "Teknik özellikleri karşılıyor, onaylıyorum.",
]

STATUS_WEIGHTS = [
    (RequirementStatus.pending, 0.35),
    (RequirementStatus.accepted, 0.45),
    (RequirementStatus.declined, 0.20),
]


def weighted_choice(rng: random.Random, choices: list[tuple]):
    items, weights = zip(*choices)
    return rng.choices(items, weights=weights, k=1)[0]


# ── Seed helpers ────────────────────────────────────────────────────────────

async def seed_locations(db, users: dict) -> dict:
    """Create locations and assign users. Returns {name: Location}."""
    result = await db.execute(select(Location))
    existing = {loc.name: loc for loc in result.scalars().all()}

    locs: dict[str, Location] = {}
    for data in LOCATIONS_DATA:
        if data["name"] in existing:
            print(f"  skip  location '{data['name']}' (already exists)")
            locs[data["name"]] = existing[data["name"]]
            continue

        loc = Location(name=data["name"], address=data["address"])
        db.add(loc)
        await db.flush()
        print(f"  create location '{data['name']}'")
        locs[data["name"]] = loc

    # Assign users to locations (idempotent via ON CONFLICT DO NOTHING)
    for data in LOCATIONS_DATA:
        loc = locs.get(data["name"])
        if not loc:
            continue
        assigned_usernames = data["managers"] + data["employees"]
        for uname in assigned_usernames:
            if uname not in users:
                continue
            uid = users[uname].id
            await db.execute(
                insert(user_locations)
                .values(user_id=uid, location_id=loc.id)
                .on_conflict_do_nothing()
            )

    print(f"  assigned users to {len(locs)} locations")
    return locs


async def seed_requirements(db, users: dict, locs: dict) -> list:
    """Create requirements up to TARGET. Returns all requirement objects."""
    count_result = await db.execute(select(func.count()).select_from(Requirement))
    existing_count = count_result.scalar_one()

    # Build location mapping: username → location
    username_to_location: dict[str, Location] = {}
    for loc_data in LOCATIONS_DATA:
        loc = locs.get(loc_data["name"])
        if not loc:
            continue
        for uname in loc_data["employees"] + loc_data["managers"]:
            username_to_location[uname] = loc

    to_create = TARGET - existing_count
    if to_create <= 0:
        print(f"  skip  requirements (already {existing_count} exist, target {TARGET})")
    else:
        print(f"  creating {to_create} requirements (existing: {existing_count}, target: {TARGET})...")
        rng = random.Random(SEED + existing_count)
        approvers = [u for u in ("manager", "manager_forum", "manager_cevahir", "admin") if u in users]

        for _ in range(to_create):
            name, price_min, price_max = rng.choice(ALL_ITEMS)
            price = Decimal(str(round(rng.uniform(price_min, price_max), 2)))
            status = weighted_choice(rng, STATUS_WEIGHTS)

            # Pick a random user, weighted toward employees
            candidates = list(users.keys())
            username = rng.choice(candidates)

            approved_by = None
            if status in (RequirementStatus.accepted, RequirementStatus.declined) and approvers:
                approved_by = rng.choice(approvers)

            paid = False
            if status == RequirementStatus.accepted and rng.random() < 0.55:
                paid = True

            explanation = rng.choice(EXPLANATIONS + [None, None])  # type: ignore[list-item]
            loc = username_to_location.get(username)

            db.add(Requirement(
                user_id=users[username].id,
                item_name=name,
                price=price,
                explanation=explanation,
                status=status,
                paid=paid,
                approved_by=users[approved_by].id if approved_by else None,
                location_id=loc.id if loc else None,
            ))

        await db.flush()
        print(f"  created {to_create} requirements")

    result = await db.execute(select(Requirement))
    return result.scalars().all()


async def seed_favorites(db, users: dict, all_reqs: list) -> None:
    fav_users = {u: users[u] for u in ("manager", "admin") if u in users}
    if not fav_users or not all_reqs:
        return

    rng = random.Random(SEED)
    sample = rng.sample(all_reqs, min(FAVORITE_COUNT, len(all_reqs)))
    half = len(sample) // 2
    user_list = list(fav_users.values())
    assignments = (
        [(user_list[0], req) for req in sample[:half]] +
        [(user_list[-1], req) for req in sample[half:]]
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


async def seed_comments(db, users: dict, all_reqs: list) -> None:
    count_result = await db.execute(select(func.count()).select_from(RequirementComment))
    if count_result.scalar_one() > 0:
        print(f"  skip  comments (already exist)")
        return

    rng = random.Random(SEED + 1)
    # Add 1-3 comments to ~30% of requirements
    commenters = list(users.values())
    created = 0
    for req in rng.sample(all_reqs, min(int(len(all_reqs) * 0.30), len(all_reqs))):
        n_comments = rng.randint(1, 3)
        for _ in range(n_comments):
            db.add(RequirementComment(
                requirement_id=req.id,
                user_id=rng.choice(commenters).id,
                body=rng.choice(COMMENT_BODIES),
            ))
            created += 1

    print(f"  created {created} comments")


async def seed_notifications(db, users: dict, all_reqs: list) -> None:
    count_result = await db.execute(select(func.count()).select_from(Notification))
    if count_result.scalar_one() > 0:
        print(f"  skip  notifications (already exist)")
        return

    rng = random.Random(SEED + 2)
    all_users = list(users.values())
    created = 0

    # Status-change notifications (for requirement owners)
    accepted_reqs = [r for r in all_reqs if r.status == RequirementStatus.accepted]
    declined_reqs = [r for r in all_reqs if r.status == RequirementStatus.declined]

    for req in rng.sample(accepted_reqs, min(30, len(accepted_reqs))):
        db.add(Notification(
            user_id=req.user_id,
            requirement_id=req.id,
            message=f"Talebiniz onaylandı: {req.item_name[:50]}",
            read=rng.random() > 0.4,
        ))
        created += 1

    for req in rng.sample(declined_reqs, min(15, len(declined_reqs))):
        db.add(Notification(
            user_id=req.user_id,
            requirement_id=req.id,
            message=f"Talebiniz reddedildi: {req.item_name[:50]}",
            read=rng.random() > 0.6,
        ))
        created += 1

    # New-requirement notifications (for managers)
    managers = [u for u in all_users if u.role.value == "manager"]
    pending_reqs = [r for r in all_reqs if r.status == RequirementStatus.pending]
    for req in rng.sample(pending_reqs, min(20, len(pending_reqs))):
        for mgr in rng.sample(managers, min(2, len(managers))):
            db.add(Notification(
                user_id=mgr.id,
                requirement_id=req.id,
                message=f"Yeni talep oluşturuldu: {req.item_name[:50]}",
                read=rng.random() > 0.5,
            ))
            created += 1

    print(f"  created {created} notifications")


async def seed_audit_logs(db, users: dict, all_reqs: list) -> None:
    count_result = await db.execute(select(func.count()).select_from(AuditLog))
    if count_result.scalar_one() > 0:
        print(f"  skip  audit_logs (already exist)")
        return

    rng = random.Random(SEED + 3)
    approvers = [u for u in users.values() if u.role.value in ("manager", "admin")]
    all_users = list(users.values())
    created = 0

    for req in all_reqs:
        # Every requirement has a "created" audit entry
        db.add(AuditLog(
            requirement_id=req.id,
            actor_id=req.user_id,
            action=AuditAction.created,
            old_value=None,
            new_value=req.item_name,
        ))
        created += 1

        # Accepted/declined requirements have a status_changed entry
        if req.status in (RequirementStatus.accepted, RequirementStatus.declined) and approvers:
            actor = rng.choice(approvers)
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=actor.id,
                action=AuditAction.status_changed,
                old_value="pending",
                new_value=req.status.value,
            ))
            created += 1

        # ~25% of accepted requirements have a paid_toggled entry
        if req.paid and rng.random() < 0.25 and approvers:
            actor = rng.choice(approvers)
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=actor.id,
                action=AuditAction.paid_toggled,
                old_value="false",
                new_value="true",
            ))
            created += 1

        # ~10% of requirements have an "edited" entry
        if rng.random() < 0.10 and all_users:
            actor_id = req.user_id
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=actor_id,
                action=AuditAction.edited,
                old_value="Eski açıklama",
                new_value="Güncellenmiş açıklama",
            ))
            created += 1

    print(f"  created {created} audit log entries")


async def seed_budget_limits(db, users: dict, locs: dict) -> None:
    count_result = await db.execute(select(func.count()).select_from(BudgetLimit))
    if count_result.scalar_one() > 0:
        print(f"  skip  budget_limits (already exist)")
        return

    admin = users.get("admin")
    if not admin:
        print(f"  skip  budget_limits (no admin user)")
        return

    now = datetime.now(tz=timezone.utc)
    created = 0

    # Company-wide budget: last 6 months + next month
    for delta in range(-5, 2):
        target = now + timedelta(days=delta * 30)
        month = target.month
        year = target.year
        amount = Decimal(str(random.randint(500, 900) * 1000))
        db.add(BudgetLimit(
            amount=amount,
            period_month=month,
            period_year=year,
            set_by=admin.id,
            location_id=None,
        ))
        created += 1

    # Per-location budgets: current month + last 3 months for each location
    for loc in locs.values():
        for delta in range(-3, 1):
            target = now + timedelta(days=delta * 30)
            month = target.month
            year = target.year
            amount = Decimal(str(random.randint(150, 350) * 1000))
            db.add(BudgetLimit(
                amount=amount,
                period_month=month,
                period_year=year,
                set_by=admin.id,
                location_id=loc.id,
            ))
            created += 1

    print(f"  created {created} budget limit entries")


async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        # Load users
        result = await db.execute(select(User))
        users = {u.username: u for u in result.scalars().all()}

        if not users:
            print("No users found. Run 'uv run python scripts/seed.py' first.")
            return

        # 1. Locations
        locs = await seed_locations(db, users)
        await db.flush()

        # 2. Requirements
        all_reqs = await seed_requirements(db, users, locs)
        await db.flush()

        # 3. Favorites
        await seed_favorites(db, users, all_reqs)

        # 4. Comments
        await seed_comments(db, users, all_reqs)

        # 5. Notifications
        await seed_notifications(db, users, all_reqs)

        # 6. Audit logs
        await seed_audit_logs(db, users, all_reqs)

        # 7. Budget limits
        await seed_budget_limits(db, users, locs)

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
