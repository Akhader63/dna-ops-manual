# Deployment Workflow - Production First

**Date:** May 06, 2026
**Status:** 🔴 **PRODUCTION-FIRST WORKFLOW ACTIVE**

---

## Workflow Policy

**ALL changes go directly to production. No dev server testing.**

---

## Standard Workflow for All Changes

### 1. Code Changes
- Make necessary code edits to the codebase
- Update TypeScript types if needed
- Add/update components, pages, hooks, etc.

### 2. Database Changes (if applicable)
- Use `task_agent` with Supabase integration
- Apply schema changes to **LIVE Supabase database**
- Update TypeScript interfaces to match schema
- Document all database changes

### 3. Deployment
**ALWAYS deploy after making changes:**

```bash
# Deploy command
deploy to Netlify as dynamic site
```

### 4. Verification
- Check deployed site URL (via "Deployed" panel in Same)
- Test the feature on live production site
- Verify database changes reflect correctly
- Check for console errors in production

### 5. Documentation
- Create version with changelog
- Update todos
- Document any breaking changes

---

## Important Notes

⚠️ **No Development Server**
- Dev server (`bun run dev`) will NOT be used
- All testing happens on live production site
- Changes are immediately visible to all users

⚠️ **Production Database**
- All Supabase changes affect live data
- Be careful with destructive operations
- Always backup critical data before major changes

⚠️ **Zero Downtime**
- Netlify handles deployment with minimal downtime
- Database migrations should be non-breaking when possible

---

## Deployment Checklist

Before every deployment:

- [ ] Code changes tested locally (visual review only)
- [ ] TypeScript types updated
- [ ] Database schema changes applied via task_agent
- [ ] Documentation updated
- [ ] Version created with clear changelog
- [ ] Deploy to Netlify
- [ ] Verify on live site
- [ ] Check for console errors
- [ ] Test affected features on production

---

## Emergency Rollback

If a deployment breaks production:

1. **Netlify:** Use "Deployed" panel → Previous deployment → Restore
2. **Supabase:** Manual database rollback may be needed
3. **Code:** Revert changes and redeploy

---

## Benefits of This Workflow

✅ **Immediate feedback** - See changes instantly on live site
✅ **Real environment** - Test with actual Supabase data
✅ **No environment drift** - Dev = Production
✅ **Faster iteration** - No local server management

---

## Risks to Manage

⚠️ **Direct production changes** - One mistake affects live site
⚠️ **No staging environment** - Everything is production
⚠️ **Live data** - Changes affect real database

**Mitigation:** Careful review, comprehensive testing on production, good version control

---

**Last Updated:** May 06, 2026
**Workflow Status:** Active
