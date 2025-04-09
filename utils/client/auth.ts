export const getAuthToken = (): string | null => {
  try {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-aljrjyhwwmjqfkgnbeiz-auth-token='))
      ?.split('=')[1];

    // Decode the URL-encoded token and parse it
    const decodedToken = token ? JSON.parse(decodeURIComponent(token))[0] : null;

    return decodedToken;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}; 