import { getUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getUserFromCookies();
  if (user) {
    redirect("/dashboard");
  }
  redirect("/login");
}
