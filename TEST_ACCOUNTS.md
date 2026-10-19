# RESQBRIDGE Test Accounts & Development Credentials

> **Notice:** This document is for authorized local development and testing purposes only. Credentials documented here are isolated simulated accounts for development environments and must never be committed to production credential stores or publicly rendered on production login screens.

---

## 1. Local Development Accounts

| Role | Email | Password | Intended Console | Notes |
|---|---|---|---|---|
| **Responder** | `responder@resqbridge.gov` | `Emergency@2025` | `/dashboard` | Emergency Responder role. Incident triage & status updates. |
| **Admin** | `admin@resqbridge.gov` | `Admin@2025` | `/coordination` | System Administrator. Multi-agency dispatch & resource locks. |
| **Reporter** | `reporter@example.com` | `Reporter@2025` | `/my-reports` | Authenticated Citizen Reporter. Saved incident history. |

### Secondary Demo Accounts (Backward Compatibility)
- `responder@resqbridge.demo` / `demo1234` (Role: Responder)
- `admin@resqbridge.demo` / `demo1234` (Role: Admin)
- `reporter@resqbridge.demo` / `demo1234` (Role: Reporter)

---

## 2. Public / Guest Reporting
- **URL:** `/report`
- **Authentication Required:** **No**. Anyone can submit reports anonymously or as an unauthenticated guest without entering credentials.
- **Official Emergency Hotline:** `112`

---

## 3. Google OAuth Configuration
- **Client ID:** `173281284093-bdplsnv0f5pgbks5enss0b8mf8fegpup.apps.googleusercontent.com`
- **Authorized JavaScript Origins:**
  - `http://localhost:5173`
  - `http://localhost:3000`
  - `http://127.0.0.1:5173`
- **Authorized Redirect URIs:**
  - `http://localhost:5173`
  - `http://localhost:5173/auth`
- **Role Assignment Policy for Google Accounts:**
  - Accounts with `@resqbridge.gov` or containing `admin` are mapped to Admin/Responder roles.
  - All other Google accounts are registered with the standard Citizen Reporter role.
