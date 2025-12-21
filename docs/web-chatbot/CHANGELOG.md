# Web Chatbot Changelog

All notable changes to the PostgreSQL MCP Web Chatbot.

---

## [2.0.0] - 2025-12-18

### 🎉 Major Release: Popup Widget Edition

Complete redesign from full-page application to modern popup chat widget.

### ✨ Added

#### Popup Chat Widget
- **Floating Chat Button**
  - Fixed position in bottom-right corner (60px diameter)
  - Purple gradient design matching brand colors
  - Hover effects and smooth transitions
  - Click to open/close popup
  - Z-index 1000 ensures visibility above other elements

- **Popup Container**
  - 420x600px optimized dimensions
  - Slide-up animation (0.3s ease-out)
  - Fixed position: bottom-right with offset
  - Clean, modern design with rounded corners
  - Shadow effects for depth
  - Z-index 999 for proper stacking

- **Minimize Button**
  - Located in header next to status button
  - Clean line icon (–)
  - Closes popup smoothly
  - Matches header styling

- **Notification Badge**
  - Red circular badge on floating button
  - Shows count (currently hidden by default)
  - Ready for future notification system

#### MCP Connection Status Display
- **Status Bar Section**
  - Displays below header in popup
  - Light blue background (#f0f9ff)
  - Real-time connection information
  - Compact, non-intrusive design

- **Connection Information**
  - Shows database name
  - Shows host and port
  - Format: "Connected to [database] on [host]:[port]"
  - Example: "Connected to postgres_db on localhost:3000"

- **Visual Indicators**
  - Green dot (●) = Connected (#10b981)
  - Red dot (●) = Disconnected (#ef4444)
  - Orange dot (●) = Connecting (#f59e0b)
  - Pulsing animation for active status

- **Auto-refresh**
  - Updates every 30 seconds
  - Runs in background
  - No user interaction needed
  - Silent failure handling

#### Enhanced Server Health Endpoint
- **Improved `/health` endpoint**
  - Returns MCP server URL
  - Includes full connection details
  - Graceful degradation for partial failures
  - Returns status even if one service is down

- **Partial Status Support**
  - Shows available services even if others fail
  - Detailed error messages per service
  - HTTP 503 for degraded state
  - HTTP 200 for running state

#### JavaScript Enhancements
- **toggleChat() Function**
  - Opens/closes popup
  - Toggles active class
  - Manages state
  - Hides notification badge on open

- **updateMCPStatus() Function**
  - Fetches health data
  - Updates UI indicators
  - Handles errors gracefully
  - Formats connection string

- **State Management**
  - Added `chatOpen` boolean
  - Tracks popup open/close state
  - Persists across interactions

### 🔄 Changed

#### CSS Redesign
- **Body Styles**
  - Background changed to light gray (#f3f4f6)
  - Removed centering (for popup layout)
  - Overflow hidden for cleaner look

- **Header Styles**
  - Reduced padding (20px → 16px)
  - Smaller font sizes for compact design
  - H1: 28px → 18px
  - Subtitle: 14px → 11px
  - Optimized for popup constraints

- **Status Button**
  - Removed text, kept only icon
  - Smaller padding (10px → 6px)
  - Compact design for header

- **Chat Interface**
  - Adapted for popup dimensions
  - Optimized spacing
  - Better scroll behavior

#### HTML Structure
- **Reorganized Layout**
  - Moved floating button to top level
  - Wrapped everything in popup container
  - Added popup-container div
  - Maintained backward compatibility

- **Header Actions**
  - Added minimize button
  - Reorganized button layout
  - Improved spacing

- **MCP Info Section**
  - Added new section after header
  - Dedicated status display area
  - Clean separation from chat

#### Welcome Message
- **Simplified Text**
  - Shorter greeting: "👋 Welcome!"
  - More concise description
  - Reduced example queries (3 instead of 4)
  - Better fit for popup size

### 📚 Documentation

#### New Documentation Files
- `POPUP_CHATBOT_CHANGES.md`
  - Complete technical implementation details
  - All changes documented
  - Code examples
  - Feature breakdown

- `UPGRADE_GUIDE.md`
  - Before/after comparison
  - Migration instructions
  - Configuration options
  - Troubleshooting

- `SCREENSHOT_GUIDE.md`
  - Visual overview
  - Feature descriptions
  - Screenshot instructions
  - Embedding examples

- `CHANGELOG.md` (this file)
  - Version history
  - Detailed change log
  - Breaking changes
  - Migration notes

#### Updated Documentation
- `README.md`
  - Added v2.0 features section
  - Added screenshot
  - Linked to new documentation
  - Updated feature list

#### Project-wide Updates
- Main `README.md`
  - Added "Web Chatbot (NEW!)" section
  - Linked all chatbot documentation
  - Added to features list
  - Highlighted MCP connection status

### 🔧 Technical Changes

#### Files Modified
1. `public/index.html`
   - Added floating button
   - Added popup structure
   - Added MCP info section
   - Added minimize button

2. `public/styles.css`
   - Added `.chat-toggle-btn` styles (70 lines)
   - Added `.chat-popup` styles
   - Added `.mcp-info` styles
   - Updated header styles
   - Added animations

3. `public/app.js`
   - Added `toggleChat()` function
   - Added `updateMCPStatus()` function
   - Added state management
   - Added auto-refresh interval

4. `src/server.js`
   - Enhanced `/health` endpoint
   - Added partial status handling
   - Improved error responses
   - Added MCP server URL to response

#### New Files
- `POPUP_CHATBOT_CHANGES.md`
- `UPGRADE_GUIDE.md`
- `SCREENSHOT_GUIDE.md`
- `CHANGELOG.md`
- `docs/images/README.md`

### 📊 Statistics

- **Lines of Code Added**: ~500
- **Lines of Code Modified**: ~200
- **New Functions**: 2 (toggleChat, updateMCPStatus)
- **New CSS Classes**: 8
- **Documentation Pages**: 4 new + 2 updated
- **Breaking Changes**: 0 (fully backward compatible)

### 🎯 User Impact

#### Benefits
- ✅ Non-intrusive design - doesn't block page content
- ✅ Quick access - single click to open/close
- ✅ Connection transparency - always know MCP status
- ✅ Better multitasking - can use other pages
- ✅ Modern UX - chat-like interface
- ✅ Mobile-friendly - compact dimensions

#### Migration
- ✅ No breaking changes
- ✅ Existing functionality preserved
- ✅ Can revert to v1.0 if needed
- ✅ No data migration required

### 🐛 Bug Fixes

- Fixed status bar overlap issues
- Improved error handling for disconnected MCP
- Better responsive behavior
- Smooth animations across browsers

### ⚠️ Breaking Changes

**None** - This release is fully backward compatible.

### 📝 Migration Notes

#### From v1.0 to v2.0

**Automatic Migration:**
- Just pull latest code
- Restart server
- No configuration changes needed

**Optional Configurations:**
- Adjust popup size in `styles.css`
- Change refresh interval in `app.js`
- Customize colors and styling

### 🔜 Roadmap

#### Planned for v2.1
- Draggable popup positioning
- Resizable popup window
- Chat history persistence
- Multiple MCP server support
- Custom themes (dark mode)

#### Planned for v2.2
- Sound notifications
- Desktop notifications
- Query templates
- Saved queries
- User preferences

#### Future Considerations
- Mobile app version
- Browser extension
- Embedded widget for any website
- Multi-language support

### 🙏 Credits

**Implementation**: Syed Majid Raza
**Design Inspiration**: Modern chat widgets (Intercom, Drift, etc.)
**Technology Stack**: Express.js, Vanilla JavaScript, CSS3

### 📞 Support

For issues with v2.0:
1. Check [UPGRADE_GUIDE.md](UPGRADE_GUIDE.md)
2. Review [POPUP_CHATBOT_CHANGES.md](POPUP_CHATBOT_CHANGES.md)
3. Check browser console for errors
4. Verify all services running
5. Try v1.0 fallback if needed

---

## [1.0.0] - 2024-12-XX

### Initial Release

- Full-page web application
- Natural language to SQL conversion
- GitHub Copilot integration
- MCP server connectivity
- Real-time query results
- Optional authentication
- Status monitoring
- Basic health checks

### Features
- Express.js server
- Beautiful chat UI
- SQL syntax highlighting
- Formatted result tables
- Example queries
- Session management

---

**Format**: Follows [Keep a Changelog](https://keepachangelog.com/)
**Versioning**: [Semantic Versioning](https://semver.org/)
