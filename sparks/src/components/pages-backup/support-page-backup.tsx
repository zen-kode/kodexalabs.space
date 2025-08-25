import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Bot, Palette } from 'lucide-react';

const changelog = [
  {
    version: '1.2.0',
    date: '2024-07-28',
    title: 'The "Phoenix" Update',
    changes: [
      {
        category: 'New Feature',
        description: 'Introduced a comprehensive UI/UX overhaul for a more intuitive and polished experience.',
        icon: Palette,
      },
      {
        category: 'Enhancement',
        description: 'Redesigned the AI Tools Dock in the Playground for better usability and a modern look.',
        icon: Bot,
      },
       {
        category: 'New Page',
        description: 'Added this beautiful "What\'s New" changelog page to keep you updated!',
        icon: Rocket,
      },
    ],
  },
  {
    version: '1.1.0',
    date: '2024-07-26',
    title: 'Foundation & Sparks',
    changes: [
      {
        category: 'New Feature',
        description: 'Initial release of Sparks, the ultimate AI prompt engineering toolkit.',
        icon: Rocket,
      },
      {
        category: 'Enhancement',
        description: 'Enabled Firebase integration for future scalability and new features.',
        icon: Bot,
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="font-headline text-4xl font-bold tracking-tight">
          What&apos;s New
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Stay up-to-date with the latest features and improvements.
        </p>
      </div>
      <div className="space-y-12 relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border -z-10" />
        {changelog.map((release) => (
          <div key={release.version} className="relative">
            <div className="flex items-center gap-4">
              <div className="bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center font-bold z-10">
                v{release.version.split('.')[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{release.title}</h2>
                <p className="text-muted-foreground">{new Date(release.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div className="mt-6 space-y-4 pl-14">
              {release.changes.map((change, index) => (
                <Card key={index} className="flex items-start gap-4 p-4">
                  <div className="bg-accent/20 text-accent p-2 rounded-md">
                    <change.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <Badge variant={change.category === 'New Feature' ? 'default' : 'secondary'}>{change.category}</Badge>
                    <p className="mt-1 text-muted-foreground">{change.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
