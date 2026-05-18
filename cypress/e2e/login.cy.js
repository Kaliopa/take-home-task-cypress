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
