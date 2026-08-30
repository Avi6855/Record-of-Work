from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, BigInteger, String, Text, Boolean, Date, DateTime, Integer, Numeric,
    ForeignKey, Enum as SAEnum, UniqueConstraint, Table
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class ProjectStatus(str, enum.Enum):
    PLANNING = "PLANNING"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    HALF_DAY = "HALF_DAY"
    OVERTIME = "OVERTIME"
    LEAVE = "LEAVE"
    HOLIDAY = "HOLIDAY"


class EntrySource(str, enum.Enum):
    MANUAL = "MANUAL"
    SUPERVISOR = "SUPERVISOR"
    BULK = "BULK"
    API = "API"


class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"


class PaymentType(str, enum.Enum):
    WAGE_PAYMENT = "WAGE_PAYMENT"
    ADVANCE_PAYMENT = "ADVANCE_PAYMENT"
    FINAL_SETTLEMENT = "FINAL_SETTLEMENT"
    PARTIAL_PAYMENT = "PARTIAL_PAYMENT"


class ExpenseCategory(str, enum.Enum):
    MACHINE = "MACHINE"
    MATERIAL = "MATERIAL"
    FUEL = "FUEL"
    TRANSPORT = "TRANSPORT"
    FOOD = "FOOD"
    LABOUR = "LABOUR"
    TOOLS = "TOOLS"
    ELECTRICITY = "ELECTRICITY"
    MAINTENANCE = "MAINTENANCE"
    RENT = "RENT"
    OTHER = "OTHER"


class LedgerEntryType(str, enum.Enum):
    WAGE = "WAGE"
    ADVANCE = "ADVANCE"
    PAYMENT = "PAYMENT"
    EXPENSE = "EXPENSE"
    CLIENT_PAYMENT = "CLIENT_PAYMENT"
    ADJUSTMENT = "ADJUSTMENT"
    CLOSING = "CLOSING"
    SETTLEMENT = "SETTLEMENT"


class ReferenceType(str, enum.Enum):
    ATTENDANCE = "ATTENDANCE"
    ADVANCE = "ADVANCE"
    PAYMENT = "PAYMENT"
    EXPENSE = "EXPENSE"
    CLIENT_PAYMENT = "CLIENT_PAYMENT"
    DAILY_CLOSING = "DAILY_CLOSING"
    MONTHLY_SETTLEMENT = "MONTHLY_SETTLEMENT"
    MANUAL = "MANUAL"


class SettlementStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    REVIEWED = "REVIEWED"
    APPROVED = "APPROVED"
    SETTLED = "SETTLED"


class NotificationType(str, enum.Enum):
    ATTENDANCE = "ATTENDANCE"
    PAYMENT = "PAYMENT"
    ADVANCE = "ADVANCE"
    SETTLEMENT = "SETTLEMENT"
    PROJECT = "PROJECT"
    SYSTEM = "SYSTEM"
    WAGE = "WAGE"
    EXPENSE = "EXPENSE"


# Association tables
user_roles = Table(
    "user_roles", Base.metadata,
    Column("user_id", BigInteger, ForeignKey("users.id"), primary_key=True),
    Column("role_id", BigInteger, ForeignKey("roles.id"), primary_key=True),
)

role_permissions = Table(
    "role_permissions", Base.metadata,
    Column("role_id", BigInteger, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", BigInteger, ForeignKey("permissions.id"), primary_key=True),
)

project_workers = Table(
    "project_workers", Base.metadata,
    Column("project_id", BigInteger, ForeignKey("projects.id"), primary_key=True),
    Column("worker_id", BigInteger, ForeignKey("workers.id"), primary_key=True),
)


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    marathi_name = Column(String(255))
    contact_person = Column(String(255))
    contact_email = Column(String(255))
    contact_phone = Column(String(20))
    address = Column(Text)
    logo_url = Column(String(500))
    currency = Column(String(3), default="INR")
    timezone = Column(String(50), default="Asia/Kolkata")
    is_active = Column(Boolean, default=True, nullable=False)
    is_suspended = Column(Boolean, default=False, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(BigInteger)


class Role(Base):
    __tablename__ = "roles"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    display_name = Column(String(100))
    description = Column(String(500))
    is_system_role = Column(Boolean, default=False)
    permissions = relationship("Permission", secondary=role_permissions, backref="roles", lazy="selectin")


class Permission(Base):
    __tablename__ = "permissions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    display_name = Column(String(200))
    module = Column(String(50))
    description = Column(String(500))


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    organization_id = Column(BigInteger, ForeignKey("organizations.id"))
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    last_login = Column(DateTime)
    password_changed_at = Column(DateTime)
    must_change_password = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(BigInteger)

    organization = relationship("Organization", backref="users", lazy="selectin")
    roles = relationship("Role", secondary=user_roles, backref="users", lazy="selectin")


class Worker(Base):
    __tablename__ = "workers"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"))
    name = Column(String(255), nullable=False)
    marathi_name = Column(String(255))
    phone = Column(String(20))
    address = Column(Text)
    village = Column(String(255))
    work_type = Column(String(100))
    skill = Column(String(100))
    daily_wage = Column(Numeric(12, 2), default=0)
    overtime_rate = Column(Numeric(12, 2), default=0)
    joining_date = Column(Date)
    photo_url = Column(String(500))
    emergency_contact_name = Column(String(255))
    emergency_contact_phone = Column(String(20))
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(BigInteger)

    organization = relationship("Organization", backref="workers", lazy="selectin")
    user = relationship("User", backref="worker_profile", lazy="selectin")


class Client(Base):
    __tablename__ = "clients"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    phone = Column(String(20))
    email = Column(String(255))
    address = Column(Text)
    company_name = Column(String(255))
    notes = Column(Text)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(BigInteger)

    organization = relationship("Organization", backref="clients", lazy="selectin")


class Project(Base):
    __tablename__ = "projects"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    name = Column(String(255), nullable=False)
    marathi_name = Column(String(255))
    client_id = Column(BigInteger, ForeignKey("clients.id"))
    client_phone = Column(String(20))
    site_address = Column(Text)
    start_date = Column(Date)
    end_date = Column(Date)
    contract_amount = Column(Numeric(14, 2), default=0)
    description = Column(Text)
    status = Column(String(30), default="PLANNING", nullable=False)
    notes = Column(Text)
    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    version = Column(BigInteger)

    organization = relationship("Organization", backref="projects", lazy="selectin")
    client = relationship("Client", backref="projects", lazy="selectin")
    workers = relationship("Worker", secondary=project_workers, backref="projects", lazy="selectin")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("worker_id", "project_id", "attendance_date", name="uk_attendance_worker_project_date"),
    )

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    worker_id = Column(BigInteger, ForeignKey("workers.id"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False)
    overtime_hours = Column(Numeric(4, 1), default=0)
    notes = Column(String(500))
    marked_by = Column(BigInteger)
    entry_source = Column(String(20), default="MANUAL")
    is_corrected = Column(Boolean, default=False)
    corrected_by = Column(BigInteger)
    correction_reason = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="attendance_records", lazy="selectin")
    worker = relationship("Worker", backref="attendance_records", lazy="selectin")
    project = relationship("Project", backref="attendance_records", lazy="selectin")


class Advance(Base):
    __tablename__ = "advances"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    worker_id = Column(BigInteger, ForeignKey("workers.id"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    amount = Column(Numeric(12, 2), nullable=False)
    advance_date = Column(Date, nullable=False)
    payment_method = Column(String(20), default="CASH")
    reason = Column(String(500))
    notes = Column(Text)
    is_settled = Column(Boolean, default=False)
    settled_amount = Column(Numeric(12, 2), default=0)
    is_voided = Column(Boolean, default=False)
    voided_by = Column(BigInteger)
    voided_at = Column(DateTime)
    void_reason = Column(String(500))
    created_by = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="advances", lazy="selectin")
    worker = relationship("Worker", backref="advances", lazy="selectin")
    project = relationship("Project", backref="advances", lazy="selectin")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    worker_id = Column(BigInteger, ForeignKey("workers.id"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    amount = Column(Numeric(12, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(20), default="CASH")
    payment_type = Column(String(30), nullable=False)
    description = Column(String(500))
    notes = Column(Text)
    reference_number = Column(String(100))
    is_voided = Column(Boolean, default=False)
    voided_by = Column(BigInteger)
    voided_at = Column(DateTime)
    void_reason = Column(String(500))
    created_by = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="payments", lazy="selectin")
    worker = relationship("Worker", backref="payments", lazy="selectin")
    project = relationship("Project", backref="payments", lazy="selectin")


class ClientPayment(Base):
    __tablename__ = "client_payments"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    client_id = Column(BigInteger, ForeignKey("clients.id"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(20), default="CASH")
    reference_number = Column(String(100))
    description = Column(String(500))
    notes = Column(Text)
    is_voided = Column(Boolean, default=False)
    created_by = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="client_payments", lazy="selectin")
    client = relationship("Client", backref="client_payments", lazy="selectin")
    project = relationship("Project", backref="client_payments", lazy="selectin")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    category = Column(String(30), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    expense_date = Column(Date, nullable=False)
    description = Column(String(500), nullable=False)
    vendor = Column(String(255))
    vendor_phone = Column(String(20))
    payment_method = Column(String(20), default="CASH")
    receipt_url = Column(String(500))
    notes = Column(Text)
    is_voided = Column(Boolean, default=False)
    voided_by = Column(BigInteger)
    voided_at = Column(DateTime)
    void_reason = Column(String(500))
    created_by = Column(BigInteger)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="expenses", lazy="selectin")
    project = relationship("Project", backref="expenses", lazy="selectin")


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    worker_id = Column(BigInteger, ForeignKey("workers.id"))
    project_id = Column(BigInteger, ForeignKey("projects.id"))
    entry_type = Column(String(30), nullable=False)
    reference_type = Column(String(30))
    reference_id = Column(BigInteger)
    amount = Column(Numeric(12, 2), nullable=False)
    debit = Column(Numeric(12, 2), default=0)
    credit = Column(Numeric(12, 2), default=0)
    balance = Column(Numeric(12, 2), default=0)
    entry_date = Column(Date, nullable=False)
    description = Column(String(500), nullable=False)
    notes = Column(Text)
    is_voided = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="ledger_entries", lazy="selectin")
    worker = relationship("Worker", backref="ledger_entries", lazy="selectin")
    project = relationship("Project", backref="ledger_entries", lazy="selectin")


class DailyClosing(Base):
    __tablename__ = "daily_closings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    closing_date = Column(Date, nullable=False, unique=True)
    total_workers = Column(Integer, default=0)
    present_count = Column(Integer, default=0)
    absent_count = Column(Integer, default=0)
    half_day_count = Column(Integer, default=0)
    overtime_count = Column(Integer, default=0)
    total_wages = Column(Numeric(14, 2), default=0)
    total_advances = Column(Numeric(14, 2), default=0)
    total_payments = Column(Numeric(14, 2), default=0)
    total_expenses = Column(Numeric(14, 2), default=0)
    total_income = Column(Numeric(14, 2), default=0)
    opening_cash = Column(Numeric(14, 2), default=0)
    closing_cash = Column(Numeric(14, 2), default=0)
    notes = Column(Text)
    is_closed = Column(Boolean, default=False)
    closed_by = Column(BigInteger)
    closed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="daily_closings", lazy="selectin")


class MonthlySettlement(Base):
    __tablename__ = "monthly_settlements"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"), nullable=False)
    worker_id = Column(BigInteger, ForeignKey("workers.id"), nullable=False)
    settlement_month = Column(Integer, nullable=False)
    settlement_year = Column(Integer, nullable=False)
    present_days = Column(Integer, default=0)
    half_days = Column(Integer, default=0)
    absent_days = Column(Integer, default=0)
    overtime_hours = Column(Numeric(6, 1), default=0)
    gross_wage = Column(Numeric(14, 2), default=0)
    total_advance = Column(Numeric(14, 2), default=0)
    total_payment = Column(Numeric(14, 2), default=0)
    remaining_balance = Column(Numeric(14, 2), default=0)
    bonus = Column(Numeric(12, 2), default=0)
    deduction = Column(Numeric(12, 2), default=0)
    status = Column(String(20), default="DRAFT")
    notes = Column(Text)
    approved_by = Column(BigInteger)
    approved_at = Column(DateTime)
    is_deleted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="monthly_settlements", lazy="selectin")
    worker = relationship("Worker", backref="monthly_settlements", lazy="selectin")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"))
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    type = Column(String(30), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    reference_type = Column(String(50))
    reference_id = Column(BigInteger)
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="notifications", lazy="selectin")
    user = relationship("User", backref="notifications", lazy="selectin")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"))
    setting_key = Column(String(100), nullable=False)
    setting_value = Column(Text)
    description = Column(String(500))
    setting_type = Column(String(20), default="STRING")
    is_system = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="system_settings", lazy="selectin")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    organization_id = Column(BigInteger, ForeignKey("organizations.id"))
    user_id = Column(BigInteger)
    username = Column(String(50))
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50))
    entity_id = Column(BigInteger)
    old_value = Column(Text)
    new_value = Column(Text)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    session_id = Column(String(100))
    status = Column(String(20))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    organization = relationship("Organization", backref="audit_logs", lazy="selectin")


class LoginHistory(Base):
    __tablename__ = "login_history"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    is_success = Column(Boolean, default=False)
    failure_reason = Column(String(500))
    session_id = Column(String(100))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="login_history", lazy="selectin")
