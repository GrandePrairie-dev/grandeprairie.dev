import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="text-center space-y-4">
        <h1 className="text-xl font-display font-bold">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <a className="inline-flex items-center text-sm text-primary hover:underline">
            Go Home
          </a>
        </Link>
      </div>
    </div>
  );
}
