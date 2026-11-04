// An absent/expired session is a client authentication failure, not a server error.
export async function authenticatedUser(base44) {
  try {
    return await base44.auth.me();
  } catch (error) {
    const status = error?.status ?? error?.response?.status;
    if (status === 401 || status === 403) return null;
    throw error; // Do not disguise network/provider failures as missing sessions.
  }
}
