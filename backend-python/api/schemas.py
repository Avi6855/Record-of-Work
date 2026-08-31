from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    accessToken: str
    refreshToken: str
    tokenType: str = "Bearer"
    expiresIn: int
    user: "UserResponse"


class RefreshTokenRequest(BaseModel):
    refreshToken: str


class ChangePasswordRequest(BaseModel):
    oldPassword: str
    newPassword: str


class UserResponse(BaseModel):
    id: int
    username: str
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: str
    phone: Optional[str] = None
    isActive: bool
    roles: list["RoleResponse"]
    organization: Optional["OrganizationResponse"] = None

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    id: int
    name: str
    displayName: Optional[str] = None
    permissions: list["PermissionResponse"] = []

    class Config:
        from_attributes = True


class PermissionResponse(BaseModel):
    id: int
    name: str
    displayName: Optional[str] = None
    module: Optional[str] = None

    class Config:
        from_attributes = True


class OrganizationResponse(BaseModel):
    id: int
    name: str
    marathiName: Optional[str] = None
    contactPerson: Optional[str] = None
    contactEmail: Optional[str] = None
    contactPhone: Optional[str] = None
    address: Optional[str] = None
    logoUrl: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    isActive: bool

    class Config:
        from_attributes = True


class WorkerCreate(BaseModel):
    name: str
    marathiName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    workType: Optional[str] = None
    skill: Optional[str] = None
    dailyWage: Decimal = Decimal("0")
    overtimeRate: Decimal = Decimal("0")
    joiningDate: Optional[date] = None
    photoUrl: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    notes: Optional[str] = None
    userId: Optional[int] = None


class WorkerUpdate(BaseModel):
    name: Optional[str] = None
    marathiName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    workType: Optional[str] = None
    skill: Optional[str] = None
    dailyWage: Optional[Decimal] = None
    overtimeRate: Optional[Decimal] = None
    joiningDate: Optional[date] = None
    photoUrl: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    notes: Optional[str] = None
    isActive: Optional[bool] = None


class WorkerResponse(BaseModel):
    id: int
    name: str
    marathiName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    village: Optional[str] = None
    workType: Optional[str] = None
    skill: Optional[str] = None
    dailyWage: Decimal
    overtimeRate: Decimal
    joiningDate: Optional[date] = None
    photoUrl: Optional[str] = None
    emergencyContactName: Optional[str] = None
    emergencyContactPhone: Optional[str] = None
    notes: Optional[str] = None
    isActive: bool
    organizationId: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    name: Optional[str] = Field(default=None)
    marathiName: Optional[str] = None
    clientId: Optional[int] = None
    clientPhone: Optional[str] = None
    siteAddress: Optional[str] = None
    startDate: date
    endDate: Optional[date] = None
    contractAmount: Optional[Decimal] = Field(default=Decimal("0"))
    description: Optional[str] = None
    status: str = "PLANNING"
    notes: Optional[str] = None
    workerIds: list[int] = []

    @field_validator("contractAmount")
    @classmethod
    def validate_contract_amount(cls, v):
        if v is not None and Decimal(str(v)) < 0:
            raise ValueError("contractAmount must be >= 0")
        return v

    @field_validator("endDate")
    @classmethod
    def validate_end_date(cls, v, info):
        if v is not None and info.data.get("startDate") is not None and v < info.data["startDate"]:
            raise ValueError("endDate must be >= startDate")
        return v


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    marathiName: Optional[str] = None
    clientId: Optional[int] = None
    clientPhone: Optional[str] = None
    siteAddress: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    contractAmount: Optional[Decimal] = None
    description: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    workerIds: Optional[list[int]] = None

    @field_validator("contractAmount")
    @classmethod
    def validate_contract_amount_update(cls, v):
        if v is not None and Decimal(str(v)) < 0:
            raise ValueError("contractAmount must be >= 0")
        return v


class ProjectAdvancePaymentCreate(BaseModel):
    amount: Decimal
    paymentDate: date
    paymentMethod: str = "CASH"
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v):
        if Decimal(str(v)) <= 0:
            raise ValueError("amount must be > 0")
        return v

    @field_validator("paymentMethod")
    @classmethod
    def validate_method(cls, v):
        allowed = {"CASH", "UPI", "BANK_TRANSFER", "CHEQUE"}
        if v not in allowed:
            raise ValueError(f"paymentMethod must be one of {allowed}")
        return v


class ProjectAdvancePaymentUpdate(BaseModel):
    amount: Optional[Decimal] = None
    paymentDate: Optional[date] = None
    paymentMethod: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def validate_amount_upd(cls, v):
        if v is not None and Decimal(str(v)) <= 0:
            raise ValueError("amount must be > 0")
        return v


class ProjectAdvancePaymentResponse(BaseModel):
    id: int
    projectId: int
    organizationId: int
    amount: Decimal
    paymentDate: date
    paymentMethod: str
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None
    isVoided: bool
    voidReason: Optional[str] = None
    createdBy: Optional[int] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: int
    name: str
    marathiName: Optional[str] = None
    clientId: Optional[int] = None
    clientPhone: Optional[str] = None
    siteAddress: Optional[str] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None
    contractAmount: Decimal
    description: Optional[str] = None
    status: str
    notes: Optional[str] = None
    organizationId: int
    advanceTotal: Decimal = Decimal("0")
    remainingAmount: Decimal = Decimal("0")
    advancePayments: list["ProjectAdvancePaymentResponse"] = []
    client: Optional["ClientResponse"] = None
    workers: list["WorkerResponse"] = []
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class AttendanceCreate(BaseModel):
    workerId: int
    projectId: int
    attendanceDate: date
    status: str
    overtimeHours: Decimal = Decimal("0")
    notes: Optional[str] = None
    entrySource: str = "MANUAL"


class AttendanceBulkCreate(BaseModel):
    projectId: int
    attendanceDate: date
    records: list["AttendanceCreate"]


class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    overtimeHours: Optional[Decimal] = None
    notes: Optional[str] = None
    correctionReason: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    workerId: int
    projectId: int
    attendanceDate: date
    status: str
    overtimeHours: Decimal
    notes: Optional[str] = None
    entrySource: str
    isCorrected: bool
    organizationId: int
    worker: Optional["WorkerResponse"] = None
    project: Optional["ProjectResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    workerId: int
    projectId: Optional[int] = None
    amount: Decimal
    paymentDate: date
    paymentMethod: str = "CASH"
    paymentType: str
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None


class PaymentUpdate(BaseModel):
    workerId: Optional[int] = None
    projectId: Optional[int] = None
    amount: Optional[Decimal] = None
    paymentDate: Optional[date] = None
    paymentMethod: Optional[str] = None
    paymentType: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    workerId: int
    projectId: Optional[int] = None
    amount: Decimal
    paymentDate: date
    paymentMethod: str
    paymentType: str
    description: Optional[str] = None
    notes: Optional[str] = None
    referenceNumber: Optional[str] = None
    isVoided: bool
    createdBy: Optional[int] = None
    organizationId: int
    worker: Optional["WorkerResponse"] = None
    project: Optional["ProjectResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class AdvanceCreate(BaseModel):
    workerId: int
    projectId: Optional[int] = None
    amount: Decimal
    advanceDate: date
    paymentMethod: str = "CASH"
    reason: Optional[str] = None
    notes: Optional[str] = None


class AdvanceUpdate(BaseModel):
    workerId: Optional[int] = None
    projectId: Optional[int] = None
    amount: Optional[Decimal] = None
    advanceDate: Optional[date] = None
    paymentMethod: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class AdvanceResponse(BaseModel):
    id: int
    workerId: int
    projectId: Optional[int] = None
    amount: Decimal
    advanceDate: date
    paymentMethod: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    isSettled: bool
    settledAmount: Decimal
    isVoided: bool
    createdBy: Optional[int] = None
    organizationId: int
    worker: Optional["WorkerResponse"] = None
    project: Optional["ProjectResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    projectId: Optional[int] = None
    category: str
    amount: Decimal
    expenseDate: date
    description: str
    vendor: Optional[str] = None
    vendorPhone: Optional[str] = None
    paymentMethod: str = "CASH"
    receiptUrl: Optional[str] = None
    notes: Optional[str] = None


class ExpenseUpdate(BaseModel):
    projectId: Optional[int] = None
    category: Optional[str] = None
    amount: Optional[Decimal] = None
    expenseDate: Optional[date] = None
    description: Optional[str] = None
    vendor: Optional[str] = None
    vendorPhone: Optional[str] = None
    paymentMethod: Optional[str] = None
    receiptUrl: Optional[str] = None
    notes: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    projectId: Optional[int] = None
    category: str
    amount: Decimal
    expenseDate: date
    description: str
    vendor: Optional[str] = None
    vendorPhone: Optional[str] = None
    paymentMethod: str
    receiptUrl: Optional[str] = None
    notes: Optional[str] = None
    isVoided: bool
    createdBy: Optional[int] = None
    organizationId: int
    project: Optional["ProjectResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ClientCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    companyName: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    companyName: Optional[str] = None
    notes: Optional[str] = None
    isActive: Optional[bool] = None


class ClientResponse(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    companyName: Optional[str] = None
    notes: Optional[str] = None
    isActive: bool
    organizationId: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ClientPaymentCreate(BaseModel):
    clientId: int
    projectId: int
    amount: Decimal
    paymentDate: date
    paymentMethod: str = "CASH"
    referenceNumber: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None


class ClientPaymentResponse(BaseModel):
    id: int
    clientId: int
    projectId: int
    amount: Decimal
    paymentDate: date
    paymentMethod: str
    referenceNumber: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    isVoided: bool
    createdBy: Optional[int] = None
    organizationId: int
    client: Optional["ClientResponse"] = None
    project: Optional["ProjectResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class LedgerEntryResponse(BaseModel):
    id: int
    workerId: Optional[int] = None
    projectId: Optional[int] = None
    entryType: str
    referenceType: Optional[str] = None
    referenceId: Optional[int] = None
    amount: Decimal
    debit: Decimal
    credit: Decimal
    balance: Decimal
    entryDate: date
    description: str
    notes: Optional[str] = None
    isVoided: bool
    organizationId: int
    createdAt: datetime

    class Config:
        from_attributes = True


class DailyClosingResponse(BaseModel):
    id: int
    closingDate: date
    totalWorkers: int
    presentCount: int
    absentCount: int
    halfDayCount: int
    overtimeCount: int
    totalWages: Decimal
    totalAdvances: Decimal
    totalPayments: Decimal
    totalExpenses: Decimal
    totalIncome: Decimal
    openingCash: Decimal
    closingCash: Decimal
    notes: Optional[str] = None
    isClosed: bool
    closedBy: Optional[int] = None
    closedAt: Optional[datetime] = None
    organizationId: int
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class DailyClosingCreate(BaseModel):
    closingDate: date
    totalWorkers: int = 0
    presentCount: int = 0
    absentCount: int = 0
    halfDayCount: int = 0
    overtimeCount: int = 0
    totalWages: Decimal = Decimal("0")
    totalAdvances: Decimal = Decimal("0")
    totalPayments: Decimal = Decimal("0")
    totalExpenses: Decimal = Decimal("0")
    totalIncome: Decimal = Decimal("0")
    openingCash: Decimal = Decimal("0")
    closingCash: Decimal = Decimal("0")
    notes: Optional[str] = None


class MonthlySettlementResponse(BaseModel):
    id: int
    workerId: int
    settlementMonth: int
    settlementYear: int
    presentDays: int
    halfDays: int
    absentDays: int
    overtimeHours: Decimal
    grossWage: Decimal
    totalAdvance: Decimal
    totalPayment: Decimal
    remainingBalance: Decimal
    bonus: Decimal
    deduction: Decimal
    status: str
    notes: Optional[str] = None
    organizationId: int
    worker: Optional["WorkerResponse"] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    type: str
    title: str
    message: str
    referenceType: Optional[str] = None
    referenceId: Optional[int] = None
    isRead: bool
    readAt: Optional[datetime] = None
    userId: int
    organizationId: Optional[int] = None
    createdAt: datetime

    class Config:
        from_attributes = True


class DashboardResponse(BaseModel):
    totalWorkers: int
    activeWorkers: int
    totalProjects: int
    activeProjects: int
    todayPresent: int
    todayAbsent: int
    todayWages: Decimal
    todayAdvances: Decimal
    todayPayments: Decimal
    todayExpenses: Decimal
    totalExpensesThisMonth: Decimal
    totalPaymentsThisMonth: Decimal
    amountDueToWorkers: Decimal
    recentAttendance: list[AttendanceResponse] = []
    recentPayments: list[PaymentResponse] = []
    recentExpenses: list[ExpenseResponse] = []


class PageResponse(BaseModel):
    content: list
    totalElements: int
    totalPages: int
    size: int
    number: int
    first: bool
    last: bool
    empty: bool


class SystemSettingResponse(BaseModel):
    id: int
    settingKey: str
    settingValue: Optional[str] = None
    description: Optional[str] = None
    settingType: str
    isSystem: bool
    organizationId: Optional[int] = None

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    settingValue: str


LoginResponse.model_rebuild()
