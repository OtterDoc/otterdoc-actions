/**
 * Interface for a User object.
 * @param {string} name - The name of the user.
 * @param {number} id - The unique identifier of the user.
 */
//this function works well
export interface User {
  name: string
  id: number
}
/**
 * Represents a user account with a name and ID.
 * @class
 * @param {string} name - The name of the user.
 * @param {number} id - The ID of the user.
 */
export class UserAccount {
  name: string
  id: number

  constructor(name: string, id: number) {
    this.name = name
    this.id = id
  }
}

/**
 * Returns a new instance of UserAccount with the name 'Murphy' and id 1.
 * @returns {User} A User object representing the admin user.
 */
export function getAdminUser(): User {
  return new UserAccount('Murphy', 1)
}
