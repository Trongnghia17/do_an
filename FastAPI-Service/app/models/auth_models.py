"""
SQLAlchemy models for Authentication system
Based on app/models/auth.py Beanie models
"""
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
from passlib.context import CryptContext
import enum

from app.database import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class ProviderEnum(str, enum.Enum):
    """Provider types for user_identities"""
    EMAIL = "email"
    GOOGLE = "google"
    FACEBOOK = "facebook"
    ZALO = "zalo"
    APPLE = "apple"


class ContactTypeEnum(str, enum.Enum):
    """Contact types for user_contacts"""
    EMAIL = "email"
    PHONE = "phone"


class OtpChannelEnum(str, enum.Enum):
    """OTP channels"""
    EMAIL = "email"
    ZALO_OA = "zalo_oa"
    SMS = "sms"


class OtpPurposeEnum(str, enum.Enum):
    """OTP purposes"""
    REGISTER = "register"
    LOGIN = "login"
    RESET_PASSWORD = "reset_password"
    LINK_CONTACT = "link_contact"


class User(Base):
    """Users table - Authentication and user management"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=True)  # Nullable for OAuth users
    phone = Column(String(50), nullable=True)
    avatar_url = Column(String(255), nullable=True)
    phone_verified_at = Column(DateTime, nullable=True)
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    email_verified_at = Column(DateTime, nullable=True)
    remember_token = Column(String(100), nullable=True)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    role = relationship("Role", back_populates="users")
    identities = relationship("UserIdentity", back_populates="user", cascade="all, delete-orphan")
    contacts = relationship("UserContact", back_populates="user", cascade="all, delete-orphan")
    login_activities = relationship("LoginActivity", back_populates="user", cascade="all, delete-orphan")
    # permissions system removed - keep roles only

    def verify_password(self, plain_password: str) -> bool:
        """Verify password"""
        if not self.password:
            return False
        return pwd_context.verify(plain_password, self.password)

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)

    def __repr__(self):
        return f"<User {self.id}: {self.email}>"


class UserIdentity(Base):
    """User Identities table - OAuth login methods"""
    __tablename__ = "user_identities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(SQLEnum(ProviderEnum), nullable=False)
    provider_user_id = Column(String(255), nullable=False)
    email_at_signup = Column(String(255), nullable=True)
    phone_at_signup = Column(String(50), nullable=True)
    access_token = Column(Text, nullable=True)
    refresh_token = Column(Text, nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    is_primary = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="identities")

    def __repr__(self):
        return f"<UserIdentity {self.id}: {self.provider}>"


class UserContact(Base):
    """User Contacts table - Multiple emails/phones per user"""
    __tablename__ = "user_contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    type = Column(SQLEnum(ContactTypeEnum), nullable=False)
    value = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="contacts")

    def __repr__(self):
        return f"<UserContact {self.id}: {self.type} - {self.value}>"


class OtpCode(Base):
    """OTP Codes table - One-time passwords for verification"""
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    channel = Column(SQLEnum(OtpChannelEnum), nullable=False)
    destination = Column(String(255), nullable=False)  # Email or phone
    code_hash = Column(String(255), nullable=False)  # Hashed OTP
    purpose = Column(SQLEnum(OtpPurposeEnum), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    max_attempts = Column(Integer, default=5, nullable=False)
    used_at = Column(DateTime, nullable=True)
    ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<OtpCode {self.id}: {self.channel} - {self.purpose}>"


class LoginActivity(Base):
    """Login Activities table - Login history and audit"""
    __tablename__ = "login_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    provider = Column(String(50), nullable=False)  # email, google, facebook, etc.
    ip = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    succeeded = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="login_activities")

    def __repr__(self):
        return f"<LoginActivity {self.id}: User {self.user_id}>"


class Role(Base):
    """Roles table - User roles (super_admin, org_admin, etc.)"""
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    display_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # Soft delete
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    users = relationship("User", back_populates="role")
    # permissions system removed - role_permissions table removed

    def __repr__(self):
        return f"<Role {self.id}: {self.name}>"


# Permissions system removed. If you need to reintroduce it later, re-add Permission,
# RolePermission and UserPermission models and corresponding migrations.
