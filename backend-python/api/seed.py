import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import engine, Base, SessionLocal
from models import (
    Organization, Role, Permission, User, Worker, Client, Project,
    Attendance, Payment, Advance, Expense, LedgerEntry, DailyClosing,
    Notification, SystemSetting, user_roles, role_permissions, project_workers,
)
from auth import get_password_hash

def create_tables():
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")

def _backfill_joining_dates(db):
    from datetime import date
    default_dates = {
        "Aniket": date(2024, 1, 15),
        "Suhas": date(2024, 2, 1),
        "Khandu": date(2024, 3, 10),
        "Avadhut": date(2024, 1, 20),
        "Rahul": date(2024, 4, 5),
        "Suresh": date(2024, 2, 15),
        "Mohan": date(2024, 5, 1),
        "Vikram": date(2024, 3, 20),
    }
    updated = 0
    for w in db.query(Worker).filter(Worker.is_deleted == False, Worker.joining_date == None).all():
        if w.name in default_dates:
            w.joining_date = default_dates[w.name]
            updated += 1
    if updated:
        db.commit()
        print(f"Backfilled joining dates for {updated} workers.")
    else:
        print("No workers need joining date backfill.")


def seed_data():
    db = SessionLocal()
    try:
        if db.query(Organization).first():
            _backfill_joining_dates(db)
            print("Data already seeded. Skipping.")
            return

        print("Seeding data...")

        # Organization
        org = Organization(
            name="Record of Work", marathi_name="कामचा हिशोब",
            contact_person="Admin", contact_phone="9876543210",
            address="Pune, Maharashtra", currency="INR", timezone="Asia/Kolkata",
        )
        db.add(org)
        db.flush()

        # Roles
        roles = {}
        for name, display, desc in [
            ("SUPER_ADMIN", "Super Admin", "Full system access"),
            ("ADMIN", "Admin / Owner", "Business owner with full access"),
            ("SUPERVISOR", "Supervisor", "Project supervisor with limited access"),
            ("WORKER", "Worker", "Worker with view-only access"),
        ]:
            r = Role(name=name, display_name=display, description=desc, is_system_role=True)
            db.add(r)
            db.flush()
            roles[name] = r

        # Permissions
        perms = {}
        perm_data = [
            ("WORKER_VIEW", "View Workers", "WORKER"), ("WORKER_CREATE", "Create Workers", "WORKER"),
            ("WORKER_UPDATE", "Update Workers", "WORKER"), ("WORKER_DELETE", "Delete Workers", "WORKER"),
            ("PROJECT_VIEW", "View Projects", "PROJECT"), ("PROJECT_CREATE", "Create Projects", "PROJECT"),
            ("PROJECT_UPDATE", "Update Projects", "PROJECT"), ("PROJECT_DELETE", "Delete Projects", "PROJECT"),
            ("ATTENDANCE_VIEW", "View Attendance", "ATTENDANCE"), ("ATTENDANCE_MARK", "Mark Attendance", "ATTENDANCE"),
            ("ATTENDANCE_EDIT", "Edit Attendance", "ATTENDANCE"),
            ("WAGE_VIEW", "View Wages", "WAGE"), ("WAGE_CALCULATE", "Calculate Wages", "WAGE"),
            ("ADVANCE_VIEW", "View Advances", "ADVANCE"), ("ADVANCE_CREATE", "Create Advances", "ADVANCE"),
            ("PAYMENT_VIEW", "View Payments", "PAYMENT"), ("PAYMENT_CREATE", "Create Payments", "PAYMENT"),
            ("EXPENSE_VIEW", "View Expenses", "EXPENSE"), ("EXPENSE_CREATE", "Create Expenses", "EXPENSE"),
            ("LEDGER_VIEW", "View Ledger", "LEDGER"), ("REPORT_VIEW", "View Reports", "REPORT"),
            ("SETTINGS_VIEW", "View Settings", "SETTINGS"), ("SETTINGS_UPDATE", "Update Settings", "SETTINGS"),
            ("NOTIFICATION_VIEW", "View Notifications", "NOTIFICATION"),
            ("CLIENT_VIEW", "View Clients", "CLIENT"), ("CLIENT_CREATE", "Create Clients", "CLIENT"),
            ("CLIENT_UPDATE", "Update Clients", "CLIENT"),
            ("DAILY_CLOSING_VIEW", "View Daily Closing", "DAILY_CLOSING"),
            ("DAILY_CLOSING_CLOSE", "Close Day", "DAILY_CLOSING"),
            ("SETTLEMENT_VIEW", "View Settlements", "SETTLEMENT"),
            ("SETTLEMENT_APPROVE", "Approve Settlements", "SETTLEMENT"),
        ]
        for name, display, module in perm_data:
            p = Permission(name=name, display_name=display, module=module)
            db.add(p)
            db.flush()
            perms[name] = p

        # Assign all perms to SUPER_ADMIN
        roles["SUPER_ADMIN"].permissions = list(perms.values())
        # Most perms to ADMIN
        skip_admin = {"SETTLEMENT_APPROVE", "SETTLEMENT_VIEW"}
        roles["ADMIN"].permissions = [p for n, p in perms.items() if n not in skip_admin]
        # Limited to SUPERVISOR
        sup_perm_names = {"WORKER_VIEW", "PROJECT_VIEW", "ATTENDANCE_VIEW", "ATTENDANCE_MARK", "ADVANCE_VIEW", "ADVANCE_CREATE", "EXPENSE_VIEW", "EXPENSE_CREATE", "NOTIFICATION_VIEW", "CLIENT_VIEW"}
        roles["SUPERVISOR"].permissions = [p for n, p in perms.items() if n in sup_perm_names]
        # View-only to WORKER
        worker_perm_names = {"WORKER_VIEW", "PROJECT_VIEW", "ATTENDANCE_VIEW", "WAGE_VIEW", "ADVANCE_VIEW", "PAYMENT_VIEW", "LEDGER_VIEW", "NOTIFICATION_VIEW"}
        roles["WORKER"].permissions = [p for n, p in perms.items() if n in worker_perm_names]

        # Users
        hashed = get_password_hash("admin123")
        users = {}
        for uname, fname, lname, email, phone, role_name in [
            ("superadmin", "Super", "Admin", "superadmin@recordofwork.com", "9876543210", "SUPER_ADMIN"),
            ("admin", "Admin", "Owner", "admin@recordofwork.com", "9876543211", "ADMIN"),
            ("supervisor1", "Ramesh", "Patil", "supervisor@recordofwork.com", "9876543212", "SUPERVISOR"),
            ("worker1", "Aniket", "Sharma", "worker1@recordofwork.com", "9876543213", "WORKER"),
        ]:
            u = User(
                username=uname, password=hashed, first_name=fname, last_name=lname,
                email=email, phone=phone, organization_id=org.id,
                is_active=True, is_deleted=False, must_change_password=False,
            )
            u.roles = [roles[role_name]]
            db.add(u)
            db.flush()
            users[uname] = u

        # Clients
        clients = {}
        for name, phone, company in [
            ("Shubham Patil", "9876543220", "Shubham Constructions"),
            ("Rajesh Kumar", "9876543221", None),
            ("Priya Enterprises", "9876543222", "Priya Builders"),
        ]:
            c = Client(organization_id=org.id, name=name, phone=phone, company_name=company)
            db.add(c)
            db.flush()
            clients[name] = c

        # Workers
        from datetime import date as _date
        workers_data = {}
        for name, mname, phone, village, wtype, skill, wage, otrate, jdate in [
            ("Aniket", "अनिकेत", "9876543301", "Pune", "Mason", "Brickwork", 700, 100, _date(2024, 1, 15)),
            ("Suhas", "सुहास", "9876543302", "Pune", "Carpenter", "Wood Work", 800, 120, _date(2024, 2, 1)),
            ("Khandu", "खंडू", "9876543303", "Wagholi", "Labour", "General", 600, 80, _date(2024, 3, 10)),
            ("Avadhut", "अवधूत", "9876543304", "Hadapsar", "Mason", "Plastering", 750, 110, _date(2024, 1, 20)),
            ("Rahul", "राहुल", "9876543305", "Kothrud", "Electrician", "Wiring", 900, 130, _date(2024, 4, 5)),
            ("Suresh", "सुरेश", "9876543306", "Baner", "Plumber", "Plumbing", 850, 125, _date(2024, 2, 15)),
            ("Mohan", "मोहन", "9876543307", "Sinhagad", "Labour", "General", 600, 80, _date(2024, 5, 1)),
            ("Vikram", "विक्रम", "9876543308", "Undri", "Painting", "Paint Work", 750, 110, _date(2024, 3, 20)),
        ]:
            w = Worker(
                organization_id=org.id, name=name, marathi_name=mname,
                phone=phone, village=village, work_type=wtype, skill=skill,
                daily_wage=wage, overtime_rate=otrate, joining_date=jdate,
            )
            db.add(w)
            db.flush()
            workers_data[name] = w

        # Projects
        projects = {}
        for name, mname, client_name, phone, addr, amount, status in [
            ("Shubham Paygav", "शुभम पायगाव", "Shubham Patil", "9876543220", "Wagholi, Pune", 500000, "ACTIVE"),
            ("Rajesh Bungalow", "राजेश बंगला", "Rajesh Kumar", "9876543221", "Kothrud, Pune", 300000, "PLANNING"),
            ("Priya Office", "प्रिया कार्यालय", "Priya Enterprises", "9876543222", "Nashik", 200000, "COMPLETED"),
        ]:
            p = Project(
                organization_id=org.id, name=name, marathi_name=mname,
                client_id=clients[client_name].id, client_phone=phone,
                site_address=addr, contract_amount=amount, status=status,
            )
            db.add(p)
            db.flush()
            projects[name] = p

        # Project Workers
        pw = [
            ("Shubham Paygav", ["Aniket", "Suhas", "Khandu", "Avadhut", "Rahul"]),
            ("Rajesh Bungalow", ["Aniket", "Khandu", "Suresh"]),
            ("Priya Office", ["Suhas", "Avadhut", "Mohan", "Vikram"]),
        ]
        for pname, wnames in pw:
            projects[pname].workers = [workers_data[wn] for wn in wnames]

        # Attendance (Aug 25-28, 2024)
        from datetime import date
        att_data = [
            ("Aniket", 1, date(2024,8,25), "PRESENT"), ("Suhas", 1, date(2024,8,25), "PRESENT"),
            ("Khandu", 1, date(2024,8,25), "ABSENT"), ("Avadhut", 1, date(2024,8,25), "HALF_DAY"),
            ("Rahul", 1, date(2024,8,25), "PRESENT"),
            ("Aniket", 1, date(2024,8,26), "PRESENT"), ("Suhas", 1, date(2024,8,26), "PRESENT"),
            ("Khandu", 1, date(2024,8,26), "PRESENT"), ("Avadhut", 1, date(2024,8,26), "PRESENT"),
            ("Rahul", 1, date(2024,8,26), "OVERTIME"),
            ("Aniket", 1, date(2024,8,27), "PRESENT"), ("Suhas", 1, date(2024,8,27), "ABSENT"),
            ("Khandu", 1, date(2024,8,27), "PRESENT"), ("Avadhut", 1, date(2024,8,27), "PRESENT"),
            ("Rahul", 1, date(2024,8,27), "PRESENT"),
            ("Aniket", 1, date(2024,8,28), "PRESENT"), ("Suhas", 1, date(2024,8,28), "PRESENT"),
            ("Khandu", 1, date(2024,8,28), "PRESENT"), ("Avadhut", 1, date(2024,8,28), "PRESENT"),
            ("Rahul", 1, date(2024,8,28), "HALF_DAY"),
        ]
        for wname, proj_idx, dt, status in att_data:
            pname = list(projects.keys())[proj_idx - 1]
            db.add(Attendance(
                organization_id=org.id, worker_id=workers_data[wname].id,
                project_id=projects[pname].id, attendance_date=dt,
                status=status, entry_source="MANUAL",
            ))

        # Advances
        db.add(Advance(organization_id=org.id, worker_id=workers_data["Aniket"].id, project_id=projects["Shubham Paygav"].id, amount=5000, advance_date=date(2024,8,25), reason="Personal work"))
        db.add(Advance(organization_id=org.id, worker_id=workers_data["Khandu"].id, project_id=projects["Shubham Paygav"].id, amount=3000, advance_date=date(2024,8,26), reason="Medical"))
        db.add(Advance(organization_id=org.id, worker_id=workers_data["Avadhut"].id, project_id=projects["Shubham Paygav"].id, amount=2000, advance_date=date(2024,8,27), reason="Festival"))

        # Payments
        db.add(Payment(organization_id=org.id, worker_id=workers_data["Aniket"].id, project_id=projects["Shubham Paygav"].id, amount=5000, payment_date=date(2024,8,28), payment_method="CASH", payment_type="WAGE_PAYMENT", description="Weekly payment", created_by=users["admin"].id))
        db.add(Payment(organization_id=org.id, worker_id=workers_data["Suhas"].id, project_id=projects["Shubham Paygav"].id, amount=4800, payment_date=date(2024,8,28), payment_method="CASH", payment_type="WAGE_PAYMENT", description="Weekly payment", created_by=users["admin"].id))

        # Expenses
        exp_data = [
            (1, "MATERIAL", 25000, date(2024,8,20), "Cement and Sand", "Buildmart"),
            (1, "MATERIAL", 15000, date(2024,8,22), "Steel rods", "Tata Steel"),
            (1, "FUEL", 3000, date(2024,8,25), "Diesel for mixer", "HP Petrol Pump"),
            (1, "TRANSPORT", 5000, date(2024,8,26), "Material transport", "ABC Transport"),
            (1, "MACHINE", 8000, date(2024,8,27), "Machine rental", "RentAll"),
            (1, "FOOD", 2000, date(2024,8,28), "Worker lunch", "Local Hotel"),
            (1, "TOOLS", 3500, date(2024,8,28), "New tools", "Hardware Store"),
        ]
        pname = "Shubham Paygav"
        for _, cat, amt, dt, desc, vendor in exp_data:
            db.add(Expense(
                organization_id=org.id, project_id=projects[pname].id,
                category=cat, amount=amt, expense_date=dt,
                description=desc, vendor=vendor, created_by=users["admin"].id,
            ))

        # System Settings
        for key, val, desc in [
            ("app_name", "कामचा हिशोब", "Application name"),
            ("app_name_en", "Record of Work", "Application English name"),
            ("default_language", "mr", "Default language"),
            ("currency", "INR", "Currency"),
            ("date_format", "dd-MM-yyyy", "Date format"),
            ("timezone", "Asia/Kolkata", "Timezone"),
        ]:
            db.add(SystemSetting(organization_id=org.id, setting_key=key, setting_value=val, description=desc, is_system=True))

        db.commit()
        print("Seed data created successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_tables()
    seed_data()
    print("Done!")
