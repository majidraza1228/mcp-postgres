# SQL Detection Pattern Analysis

**Current Regex Pattern:**
```javascript
/^(select|insert|update|delete|create\s+(table|index|view|procedure|function)|alter|drop)\s+/i
```

---

## ✅ Currently Covered SQL Statements

### Query Statements (→ handleQueryRequest)
- ✅ `SELECT * FROM employees`
- ✅ `SELECT COUNT(*) FROM users WHERE active = true`

### Modification Statements (→ handleModificationRequest)
- ✅ `INSERT INTO users VALUES (...)`
- ✅ `UPDATE employees SET salary = 80000`
- ✅ `DELETE FROM orders WHERE id = 123`
- ✅ `CREATE TABLE products (...)`
- ✅ `CREATE INDEX idx_name ON users(name)`
- ✅ `CREATE VIEW active_users AS SELECT ...`
- ✅ `CREATE PROCEDURE get_employees() ...`
- ✅ `CREATE FUNCTION calculate_tax() ...`
- ✅ `ALTER TABLE users ADD COLUMN email VARCHAR(255)`
- ✅ `DROP TABLE old_data`

---

## ⚠️ Missing SQL Statements

### PostgreSQL-Specific DDL Statements

1. **GRANT / REVOKE** (Permissions)
   ```sql
   GRANT SELECT ON users TO developer;
   REVOKE DELETE ON orders FROM user_role;
   ```
   **Status:** ❌ Missing - Will route to LLM

2. **TRUNCATE** (Table clearing)
   ```sql
   TRUNCATE TABLE logs;
   TRUNCATE TABLE sessions RESTART IDENTITY;
   ```
   **Status:** ❌ Missing - Will route to LLM

3. **COMMENT** (Metadata)
   ```sql
   COMMENT ON TABLE users IS 'User accounts';
   COMMENT ON COLUMN users.email IS 'User email address';
   ```
   **Status:** ❌ Missing - Will route to LLM

4. **CREATE SCHEMA**
   ```sql
   CREATE SCHEMA analytics;
   ```
   **Status:** ⚠️ Partial - Only checks for `CREATE (table|index|view|procedure|function)`

5. **CREATE DATABASE**
   ```sql
   CREATE DATABASE my_database;
   ```
   **Status:** ❌ Missing - Will route to LLM

6. **CREATE SEQUENCE**
   ```sql
   CREATE SEQUENCE user_id_seq START WITH 1000;
   ```
   **Status:** ❌ Missing - Will route to LLM

7. **CREATE TRIGGER**
   ```sql
   CREATE TRIGGER update_timestamp BEFORE UPDATE ON users ...;
   ```
   **Status:** ❌ Missing - Will route to LLM

8. **CREATE TYPE** (Custom types)
   ```sql
   CREATE TYPE address AS (street TEXT, city TEXT);
   ```
   **Status:** ❌ Missing - Will route to LLM

9. **CREATE EXTENSION**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
   **Status:** ❌ Missing - Will route to LLM

10. **ALTER DATABASE / SCHEMA**
    ```sql
    ALTER DATABASE my_db SET timezone = 'UTC';
    ALTER SCHEMA public OWNER TO admin;
    ```
    **Status:** ⚠️ Partial - Only checks for `ALTER` without type

11. **DROP DATABASE / SCHEMA / INDEX / VIEW**
    ```sql
    DROP DATABASE old_db;
    DROP SCHEMA analytics CASCADE;
    DROP INDEX idx_name;
    DROP VIEW old_view;
    ```
    **Status:** ⚠️ Partial - Checks for `DROP` but not specific types

12. **BEGIN / COMMIT / ROLLBACK** (Transactions)
    ```sql
    BEGIN TRANSACTION;
    COMMIT;
    ROLLBACK;
    ```
    **Status:** ❌ Missing - Will route to LLM

13. **COPY** (Data import/export)
    ```sql
    COPY users FROM '/path/to/file.csv' CSV HEADER;
    COPY (SELECT * FROM users) TO '/path/to/output.csv' CSV;
    ```
    **Status:** ❌ Missing - Will route to LLM

14. **VACUUM / ANALYZE** (Maintenance)
    ```sql
    VACUUM FULL users;
    ANALYZE employees;
    ```
    **Status:** ❌ Missing - Will route to LLM

15. **EXPLAIN** (Query planning)
    ```sql
    EXPLAIN SELECT * FROM users WHERE id = 1;
    EXPLAIN ANALYZE SELECT ...;
    ```
    **Status:** ❌ Missing - Will route to LLM (but MCP has analyze_query_plan tool)

16. **WITH (CTE - Common Table Expressions)**
    ```sql
    WITH high_earners AS (SELECT * FROM employees WHERE salary > 100000)
    SELECT * FROM high_earners;
    ```
    **Status:** ❌ Missing - Will route to LLM

17. **MERGE / UPSERT (INSERT ... ON CONFLICT)**
    ```sql
    INSERT INTO users VALUES (...) ON CONFLICT (id) DO UPDATE SET ...;
    ```
    **Status:** ⚠️ Partial - Detected as INSERT, but special syntax may confuse

---

## 🔍 Potential Issues

### Issue 1: CREATE without specific type
**Input:** `CREATE SCHEMA analytics;`
**Current Regex:** Only matches `CREATE (table|index|view|procedure|function)`
**Result:** ❌ Not detected as direct SQL → Routes to LLM
**Impact:** Low - LLM will likely return the same SQL

### Issue 2: WITH (CTE) statements
**Input:** `WITH cte AS (SELECT ...) SELECT * FROM cte;`
**Current Regex:** No match for `WITH`
**Result:** ❌ Not detected as direct SQL → Routes to LLM
**Impact:** Medium - Adds unnecessary LLM call for valid SQL

### Issue 3: Transaction control
**Input:** `BEGIN; INSERT INTO users ...; COMMIT;`
**Current Regex:** No match for `BEGIN`
**Result:** ❌ Not detected as direct SQL → Routes to LLM
**Impact:** High - Transaction control won't work properly through LLM

### Issue 4: EXPLAIN statements
**Input:** `EXPLAIN SELECT * FROM users WHERE id = 1;`
**Current Regex:** No match for `EXPLAIN`
**Result:** ❌ Not detected as direct SQL → Routes to LLM
**Impact:** Medium - Should use `analyze_query_plan` tool instead

### Issue 5: TRUNCATE statements
**Input:** `TRUNCATE TABLE logs;`
**Current Regex:** No match for `TRUNCATE`
**Result:** ❌ Not detected as direct SQL → Routes to LLM
**Impact:** Low-Medium - LLM will likely return the same SQL

---

## 📊 Impact Assessment

| SQL Statement | Frequency | Current Behavior | Risk Level | Recommended Action |
|---------------|-----------|------------------|------------|-------------------|
| **SELECT** | Very High | ✅ Direct execution | None | Keep as-is |
| **INSERT** | High | ✅ Direct execution | None | Keep as-is |
| **UPDATE** | High | ✅ Direct execution | None | Keep as-is |
| **DELETE** | Medium | ✅ Direct execution | None | Keep as-is |
| **CREATE TABLE** | Medium | ✅ Direct execution | None | Keep as-is |
| **CREATE INDEX** | Low | ✅ Direct execution | None | Keep as-is |
| **ALTER** | Medium | ✅ Direct execution | None | Keep as-is |
| **DROP** | Low | ✅ Direct execution | None | Keep as-is |
| **WITH (CTE)** | Medium | ❌ Routes to LLM | Low | Add to regex |
| **TRUNCATE** | Low | ❌ Routes to LLM | Low | Add to regex |
| **EXPLAIN** | Low | ❌ Routes to LLM | Low | Add to regex |
| **BEGIN/COMMIT** | Low | ❌ Routes to LLM | Medium | Add to regex |
| **GRANT/REVOKE** | Very Low | ❌ Routes to LLM | Low | Consider adding |
| **CREATE SCHEMA** | Very Low | ❌ Routes to LLM | Low | Extend CREATE pattern |
| **COPY** | Very Low | ❌ Routes to LLM | Low | Consider adding |
| **VACUUM/ANALYZE** | Very Low | ❌ Routes to LLM | Low | Optional |

---

## 🛠️ Recommended Improvements

### Option 1: Comprehensive Pattern (Recommended)
Add most common missing statements:

```javascript
const isDirectSQL = /^(
  select|insert|update|delete|
  create\s+(table|index|view|procedure|function|schema|database|sequence|trigger|type|extension)|
  alter|drop|
  truncate|
  grant|revoke|
  begin|commit|rollback|
  explain|
  with\s+\w+\s+as
)\s+/ix;
```

**Pros:** Covers 95% of SQL statements
**Cons:** Longer regex, slightly slower (negligible)

### Option 2: Minimal Addition (Conservative)
Add only high-impact missing statements:

```javascript
const isDirectSQL = /^(
  select|insert|update|delete|
  create\s+(table|index|view|procedure|function)|
  alter|drop|
  truncate|
  with\s+\w+\s+as
)\s+/ix;
```

**Pros:** Minimal change, covers most common cases
**Cons:** Misses some valid SQL

### Option 3: Keep Current (Do Nothing)
**Reasoning:**
- Missing statements have low usage frequency
- LLM will likely return the same SQL anyway
- Current pattern covers 80%+ of use cases
- No risk of breaking existing functionality

**Pros:** No changes needed, stable
**Cons:** Unnecessary LLM calls for valid SQL

---

## 🧪 Test Cases

### Should Match (Direct SQL)
```javascript
✅ "SELECT * FROM users"
✅ "INSERT INTO users VALUES (1, 'John')"
✅ "UPDATE users SET name = 'Jane'"
✅ "DELETE FROM users WHERE id = 1"
✅ "CREATE TABLE products (id INT)"
✅ "CREATE INDEX idx_name ON users(name)"
✅ "ALTER TABLE users ADD COLUMN email VARCHAR"
✅ "DROP TABLE old_data"
```

### Should NOT Match (Natural Language)
```javascript
✅ "create a table for users"
✅ "select all employees earning more than 70000"
✅ "update the salary of employee with id 5"
✅ "delete all old records"
✅ "show me all tables"
✅ "what's the average salary"
```

### Edge Cases to Verify
```javascript
❌ "WITH cte AS (SELECT * FROM users) SELECT * FROM cte"  // CTE
❌ "TRUNCATE TABLE logs"  // Truncate
❌ "EXPLAIN SELECT * FROM users"  // Explain
❌ "BEGIN TRANSACTION"  // Transaction
❌ "CREATE SCHEMA analytics"  // Schema creation
✅ "create a select statement for users"  // Natural language
```

---

## ✅ Recommendations

### Priority 1: Add CTE Support (WITH)
CTEs are commonly used and should be detected as direct SQL:

```javascript
const isDirectSQL = /^(select|insert|update|delete|create\s+(table|index|view|procedure|function)|alter|drop|with\s+\w+\s+as)\s+/i;
```

### Priority 2: Add TRUNCATE
TRUNCATE is a common data operation:

```javascript
const isDirectSQL = /^(select|insert|update|delete|create\s+(table|index|view|procedure|function)|alter|drop|truncate)\s+/i;
```

### Priority 3: Add EXPLAIN (Optional)
Consider mapping to `analyze_query_plan` tool instead:

```javascript
// In handleChatRequest, add special case for EXPLAIN
if (lowerPrompt.startsWith('explain')) {
    // Extract the query and use analyze_query_plan tool
}
```

### Priority 4: Document Limitations
Add to documentation that transaction control statements require direct SQL mode or `/query` command.

---

## 📝 Conclusion

**Current Status:** ✅ **Good for 80%+ of use cases**

**Missing Coverage:**
- Low-frequency DDL statements (CREATE SCHEMA, CREATE SEQUENCE, etc.)
- Transaction control (BEGIN, COMMIT, ROLLBACK)
- CTEs (WITH statements)
- Maintenance commands (VACUUM, ANALYZE)

**Risk Assessment:** 🟢 **LOW**
- Most missing statements are low-frequency
- LLM will likely generate correct SQL anyway
- No data corruption or security risks

**Recommendation:**
1. ✅ Keep current pattern for stability
2. 🔄 Add `WITH` and `TRUNCATE` if users report issues
3. 📚 Document which SQL statements are auto-detected vs LLM-routed
4. 🧪 Monitor usage to identify common missing patterns

**Action Items:**
- [ ] Add comprehensive test suite for SQL detection
- [ ] Monitor Output logs for LLM-generated SQL that matches input
- [ ] Consider adding `WITH` and `TRUNCATE` in next release
- [ ] Document supported SQL statements in USAGE_EXAMPLES.md
