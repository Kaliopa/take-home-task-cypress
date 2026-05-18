# Cypress Test Suite Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve the Cypress test suite's maintainability, isolation, and Cypress pattern correctness across 8 files.

**Architecture:** Introduce a centralized `selectors.js` file as the single source of truth for all DOM selectors; refactor test setup to use `cy.fixture().as()` aliases and per-test data generation; remove custom command overrides and DOM-bypass workarounds in favor of idiomatic Cypress APIs.

**Tech Stack:** Cypress 15.x, @faker-js/faker, ESLint

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `cypress/support/selectors.js` | **Create** | Centralized selector constants grouped by page |
| `cypress/support/commands.js` | Modify | Remove custom `cy.env()`, replace `fillInInputFieldViaDOM` with `.click().clear().type()`, import selectors, update `verifySuccessPurchaseModal` signature, remove comments |
| `cypress/fixtures/laptop-purchase-test-data.json` | Modify | Replace `orderConfirmationFields` array with named `orderConfirmation` object |
| `cypress/e2e/login.cy.js` | Modify | Import selectors, split two-scenario test into two, fix string style |
| `cypress/e2e/laptop-purchase.cy.js` | Modify | Import selectors, `cy.fixture().as()` pattern, per-test data generation, fix string style, update `verifySuccessPurchaseModal` call |
| `cypress/e2e/laptop-purchase-anonymous-user.cy.js` | Modify | Import selectors, `before` → `beforeEach`, `cy.fixture().as()` pattern, move faker calls, update `verifySuccessPurchaseModal` call |
| `cypress/helpers/api-helper.js` | Modify | Remove debug `cy.log()` calls |
| `cypress.config.js` | Modify | Remove hardcoded credentials |

---

## Task 1: Create cypress/support/selectors.js

**Files:**
- Create: `cypress/support/selectors.js`

- [ ] **Step 1: Create the selectors file**

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
  TABLE_BODY: "#tbodyid",
  TOTAL: "#totalp",
  NEXT_PAGE_BTN: "#next2",
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

- [ ] **Step 2: Lint the new file**

Run: `npm run lint -- cypress/support/selectors.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/support/selectors.js
git commit -m "feat: add centralized selectors file"
```

---

## Task 2: Update cypress/support/commands.js

**Files:**
- Modify: `cypress/support/commands.js`

Changes in this task:
- Import selectors
- Remove custom `cy.env()` command (now a built-in in Cypress 15.10+)
- Remove `fillInInputFieldViaDOM` command — inline `.click().clear().type()` in `fillInLoginForm` and `fillInPlaceOrderModal`
- Update `verifySuccessPurchaseModal` to use named `orderConfirmation` object instead of `fields` array
- Remove workaround comment
- Use selectors throughout

- [ ] **Step 1: Replace the full contents of commands.js**

```js
import { NAV, LOGIN_MODAL, ORDER_MODAL, SUCCESS_MODAL } from "./selectors";

Cypress.Commands.add("login", (username, password) => {
  cy.session(username, () => {
    cy.visit("/");
    cy.get(NAV.LOGIN_BTN).click();
    cy.get(LOGIN_MODAL.MODAL).should("have.class", "show");
    cy.fillInLoginForm(username, password);
    cy.get("button").contains("Log in").click();
    cy.get(LOGIN_MODAL.MODAL).should("not.have.class", "show");
  });
});

Cypress.Commands.add("fillInLoginForm", (username, password) => {
  if (username) cy.get(LOGIN_MODAL.USERNAME_INPUT).click().clear().type(username);
  else cy.get(LOGIN_MODAL.USERNAME_INPUT).clear();
  if (password) cy.get(LOGIN_MODAL.PASSWORD_INPUT).click().clear().type(password);
  else cy.get(LOGIN_MODAL.PASSWORD_INPUT).clear();
});

Cypress.Commands.add("logout", () => {
  cy.get(NAV.LOGOUT_BTN).click();
  cy.get(NAV.SIGNIN_BTN).should("be.visible");
});

Cypress.Commands.add("clickElementAndVerifyAlert", (element, alertText) => {
  cy.window().then((win) => {
    cy.stub(win, "alert").as("alertStub");
  });
  cy.get(element).should("be.visible").click();
  cy.get("@alertStub").should("have.been.calledOnceWith", alertText);
});

Cypress.Commands.add(
  "fillInPlaceOrderModal",
  ({ name, country, city, card, month, year } = {}) => {
    if (name) cy.get(ORDER_MODAL.NAME_INPUT).click().clear().type(name);
    if (country) cy.get(ORDER_MODAL.COUNTRY_INPUT).click().type(country);
    if (city) cy.get(ORDER_MODAL.CITY_INPUT).type(city);
    if (card) cy.get(ORDER_MODAL.CARD_INPUT).type(card);
    if (month) cy.get(ORDER_MODAL.MONTH_INPUT).type(month);
    if (year) cy.get(ORDER_MODAL.YEAR_INPUT).type(year);
  },
);

Cypress.Commands.add(
  "verifySuccessPurchaseModal",
  ({ title, orderConfirmation, name, price, card } = {}) => {
    cy.get(SUCCESS_MODAL.CONTAINER).should("have.class", "visible").contains(title);
    cy.get(SUCCESS_MODAL.CONTENT)
      .invoke("text")
      .should("have.string", orderConfirmation.id)
      .should("have.string", orderConfirmation.date)
      .should("have.string", `${orderConfirmation.cardNumber}: ${card}`)
      .should("have.string", `${orderConfirmation.amount}: ${price}`)
      .should("have.string", `${orderConfirmation.name}: ${name}`);
  },
);
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress/support/commands.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/support/commands.js
git commit -m "refactor: update commands to use selectors and idiomatic Cypress patterns"
```

---

## Task 3: Update cypress/fixtures/laptop-purchase-test-data.json

**Files:**
- Modify: `cypress/fixtures/laptop-purchase-test-data.json`

Replace `orderConfirmationFields` array with a named `orderConfirmation` object so assertions reference fields by name instead of index.

- [ ] **Step 1: Replace the full contents of the fixture**

```json
{
  "laptopModel": "MacBook air",
  "laptopPrice": "700",
  "includeTaxString": "*includes tax",
  "descriptionSubtitle": "Product description",
  "alertTextOnAddToCart": "Product added.",
  "alertTextOnAddToCartAnonymous": "Product added",
  "cardExpirationMonth": "12",
  "cardExpirationYear": "2030",
  "purchaseSuccessTitle": "Thank you for your purchase!",
  "orderConfirmation": {
    "id": "Id",
    "amount": "Amount",
    "date": "Date",
    "cardNumber": "Card Number",
    "name": "Name"
  },
  "cheapestLaptopModel": "ASUS Full HD",
  "cheapestLaptopPrice": "230",
  "emptyOrderForm.ErrorMessage": "Please fill out Name and Creditcard."
}
```

- [ ] **Step 2: Commit**

```bash
git add cypress/fixtures/laptop-purchase-test-data.json
git commit -m "refactor: replace orderConfirmationFields array with named orderConfirmation object"
```

---

## Task 4: Update cypress/e2e/login.cy.js

**Files:**
- Modify: `cypress/e2e/login.cy.js`

Changes:
- Import selectors, replace raw strings
- Split "One field submitted empty" into two focused tests — one per scenario
- Fix template literal test names to use regular strings
- Remove `cy.get("@alertStub").invoke("resetHistory")` call (no longer needed with separate tests)

- [ ] **Step 1: Replace the full contents of login.cy.js**

```js
import { faker } from "@faker-js/faker";
import { NAV, LOGIN_MODAL } from "../support/selectors";

describe("Login", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get(NAV.LOGIN_BTN).click();
    cy.get(LOGIN_MODAL.MODAL).should("have.class", "show");
  });

  it("Existing user successfully logs in", () => {
    cy.env(["username", "password"]).then(({ username, password }) => {
      cy.fillInLoginForm(username, password);
      cy.get("button").contains("Log in").click();
      cy.get(LOGIN_MODAL.MODAL).should("not.have.class", "show");
      cy.visit("/");
      cy.get(NAV.USERNAME_DISPLAY)
        .should("be.visible")
        .invoke("text")
        .should("have.string", username);
      cy.logout();
    });
  });

  it("Login form is submitted empty, verify error message", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.clickElementAndVerifyAlert(
        LOGIN_MODAL.SUBMIT_BTN,
        loginData["emptyLoginForm.ErrorMessage"],
      );
    });
  });

  it("Login form submitted with password missing, verify error", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.fillInLoginForm("username", "");
      cy.clickElementAndVerifyAlert(
        LOGIN_MODAL.SUBMIT_BTN,
        loginData["emptyLoginForm.ErrorMessage"],
      );
    });
  });

  it("Login form submitted with username missing, verify error", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.fillInLoginForm("", "password");
      cy.clickElementAndVerifyAlert(
        LOGIN_MODAL.SUBMIT_BTN,
        loginData["emptyLoginForm.ErrorMessage"],
      );
    });
  });

  it("Non existent user tries to login and gets error", () => {
    const wrongUser = `${faker.person.firstName()}-non-existent-user`;
    cy.fixture("login-test-data").then((loginData) => {
      cy.fillInLoginForm(wrongUser, "password");
      cy.clickElementAndVerifyAlert(
        LOGIN_MODAL.SUBMIT_BTN,
        loginData["nonExistentUser.ErrorMessage"],
      );
    });
  });

  it("User tries to login with incorrect password and gets error", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.env(["username"]).then(({ username }) => {
        cy.fillInLoginForm(username, "password");
        cy.clickElementAndVerifyAlert(
          LOGIN_MODAL.SUBMIT_BTN,
          loginData["wrongPassword.ErrorMessage"],
        );
      });
    });
  });
});
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress/e2e/login.cy.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/login.cy.js
git commit -m "refactor: use selectors, split empty-field test into two focused tests"
```

---

## Task 5: Update cypress/e2e/laptop-purchase.cy.js

**Files:**
- Modify: `cypress/e2e/laptop-purchase.cy.js`

Changes:
- Import selectors, replace all raw strings
- Switch `beforeEach` from arrow function to `function()` to enable `this` context
- Load fixture via `cy.fixture().as("testData")` alias; access via `this.testData` in tests
- Generate `fullName` and `creditCard` inside `beforeEach` (via `this`) instead of at module level
- Update `getLaptopPrice` to accept `includeTaxString` as a parameter instead of reading from outer scope
- Convert all `it()` arrow functions to `function()` to access `this` aliases
- Update `verifySuccessPurchaseModal` call to pass `orderConfirmation` instead of `fields`
- Use selectors throughout
- Fix template literal test names

- [ ] **Step 1: Replace the full contents of laptop-purchase.cy.js**

```js
import { faker } from "@faker-js/faker";
import { clearCartIfNeeded } from "../helpers/api-helper";
import { NAV, PRODUCT_PAGE, CART_PAGE, ORDER_MODAL } from "../support/selectors";

function getLaptopPrice(priceString, includeTaxString) {
  const priceStart = priceString.indexOf("$") + 1;
  const priceEnd = priceString.indexOf(includeTaxString) - 1;
  return priceString.slice(priceStart, priceEnd);
}

describe("Laptop purchase", () => {
  beforeEach(function () {
    cy.fixture("laptop-purchase-test-data").as("testData");
    this.fullName = faker.person.fullName();
    this.creditCard = faker.finance.creditCardNumber();

    cy.env(["username", "password"]).then(({ username, password }) => {
      cy.login(username, password);
    });
    cy.visit("/");
    cy.get(NAV.USERNAME_DISPLAY).should("be.visible");
    cy.then(() => clearCartIfNeeded());
    cy.get(NAV.CATEGORIES).contains("Laptop").click();
  });

  it("User buys new Laptop", function () {
    const { testData, fullName, creditCard } = this;

    cy.contains(testData.laptopModel).click();
    cy.get(PRODUCT_PAGE.TITLE).invoke("text").should("have.string", testData.laptopModel);

    let priceString = "";
    let laptopPrice = "";
    cy.get(PRODUCT_PAGE.PRICE)
      .contains("$")
      .then(($text) => {
        priceString = $text.text();
      });
    cy.then(() => {
      laptopPrice = getLaptopPrice(priceString, testData.includeTaxString);

      cy.get(PRODUCT_PAGE.DESCRIPTION).then(($description) => {
        expect($description.text()).contains(testData.descriptionSubtitle);
        expect($description.text().length).greaterThan(50);
      });
      cy.get(PRODUCT_PAGE.IMAGE_CAROUSEL).should("be.visible");

      cy.clickElementAndVerifyAlert(
        PRODUCT_PAGE.ADD_TO_CART_BTN,
        testData.alertTextOnAddToCart,
      );

      cy.get(NAV.CART_BTN).click();
      cy.get(CART_PAGE.ITEMS).then((matchingElements) => {
        expect(matchingElements.text())
          .contains(laptopPrice)
          .contains(testData.laptopModel);
        expect(matchingElements.length).eql(1);
      });
      cy.get(CART_PAGE.TOTAL).invoke("text").should("have.string", laptopPrice);

      cy.get("button").contains("Place Order").click();
      cy.get(ORDER_MODAL.MODAL).should("have.class", "show");

      cy.get(ORDER_MODAL.TOTAL).invoke("text").should("have.string", laptopPrice);
      cy.fillInPlaceOrderModal({
        name: fullName,
        country: faker.location.country(),
        city: faker.location.city(),
        card: creditCard,
        month: testData.cardExpirationMonth,
        year: testData.cardExpirationYear,
      });

      cy.get("button").contains("Purchase").click();
      cy.verifySuccessPurchaseModal({
        title: testData.purchaseSuccessTitle,
        orderConfirmation: testData.orderConfirmation,
        name: fullName,
        card: creditCard,
        price: laptopPrice,
      });
      cy.get("button").contains("OK").click();
      cy.get(NAV.HOME_LOGO).should("be.visible");
    });
  });

  it("User selects laptop on second page, then changes his mind and removes it from the cart", function () {
    const { testData } = this;

    cy.get(CART_PAGE.TABLE_BODY).should("be.visible");
    cy.get(CART_PAGE.NEXT_PAGE_BTN).should("be.visible").click();
    cy.get(CART_PAGE.NEXT_PAGE_BTN).should("be.hidden");
    cy.contains(testData.cheapestLaptopModel).click();
    cy.get(PRODUCT_PAGE.TITLE)
      .invoke("text")
      .should("have.string", testData.cheapestLaptopModel);

    cy.clickElementAndVerifyAlert(
      PRODUCT_PAGE.ADD_TO_CART_BTN,
      testData.alertTextOnAddToCart,
    );
    cy.get(NAV.CART_BTN).click();
    cy.get(CART_PAGE.TOTAL)
      .invoke("text")
      .should("have.string", testData.cheapestLaptopPrice);
    cy.get(CART_PAGE.TABLE_BODY).contains("Delete").click();
    cy.get(CART_PAGE.TOTAL).invoke("text").should("have.string", "");
  });

  it("Verify error if user submits Place Order modal empty, fill in required fields and verify success modal", function () {
    const { testData, fullName, creditCard } = this;

    cy.get(NAV.CART_BTN).click();
    cy.get(CART_PAGE.TOTAL).invoke("text").should("have.string", "");

    cy.get("button").contains("Place Order").click();
    cy.get(ORDER_MODAL.MODAL).should("have.class", "show");
    cy.clickElementAndVerifyAlert(
      ORDER_MODAL.SUBMIT_BTN,
      testData["emptyOrderForm.ErrorMessage"],
    );

    cy.fillInPlaceOrderModal({ name: fullName, card: creditCard });

    cy.get("button").contains("Purchase").click();
    cy.verifySuccessPurchaseModal({
      title: testData.purchaseSuccessTitle,
      orderConfirmation: testData.orderConfirmation,
      name: fullName,
      price: "0",
      card: creditCard,
    });
    cy.get("button").contains("OK").click();
    cy.get(NAV.HOME_LOGO).should("be.visible");
  });

  afterEach(() => {
    cy.logout();
  });
});
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress/e2e/laptop-purchase.cy.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/laptop-purchase.cy.js
git commit -m "refactor: fixture alias pattern, per-test data generation, use selectors"
```

---

## Task 6: Update cypress/e2e/laptop-purchase-anonymous-user.cy.js

**Files:**
- Modify: `cypress/e2e/laptop-purchase-anonymous-user.cy.js`

Changes:
- Import selectors, replace raw strings
- Change `before` to `beforeEach` for proper test isolation
- Load fixture via `cy.fixture().as("testData")` alias
- Move `fullName` and `creditCard` generation inside `beforeEach` via `this`
- Convert `it()` to `function()` to access `this` aliases
- Update `verifySuccessPurchaseModal` call to pass `orderConfirmation`
- Fix template literal test name

- [ ] **Step 1: Replace the full contents of laptop-purchase-anonymous-user.cy.js**

```js
import { faker } from "@faker-js/faker";
import { NAV, PRODUCT_PAGE, CART_PAGE, ORDER_MODAL } from "../support/selectors";

describe("Laptop purchase without login", () => {
  beforeEach(function () {
    cy.fixture("laptop-purchase-test-data").as("testData");
    this.fullName = faker.person.fullName();
    this.creditCard = faker.finance.creditCardNumber();
    cy.visit("/");
    cy.get(NAV.CATEGORIES).contains("Laptop").click();
  });

  it("Anonymous user buys new Laptop", function () {
    const { testData, fullName, creditCard } = this;

    cy.contains(testData.laptopModel).click();
    cy.get(PRODUCT_PAGE.TITLE).invoke("text").should("have.string", testData.laptopModel);

    cy.clickElementAndVerifyAlert(
      PRODUCT_PAGE.ADD_TO_CART_BTN,
      testData.alertTextOnAddToCartAnonymous,
    );

    cy.get(NAV.CART_BTN).click();
    cy.get(CART_PAGE.ITEMS).then((matchingElements) => {
      expect(matchingElements.text())
        .contains(testData.laptopPrice)
        .contains(testData.laptopModel);
    });
    cy.get(CART_PAGE.TOTAL)
      .invoke("text")
      .should("have.string", testData.laptopPrice);

    cy.get("button").contains("Place Order").click();
    cy.get(ORDER_MODAL.MODAL).should("have.class", "show");

    cy.get(ORDER_MODAL.TOTAL)
      .invoke("text")
      .should("have.string", testData.laptopPrice);
    cy.fillInPlaceOrderModal({
      name: fullName,
      card: creditCard,
    });

    cy.get("button").contains("Purchase").click();
    cy.verifySuccessPurchaseModal({
      title: testData.purchaseSuccessTitle,
      orderConfirmation: testData.orderConfirmation,
      name: fullName,
      price: testData.laptopPrice,
      card: creditCard,
    });
    cy.get("button").contains("OK").click();
    cy.get(NAV.HOME_LOGO).should("be.visible");
  });
});
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress/e2e/laptop-purchase-anonymous-user.cy.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/e2e/laptop-purchase-anonymous-user.cy.js
git commit -m "refactor: before to beforeEach, fixture alias pattern, use selectors"
```

---

## Task 7: Update cypress/helpers/api-helper.js

**Files:**
- Modify: `cypress/helpers/api-helper.js`

Remove the two `cy.log()` debug calls.

- [ ] **Step 1: Replace the full contents of api-helper.js**

```js
export function clearCartIfNeeded() {
  cy.getCookie("tokenp_")
    .should("exist")
    .then((cookie) => {
      cy.env(["apiUrl"]).then(({ apiUrl }) => {
        cy.request({
          method: "POST",
          url: `${apiUrl}/viewcart`,
          body: { cookie: cookie.value, flag: true },
        }).then((response) => {
          expect(response.status).to.equal(200);
          const items = response.body.Items ?? [];
          items.forEach((item) => {
            cy.request({
              method: "POST",
              url: `${apiUrl}/deleteitem`,
              body: { id: item.id },
            }).then((deleteResponse) => {
              expect(deleteResponse.status).to.equal(200);
            });
          });
        });
      });
    });
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress/helpers/api-helper.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress/helpers/api-helper.js
git commit -m "chore: remove debug cy.log calls from api-helper"
```

---

## Task 8: Remove hardcoded credentials from cypress.config.js

**Files:**
- Modify: `cypress.config.js`

Remove `username` and `password` from the `env` block. The `apiUrl` stays since it is not a secret. Tests will read credentials from environment variables prefixed with `CYPRESS_` (Cypress picks these up automatically).

- [ ] **Step 1: Replace the full contents of cypress.config.js**

```js
const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://www.demoblaze.com/",
    env: {
      apiUrl: "https://api.demoblaze.com",
    },
    viewportHeight: 1600,
    viewportWidth: 1200,
    allowCypressEnv: false,
    retries: {
      runMode: 3,
      openMode: 0,
    },
  },
});
```

To run tests, pass credentials as environment variables:

```bash
CYPRESS_username=annaVdovenko CYPRESS_password=password123! npx cypress run
```

Or for `cypress open`:

```bash
CYPRESS_username=annaVdovenko CYPRESS_password=password123! npx cypress open
```

- [ ] **Step 2: Lint**

Run: `npm run lint -- cypress.config.js`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add cypress.config.js
git commit -m "chore: remove hardcoded credentials from config"
```

---

## Task 9: Full verification run

- [ ] **Step 1: Run the full test suite**

Pass credentials via environment variables (do not commit them):

```bash
CYPRESS_username=annaVdovenko CYPRESS_password=password123! npm run cy:run
```

Expected: all tests pass. If any test fails, check the Cypress screenshots/videos in `cypress/screenshots` and `cypress/videos` for details.

- [ ] **Step 2: Final commit if any last fixes were needed**

```bash
git add -p   # review changes interactively
git commit -m "fix: address test run failures"
```
