import { faker } from "@faker-js/faker";

describe("Login", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get("#login2").click();
    cy.get("#logInModal").should("have.class", "show");
  });

  it("Existing user successfully logs in", () => {
    cy.env(["username", "password"]).then(({ username, password }) => {
      cy.fillInLoginForm(username, password);
      cy.get("button").contains("Log in").click();
      cy.get("#logInModal").should("not.have.class", "show");
      cy.visit("/");
      cy.get("#nameofuser")
        .should("be.visible")
        .invoke("text")
        .should("have.string", username);
      cy.logout();
    });
  });

  it("Login form is submitted empty, verify error message", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.clickElementAndVerifyAlert(
        "#logInModal .btn-primary",
        loginData["emptyLoginForm.ErrorMessage"],
      );
    });
  });

  it("One field submitted empty, verify error message", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.fillInLoginForm("username", "");
      cy.clickElementAndVerifyAlert(
        "#logInModal .btn-primary",
        loginData["emptyLoginForm.ErrorMessage"],
      );

      cy.get("@alertStub").invoke("resetHistory");
      cy.fillInLoginForm("", "password");
      cy.get("#logInModal .btn-primary").should("be.visible").click();
      cy.get("@alertStub").should(
        "have.been.calledOnceWith",
        loginData["emptyLoginForm.ErrorMessage"],
      );
    });
  });

  it("Non existent user tries to login and gets error", () => {
    const wrongUser = `${faker.person.firstName()}-non-existent-user`;
    cy.fixture("login-test-data").then((loginData) => {
      cy.fillInLoginForm(wrongUser, "password");
      cy.clickElementAndVerifyAlert(
        "#logInModal .btn-primary",
        loginData["nonExistentUser.ErrorMessage"],
      );
    });
  });

  it("User tries to login with incorrect password and gets error", () => {
    cy.fixture("login-test-data").then((loginData) => {
      cy.env(["username"]).then(({ username }) => {
        cy.fillInLoginForm(username, "password");
        cy.clickElementAndVerifyAlert(
          "#logInModal .btn-primary",
          loginData["wrongPassword.ErrorMessage"],
        );
      });
    });
  });
});
