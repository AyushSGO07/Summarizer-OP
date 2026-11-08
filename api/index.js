// Universal Vercel Serverless Function entrypoint
let app = null;
let initError = null;

try {
  app = require("../backend/dist/server.js");
} catch (err) {
  initError = {
    message: err && err.message ? err.message : String(err),
    stack: err && err.stack ? err.stack : undefined
  };
  console.error("[Vercel api/index.js Init Error]:", initError);
}

const handler = (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify(
        {
          success: false,
          error: "Backend Initialization Error",
          details: initError
        },
        null,
        2
      )
    );
  }

  const callableApp = app && app.default ? app.default : app;
  return callableApp(req, res);
};

handler.default = handler;
module.exports = handler;
