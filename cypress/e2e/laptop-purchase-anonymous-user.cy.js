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
