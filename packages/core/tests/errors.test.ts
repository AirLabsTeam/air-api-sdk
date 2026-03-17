import { describe, expect, test } from "vitest";
import {
  APIError,
  AuthenticationError,
  BadRequestError,
  NotFoundError,
  PermissionError,
  RateLimitError,
  InternalServerError,
  ConnectionError,
  TimeoutError,
} from "../src/errors";

describe("APIError", () => {
  test("fromResponse creates correct error subclass for 400", async () => {
    const response = new Response(JSON.stringify({ message: "Bad input" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(BadRequestError);
    expect(error.status).toBe(400);
    expect(error.message).toBe("Bad input");
  });

  test("fromResponse creates AuthenticationError for 401", async () => {
    const response = new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(AuthenticationError);
  });

  test("fromResponse creates PermissionError for 403", async () => {
    const response = new Response(JSON.stringify({ message: "Forbidden" }), {
      status: 403,
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(PermissionError);
  });

  test("fromResponse creates NotFoundError for 404", async () => {
    const response = new Response(JSON.stringify({ message: "Not found" }), {
      status: 404,
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(NotFoundError);
  });

  test("fromResponse creates RateLimitError for 429 with retryAfter", async () => {
    const response = new Response(JSON.stringify({ message: "Rate limited" }), {
      status: 429,
      headers: { "retry-after": "30" },
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(RateLimitError);
    expect((error as RateLimitError).retryAfter).toBe(30);
  });

  test("fromResponse creates InternalServerError for 500", async () => {
    const response = new Response(JSON.stringify({ message: "Server error" }), {
      status: 500,
    });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(InternalServerError);
  });

  test("fromResponse handles non-JSON body", async () => {
    const response = new Response("Something went wrong", { status: 502 });
    const error = await APIError.fromResponse(response);
    expect(error).toBeInstanceOf(InternalServerError);
    expect(error.message).toBe("Request failed with status 502");
  });
});

describe("ConnectionError", () => {
  test("has correct name", () => {
    const error = new ConnectionError("Failed to connect");
    expect(error.name).toBe("ConnectionError");
    expect(error.message).toBe("Failed to connect");
  });
});

describe("TimeoutError", () => {
  test("extends ConnectionError", () => {
    const error = new TimeoutError();
    expect(error).toBeInstanceOf(ConnectionError);
    expect(error.name).toBe("TimeoutError");
    expect(error.message).toBe("Request timed out");
  });
});
