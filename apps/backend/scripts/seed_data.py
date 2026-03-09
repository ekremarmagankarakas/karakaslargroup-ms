"""
Seed script — creates sample data for all tables with realistic historical spread.
Requires seed.py to have been run first (users must exist).
Run inside the backend container:
    uv run python scripts/seed_data.py
"""
import asyncio
import random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
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

# ── Global config ─────────────────────────────────────────────────────────────

TARGET      = 600
SEED        = 42
DATE_START  = datetime(2023, 1, 1, tzinfo=timezone.utc)   # 2+ years of history

# ── Location definitions ──────────────────────────────────────────────────────

LOCATIONS_DATA = [
    {
        "name": "Kanyon AVM",
        "address": "Büyükdere Cad. No:185, 34394 Levent/İstanbul",
        "managers": ["manager"],
        "employees": ["employee", "ali_demir", "ayse_kaya"],
        # Larger premium mall → higher budget
        "budget_base": (220_000, 370_000),
    },
    {
        "name": "Forum İstanbul AVM",
        "address": "Kocatepe Mah. E-5 Yanyol No:2, 34295 Bayrampaşa/İstanbul",
        "managers": ["manager_forum"],
        "employees": ["mehmet_yilmaz", "fatma_celik"],
        "budget_base": (175_000, 310_000),
    },
    {
        "name": "Cevahir AVM",
        "address": "Büyükdere Cad. No:22, 34381 Şişli/İstanbul",
        "managers": ["manager_cevahir"],
        "employees": ["emre_arslan", "zeynep_sahin"],
        "budget_base": (130_000, 240_000),
    },
]

# Seasonal multiplier per month (Q4 spending surge, Q1 tighter)
SEASONAL = {
    1: 0.82, 2: 0.85, 3: 0.90,
    4: 0.95, 5: 1.00, 6: 1.05,
    7: 0.97, 8: 0.93, 9: 1.08,
    10: 1.15, 11: 1.25, 12: 1.35,
}

# Company-wide budget ranges (sum of locations + overhead)
COMPANY_BUDGET_BASE = (620_000, 1_050_000)

# ── Item pools ────────────────────────────────────────────────────────────────

LAPTOPS = [
    ("MacBook Pro 14 inch M3", 65_000, 95_000),
    ("MacBook Pro 16 inch M3", 85_000, 115_000),
    ("MacBook Air M2", 45_000, 65_000),
    ("Dell XPS 15", 55_000, 82_000),
    ("Dell XPS 13", 40_000, 58_000),
    ("Lenovo ThinkPad X1 Carbon", 50_000, 78_000),
    ("Lenovo ThinkPad T14s", 36_000, 52_000),
    ("HP EliteBook 840 G10", 38_000, 60_000),
    ("HP ProBook 450 G10", 28_000, 42_000),
    ("ASUS ProArt StudioBook 16", 65_000, 95_000),
    ("Microsoft Surface Laptop 5", 48_000, 72_000),
    ("Samsung Galaxy Book3 Pro", 35_000, 55_000),
]
MONITORS = [
    ('Dell UltraSharp 27" 4K Monitör', 12_000, 18_000),
    ('LG 32" UltraWide QHD Monitör', 14_000, 20_000),
    ('Samsung 27" Curved Monitör', 8_000, 14_000),
    ('BenQ 32" 4K Profesyonel Monitör', 15_000, 22_000),
    ('ASUS ProArt 27" OLED Monitör', 18_000, 28_000),
    ("Apple Studio Display", 45_000, 55_000),
    ('LG UltraFine 5K Display', 35_000, 48_000),
]
PERIPHERALS = [
    ("Logitech MX Keys Klavye", 2_800, 3_800),
    ("Apple Magic Keyboard", 3_200, 4_200),
    ("Keychron K8 Mekanik Klavye", 2_200, 3_200),
    ("Logitech MX Master 3 Mouse", 2_400, 3_200),
    ("Apple Magic Mouse", 2_800, 3_600),
    ("Logitech MX Keys Combo Seti", 5_000, 7_000),
    ("Razer Pro Type Ultra Klavye", 3_500, 4_800),
    ("Microsoft Ergonomic Klavye + Mouse Seti", 2_000, 3_200),
]
STORAGE = [
    ("Samsung T7 Shield 2TB SSD", 2_800, 3_800),
    ("WD My Passport 4TB", 2_200, 3_200),
    ("Samsung 990 Pro 2TB NVMe", 2_400, 3_400),
    ("Seagate Expansion 8TB", 3_200, 4_500),
    ("OWC ThunderBay 4 RAID", 15_000, 22_000),
    ("Synology DS923+ NAS", 12_000, 18_000),
]
NETWORKING = [
    ("Cisco Catalyst 2960 Switch", 8_000, 15_000),
    ("UniFi AP WiFi 6 Erişim Noktası", 3_500, 5_500),
    ("APC Smart-UPS 1500VA", 8_500, 13_000),
    ("Cat6a UTP Kablo (305m)", 1_200, 2_000),
    ("Patch Panel 24 Port", 1_500, 2_800),
    ("Server Rack 42U", 18_000, 30_000),
    ("pfSense Firewall Cihazı", 6_000, 10_000),
]
AUDIO_VIDEO = [
    ("Logitech Brio 4K Webcam", 3_200, 4_800),
    ("Rode NT-USB Mini Mikrofon", 2_200, 3_500),
    ("Blue Yeti X Mikrofon", 3_500, 5_000),
    ("Jabra Evolve2 85 Kulaklık", 6_500, 9_500),
    ("Sony WH-1000XM5 Kulaklık", 7_500, 10_500),
    ("Elgato Key Light Air", 2_800, 4_200),
    ("Epson EB-L200F Projektör", 28_000, 42_000),
    ('Samsung Flip 65" Etkileşimli Ekran', 85_000, 120_000),
    ("Jabra PanaCast 50 Konferans Kamera", 18_000, 28_000),
]
SOFTWARE = [
    ("Microsoft 365 Business Premium (10 kullanıcı)", 18_000, 25_000),
    ("Adobe Creative Cloud Ekip Planı (5 kullanıcı)", 12_000, 18_000),
    ("JetBrains All Products Pack (5 lisans)", 15_000, 22_000),
    ("Slack Business+ (20 kullanıcı)", 8_000, 14_000),
    ("Zoom Business (20 kullanıcı)", 6_000, 10_000),
    ("GitHub Team (15 kullanıcı)", 4_000, 7_000),
    ("Figma Professional (10 kullanıcı)", 8_000, 13_000),
    ("1Password Teams (15 kullanıcı)", 3_000, 5_000),
    ("Jira Software Cloud (25 kullanıcı)", 6_000, 10_000),
    ("AWS Reserved Instance (1 yıl)", 25_000, 60_000),
    ("Google Workspace Business (10 kullanıcı)", 8_000, 14_000),
    ("Antivirus Kurumsal Lisans (50 cihaz)", 4_000, 8_000),
]
FURNITURE = [
    ("Herman Miller Aeron Koltuk", 28_000, 42_000),
    ("Secretlab Titan XL Koltuk", 12_000, 18_000),
    ("FlexiSpot E7 Standing Desk", 8_000, 14_000),
    ("IKEA Bekant Çalışma Masası", 3_500, 6_000),
    ("Toplantı Masası 8 Kişilik", 12_000, 22_000),
    ("Misafir Sandalyesi (4 adet)", 4_000, 8_000),
    ("Ofis Kitaplığı", 2_500, 5_000),
    ("Metal Dosya Dolabı", 1_800, 3_500),
    ("Beyaz Tahta 120x180cm", 1_500, 3_000),
    ("Akustik Panel Seti (12 adet)", 3_000, 6_000),
    ("Locker Dolabı 10 Bölmeli", 5_000, 9_000),
    ("Telefon Kabini (Akustik)", 15_000, 25_000),
]
OFFICE_SUPPLIES = [
    ("A4 Fotokopi Kağıdı (10 koli)", 800, 1_400),
    ("Lazer Yazıcı Toner Seti", 1_200, 2_200),
    ("Kağıt İmha Makinesi", 800, 2_000),
    ("Projeksiyon Perdesi 180cm", 1_500, 3_000),
    ("Ofis Telefonu (IP Telefon)", 1_200, 2_500),
    ("Masa Düzenleyici Set", 400, 900),
]
TRAINING = [
    ("AWS Solutions Architect Sertifikası Eğitimi", 3_000, 6_000),
    ("Kubernetes CKA Sertifikası Kursu", 2_500, 5_000),
    ("Agile & Scrum Master Eğitimi", 2_000, 4_500),
    ("Python İleri Seviye Online Eğitim", 1_500, 3_500),
    ("UI/UX Tasarım Bootcamp", 3_000, 6_000),
    ("Liderlik ve Yönetim Eğitimi", 4_000, 8_000),
    ("CompTIA Security+ Sertifikası", 2_500, 5_000),
    ("İngilizce İş İletişimi Kursu (6 ay)", 2_000, 4_000),
    ("Microsoft Azure Fundamentals Kursu", 1_500, 3_500),
    ("Google Cloud Professional Eğitimi", 3_500, 7_000),
]
ACCESSORIES = [
    ("USB-C Docking Station 12-in-1", 3_500, 6_500),
    ("USB-C Hub 7-Port", 1_200, 2_200),
    ("Monitor Arm Stand Tekli", 800, 1_800),
    ("Monitor Arm Stand Çiftli", 1_500, 3_000),
    ("Laptop Stand Aluminyum", 500, 1_200),
    ("Kablo Yönetim Seti", 200, 600),
    ("USB-C Şarj Aleti 140W", 1_200, 2_200),
    ("Powerbank 20000mAh", 800, 1_800),
    ("Mouse Pad XL", 150, 450),
    ("HDMI 2.1 Kablo (2m)", 200, 500),
    ("Laptop Sırt Çantası", 600, 1_500),
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
    "Yıllık bütçe planlaması kapsamında talep edildi.",
    "Departmanlar arası kaynak paylaşımı için gerekli.",
    "Uzman kadro tarafından talep edilmiştir.",
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
    "Fiyat teklifi alındı, uygun.",
    "Benzer bir talep geçen ay reddedilmişti, lütfen tekrar inceleyin.",
]

# ── Helper functions ──────────────────────────────────────────────────────────

def weighted_choice(rng: random.Random, choices: list[tuple]):
    items, weights = zip(*choices)
    return rng.choices(items, weights=weights, k=1)[0]


def months_ago(dt: datetime) -> float:
    now = datetime.now(tz=timezone.utc)
    return (now - dt).days / 30.44


def status_weights(dt: datetime) -> list[tuple]:
    """Older requirements are almost all resolved; recent ones are mostly pending."""
    age = months_ago(dt)
    if age > 18:
        return [(RequirementStatus.pending, 0.02), (RequirementStatus.accepted, 0.72), (RequirementStatus.declined, 0.26)]
    if age > 12:
        return [(RequirementStatus.pending, 0.05), (RequirementStatus.accepted, 0.68), (RequirementStatus.declined, 0.27)]
    if age > 6:
        return [(RequirementStatus.pending, 0.12), (RequirementStatus.accepted, 0.62), (RequirementStatus.declined, 0.26)]
    if age > 3:
        return [(RequirementStatus.pending, 0.22), (RequirementStatus.accepted, 0.55), (RequirementStatus.declined, 0.23)]
    if age > 1:
        return [(RequirementStatus.pending, 0.38), (RequirementStatus.accepted, 0.46), (RequirementStatus.declined, 0.16)]
    return [(RequirementStatus.pending, 0.65), (RequirementStatus.accepted, 0.28), (RequirementStatus.declined, 0.07)]


def paid_probability(dt: datetime) -> float:
    """Older accepted requirements are more likely to have been paid."""
    age = months_ago(dt)
    if age > 12: return 0.92
    if age > 6:  return 0.80
    if age > 3:  return 0.60
    if age > 1:  return 0.38
    return 0.12


def iter_months(start: datetime, end: datetime):
    """Yield (year, month) from start through end inclusive."""
    y, m = start.year, start.month
    while (y, m) <= (end.year, end.month):
        yield y, m
        m += 1
        if m > 12:
            m = 1
            y += 1


def budget_amount(rng: random.Random, lo: int, hi: int, month: int) -> Decimal:
    base = rng.randint(lo, hi)
    seasonal = SEASONAL.get(month, 1.0)
    # Add small year-over-year growth noise
    return Decimal(str(round(base * seasonal / 1000) * 1000))


# ── Seed helpers ──────────────────────────────────────────────────────────────

async def seed_locations(db, users: dict) -> dict:
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

    for data in LOCATIONS_DATA:
        loc = locs.get(data["name"])
        if not loc:
            continue
        for uname in data["managers"] + data["employees"]:
            if uname not in users:
                continue
            await db.execute(
                insert(user_locations)
                .values(user_id=users[uname].id, location_id=loc.id)
                .on_conflict_do_nothing()
            )

    print(f"  assigned users to {len(locs)} locations")
    return locs


async def seed_requirements(db, users: dict, locs: dict) -> list:
    count_result = await db.execute(select(func.count()).select_from(Requirement))
    existing_count = count_result.scalar_one()

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
        print(f"  creating {to_create} requirements spread across {DATE_START.year}–now...")
        rng = random.Random(SEED + existing_count)
        approvers = [u for u in ("manager", "manager_forum", "manager_cevahir", "admin") if u in users]
        employees = [u for u in users if users[u].role.value == "employee"]
        non_employees = [u for u in users if users[u].role.value != "employee"]

        now = datetime.now(tz=timezone.utc)
        total_seconds = (now - DATE_START).total_seconds()

        for _ in range(to_create):
            # Random creation time spread uniformly across the full date range
            created_at = DATE_START + timedelta(seconds=rng.uniform(0, total_seconds))

            name, price_min, price_max = rng.choice(ALL_ITEMS)
            # Slight price inflation over time (~10% per year)
            years_elapsed = (created_at - DATE_START).days / 365
            inflation = 1 + 0.10 * years_elapsed
            price = Decimal(str(round(rng.uniform(price_min, price_max) * inflation, 2)))

            status = weighted_choice(rng, status_weights(created_at))

            # 70% employees, 30% others
            if rng.random() < 0.70 and employees:
                username = rng.choice(employees)
            else:
                username = rng.choice(non_employees) if non_employees else rng.choice(list(users.keys()))

            if username not in users:
                username = rng.choice(list(users.keys()))

            approved_by = None
            if status in (RequirementStatus.accepted, RequirementStatus.declined) and approvers:
                approved_by = rng.choice(approvers)

            paid = False
            if status == RequirementStatus.accepted and rng.random() < paid_probability(created_at):
                paid = True

            explanation = rng.choice(EXPLANATIONS + [None, None, None])  # type: ignore[list-item]
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
                created_at=created_at,
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
    sample_size = min(60, len(all_reqs))
    sample = rng.sample(all_reqs, sample_size)
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
    commenters = list(users.values())
    created = 0
    sample_size = min(int(len(all_reqs) * 0.35), len(all_reqs))
    for req in rng.sample(all_reqs, sample_size):
        for _ in range(rng.randint(1, 4)):
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
    all_users_list = list(users.values())
    managers = [u for u in all_users_list if u.role.value == "manager"]
    created = 0

    accepted_reqs = [r for r in all_reqs if r.status == RequirementStatus.accepted]
    declined_reqs = [r for r in all_reqs if r.status == RequirementStatus.declined]
    pending_reqs  = [r for r in all_reqs if r.status == RequirementStatus.pending]

    for req in rng.sample(accepted_reqs, min(80, len(accepted_reqs))):
        db.add(Notification(
            user_id=req.user_id,
            requirement_id=req.id,
            message=f"Talebiniz onaylandı: {req.item_name[:50]}",
            read=rng.random() > 0.3,
        ))
        created += 1

    for req in rng.sample(declined_reqs, min(40, len(declined_reqs))):
        db.add(Notification(
            user_id=req.user_id,
            requirement_id=req.id,
            message=f"Talebiniz reddedildi: {req.item_name[:50]}",
            read=rng.random() > 0.5,
        ))
        created += 1

    for req in rng.sample(pending_reqs, min(40, len(pending_reqs))):
        for mgr in rng.sample(managers, min(2, len(managers))):
            db.add(Notification(
                user_id=mgr.id,
                requirement_id=req.id,
                message=f"Yeni talep oluşturuldu: {req.item_name[:50]}",
                read=rng.random() > 0.4,
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
    created = 0

    for req in all_reqs:
        db.add(AuditLog(
            requirement_id=req.id,
            actor_id=req.user_id,
            action=AuditAction.created,
            old_value=None,
            new_value=req.item_name,
        ))
        created += 1

        if req.status in (RequirementStatus.accepted, RequirementStatus.declined) and approvers:
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=rng.choice(approvers).id,
                action=AuditAction.status_changed,
                old_value="pending",
                new_value=req.status.value,
            ))
            created += 1

        if req.paid and rng.random() < 0.30 and approvers:
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=rng.choice(approvers).id,
                action=AuditAction.paid_toggled,
                old_value="false",
                new_value="true",
            ))
            created += 1

        if rng.random() < 0.12:
            db.add(AuditLog(
                requirement_id=req.id,
                actor_id=req.user_id,
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

    rng = random.Random(SEED + 4)
    now = datetime.now(tz=timezone.utc)
    # Cover the same date range as requirements, plus one month ahead
    end = datetime(now.year, now.month, 1, tzinfo=timezone.utc) + timedelta(days=32)
    end = end.replace(day=1)
    created = 0

    # ── Company-wide budgets ──────────────────────────────────────────────────
    for y, m in iter_months(DATE_START, end):
        lo, hi = COMPANY_BUDGET_BASE
        amount = budget_amount(rng, lo, hi, m)
        db.add(BudgetLimit(
            amount=amount,
            period_month=m,
            period_year=y,
            set_by=admin.id,
            location_id=None,
        ))
        created += 1

    # ── Per-location budgets ──────────────────────────────────────────────────
    for loc_data in LOCATIONS_DATA:
        loc = locs.get(loc_data["name"])
        if not loc:
            continue
        lo, hi = loc_data["budget_base"]
        for y, m in iter_months(DATE_START, end):
            amount = budget_amount(rng, lo, hi, m)
            db.add(BudgetLimit(
                amount=amount,
                period_month=m,
                period_year=y,
                set_by=admin.id,
                location_id=loc.id,
            ))
            created += 1

    print(f"  created {created} budget limit entries")


# ── Main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    settings = get_settings()
    engine = create_async_engine(settings.DATABASE_URL)
    Session = async_sessionmaker(engine, expire_on_commit=False)

    async with Session() as db:
        result = await db.execute(select(User))
        users = {u.username: u for u in result.scalars().all()}

        if not users:
            print("No users found. Run 'uv run python scripts/seed.py' first.")
            return

        locs = await seed_locations(db, users)
        await db.flush()

        all_reqs = await seed_requirements(db, users, locs)
        await db.flush()

        await seed_favorites(db, users, all_reqs)
        await seed_comments(db, users, all_reqs)
        await seed_notifications(db, users, all_reqs)
        await seed_audit_logs(db, users, all_reqs)
        await seed_budget_limits(db, users, locs)

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
