# mongobridge

A small Node.js CLI to **export**, **import**, **pull**, and **push** MongoDB data between Atlas (or any remote) and a local database. It wraps `mongodump`, `mongorestore`, and `mongosh` so you can sync a database or a subset of collections without writing one-off scripts.

The first argument is usually **profile:command** (for example `production:pull`). The **database name** is configured with **`MONGOBRIDGE_DB`** in your `.env` (or shell environment), not on the command line.

## Install

```bash
npm install -g mongobridge
```

Or run on demand without installing:

```bash
npx mongobridge --help
```

## Prerequisites

`mongobridge` shells out to MongoDB's CLI tools — they aren't installable via npm and must be on your `PATH`:

- [**MongoDB Database Tools**](https://www.mongodb.com/docs/database-tools/) — `mongodump`, `mongorestore`
- [**mongosh**](https://www.mongodb.com/docs/mongodb-shell/) — required for the `drop` command
- **Node.js** ≥ 18

On macOS:

```bash
brew install mongodb-database-tools mongosh
```

Verify:

```bash
mongodump --version
mongorestore --version
mongosh --version
```

## Configuration

### Environment file

`mongobridge` loads the first `.env` it finds by walking **up from your current working directory** (useful when you run it inside an app repo). If none is found, it falls back to **`~/.mongobridge.env`**.

To set it up the first time:

```bash
# from anywhere — fetch the example into a project
curl -O https://raw.githubusercontent.com/vilmarfonseca/mongobridge/main/.env.example
mv .env.example .env
# then edit .env
```

Never commit `.env`; it usually contains secrets.

### Variables

| Variable | Purpose |
|----------|---------|
| **`MONGOBRIDGE_DB`** | **Required.** MongoDB database name used for every command (not passed on the CLI) |
| `MONGOBRIDGE_DEFAULT_DB`, `MONGO_DB_NAME` | Optional aliases for `MONGOBRIDGE_DB` if you already use one of these names |
| `MONGO_LOCAL_URI` | `local` (default target for `pull`, default source for `push`) |
| `MONGO_ATLAS_URI` | `atlas` (default source for `pull`, default target for `push`) |
| `MONGO_REMOTE_URI` | `remote` (same role as `atlas` if you prefer the name) |
| `MONGO_STAGING_DB_URL` | `staging` |
| `MONGO_PRODUCTION_DB_URL` | `production` |

Connection strings can include auth and options; the tool strips an embedded database path when needed and uses **`MONGOBRIDGE_DB`** as the database name for `mongodump` / `mongorestore`.

### Profiles vs raw URIs

For **`--from`**, **`--to`**, and the profile in **`profile:command`**, you can use:

- A **profile** name: `local`, `atlas`, `remote`, `staging`, `production` (resolved from the table above)
- A full **`mongodb://`** or **`mongodb+srv://`** URI passed via **`--from`** or **`--to`** to override the profile on that side

The profile in **`profile:command`** must be a single token without `:` (so it cannot be a literal `mongodb://…` string). To target a one-off URI, use a placeholder name and override, e.g. **`x:pull --from 'mongodb+srv://…'`**.

## Usage

```bash
mongobridge --help
mongobridge --version
```

### Command reference

| Command | What it does |
|---------|----------------|
| **`<profile>:pull`** | Dump **from** `profile`, restore **to** `local` |
| **`<profile>:push`** | Dump **from** `local`, restore **to** `profile` |
| **`<profile>:export`** | Dump **from** `profile` to disk |
| **`<profile>:import <dump-dir>`** | Restore **into** `profile` (positional: parent of the DB folder from `mongodump`) |
| **`<profile>:drop`** | Drop collections **on** `profile` (requires **`-c`**, **`--collections`**, or **`--file`**) |
| **`generate:env`** | Create a `.env.mongobridge` template in the current folder |

For **`pull`**, **`push`**, **`export`**, and **`import`**, the default is **the whole database** unless you narrow with **`-c`**, **`--collections`**, or **`--file`**. Use **`--all`** to force a full run when you have also passed collection flags in a way that would otherwise narrow scope (rare).

Set **`MONGOBRIDGE_DB`** in `.env` to your app database name (e.g. `shop`).

**Notes on behavior:**

- **`pull`** and **`import`** **drop** each target collection before restoring (so unique indexes like `slug`, `email`, etc. don't cause duplicate-key errors). Pass **`--no-drop`** to merge instead.
- **`push`** does **not** drop remote collections by default — pass **`--drop`** to replace them.
- **`pull`** / **`push`** stream through a temp directory and clean up; use **`export`** if you want a saved folder (e.g. at the project root).

```bash
# Generate an env template in the current directory
mongobridge generate:env

# Production → local (full database, drops local collections first)
mongobridge production:pull

# Local → production (full database); --yes skips the confirmation prompt
mongobridge production:push --yes

# Only some collections
mongobridge production:pull -c users -c posts

# Override target profile
mongobridge production:pull --to otherprofile

# Export with optional output directory
mongobridge staging:export --out ./backups

# Import (positional path to dump parent directory)
mongobridge production:import ./backups/mongodb_exports_20260109_120000_myapp_remote

# Restore into local
mongobridge local:import ~/mongo-backups/mongodb_exports_20260109_153045_shop_production
```

### `drop`

Uses `mongosh` to drop the listed collections. You must type **`YES`** to confirm. There is no whole-database drop.

```bash
mongobridge local:drop -c temp_import
mongobridge local:drop --file ./collections.txt --with-versions
```

**`--with-versions`**: for each base collection name, also drops **`_<name>_versions`** (common with Mongoose versioning plugins).

### `--uri`

For **`export`**, **`import`**, and **`drop`**, **`--uri <uri>`** sets the connection (same as **`--from`** for export/drop and **`--to`** for import). **`pull`** and **`push`** do not use **`--uri`**; use **`--from`** / **`--to`** to override endpoints.

## Options summary

| Option | Meaning |
|--------|---------|
| `-v` / `--version` | Print the current `mongobridge` version and exit |
| `--from` / `--to` | Override source/target; profile name or full MongoDB URI |
| `--uri` | URI for export (→ `--from`), import (→ `--to`), or drop |
| `--all` | Whole database (default when not scoped; use to force full DB if needed) |
| `-c` / `--collection` | One collection (repeatable) |
| `--collections` | Comma-separated names |
| `--file` | File of collection names |
| `--with-versions` | Include `_<name>_versions` for each listed base collection |
| `--out` | Export output parent directory |
| `--dump` | Export: write to `./dump-YYYY-MM-DD HH:mm:ss` (overrides default naming) |
| `--yes` | Skip push confirmation |
| `--drop` / `--no-drop` | Drop target collections before restore. **Default: drop** for `pull` and `import`; **no drop** for `push`. Use `--no-drop` on `pull`/`import` to merge without dropping; use `--drop` on `push` to replace the remote collection |

## Examples for day-to-day work

Ensure **`MONGOBRIDGE_DB`** matches the database you want (e.g. `shop`).

```bash
# Show installed mongobridge version
mongobridge -v

mongobridge production:pull
mongobridge production:export --out ~/mongo-backups
mongobridge local:import ~/mongo-backups/mongodb_exports_20260109_153045_shop_production
```

## Security notes

- Treat Atlas URIs like passwords; keep them in `.env` or your secret manager, not in shell history if you can avoid it.
- **`push`** overwrites data on the target for the selected database scope. Prefer **`export`** + inspect, then **`import`** to staging before touching production.
- Restrict Atlas **IP access list** and use least-privilege database users for sync accounts.

## Development

The CLI is written in TypeScript. To work on it locally:

```bash
git clone <this-repo>
cd mongobridge
npm install            # also runs the build via the `prepare` script
npm run dev            # tsc --watch
node dist/cli.js --help
```

To test the global install before publishing:

```bash
npm pack                                  # creates mongobridge-x.y.z.tgz
npm install -g ./mongobridge-x.y.z.tgz
mongobridge --help
```

To publish:

```bash
npm login
npm publish
```

## License

MIT
