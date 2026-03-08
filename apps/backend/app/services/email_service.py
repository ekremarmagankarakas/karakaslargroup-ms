import aiosmtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

STATUS_LABELS = {
    "accepted": "Onaylandı",
    "declined": "Reddedildi",
    "pending": "Beklemede",
}


class EmailService:
    def __init__(self) -> None:
        self.settings = get_settings()

    async def send(self, to: list[str], subject: str, html_body: str) -> None:
        if not to:
            return
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{self.settings.SMTP_FROM_NAME} <{self.settings.SMTP_FROM_EMAIL}>"
        msg["To"] = ", ".join(to)
        msg.attach(MIMEText(html_body, "html"))

        try:
            await aiosmtplib.send(
                msg,
                hostname=self.settings.SMTP_HOST,
                port=self.settings.SMTP_PORT,
                username=self.settings.SMTP_USERNAME,
                password=self.settings.SMTP_PASSWORD,
                use_tls=True,
            )
        except Exception:
            # Email failures should not break the request
            pass

    async def send_new_requirement(self, requirement: object, submitter_username: str, recipients: list[str]) -> None:
        subject = "Yeni Istek Olusturuldu"
        html = f"""
        <h2>Yeni Talep Oluşturuldu</h2>
        <p><strong>Kullanıcı:</strong> {submitter_username}</p>
        <p><strong>Ürün:</strong> {getattr(requirement, 'item_name', '')}</p>
        <p><strong>Fiyat:</strong> {getattr(requirement, 'price', '')}</p>
        <p><strong>Açıklama:</strong> {getattr(requirement, 'explanation', '') or '-'}</p>
        """
        await self.send(recipients, subject, html)

    async def send_password_reset(self, email: str, raw_token: str) -> None:
        settings = self.settings
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={raw_token}"
        subject = "Şifre Sıfırlama"
        html = f"""
        <h2>Şifre Sıfırlama Talebi</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:</p>
        <p><a href="{reset_url}">{reset_url}</a></p>
        <p>Bu bağlantı 1 saat geçerlidir. Talep etmediyseniz bu e-postayı görmezden gelebilirsiniz.</p>
        """
        await self.send([email], subject, html)

    async def send_status_update(self, requirement: object, new_status: str, recipients: list[str]) -> None:
        subject = "Istek Durum Guncellemesi"
        status_label = STATUS_LABELS.get(new_status, new_status)
        html = f"""
        <h2>Talep Durumu Güncellendi</h2>
        <p><strong>Ürün:</strong> {getattr(requirement, 'item_name', '')}</p>
        <p><strong>Fiyat:</strong> {getattr(requirement, 'price', '')}</p>
        <p><strong>Açıklama:</strong> {getattr(requirement, 'explanation', '') or '-'}</p>
        <p><strong>Yeni Durum:</strong> {status_label}</p>
        """
        await self.send(recipients, subject, html)
