let app = null;
let initError = null;

try {
  app = require("./dist/server.js");
} catch (err) {
  initError = {
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined,
    name: err && err.name ? err.name : "InitError"
  };
  console.error("[Vercel Entrypoint Init Error]:", initError);
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

  try {
    const callableApp = app && app.default ? app.default : app;
    return callableApp(req, res);
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify(
        {
          status: "RUNTIME_ERROR",
          message: err && err.message ? err.message : String(err),
          stack: err && err.stack ? err.stack : undefined
        },
        null,
        2
      )
    );
  }
};

handler.default = handler;
module.exports = handler;
