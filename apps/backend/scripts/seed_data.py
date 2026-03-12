"""
Seed script — creates sample data for all tables with realistic historical spread.
Requires seed.py to have been run first (users must exist).
Run inside the backend container:
    uv run python scripts/seed_data.py
"""
import asyncio
import random
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

import app.db.all_models  # noqa: F401 — registers all models
from app.core.config import get_settings
from app.models.audit_log import AuditAction, AuditLog
from app.models.procurement.budget_limit import BudgetLimit
from app.models.procurement.category import Category
from app.models.procurement.favorite import Favorite
from app.models.location import Location, user_locations
from app.models.notification import Notification
from app.models.procurement.requirement import Requirement, RequirementPriority, RequirementStatus
from app.models.procurement.requirement_comment import RequirementComment
from app.models.user import User
from app.models.construction.project import ConstructionProject, ConstructionProjectStatus, ConstructionProjectType
from app.models.construction.material import ConstructionMaterial, ConstructionMaterialUnit
from app.models.construction.milestone import ConstructionMilestone, ConstructionTaskStatus
from app.models.construction.issue import ConstructionIssue, ConstructionIssueSeverity, ConstructionIssueStatus
from app.models.construction.shipment import ConstructionShipment, ShipmentStatus

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

# ── Category definitions ───────────────────────────────────────────────────────

CATEGORIES_DATA = [
    {"name": "IT Ekipmanları", "color": "#2563eb"},
    {"name": "Yazılım Lisansları", "color": "#7c3aed"},
    {"name": "Mobilya & Ofis", "color": "#16a34a"},
    {"name": "Eğitim", "color": "#d97706"},
    {"name": "Ses & Görüntü", "color": "#dc2626"},
]

# Map item name prefix to category name for auto-assignment
def item_category(item_name: str) -> str:
    for keyword, cat in [
        ("Microsoft 365", "Yazılım Lisansları"),
        ("Adobe", "Yazılım Lisansları"),
        ("JetBrains", "Yazılım Lisansları"),
        ("Slack", "Yazılım Lisansları"),
        ("Zoom", "Yazılım Lisansları"),
        ("GitHub", "Yazılım Lisansları"),
        ("Figma", "Yazılım Lisansları"),
        ("1Password", "Yazılım Lisansları"),
        ("Jira", "Yazılım Lisansları"),
        ("AWS Reserved", "Yazılım Lisansları"),
        ("Google Workspace", "Yazılım Lisansları"),
        ("Antivirus", "Yazılım Lisansları"),
        ("Herman Miller", "Mobilya & Ofis"),
        ("Secretlab", "Mobilya & Ofis"),
        ("FlexiSpot", "Mobilya & Ofis"),
        ("IKEA", "Mobilya & Ofis"),
        ("Toplantı Masası", "Mobilya & Ofis"),
        ("Misafir Sandalyesi", "Mobilya & Ofis"),
        ("Ofis Kitaplığı", "Mobilya & Ofis"),
        ("Metal Dosya", "Mobilya & Ofis"),
        ("Beyaz Tahta", "Mobilya & Ofis"),
        ("Akustik Panel", "Mobilya & Ofis"),
        ("Locker", "Mobilya & Ofis"),
        ("Telefon Kabini", "Mobilya & Ofis"),
        ("A4 Fotokopi", "Mobilya & Ofis"),
        ("Lazer Yazıcı", "Mobilya & Ofis"),
        ("Kağıt İmha", "Mobilya & Ofis"),
        ("Projeksiyon Perdesi", "Mobilya & Ofis"),
        ("Ofis Telefonu", "Mobilya & Ofis"),
        ("Masa Düzenleyici", "Mobilya & Ofis"),
        ("AWS Solutions", "Eğitim"),
        ("Kubernetes", "Eğitim"),
        ("Agile", "Eğitim"),
        ("Python İleri", "Eğitim"),
        ("UI/UX", "Eğitim"),
        ("Liderlik", "Eğitim"),
        ("CompTIA", "Eğitim"),
        ("İngilizce", "Eğitim"),
        ("Microsoft Azure", "Eğitim"),
        ("Google Cloud Professional", "Eğitim"),
        ("Logitech Brio", "Ses & Görüntü"),
        ("Rode", "Ses & Görüntü"),
        ("Blue Yeti", "Ses & Görüntü"),
        ("Jabra Evolve", "Ses & Görüntü"),
        ("Sony WH", "Ses & Görüntü"),
        ("Elgato", "Ses & Görüntü"),
        ("Epson", "Ses & Görüntü"),
        ("Samsung Flip", "Ses & Görüntü"),
        ("Jabra PanaCast", "Ses & Görüntü"),
    ]:
        if item_name.startswith(keyword):
            return cat
    return "IT Ekipmanları"

# Priority weights: urgent items rarer, normal most common
PRIORITY_WEIGHTS = [
    (RequirementPriority.low, 15),
    (RequirementPriority.normal, 55),
    (RequirementPriority.high, 22),
    (RequirementPriority.urgent, 8),
]

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


async def seed_categories(db) -> dict[str, Category]:
    result = await db.execute(select(Category))
    existing = {cat.name: cat for cat in result.scalars().all()}

    cats: dict[str, Category] = {}
    for data in CATEGORIES_DATA:
        if data["name"] in existing:
            cats[data["name"]] = existing[data["name"]]
        else:
            cat = Category(name=data["name"], color=data["color"])
            db.add(cat)
            await db.flush()
            cats[data["name"]] = cat
            print(f"  create category '{data['name']}'")

    if len(existing) == len(CATEGORIES_DATA):
        print(f"  skip  categories (already exist)")
    return cats


async def seed_requirements(db, users: dict, locs: dict, cats: dict) -> list:
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

            priority = weighted_choice(rng, PRIORITY_WEIGHTS)
            cat_name = item_category(name)
            cat = cats.get(cat_name)

            db.add(Requirement(
                user_id=users[username].id,
                item_name=name,
                price=price,
                explanation=explanation,
                status=status,
                paid=paid,
                approved_by=users[approved_by].id if approved_by else None,
                location_id=loc.id if loc else None,
                category_id=cat.id if cat else None,
                priority=priority,
                created_at=created_at,
            ))

        await db.flush()
        print(f"  created {to_create} requirements")

    result = await db.execute(select(Requirement))
    return result.scalars().all()


async def backfill_requirement_fields(db, cats: dict) -> None:
    """Assign category and priority to existing requirements that have none."""
    result = await db.execute(
        select(Requirement).where(Requirement.category_id.is_(None))
    )
    reqs = result.scalars().all()
    if not reqs:
        print(f"  skip  backfill (all requirements already have categories)")
        return

    rng = random.Random(SEED + 99)
    updated = 0
    for req in reqs:
        cat_name = item_category(req.item_name)
        cat = cats.get(cat_name)
        req.category_id = cat.id if cat else None
        req.priority = weighted_choice(rng, PRIORITY_WEIGHTS)
        updated += 1

    print(f"  backfilled category+priority for {updated} existing requirements")


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


# ── Construction seed data ────────────────────────────────────────────────────

CONSTRUCTION_PROJECTS = [
    {
        "name": "Güneşli Park AVM",
        "description": "Bağcılar/Güneşli bölgesinde sıfırdan inşa edilecek 85.000 m² kapalı alanlı bölgesel alışveriş merkezi. 3 bodrum kat otopark, zemin + 3 normal kat mağaza alanı, sinema kompleksi ve açık hava food court içermektedir.",
        "location": None,
        "creator": "admin",
        "status": ConstructionProjectStatus.active,
        "start_date": date(2024, 4, 1),
        "end_date": date(2026, 10, 31),
        "budget": Decimal("1_850_000_000"),
        "progress_pct": 38,
        "materials": [
            {"name": "C40 Hazır Beton (Yapısal)", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("52000"), "quantity_used": Decimal("28500"), "unit_cost": Decimal("4200")},
            {"name": "S500 Nervürlü İnşaat Demiri", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("8400"), "quantity_used": Decimal("4100"), "unit_cost": Decimal("32000")},
            {"name": "Strüktürel Çelik Profil (HEA/HEB)", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("2200"), "quantity_used": Decimal("850"), "unit_cost": Decimal("58000")},
            {"name": "Cam Cephe Sistemi (Unitize)", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("18000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("4800")},
            {"name": "Kompozit Alüminyum Cephe Paneli", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("12000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("1850")},
            {"name": "Ytong Gazbeton Duvar Bloku (20cm)", "material_type": "Duvar", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("35000"), "quantity_used": Decimal("8500"), "unit_cost": Decimal("320")},
            {"name": "Su Yalıtım Membranı (Bodrum)", "material_type": "Yalıtım", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("28000"), "quantity_used": Decimal("22000"), "unit_cost": Decimal("185")},
        ],
        "milestones": [
            {"title": "Arsa Hazırlık ve Hafriyat", "description": "İksa sistemleri, hafriyat (yaklaşık 180.000 m³) ve zemin iyileştirme çalışmaları.", "due_date": date(2024, 8, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Bodrum Kat Betonarme ve Su Yalıtımı", "description": "B1-B3 kat betonarme taşıyıcı sistem ve toprak altı su yalıtımı.", "due_date": date(2025, 2, 28), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Üst Yapı Kaba İnşaat (Z+3)", "description": "Zemin ve normal katların kolon, kiriş, döşeme betonarme işleri ile çelik çatı konstrüksiyonu.", "due_date": date(2025, 9, 30), "status": ConstructionTaskStatus.in_progress, "completion_pct": 55},
            {"title": "Cephe ve Çatı Kapatma", "description": "Cam cephe, kompozit panel, çatı örtüsü ve ışıklık sistemleri.", "due_date": date(2026, 3, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "İç Mekân İnce Yapı ve Tesisat", "description": "MEP tesisatları, zemin-duvar-tavan kaplamaları, ortak alan imalatları.", "due_date": date(2026, 7, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Kiracı Teslimi ve Açılış", "description": "Mağaza kabuk teslimi, açılış denetimleri ve resmi açılış.", "due_date": date(2026, 10, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
        ],
    },
    {
        "name": "Maslak Rezidans Kulesi",
        "description": "Sarıyer/Maslak iş merkezinde 42 katlı lüks rezidans kulesi. 380 konut birimi, sosyal donatılar, fitness merkezi ve bodrum katlarda kapalı otopark.",
        "location": None,
        "creator": "admin",
        "status": ConstructionProjectStatus.active,
        "start_date": date(2023, 11, 1),
        "end_date": date(2026, 6, 30),
        "budget": Decimal("2_400_000_000"),
        "progress_pct": 62,
        "materials": [
            {"name": "C50 Yüksek Dayanımlı Hazır Beton", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("38000"), "quantity_used": Decimal("26800"), "unit_cost": Decimal("5200")},
            {"name": "S500 İnşaat Demiri (Dıştan Kaplamalı)", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("5800"), "quantity_used": Decimal("4200"), "unit_cost": Decimal("34000")},
            {"name": "Perdeli Duvar Kalıp Sistemi (Tuniform)", "material_type": "Kalıp", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("6500"), "quantity_used": Decimal("6500"), "unit_cost": Decimal("2800")},
            {"name": "Low-E Isıcamlı Alüminyum Doğrama", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("22000"), "quantity_used": Decimal("9500"), "unit_cost": Decimal("3600")},
            {"name": "Granit Zemin Kaplama (60x60)", "material_type": "Kaplama", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("18000"), "quantity_used": Decimal("4200"), "unit_cost": Decimal("580")},
            {"name": "EPS Isı Yalıtım Levhası (12cm)", "material_type": "Yalıtım", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("28000"), "quantity_used": Decimal("16000"), "unit_cost": Decimal("145")},
            {"name": "Prefabrik Merdiven ve Sahanlık", "material_type": "Prefabrik", "unit": ConstructionMaterialUnit.adet, "quantity_planned": Decimal("168"), "quantity_used": Decimal("110"), "unit_cost": Decimal("18500")},
        ],
        "milestones": [
            {"title": "Temel Kazısı ve Fore Kazık", "description": "Derin temel kazısı, 320 adet fore kazık imalatı ve temel betonajı.", "due_date": date(2024, 3, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Bodrum Katlar ve Perde Duvarlar (B1-B4)", "description": "4 bodrum kattaki betonarme perde ve döşeme sistemi.", "due_date": date(2024, 8, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Normal Kat Taşıyıcı Sistem (1-25. Kat)", "description": "Alt 25 kattaki kolon, perde ve döşeme betonarme imalatları.", "due_date": date(2025, 4, 30), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Normal Kat Taşıyıcı Sistem (26-42. Kat)", "description": "Üst 17 kattaki taşıyıcı sistem tamamlama ve teknik kat.", "due_date": date(2025, 10, 31), "status": ConstructionTaskStatus.in_progress, "completion_pct": 70},
            {"title": "Cephe ve Doğrama Montajı", "description": "Low-E cam cephe sistemi, alüminyum doğrama ve dış kaplama.", "due_date": date(2026, 2, 28), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "İç Mimari ve Anahtar Teslim", "description": "Daire iç imalatları, ortak alan bitişleri ve teslim.", "due_date": date(2026, 6, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
        ],
    },
    {
        "name": "Ataşehir Karma Kullanım Kompleksi",
        "description": "Ataşehir finans bölgesinde 120.000 m² inşaat alanlı karma yapı kompleksi. A ve B olmak üzere iki ofis kulesi (28'er kat), aralarında bağlantılı alışveriş sokağı ve 5 yıldızlı butik otel bloğu.",
        "location": None,
        "creator": "manager",
        "status": ConstructionProjectStatus.planning,
        "start_date": date(2025, 10, 1),
        "end_date": date(2029, 3, 31),
        "budget": Decimal("4_200_000_000"),
        "progress_pct": 0,
        "materials": [
            {"name": "C45 Hazır Beton", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("85000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("4600")},
            {"name": "S500 İnşaat Demiri", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("14000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("33000")},
            {"name": "Strüktürel Çelik (Çatı ve Bağlantı Köprüsü)", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("3800"), "quantity_used": Decimal("0"), "unit_cost": Decimal("62000")},
            {"name": "Yüksek Performanslı Cam Cephe (DGU)", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("48000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("5400")},
            {"name": "Doğal Taş Cephe Kaplama (Travertin)", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("8500"), "quantity_used": Decimal("0"), "unit_cost": Decimal("2200")},
        ],
        "milestones": [
            {"title": "Mimari ve Mühendislik Projeleri", "description": "Konsept onayı, uygulama projeleri, zemin etüdü ve mühendislik hesapları.", "due_date": date(2026, 1, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "İnşaat Ruhsatı ve Yüklenici İhale", "description": "Tüm ruhsatların alınması, ana yüklenici ve alt yüklenici ihaleleri.", "due_date": date(2026, 4, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Hafriyat ve Temel Sistemi", "description": "Derin hafriyat (~350.000 m³), iksa, fore kazık ve temel plak.", "due_date": date(2026, 12, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Bodrum ve Zemin Katlar", "description": "B1-B3 bodrum katlar ile zemin kat kaba yapı.", "due_date": date(2027, 8, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Kule Kabuğu Tamamlama", "description": "A ve B kulesi taşıyıcı sistem ve cephe kapatma.", "due_date": date(2028, 6, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "İç Mekân ve Açılış", "description": "Ofis, otel ve perakende alanları ince yapı ve açılış.", "due_date": date(2029, 3, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
        ],
    },
    {
        "name": "Bursa Nilüfer Yaşam Vadisi",
        "description": "Bursa Nilüfer ilçesinde 9 blok, 1.250 daireli konut projesi. 2+1, 3+1 ve 4+1 daire tipleri, kapalı otopark, sosyal tesis, yüzme havuzu ve spor alanları.",
        "location": None,
        "creator": "manager",
        "status": ConstructionProjectStatus.completed,
        "start_date": date(2021, 6, 1),
        "end_date": date(2024, 12, 31),
        "budget": Decimal("1_650_000_000"),
        "progress_pct": 100,
        "materials": [
            {"name": "C35 Hazır Beton", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("148000"), "quantity_used": Decimal("148000"), "unit_cost": Decimal("3800")},
            {"name": "S420 Nervürlü İnşaat Demiri", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("18500"), "quantity_used": Decimal("18500"), "unit_cost": Decimal("28000")},
            {"name": "Tuğla (Bims Blok 19cm)", "material_type": "Duvar", "unit": ConstructionMaterialUnit.adet, "quantity_planned": Decimal("4200000"), "quantity_used": Decimal("4200000"), "unit_cost": Decimal("8")},
            {"name": "ETICS Dış Cephe Mantolama (8cm)", "material_type": "Yalıtım", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("185000"), "quantity_used": Decimal("185000"), "unit_cost": Decimal("320")},
            {"name": "PVC Pencere ve Balkon Kapısı", "material_type": "Doğrama", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("42000"), "quantity_used": Decimal("42000"), "unit_cost": Decimal("1850")},
            {"name": "Laminat Parke (AC4)", "material_type": "Zemin", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("120000"), "quantity_used": Decimal("120000"), "unit_cost": Decimal("185")},
            {"name": "Seramik Banyo/Mutfak Kaplama", "material_type": "Kaplama", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("95000"), "quantity_used": Decimal("95000"), "unit_cost": Decimal("220")},
        ],
        "milestones": [
            {"title": "Altyapı ve Hafriyat (Tüm Bloklar)", "description": "Site geneli altyapı, iksa ve 9 bloğun hafriyatı.", "due_date": date(2021, 12, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "1. Etap Kaba Yapı (Blok 1-4)", "description": "İlk 4 bloğun temel, bodrum ve normal kat kaba yapısı.", "due_date": date(2022, 10, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "2. Etap Kaba Yapı (Blok 5-9)", "description": "Son 5 bloğun kaba yapısı.", "due_date": date(2023, 6, 30), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Cephe, Doğrama ve Dış Mantolama", "description": "Tüm bloklar PVC doğrama, ETICS mantolama ve dış boya.", "due_date": date(2023, 12, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "İç Mekân Tamamlama ve Teslimler", "description": "Daire iç imalatları, ortak alan bitişleri ve hak sahiplerine teslim.", "due_date": date(2024, 12, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
        ],
    },
    {
        "name": "İzmir Bayraklı Ofis Kampüsü",
        "description": "İzmir Bayraklı'da Körfez manzaralı 3 adet 18 katlı A sınıfı ofis kulesi. Toplam 75.000 m² kiralanabilir ofis alanı, konferans merkezi, restoran katı ve bağlantılı kapalı otopark.",
        "location": None,
        "creator": "admin",
        "status": ConstructionProjectStatus.on_hold,
        "start_date": date(2025, 5, 1),
        "end_date": date(2028, 5, 31),
        "budget": Decimal("2_100_000_000"),
        "progress_pct": 8,
        "materials": [
            {"name": "C45 Yüksek Dayanımlı Beton", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("62000"), "quantity_used": Decimal("4800"), "unit_cost": Decimal("4800")},
            {"name": "S500 Deprem Çeliği", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("9200"), "quantity_used": Decimal("320"), "unit_cost": Decimal("35000")},
            {"name": "Spider Cam Cephe Sistemi", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("32000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("6200")},
            {"name": "Akıllı Bina Otomasyon Sistemi", "material_type": "Elektrik/Otomasyon", "unit": ConstructionMaterialUnit.adet, "quantity_planned": Decimal("3"), "quantity_used": Decimal("0"), "unit_cost": Decimal("8500000")},
            {"name": "Zemin Sondaj ve İyileştirme", "material_type": "Zemin", "unit": ConstructionMaterialUnit.m, "quantity_planned": Decimal("4800"), "quantity_used": Decimal("4200"), "unit_cost": Decimal("1850")},
        ],
        "milestones": [
            {"title": "Zemin Etüdü ve Temel Projesi", "description": "Sismik zemin etüdü, fore kazık hesabı ve temel uygulama projesi.", "due_date": date(2025, 7, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Zemin İyileştirme ve Fore Kazıklar", "description": "Zayıf zemin güçlendirme, 480 adet fore kazık imalatı.", "due_date": date(2025, 11, 30), "status": ConstructionTaskStatus.in_progress, "completion_pct": 45},
            {"title": "Temel ve Bodrum Katlar", "description": "Temel plak, B1-B3 bodrum katlar ve otopark betonarme.", "due_date": date(2026, 6, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Kule Taşıyıcı Sistemler", "description": "3 kulenin 1-18. kat kolon, perde ve döşeme sistemi.", "due_date": date(2027, 6, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Cephe ve İç Yapı Tamamlama", "description": "Spider cam cephe, iç mekân imalatları ve MEP tesisatları.", "due_date": date(2028, 5, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
        ],
    },
    {
        "name": "Ankara Çukurambar Premium Konut",
        "description": "Ankara Çankaya/Çukurambar'da 2 blok, 320 daireli üst segment konut projesi. 1+1 den 5+1'e daire seçenekleri, yarı olimpik kapalı havuz, sauna, özel sinema salonu.",
        "location": None,
        "creator": "manager",
        "status": ConstructionProjectStatus.active,
        "start_date": date(2024, 9, 1),
        "end_date": date(2027, 3, 31),
        "budget": Decimal("980_000_000"),
        "progress_pct": 22,
        "materials": [
            {"name": "C40 Hazır Beton", "material_type": "Beton", "unit": ConstructionMaterialUnit.m3, "quantity_planned": Decimal("28500"), "quantity_used": Decimal("8200"), "unit_cost": Decimal("4400")},
            {"name": "S500 Nervürlü Çelik", "material_type": "Çelik", "unit": ConstructionMaterialUnit.ton, "quantity_planned": Decimal("3800"), "quantity_used": Decimal("920"), "unit_cost": Decimal("33500")},
            {"name": "Asansör (10 Kişilik Panoramik)", "material_type": "Mekanik", "unit": ConstructionMaterialUnit.adet, "quantity_planned": Decimal("8"), "quantity_used": Decimal("0"), "unit_cost": Decimal("1200000")},
            {"name": "Alüminyum Cephe Giydirme Sistemi", "material_type": "Cephe", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("14500"), "quantity_used": Decimal("0"), "unit_cost": Decimal("2800")},
            {"name": "Yerden Isıtma Sistemi Borusu", "material_type": "Tesisat", "unit": ConstructionMaterialUnit.m, "quantity_planned": Decimal("85000"), "quantity_used": Decimal("0"), "unit_cost": Decimal("42")},
            {"name": "Akustik Katlararası Ses Yalıtımı", "material_type": "Yalıtım", "unit": ConstructionMaterialUnit.m2, "quantity_planned": Decimal("16000"), "quantity_used": Decimal("3200"), "unit_cost": Decimal("280")},
        ],
        "milestones": [
            {"title": "Hafriyat ve İksa Sistemi", "description": "Derine inme, iksa kazıkları ve hafriyat (yaklaşık 45.000 m³).", "due_date": date(2024, 12, 31), "status": ConstructionTaskStatus.completed, "completion_pct": 100},
            {"title": "Temel ve Bodrum Betonarme", "description": "Radye temel, B1-B2 bodrum ve zemin kat taşıyıcı sistemi.", "due_date": date(2025, 5, 31), "status": ConstructionTaskStatus.in_progress, "completion_pct": 60},
            {"title": "Normal Kat Kaba Yapı (1-15. Kat)", "description": "İki blokta 1-15. katlar arası betonarme yapı iskeleti.", "due_date": date(2025, 12, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Normal Kat Kaba Yapı (16-24. Kat)", "description": "Üst katlar taşıyıcı sistem tamamlama ve çatı.", "due_date": date(2026, 6, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Dış Cephe ve Doğrama", "description": "Alüminyum giydirme cephe, pencere ve balkon sistemleri.", "due_date": date(2026, 11, 30), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
            {"title": "Anahtar Teslim ve Tapular", "description": "Daire iç bitişleri, iskan belgesi ve alıcılara teslim.", "due_date": date(2027, 3, 31), "status": ConstructionTaskStatus.not_started, "completion_pct": 0},
        ],
    },
]


CONSTRUCTION_PROJECT_TYPES = [
    ConstructionProjectType.shopping_mall,
    ConstructionProjectType.residential,
    ConstructionProjectType.mixed_use,
    ConstructionProjectType.residential,
    ConstructionProjectType.office,
    ConstructionProjectType.residential,
]

CONSTRUCTION_ISSUE_TEMPLATES = [
    [
        {"title": "Temel Beton Kalitesi Sorunu", "description": "B4 aks kesişiminde C30 beton numunelerinde 28 günlük dayanım değerleri hedefin %15 altında çıktı.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.in_progress},
        {"title": "Vinç Bakım Gecikmesi", "description": "8 numaralı tower crane bakımı 3 gün gecikti, üst kat kalıp çalışmaları aksıyor.", "severity": ConstructionIssueSeverity.medium, "status": ConstructionIssueStatus.open},
        {"title": "Elektrik Trafo Bağlantısı Bekleniyor", "description": "Kalıcı elektrik aboneliği için gerekli trafo bağlantısı BEDAŞ tarafından 6 hafta geciktirildi.", "severity": ConstructionIssueSeverity.critical, "status": ConstructionIssueStatus.open},
    ],
    [
        {"title": "Su Sızıntısı — B2 Kat Perdesi", "description": "Kuzey cephe bodrum perdelerinde nem ve su sızıntısı tespit edildi; zemin etüt raporu ile uyumsuz.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.in_progress},
        {"title": "Demir Tedarik Gecikmesi", "description": "S500 nervürlü inşaat demiri teslimatı limandekilerin grevinden dolayı 2 hafta gecikecek.", "severity": ConstructionIssueSeverity.medium, "status": ConstructionIssueStatus.open},
        {"title": "Kalıp Düşmesi — Kaza Raporu", "description": "5. kat döşeme kalıbında kısmi düşme yaşandı; hasar minimal, yaralanma yok. İSG raporu hazırlandı.", "severity": ConstructionIssueSeverity.critical, "status": ConstructionIssueStatus.resolved},
    ],
    [
        {"title": "Zemin Etüt Revizyonu Gerekiyor", "description": "İhale aşamasında zemin etüt raporundaki zemin sınıfı revizyonu yapılması gerekiyor, proje başlangıcını etkileyebilir.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.open},
        {"title": "Ruhsat Ek Süresi Talebi", "description": "Mimari projedeki kat alanı değişikliği nedeniyle belediyeye ek süre talebi yapıldı.", "severity": ConstructionIssueSeverity.medium, "status": ConstructionIssueStatus.in_progress},
    ],
    [
        {"title": "Cephe Cam Montaj Kusuru", "description": "D blok 8-12. katlarda cam cephe silikon derzlerinde ayrılma görüldü; alt yüklenici değişimi gündemde.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.resolved},
        {"title": "Mesleki İzin Süresi Doldu", "description": "Baş iş güvenliği uzmanının mesleki yeterlilik belgesi yenilenmedi.", "severity": ConstructionIssueSeverity.low, "status": ConstructionIssueStatus.resolved},
        {"title": "Teslim Sonrası Su Tesisatı Sızıntısı", "description": "Bazı dairelerde teslimden sonra pişirme alanı altında sızıntı bildirimi alındı.", "severity": ConstructionIssueSeverity.medium, "status": ConstructionIssueStatus.resolved},
    ],
    [
        {"title": "Altyapı Bağlantı Noktası Sorunu", "description": "Yapı ruhsatında gösterilen altyapı (atık su) bağlantı noktası ile sahada mevcut konum arasında 8 m sapma var.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.open},
        {"title": "İSG: Yüksekte Çalışma Belgesi Eksik", "description": "Çatı ve cephe ekibinde iki işçinin yüksekte çalışma belgesi yok; iş durdurma riski.", "severity": ConstructionIssueSeverity.critical, "status": ConstructionIssueStatus.in_progress},
    ],
    [
        {"title": "Geç Teslim Riski — Zemin Kat Kaba Yapı", "description": "Mevcut ilerlemeye göre zemin kat kaba yapısının 3 hafta gecikmesi bekleniyor.", "severity": ConstructionIssueSeverity.medium, "status": ConstructionIssueStatus.open},
        {"title": "Prefabrik Merdiven Ölçü Hatası", "description": "C bloğu için sipariş edilen prefabrik merdiven ve sahanlıkların plandaki ölçüden 5 cm fazla geldiği anlaşıldı.", "severity": ConstructionIssueSeverity.high, "status": ConstructionIssueStatus.in_progress},
        {"title": "Doğalgaz Bağlantı Gecikme", "description": "Doğalgaz aboneliği GASDAŞ/İGDAŞ onayı bekleniyor, sıcak test yapılamıyor.", "severity": ConstructionIssueSeverity.low, "status": ConstructionIssueStatus.open},
    ],
]


async def seed_construction_projects(db, users: dict, locs: dict) -> None:
    count_result = await db.execute(select(func.count()).select_from(ConstructionProject))
    if count_result.scalar_one() > 0:
        print(f"  skip  construction projects (already exist)")
        return

    created_projects = 0
    created_materials = 0
    created_milestones = 0
    created_issues = 0

    reporter = users.get("manager") or users.get("admin")

    for idx, pdata in enumerate(CONSTRUCTION_PROJECTS):
        creator = users.get(pdata["creator"])
        if not creator:
            print(f"  skip  project '{pdata['name']}' (creator '{pdata['creator']}' not found)")
            continue

        loc = locs.get(pdata["location"]) if pdata["location"] else None

        project = ConstructionProject(
            name=pdata["name"],
            description=pdata["description"],
            location_id=loc.id if loc else None,
            created_by=creator.id,
            status=pdata["status"],
            project_type=CONSTRUCTION_PROJECT_TYPES[idx % len(CONSTRUCTION_PROJECT_TYPES)],
            start_date=pdata["start_date"],
            end_date=pdata["end_date"],
            budget=pdata["budget"],
            progress_pct=pdata["progress_pct"],
        )
        db.add(project)
        await db.flush()
        created_projects += 1

        for mdata in pdata["materials"]:
            db.add(ConstructionMaterial(
                project_id=project.id,
                name=mdata["name"],
                material_type=mdata["material_type"],
                unit=mdata["unit"],
                quantity_planned=mdata["quantity_planned"],
                quantity_used=mdata["quantity_used"],
                unit_cost=mdata.get("unit_cost"),
            ))
            created_materials += 1

        for msdata in pdata["milestones"]:
            db.add(ConstructionMilestone(
                project_id=project.id,
                title=msdata["title"],
                description=msdata.get("description"),
                due_date=msdata.get("due_date"),
                status=msdata["status"],
                completion_pct=msdata["completion_pct"],
            ))
            created_milestones += 1

        for idata in CONSTRUCTION_ISSUE_TEMPLATES[idx % len(CONSTRUCTION_ISSUE_TEMPLATES)]:
            db.add(ConstructionIssue(
                project_id=project.id,
                title=idata["title"],
                description=idata["description"],
                severity=idata["severity"],
                status=idata["status"],
                reported_by=reporter.id if reporter else None,
            ))
            created_issues += 1

    await db.flush()
    print(f"  created {created_projects} construction projects, {created_materials} materials, {created_milestones} milestones, {created_issues} issues")


async def seed_construction_shipments(db, users: dict) -> None:
    count_result = await db.execute(select(func.count()).select_from(ConstructionShipment))
    if count_result.scalar_one() > 0:
        print("  skip  construction shipments (already exist)")
        return

    # Fetch all projects and their materials
    projects_result = await db.execute(select(ConstructionProject))
    projects = list(projects_result.scalars().all())
    if not projects:
        print("  skip  construction shipments (no projects)")
        return

    materials_result = await db.execute(select(ConstructionMaterial))
    materials = list(materials_result.scalars().all())
    materials_by_project: dict[int, list[ConstructionMaterial]] = {}
    for m in materials:
        materials_by_project.setdefault(m.project_id, []).append(m)

    receiver = users.get("manager") or users.get("admin")
    today = date.today()
    created = 0

    shipment_templates = [
        {"supplier_name": "Çelik Yapı A.Ş.", "status": ShipmentStatus.delivered, "days_ago_order": 30, "days_ago_delivery": 10},
        {"supplier_name": "İnşaat Malzemeleri Ltd.", "status": ShipmentStatus.in_transit, "days_ago_order": 7, "days_ago_delivery": None},
        {"supplier_name": "Güven Tedarik", "status": ShipmentStatus.ordered, "days_ago_order": 2, "days_ago_delivery": None},
    ]

    for project in projects:
        mats = materials_by_project.get(project.id, [])
        for idx, tmpl in enumerate(shipment_templates):
            mat = mats[idx % len(mats)] if mats else None
            order_date = today - timedelta(days=tmpl["days_ago_order"])
            actual_delivery = (today - timedelta(days=tmpl["days_ago_delivery"])) if tmpl["days_ago_delivery"] else None
            qty_ordered = Decimal("50") if mat is None else Decimal(str(round(float(mat.quantity_planned) * 0.4, 2)))
            qty_delivered = qty_ordered if tmpl["status"] == ShipmentStatus.delivered else None
            db.add(ConstructionShipment(
                project_id=project.id,
                material_id=mat.id if mat else None,
                material_name=mat.name if mat else f"Malzeme {idx+1}",
                supplier_name=tmpl["supplier_name"],
                quantity_ordered=qty_ordered,
                quantity_delivered=qty_delivered,
                unit=mat.unit if mat else ConstructionMaterialUnit.adet,
                unit_cost=mat.unit_cost if mat else Decimal("100"),
                status=tmpl["status"],
                order_date=order_date,
                expected_delivery_date=order_date + timedelta(days=14),
                actual_delivery_date=actual_delivery,
                received_by=receiver.id if receiver and tmpl["status"] == ShipmentStatus.delivered else None,
            ))
            created += 1

    await db.flush()
    print(f"  created {created} construction shipments")


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

        cats = await seed_categories(db)
        await db.flush()

        all_reqs = await seed_requirements(db, users, locs, cats)
        await db.flush()

        await backfill_requirement_fields(db, cats)
        await db.flush()

        await seed_favorites(db, users, all_reqs)
        await seed_comments(db, users, all_reqs)
        await seed_notifications(db, users, all_reqs)
        await seed_audit_logs(db, users, all_reqs)
        await seed_budget_limits(db, users, locs)
        await seed_construction_projects(db, users, locs)
        await db.flush()
        await seed_construction_shipments(db, users)

        await db.commit()

    await engine.dispose()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
