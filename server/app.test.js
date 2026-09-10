import test from "node:test";
import assert from "node:assert/strict";
import { createApp } from "./app.js";

async function withServer(callback) {
  const app = createApp({ database: null });
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  try {
    return await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("health fails closed when database is not configured", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });
});

test("readiness fails closed when database is not configured", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/ready`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).ready, false);
  });
});

test("sensitive identity fields are rejected before route handling", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/auth/request-otp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emailOrPhone: "user@example.com", passport: "never-store-this" })
    });
    assert.equal(response.status, 400);
  });
});

test("protected moderation endpoints require authentication", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ subjectUserId: "00000000-0000-0000-0000-000000000001", reason: "scam" })
    });
    assert.equal(response.status, 401);
  });
});

test("account deletion requires authentication and explicit confirmation", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/account`, {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" })
    });
    assert.equal(response.status, 401);
  });
});

test("server source and package metadata are not publicly served", async () => {
  await withServer(async (baseUrl) => {
    const source = await fetch(`${baseUrl}/server/app.js`);
    const metadata = await fetch(`${baseUrl}/package.json`);
    assert.equal(source.status, 404);
    assert.equal(metadata.status, 404);
  });
});

test("privacy and terms pages are publicly available", async () => {
  await withServer(async (baseUrl) => {
    const privacy = await fetch(`${baseUrl}/privacy.html`);
    const terms = await fetch(`${baseUrl}/terms.html`);
    assert.equal(privacy.status, 200);
    assert.equal(terms.status, 200);
  });
});
