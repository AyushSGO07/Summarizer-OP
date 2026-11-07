import { Request, Response, NextFunction } from "express";

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error("[Backend Error Handler]:", err?.message || err);
  const status = err.status || err.statusCode || 500;
  let message = "Internal Server Error";

  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === "string") {
      message = detail;
    } else if (Array.isArray(detail)) {
      message = detail
        .map((d: any) => (typeof d === "object" && d !== null ? d.msg || JSON.stringify(d) : String(d)))
        .join(", ");
    } else {
      message = JSON.stringify(detail);
    }
  } else if (err.response?.data?.error) {
    const errorObj = err.response.data.error;
    message = typeof errorObj === "object" && errorObj !== null ? JSON.stringify(errorObj) : String(errorObj);
  } else if (err.response?.data?.message) {
    message = String(err.response.data.message);
  } else if (err.message) {
    message = String(err.message);
  }

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  });
}
