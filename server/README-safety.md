Server safety and recovery notes

New safeguards added
- ENABLE_SCHOOL_DELETION_CRON (default: false): prevents the scheduled school purge job from running unless explicitly enabled.
- BACKUP_ON_START (default: false): when true, creates a JSON snapshot of core collections to server/backups at startup.

How to verify backup
1) Set BACKUP_ON_START=true in .env
2) Start the server
3) Check server/backups for a folder named snapshot-YYYYMMDD-HHMMSS with JSON files
4) Set BACKUP_ON_START=false once you have a snapshot

Recommended environment hygiene
- Use separate MONGO_URI per environment (dev/test/prod).
- Never run Jest tests against your real DB.
- Keep ENABLE_SCHOOL_DELETION_CRON=false unless you explicitly need it.

If you suspect unwanted deletion
- Search the code for dropDatabase, deleteMany without a filter, or scheduled jobs.
- Check logs around service startup for any deletion service notices.

Rollback plan
- Restore from your Mongo dump or from server/backups JSON.
- Optionally seed minimally to re-create admin/teacher users if needed.
