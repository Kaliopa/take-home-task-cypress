# Cypress Test Suite Improvements — Design Spec

**Date:** 2026-05-18  
**Project:** take-home-task-cypress  
**Goal:** Improve test maintainability, isolation, and Cypress pattern correctness based on code review feedback.

---

## Context

The existing test suite covers login and laptop purchase flows on demoblaze.com, including happy paths, edge cases, and validation errors. The suite received feedback identifying four areas for improvement: selector organization, test isolation, Cypress API misuse, and readability/consistency.

---

## Area 1: Selector Organization

### Problem

Raw CSS/ID selectors are scattered inline across test files and `commands.js`:
- `"#login2"`, `"#logInModal"`, `"#nameofuser"`, `"#contcont"`, `".btn-success"` appear in multiple files
- A single app-side selector change requires grepping every file

### Solution

Create `cypress/support/selectors.js` with named constants grouped by page/component. All test files and `commands.js` import from this file.

### Structure

```js
// cypress/support/selectors.js
export const NAV = {
  LOGIN_BTN: "#login2",
  LOGOUT_BTN: "#logout2",
  CART_BTN: "#cartur",
  SIGNIN_BTN: "#signin2",
  USERNAME_DISPLAY: "#nameofuser",
  CATEGORIES: "#contcont",
  HOME_LOGO: "#cat",
};

export const LOGIN_MODAL = {
  MODAL: "#logInModal",
  USERNAME_INPUT: "#loginusername",
  PASSWORD_INPUT: "#loginpassword",
  SUBMIT_BTN: "#logInModal .btn-primary",
};

export const PRODUCT_PAGE = {
  TITLE: "h2",
  PRICE: "h3",
  DESCRIPTION: "#myTabContent",
  IMAGE_CAROUSEL: "#myCarousel-2",
  ADD_TO_CART_BTN: ".btn-success",
};

export const CART_PAGE = {
  ITEMS: "#tbodyid .success",
  TOTAL: "#totalp",
  DELETE_BTN: "#tbodyid",
  PLACE_ORDER_BTN: "button:contains('Place Order')",
  NEXT_PAGE_BTN: "#next2",
  PRODUCT_LIST: "#tbodyid",
};

export const ORDER_MODAL = {
  MODAL: "#orderModal",
  TOTAL: "#totalm",
  NAME_INPUT: "#name",
  COUNTRY_INPUT: "#country",
  CITY_INPUT: "#city",
  CARD_INPUT: "#card",
  MONTH_INPUT: "#month",
  YEAR_INPUT: "#year",
  SUBMIT_BTN: "#orderModal .btn-primary",
};

export const SUCCESS_MODAL = {
  CONTAINER: ".sweet-alert",
  CONTENT: ".sweet-alert p",
};
```

### Files changed
- `cypress/support/selectors.js` — new file
- `cypress/support/commands.js` — import and use selectors
- `cypress/e2e/login.cy.js` — import and use selectors
- `cypress/e2e/laptop-purchase.cy.js` — import and use selectors
- `cypress/e2e/laptop-purchase-anonymous-user.cy.js` — import and use selectors

---

## Area 2: Test Isolation

### Problem 1 — `before` vs `beforeEach`

`laptop-purchase-anonymous-user.cy.js` uses `before()` for setup. If the suite grows beyond one test, shared browser state between tests causes flakiness: a test that leaves the page mid-flow breaks the next test's starting conditions.

**Fix:** Change `before` to `beforeEach` so every test starts from a known state.

### Problem 2 — Module-level shared state

`laptop-purchase.cy.js` declares at module scope:
```js
const fullName = faker.person.fullName();
const creditCard = faker.finance.creditCardNumber();
let testData;
```

- `fullName` and `creditCard` are generated once for the entire file. All tests share the same values, creating order-dependency risk.
- `testData` is a mutable `let` set inside `beforeEach` via a `.then()` callback — this is an antipattern that relies on fixture loading completing before the test body runs.

**Fix:** Generate `fullName` and `creditCard` inside `beforeEach`. Load fixtures using the `cy.fixture().as()` alias pattern and access via `this.testData` inside `function()` tests.

```js
// Before
let testData;
beforeEach(() => {
  cy.fixture("laptop-purchase-test-data").then((data) => {
    testData = data;
    // rest of setup
  });
});

// After
beforeEach(function () {
  cy.fixture("laptop-purchase-test-data").as("testData");
  this.fullName = faker.person.fullName();
  this.creditCard = faker.finance.creditCardNumber();
  // rest of setup
});

it("User buys new Laptop", function () {
  const { testData, fullName, creditCard } = this;
  // ...
});
```

Note: `function()` (not arrow functions) is required for `this` context to work with Cypress aliases.

### Files changed
- `cypress/e2e/laptop-purchase-anonymous-user.cy.js` — `before` → `beforeEach`, fixture alias pattern, move `fullName`/`creditCard` generation inside `beforeEach`
- `cypress/e2e/laptop-purchase.cy.js` — fixture alias pattern, per-test data generation

---

## Area 3: Cypress API Misuse

### Problem 1 — Custom `cy.env()` overrides built-in

`commands.js` defines a custom `Cypress.Commands.add("env", ...)`. Since Cypress 15.10.0, `cy.env()` is an official built-in with the same array-of-keys API. The custom command overrides the built-in unnecessarily.

The project already has `allowCypressEnv: false` in `cypress.config.js`, which is the recommended migration setting.

**Fix:** Delete the custom `cy.env()` command from `commands.js`. All call sites in test files are already correct — they use the same `cy.env(['key1', 'key2']).then(...)` pattern that the built-in provides.

### Problem 2 — `fillInInputFieldViaDOM` bypasses browser input events

The current implementation:
```js
cy.get(selector).invoke("val", value).trigger("input").trigger("change");
```
This sets the DOM value directly rather than simulating real user input. It bypasses `keydown`/`keyup` events and any validation logic tied to them. The inline comment acknowledges this was a workaround for a flaky `.type()`.

The correct fix for focus issues with `.type()` is to explicitly click the element first:
```js
cy.get(selector).click().clear().type(value);
```

**Fix:** Replace `fillInInputFieldViaDOM` body with `.click().clear().type(value)` and remove the workaround comment. Remove the `fillInInputFieldViaDOM` command entirely — inline the `.click().clear().type()` pattern directly in `fillInLoginForm` and `fillInPlaceOrderModal`.

### Problem 3 — `verifySuccessPurchaseModal` uses array indices

```js
.should("have.string", fields[0])         // what is index 0?
.should("have.string", `${fields[3]}: ${card}`)  // what is index 3?
```

Array indices in assertions are fragile — reordering the fixture array silently breaks assertions — and unreadable.

**Fix:** Change `orderConfirmationFields` in the fixture from an array to a named object:
```json
// Before
"orderConfirmationFields": ["Id", "Amount", "Date", "Card Number", "Name"]

// After
"orderConfirmation": {
  "id": "Id",
  "amount": "Amount",
  "date": "Date",
  "cardNumber": "Card Number",
  "name": "Name"
}
```

Update `verifySuccessPurchaseModal` and all call sites to use named properties.

### Files changed
- `cypress/support/commands.js` — remove custom `cy.env()`, replace `fillInInputFieldViaDOM` with direct `.click().clear().type()`, update `verifySuccessPurchaseModal`
- `cypress/fixtures/laptop-purchase-test-data.json` — `orderConfirmationFields` array → named object
- `cypress/e2e/laptop-purchase.cy.js` — update `verifySuccessPurchaseModal` call sites
- `cypress/e2e/laptop-purchase-anonymous-user.cy.js` — update `verifySuccessPurchaseModal` call sites

---

## Area 4: Readability & Consistency

### Problem 1 — One test covering two scenarios

`login.cy.js` "One field submitted empty" tests two independent scenarios in one `it` block: username-only and password-only. When this test fails it's ambiguous which scenario failed.

**Fix:** Split into two separate tests:
- `"Login form submitted with password missing, verify error"`
- `"Login form submitted with username missing, verify error"`

### Problem 2 — Debug comments in committed code

Two comments should not be in the codebase:
- `// used claude to help me figure out how to insert full value in input field...` — explains past struggle, not code intent
- `cy.log(...) // logs just for visibility, would remove for production` — acknowledges it shouldn't be there

**Fix:** Remove both.

### Problem 3 — Unnecessary template literals

Test names use backtick strings with no interpolation:
```js
it(`User buys new Laptop`, () => {
```

**Fix:** Replace with regular strings where there is no `${}` interpolation.

### Problem 4 — Credentials in plain text in config

`cypress.config.js` contains:
```js
env: {
  username: "annaVdovenko",
  password: "password123!",
}
```

Committing credentials to source control is a bad habit regardless of the site's sensitivity.

**Fix:** Remove values from `cypress.config.js` and document passing them as environment variables at runtime:
```bash
CYPRESS_username=annaVdovenko CYPRESS_password=password123! npx cypress run
```
The `CYPRESS_` prefix is automatically picked up by Cypress as env values, so no config change is needed beyond removing the hardcoded values.

### Files changed
- `cypress/e2e/login.cy.js` — split test, fix string style
- `cypress/e2e/laptop-purchase.cy.js` — fix string style
- `cypress/helpers/api-helper.js` — remove debug `cy.log()` calls
- `cypress/support/commands.js` — remove workaround comment
- `cypress.config.js` — remove hardcoded credentials

---

## Summary of All Changes

| File | Changes |
|------|---------|
| `cypress/support/selectors.js` | **New file** — centralized selector constants |
| `cypress/support/commands.js` | Remove custom `cy.env()`, replace `fillInInputFieldViaDOM` with `.click().clear().type()`, import selectors, remove comments |
| `cypress/e2e/login.cy.js` | Import selectors, split two-scenario test into two tests, fix string style |
| `cypress/e2e/laptop-purchase.cy.js` | Import selectors, fixture alias pattern, per-test data generation, fix string style |
| `cypress/e2e/laptop-purchase-anonymous-user.cy.js` | Import selectors, `before` → `beforeEach`, fix string style |
| `cypress/fixtures/laptop-purchase-test-data.json` | `orderConfirmationFields` array → named `orderConfirmation` object |
| `cypress/helpers/api-helper.js` | Remove debug `cy.log()` calls |
| `cypress.config.js` | Remove hardcoded credentials |

---

## Out of Scope

- Adding new test scenarios
- Changing the application under test
- Adding TypeScript or other tooling
- Page Object Model (a selectors file is sufficient for this project size)
