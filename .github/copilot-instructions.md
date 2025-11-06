# GitHub Copilot Instructions for Painel SEI

## Project Overview
Painel SEI is a browser extension designed to enhance the user experience for SEI (Sistema Eletrônico de Informações) users. This extension adds functionality and improvements to the SEI web interface.

## Technology Stack
- Browser Extension (Chrome/Firefox compatible)
- JavaScript/TypeScript
- Web APIs for browser extensions

## Coding Guidelines

### General Principles
- Write clean, maintainable, and well-documented code
- Follow modern JavaScript/TypeScript best practices
- Ensure cross-browser compatibility when developing extension features
- Keep security in mind when handling user data and permissions

### Code Style
- Use 2 spaces for indentation
- Use meaningful variable and function names (prefer Portuguese for user-facing elements, English for technical terms)
- Add comments for complex logic or non-obvious implementations
- Follow ESLint rules if configured in the project

### Browser Extension Best Practices
- Minimize permissions requested from users
- Handle asynchronous operations properly with async/await or Promises
- Use content scripts appropriately to interact with web pages
- Ensure background scripts are efficient and don't consume excessive resources
- Follow the Manifest V3 guidelines when applicable

### Testing
- Test the extension in multiple browsers if possible
- Verify that features work with different versions of the SEI system
- Test edge cases and error handling

### Security Considerations
- Never commit API keys, tokens, or sensitive credentials
- Validate and sanitize all user inputs
- Follow the principle of least privilege for extension permissions
- Be cautious when injecting scripts into web pages

### Documentation
- Update README.md when adding new features
- Document complex features and configuration options
- Keep comments up to date with code changes

## SEI-Specific Context
- The extension targets the Brazilian government's electronic information system (SEI)
- Consider the Portuguese language for user-facing text and documentation
- Be aware of the specific workflows and interfaces of the SEI system

## Contribution Workflow
1. Create feature branches for new work
2. Write meaningful commit messages in Portuguese (preferred for consistency)
3. Test thoroughly before submitting pull requests
4. Keep changes focused and atomic
