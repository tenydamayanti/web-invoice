export function setToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("invoice_token", token);
}

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("invoice_token");
}

export function removeToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("invoice_token");
}

export function isAuthenticated() {
  return Boolean(getToken());
}
