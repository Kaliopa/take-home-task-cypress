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
