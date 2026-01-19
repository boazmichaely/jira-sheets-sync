# Google Scripts

Collection of Google Apps Script projects for automating workflows with external systems.

## Projects

### [jira-sync](./jira-sync/)
Sync Jira issues to Google Sheets with custom prioritization and ranking capabilities.

### [support-case-pull](./support-case-pull/)
Pull Red Hat support case information from Customer Portal API into Google Sheets.

## Structure

Each project is self-contained in its own folder with:
- `src/` - Source code files
- `docs/` - Documentation
- `README.md` - Project-specific documentation
- `.gitignore` - Project-specific git ignore rules
- `token.js` or similar - Authentication tokens (not committed)

## Development

Each project has its own setup instructions. See the individual project README files for details.

## Security

- Token files are excluded from git via `.gitignore`
- Never commit actual credentials to any repository
- Each project manages its own authentication tokens
