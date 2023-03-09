import type { VercelRequest, VercelResponse } from "@vercel/node";

const geoForIP = require("../lib/geoForIP");
const hash = require("object-hash");

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
  const ip =
    DEV_IP ||
    request.headers["x-forwarded-for"] ||
    request.connection.remoteAddress;

  const ua = request.headers["user-agent"];

  // Remove request from outside of Switzerland
  const { country }: { country: String } = await geoForIP(ip);
  if (country !== "Schweiz") {
    response.status(200).json({
      body: "Request from outside of Switzerland, will not be counted",
    });
    return;
  }

  // Query Parameters of request
  // 1) paid (string, 'pw' || 'na'): request by paying user (pw) or public (na)
  // 2) uid (string): unique identifier of the article
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
  const cParam: String = hash([ip, ua]).substring(0, 20);
  const uidParam = DEV_UID || uid;

  const fetchUrl =
    `https://${PROLITTERIS_DOMAIN}` +
    `/${paid}/vzm.${PROLITTERIS_MEMBER_ID}-${uidParam}` +
    `?c=${cParam}`;

  const fetchHeaders = {
    "User-Agent": DEFAULT_USER_AGENT,
    Referer: "republik.ch/" + slug,
    "X-Forwarded-For": ip,
  };

  // fetch("https://pl02.owen.prolitteris.ch" + paid + id + cParam, {
  //   method: "GET",
  //   headers: {
  //     "User-Agent": DEFAULT_UA,
  //     Referer: "original url",
  //     "X-Forwarded-For": "",
  //   },
  // });

  response.status(200).json({
    body: request.body,
    query: request.query,
    fetchHeaders,
    fetchUrl,
  });
}
