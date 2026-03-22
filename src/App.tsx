import { useState } from "react";
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { useMobile } from "@/hooks/useMobile";
import { useTheme } from "@/hooks/useTheme";

import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import People from "@/pages/People";
import PersonProfile from "@/pages/PersonProfile";
import Ideas from "@/pages/Ideas";
import IdeaDetail from "@/pages/IdeaDetail";
import Map from "@/pages/Map";
import Calendar from "@/pages/Calendar";

export function App() {
  const isMobile = useMobile();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
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
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/people" component={People} />
              <Route path="/people/:id" component={PersonProfile} />
              <Route path="/ideas" component={Ideas} />
              <Route path="/ideas/:id" component={IdeaDetail} />
              <Route path="/map" component={Map} />
              <Route path="/calendar" component={Calendar} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
