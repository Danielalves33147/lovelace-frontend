const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// Servir os arquivos estáticos do build do React/Vite
app.use(express.static(path.join(__dirname, "dist")));

// Rota para servir o index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`🚀 Servindo o frontend em http://localhost:${PORT}`);
});
