// cypress/support/selectors.js
export const NAV = {
  LOGIN_BTN: "#login2",
  LOGOUT_BTN: "#logout2",
  CART_BTN: "#cartur",
  SIGNIN_BTN: "#signin2",
  USERNAME_DISPLAY: "#nameofuser",
  CATEGORIES: "#contcont",
  HOME_LOGO: "#cat",
};

export const LOGIN_MODAL = {
  MODAL: "#logInModal",
  USERNAME_INPUT: "#loginusername",
  PASSWORD_INPUT: "#loginpassword",
  SUBMIT_BTN: "#logInModal .btn-primary",
};

export const PRODUCT_PAGE = {
  TITLE: "h2",
  PRICE: "h3",
  DESCRIPTION: "#myTabContent",
  IMAGE_CAROUSEL: "#myCarousel-2",
  ADD_TO_CART_BTN: ".btn-success",
};

export const CART_PAGE = {
  ITEMS: "#tbodyid .success",
  TABLE_BODY: "#tbodyid",
  TOTAL: "#totalp",
  NEXT_PAGE_BTN: "#next2",
};

export const ORDER_MODAL = {
  MODAL: "#orderModal",
  TOTAL: "#totalm",
  NAME_INPUT: "#name",
  COUNTRY_INPUT: "#country",
  CITY_INPUT: "#city",
  CARD_INPUT: "#card",
  MONTH_INPUT: "#month",
  YEAR_INPUT: "#year",
  SUBMIT_BTN: "#orderModal .btn-primary",
};

export const SUCCESS_MODAL = {
  CONTAINER: ".sweet-alert",
  CONTENT: ".sweet-alert p",
};
