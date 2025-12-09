"""
Email service for sending emails via SMTP
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from loguru import logger

from app.config import settings


class EmailService:
    """Service for sending emails"""
    
    def __init__(self):
        self.smtp_host = settings.MAIL_HOST
        self.smtp_port = settings.MAIL_PORT
        self.username = settings.MAIL_USERNAME
        self.password = settings.MAIL_PASSWORD
        self.from_address = settings.MAIL_FROM_ADDRESS
        self.from_name = settings.MAIL_FROM_NAME
        self.use_tls = settings.MAIL_ENCRYPTION == "tls"
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML content of the email
            text_content: Plain text content (optional)
            
        Returns:
            bool: True if email was sent successfully
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_address}>"
            msg['To'] = to_email
            
            # Add text part if provided
            if text_content:
                part1 = MIMEText(text_content, 'plain')
                msg.attach(part1)
            
            # Add HTML part
            part2 = MIMEText(html_content, 'html')
            msg.attach(part2)
            
            # Connect to SMTP server
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                if self.use_tls:
                    server.starttls()
                
                # Login
                server.login(self.username, self.password)
                
                # Send email
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_otp_email(self, to_email: str, otp_code: str) -> bool:
        """
        Send OTP verification email
        
        Args:
            to_email: Recipient email address
            otp_code: OTP code to send
            
        Returns:
            bool: True if email was sent successfully
        """
        subject = "Mã xác thực OTP - Owl English"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #4F46E5;
                    color: white;
                    padding: 20px;
                    text-align: center;
                    border-radius: 5px 5px 0 0;
                }}
                .content {{
                    background-color: #f9fafb;
                    padding: 30px;
                    border: 1px solid #e5e7eb;
                }}
                .otp-code {{
                    font-size: 32px;
                    font-weight: bold;
                    color: #4F46E5;
                    text-align: center;
                    padding: 20px;
                    background-color: white;
                    border-radius: 5px;
                    margin: 20px 0;
                    letter-spacing: 5px;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #6b7280;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Xác thực tài khoản</h1>
                </div>
                <div class="content">
                    <p>Xin chào,</p>
                    <p>Bạn đã yêu cầu mã xác thực OTP để đăng ký tài khoản tại <strong>Owl English</strong>.</p>
                    <p>Mã OTP của bạn là:</p>
                    <div class="otp-code">{otp_code}</div>
                    <p><strong>Lưu ý:</strong> Mã này sẽ hết hạn sau 5 phút.</p>
                    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Owl English. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Xác thực tài khoản - Owl English
        
        Xin chào,
        
        Bạn đã yêu cầu mã xác thực OTP để đăng ký tài khoản tại Owl English.
        
        Mã OTP của bạn là: {otp_code}
        
        Lưu ý: Mã này sẽ hết hạn sau 5 phút.
        
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
        
        © 2025 Owl English. All rights reserved.
        """
        
        return self.send_email(to_email, subject, html_content, text_content)


# Create singleton instance
email_service = EmailService()
