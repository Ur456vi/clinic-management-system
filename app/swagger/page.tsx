/**
 * GET /swagger — interactive Swagger UI for the Vyara API.
 *
 * Renders a minimal HTML shell that pulls Swagger UI from the jsDelivr CDN
 * and points it at /api/openapi. Server-rendered, no client component or
 * runtime data fetching required from this page itself (Swagger UI does its
 * own browser-side fetch of the spec).
 *
 * If you change the Swagger UI version, update both <link> and <script>
 * URLs together to avoid CSS/JS skew.
 *
 * BE-56 / Sprint-1.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vyara API — Swagger",
  description:
    "Interactive OpenAPI 3.1 playground for the Vyara clinic-management API.",
  robots: { index: false, follow: false },
};

const SWAGGER_VERSION = "5.17.14";

export default function SwaggerPage() {
  const bootstrap = `
    window.addEventListener('load', function() {
      window.ui = SwaggerUIBundle({
        url: '/api/openapi',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: 'StandaloneLayout',
        defaultModelsExpandDepth: 1,
        defaultModelExpandDepth: 2,
        docExpansion: 'list',
        tryItOutEnabled: true,
        persistAuthorization: true,
      });
    });
  `;
  return (
    <>
      <link
        rel="stylesheet"
        href={`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`}
      />
      <style>{`html,body{margin:0;background:#fafafa}#swagger-ui{max-width:1400px;margin:0 auto}`}</style>
      <div id="swagger-ui" />
      <script
        src={`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`}
        crossOrigin="anonymous"
      />
      <script
        src={`https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-standalone-preset.js`}
        crossOrigin="anonymous"
      />
      <script dangerouslySetInnerHTML={{ __html: bootstrap }} />
    </>
  );
}
