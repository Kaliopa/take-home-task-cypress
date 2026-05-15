# take-home-task-cypress

End-to-end test suite for [demoblaze.com](https://www.demoblaze.com) built with Cypress.

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

```bash
npm install
```

Credentials and API URL are configured in `cypress.config.js` under `env`.

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

## Testing approach

# Login

To test login I checked manually which error messages can be triggered and added one positive scenario and then negative scenario per alert with error message. Also I reused login components for laptop purchase tests.

# Laptop purchase

I started with a big e2e scenario to cover main flow of user buying laptop.
It includes:

- login
- search for Laptop
- opening page with Laptop details
- verification of required data on the page (as a user it's important for me to have image, price and specification of the device I want to buy)
- opening cart and checking information again (user usually check again price and model before pressing purchase button)
- filling in all details for purchase form
- verifying successful purchase
  While I was working on this test, cart for my user got overcrowded because I triggered unfinished test a lot. Since it was important for me to have only one item in cart for test I added very simplified clean up via api, just in case if test fails for any reason and leave additional item in cart. It just checks if cart is empty, if not it deleted item by item. It helped me to avoid deleting all those laptops from the cart manually or switching user.

When main flow was ready I added tests that cover other important parts of the flow: pagination for laptop list, deletion from the cart, submitting empty purchase form, submitting purchase form with minimal details.

## AI disclosure

I used claude in several cases:

- to fill in username and in login form and name in purchase modal. I tried figuring out this part by myself first but all my experiments with .type() ended up with incomplete input, it was 3 characters from username at the beginning. When I added .click().type() it started to pass but was flaky from time to time, so I asked AI and I'm not really happy with solution but it works, maybe when I practice working with Cypress more I can find better option.
- when I was done with first e2e scenario for laptop purchase I had hardcoded variables at the beginning of test file that were later used in test. I wanted to move them in fixture cypress/fixtures/laptop-purchase-test-data.json so I created a file and asked claude to do it, it's simple repetitive actions, just time saver.
- I asked claude to generate draft of README, so Project structure, Setup, Running tests, Linting and formatting parts are written by it, I checked them and agree with result.

I used a lot of cypress documentation from https://docs.cypress.io/ since it's my first time working with it. I tried to keep AI usage to minimum to learn.
