import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";

// Pages — lazy-load as they're built out
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

export function App() {
  return (
    <>
      <div className="flex h-screen w-full">
        <div className="flex flex-col flex-1 min-w-0">
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={Home} />
              {/* <Route path="/people" component={People} /> */}
              {/* <Route path="/people/:id" component={PersonProfile} /> */}
              {/* <Route path="/ideas" component={Ideas} /> */}
              {/* <Route path="/ideas/:id" component={IdeaDetail} /> */}
              {/* <Route path="/projects" component={Projects} /> */}
              {/* <Route path="/projects/:id" component={ProjectDetail} /> */}
              {/* <Route path="/map" component={Map} /> */}
              {/* <Route path="/calendar" component={Calendar} /> */}
              {/* <Route path="/intel" component={Intel} /> */}
              {/* <Route path="/tech-hub" component={TechHub} /> */}
              {/* <Route path="/students" component={Students} /> */}
              {/* <Route path="/business" component={Business} /> */}
              {/* <Route path="/ai-hub" component={AIHub} /> */}
              {/* <Route path="/admin" component={Admin} /> */}
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
      <Toaster />
    </>
  );
}
