export function usage(): void {
  console.log(`Usage: mongobridge <profile>:<command> [options]

The MongoDB database name is never passed on the command line — set MONGOBRIDGE_DB in .env (see below).

Commands (first argument must be profile:command):
  <profile>:pull          Copy FROM profile → local (whole DB unless you scope with -c / --collections / --file)
  <profile>:push          Copy FROM local → profile (whole DB unless scoped)
  <profile>:export        Dump FROM profile (whole DB unless scoped)
  <profile>:import <dump-dir>
                          Restore INTO profile (whole dump unless scoped)
  <profile>:drop          Drop collections ON profile (requires -c / --collections / --file)
  generate:env            Create .env.mongobridge template in current folder

  <profile> is a name from your env (production, staging, atlas, local, …). To use a raw mongodb:// or
  mongodb+srv:// URI, pick any placeholder profile and override with --from or --to (see examples).

Global options:
  -v, --version          Show current mongobridge version
  --from <profile|uri>   Override source (pull/export/drop)
  --to <profile|uri>     Override target (push/import)
  --uri <uri>            Same as --from for export / --to for import / connection for drop
  -c, --collection NAME  Limit to this collection (repeatable)
  --collections CSV      Comma-separated collection names
  --file PATH            Newline-separated collection names (# comments allowed)
  --all                  Force whole database (default for pull/push/export/import when not scoped)
  --with-versions        Also include _<collection>_versions for each base collection
  --out DIR              export: output parent directory
  --dump                 export: write to ./dump-YYYY-MM-DD HH:mm:ss (overrides default naming)
  --yes                  push: skip confirmation
  --drop                 Drop target collections before restore (default: pull, import)
  --no-drop              Do not drop target collections before restore (default: push)
  -h, --help             Show help

Environment:
  MONGOBRIDGE_DB         Required: MongoDB database name (aliases: MONGOBRIDGE_DEFAULT_DB, MONGO_DB_NAME)
  MONGO_LOCAL_URI, MONGO_ATLAS_URI (or MONGO_REMOTE_URI), MONGO_STAGING_DB_URL, MONGO_PRODUCTION_DB_URL

Examples:
  mongobridge production:pull
  mongobridge production:push --yes
  mongobridge staging:export --out ./backups
  mongobridge atlas:export -c users --with-versions
  mongobridge production:import ./backups/mongodb_exports_20260101_myapp_remote
  mongobridge production:pull --to otherprofile
  mongobridge x:pull --from 'mongodb+srv://user:pass@cluster.example.net'`);
}
