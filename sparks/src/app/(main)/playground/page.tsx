import PlaygroundClient from '@/components/playground/playground-client';
import { Button } from '@/components/ui/button';

export default function PlaygroundPage() {
  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Playground</h1>
        <Button>Save to Library</Button>
      </div>
      <div className="flex-1">
        <PlaygroundClient />
      </div>
    </div>
  );
}
