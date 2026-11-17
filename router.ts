import { useEffect, useState } from "react";

export type Page = "dashboard" | "missions" | "squad" | "profile" | "workout";

export interface Route {
  page: Page;
  param?: string;
}

const ROUTES: Page[] = ["dashboard", "missions", "squad", "profile", "workout"];

export function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, "");
  const [segments] = clean.split("?");
  const [first, second] = segments.split("/").filter(Boolean);
  const page = (ROUTES.includes(first as Page) ? first : "dashboard") as Page;
  return { page, param: second };
}

export function navigate(path: string): void {
  const target = `#/${path.replace(/^#?\/?/, "")}`;
  if (window.location.hash === target) {
    window.dispatchEvent(new Event("hashchange"));
    return;
  }
  window.location.hash = target;
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, "", "#/dashboard");
    }
    const onChange = () => {
      setRoute(parseHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}
