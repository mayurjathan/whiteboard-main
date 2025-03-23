import { NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";

export interface NextApiResponseWithSocket extends NextApiResponse {
  socket: {
    server: {
      io?: SocketIOServer;
    };
  };
}
