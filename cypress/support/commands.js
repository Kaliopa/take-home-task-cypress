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
