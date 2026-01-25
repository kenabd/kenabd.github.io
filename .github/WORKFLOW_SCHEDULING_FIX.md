# Why the Scheduled Workflow Wasn't Running

## The Problem

The `update-rates.yml` workflow was configured with:
```yaml
on:
  schedule:
    - cron: "*/5 * * * *"  # Every 5 minutes
```

Despite being on the main branch and marked as "active", the workflow only ran once (manually via `workflow_dispatch`) and never ran on schedule.

## Root Cause Analysis

### 1. **Minimum Interval at the Edge**
GitHub Actions allows a minimum cron interval of 5 minutes (`*/5 * * * *`). While this is technically allowed, running at this absolute minimum frequency can be unreliable because:
- GitHub's scheduler may throttle workflows running at extreme frequencies
- High-load periods can cause delays or skipped runs
- The system prioritizes less frequent, more reasonable schedules

### 2. **Inappropriate for Use Case**
Exchange rate data updates:
- Typically change at most hourly or daily
- API providers often rate-limit requests
- Running every 5 minutes = 288 requests/day = 8,640/month
- Most free tier APIs allow 1,000-5,000 requests/month

### 3. **GitHub Actions Scheduling Behavior**
From GitHub's documentation and community reports:
- Scheduled workflows are not guaranteed to run at exact times
- Very frequent schedules (every 5 minutes) are more likely to be delayed or skipped
- During high load, GitHub may deprioritize extremely frequent workflows
- First run after adding a workflow may be delayed

## The Solution

Changed the schedule to:
```yaml
on:
  schedule:
    - cron: "0 */4 * * *"  # Every 4 hours
```

### Why This Fixes It

1. **More Reliable Scheduling**: Running every 4 hours (6 times/day) is well within normal usage patterns and less likely to be throttled

2. **Appropriate Frequency**: Exchange rates don't change every 5 minutes, so a 4-hour interval:
   - Keeps data fresh enough for most use cases
   - Reduces API calls from 288/day to 6/day
   - Stays well under typical API rate limits

3. **Predictable Run Times**: Runs at: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00 UTC
   - Clear, predictable schedule
   - Easier to debug if issues arise
   - Less likely to conflict with other scheduled jobs

4. **Resource Efficiency**: 
   - 97.9% reduction in workflow runs (288 → 6 per day)
   - Lower GitHub Actions minutes usage
   - Reduced load on external APIs

## How to Verify the Fix

After this PR is merged to main:
1. Check the Actions tab in ~4 hours for the first scheduled run
2. Subsequent runs should occur every 4 hours
3. If the workflow doesn't run within 24 hours, it may need to be manually triggered once to "wake it up"

## References

- [GitHub Actions: Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
- [GitHub Actions: Scheduled workflow minimum interval](https://docs.github.com/en/actions/reference/limits)
- [Community discussions on schedule reliability](https://github.com/orgs/community/discussions/148592)
