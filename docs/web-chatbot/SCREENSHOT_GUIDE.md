# Web Chatbot Screenshot Guide

## Popup Chat Widget Preview

The web chatbot now appears as a beautiful popup widget instead of a full-page application.

### Visual Overview

![Popup Chatbot](../docs/images/popup-chatbot-screenshot.png)

The screenshot shows:
- **Floating chat button** in bottom-right corner (purple gradient circle with chat icon)
- **Popup window** (420x600px) with elegant design
- **Header** showing "PostgreSQL Assistant - Powered by GitHub Copilot"
- **MCP Connection Status** displaying: "Connected to Adventureworks on localhost:5431"
- **Query example** showing a SQL query with syntax highlighting
- **Results table** displaying database tables (employees, product_reviews, test, suppliers)
- **Success message**: "✓ 4 rows returned"
- **Input area** at bottom with send button

## Key Features Shown

### 1. Connection Status Bar
```
● Connected to Adventureworks on localhost:5431
```
- Green dot indicator showing active connection
- Database name: Adventureworks
- Host and port: localhost:5431
- Real-time status that updates every 30 seconds

### 2. SQL Display
```sql
SELECT table_name FROM
information_schema.tables
WHERE table_schema = 'public'
```
- Syntax-highlighted SQL query
- Dark background for code readability
- Shows exactly what SQL was generated

### 3. Results Table
| table_name |
|------------|
| employees |
| product_reviews |
| test |
| suppliers |

- Clean, formatted table display
- Column headers
- Row data
- Success indicator with row count

### 4. UI Elements
- **Status button** (circle with dot) - Click to see detailed system status
- **Minimize button** (–) - Close the popup
- **Input field** - "Ask a question about your database..."
- **Send button** - Purple arrow icon

## Color Scheme

### Gradient Header
- Primary: #667eea (Blue-Purple)
- Secondary: #764ba2 (Deep Purple)
- Creates professional, modern look

### Connection Status
- Background: #f0f9ff (Light Blue)
- Border: #e0e7ff (Lighter Purple)
- Text: #1e40af (Dark Blue)
- Indicator: #10b981 (Green - Connected)

### SQL Code Block
- Background: Dark (near black)
- Text: Syntax highlighted
  - Keywords: Green
  - Strings: Purple
  - Functions: Blue

## Responsive Design

The popup is optimized for:
- **Desktop**: Perfect size (420x600px)
- **Laptop**: Fits well on smaller screens
- **Position**: Bottom-right, doesn't block content
- **Z-index**: Appears above other page elements

## User Experience Flow

1. **Page loads** → Floating button appears
2. **User clicks button** → Popup slides up with animation
3. **Connection status** → Instantly shows MCP server info
4. **User types query** → "Show all tables"
5. **SQL generated** → Displayed in code block
6. **Query executes** → Results shown in table
7. **Row count** → "✓ 4 rows returned"
8. **User done** → Click minimize or button to close

## Comparison with Full Page Version

### Before (Full Page)
- Takes entire browser window
- Must navigate to specific URL
- Can't see other content
- More formal, less accessible

### After (Popup Widget)
- Small, non-intrusive popup
- Always available via button
- Can multitask with other pages
- Modern, chat-like interface

## Screenshot Details

The screenshot demonstrates:
- **Query**: "Show all tables" (natural language)
- **Generated SQL**: SELECT statement with proper syntax
- **Database**: Adventureworks (Microsoft sample database)
- **Connection**: localhost:5431
- **Result**: 4 tables found
- **UI State**: Popup open, query executed successfully

## How to Capture Your Own Screenshot

1. **Start the server**:
```bash
cd web-chatbot
npm start
```

2. **Open browser**:
```bash
open http://localhost:8080
```

3. **Click floating button** to open popup

4. **Send a query**:
   - Click an example query button, or
   - Type: "Show all tables"
   - Press Enter or click send

5. **Wait for results** to display

6. **Take screenshot**:
   - macOS: Cmd+Shift+4 → Select area
   - Windows: Win+Shift+S
   - Linux: Various tools (gnome-screenshot, etc.)

7. **Save to**: `docs/images/popup-chatbot-screenshot.png`

## Embedding in Documentation

### Markdown
```markdown
![Popup Chatbot](docs/images/popup-chatbot-screenshot.png)
```

### HTML
```html
<img src="docs/images/popup-chatbot-screenshot.png"
     alt="Popup Chatbot Interface"
     width="600">
```

### With Caption
```markdown
![Popup Chatbot](docs/images/popup-chatbot-screenshot.png)
*The popup chat widget showing query results from Adventureworks database*
```

## Additional Screenshots Recommended

Consider capturing:
1. **Closed state** - Just the floating button
2. **Disconnected state** - Red indicator, error message
3. **Complex query** - JOIN with multiple tables
4. **Mobile view** - Responsive design on phone
5. **Status modal** - Detailed system status view
6. **Login screen** - If authentication enabled
7. **Error state** - Query execution error

## Video/GIF Demo

For even better documentation, create:
- **GIF animation** showing:
  1. Click button to open
  2. Type query
  3. See results
  4. Close popup

Tools for GIF creation:
- macOS: Kap, Gifox, LICEcap
- Windows: ScreenToGif, LICEcap
- Online: ezgif.com, cloudconvert.com

Example GIF path: `docs/images/popup-demo.gif`

---

**Note**: The screenshot in this guide shows the actual implementation working with a real PostgreSQL database (Adventureworks) and demonstrates all the key features of the popup chatbot.
