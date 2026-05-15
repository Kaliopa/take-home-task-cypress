Cypress.Commands.add("login", (username, password) => {
  cy.session(username, () => {
    cy.visit("/");
    cy.get("#login2").click();
    cy.get("#logInModal").should("have.class", "show");
    cy.fillInLoginForm(username, password);
    cy.get("button").contains("Log in").click();
    cy.get("#logInModal").should("not.have.class", "show");
  });
});

Cypress.Commands.add("fillInInputFieldViaDOM", (selector, value) => {
  cy.get(selector).invoke("val", value).trigger("input").trigger("change"); // used claude to help me figure out how to insert full value in input field because whith .type() focus was stolen in the middle and username was incomplete, also tried .click().type() it worked but was flaky
});

Cypress.Commands.add("fillInLoginForm", (username, password) => {
  cy.fillInInputFieldViaDOM("#loginusername", username);
  cy.fillInInputFieldViaDOM("#loginpassword", password);
});

Cypress.Commands.add("logout", () => {
  cy.get("#logout2").click();
  cy.get("#signin2").should("be.visible");
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
    if (name) cy.fillInInputFieldViaDOM("#name", name);
    if (country) cy.get("#country").click().type(country);
    if (city) cy.get("#city").type(city);
    if (card) cy.get("#card").type(card);
    if (month) cy.get("#month").type(month);
    if (year) cy.get("#year").type(year);
  },
);

Cypress.Commands.add(
  "verifySuccessPurchaseModal",
  ({ title, fields, name, price } = {}) => {
    cy.get(".sweet-alert").should("have.class", "visible").contains(title);

    cy.get(".sweet-alert p")
      .invoke("text")
      .should("have.string", fields[0])
      .should("have.string", fields[1])
      .should("have.string", price)
      .should("have.string", `Name: ${name}`)
      .should("have.string", fields[2]);
  },
);
