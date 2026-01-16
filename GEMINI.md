# GEMINI.md - Project Context

## Project Overview
**Project Name**: 玖顺农机售后服务工单系统 (Jiushun Agricultural Machinery Service System)
**Description**: A WeChat Mini Program for managing after-sales service work orders, replacing paper forms with a digital workflow.
**Target Audience**: Jiushun Employees, Distributors, Service Personnel.

## Tech Stack
- **Framework**: UniApp (Cross-platform framework)
- **Language**: JavaScript / Vue.js (Supports Vue 2/3 conditional, verify specific usage in components)
- **Backend/Cloud**: uniCloud (Aliyun provider)
- **Database**: uniCloud JSON Database (JQL)
- **Auth**: uni-id (Role-based access control)
- **Target Platform**: WeChat Mini Program (MP-WEIXIN)

## Key Documents
- `requirements.md`: Detailed Product Requirements Document (PRD). **Always align implementation with this file.**

## Project Structure
- `pages/`:
  - `login/`: Authentication (`login.vue`).
  - `register/`: Account application (`apply.vue`).
  - `index/`: Dashboard (`index.vue`).
  - `work-order/`: Work order management (`create.vue`, `list.vue`, `detail.vue`).
- `uniCloud-aliyun/`:
  - `database/`:
    - `jiushun-work-orders.schema.json`: Work order schema.
    - `jiushun-account-applications.schema.json`: Account application schema.
  - `cloudfunctions/`:
    - `admin-init/`: Script to initialize the admin account.
- `uni_modules/`:
  - `uni-config-center`: Configuration for `uni-id` (see `uni-id/config.json`).
- `static/`: Static assets (images, icons).
- `App.vue`: Root component.
- `main.js`: Entry point.
- `pages.json`: Routing and navigation bar configuration.

## Development Guidelines
1.  **UI/UX**:
    - Follow standard WeChat Mini Program design patterns.
    - Ensure inputs are user-friendly for field personnel (larger tap targets, clear labels).
2.  **Data Management**:
    - Use `uniCloud` for all data persistence.
    - Schema definitions reside in `uniCloud-aliyun/database/`.
3.  **Coding Style**:
    - Use meaningful variable names (English preferred for code, Chinese allowed for comments/UI text).
    - Keep logic modular.
4.  **Specific Features**:
    - **Offline/Drafts**: Work orders are cached locally (`uni.setStorageSync`) to allow resuming later.
    - **Auth**: `uni-id` based auth. User registration requires admin approval.
    - **Admin**: "Super Admin" initialized via `admin-init` cloud function.

## Current Status (as of 2026-01-16)
- **Requirements**: Finalized (`requirements.md` v1.2).
- **Database**: Schemas for Work Orders and Account Applications created.
- **Frontend**:
  - Login Page (Mock logic).
  - Account Application Page (Mock logic).
  - Dashboard (Mock logic).
  - Work Order Creation (Full UI + Draft Logic + Mock Submit).
  - Work Order List/Detail (Mock logic).
- **Backend**:
  - `uni-id` configured (`config.json`).
  - `admin-init` cloud function created.

## Next Steps
1.  **Backend Integration**:
    - Replace Mock Login with `uni-id-co` or custom cloud function login.
    - Connect "Account Application" to `jiushun-account-applications` collection.
    - Connect "Work Order Submit" to `jiushun-work-orders` collection.
2.  **Admin Features**: Implement "Account Approval" page for admin users.
3.  **OCR**: Integrate external OCR API for nameplate recognition.
4.  **Testing**: Verify flow from Login -> Create Order -> View Order on Simulator/Device.