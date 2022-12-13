import daysAgo from "./daysAgo";

const signInUrl = [
  `${process.env.REACT_APP_COGNITO_DOMAIN}/login`,
  `?client_id=${process.env.REACT_APP_CLIENT_ID}`,
  `&response_type=token`,
  `&scope=openid`,
  `&redirect_uri=${encodeURIComponent(
    `${window.location.protocol}//${window.location.host}/signin`
  )}`,
].join("");

const signOutUrl = [
  `${process.env.REACT_APP_COGNITO_DOMAIN}/logout`,
  `?client_id=${process.env.REACT_APP_CLIENT_ID}`,
  `&scope=openid`,
  `&logout_uri=${encodeURIComponent(
    `${window.location.protocol}//${window.location.host}/signout`
  )}`,
].join("");

export { daysAgo, signInUrl, signOutUrl };
