import { createFileRoute } from "@tanstack/react-router";
import { XRScene } from "@/components/xr/XRScene";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Spin verstehen – XR Tischtennis-Lernmoment" },
      {
        name: "description",
        content: "VR-Lernprototyp: Unterschnitt in Zeitlupe beobachten, Schläger anpassen und Spin und Flugbahn verstehen.",
      },
      { property: "og:title", content: "Spin verstehen – XR Tischtennis-Lernmoment" },
      {
        property: "og:description",
        content: "Unterschnitt in Zeitlupe beobachten, Schläger anpassen, Spin und Flugbahn verstehen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: XRScene,
});
