import { auth } from '@/auth';
import { sql } from '@vercel/postgres';
/**
 * Checks if there is an authenticated user by verifying the presence
 * of a session and a user ID within that session.
 *
 * @returns {Promise<boolean>} A promise that resolves to `true` if a user is authenticated,
 *                             otherwise `false`.
 */
export async function isAuthenticatedUser(): Promise<boolean> {
  const session = await auth();
  if (!session) {
    return false;
  }
  const userId = session.user?.id;
  if (!userId) {
    return false;
  }
  return true;
}

/**
 * Retrieves the authenticated user's ID from the current session.
 *
 * This function throws an error if the user is not authenticated.
 * If you find yourself wrapping this in a try-catch, consider using `getAuthenticatedUserIdOrNull` instead.
 *
 * @returns {Promise<string>} A promise that resolves to the authenticated user's ID.
 * @throws {Error} Throws an error if no session is found, indicating that no user is authenticated.
 * @throws {Error} Throws an error if the session does not have a user ID, indicating a malformed session object.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await auth();
  if (!session) {
    throw new Error('Authenticated user required');
  }
  const userId = session.user?.id;
  if (!userId) {
    throw new Error('No user id for authenticated user');
  }
  return userId;
}

/**
 * Retrieves the authenticated user's ID from the current session.
 *
 * This function calls the `auth()` method to fetch the current session.
 * If a session is found and contains a valid user ID, that ID is returned.
 * Otherwise, it returns `null`, indicating no authenticated user.
 *
 * @returns {Promise<string | null>} A promise that resolves to the user's ID if authenticated, or `null` if not.
 */
export async function getAuthenticatedUserIdOrNull(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Determines whether a specified user is the host of a given lobby.
 * This function queries the database to fetch the host ID of the lobby
 * and compares it to the user ID provided.
 *
 * @param {{ lobbyId: string; userId: string }} params - An object containing:
 *   - `lobbyId`: The unique identifier for the lobby.
 *   - `userId`: The unique identifier of the user to be verified.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the user is the host of the lobby,
 *                             otherwise `false`.
 * @throws {Error} Throws an error if no host ID could be retrieved from the database,
 *                 possibly indicating a query or database issue.
 */
export async function isHost({
  lobbyId,
  userId,
}: {
  lobbyId: string;
  userId: string;
}): Promise<boolean> {
  const result = await sql`
    SELECT host_id FROM lobby WHERE id = ${lobbyId}
  `;
  if (result.rows?.[0]?.host_id == undefined) {
    throw new Error('Failed to retrieve host id');
  }
  return result.rows[0].host_id === userId;
}
