#!/usr/bin/env python3
"""
MCP Server for MarkItDown - Convert any file to Markdown
"""
import asyncio
import os
import tempfile
from pathlib import Path
from typing import Any

from mcp.server import Server
from mcp.types import Tool, TextContent, ImageContent, EmbeddedResource
from pydantic import AnyUrl


# Create server instance
app = Server("markitdown-mcp")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """List available tools."""
    return [
        Tool(
            name="convert_file_to_markdown",
            description="Convert any file (PDF, Word, Excel, PowerPoint, Images, etc.) to Markdown format. Supports: PDF, DOCX, XLSX, PPTX, images, HTML, and more.",
            inputSchema={
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Absolute path to the file to convert"
                    },
                    "include_images": {
                        "type": "boolean",
                        "description": "Whether to extract and include images (default: true)",
                        "default": True
                    }
                },
                "required": ["file_path"]
            }
        ),
        Tool(
            name="convert_url_to_markdown",
            description="Convert a webpage URL to Markdown format",
            inputSchema={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "URL of the webpage to convert"
                    }
                },
                "required": ["url"]
            }
        ),
        Tool(
            name="supported_formats",
            description="List all supported file formats for conversion",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""

    if name == "supported_formats":
        formats = """
# Supported File Formats

## Documents
- **PDF**: .pdf
- **Word**: .docx, .doc
- **Excel**: .xlsx, .xls
- **PowerPoint**: .pptx, .ppt

## Web
- **HTML**: .html, .htm
- **URL**: Any webpage URL

## Images
- **Common**: .jpg, .jpeg, .png, .gif, .bmp
- **Advanced**: .tiff, .webp

## Code & Text
- **Markdown**: .md
- **Text**: .txt
- **CSV**: .csv
- **JSON**: .json
- **XML**: .xml

## Archives
- **ZIP**: .zip (extracts and converts contents)
        """
        return [TextContent(type="text", text=formats.strip())]

    elif name == "convert_file_to_markdown":
        file_path = arguments.get("file_path")
        include_images = arguments.get("include_images", True)

        if not file_path:
            return [TextContent(type="text", text="Error: file_path is required")]

        file_path = os.path.expanduser(file_path)

        if not os.path.exists(file_path):
            return [TextContent(type="text", text=f"Error: File not found: {file_path}")]

        try:
            # Import markitdown here to show clear error if not installed
            try:
                from markitdown import MarkItDown
            except ImportError:
                return [TextContent(type="text", text="Error: markitdown package not installed. Run: pip install markitdown")]

            # Convert file
            md = MarkItDown()
            result = md.convert(file_path)

            markdown_content = result.text_content

            # Add metadata
            file_name = os.path.basename(file_path)
            file_size = os.path.getsize(file_path)

            output = f"# Converted: {file_name}\n\n"
            output += f"**File Size:** {file_size:,} bytes\n\n"
            output += "---\n\n"
            output += markdown_content

            return [TextContent(type="text", text=output)]

        except Exception as e:
            return [TextContent(type="text", text=f"Error converting file: {str(e)}")]

    elif name == "convert_url_to_markdown":
        url = arguments.get("url")

        if not url:
            return [TextContent(type="text", text="Error: url is required")]

        try:
            from markitdown import MarkItDown

            # Convert URL
            md = MarkItDown()
            result = md.convert(url)

            markdown_content = result.text_content

            output = f"# Converted: {url}\n\n"
            output += "---\n\n"
            output += markdown_content

            return [TextContent(type="text", text=output)]

        except Exception as e:
            return [TextContent(type="text", text=f"Error converting URL: {str(e)}")]

    else:
        return [TextContent(type="text", text=f"Unknown tool: {name}")]


async def main():
    """Run the server."""
    from mcp.server.stdio import stdio_server

    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
