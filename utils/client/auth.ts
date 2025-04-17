export const getAuthToken = (): string | null => {
  try {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("sb-aljrjyhwwmjqfkgnbeiz-auth-token="))
      ?.split("=")[1];

    // Decode the URL-encoded token and parse it
    const decodedToken = token
      ? JSON.parse(decodeURIComponent(token))[0]
      : null;

    return decodedToken;
  } catch (error) {
    console.error("Error getting auth token:", error);
    return null;
  }
};

export const decodeToken = (token: string): any => {
  try {
    // Split the token and get the payload part
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Error decoding token:", error);
    return null;
  }
};

export const getUserIdFromToken = (token: string): string | null => {
  try {
    const decodedToken = decodeToken(token);
    return decodedToken?.sub || null;
  } catch (error) {
    console.error("Error getting user ID from token:", error);
    return null;
  }
};

export const getUserEmailFromToken = (token: string): string | null => {
  try {
    const decodedToken = decodeToken(token);
    return decodedToken?.email || null;
  } catch (error) {
    console.error("Error getting user email from token:", error);
    return null;
  }
};
