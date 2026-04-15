// src/app/page.tsx — Page racine "/" → redirige vers /dashboard

import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/dashboard");
}
