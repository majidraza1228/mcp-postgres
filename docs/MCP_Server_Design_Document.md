# Design Document: Unified MCP Server (API, Database, and File-Based Integration)

**Version:** 2.0
**Date:** 2026-07-31
**Author:** Syed M
**Status:** Draft for review

---

## 1. Overview

### 1.1 Purpose

This document describes the design of a Model Context Protocol (MCP) server that gives LLM agents a single, well-governed interface to three classes of backend resources:

- **APIs** – internal/external REST or GraphQL services
- **Databases** – relational (Postgres/MySQL) and/or NoSQL stores
- **Files** – a NAS-hosted network file share (SMB/NFS), plus document formats on it (CSV, PDF, DOCX, XLSX)

It also covers the design considerations specific to each domain, why an external **API Gateway** is still needed even when an **MCP Gateway** is in place, what happens if you try to run on an MCP Gateway alone, and the role of the **MCP Registry** in discovering and governing MCP servers.

### 1.2 Goals

- One MCP server, three data domains, consistent tool conventions across all of them
- Centralize auth, rate limiting, routing, and audit logging via gateways rather than duplicating that logic in the server
- Expose a curated, composable tool surface — not a raw passthrough of every API/DB/file operation
- Be safe by default: read-only unless explicitly permitted, sandboxed file access, parameterized queries only

### 1.3 Non-Goals

- Building a general-purpose ETL or data pipeline
- Replacing existing API gateways or IAM systems (the design integrates with them, not replaces them)
- Supporting arbitrary/unrestricted SQL execution or shell access

### 1.4 Target Stack

| Layer | Choice |
|---|---|
| Language / SDK | Python + FastMCP (`mcp` Python SDK) |
| Transport | Streamable HTTP (remote, multi-client) with stdio supported for local/dev use |
| Schema validation | Pydantic v2 |
| API Gateway | Kong / AWS API Gateway / Apigee (existing org standard) |
| MCP Gateway | Self-hosted (e.g. Bifrost) or managed (Portkey, TrueFoundry, etc.) |
| MCP Registry | Official `registry.modelcontextprotocol.io` and/or an internal enterprise sub-registry |
| Database drivers | `asyncpg`/`psycopg` (Postgres), `motor` (MongoDB), SQLAlchemy async core |
| File / NAS access | SMB (`smbprotocol`/`pysmb`) or NFS mount, `pathlib` with sandboxing on top |
| Per-domain auth | Files: NAS permission token (ACL check) · DB: user credentials or SSO · API: no OAuth on backend — API key/mTLS/signed token |
| Observability | OpenTelemetry traces + structured JSON logs |

---

## 2. Design Considerations by Domain

Each domain the server touches has a different risk profile and a different set of design questions to settle up front.

### 2.1 API Integration — Design Considerations

- **Coverage vs. workflow tools.** Decide whether to expose thin 1:1 wrappers around API endpoints (maximum flexibility for the agent) or higher-level workflow tools that chain several calls (e.g., `api_get_customer_360` = profile + orders + tickets in one call). Default to broad endpoint coverage, and add workflow tools only for very common multi-step tasks.
- **Auth model — no OAuth on the backend.** Unlike the MCP Gateway hop (which does use OAuth 2.1/OIDC for the agent), the backend APIs this toolkit calls do **not** support OAuth. The MCP server must authenticate to them using whatever they do support — a static **API key**, **mutual TLS (mTLS) client certificate**, HTTP Basic auth, or an HMAC-signed request — held as a service credential in the secrets manager, not per end user. Practical implications:
  - Since the backend can't distinguish individual users, **per-user attribution has to happen upstream**, at the MCP Gateway (which already logs "which agent/user invoked this tool") — the backend only ever sees the MCP server's single service identity.
  - Rotate the API key/cert on a schedule and on suspected compromise; the API Gateway (Section 4.1) is the natural place to do this centrally if multiple tools/services share the same backend.
  - If the backend later adds OAuth support, migrate to token exchange (agent identity → short-lived backend-scoped token) so authorization moves from "the MCP server can do X" to "this specific user can do X" — but design for the no-OAuth case as the baseline today.
- **Idempotency and side effects.** Any tool that creates/updates/deletes must be clearly annotated (`destructiveHint`), and ideally supports idempotency keys so retries from the agent don't double-create resources.
- **Schema drift.** Backend APIs change. Tools should fetch/validate against a versioned OpenAPI/GraphQL schema rather than hardcoding assumptions, and fail loudly (not silently) on breaking changes.
- **Response size and shape.** Raw API responses are often too verbose for an LLM context window — tools should project/trim fields and paginate rather than return full payloads.
- **Where auth, retries, rate limiting, and TLS live.** This is the core reason an API Gateway is still needed even with a MCP Gateway in place (see Section 4).

### 2.2 Database Integration — Design Considerations

- **Auth model — credentials or SSO, per user.** Two supported modes, chosen per deployment: (1) **user-supplied credentials** — the caller provides a DB username/password (or connection string) at request time, which the server uses to open a per-user connection rather than a shared service account; or (2) **SSO / federated auth** — the identity token forwarded by the MCP Gateway is exchanged for a database session via the org's SSO provider (e.g., Azure AD-integrated auth for SQL Server, IAM database authentication, Kerberos). SSO is preferred where available since it gives per-user audit trails at the database level and avoids credential handling in the MCP server; user-supplied credentials should never be logged or cached beyond the request's connection lifetime.
- **Read vs. write surface area.** Read tools (list, describe, query) are low-risk and should be enabled by default. Write tools (insert/update/delete) are high-risk and should be feature-flagged off by default, gated by role.
- **No free-form SQL by default.** Prefer structured query tools (table + filters + sort + pagination) built on a query builder. If raw SQL must be supported, restrict it to a read-replica, enforce a statement timeout, and validate the statement against a table/column allow-list before execution.
- **Schema and data sensitivity.** Some tables (PII, financial, credentials) should never be reachable through the tool surface at all — enforce this via an allow-list, not a deny-list, so newly added tables are excluded by default.
- **Connection management.** Use a connection pool created once at startup, not per-call; separate pools/credentials for read-replica vs. primary if writes are enabled.
- **Query cost.** Long-running or full-table-scan queries from an agent can degrade a shared database. Enforce timeouts, row limits, and `EXPLAIN`-based cost checks before executing ad hoc queries.
- **Result size.** Cap rows returned per call and require pagination — agents can and will ask for "all rows."

### 2.3 File System Integration — Design Considerations

- **Files must resolve to a NAS path.** All file tools operate against a network-attached storage share (SMB/NFS), not arbitrary local disk or a cloud object store. Every tool's `path` argument is resolved to `nas://<share>/<path>` (or the mounted equivalent) and validated before any I/O — this is the storage boundary the rest of the design assumes.
- **NAS permission check via the caller's token — the primary control.** Every file operation requires a permission token identifying the calling user (forwarded by the MCP Gateway as part of the identity claims, or supplied explicitly if the NAS uses its own auth domain). Before any read/write/list/delete, the server must verify that this token/identity actually has the requisite NAS-level permission (e.g., checking Active Directory / LDAP group membership against the share's ACL, or calling the NAS's native auth API) — the tool must not rely on its own service account's broader access to silently satisfy a request the calling user isn't entitled to make. A denied permission check should return an actionable, non-revealing error ("you don't have read access to this share/folder") rather than a generic failure.
- **Sandboxing on top of the permission check.** Independently of the NAS ACL check, every path must still be canonicalized and validated against a configured root before any read/write — this is the second, defense-in-depth control against path traversal (`../../etc/passwd`), since ACL checks alone don't stop a crafted relative path from escaping the intended folder.
- **Binary vs. text content.** Large binary files (images, archives) generally should not be returned inline to the LLM; return metadata + a reference (path/handle) instead, and only return extracted text for documents (PDF/DOCX/XLSX/CSV).
- **Size limits and streaming.** Enforce a max file size before reading into memory; stream or chunk large files rather than loading them wholesale — NAS reads over SMB/NFS can be slow for very large files, so timeouts matter too.
- **Write and delete risk.** File writes/deletes are irreversible on most NAS configurations — feature-flag them, require explicit confirmation semantics, and rely on the NAS's own snapshot/versioning features (if available) so mistakes are recoverable.
- **Malware/content risk.** Uploaded or ingested files should be scanned/validated (mime-type sniffing, not just extension) before being parsed or passed along, ideally through the NAS's own AV integration if it has one.

### 2.4 Cross-Domain Considerations

- **Consistent conventions.** All three toolkits should share the same naming pattern (`{domain}_{action}_{resource}`), pagination shape, error format, and response-format switch (`json`/`markdown`) so an agent doesn't need domain-specific reasoning just to use the tools correctly.
- **Least privilege by default.** Every domain defaults to read-only; write/destructive capability is opt-in per deployment, not per tool call.
- **Everything is eventually a policy decision, not a code decision.** Auth, rate limits, and access scope should live in the gateway layer wherever possible, so tightening/loosening access doesn't require redeploying the server.

---

## 3. High-Level Architecture

```
                        ┌─────────────────────────────┐
                        │        LLM / Agent Client     │
                        │  (Claude, IDE agent, chatbot) │
                        └───────────────┬───────────────┘
                                        │ MCP protocol (JSON-RPC over
                                        │ Streamable HTTP / stdio)
                        ┌───────────────▼───────────────┐
                        │          MCP GATEWAY           │
                        │  • AuthN/AuthZ (OAuth 2.1/OIDC) │
                        │  • Tool-level access control    │
                        │  • Request routing/aggregation  │
                        │  • Rate limiting & quotas        │
                        │  • Audit logging & tracing        │
                        │  • Uses MCP Registry for          │
                        │    discovery/allow-listed servers  │
                        └───────────────┬───────────────┘
                                        │ routes to the right
                                        │ downstream MCP server(s)
                        ┌───────────────▼───────────────┐
                        │        MCP SERVER (this doc)   │
                        │ ┌─────────┐ ┌─────────┐ ┌─────┐ │
                        │ │  API    │ │Database │ │File │ │
                        │ │ Toolkit │ │ Toolkit │ │Kit  │ │
                        │ └────┬────┘ └────┬────┘ └──┬──┘ │
                        └──────┼──────────┼─────────┼─────┘
                               │          │         │
                    ┌──────────▼──┐  ┌────▼────┐ ┌──▼───────────┐
                    │ API GATEWAY  │  │ Database │ │  NAS (SMB/NFS)│
                    │(Kong/AWS/etc)│  │ (Postgres│ │  network file │
                    │  no OAuth on │  │ /MySQL/  │ │  share —      │
                    │  backend APIs│  │ Mongo)   │ │  permission-  │
                    │  → API key/  │  │ creds or │ │  token checked│
                    │  mTLS        │  │ SSO      │ │  before I/O   │
                    └──────┬───────┘  └──────────┘ └───────────────┘
                           │
                 ┌─────────▼─────────┐
                 │  Backend REST /    │
                 │  GraphQL Services  │
                 └────────────────────┘

              ┌────────────────────────────────┐
              │   MCP REGISTRY (metaregistry)    │
              │  Discovery + metadata for which   │
              │  MCP servers exist, their          │
              │  versions, and where their code    │
              │  lives (npm/PyPI/container reg.)   │
              └────────────────────────────────┘
```

Three tiers of control appear deliberately:

- The **MCP Gateway** governs the *agent-to-tool-server* hop (who can call which MCP tools, at what rate, with what audit trail).
- The **API Gateway** governs the *server-to-backend* hop (how the MCP server's outbound calls reach internal/external APIs).
- The **MCP Registry** governs *discovery and trust* — which MCP servers exist, what version they're at, and where their real code lives — consumed by the MCP Gateway (and by developers) rather than by the agent directly.

---

## 4. Gateway Layer: API Gateway vs. MCP Gateway

### 4.1 Why We Still Need an External API Gateway

Even with an MCP Gateway in front of the MCP server, the backend APIs the server calls still need their own gateway, for reasons that have nothing to do with agents:

- **Backend lifecycle management.** API Gateways version, deprecate, and route across many backend services, most of which are also called by non-agent clients (web apps, mobile apps, other services). That lifecycle management doesn't go away because an agent is now one more caller.
- **Protocol- and transport-level protections.** TLS termination, WAF rules, DDoS protection, and connection-level rate limiting are mature, battle-tested capabilities of API Gateways. An MCP Gateway is not designed to replace this.
- **Multi-consumer reuse.** The same backend APIs are typically consumed by many systems, not just this MCP server. Centralizing auth/rate-limiting/caching at the API Gateway means every consumer benefits, instead of re-implementing it in each MCP server.
- **Backend-side traffic shaping.** Circuit breaking, retries with backoff, and canary/blue-green routing for backend service versions are naturally implemented at the API Gateway, closest to the services themselves.
- **Credential rotation.** A single point to rotate API keys/certificates used to reach backend services, independent of how many MCP servers or tools call them.
- **Visibility gap otherwise.** Without it, the MCP server would need to embed API lifecycle, WAF, and backend rate-limiting logic itself — duplicating infrastructure that already exists and is better maintained centrally.

In short: the API Gateway protects and manages the *backend services*; it would need to exist even if MCP and agents didn't.

### 4.2 Purpose of the MCP Gateway

The MCP Gateway exists to govern the *agent-to-tool* relationship specifically — a layer that didn't exist before agents needed to call tools autonomously:

- **Agent/user identity, not just service identity.** Authenticates the human or agent identity behind a tool call (OAuth 2.1, OIDC, SSO via Okta/Entra ID) and propagates it so downstream policy and audit trails reflect who really initiated an action.
- **Tool-level policy.** Allow/deny individual tools per role — something API Gateways can't do because they operate at the HTTP-route level, not the "named tool with a JSON schema" level.
- **Multi-server aggregation and discovery.** Presents many MCP servers (this one, a CRM server, a ticketing server) behind a single logical endpoint, using the MCP Registry to know what's available.
- **Agent-shaped rate limiting.** Limits things like "tool calls per agent session" or "destructive tool calls per hour," which is a different unit of control than "requests per second to an endpoint."
- **Full-conversation audit trail.** Logs which agent, on whose behalf, called which tool, with what arguments, and what was returned — the audit shape regulators and security teams expect for autonomous actions, not just HTTP access logs.
- **Prompt-injection-aware last line of defense.** Sits after the LLM has already decided what to do, so it can catch unauthorized tool usage even if the agent was manipulated upstream — though it cannot see or stop the injection itself (that's a model/agent-framework concern, not a gateway one).

### 4.3 What If We Skip the External API Gateway and Rely Only on the MCP Gateway?

This is a legitimate question for smaller deployments, and it is possible — but it comes with clear trade-offs:

**What still works:**
- Agent identity, tool-level authorization, tool-call audit logging, and MCP-server aggregation all still work, since that's the MCP Gateway's job.
- For internal APIs with few consumers (only ever called by this MCP server, not by other apps), skipping a dedicated API Gateway is a reasonable simplification.

**What you lose or must reimplement yourself, inside the MCP server:**
- **Backend-side rate limiting and circuit breaking** — the MCP Gateway limits *agent-to-tool* calls, not the downstream *tool-to-backend* HTTP traffic. If a tool fans out to multiple backend calls, or if other non-agent systems also call the same backend, there's no shared enforcement point.
- **WAF/DDoS protection and TLS management for the backend services** — an MCP Gateway is not a substitute for network/edge security in front of your APIs.
- **Multi-consumer governance** — if any other application (not just this MCP server) calls the same backend APIs, an MCP-Gateway-only setup gives you no shared policy layer for those other consumers; you'd end up duplicating auth/rate-limit logic per consumer.
- **Backend version routing/canarying** — without an API Gateway, rolling out a new backend API version safely (canary %, blue/green) has to be handled by the backend service itself or not at all.
- **Credential/key rotation at one central point** — service credentials for backend calls would live and rotate inside the MCP server's own config/secrets, rather than at a shared gateway.
- **Content inspection at the request/response level for non-agent traffic** — API Gateways catch anomalous backend usage patterns across all consumers; an MCP Gateway only sees agent-originated traffic.

**Practical guidance:** MCP-Gateway-only is acceptable when the backend APIs are *private to this MCP server* (no other consumers), low-traffic, and low-risk. As soon as backend APIs are shared across multiple consumers, exposed publicly, or subject to compliance/audit requirements at the network edge, an API Gateway should sit in front of them regardless of whether an MCP Gateway also exists — the two are complementary controls at different layers, not substitutes for one another.

### 4.4 Quick Comparison

| Aspect | API Gateway | MCP Gateway |
|---|---|---|
| Protects | Backend REST/GraphQL services | MCP servers / tool endpoints |
| Sees | HTTP requests/responses | MCP tool calls (JSON-RPC), tool names/schemas |
| Identity model | Service-to-service / API keys / client auth | Agent/user identity via OAuth 2.1/OIDC, propagated per call |
| Granularity | Per route/endpoint | Per tool, per agent, per session |
| Typical controls | TLS, WAF, rate limiting, caching, canarying | Tool allow/deny lists, audit trail, multi-server aggregation, agent rate limits |
| Existed before agents? | Yes | No — purpose-built for agentic tool use |
| Consumers | Many types of clients (web, mobile, services, agents) | Agents/LLM clients specifically |

---

## 5. MCP Registry

### 5.1 What It Is

The MCP Registry (the official one lives at `registry.modelcontextprotocol.io`, maintained as an open, community-driven project backed by Anthropic, GitHub, Microsoft, and others) is a **metaregistry** — it stores metadata about MCP servers (name, description, version, capabilities, and where the actual package lives), not the server code itself. The real artifacts still live in existing package registries: npm, PyPI, or a container registry. Organizations can also run their own private sub-registry for internal/enterprise MCP servers, using the same open specification.

### 5.2 How It Helps

- **Discovery.** Provides a single, searchable source of truth for "what MCP servers exist" instead of agents/developers relying on word of mouth or scattered GitHub links. A single REST API call can search for relevant servers by name/capability.
- **Namespace ownership and trust.** Publishing requires namespace ownership verification, which reduces the risk of name-squatting or impersonation of a well-known server (a real supply-chain concern once agents can auto-install tools).
- **Versioning.** Tracks versions of a given MCP server so a gateway or client can pin to a known-good version, or detect when a newer version is available.
- **Composable with sub-registries.** Because it's a metaregistry with an open spec, enterprises can run internal registries that mirror or extend it — listing only approved, internally-vetted MCP servers for their org, while still following the same discovery contract.
- **Feeds the MCP Gateway.** The MCP Gateway can use registry metadata to know which MCP servers are legitimate/approved before routing any agent traffic to them, and to power its own "available tools" catalog for agents — this is the connection back to Section 4.2's "multi-server aggregation and discovery" point.
- **Supply-chain security.** Because it separates metadata from code, and requires ownership verification, it gives security teams a place to apply policy (e.g., "only allow MCP servers verified in our internal sub-registry") before an agent is ever allowed to talk to a new server.

### 5.3 How It Fits Into This Design

- This MCP server (`unified_data_mcp`) should be published to an internal enterprise sub-registry (not necessarily the public registry, since it touches internal APIs/DBs/files) with proper namespace ownership and semantic versioning.
- The MCP Gateway should be configured to only route to servers listed in that internal registry — this is what turns "MCP Gateway allow-lists MCP servers" from a manual config file into a governed, auditable process.
- When the server's tool surface changes (new tools, deprecated tools, breaking schema changes), bump the registry version so the gateway and any client caching tool schemas can detect drift.

---

## 6. Component Design

### 6.1 Server Core

- Single FastMCP server process, `unified_data_mcp`, exposing three toolkits as logically separated modules (`tools/api_tools.py`, `tools/db_tools.py`, `tools/file_tools.py`) registered on one `FastMCP` instance.
- Streamable HTTP transport for production (multi-client, deployable behind the MCP Gateway); stdio mode for local development/testing.
- Each tool call receives a `RequestContext` carrying the identity/claims forwarded by the MCP Gateway (user id, roles, scopes) — used for per-call authorization checks in addition to gateway-level filtering (defense in depth).

### 6.2 API Toolkit

- Wraps outbound calls to backend REST/GraphQL services **through the API Gateway** endpoint, never directly to origin services.
- **No OAuth to the backend.** A single `ApiClient` utility injects whichever credential the backend actually accepts — static API key header, mTLS client certificate, or HTTP Basic — sourced from the secrets manager at startup. There is no per-user token exchange with the backend itself; per-user attribution lives in the MCP Gateway's audit log, not in the backend call.
- Handles retries with backoff, timeout enforcement, and response normalization (JSON ⇄ Markdown).
- Supports pagination pass-through (`limit`, `cursor`/`offset`) so agents don't pull unbounded result sets.

### 6.3 Database Toolkit

- **Dual auth mode.** Each deployment configures one of: (a) accept a `db_credentials` parameter (username/password or connection string) per call/session and open a scoped connection with it, discarding it after use and never logging it; or (b) exchange the MCP-Gateway-forwarded identity for a database session via SSO (Azure AD-integrated auth, IAM DB auth, Kerberos) so the database itself sees and audits the real user. Mode (b) is preferred wherever the database supports it.
- Read tools use **parameterized, allow-listed query templates** or a query builder — never raw string-interpolated SQL.
- Optional `db_run_readonly_query` tool accepts SQL but executes it against a read-replica connection with `SET TRANSACTION READ ONLY` and a statement timeout; still validated against a table/column allow-list.
- Write operations (`db_insert_row`, `db_update_row`) are separate, explicitly annotated `destructiveHint: true`, and disabled by default (feature-flagged).
- Connection pooling via SQLAlchemy async engine or `asyncpg` pool; for SSO/per-user mode, pools are keyed per identity rather than one shared pool.

### 6.4 File Toolkit (NAS-backed)

- All file paths resolve against a **NAS share** (SMB/NFS) — this is the only supported backend; there is no local-disk or cloud-object-store path in this design.
- **Permission-token check before every operation.** Each call carries the caller's identity/permission token (forwarded from the MCP Gateway, or supplied directly if the NAS has its own auth domain). The toolkit validates that token against the NAS's ACL/AD group membership for the requested share/folder *before* performing any read, write, list, or delete — a failed check returns a clear "not authorized for this path" error rather than falling through to a shared service-account permission.
- **Sandboxing as a second layer.** Independently of the ACL check, every path is canonicalized and validated against a configured root; requests attempting to traverse outside it (`../`) are rejected before any I/O.
- Document parsing tools (PDF/DOCX/XLSX/CSV) return extracted text/structured data rather than raw bytes.
- File size limits enforced before reading into memory; large files are streamed or chunked, accounting for SMB/NFS latency.

---

## 7. Tool / Toolkit Catalog to Expose

Naming convention: `{domain}_{action}_{resource}`, snake_case, action-oriented verbs.

### 7.1 API Toolkit (`api_*`)

Backend has no OAuth: every tool below authenticates via the shared service credential (API key/mTLS) configured server-side, not a per-user token. User attribution for these calls is recorded at the MCP Gateway, not at the backend.

| Tool | Description | Annotations |
|---|---|---|
| `api_list_endpoints` | List available backend API endpoints/operations the server can call (discovery) | readOnly |
| `api_get_resource` | GET a resource by id/path with query params | readOnly, idempotent |
| `api_search_resources` | Search/list resources with filters + pagination (`limit`, `cursor`) | readOnly, idempotent |
| `api_create_resource` | POST — create a new resource | destructive |
| `api_update_resource` | PATCH/PUT — update an existing resource | destructive, idempotent |
| `api_delete_resource` | DELETE a resource | destructive |
| `api_get_schema` | Return the OpenAPI/GraphQL schema fragment for a given endpoint | readOnly |

### 7.2 Database Toolkit (`db_*`)

Every tool below runs under either an SSO-derived per-user database session or a caller-supplied `db_credentials`, per the deployment's configured mode (Section 6.3) — never a single shared service account for reads/writes alike.

| Tool | Description | Annotations |
|---|---|---|
| `db_list_schemas` | List accessible schemas/databases | readOnly |
| `db_list_tables` | List tables/views in a schema, with row-count estimates | readOnly |
| `db_describe_table` | Return column names, types, keys, indexes for a table | readOnly |
| `db_query_table` | Structured filter/sort/paginate query against one allow-listed table (no raw SQL) | readOnly, idempotent |
| `db_run_readonly_query` | Execute a validated, read-only SQL statement (allow-listed tables, timeout-bound, on a replica) | readOnly |
| `db_insert_row` *(feature-flagged)* | Insert a row into an allow-listed table | destructive |
| `db_update_row` *(feature-flagged)* | Update row(s) matching a key | destructive |
| `db_get_query_plan` | Return `EXPLAIN` output for a query | readOnly |

### 7.3 File Toolkit (`file_*`) — NAS-backed

Every tool below takes the caller's `permission_token` (usually populated automatically from the MCP-Gateway-forwarded identity) and resolves `path` against the NAS share; the server checks NAS ACL permission for that identity **before** the sandboxing/path-traversal check, and before any I/O.

| Tool | Description | Annotations |
|---|---|---|
| `file_list_directory` | List files/folders under a sandboxed NAS path, after verifying the caller's NAS read permission | readOnly |
| `file_read_text` | Read a text-based file from the NAS share (with size/line limits) | readOnly, idempotent |
| `file_read_document` | Extract text/tables from PDF, DOCX, XLSX, CSV on the NAS into structured content | readOnly |
| `file_search_content` | Grep-style search for a pattern across files in a sandboxed NAS directory | readOnly |
| `file_write_text` *(feature-flagged)* | Write/overwrite a text file on the NAS share, after verifying write permission | destructive |
| `file_upload` *(feature-flagged)* | Upload a file to a NAS folder the caller has write permission on | destructive |
| `file_delete` *(feature-flagged)* | Delete a file on the NAS share, after verifying delete permission | destructive, requires confirmation |
| `file_get_metadata` | Return size, mime type, last-modified, checksum, and the caller's effective ACL for a file | readOnly |

### 7.4 Cross-cutting

- Every list/search tool: `limit`, `offset`/`cursor`, `response_format` (`json`|`markdown`), returns `has_more`/`next_cursor`/`total_count`.
- Every tool returns actionable errors rather than raw stack traces.
- Destructive tools default to **disabled** and require an explicit `ALLOW_WRITE_TOOLS=true` config flag plus gateway-level role check.

---

## 8. Security Design

| Concern | Mitigation |
|---|---|
| Agent identity spoofing | MCP Gateway validates OAuth 2.1/OIDC tokens; server trusts only gateway-forwarded, signed identity headers |
| Over-privileged tool access | Gateway role/scope-based tool filtering + server-side allow-lists for tables/paths/endpoints |
| Unauthorized NAS file access | Every file op checks the caller's permission token against NAS ACL/AD group membership before I/O — not just service-account access |
| DB credential handling | User-supplied `db_credentials` are used for a single scoped connection and never logged/cached; SSO mode avoids server-side credential handling entirely |
| Backend API has no OAuth | Server-held API key/mTLS cert (not per-user) authenticates to the backend; per-user attribution is enforced and audited at the MCP Gateway instead |
| SQL injection | Parameterized queries only; `db_run_readonly_query` restricted to read-replica, allow-listed schemas, statement timeout |
| Path traversal | Canonicalize + validate all file paths against a sandbox root before I/O, in addition to the NAS ACL check |
| Secrets exposure | API keys/certs and any transient DB credentials pulled from/handled via a secrets manager (Vault/AWS Secrets Manager); never logged or returned in tool output |
| Unbounded resource use | Pagination limits, file size caps, query timeouts, gateway-level rate limiting/quotas |
| Destructive actions | Feature-flagged, annotated `destructiveHint: true`, require elevated role via gateway policy |
| Unverified/rogue MCP servers | Only route through MCP servers listed in the internal MCP Registry sub-registry |
| Data exfiltration via error messages | Errors are sanitized; internal exceptions logged server-side only |

---

## 9. Observability

- Structured JSON logs per tool call: `request_id`, `tool_name`, `agent/user_id` (from gateway-forwarded identity), `duration_ms`, `status`, `error_code`.
- OpenTelemetry tracing spans for each tool invocation, propagated from the MCP Gateway trace context, so a single trace covers agent → gateway → MCP server → backend API/DB/file call.
- Metrics: tool call count/latency histograms per tool, error rate, rate-limit rejections (surfaced at the MCP Gateway dashboard).

---

## 10. Deployment

- MCP server packaged as a container image; deployed behind the MCP Gateway (which handles TLS, auth, routing) in a Kubernetes namespace or serverless container platform.
- Outbound calls from the API toolkit go through the org's existing API Gateway rather than directly to origin services.
- Database toolkit connects to a read-replica for read tools; write tools (if enabled) connect to primary with stricter network policy.
- Environment-based config: `MCP_TRANSPORT` (`stdio`|`http`), `ALLOW_WRITE_TOOLS`, `DB_ALLOWED_TABLES`, `DB_AUTH_MODE` (`credentials`|`sso`), `NAS_SHARE_ROOT`, `NAS_AUTH_DOMAIN`, `API_GATEWAY_BASE_URL`, `API_BACKEND_AUTH` (`api_key`|`mtls`), `MCP_REGISTRY_URL`.

---

## 11. Testing & Evaluation

- **Unit tests**: schema validation, path sanitization, SQL allow-list enforcement, pagination logic.
- **Integration tests**: against a staging API Gateway, a test database, and a scratch object-storage bucket.
- **Security tests**: path traversal attempts, SQL injection payloads, oversized file reads, unauthorized tool calls without proper gateway-forwarded claims.
- **Agent evaluations**: author ~10 realistic, read-only, verifiable questions that require chaining `api_*`, `db_*`, and `file_*` tools, to validate the tool surface is usable end-to-end.

---

## 12. Open Questions

- Which specific databases and backend APIs are in scope for v1 (affects allow-list scope and connection setup)?
- Is a managed MCP Gateway (Portkey, Bifrost, TrueFoundry, etc.) preferred over a self-hosted one, given existing IAM (Okta/Entra ID)?
- Should we publish this server to the public MCP Registry, or keep it strictly on an internal sub-registry given it touches internal data?
- Should write tools (`db_insert_row`, `file_write_text`, `api_create_resource`) be in scope for v1, or deferred to a v2 "write-enabled" release behind stricter approval gates?
- Are any backend APIs used only by this MCP server (candidates for the MCP-Gateway-only simplification in Section 4.3), or are all of them shared with other consumers (requiring the API Gateway regardless)?
- Which identity system issues the NAS permission token (Active Directory, a custom IdP, the MCP Gateway's own identity claims), and does the NAS expose a native API to check ACLs, or does the server need to maintain its own mapping?
- For the database toolkit, which specific databases support SSO/federated auth today, and which will need to fall back to user-supplied credentials in the interim?
- Is there a roadmap for the backend APIs to add OAuth support, or should the API-key/mTLS model in Section 6.2 be treated as long-term?

---

## Sources

- [Top 5 Enterprise MCP Gateway Solutions in 2026](https://www.getmaxim.ai/articles/top-5-enterprise-mcp-gateway-solutions-in-2026/)
- [10 Best MCP Gateways In 2026](https://www.truefoundry.com/blog/best-mcp-gateways)
- [MCP Gateway: What It Is, Top Options, and How OpenObserve Fits Into Your MCP Stack](https://openobserve.ai/blog/mcp-gateway-guide/)
- [How to Connect Multiple MCP Servers Through One Gateway](https://www.getmaxim.ai/articles/how-to-connect-multiple-mcp-servers-through-one-gateway/)
- [MCP Gateway – Secure Access to MCP Servers | Portkey](https://portkey.ai/features/mcp)
- [Single MCP Gateway vs Multiple MCP Servers](https://obot.ai/blog/single-mcp-gateway-vs-multiple-mcp-servers/)
- [MCP Gateway (2026): Complete MCP Gateways Guide | QVeris](https://qveris.ai/guides/mcp-gateway/)
- [MCP Gateways: A Developer's Guide to AI Agent Architecture in 2026 | Composio](https://composio.dev/content/mcp-gateways-guide)
- [What Is an MCP Gateway: Architecture and Use Cases | TrueFoundry](https://www.truefoundry.com/blog/what-is-mcp-gateway)
- [API Gateway vs AI Gateway vs MCP Gateway: Which Do You Need? | Traefik](https://traefik.io/glossary/api-gateway-vs-ai-gateway-vs-mcp-gateway)
- [MCP vs. API Gateways: They're Not Interchangeable | The New Stack](https://thenewstack.io/mcp-vs-api-gateways-theyre-not-interchangeable/)
- [Introducing the MCP Registry | Model Context Protocol Blog](https://blog.modelcontextprotocol.io/posts/2025-09-08-mcp-registry-preview/)
- [GitHub - modelcontextprotocol/registry](https://github.com/modelcontextprotocol/registry)
- [What is an MCP Registry? The Centralized Directory for AI Agents | Kong Inc.](https://konghq.com/blog/learning-center/what-is-an-mcp-registry)
- [Getting Started With the Official MCP Registry API | Nordic APIs](https://nordicapis.com/getting-started-with-the-official-mcp-registry-api/)
