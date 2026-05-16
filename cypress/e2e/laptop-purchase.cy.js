import { faker } from "@faker-js/faker";
import { clearCartIfNeeded } from "../helpers/api-helper";

const fullName = faker.person.fullName();
const creditCard = faker.finance.creditCardNumber();
let testData;

function getLaptopPrice(priceString) {
  const priceStart = priceString.indexOf("$") + 1;
  const priceEnd = priceString.indexOf(testData.includeTaxString) - 1;
  return priceString.slice(priceStart, priceEnd);
}

describe("Laptop purchase", () => {
  beforeEach(() => {
    cy.fixture("laptop-purchase-test-data").then((data) => {
      testData = data;
      cy.env(["username", "password"]).then(({ username, password }) => {
        cy.login(username, password);
      });
      cy.visit("/");
      cy.get("#nameofuser").should("be.visible");

      //adding cleanup in case previous test failed and left cart not empty
      cy.then(() => clearCartIfNeeded());

      // navigate to the list of Laptops
      cy.get("#contcont").contains("Laptop").click();
    });
  });

  it(`User buys new Laptop`, () => {
    //click on desirable model
    cy.contains(testData.laptopModel).click();
    // verify mandatory data on the page: Add to cart button, model name, price, description, image
    cy.get("h2").invoke("text").should("have.string", testData.laptopModel);
    let priceString = "";
    let laptopPrice = "";
    cy.get("h3")
      .contains("$")
      .then(($text) => {
        priceString = $text.text();
      });
    cy.then(() => {
      laptopPrice = getLaptopPrice(priceString);
      cy.get("#myTabContent").then(($description) => {
        expect($description.text()).contains(testData.descriptionSubtitle);
        expect($description.text().length).greaterThan(50);
      });
      cy.get("#myCarousel-2").should("be.visible");

      //add itemToTheCart
      cy.clickElementAndVerifyAlert(
        ".btn-success",
        testData.alertTextOnAddToCart,
      );

      // go to the cart to verify added product and total sum
      cy.get("#cartur").click();
      cy.get("#tbodyid .success").then((matchingElements) => {
        expect(matchingElements.text())
          .contains(laptopPrice)
          .contains(testData.laptopModel);
        expect(matchingElements.length).eql(1);
      });
      cy.get("#totalp").invoke("text").should("have.string", laptopPrice);

      // place order, fill in form with payment details
      cy.get("button").contains("Place Order").click();
      cy.get("#orderModal").should("have.class", "show");

      cy.get("#totalm").invoke("text").should("have.string", laptopPrice);
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
        fields: testData.orderConfirmationFields,
        name: fullName,
        card: creditCard,
        price: laptopPrice,
      });
      cy.get("button").contains("OK").click();
      cy.get("#cat").should("be.visible");
    });
  });

  it(`User selects laptop on second page, than changes his mind and remove it from the cart`, () => {
    cy.get("#contcont").contains("Laptop").click();
    cy.get("#tbodyid").should("be.visible");
    cy.get("#next2").should("be.visible").click();
    cy.get("#next2").should("be.hidden");
    cy.contains(testData.cheapestLaptopModel).click();
    cy.get("h2")
      .invoke("text")
      .should("have.string", testData.cheapestLaptopModel);
    //add itemToTheCart
    cy.clickElementAndVerifyAlert(
      ".btn-success",
      testData.alertTextOnAddToCart,
    );
    cy.get("#cartur").click();
    //verify that total has price
    cy.get("#totalp")
      .invoke("text")
      .should("have.string", testData.cheapestLaptopPrice);
    cy.get("#tbodyid").contains("Delete").click();

    //verify that total is empty
    cy.get("#totalp").invoke("text").should("have.string", "");
  });

  it(`Verify error if user submits Place Order modal empty, fill in required fields and verify success modal`, () => {
    cy.fixture("laptop-purchase-test-data").then((data) => {
      cy.get("#cartur").click();
      cy.get("#totalp").invoke("text").should("have.string", "");

      // place order, fill in form with payment details
      cy.get("button").contains("Place Order").click();
      cy.get("#orderModal").should("have.class", "show");
      cy.clickElementAndVerifyAlert(
        "#orderModal .btn-primary",
        data["emptyOrderForm.ErrorMessage"],
      );

      cy.fillInPlaceOrderModal({ name: fullName, card: creditCard });

      cy.get("button").contains("Purchase").click();

      cy.verifySuccessPurchaseModal({
        title: testData.purchaseSuccessTitle,
        fields: testData.orderConfirmationFields,
        name: fullName,
        price: "0",
        card: creditCard,
      });
      cy.get("button").contains("OK").click();
      cy.get("#cat").should("be.visible");
    });
  });

  afterEach(() => {
    cy.logout();
  });
});
