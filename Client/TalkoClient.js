import * as io from "socket.io-client";
import Message from "../Messages/Message";
import SessionHandler from "./SessionHandler";
require("dotenv").config();

var port = process.env.CLIENT_PORT || 5050;

// SERVER connection object
var socket;
// const updateMsgs;

/**
 * @class [TalkoClient] :toolkit for talko client
 */
export default class TalkoClient {
  /**
   * @function constructor :setup components message state setter and session for rep client
   * @param {SessionHandler} session
   * @param {callback} upState
   */
  constructor(session, upState) {
    this.session = session;
    this.upState = upState;
  }
  /**
   * @function start :initializes necessary socket and listeners
   */
  start(upState) {
    // Connect to SERVER on specified port
    socket = io(":" + port);

    // Connect to SERVER acknowledgement
    socket.on("connect", () => {
      this.session.handleConnection();
    });

    // Receive greeting (msg.content <string>) from SERVER
    socket.on("greeting", message => {
      let incGreetingMsg = Message(null, 0, "-=SERVER=-", null, message);
      this.upState(incGreetingMsg);
      // Outgoing Message Identifying as Customer
      let outIdentifyMsg = Message(
        new Date().toUTCString(),
        socket.id,
        "(React) Customer",
        null,
        "Customer"
      );
      socket.emit("identify", outIdentifyMsg);
    });

    socket.on("rep_found", message => {
      this.upState(message);
    });

    // Perform disconnection
    socket.on("disconnect", message => {
      this.session.handleDisconnection(message);
    });

    // Receive msg from SERVER
    socket.on("send_message", message => {
      this.session.handleMessageReceived(this.upState, message);
    });
  }

  /**
   * @function sendMessage :sends message object to server.
   * @param {message{from:{id:number, avatar:string, name:string}, content:string} message
   */
  sendMessage(message) {
    message.from.name = "(React) Customer";
    this.session.handleMessageSend(socket, message);
  }
}
