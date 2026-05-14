/**
 * GET /api/openapi — serves the OpenAPI 3.1 spec for the Vyara API.
 *
 * Source of truth is `docs/openapi.yaml` at the repo root. The file is
 * read at request time (Node runtime, cached by Next.js for 5 min) and
 * returned as `application/yaml`, which Swagger UI parses natively.
 *
 * Used by:
 *   - GET /swagger     (interactive UI; same-origin fetch)
 *   - any external tool (Postman, Insomnia, openapi-typescript, ...)
 *
 * BE-56 / Sprint-1.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 300;

export async function GET(): Promise<Response> {
  try {
    const yamlPath = join(process.cwd(), "docs", "openapi.yaml");
    const yaml = await readFile(yamlPath, "utf8");
    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "application/yaml; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=60",
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "OPENAPI_NOT_FOUND",
          message:
            "docs/openapi.yaml is missing from the deployment. Reinstall or rebuild.",
        },
      },
      { status: 500 },
    );
  }
}
