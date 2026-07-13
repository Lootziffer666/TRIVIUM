"use strict";

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function resolveBellowsConfig(gateway, env = process.env) {
  if (!gateway || gateway.gateway !== "bellows") throw new Error("LAB model calls require the BELLOWS gateway");
  const baseUrl = env[gateway.baseUrlEnv || "BELLOWS_BASE_URL"];
  const apiKey = env[gateway.apiKeyEnv || "BELLOWS_API_KEY"];
  const model = env[gateway.modelEnv || "BELLOWS_MODEL"];
  const missing = [];
  if (!nonEmpty(baseUrl)) missing.push(gateway.baseUrlEnv || "BELLOWS_BASE_URL");
  if (!nonEmpty(apiKey)) missing.push(gateway.apiKeyEnv || "BELLOWS_API_KEY");
  if (!nonEmpty(model)) missing.push(gateway.modelEnv || "BELLOWS_MODEL");
  if (missing.length) throw new Error(`BELLOWS configuration missing: ${missing.join(", ")}`);
  return {
    endpoint: `${baseUrl.replace(/\/$/, "")}${gateway.endpointPath || "/v1/chat/completions"}`,
    apiKey,
    model,
  };
}

async function callBellows(gateway, messages, options = {}) {
  if (!Array.isArray(messages) || messages.length === 0) throw new Error("BELLOWS messages are required");
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw new Error("A Fetch API implementation is required");
  const config = resolveBellowsConfig(gateway, options.env || process.env);
  const response = await fetchImpl(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model || config.model,
      messages,
      temperature: options.temperature,
      max_tokens: options.maxTokens,
      stream: false,
    }),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`BELLOWS request failed (${response.status}): ${body.slice(0, 500)}`);
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (!nonEmpty(content)) throw new Error("BELLOWS returned no assistant content");
  return { content, response: payload };
}

module.exports = { resolveBellowsConfig, callBellows };
