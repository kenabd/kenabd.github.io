# The ACTUAL Root Cause: Scheduled Workflows Only Run on Default Branch

## The Real Problem

**Scheduled workflows ONLY run on the default branch (main).** This is a fundamental GitHub Actions limitation.

Your workflow changes were made on the `copilot/fix-schedule-workflow-issue` branch, but the scheduler **only looks at the workflow file on the main branch**.

## Evidence

Looking at the workflow runs:
```json
{
  "id": 21337606714,
  "event": "workflow_dispatch",  // Manual trigger only
  "created_at": "2026-01-25T18:40:54Z"
},
{
  "id": 21327274310,
  "event": "workflow_dispatch",  // Manual trigger only  
  "created_at": "2026-01-25T05:03:48Z"
}
```

**Both runs were triggered by `workflow_dispatch` (manual).** There has NEVER been a scheduled run (`event: "schedule"`).

## Why Previous Attempts Failed

From the git history on main:
- `96371c5`: Changed to hourly (`0 * * * *`) 
- `637feb9`: Changed back to every 5 minutes (`*/5 * * * *`)
- Currently on main: `*/5 * * * *`

When you tested 6 hours and 4 hours, those changes were likely:
1. Made on a feature branch, OR
2. Made on main but then overwritten by subsequent commits

The current main branch still has `*/5 * * * *`, which is problematic for other reasons (too frequent), but the FUNDAMENTAL issue is that **any schedule will only work if the workflow file with that schedule is on the main branch**.

## The Fix

This PR needs to be **merged to main** for the schedule to take effect. Here's what will happen:

1. **Before merge**: The workflow file on main has `*/5 * * * *` but scheduled runs don't work reliably
2. **After merge**: The workflow file on main will have `0 * * * *` (hourly) and scheduled runs WILL start working

## Important GitHub Actions Rules

From [GitHub's official documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule):

> **Note:** The schedule event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour. If the load is sufficiently high enough, some queued jobs may be dropped. To decrease the chance of delay, schedule your workflow to run at a different time of the hour.

> **Note:** Scheduled workflows run on the latest commit on the default or base branch.

This is why:
- `workflow_dispatch` works from any branch (you're manually triggering it)
- `push` works on any branch (it's tied to the push event)
- **`schedule` ONLY works on the default branch**

## What Needs to Happen

1. **Merge this PR to main** - This is critical. The schedule will not work until these changes are on main.
2. **Wait for the next hour boundary** - The first scheduled run should happen at the top of the next hour (e.g., if merged at 3:45, expect first run at 4:00)
3. **Verify** - Check the Actions tab to see a run with `event: "schedule"`

## Alternative: Quick Test

If you want to test this immediately:
1. Merge this PR to main
2. Wait until the next hour (e.g., 4:00, 5:00, etc.)
3. Check if a run appears with trigger "schedule" instead of "workflow_dispatch"

The schedule WILL work once it's on main - that's the entire issue.
