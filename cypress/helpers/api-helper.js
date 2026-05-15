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
          cy.log(`Cart has ${items.length} item(s)`); // logs just for visibility, would remove for production
          items.forEach((item) => {
            cy.request({
              method: "POST",
              url: `${apiUrl}/deleteitem`,
              body: { id: item.id },
            }).then((deleteResponse) => {
              expect(deleteResponse.status).to.equal(200);
              cy.log(`Deleted item ${item.id}`); // logs just for visibility, would remove for production
            });
          });
        });
      });
    });
}
