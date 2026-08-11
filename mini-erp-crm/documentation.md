# Full-Stack Mini ERP + CRM Operations Portal
## Comprehensive System Documentation & Implementation Report

---

## 1. System Overview & Architecture

The **Mini ERP + CRM Operations Portal** is an enterprise-grade web application designed for wholesale and distribution companies. It integrates customer relation management (CRM) with enterprise resource planning (ERP) workflows. The portal enables businesses to manage leads, schedule follow-ups, control inventory stock levels, audit movements, and book sales challans/invoices through a unified, secure portal.

### Architectural Diagram
```
              +---------------------------------------+
              |           React (Vite SPA)            |
              |       Tailwind CSS + Recharts UI      |
              +-------------------+-------------------+
                                  |
                                  | HTTP REST API (JSON / JWT)
                                  v
              +-------------------+-------------------+
              |          Express.js Engine            |
              |  TypeScript Controllers & Middleware  |
              +-------------------+-------------------+
                                  |
                                  | Prisma ORM (Type-Safe Queries)
                                  v
              +-------------------+-------------------+
              |      SQLite / PostgreSQL Database      |
              |     Transactional Stock Ledgers       |
              +---------------------------------------+
```

### Architectural Key Concepts
1. **Separation of Concerns**: Clean separation between the React single-page frontend application and the Express API server.
2. **Database Agnostic ORM**: Built using Prisma ORM. Local development runs on a lightweight SQLite database, while production deployment can instantly scale to PostgreSQL or MySQL with zero query code modifications.
3. **Role-Based Access Control (RBAC)**: Fine-grained security check layer intercepting API endpoints, mapping action scopes to user roles (`Admin`, `Sales`, `Warehouse`, `Accounts`).
4. **Data Isolation and Snapshots**: Crucial transactional records (such as Challan line items) preserve product snapshots (SKU, name, unit price at the time of order confirmation) to prevent historical invoice mutation when inventory catalogs are updated.

---

## 2. Technology Stack

### Backend Engine
- **Runtime Environment**: Node.js (v18+)
- **Programming Language**: TypeScript
- **Web Framework**: Express.js
- **Database Connector**: Prisma ORM (v5+)
- **Security & Hashing**: JSON Web Tokens (`jsonwebtoken`), `bcryptjs`
- **Request Validation**: `zod` schema-validation library
- **Development Tooling**: `ts-node`, `nodemon`, Jest + `supertest` for integration testing

### Frontend Client
- **Build Tool**: Vite (v5)
- **UI Library**: React (v18)
- **Styling Framework**: Vanilla CSS + Tailwind CSS
- **Icons Pack**: Lucide React
- **Data Visualizations**: Recharts (for analytics trends and category share distributions)
- **Form Management**: React Hook Form with Zod schema resolver

### Cloud Deployments & Infrastructure
- **Frontend Hosting**: Vercel / Netlify / Render static hosting
- **Backend API Hosting**: Render / Railway / Fly.io container engines
- **Hosted Database**: Supabase Postgres / Neon serverless Postgres

---

## 3. Test Credentials & Account Matrix

The system includes pre-seeded demo accounts. The login screen features Chrome autofill layout overrides, ensuring input forms match the dark-mode aesthetic cleanly.

| Staff Name | Assigned Role | Access Scope | Login Email | Login Password |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | `ADMIN` | Master Access | `kumarkamlakant46@gmail.com` | `Kamlakant@9584` |
| **Jitendra sharma** | `SALES` | CRM & Challan booking | `jitendrasharma19@gmail.com` | `Jitendra@9584` |
| **Keshav samdarshi** | `WAREHOUSE` | Inventory catalog & logs | `keshavsamdarshi98@gmail.com` | `Keshav@9584` |
| **Chandan suryavanshi** | `ACCOUNTS` | Invoice print & confirm | `chandansuryavanshi80@gmail.com` | `Chandan@9584` |

---

## 4. Role-Based Access Control (RBAC) Matrix

Permissions are enforced both visually on the frontend sidebar links/buttons and securely on the backend controllers.

| Operation / Module | API Endpoint Root | Admin | Sales | Warehouse | Accounts |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Create/Edit Users** | `/api/users` | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Add/Edit Customers** | `/api/customers` | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Deactivate/Delete Customer** | `/api/customers/:id` | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Log CRM Follow-up Note** | `/api/customers/:id/follow-ups`| ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Add/Edit Products** | `/api/products` | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **Adjust/Replenish Stock** | `/api/products/:id/adjust` | ✅ Yes | ❌ No | ✅ Yes | ❌ No |
| **View Stock Movement Logs** | `/api/products/movements` | ✅ Yes | ❌ No | ✅ Yes | ✅ Yes |
| **Create Sales Challan** | `/api/challans` | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Cancel Sales Challan** | `/api/challans/:id/cancel` | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **Confirm Sales Challan** | `/api/challans/:id/confirm` | ✅ Yes | ❌ No | ❌ No | ✅ Yes |
| **View Analytics & Forecasts**| `/api/reports` | ✅ Yes | ❌ No | ❌ No | ❌ No |

---

## 5. Database Schema & Models

The following Entity-Relationship Diagram outlines the database schema generated via Prisma:

```
+---------------+        +---------------+
|     User      |        |   Customer    |
+---------------+        +---------------+
| id (PK)       |        | id (PK)       |
| name          |        | customerName  |
| email         |        | mobileNumber  |
| passwordHash  |        | email         |
| role          |<---+   | businessName  |
+---------------+    |   | gstNumber     |
                     |   | customerType  |
+---------------+    |   | status        |
|  FollowUp     |    |   | leadStage     |
+---------------+    |   | followUpDate  |
| id (PK)       |    |   +-------+-------+
| customerId    |----+           |
| notes         |                |
| contactMethod |                v
| followUpDate  |        +---------------+
| createdBy     |------>|  Challan      |
+---------------+        +---------------+
                         | id (PK)       |
+---------------+        | challanNumber |
|  Product      |        | customerId    |
+---------------+        | status        |
| id (PK)       |        | totalAmount   |
| name          |        | createdBy     |
| sku           |        +-------+-------+
| category      |                |
| unitPrice     |                v
| currentStock  |        +---------------+
| minimumStock  |        |  ChallanItem  |
| location      |        +---------------+
+---------------+        | id (PK)       |
                         | challanId     |
                         | productId     |
                         | quantity      |
                         | priceSnapshot |
                         | skuSnapshot   |
                         +---------------+
```

### Prisma Schema Definitions
1. **User**: Credentials, role configuration, and relationship to created records.
2. **Customer**: CRM details, lead status, current pipeline conversion stage, and follow-up schedules.
3. **LeadStageHistory**: Operational timeline logs tracking when, why, and by whom a lead's pipeline stage was converted (e.g., moving from `LEAD` to `CONTACTED` to `WON`).
4. **FollowUp**: Chronological record of notes, scheduling dates, and contact methods (`CALL`, `EMAIL`, `MEETING`, `SMS`).
5. **Product**: Master inventory items containing stock velocity variables, safety thresholds, and warehouse shelf mappings.
6. **StockMovement**: Audited stock ledger containing item deductions/credits, transaction types (`IN` for replenishment, `OUT` for challan confirmations, `ADJUSTMENT` for audits), and quantities.
7. **Challan**: Transaction records. Status values: `DRAFT`, `CONFIRMED`, `CANCELLED`.
8. **ChallanItem**: Individual line items representing quantities ordered. Includes `priceSnapshot` and `skuSnapshot` fields to freeze billing details at the time of order confirmation.

---

## 6. API Reference

All requests must send the header:
`Authorization: Bearer <jwt_token>` (except `/api/auth/login`).

### Authentication Module (`/api/auth`)
#### 1. User Login
- **Endpoint**: `POST /api/auth/login`
- **Auth Role**: Public
- **Request Body**:
  ```json
  {
    "email": "kumarkamlakant46@gmail.com",
    "password": "Kamlakant@9584"
  }
  ```
- **Responses**:
  - `200 OK`: Returns JWT token and user profile object.
  - `401 Unauthorized`: `"Invalid email or password"`

#### 2. Get Profile
- **Endpoint**: `GET /api/auth/me`
- **Auth Role**: All Roles

---

### Customer CRM Module (`/api/customers`)
#### 1. List Customers
- **Endpoint**: `GET /api/customers`
- **Auth Role**: `ADMIN`, `SALES`
- **Query Parameters**:
  - `page` (default 1)
  - `limit` (default 10)
  - `search` (name, company, email, mobile search)
  - `status` (`LEAD`, `ACTIVE`, `INACTIVE`)
  - `customerType` (`RETAIL`, `WHOLESALE`, `DISTRIBUTOR`)
  - `leadStage` (`LEAD`, `CONTACTED`, `PROPOSAL`, `NEGOTIATION`, `WON`, `LOST`)

#### 2. Create Customer
- **Endpoint**: `POST /api/customers`
- **Auth Role**: `ADMIN`, `SALES`
- **Request Body**:
  ```json
  {
    "customerName": "Acme Corporates",
    "mobileNumber": "9876543210",
    "email": "acme@example.com",
    "businessName": "Acme Group",
    "gstNumber": "27AAAAA1111A1Z1",
    "customerType": "WHOLESALE",
    "address": "45 Industrial Zone, Pune",
    "leadStage": "LEAD"
  }
  ```

#### 3. Log Follow-up Note
- **Endpoint**: `POST /api/customers/:customerId/follow-ups`
- **Auth Role**: `ADMIN`, `SALES`
- **Request Body**:
  ```json
  {
    "followUpDate": "2026-08-15T10:00:00Z",
    "notes": "Discussed bulk rate catalog options.",
    "contactMethod": "CALL"
  }
  ```

#### 4. View Stage History Timeline
- **Endpoint**: `GET /api/customers/:id/stage-history`
- **Auth Role**: `ADMIN`, `SALES`

---

### Product & Inventory Module (`/api/products`)
#### 1. Create Product
- **Endpoint**: `POST /api/products`
- **Auth Role**: `ADMIN`, `WAREHOUSE`
- **Request Body**:
  ```json
  {
    "name": "Wireless Ergonomic Mouse",
    "sku": "WRLS-MSE-99",
    "category": "Electronics",
    "unitPrice": 1250.00,
    "currentStock": 50,
    "minimumStock": 15,
    "warehouseLocation": "Shelf A4"
  }
  ```

#### 2. Stock Adjustment / Replenishment
- **Endpoint**: `POST /api/products/:id/adjust`
- **Auth Role**: `ADMIN`, `WAREHOUSE`
- **Request Body**:
  ```json
  {
    "quantity": 25,
    "type": "IN",
    "reason": "Monthly vendor supply replenishment"
  }
  ```

---

### Sales Challan Module (`/api/challans`)
#### 1. Create Draft Challan
- **Endpoint**: `POST /api/challans`
- **Auth Role**: `ADMIN`, `SALES`
- **Request Body**:
  ```json
  {
    "customerId": "customer-uuid-here",
    "items": [
      {
        "productId": "product-uuid-here",
        "quantity": 10
      }
    ]
  }
  ```

#### 2. Confirm Sales Challan
- **Endpoint**: `POST /api/challans/:id/confirm`
- **Auth Role**: `ADMIN`, `ACCOUNTS`
- **Under the Hood**: Verifies stock availability. If available, reduces product stock levels, generates an `OUT` stock ledger entry, freezes product parameters inside `ChallanItem`, and marks status as `CONFIRMED`.
- **Error Response**:
  - `400 Bad Request`: `"Insufficient stock for product WRLS-MSE-99"`

#### 3. Cancel Sales Challan
- **Endpoint**: `POST /api/challans/:id/cancel`
- **Auth Role**: `ADMIN`, `ACCOUNTS`
- **Under the Hood**: Restores the previously depleted quantities to inventory catalog, writes an `IN` stock ledger entry, and marks status as `CANCELLED`.

---

## 7. Local Setup & Installation

Follow these steps to configure the project locally.

### Prerequisites
- Node.js (v18.0.0 or higher)
- NPM (v9.0.0 or higher)

### Repository Hierarchy
```
mini-erp-crm/
├── backend/            # Express REST API Server
└── frontend/           # React SPA Client
```

### Step 1: Clone and Set Up Backend CWD
1. Open your terminal in the backend directory:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up the local SQLite database file:
   - Create a `.env` file from the example:
     ```bash
     cp .env.example .env
     ```
   - Make sure your `.env` contains:
     ```env
     PORT=5000
     DATABASE_URL="file:./dev.db"
     JWT_SECRET="supersecretkeyreplaceinproduction"
     NODE_ENV="development"
     FRONTEND_URL="http://localhost:5173"
     ```
4. Run Prisma Migrations to generate the schema:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with operational users and customer histories:
   ```bash
   npm run prisma:seed
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server will boot up on `http://localhost:5000`.*

---

### Step 2: Set Up Frontend CWD
1. Open a new terminal in the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite SPA client:
   ```bash
   npm run dev
   ```
   *The React client will open on `http://localhost:5173`.*

---

## 8. Business Logic & Implementation Details

### 1. Stock Depletion Timing
- Creating a sales challan puts it in `DRAFT` status. No stock is reserved or depleted at this stage. This allows sales reps to create quotes/challans without locking physical warehouse inventory.
- When an Accounts specialist or Admin clicks **Confirm Challan**, the system opens a transactional database write. It verifies that `currentStock >= requestedQuantity` for all items. If verified, the stock is immediately depleted, and movements are committed.

### 2. Bidirectional Stage & Status Synchronization
Customer status (`ACTIVE`, `INACTIVE`, `LEAD`) is bound to the CRM stage transitions:
- Stages `LEAD`, `CONTACTED`, `PROPOSAL`, `NEGOTIATION` derive the status `LEAD`.
- Stage `WON` derives the status `ACTIVE` (customer is onboarded, ready for sales challans).
- Stage `LOST` derives the status `INACTIVE` (lead is closed / contact suspended).

---

## 9. Future Enhancements & Production Roadmap

### 1. File Uploads (AWS S3)
Integrate an S3 storage bucket interface to attach purchase orders, GST certificates, and product category images.

### 2. Redis Caching layer
Use a Redis key-value cache layer to cache inventory counts, reducing database query stress for high-frequency stock velocity checks during invoice confirmations.

### 3. Docker Containerization
Provide a `Dockerfile` and `docker-compose.yml` to bundle Express, React, and PostgreSQL, allowing developers to spin up the entire Full-Stack system in a single command.
