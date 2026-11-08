let app = null;
let initError = null;

try {
  const mod = require("./dist/server.js");
  app = mod && mod.default ? mod.default : mod;
} catch (err) {
  initError = {
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    name: err && err.name ? err.name : "InitError"
  };
  console.error("[backend/server.js Init Error]:", initError);
}

const handler = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify(
        {
          status: "INIT_ERROR",
          error: initError
        },
        null,
        2
      )
    );
  }

  const callableApp = app && app.default ? app.default : app;
  return callableApp(req, res);
};

if (app) {
  Object.setPrototypeOf(handler, app);
  Object.assign(handler, app);
}

handler.default = handler;
handler.app = app;
module.exports = handler;
