"""
Stdio-based MCP Server for PostgreSQL
Compatible with GitHub Copilot in VS Code
"""

import asyncio
import json
import sys
import asyncpg
import logging
from decimal import Decimal
from datetime import date, datetime
from typing import Any, Dict, List, Optional
from config import Config

# Configure logging to stderr (stdout is used for MCP protocol)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stderr
)
logger = logging.getLogger("MCPServer-Stdio")

# Database configuration
class DatabaseConfig:
    host: str = Config.DB_HOST
    port: int = Config.DB_PORT
    database: str = Config.DB_NAME
    user: str = Config.DB_USER
    password: str = Config.DB_PASSWORD

db_config = DatabaseConfig()
db_pool: Optional[asyncpg.Pool] = None


# Custom JSON encoder for PostgreSQL types
class PostgresJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, (date, datetime)):
            return obj.isoformat()
        return super().default(obj)


async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            host=db_config.host,
            port=db_config.port,
            database=db_config.database,
            user=db_config.user,
            password=db_config.password,
            min_size=2,
            max_size=10
        )
        logger.info(f"✅ Connected to PostgreSQL database: {db_config.database}")
        return True
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        return False


async def close_db():
    """Close database connection pool"""
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Database connection pool closed")


# Tool implementations

def convert_postgres_types(obj):
    """Convert PostgreSQL types to JSON-serializable types"""
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, dict):
        return {k: convert_postgres_types(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [convert_postgres_types(item) for item in obj]
    return obj


async def query_database(query: str) -> Dict[str, Any]:
    """Execute a SELECT query on the PostgreSQL database"""
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query)
            result = [convert_postgres_types(dict(row)) for row in rows]
            return {
                "result": {
                    "rows": result,
                    "row_count": len(result)
                }
            }
    except Exception as e:
        logger.error(f"Query error: {e}")
        return {"error": str(e)}


async def execute_sql(sql: str) -> Dict[str, Any]:
    """Execute a SQL statement (INSERT, UPDATE, DELETE, CREATE TABLE, etc.)"""
    try:
        async with db_pool.acquire() as conn:
            result = await conn.execute(sql)
            return {
                "result": {
                    "message": "SQL executed successfully",
                    "status": result
                }
            }
    except Exception as e:
        logger.error(f"Execute error: {e}")
        return {"error": str(e)}


async def list_tables(schema: str = "public") -> Dict[str, Any]:
    """List all tables in the current database schema"""
    try:
        query = """
            SELECT table_name, table_type
            FROM information_schema.tables
            WHERE table_schema = $1
            ORDER BY table_name
        """
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, schema)
            tables = [convert_postgres_types(dict(row)) for row in rows]
            return {
                "result": {
                    "schema": schema,
                    "tables": tables,
                    "count": len(tables)
                }
            }
    except Exception as e:
        logger.error(f"List tables error: {e}")
        return {"error": str(e)}


async def describe_table(table_name: str) -> Dict[str, Any]:
    """Get the structure/schema of a specific table"""
    try:
        query = """
            SELECT
                column_name,
                data_type,
                character_maximum_length,
                is_nullable,
                column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
        """
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, table_name)
            columns = [convert_postgres_types(dict(row)) for row in rows]
            return {
                "result": {
                    "table_name": table_name,
                    "columns": columns
                }
            }
    except Exception as e:
        logger.error(f"Describe table error: {e}")
        return {"error": str(e)}


async def get_table_indexes(table_name: str) -> Dict[str, Any]:
    """Get all indexes for a specific table"""
    try:
        query = """
            SELECT
                indexname as index_name,
                indexdef as index_definition
            FROM pg_indexes
            WHERE tablename = $1
        """
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, table_name)
            indexes = [dict(row) for row in rows]
            return {
                "result": {
                    "table_name": table_name,
                    "indexes": indexes
                }
            }
    except Exception as e:
        logger.error(f"Get indexes error: {e}")
        return {"error": str(e)}


async def analyze_query_plan(query: str) -> Dict[str, Any]:
    """Analyze and return the execution plan for a SQL query using EXPLAIN"""
    try:
        explain_query = f"EXPLAIN (FORMAT JSON) {query}"
        async with db_pool.acquire() as conn:
            result = await conn.fetchval(explain_query)
            return {
                "result": {
                    "query": query,
                    "plan": result
                }
            }
    except Exception as e:
        logger.error(f"Analyze query error: {e}")
        return {"error": str(e)}


async def create_table(table_name: str, columns: List[Dict[str, str]]) -> Dict[str, Any]:
    """Create a new table in the PostgreSQL database"""
    try:
        column_defs = []
        for col in columns:
            col_def = f"{col['name']} {col['type']}"
            if col.get('constraints'):
                col_def += f" {col['constraints']}"
            column_defs.append(col_def)

        create_sql = f"CREATE TABLE {table_name} ({', '.join(column_defs)})"

        async with db_pool.acquire() as conn:
            await conn.execute(create_sql)
            return {
                "result": {
                    "message": f"Table '{table_name}' created successfully",
                    "sql": create_sql
                }
            }
    except Exception as e:
        logger.error(f"Create table error: {e}")
        return {"error": str(e)}


# MCP Protocol Implementation

TOOLS = [
    {
        "name": "query_database",
        "description": "Execute a SELECT query on the PostgreSQL database. Returns the query results as a list of rows.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The SQL SELECT query to execute"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "execute_sql",
        "description": "Execute a SQL statement (INSERT, UPDATE, DELETE, CREATE TABLE, etc.) on the PostgreSQL database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "sql": {
                    "type": "string",
                    "description": "The SQL statement to execute"
                }
            },
            "required": ["sql"]
        }
    },
    {
        "name": "list_tables",
        "description": "List all tables in the current database schema.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "schema": {
                    "type": "string",
                    "description": "Schema name (default: 'public')"
                }
            }
        }
    },
    {
        "name": "describe_table",
        "description": "Get the structure/schema of a specific table including columns, types, and constraints.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Name of the table to describe"
                }
            },
            "required": ["table_name"]
        }
    },
    {
        "name": "get_table_indexes",
        "description": "Get all indexes for a specific table.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Name of the table"
                }
            },
            "required": ["table_name"]
        }
    },
    {
        "name": "analyze_query_plan",
        "description": "Analyze and return the execution plan for a SQL query using EXPLAIN.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The SQL query to analyze"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "create_table",
        "description": "Create a new table in the PostgreSQL database.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "table_name": {
                    "type": "string",
                    "description": "Name of the table to create"
                },
                "columns": {
                    "type": "array",
                    "description": "List of column definitions",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "type": {"type": "string"},
                            "constraints": {"type": "string"}
                        },
                        "required": ["name", "type"]
                    }
                }
            },
            "required": ["table_name", "columns"]
        }
    }
]


async def handle_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle incoming MCP requests"""
    method = request.get("method")
    params = request.get("params", {})

    logger.info(f"Handling request: {method}")

    if method == "initialize":
        return {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {}
            },
            "serverInfo": {
                "name": "postgres-mcp",
                "version": "1.0.0"
            }
        }

    elif method == "tools/list":
        return {
            "tools": TOOLS
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        arguments = params.get("arguments", {})

        logger.info(f"Calling tool: {tool_name} with arguments: {arguments}")

        # Route to appropriate tool
        if tool_name == "query_database":
            result = await query_database(arguments.get("query"))
        elif tool_name == "execute_sql":
            result = await execute_sql(arguments.get("sql"))
        elif tool_name == "list_tables":
            result = await list_tables(arguments.get("schema", "public"))
        elif tool_name == "describe_table":
            result = await describe_table(arguments.get("table_name"))
        elif tool_name == "get_table_indexes":
            result = await get_table_indexes(arguments.get("table_name"))
        elif tool_name == "analyze_query_plan":
            result = await analyze_query_plan(arguments.get("query"))
        elif tool_name == "create_table":
            result = await create_table(arguments.get("table_name"), arguments.get("columns", []))
        else:
            result = {"error": f"Unknown tool: {tool_name}"}

        return {
            "content": [
                {
                    "type": "text",
                    "text": json.dumps(result, indent=2)
                }
            ]
        }

    else:
        return {"error": f"Unknown method: {method}"}


async def main():
    """Main stdio loop"""
    logger.info("Starting PostgreSQL MCP Server (stdio mode)")

    # Initialize database
    if not await init_db():
        logger.error("Failed to initialize database. Exiting.")
        return

    logger.info("MCP Server ready. Listening on stdio...")

    try:
        # Read from stdin, write to stdout
        loop = asyncio.get_event_loop()

        while True:
            # Read line from stdin
            line = await loop.run_in_executor(None, sys.stdin.readline)

            if not line:
                logger.info("Stdin closed. Exiting.")
                break

            line = line.strip()
            if not line:
                continue

            try:
                # Parse JSON request
                request = json.loads(line)
                logger.debug(f"Request: {request}")

                # Handle request
                response = await handle_request(request)

                # Add request ID to response
                if "id" in request:
                    response["id"] = request["id"]

                # Write JSON response to stdout
                print(json.dumps(response, cls=PostgresJSONEncoder), flush=True)
                logger.debug(f"Response: {response}")

            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON: {e}")
                error_response = {
                    "error": {
                        "code": -32700,
                        "message": "Parse error"
                    }
                }
                print(json.dumps(error_response), flush=True)

            except Exception as e:
                logger.error(f"Error processing request: {e}", exc_info=True)
                error_response = {
                    "error": {
                        "code": -32603,
                        "message": str(e)
                    }
                }
                print(json.dumps(error_response), flush=True)

    finally:
        await close_db()
        logger.info("MCP Server shutdown complete")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Received keyboard interrupt. Shutting down...")
    except Exception as e:
        logger.error(f"Fatal error: {e}", exc_info=True)
        sys.exit(1)
