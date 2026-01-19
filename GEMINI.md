# GEMINI.md - Project Context

## Project Overview
**Project Name**: 玖顺农机售后服务工单系统 (Jiushun Agricultural Machinery Service System)
**Description**: A WeChat Mini Program for managing after-sales service work orders, replacing paper forms with a digital workflow.
**Target Audience**: Jiushun Employees, Distributors, Service Personnel.

## Tech Stack
- **Framework**: UniApp (Cross-platform framework)
- **Language**: JavaScript / Vue.js
- **Backend/Cloud**: uniCloud (Aliyun provider)
- **Database**: uniCloud JSON Database (JQL)
- **Auth**: uni-id (Role-based access control, WeChat Login)
- **Target Platform**: WeChat Mini Program (MP-WEIXIN)

## Key Documents
- `requirements.md`: Detailed Product Requirements Document (PRD) v1.3.

## Project Structure
- `pages/`:
  - `login/`: Authentication (`login.vue`). Handles WeChat Auto-Login & Permission Check.
  - `register/`: Account application (`apply.vue`).
  - `admin/`: Admin-only features (`approval.vue`).
  - `index/`: Dashboard (`index.vue`). Auto-refreshes user info on show.
  - `work-order/`: Work order management (`create.vue`, `list.vue`, `detail.vue`).
  - `feedback/`: Feedback system (`create.vue`, `list.vue`, `detail.vue`).
- `uniCloud-aliyun/`:
  - `database/`:
    - `jiushun-work-orders.schema.json`
    - `jiushun-account-applications.schema.json`
    - `jiushun-feedback.schema.json`
  - `cloudfunctions/`:
    - `user-center`: Handles Login, Registration, Admin Approval.
    - `work-order-manager`: Handles Work Order CRUD.
    - `feedback-manager`: Handles Feedback CRUD.
    - `admin-init`: Script to initialize the first admin.
- `uni_modules/`:
  - `uni-config-center`: Configuration for `uni-id` (WeChat AppID/Secret).

## Development Guidelines
1.  **Auth Flow**:
    - Users login via WeChat (`user-center/login`).
    - New users are "Guests". Must apply via `pages/register/apply`.
    - Admins (`admin` role) approve applications via `pages/admin/approval`.
    - Approval updates the User's `role` and `mobile` in `uni-id-users`.
2.  **Work Orders**:
    - Images are uploaded to `cloud://<OrderNo>/<filename>` structure.
    - Dates are stored as Timestamps.
    - Drafts are saved to local storage.
3.  **Permissions**:
    - `admin`: Full access (Member Approval + Advanced Work Order Query + Feedback Management).
    - `玖顺员工` / `经销商/服务人员`: Create Orders, View Own Orders Only, Submit Feedback.

## Current Status (as of 2026-01-19)
- **Core Features Complete**:
  - **UI/UX**: Homepage Logo integrated, styled menu grid.
  - WeChat Login & Role Check.
  - Account Application & Admin Approval Workflow.
  - Work Order Creation (with Image Uploads & Drafts).
  - Work Order List & Details (Real Data).
  - **Advanced Work Order Query** (Admin: Date/Customer/Phone/Reporter/Model, Max 100).
  - **Role-based List Filtering** (Non-Admin: Own Orders Only, Date Filter, Max 50).
  - **Feedback System**: Submit questions/suggestions, Admin reply workflow.
- **Backend Integrated**:
  - Real Cloud Functions (`user-center`, `work-order-manager`, `feedback-manager`).
  - `uni-id` configured with real credentials.

## Next Steps
1.  **OCR Integration**: Implement the actual OCR API call in `create.vue`.
2.  **UI Polish**: Improve status messages, loading states, and error handling.
3.  **Testing**: Comprehensive testing on actual devices.