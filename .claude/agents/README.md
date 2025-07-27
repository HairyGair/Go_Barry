# Go BARRY App Sub-Agents

This directory contains specialized AI sub-agents for the Go BARRY App project.

## Available Agents

### 1. code-reviewer
- **Purpose**: Performs thorough code reviews
- **When to use**: Automatically activated for code changes, or explicitly with "review this code"
- **Tools**: File reading, writing, and searching capabilities

### 2. debugger
- **Purpose**: Systematically finds and fixes bugs
- **When to use**: When encountering errors or unexpected behavior
- **Tools**: File manipulation and search tools for investigation

### 3. test-writer
- **Purpose**: Creates comprehensive test suites
- **When to use**: After adding new features or fixing bugs
- **Tools**: File operations for creating and updating test files

## How to Use Sub-Agents

### Automatic Usage
Claude Code will automatically delegate to these agents when:
- You ask for a code review → code-reviewer
- You report a bug or error → debugger
- You request tests → test-writer

### Explicit Usage
You can also explicitly request a specific agent:
- "Use the debugger agent to find why the login is failing"
- "Have the test-writer create tests for the new API endpoint"
- "Get the code-reviewer to check the recent changes"

## Creating New Agents

To create a new agent:

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with name, description, and tools
3. Write the system prompt in markdown below the frontmatter

Example structure:
```markdown
---
name: agent-name
description: What this agent does. Use PROACTIVELY for [scenarios].
tools: tool1, tool2, tool3
---

# Agent Name

Detailed instructions for the agent...
```

## Managing Agents

- **Edit**: Modify the `.md` files directly
- **Delete**: Remove the `.md` file
- **Disable**: Rename the file to start with underscore (e.g., `_agent-name.md`)

## Tips

1. Make descriptions clear about when to use the agent
2. Include "PROACTIVELY" or "MUST BE USED" for automatic triggering
3. Only grant necessary tools to each agent
4. Keep system prompts focused on a single responsibility
