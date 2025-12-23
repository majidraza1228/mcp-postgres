# Usage Examples

This document provides practical examples of using the GitHub Copilot Agent.

## Example 1: Generate a REST API Endpoint

**Prompt to Claude Desktop:**
```
Use the generate_code tool to create a REST API endpoint in Express.js that handles user registration with email validation.
```

**Tool Call:**
```json
{
  "name": "generate_code",
  "arguments": {
    "prompt": "Create a REST API endpoint for user registration that validates email format and checks for duplicate users",
    "language": "javascript",
    "context": "Using Express.js and MongoDB"
  }
}
```

**Expected Output:**
```javascript
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate email format
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const user = new User({ email, password, name });
    await user.save();

    res.status(201).json({
      message: 'User registered successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## Example 2: Explain Complex Code

**Prompt:**
```
Use explain_code to help me understand this recursive function.
```

**Code to explain:**
```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

**Tool Call:**
```json
{
  "name": "explain_code",
  "arguments": {
    "code": "def quicksort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quicksort(left) + middle + quicksort(right)",
    "language": "python"
  }
}
```

## Example 3: Code Review

**Prompt:**
```
Review this code and suggest improvements.
```

**Code to review:**
```typescript
function fetchUserData(userId) {
  fetch('https://api.example.com/users/' + userId)
    .then(response => response.json())
    .then(data => {
      console.log(data);
      return data;
    })
    .catch(err => console.log(err));
}
```

**Tool Call:**
```json
{
  "name": "review_code",
  "arguments": {
    "code": "function fetchUserData(userId) {\n  fetch('https://api.example.com/users/' + userId)\n    .then(response => response.json())\n    .then(data => {\n      console.log(data);\n      return data;\n    })\n    .catch(err => console.log(err));\n}",
    "language": "typescript"
  }
}
```

**Expected Suggestions:**
- Add type annotations for TypeScript
- Handle HTTP errors properly
- Return the promise
- Use async/await for better readability
- Proper error handling instead of just console.log
- Validate the userId parameter

## Example 4: Fix a Bug

**Prompt:**
```
This code throws "Cannot read property 'map' of undefined". Can you fix it?
```

**Buggy Code:**
```javascript
function displayUsers(users) {
  return users.map(user => `<div>${user.name}</div>`).join('');
}
```

**Error:**
```
TypeError: Cannot read property 'map' of undefined
```

**Tool Call:**
```json
{
  "name": "fix_code",
  "arguments": {
    "code": "function displayUsers(users) {\n  return users.map(user => `<div>${user.name}</div>`).join('');\n}",
    "error": "TypeError: Cannot read property 'map' of undefined",
    "language": "javascript"
  }
}
```

**Expected Fixed Code:**
```javascript
function displayUsers(users) {
  // Check if users is defined and is an array
  if (!users || !Array.isArray(users)) {
    return '';
  }

  return users.map(user => `<div>${user.name}</div>`).join('');
}
```

## Example 5: Ask Programming Question

**Prompt:**
```
Ask Claude about the difference between SQL joins.
```

**Tool Call:**
```json
{
  "name": "ask_claude",
  "arguments": {
    "question": "What's the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and FULL OUTER JOIN in SQL?",
    "context": "I'm working with PostgreSQL and need to understand when to use each type."
  }
}
```

## Example 6: Generate Unit Tests

**Prompt:**
```
Generate unit tests for a calculator function.
```

**Tool Call:**
```json
{
  "name": "generate_code",
  "arguments": {
    "prompt": "Create unit tests using Jest for a calculator class with add, subtract, multiply, and divide methods",
    "language": "javascript",
    "context": "Calculator class already exists, just need tests"
  }
}
```

## Example 7: Refactor Code

**Prompt:**
```
Review this code and suggest a refactored version using modern JavaScript.
```

**Original Code:**
```javascript
var data = [];
for (var i = 0; i < items.length; i++) {
  if (items[i].active == true) {
    data.push(items[i].name);
  }
}
```

**Tool Call:**
```json
{
  "name": "review_code",
  "arguments": {
    "code": "var data = [];\nfor (var i = 0; i < items.length; i++) {\n  if (items[i].active == true) {\n    data.push(items[i].name);\n  }\n}",
    "language": "javascript"
  }
}
```

## Example 8: Database Query Optimization

**Prompt:**
```
Help me optimize this slow database query.
```

**Tool Call:**
```json
{
  "name": "ask_claude",
  "arguments": {
    "question": "How can I optimize this query that's running slowly?",
    "context": "SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.created_at > '2024-01-01' AND c.country = 'US' ORDER BY o.total DESC. Table has 10 million rows."
  }
}
```

## Example 9: Convert Code Between Languages

**Prompt:**
```
Convert this Python code to JavaScript.
```

**Python Code:**
```python
def calculate_average(numbers):
    if not numbers:
        return 0
    return sum(numbers) / len(numbers)
```

**Tool Call:**
```json
{
  "name": "generate_code",
  "arguments": {
    "prompt": "Convert this Python function to JavaScript",
    "language": "javascript",
    "context": "def calculate_average(numbers):\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)"
  }
}
```

## Example 10: Security Review

**Prompt:**
```
Review this code for security vulnerabilities.
```

**Code:**
```javascript
app.get('/user', (req, res) => {
  const userId = req.query.id;
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.query(query, (err, result) => {
    res.send(result);
  });
});
```

**Tool Call:**
```json
{
  "name": "review_code",
  "arguments": {
    "code": "app.get('/user', (req, res) => {\n  const userId = req.query.id;\n  const query = `SELECT * FROM users WHERE id = ${userId}`;\n  db.query(query, (err, result) => {\n    res.send(result);\n  });\n});",
    "language": "javascript"
  }
}
```

## Tips for Best Results

1. **Be Specific**: Provide clear, detailed prompts about what you want
2. **Include Context**: Add relevant information about your tech stack, framework version, etc.
3. **Show Examples**: When asking for code generation, provide examples of your coding style
4. **Ask Follow-ups**: Don't hesitate to ask for clarification or improvements
5. **Review Output**: Always review generated code before using it in production

## Integration Patterns

### Pattern 1: TDD Workflow
```
1. Use generate_code to create a function skeleton
2. Use generate_code to create unit tests
3. Run tests, get errors
4. Use fix_code to fix implementation
5. Repeat until tests pass
```

### Pattern 2: Code Review Workflow
```
1. Write your code
2. Use review_code to get feedback
3. Use ask_claude for specific questions about suggestions
4. Use generate_code to implement improvements
5. Use explain_code to document complex parts
```

### Pattern 3: Learning Workflow
```
1. Find code you don't understand
2. Use explain_code to understand it
3. Use ask_claude to ask follow-up questions
4. Use generate_code to create similar examples
5. Practice with variations
```

## Command Line Usage Examples

If you want to use the agent programmatically:

```typescript
import { ClaudeClient } from './claude-client.js';
import { TokenExtractor } from './token-extractor.js';

// Extract token
const token = TokenExtractor.extractToken();

// Create client
const client = new ClaudeClient(token);

// Generate code
const code = await client.generateCode(
  'Create a binary search function',
  'python'
);

console.log(code);
```

## Batch Processing Example

```typescript
const tasks = [
  { type: 'generate', prompt: 'Create login form', lang: 'html' },
  { type: 'generate', prompt: 'Create validation', lang: 'javascript' },
  { type: 'generate', prompt: 'Create CSS styles', lang: 'css' }
];

for (const task of tasks) {
  const result = await client.generateCode(task.prompt, task.lang);
  console.log(`\n=== ${task.prompt} ===`);
  console.log(result);
}
```
