import * as io from "socket.io-client";
import Message from "../Messages/Message";
import SessionHandler from "./SessionHandler";
require("dotenv").config();

//2D ARRAY OF CUSTOMER ROOMS AND MSGS

// SERVER connection object
var offerSocket;
var offerCustId;
var custSockets = {};
var port = process.env.CLIENT_PORT || 5050;

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
   * @function startOfferConnection :initializes necessary socket and listeners
   */
  startOfferConnection() {
    // Connect to SERVER on specified port
    offerSocket = io(":" + port);

    // Connect to SERVER acknowledgement
    offerSocket.on("connect", () => {
      this.session.handleConnection();
    });

    // Receive greeting (msg.content <string>) from SERVER
    offerSocket.on("greeting", message => {
      let incGreetingMsg = Message(null, 0, "-=SERVER=-", null, message);
      this.upState(incGreetingMsg);
      // Outgoing Message Identifying as Customer
      let outIdentifyMsg = Message(
        new Date().toUTCString(),
        offerSocket.id,
        "(React) Customer",
        null,
        "Representative"
      );
      offerSocket.emit("identify", outIdentifyMsg);
    });

    offerSocket.on("offer", message => {
      if (offerCustId == null) {
        offerCustId = message.from.id;
        this.upState(message);
        //PASS ALERT UP TO COMPONENT AND FROM COMPONENT UP TO CLIENT LIST COMPONENT
      } else {
        let outOfferBusyMsg = Message(
          new Date().toUTCString(),
          offerSocket.id,
          "(React) Rep",
          null,
          offerCustId
        );
        offerSocket.emit("offer_busy", outOfferBusyMsg);
      }
    });

    // Perform disconnection
    offerSocket.on("disconnect", message => {
      this.session.handleDisconnection(message);
    });

    // Receive msg from SERVER
    offerSocket.on("send_message", message => {
      this.session.handleMessageReceived(this.upState, message);
    });
  }

  /**
   * @function sendMessage :sends message object to server.
   * @param {Message} message
   * @param {id} id :id of desired customer for msg
   */
  sendMessage(message, id) {
    message.from.name = "(React) Rep";
    this.session.handleMessageSend(custSockets[id], message);
  }

  /**
   * @function offerAccept :sends message on "offer" socket to accept offered customer
   */
  offerAccept() {
    let outOfferAcceptMsg = Message(
      new Date().toUTCString(),
      offerSocket.id,
      "(React) Rep",
      null,
      offerCustId
    );
    offerSocket.emit("offer_accept", outOfferAcceptMsg);
    //add new Socket connection to custSockets by custID
    custSockets = { ...custSockets, offerCustId: io(":" + port) };
    //init listeners for new customer connection
    this.startCustConnection(custSockets.offerCustId, offerCustId);
    offerCustId = null;
  }

  /**
   * @function startCustConnection :initializes necessary listeners for new Customer connection
   * @param {*} custSocket
   * @param {*} reqCustomer
   */
  startCustConnection(custSocket, reqCustomer) {
    // Connect to SERVER acknowledgement
    custSocket.on("connect", () => {
      this.session.handleConnection();
    });

    // Receive greeting (msg.content <string>) from SERVER
    custSocket.on("greeting", message => {
      let incGreetingMsg = Message(null, 0, "-=SERVER=-", null, message);
      this.upState(incGreetingMsg);
      // Outgoing Message requesting customer by id
      let outIdentifyMsg = Message(
        new Date().toUTCString(),
        custSocket.id,
        "(React) Customer",
        null,
        reqCustomer
      );
      custSocket.emit("identify", outIdentifyMsg);
    });

    // Perform disconnection from CUSTOMER through SERVER connection
    custSocket.on("disconnect", message => {
      this.session.handleDisconnection(message);
    });

    // Receive msg from CUSTOMER by way of SERVER
    custSocket.on("send_message", message => {
      this.session.handleMessageReceived(this.upState, message);
    });
  }
}
