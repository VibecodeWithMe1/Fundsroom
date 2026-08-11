# Mini ERP + CRM Operations Portal

An enterprise-grade, role-based single-page application (SPA) portal for managing customer relations, inventory logs, and sales challans.

---

## ⚡ Quick Start (Local Setup)

### 1. Backend Server Setup
```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```
*The backend server will run at `http://localhost:5000`.*

### 2. Frontend SPA Setup
```bash
cd ../frontend
npm install
npm run dev
```
*The client application will run at `http://localhost:5173`.*

---

## 🔑 Demo Login Credentials

Use the following credentials to explore role-specific permissions and interfaces:

| Staff Name | Assigned Role | Access Scope | Login Email | Login Password |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN` | Full Master Control | `kumarkamlakant46@gmail.com` | `Kamlakant@9584` |
| **Jitendra sharma** | `SALES` | CRM & Challan booking | `jitendrasharma19@gmail.com` | `Jitendra@9584` |
| **Keshav samdarshi** | `WAREHOUSE` | Inventory & Catalog logs | `keshavsamdarshi98@gmail.com` | `Keshav@9584` |
| **Chandan suryavanshi** | `ACCOUNTS` | Invoice print & confirm | `chandansuryavanshi80@gmail.com` | `Chandan@9584` |

---

## 🛠️ Tech Stack & Key Features

- **Backend**: Node.js, Express, TypeScript, Prisma ORM, JWT, SQLite (development)
- **Frontend**: React (Vite), Tailwind CSS, Recharts (analytics graphs), Lucide Icons
- **CRM Module**: Lead stages (`LEAD`, `CONTACTED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`) with a visual timeline progress stepper.
- **Inventory Module**: Audited stock adjustments (`IN` / `OUT`) and automatic low-stock safety alerts.
- **Billing Module**: Confirmed challan stock checks and printable full-page A4 clean invoices.
- **Intelligence Dashboard**: Real-time sales growth metrics and stock forecasting.

---

## 📖 System Documentation

For detailed architectural diagrams, schema breakdowns, API references, validation error definitions, and business assumptions, please refer to the comprehensive [documentation.md](file:///c:/Users/kamla/OneDrive/Desktop/Fundsroom/mini-erp-crm/documentation.md).
