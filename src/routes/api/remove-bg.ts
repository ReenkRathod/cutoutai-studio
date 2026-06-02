import { createFileRoute } from "@tanstack/react-router";
import { removeBackgroundApi } from "@/lib/bg-removal";

export const Route = createFileRoute("/api/remove-bg")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const formData = await request.formData();
          const file = formData.get("image") as File;

          if (!file) {
            return new Response("No image file provided", { status: 400 });
          }

          const resultBlob = await removeBackgroundApi(file);

          return new Response(resultBlob, {
            headers: {
              "Content-Type": "image/png",
              "Content-Disposition": 'attachment; filename="result.png"',
            },
          });
        } catch (err: any) {
          console.error("[api-remove-bg]", err);
          return new Response(err.message || "Internal Server Error", {
            status: 500,
            headers: { "Content-Type": "text/plain" }
          });
        }
      },
    },
  },
});
