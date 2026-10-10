export class HttpError extends Error {
  /**
   * @type number
   */
  status;

  /**
   *
   * @param {number} status
   * @param {string} message
   */
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}
