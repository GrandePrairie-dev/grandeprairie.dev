import { lazy, Suspense, useEffect, useState } from "react";
import { Route, Switch, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { useMobile } from "@/hooks/useMobile";
import { useTheme } from "@/hooks/useTheme";
import { ProfileBanner } from "@/components/ProfileBanner";
import { applyRouteSeo, getSeoForPath } from "@/lib/seo";

const Home = lazy(() => import("@/pages/Home"));
const Agency = lazy(() => import("@/pages/Agency"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const People = lazy(() => import("@/pages/People"));
const PersonProfile = lazy(() => import("@/pages/PersonProfile"));
const EditProfile = lazy(() => import("@/pages/EditProfile"));
const Ideas = lazy(() => import("@/pages/Ideas"));
const IdeaDetail = lazy(() => import("@/pages/IdeaDetail"));
const Map = lazy(() => import("@/pages/Map"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Projects = lazy(() => import("@/pages/Projects"));
const Intel = lazy(() => import("@/pages/Intel"));
const TechHub = lazy(() => import("@/pages/TechHub"));
const Students = lazy(() => import("@/pages/Students"));
const Business = lazy(() => import("@/pages/Business"));
const BusinessDetail = lazy(() => import("@/pages/BusinessDetail"));
const AIHub = lazy(() => import("@/pages/AIHub"));
const Board = lazy(() => import("@/pages/Board"));
const About = lazy(() => import("@/pages/About"));
const Admin = lazy(() => import("@/pages/Admin"));
const Organizations = lazy(() => import("@/pages/Organizations"));
const OrgDetail = lazy(() => import("@/pages/OrgDetail"));
const Showcase = lazy(() => import("@/pages/Showcase"));
const LaunchBoard = lazy(() => import("@/pages/LaunchBoard"));
const Jobs = lazy(() => import("@/pages/Jobs"));
const JobDetail = lazy(() => import("@/pages/JobDetail"));
const Conduct = lazy(() => import("@/pages/Conduct"));
const DigestPreferences = lazy(() => import("@/pages/DigestPreferences"));

function RouteFallback() {
  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-3" aria-live="polite" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-24 w-full animate-pulse rounded bg-muted" />
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export function App() {
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const routeLocation = location === "/" ? "/" : location.replace(/\/+$/, "") || "/";
  const isAgencyRoute = routeLocation === "/agency";

  useEffect(() => {
    applyRouteSeo(getSeoForPath(routeLocation));
  }, [routeLocation]);

  return (
    <>
      {isAgencyRoute ? (
        <Suspense fallback={<RouteFallback />}>
          <Agency />
        </Suspense>
      ) : (
        <div className="flex h-screen w-full">
          <Sidebar
            isMobile={isMobile}
            open={sidebarOpen}
            onOpenChange={setSidebarOpen}
            theme={theme}
            toggleTheme={toggleTheme}
          />
          <div className="flex flex-col flex-1 min-w-0">
            {isMobile && (
              <MobileHeader onMenuClick={() => setSidebarOpen(true)} />
            )}
            <main className="flex-1 overflow-auto">
              <ProfileBanner />
              <Suspense fallback={<RouteFallback />}>
                <Switch location={routeLocation}>
                  <Route path="/" component={Home} />
                  <Route path="/people" component={People} />
                  <Route path="/people/:id/edit" component={EditProfile} />
                  <Route path="/people/:id" component={PersonProfile} />
                  <Route path="/ideas" component={Ideas} />
                  <Route path="/ideas/:id" component={IdeaDetail} />
                  <Route path="/map" component={Map} />
                  <Route path="/calendar" component={Calendar} />
                  <Route path="/projects" component={Projects} />
                  <Route path="/intel" component={Intel} />
                  <Route path="/tech-hub" component={TechHub} />
                  <Route path="/students" component={Students} />
                  <Route path="/business/:id" component={BusinessDetail} />
                  <Route path="/business" component={Business} />
                  <Route path="/ai-hub" component={AIHub} />
                  <Route path="/board" component={Board} />
                  <Route path="/orgs/:slug" component={OrgDetail} />
                  <Route path="/orgs" component={Organizations} />
                  <Route path="/showcase" component={Showcase} />
                  <Route path="/launches" component={LaunchBoard} />
                  <Route path="/jobs/:id" component={JobDetail} />
                  <Route path="/jobs" component={Jobs} />
                  <Route path="/conduct" component={Conduct} />
                  <Route path="/digest" component={DigestPreferences} />
                  <Route path="/about" component={About} />
                  <Route path="/admin" component={Admin} />
                  <Route component={NotFound} />
                </Switch>
              </Suspense>
            </main>
          </div>
        </div>
      )}
      <Toaster />
    </>
  );
}
