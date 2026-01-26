# The REAL Root Cause: Top-of-Hour Scheduling Load

## Problem Summary

The scheduled workflow was configured correctly and WAS on the main branch, but it never ran because all schedule attempts used times that coincide with GitHub Actions' peak load.

## Schedule History (All Failed)

1. **Jan 24, 2026**: `0 */6 * * *` - Every 6 hours at minute 0
2. **Jan 25, 13:21**: `0 * * * *` - Every hour at minute 0
3. **Jan 25, 13:28**: `*/5 * * * *` - Every 5 minutes (including 0, 5, 10, etc.)

**What they have in common**: ALL include minute 0 (top of the hour)!

## Root Cause

GitHub Actions experiences extreme load at the top of every hour (minute 0) because:
- Thousands of workflows schedule at `0 * * * *` (hourly)
- Daily jobs run at `0 0 * * *` (midnight)
- Many users default to "round" times

During peak load:
- **Jobs are delayed** by several minutes or more
- **Jobs can be dropped entirely** if the queue is too full
- GitHub's scheduler **does not guarantee precise execution**

From GitHub's own documentation:
> "The schedule event can be delayed during periods of high loads of GitHub Actions workflow runs. High load times include the start of every hour."

## The Fix

**Use odd minutes that avoid the top of hour rush:**

```yaml
on:
  schedule:
    - cron: "17 * * * *"  # Runs at :17 past every hour
```

Good minute choices: 7, 13, 17, 23, 37, 43, 47, 53
Bad minute choices: 0, 5, 10, 15, 20, 25, 30 (too common)

## Why This Works

1. **Avoids peak load**: Minute 17 is not a common scheduling time
2. **Better reliability**: Less competition for runner resources
3. **Faster execution**: Jobs start closer to their scheduled time
4. **Still frequent**: Runs every hour, just at a better time

## Testing the Fix

After merging this change:
1. The first run should occur at the next :17 minute (e.g., if merged at 3:05, expect run at 3:17)
2. Subsequent runs every hour at :17 past the hour
3. Check Actions tab for runs with `event: "schedule"` (not `workflow_dispatch`)

## Additional Recommendations

For workflows that don't need hourly updates, consider:
- `17 */4 * * *` - Every 4 hours at :17 (4:17, 8:17, 12:17, etc.)
- `17 0,6,12,18 * * *` - Four times daily at :17
- `17 9 * * *` - Once daily at 9:17 AM UTC

## References

- [GitHub Docs: Events that trigger workflows](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#schedule)
- [Stack Overflow: Why cron jobs don't run on time](https://stackoverflow.com/questions/63192132/why-does-my-cron-configured-github-action-not-run-every-2-minutes)
- Use [crontab.guru](https://crontab.guru) to validate cron expressions
