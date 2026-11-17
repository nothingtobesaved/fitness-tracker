import { Layout } from "@/components/Layout";
import { useRoute } from "@/lib/router";
import { HunterProvider } from "@/lib/store";
import { Dashboard } from "@/pages/Dashboard";
import { Missions } from "@/pages/Missions";
import { Profile } from "@/pages/Profile";
import { Squad } from "@/pages/Squad";
import { Workout } from "@/pages/Workout";

export default function App() {
  const route = useRoute();

  return (
    <HunterProvider>
      <Layout route={route}>
        {route.page === "dashboard" ? <Dashboard /> : null}
        {route.page === "missions" ? <Missions /> : null}
        {route.page === "squad" ? <Squad /> : null}
        {route.page === "profile" ? <Profile /> : null}
        {route.page === "workout" ? <Workout sessionId={route.param} /> : null}
      </Layout>
    </HunterProvider>
  );
}
