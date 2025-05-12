import { WebflowClient } from "webflow-api";
import { NextResponse } from "next/server";
import { OauthScope } from "webflow-api/api/types/OAuthScope";

/**
 * Authorize API Route Handler
 * --------------------------
 * This route generates and redirects to Webflow's authorization URL.
 */

const scopes = [
  "sites:read",
  "custom_code:read",
  "custom_code:write",
  "authorized_user:read",
  "pages:read",
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isDesigner = searchParams.get("state") === "webflow_designer";

  const authorizeUrl = WebflowClient.authorizeURL({
    scope: scopes as OauthScope[],
    clientId: process.env.WEBFLOW_CLIENT_ID!,
    state: isDesigner ? "webflow_designer" : undefined,
  });

  return NextResponse.redirect(authorizeUrl);
}
