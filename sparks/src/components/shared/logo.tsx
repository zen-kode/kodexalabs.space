import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';
import * as React from 'react';

const Logo = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => {
  return (
    <div className={cn('p-2 bg-primary/20 rounded-lg text-primary', className)}>
        <Sparkles ref={ref} {...props} />
    </div>
  );
});

Logo.displayName = 'Logo';
export default Logo;
