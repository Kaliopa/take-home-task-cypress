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
