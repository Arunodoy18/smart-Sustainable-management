# Contributing to Smart Waste

Thank you for your interest in contributing to Smart Waste! This document provides guidelines and information about contributing to this project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Set up the development environment** (see README.md)
4. **Create a branch** for your changes

## 📋 Development Process

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/pickup-notifications`)
- `fix/` - Bug fixes (e.g., `fix/login-error`)
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or fixes

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add password reset functionality
fix(upload): handle large file uploads correctly
docs(api): update authentication documentation
```

## 🧪 Testing

### Backend

```bash
cd apps/api
pytest --cov=src tests/
```

### Frontend

```bash
cd apps/web
npm run test
npm run test:coverage
```

## 🎨 Code Style

### Python
- Follow PEP 8
- Use type hints
- Format with `black`
- Lint with `ruff`

### TypeScript/React
- Follow ESLint rules
- Format with Prettier
- Use functional components
- Prefer hooks over class components

## 📝 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update the CHANGELOG** if applicable
5. **Request review** from maintainers

### PR Template

```markdown
## Description
[Describe your changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

## 🐛 Reporting Bugs

Please include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment details

## 💡 Feature Requests

Please include:
- Clear description of the feature
- Use case / problem it solves
- Proposed implementation (if any)
- Alternative solutions considered

## 📞 Questions?

- Open a GitHub Discussion
- Check existing issues and discussions
- Read the documentation

## 📜 Code of Conduct

Be respectful, inclusive, and professional. We're all here to build something great together.

---

Thank you for contributing! 🌿
