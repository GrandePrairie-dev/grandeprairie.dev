import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const USE_CASES = [
  { title: "Field Data Collection", desc: "Replace paper forms with AI-powered mobile data capture for oil & gas inspections.", tags: ["Oil & Gas", "Mobile", "OCR"] },
  { title: "Predictive Maintenance", desc: "Use sensor data and ML models to predict equipment failures before they happen.", tags: ["ML", "IoT", "Industrial"] },
  { title: "Crop Yield Optimization", desc: "Satellite imagery + weather data to help Peace Region farmers optimize planting.", tags: ["AgTech", "Computer Vision", "Data"] },
  { title: "Customer Service Automation", desc: "AI chatbots for local businesses to handle common inquiries 24/7.", tags: ["NLP", "Chatbot", "Small Business"] },
  { title: "Safety Compliance Monitoring", desc: "Computer vision systems for PPE detection and safety zone monitoring on job sites.", tags: ["Safety", "CV", "Construction"] },
  { title: "Supply Chain Optimization", desc: "ML-driven logistics planning for Northern Alberta supply chain challenges.", tags: ["Logistics", "ML", "Optimization"] },
];

export default function AIHub() {
  return (
    <div className="p-4 md:p-6 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-xl font-display font-bold">AI Hub</h1>
        <p className="text-sm text-muted-foreground">
          AI opportunities for Grande Prairie and the Peace Region. Real use cases for local industries — not Silicon Valley hype.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-display font-semibold">Use Cases</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {USE_CASES.map((uc, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <h3 className="font-semibold text-sm">{uc.title}</h3>
                <p className="text-sm text-muted-foreground">{uc.desc}</p>
                <div className="flex flex-wrap gap-1">
                  {uc.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-display font-semibold">Find a Builder</h2>
        <p className="text-sm text-muted-foreground">Browse community members with AI and ML skills.</p>
        <Link href="/people">
          <Button variant="outline">Browse Builders →</Button>
        </Link>
      </section>
    </div>
  );
}
