// Configuration
const API_URL = 'http://localhost:8080/api';

// State
let isAuthenticated = false;
let chatOpen = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    autoResizeTextarea();
    updateMCPStatus();
    // Update MCP status every 30 seconds
    setInterval(updateMCPStatus, 30000);
});

// Toggle chat popup
function toggleChat() {
    const popup = document.getElementById('chatPopup');
    const badge = document.getElementById('notificationBadge');
    chatOpen = !chatOpen;

    if (chatOpen) {
        popup.classList.add('active');
        badge.style.display = 'none';
    } else {
        popup.classList.remove('active');
    }
}

// Update MCP connection status
async function updateMCPStatus() {
    const indicator = document.querySelector('.mcp-indicator');
    const statusText = document.getElementById('mcpStatusText');

    try {
        const response = await fetch('http://localhost:8080/health');
        const data = await response.json();

        if (data.status === 'running' && data.services.mcp) {
            indicator.className = 'mcp-indicator';
            const mcpInfo = data.services.mcp;
            statusText.textContent = `Connected to ${mcpInfo.config.database} on ${mcpInfo.config.host}:${mcpInfo.config.port}`;
        } else {
            indicator.className = 'mcp-indicator disconnected';
            statusText.textContent = 'MCP Server disconnected';
        }
    } catch (error) {
        indicator.className = 'mcp-indicator disconnected';
        statusText.textContent = 'Unable to connect to MCP Server';
    }
}

// Check authentication
async function checkAuth() {
    try {
        const response = await fetch(`${API_URL}/schema`);
        if (response.ok) {
            isAuthenticated = true;
            showChatInterface();
        } else if (response.status === 401) {
            showLoginScreen();
        } else {
            showChatInterface(); // Authentication disabled
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showChatInterface(); // Assume no auth
    }
}

// Show login screen
function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('chatInterface').style.display = 'none';
}

// Show chat interface
function showChatInterface() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('chatInterface').style.display = 'flex';
}

// Login
async function login(event) {
    event.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    try {
        const response = await fetch(`${API_URL.replace('/api', '')}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (data.success) {
            isAuthenticated = true;
            showChatInterface();
        } else {
            errorEl.textContent = 'Invalid credentials';
        }
    } catch (error) {
        errorEl.textContent = 'Login failed: ' + error.message;
    }
}

// Send message
async function sendMessage(event) {
    event.preventDefault();

    const input = document.getElementById('messageInput');
    const message = input.value.trim();

    if (!message) return;

    // Add user message to chat
    addMessage(message, 'user');

    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Show loading
    const loadingId = addLoadingMessage();

    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message })
        });

        const data = await response.json();

        // Remove loading
        removeLoadingMessage(loadingId);

        if (response.ok) {
            addAssistantMessage(data);
        } else {
            addErrorMessage(data.error || 'An error occurred');
        }
    } catch (error) {
        removeLoadingMessage(loadingId);
        addErrorMessage('Failed to send message: ' + error.message);
    }
}

// Send example query
function sendExample(button) {
    const message = button.textContent;
    document.getElementById('messageInput').value = message;
    document.getElementById('chatForm').dispatchEvent(new Event('submit'));
}

// Add message to chat
function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');

    // Remove welcome message if it exists
    const welcomeMsg = messagesContainer.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = text;

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add assistant message with SQL and results
function addAssistantMessage(data) {
    const messagesContainer = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    // Add SQL
    const sqlBlock = document.createElement('div');
    sqlBlock.className = 'sql-block';
    sqlBlock.textContent = data.sql;
    contentDiv.appendChild(sqlBlock);

    // Add results
    if (data.result.rows && data.result.rows.length > 0) {
        // Table results
        const table = createResultTable(data.result.rows);
        const tableDiv = document.createElement('div');
        tableDiv.className = 'result-table';
        tableDiv.appendChild(table);
        contentDiv.appendChild(tableDiv);

        const countMsg = document.createElement('div');
        countMsg.className = 'result-message';
        countMsg.textContent = `✓ ${data.result.row_count} rows returned`;
        contentDiv.appendChild(countMsg);
    } else if (data.result.status === 'success') {
        // Success message for non-query operations
        const resultMsg = document.createElement('div');
        resultMsg.className = 'result-message';
        resultMsg.textContent = `✓ ${data.result.message}`;
        contentDiv.appendChild(resultMsg);
    } else if (data.result.status === 'error') {
        // Error message
        const errorMsg = document.createElement('div');
        errorMsg.className = 'error-result';
        errorMsg.textContent = `✗ ${data.result.message}`;
        contentDiv.appendChild(errorMsg);
    }

    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Create result table
function createResultTable(rows) {
    const table = document.createElement('table');

    // Header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const columns = Object.keys(rows[0]);

    columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body
    const tbody = document.createElement('tbody');

    rows.slice(0, 50).forEach(row => {
        const tr = document.createElement('tr');

        columns.forEach(col => {
            const td = document.createElement('td');
            td.textContent = row[col] !== null ? row[col] : 'NULL';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);

    return table;
}

// Add error message
function addErrorMessage(error) {
    const messagesContainer = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-assistant';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-result';
    errorDiv.textContent = `✗ Error: ${error}`;

    contentDiv.appendChild(errorDiv);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Add loading message
function addLoadingMessage() {
    const messagesContainer = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message message-assistant';
    messageDiv.id = 'loading-message';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = '<div class="loading-dot"></div><div class="loading-dot"></div><div class="loading-dot"></div>';

    contentDiv.appendChild(loadingDiv);
    messageDiv.appendChild(contentDiv);
    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    return 'loading-message';
}

// Remove loading message
function removeLoadingMessage(id) {
    const loadingMsg = document.getElementById(id);
    if (loadingMsg) {
        loadingMsg.remove();
    }
}

// Check system status
async function checkStatus() {
    const modal = document.getElementById('statusModal');
    const content = document.getElementById('statusContent');

    content.innerHTML = '<p>Checking status...</p>';
    modal.style.display = 'block';

    try {
        const response = await fetch('http://localhost:8080/health');
        const data = await response.json();

        let html = '';

        if (data.status === 'running') {
            html += `
                <div class="status-item status-running">
                    <h3>✓ Web Server</h3>
                    <p>Status: Running</p>
                </div>
            `;

            if (data.services.copilot) {
                html += `
                    <div class="status-item status-running">
                        <h3>✓ GitHub Copilot Proxy</h3>
                        <p>Status: ${data.services.copilot.status}</p>
                        <p>Service: ${data.services.copilot.service}</p>
                    </div>
                `;
            }

            if (data.services.mcp) {
                html += `
                    <div class="status-item status-running">
                        <h3>✓ MCP Server</h3>
                        <p>Status: ${data.services.mcp.status}</p>
                        <p>Database: ${data.services.mcp.database}</p>
                        <p>Host: ${data.services.mcp.config.host}:${data.services.mcp.config.port}</p>
                        <p>Database: ${data.services.mcp.config.database}</p>
                    </div>
                `;
            }
        } else {
            html = `
                <div class="status-item status-error">
                    <h3>✗ System Error</h3>
                    <p>${data.error}</p>
                </div>
            `;
        }

        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `
            <div class="status-item status-error">
                <h3>✗ Connection Failed</h3>
                <p>${error.message}</p>
                <p>Make sure all servers are running:</p>
                <ul>
                    <li>VS Code with PostgreSQL MCP extension</li>
                    <li>MCP Server (port 3000)</li>
                    <li>Web Chatbot Server (port 8080)</li>
                </ul>
            </div>
        `;
    }
}

// Close modal
function closeModal() {
    document.getElementById('statusModal').style.display = 'none';
}

// Auto-resize textarea
function autoResizeTextarea() {
    const textarea = document.getElementById('messageInput');

    textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}

// Handle Enter key
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        document.getElementById('chatForm').dispatchEvent(new Event('submit'));
    }
}
