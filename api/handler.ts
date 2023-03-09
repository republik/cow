import type { VercelRequest, VercelResponse } from "@vercel/node";
const hash = require("object-hash");

import truncateIP from "../lib/truncateIP";
const geoForIP = require("../lib/geoForIP");

const {
  PROLITTERIS_MEMBER_ID,
  PROLITTERIS_DOMAIN,
  DEFAULT_USER_AGENT,
  DEV_IP,
  DEV_UID,
} = process.env;

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  const requestIp =
    DEV_IP ||
    request.headers["x-forwarded-for"] ||
    request.connection.remoteAddress;

  const ua = request.headers["user-agent"];

  // Remove request from outside of Switzerland
  const { country } = await geoForIP(requestIp);
  if (country !== "Schweiz") {
    response.status(200).json({
      body: "Request from outside of Switzerland, will not be counted",
    });
    return;
  }

  // Query Parameters of request
  // 1) paid (string, 'pw' || 'na'): request by paying user (pw) or public (na)
  // 2) uid (string): documentId of the article
  // 3) slug (string): article slug

  const { paid, uid, slug } = request.query;

  // Check that all query parameters are defined.
  if (!paid) {
    response.status(400).json({
      body: "paid parameter required.",
    });
    return;
  }

  if (paid !== "na" && paid !== "pw") {
    response.status(400).json({
      body: "Paid parameter must be string 'na' or 'pw'",
    });
    return;
  }

  if (!uid) {
    response.status(400).json({
      body: "id parameter required.",
    });
    return;
  }

  if (!slug) {
    response.status(400).json({
      body: "slug parameter required.",
    });
    return;
  }

  // create unique C-Parameter for each request (20 characters hex) from the ip, user agent
  const cParam: String = hash([requestIp, ua]).substring(0, 20);
  const uidParam = DEV_UID || uid;
  const maskedIP = truncateIP(requestIp)

  const fetchUrl =
    `https://${PROLITTERIS_DOMAIN}` +
    `/${paid}/vzm.${PROLITTERIS_MEMBER_ID}-${uidParam}` +
    `?c=${cParam}`;

  const requestHeaders = {
    "User-Agent": DEFAULT_USER_AGENT || "",
    Referer: "republik.ch/" + slug,
    "X-Forwarded-For": maskedIP || "",
  };

  fetch(fetchUrl, {
    method: "GET",
    headers: requestHeaders,
  })
    .then((res) => {
      if (!res.ok) {
        response.status(400).json({ body: `prolitteris error ${res.status}.` });
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.blob();
    })
    .then((blob) => {
      response.status(200).json({
        body: request.body,
        query: request.query,
        requestHeaders,
        fetchUrl,
      });
    });
}
