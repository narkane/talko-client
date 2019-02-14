export default class TalkoSession {
  /**
   * Constructs a new talko session. Does not allow direct instances, you must extend off this class.
   */
  constructor() {
    if (new.target === TalkoSession) {
      throw new TypeError(
        "Cannot construct TalkoSession instaces directly! Please extend this class."
      );
    }
  }

  /**
   * Handles a new connection
   *
   * @param {socket} socket - The socket that has connected
   */
  handleConnection(socket, defaultGreeting) {
    if (defaultGreeting) {
      console.log("CONNECTED to Chat Server!");
    }
  }

  /**
   * Handles received messages sent from the talko client
   *
   * @param {object} msg - The message object
   */
  handleMessageSend(socket, msg) {
    const message = { ...msg };
    message.from.id = socket.id;
    socket.emit("send_message", message);
  }

  handleMessageReceived(callback, msg) {
    callback(msg);
  }

  /**
   * Handles a socket disconnections
   */
  handleDisconnection(msg) {
    console.log("SERVER: " + msg);
  }
}
