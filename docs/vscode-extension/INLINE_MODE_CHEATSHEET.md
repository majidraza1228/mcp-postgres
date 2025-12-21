# Inline Mode Cheat Sheet

## Quick Reference Card for PostgreSQL MCP Inline Completions

### Prerequisites Checklist
- [ ] VSCode 1.85.0+
- [ ] GitHub Copilot extension installed & active
- [ ] PostgreSQL MCP extension installed
- [ ] MCP server running (check status bar: "PostgreSQL MCP: Running")
- [ ] Database connection configured

---

## Common Patterns

| You Type | Press Tab After | Extension Suggests |
|----------|----------------|-------------------|
| `CREATE FUNCTION name(` | `(` | Parameters + function body |
| `CREATE PROCEDURE name(` | `(` | Parameters + procedure body |
| `CREATE TABLE name(` | `(` | Column definitions + constraints |
| `SELECT * FROM ` | `FROM ` | Table names from your DB |
| `INSERT INTO table_name(` | `(` | All column names for that table |
| `UPDATE table_name SET ` | `SET ` | Column assignments |
| `... JOIN ` | `JOIN ` | Related table names |
| `WHERE ` | `WHERE ` | Relevant column names |

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Accept suggestion | `Tab` or `Enter` |
| Dismiss suggestion | `Esc` |
| Next suggestion | `Alt` + `]` |
| Previous suggestion | `Alt` + `[` |

---

## Settings (Quick Toggle)

```json
{
  "postgresMcp.inline.enabled": true,              // Enable/disable inline mode
  "postgresMcp.inline.triggerOnKeywords": true,    // Trigger on SQL keywords
  "postgresMcp.inline.includeSchemaContext": true  // Include DB schema
}
```

**Access**: `Cmd+,` (Mac) or `Ctrl+,` (Win/Linux) → Search "PostgreSQL MCP"

---

## Example Workflows

### 1. Create a Function
```sql
CREATE FUNCTION calculate_total_sales(
-- Press Tab here ↑
```

**Result**:
```sql
customer_id INT, start_date DATE, end_date DATE
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (SELECT SUM(amount) FROM orders
            WHERE customer_id = customer_id
            AND order_date BETWEEN start_date AND end_date);
END;
$$ LANGUAGE plpgsql;
```

### 2. Create a Table
```sql
CREATE TABLE invoices(
-- Press Tab here ↑
```

**Result**:
```sql
invoice_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_id INTEGER REFERENCES orders(order_id),
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);
```

### 3. Quick Query
```sql
SELECT * FROM
-- Press Tab here ↑ → suggests: employees, departments, orders, etc.
```

### 4. Insert Statement
```sql
INSERT INTO employees(
-- Press Tab here ↑ → suggests: employee_id, first_name, last_name, email, hire_date
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No suggestions | 1. Check status bar shows "Running"<br>2. Verify Copilot is active<br>3. Wait 1-2 seconds |
| Wrong suggestions | 1. Refresh schema cache (restart MCP server)<br>2. Verify DB connection<br>3. Check Output panel for errors |
| Slow suggestions | 1. First suggestion caches schema (slower)<br>2. Subsequent should be faster<br>3. Check DB performance |
| Errors in Output | 1. View → Output → "PostgreSQL MCP"<br>2. Check MCP server logs<br>3. Verify Copilot subscription |

---

## Commands (Cmd+Shift+P / Ctrl+Shift+P)

| Command | Purpose |
|---------|---------|
| `PostgreSQL MCP: Start Server` | Start the MCP server |
| `PostgreSQL MCP: Stop Server` | Stop the MCP server |
| `PostgreSQL MCP: Restart Server` | Restart (refresh cache) |
| `PostgreSQL MCP: Show Server Status` | View connection details |
| `PostgreSQL MCP: Configure Database Connection` | Update DB settings |

---

## Tips & Tricks

### 💡 Best Practices

1. **Let it cache**: First completion may be slow (2-3s), subsequent ones are fast
2. **Be specific**: More context = better suggestions
3. **Review always**: AI suggestions should be verified before use
4. **Use chat mode**: For complex queries, use `@postgres` in chat first
5. **Keep files focused**: One task per .sql file works best

### 🚀 Pro Tips

- **Combine modes**: Use chat to plan, inline to write
- **Test incrementally**: Accept suggestions piece by piece
- **Use comments**: Add comments for context before typing
- **Learn patterns**: See what AI suggests to learn PL/pgSQL

### ⚡ Performance Tips

- Enable auto-start: `"postgresMcp.server.autoStart": true`
- Keep schema focused: Fewer tables = faster suggestions
- Use descriptive names: Better naming → better AI understanding

---

## File Types Supported

- `*.sql` - Standard SQL files
- `*.plsql` - PL/SQL files
- Any file with language mode set to `sql`, `plsql`, or `postgres`

---

## How It Works (Simple)

```
You Type SQL → Extension Detects Pattern → Fetches Your DB Schema →
Sends to Copilot → AI Generates Code → Shows as Inline Suggestion
```

**Privacy**: Only table/column names sent to Copilot, never your actual data.

---

## Get Help

- **Full Guide**: [INLINE_MODE_GUIDE.md](./INLINE_MODE_GUIDE.md)
- **Architecture**: [ARCHITECTURE_INLINE_MODE.md](./ARCHITECTURE_INLINE_MODE.md)
- **Examples**: [examples/test-inline-completion.sql](./examples/test-inline-completion.sql)
- **Output Logs**: View → Output → PostgreSQL MCP
- **Chat Mode**: Use `@postgres` for questions

---

## Quick Test

1. Create file: `test.sql`
2. Type: `CREATE FUNCTION test(`
3. Wait 1-2 seconds
4. Press Tab to accept
5. Success! 🎉

---

## Version

This cheat sheet is for **PostgreSQL MCP Extension v1.1.0+**

---

**Happy coding! 🚀**
