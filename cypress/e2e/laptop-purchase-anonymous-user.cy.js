import { faker } from "@faker-js/faker";

const fullName = faker.person.fullName();
const creditCard = faker.finance.creditCardNumber();
let testData;

describe("Laptop purchase without login", () => {
  before(() => {
    cy.fixture("laptop-purchase-test-data").then((data) => {
      testData = data;
      cy.visit("/");
      cy.get("#contcont").contains("Laptop").click();
    });
  });

  it(`Anonymous user buys new Laptop`, () => {
    cy.contains(testData.laptopModel).click();
    cy.get("h2").invoke("text").should("have.string", testData.laptopModel);
    //add itemToTheCart
    cy.clickElementAndVerifyAlert(
      ".btn-success",
      testData.alertTextOnAddToCartAnonymous,
    );

    // go to the cart to verify added product and total sum
    cy.get("#cartur").click();
    cy.get("#tbodyid .success").then((matchingElements) => {
      expect(matchingElements.text())
        .contains(testData.laptopPrice)
        .contains(testData.laptopModel);
    });
    cy.get("#totalp")
      .invoke("text")
      .should("have.string", testData.laptopPrice);

    // place order, fill in form with payment details
    cy.get("button").contains("Place Order").click();
    cy.get("#orderModal").should("have.class", "show");

    cy.get("#totalm")
      .invoke("text")
      .should("have.string", testData.laptopPrice);
    cy.fillInPlaceOrderModal({
      name: fullName,
      card: creditCard,
    });

    cy.get("button").contains("Purchase").click();
    cy.verifySuccessPurchaseModal({
      title: testData.purchaseSuccessTitle,
      fields: testData.orderConfirmationFields,
      name: fullName,
      price: testData.laptopPrice,
      card: creditCard,
    });
    cy.get("button").contains("OK").click();
    cy.get("#cat").should("be.visible");
  });
});
