# Inline Mode Guide - PostgreSQL MCP Extension

## Overview

The PostgreSQL MCP VSCode extension now supports **inline completions** powered by your database schema context from the MCP server. This allows you to get intelligent, context-aware suggestions while writing SQL code, stored procedures, and database objects.

## Features

### 1. Chat Mode (Existing)
- Use `@postgres` in GitHub Copilot Chat
- Ask questions about your database
- Execute SQL queries
- Get table descriptions and schema information

### 2. Inline Mode (New)
- Get real-time suggestions while typing SQL code
- Context-aware completions based on your actual database schema
- Support for creating stored procedures, functions, tables, and queries
- Powered by GitHub Copilot with MCP server context

## How Inline Mode Works

When you're editing `.sql` files, the extension:

1. **Monitors your typing** for SQL keywords (CREATE, SELECT, INSERT, etc.)
2. **Fetches schema context** from the MCP server (tables, columns, data types)
3. **Generates intelligent suggestions** using GitHub Copilot with your database context
4. **Provides inline completions** that you can accept with Tab or Enter

## Supported Triggers

### Creating Stored Procedures/Functions
```sql
CREATE FUNCTION calculate_order_total(
-- Press Tab here to get parameter and body suggestions
```

### Creating Tables
```sql
CREATE TABLE orders(
-- Press Tab to get column definitions based on existing schema
```

### SELECT Queries
```sql
SELECT * FROM
-- Press Tab to see table suggestions
```

### INSERT Statements
```sql
INSERT INTO employees(
-- Press Tab to get all column names for the table
```

### JOIN Operations
```sql
SELECT * FROM orders o
JOIN
-- Press Tab to see related table suggestions
```

## Configuration

Access settings via: `Code > Settings > Extensions > PostgreSQL MCP`

### Available Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `postgresMcp.inline.enabled` | `true` | Enable/disable inline completions |
| `postgresMcp.inline.triggerOnKeywords` | `true` | Trigger on SQL keywords |
| `postgresMcp.inline.includeSchemaContext` | `true` | Include database schema in suggestions |

## Example Workflows

### Creating a Stored Procedure

1. Create a new `.sql` file
2. Start typing:
   ```sql
   CREATE OR REPLACE FUNCTION get_employee_details(
   ```
3. Press Tab to accept the inline suggestion
4. The extension will suggest parameters and function body based on your `employees` table schema

### Creating a Table with Foreign Keys

1. Type:
   ```sql
   CREATE TABLE order_items(
   ```
2. Press Tab to get column suggestions
3. The extension knows about your `orders` and `products` tables and will suggest appropriate foreign keys

### Writing Complex Queries

1. Type:
   ```sql
   SELECT * FROM
   ```
2. Press Tab to see table names
3. Continue typing and get suggestions for JOINs, WHERE clauses, etc.

## Requirements

1. **MCP Server Running**: The inline mode requires the PostgreSQL MCP server to be running
   - Start it with: `PostgreSQL MCP: Start Server` command
   - Or enable auto-start in settings: `postgresMcp.server.autoStart`

2. **GitHub Copilot Active**: Inline mode uses GitHub Copilot for generating suggestions
   - Ensure you have GitHub Copilot extension installed
   - Verify Copilot is activated in your VSCode

3. **Database Connected**: Configure your database connection
   - Use command: `PostgreSQL MCP: Configure Database Connection`
   - Or edit settings manually

## Schema Caching

To improve performance, the extension caches your database schema:

- **Cache Duration**: 5 minutes
- **Auto-refresh**: Automatically refreshes when cache expires
- **Manual Refresh**: Restart the MCP server to force cache refresh

The cache includes:
- Table names
- Column names and data types
- Constraints and relationships

## Troubleshooting

### Inline completions not showing?

1. **Check MCP server status**:
   - Click the status bar item: `PostgreSQL MCP: Running`
   - Or run: `PostgreSQL MCP: Show Server Status`

2. **Verify Copilot is active**:
   - Check for Copilot icon in status bar
   - Try toggling Copilot on/off

3. **Check settings**:
   - Ensure `postgresMcp.inline.enabled` is `true`
   - Verify database connection is configured

4. **View logs**:
   - Open Output panel: View > Output
   - Select "PostgreSQL MCP" from dropdown
   - Look for inline completion errors

### Suggestions are slow?

- The first suggestion may be slower as it caches schema
- Subsequent suggestions should be faster
- Consider limiting the number of tables in your database
- Check your database server performance

### Getting generic suggestions instead of schema-specific?

- Ensure MCP server is connected to the correct database
- Verify schema cache is populated (check output logs)
- Try restarting the MCP server

## Best Practices

1. **Enable auto-start**: Set `postgresMcp.server.autoStart` to `true`
2. **Use descriptive names**: Better naming helps the AI generate better suggestions
3. **Keep files focused**: Create separate `.sql` files for different tasks
4. **Review suggestions**: Always review and test generated code
5. **Leverage chat mode**: Use `@postgres` for complex queries and planning

## Keyboard Shortcuts

- **Tab**: Accept inline suggestion
- **Esc**: Dismiss inline suggestion
- **Alt + ]**: Show next suggestion (if multiple)
- **Alt + [**: Show previous suggestion (if multiple)

## Privacy & Security

- Inline suggestions use GitHub Copilot API
- Database schema is sent to Copilot for context (table/column names only)
- No actual data values are sent
- Suggestions are generated based on patterns, not your data
- All database credentials stay local

## Examples

### Example 1: Auto-complete INSERT statement

**You type:**
```sql
INSERT INTO employees(
```

**Extension suggests:**
```sql
employee_id, first_name, last_name, email, phone, hire_date, department_id) VALUES (
```

### Example 2: Generate stored procedure

**You type:**
```sql
CREATE FUNCTION calculate_salary_increase(
```

**Extension suggests:**
```sql
emp_id INT, percentage DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (SELECT salary * (1 + percentage/100)
            FROM employees
            WHERE employee_id = emp_id);
END;
$$ LANGUAGE plpgsql;
```

### Example 3: Create table with relationships

**You type:**
```sql
CREATE TABLE invoices(
```

**Extension suggests:**
```sql
invoice_id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(customer_id),
    order_id INTEGER REFERENCES orders(order_id),
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending'
);
```

## Feedback & Issues

If you encounter issues or have suggestions:
- Check the [GitHub repository](https://github.com/yourusername/postgres-mcp)
- Open an issue with details about your setup
- Include relevant logs from the Output panel
