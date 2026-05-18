# take-home-task-cypress

End-to-end test suite for [demoblaze.com](https://www.demoblaze.com) login and Laptop purchase features built with Cypress.

## Project structure

```
cypress/
├── e2e/                  # Test specs
├── fixtures/             # Test data (JSON)
│   ├── login-test-data.json
│   └── laptop-purchase-test-data.json
├── helpers/
│   └── api-helper.js     # API utilities (e.g. cart cleanup between tests)
└── support/
    └── commands.js       # Custom Cypress commands
```

## Setup

**Prerequisites:** Node.js v18 or higher and npm are required. The project was developed with Node.js v20.

```bash
npm install
```

The API URL is configured in `cypress.config.js`. Credentials must be passed as environment variables when running tests:

```bash
CYPRESS_username=<username> CYPRESS_password=<password> npm run cy:run
```

## Running tests

```bash
# Open Cypress UI
npm run cy:open

# Run headlessly
npm run cy:run
```

## Linting and formatting

```bash
npm run lint
npm run format
```
