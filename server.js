const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");
const { title } = require("process");

const app = express();

const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = { white: null, black: null };
let currentPlayer = "w";

app.set("view engine", "ejs"); // ejs use krpanyege

app.use(express.static(path.join(__dirname, "public"))); //static files use krpange

app.get("/", (req, res) => {
  res.render("index", { title: "Chess Game" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

io.on("connection", (uniquesocket) => {
  console.log("connected");

  if (!players.white) {
    players.white = uniquesocket.id;
    uniquesocket.emit("playerRole", "w");
  } else if (!players.black) {
    players.black = uniquesocket.id;
    uniquesocket.emit("playerRole", "b");
  } else {
    uniquesocket.emit("spectatorRole");
  }

  uniquesocket.on("disconnect", () => {
    if (uniquesocket.id === players.white) {
      delete players.white;
    } else if (uniquesocket.id === players.black) {
      delete players.black;
    }
  });

  uniquesocket.on("move", (move) => {
    try {
      if (chess.turn() === "w" && uniquesocket.id !== players.white) return;
      if (chess.turn() === "b" && uniquesocket.id !== players.black) return;

      const res = chess.move(move);

      if (res) {
        currentPlayer = chess.turn();

        io.emit("boardState", chess.fen());
      } else {
        console.log("Invalid Move: ", move);
        uniquesocket.emit("Invalid Move: ", move);
      }
    } catch (error) {
      console.log(error);
      uniquesocket.emit("Invalid Move: ", move);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
