import { createFileRoute } from "@tanstack/react-router";
import { Builder } from "@/components/builder/Builder";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Canvas — Visual Website Builder" },
      { name: "description", content: "Edit your website visually: select elements, change styles, add or delete blocks without code." },
      { property: "og:title", content: "Canvas — Visual Website Builder" },
      { property: "og:description", content: "Edit your website visually without writing code." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Builder,
});
