import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env.js";

describe("env", () => {
  it("fails fast with a readable message when config is invalid", () => {
    expect(() => loadEnv({ JWT_ACCESS_SECRET: "short" })).toThrow(/JWT_ACCESS_SECRET/);
  });
});
