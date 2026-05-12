# DNA Ops Manual - Development Todos

## 🎯 CURRENT PRIORITY - 2FA Modal Implementation

### Phase 1: 2FA Modal Dialog (IN PROGRESS)
- [x] Create 2FA modal component in Login page
- [x] Update signIn flow to show modal instead of redirect
- [x] Add 2FA code input with OTP component
- [x] Implement verification logic in modal
- [x] Remove redirect to /2fa-verify page
- [x] Keep session alive during 2FA verification
- [ ] Test complete flow: login → modal → dashboard
- [ ] Push to GitHub and deploy to Vercel

**User Requirement:**
- When user enters credentials and 2FA is required, show modal/dialog on same page
- Verify 2FA code in modal
- Land in Dashboard after successful verification

**Status:** Code complete, ready for testing and deployment

---

## 🔧 Phase 2: UsersTab Fix (NEXT)

### Critical Bug Fix
- [ ] Fix "SelectTrigger is not defined" error in UsersTab
- [ ] Check Select component imports
- [ ] Verify all shadcn/ui Select components are properly imported
- [ ] Test Users tab functionality
- [ ] Deploy fix to Vercel

---

## 📊 Phase 3: Variables Management Finalization (AFTER USERS FIX)

### Variables Tab Implementation
- [ ] Extract Variables components from v47 zip (if provided)
- [ ] OR Create VariablesTab.tsx from scratch
- [ ] Create PositionManagement.tsx component
- [ ] Create DepartmentManagement.tsx component
- [ ] Add Variables tab to Settings.tsx
- [ ] Import Database icon from lucide-react
- [ ] Test Position/Department CRUD operations
- [ ] Test usage counts and delete protection
- [ ] Deploy Variables to production

---

## ✅ COMPLETED

### Dark Mode Implementation - DONE ✅
- [x] CSS variables updated with ERP-style dark mode colors
- [x] All pages have dark mode support
- [x] Deployed to production

### Environment Variables - DONE ✅
- [x] Fixed environment variable loading in Vercel
- [x] Created diagnostic page at /env-check
- [x] Verified Supabase credentials are loading correctly

### Login Bug Fixes - DONE ✅
- [x] Added missing supabase import to Login.tsx
- [x] Fixed initial login authentication

---

## 📝 Notes

**Project:** DNA Ops Manual App
**Current Version:** 4.2.0
**Deployment:** Vercel (https://dna-ops-manual.vercel.app)
**Repository:** https://github.com/Akhader63/dna-ops-manual

**User Instructions:**
1. Start with 2FA modal (highest priority) ← IN PROGRESS
2. Then fix Users tab error
3. Finally complete Variables tab

**Testing Account:**
- Email: a.khader@dna.systems
- Password: Ak892763507
- 2FA: Enabled (requires authenticator app)
