# Inline Mode Quick Start

Get intelligent SQL completions with your actual database schema context!

## Prerequisites

1. PostgreSQL MCP server running
2. GitHub Copilot active
3. Database connection configured

## Getting Started

### Step 1: Start MCP Server

Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux) and run:
```
PostgreSQL MCP: Start Server
```

### Step 2: Create a SQL File

Create a new file with `.sql` extension or open an existing one.

### Step 3: Start Typing

Try these examples:

#### Create a Function
```sql
CREATE FUNCTION get_customer_orders(
```
*Press Tab to accept the suggestion*

#### Create a Table
```sql
CREATE TABLE products(
```
*Press Tab to get column definitions*

#### Write a Query
```sql
SELECT * FROM
```
*Press Tab to see table names*

#### Insert Data
```sql
INSERT INTO customers(
```
*Press Tab to get all column names*

## Common Patterns

| You Type | Extension Suggests |
|----------|-------------------|
| `CREATE FUNCTION name(` | Parameters + body |
| `CREATE TABLE name(` | Column definitions |
| `SELECT * FROM ` | Table names |
| `INSERT INTO table(` | All column names |
| `UPDATE table SET ` | Column assignments |
| `... JOIN ` | Related tables |

## Tips

- **Tab**: Accept suggestion
- **Esc**: Dismiss suggestion
- **Wait 1-2 seconds**: For the suggestion to appear
- **Check status bar**: Ensure "PostgreSQL MCP: Running"

## Settings

Toggle inline mode:
```json
{
  "postgresMcp.inline.enabled": true
}
```

## Troubleshooting

**No suggestions?**
1. Check MCP server is running (status bar)
2. Verify Copilot is active (icon in status bar)
3. Check Output panel for errors (View > Output > PostgreSQL MCP)

**Slow suggestions?**
- First suggestion caches schema (slower)
- Subsequent suggestions are faster
- Check database connection speed

## Next Steps

- Read the full [Inline Mode Guide](./INLINE_MODE_GUIDE.md)
- Try creating stored procedures
- Explore complex queries
- Use chat mode with `@postgres` for help
