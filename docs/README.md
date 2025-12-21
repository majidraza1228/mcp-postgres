# PostgreSQL MCP Project Documentation

Complete documentation for the PostgreSQL Model Context Protocol (MCP) server and related components.

---

## 📚 Documentation Structure

This repository contains documentation organized by component:

### **Root Documentation**
- [Main README](../README.md) - Project overview and quick start

### **Component Documentation**

#### 🔧 **Core Server Documentation**
Located in `/docs/`:

**Getting Started**
- [QUICK_START.md](QUICK_START.md) - Quick start guide
- [DEVELOPER_QUICK_START.md](DEVELOPER_QUICK_START.md) - Developer onboarding
- [EXAMPLES.md](EXAMPLES.md) - Usage examples
- [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) - Detailed usage patterns

**Architecture & Design**
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture overview
- [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) - Project organization
- [STRUCTURE.md](STRUCTURE.md) - Code structure
- [MCP_FASTAPI_IMPLEMENTATION_GUIDE.md](MCP_FASTAPI_IMPLEMENTATION_GUIDE.md) - FastAPI + MCP implementation

**Implementation Guides**
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Core implementation summary
- [IMPLEMENTATION_SUMMARY_ROOT.md](IMPLEMENTATION_SUMMARY_ROOT.md) - Root-level implementation details
- [FASTAPI_MCP_LIBRARY_COMPARISON.md](FASTAPI_MCP_LIBRARY_COMPARISON.md) - Library comparison analysis
- [MODEL_SELECTION_ANALYSIS.md](MODEL_SELECTION_ANALYSIS.md) - AI model selection guide

**Database & SQL**
- [DDL_EXAMPLES.md](DDL_EXAMPLES.md) - DDL operation examples
- [DATABASE_DEVELOPMENT_IMPROVEMENTS.md](DATABASE_DEVELOPMENT_IMPROVEMENTS.md) - Database development best practices
- [SQL_DETECTION_ANALYSIS.md](SQL_DETECTION_ANALYSIS.md) - SQL detection implementation
- [SQL_DETECTION_TEST_CASES.md](SQL_DETECTION_TEST_CASES.md) - SQL detection test coverage
- [COMPREHENSIVE_SQL_DETECTION_UPDATE.md](COMPREHENSIVE_SQL_DETECTION_UPDATE.md) - Enhanced SQL detection

**Testing**
- [TESTING.md](TESTING.md) - Testing overview
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Detailed testing guide

**Deployment & Distribution**
- [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md) - Package distribution
- [REGISTRY_PUBLISHING_GUIDE.md](REGISTRY_PUBLISHING_GUIDE.md) - NPM registry publishing
- [LOCAL_REGISTRY_SETUP.md](LOCAL_REGISTRY_SETUP.md) - Local registry configuration

**AI Integration**
- [AI_PROVIDER_OPTIONS.md](AI_PROVIDER_OPTIONS.md) - AI provider comparison
- [LLM_ENHANCED_GUIDE.md](LLM_ENHANCED_GUIDE.md) - LLM integration guide
- [IMPROVED_WITH_LLM.md](IMPROVED_WITH_LLM.md) - LLM improvements

**Reference**
- [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Quick command reference
- [QUICK_UPDATE_INSTRUCTIONS.md](QUICK_UPDATE_INSTRUCTIONS.md) - Update procedures
- [INDEX.md](INDEX.md) - Documentation index

**Project Management**
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview
- [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
- [SCREENSHOT_INSTRUCTIONS.md](SCREENSHOT_INSTRUCTIONS.md) - Screenshot documentation

---

#### 🌐 **Web Chatbot Documentation**
Located in `/docs/web-chatbot/`:

- [README.md](web-chatbot/README.md) - Web chatbot documentation index
- [TECHNICAL_ARCHITECTURE_EXPLAINED.md](web-chatbot/TECHNICAL_ARCHITECTURE_EXPLAINED.md) - **Technical deep dive** (675 lines)
- [FINAL_STATE.md](web-chatbot/FINAL_STATE.md) - Production state
- [AZURE_OPENAI_SETUP.md](web-chatbot/AZURE_OPENAI_SETUP.md) - Azure OpenAI setup
- [CHANGELOG.md](web-chatbot/CHANGELOG.md) - Version history
- [CLEANUP_SUMMARY.md](web-chatbot/CLEANUP_SUMMARY.md) - Codebase cleanup
- [POPUP_CHATBOT_CHANGES.md](web-chatbot/POPUP_CHATBOT_CHANGES.md) - Popup features
- [SCREENSHOT_GUIDE.md](web-chatbot/SCREENSHOT_GUIDE.md) - Visual guide
- [UPGRADE_GUIDE.md](web-chatbot/UPGRADE_GUIDE.md) - Migration guide

**Web Chatbot AI Providers**
- [WEB_CHATBOT_AI_PROVIDERS.md](WEB_CHATBOT_AI_PROVIDERS.md) - AI provider integration
- [WEB_CHATBOT_GUIDE.md](WEB_CHATBOT_GUIDE.md) - Complete guide
- [WEB_CHATBOT_SUMMARY.md](WEB_CHATBOT_SUMMARY.md) - Feature summary

**Microsoft Teams Integration**
- [TEAMS_INTEGRATION_PLAN.md](TEAMS_INTEGRATION_PLAN.md) - Teams integration planning
- [TEAMS_INTEGRATION_README.md](TEAMS_INTEGRATION_README.md) - Teams integration guide
- [USING_AZURE_OPENAI.md](USING_AZURE_OPENAI.md) - Azure OpenAI usage

---

#### 💻 **VS Code Extension Documentation**
Located in `/docs/vscode-extension/`:

- [ARCHITECTURE_INLINE_MODE.md](vscode-extension/ARCHITECTURE_INLINE_MODE.md) - Inline mode architecture
- [INLINE_MODE_GUIDE.md](vscode-extension/INLINE_MODE_GUIDE.md) - Complete guide
- [INLINE_MODE_QUICKSTART.md](vscode-extension/INLINE_MODE_QUICKSTART.md) - Quick start
- [INLINE_MODE_CHEATSHEET.md](vscode-extension/INLINE_MODE_CHEATSHEET.md) - Quick reference
- [INLINE_MODE_IMPLEMENTATION_SUMMARY.md](INLINE_MODE_IMPLEMENTATION_SUMMARY.md) - Implementation details

---

#### 📷 **Images & Diagrams**
Located in `/docs/images/`:

- [README.md](images/README.md) - Image documentation
- `provider-llm.png` - AI provider architecture diagram
- `provider-llm-diagram.svg` - SVG source for architecture diagram
- `popup-chatbot-screenshot.png` - Web chatbot screenshot

---

## 🎯 Quick Navigation by Role

### **For Developers**
1. [QUICK_START.md](QUICK_START.md) - Get started quickly
2. [DEVELOPER_QUICK_START.md](DEVELOPER_QUICK_START.md) - Developer setup
3. [ARCHITECTURE.md](ARCHITECTURE.md) - Understand the architecture
4. [EXAMPLES.md](EXAMPLES.md) - See code examples
5. [TESTING_GUIDE.md](TESTING_GUIDE.md) - Run tests

### **For Web Chatbot Users**
1. [web-chatbot/README.md](web-chatbot/README.md) - Web chatbot overview
2. [web-chatbot/TECHNICAL_ARCHITECTURE_EXPLAINED.md](web-chatbot/TECHNICAL_ARCHITECTURE_EXPLAINED.md) - Technical details
3. [WEB_CHATBOT_GUIDE.md](WEB_CHATBOT_GUIDE.md) - Complete guide

### **For VS Code Extension Users**
1. [vscode-extension/INLINE_MODE_QUICKSTART.md](vscode-extension/INLINE_MODE_QUICKSTART.md) - Quick start
2. [vscode-extension/INLINE_MODE_GUIDE.md](vscode-extension/INLINE_MODE_GUIDE.md) - Complete guide
3. [vscode-extension/INLINE_MODE_CHEATSHEET.md](vscode-extension/INLINE_MODE_CHEATSHEET.md) - Commands

### **For DevOps/Deployment**
1. [DISTRIBUTION_GUIDE.md](DISTRIBUTION_GUIDE.md) - Package distribution
2. [REGISTRY_PUBLISHING_GUIDE.md](REGISTRY_PUBLISHING_GUIDE.md) - Publishing
3. [LOCAL_REGISTRY_SETUP.md](LOCAL_REGISTRY_SETUP.md) - Local setup

### **For Contributors**
1. [CONTRIBUTING.md](CONTRIBUTING.md) - Contribution guidelines
2. [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) - Project organization
3. [TESTING.md](TESTING.md) - Testing requirements

---

## 📊 Documentation Statistics

- **Total Documentation Files**: 65+ markdown files
- **Web Chatbot Docs**: 17 files
- **VS Code Extension Docs**: 5 files
- **Core Server Docs**: 40+ files
- **Images & Diagrams**: Architecture diagrams and screenshots

---

## 🔄 Recent Updates

**December 21, 2024**:
- Reorganized all documentation into `/docs` folder
- Created component-specific subdirectories (`web-chatbot/`, `vscode-extension/`, `images/`)
- Added comprehensive documentation index
- Updated all cross-references
- Moved all root-level .md files (except main README) to docs/

---

## 🤝 Contributing to Documentation

When adding new documentation:
1. Place files in appropriate `/docs` subdirectory:
   - Core server docs: `/docs/`
   - Web chatbot docs: `/docs/web-chatbot/`
   - VS Code extension docs: `/docs/vscode-extension/`
   - Images: `/docs/images/`
2. Update this README.md with the new file
3. Update component-specific README files
4. Use clear headings and consistent formatting
5. Include code examples where relevant

---

## 📝 Documentation Standards

- Use Markdown format
- Include table of contents for long documents
- Add diagrams and screenshots where helpful
- Keep examples up-to-date
- Cross-reference related documents
- Update version history in CHANGELOG files

---

**Last Updated**: December 21, 2024
**Maintained by**: PostgreSQL MCP Team
