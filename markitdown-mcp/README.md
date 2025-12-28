# MarkItDown MCP Server

Convert any file to Markdown using Microsoft's [MarkItDown](https://github.com/microsoft/markitdown) library.

## Features

- **Convert Documents**: PDF, Word, Excel, PowerPoint
- **Convert Images**: JPG, PNG, GIF, TIFF, WebP
- **Convert Web Pages**: Any URL to Markdown
- **Batch Processing**: Handle multiple files
- **Local Processing**: All conversions happen locally

## Supported Formats

### Documents
- PDF (.pdf)
- Microsoft Word (.docx, .doc)
- Microsoft Excel (.xlsx, .xls)
- Microsoft PowerPoint (.pptx, .ppt)

### Web
- HTML files (.html, .htm)
- Web URLs (any webpage)

### Images
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- TIFF (.tiff)
- WebP (.webp)

### Text & Data
- Markdown (.md)
- Plain text (.txt)
- CSV (.csv)
- JSON (.json)
- XML (.xml)

### Archives
- ZIP (.zip) - extracts and converts contents

## MCP Tools

### 1. `convert_file_to_markdown`
Convert any supported file to Markdown.

**Parameters:**
- `file_path` (required): Absolute path to the file
- `include_images` (optional): Extract and include images (default: true)

**Example:**
```
Convert this PDF to markdown: /Users/john/Documents/report.pdf
```

### 2. `convert_url_to_markdown`
Convert a webpage to Markdown.

**Parameters:**
- `url` (required): URL of the webpage

**Example:**
```
Convert this webpage to markdown: https://example.com/article
```

### 3. `supported_formats`
List all supported file formats.

**Example:**
```
What file formats can you convert?
```

## Installation

The server is automatically installed via the VS Code extension from your MCP Registry.

## Usage with Claude Desktop

Add to your Claude Desktop config:

```json
{
  "mcpServers": {
    "markitdown": {
      "command": "python3",
      "args": [
        "~/.mcp-servers/markitdown-mcp/server.py"
      ]
    }
  }
}
```

Then ask Claude:
- "Convert this PDF to markdown: /path/to/file.pdf"
- "Convert this webpage: https://example.com"
- "What file formats can you convert?"

## Examples

### Convert PDF
```
User: Convert /Users/john/report.pdf to markdown
Claude: [Uses convert_file_to_markdown tool]
```

### Convert Webpage
```
User: Convert https://github.com/microsoft/markitdown to markdown
Claude: [Uses convert_url_to_markdown tool]
```

### Check Supported Formats
```
User: What can you convert?
Claude: [Uses supported_formats tool]
```

## Technical Details

- **Language**: Python 3.9+
- **Dependencies**: markitdown, mcp
- **Protocol**: Model Context Protocol (MCP)
- **Processing**: Local, no cloud APIs

## License

MIT
