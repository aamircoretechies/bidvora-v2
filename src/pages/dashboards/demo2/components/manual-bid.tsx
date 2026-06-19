import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useManualBid } from '@/hooks/use-manual-bid';
import { toast } from 'sonner';
import { LoaderCircle } from 'lucide-react';

interface IManualbidItem {
  avatar: string;
  name: string;
  commits: number;
}
type IManualbidItems = Array<IManualbidItem>;

interface IManualbidProps {
  text: string;
  limit?: number;
  className?: string;
}

const Manualbid = ({ text, limit, className }: IManualbidProps) => {
  const [projectIdInput, setProjectIdInput] = useState('');
  const { placeBid, isLoading } = useManualBid();

  const handleSearch = async () => {
    const id = parseInt(projectIdInput.trim(), 10);
    if (isNaN(id)) {
      toast.error('Please enter a valid Project ID (number).');
      return;
    }

    try {
      await placeBid(id);
      toast.success(`Manual bid placed successfully for Project ID ${id}`);
      setProjectIdInput('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place manual bid');
    }
  };

  const items: IManualbidItems = [
    {
      avatar: 'gray/1.png',
      name: 'Esther Howard',
      commits: 6,
    },
    {
      avatar: 'gray/2.png',
      name: 'Tyler Hero',
      commits: 29,
    },
    {
      avatar: 'gray/3.png',
      name: 'Arlene McCoy',
      commits: 34,
    },
    {
      avatar: 'gray/4.png',
      name: 'Cody Fisher',
      commits: 1,
    },
  ];

  const renderItem = (item: IManualbidItem, index: number) => {
    return (
      <div key={index} className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9">
            <AvatarImage
              src={toAbsoluteUrl(`/media/avatars/${item.avatar}`)}
              alt="image"
            />
            <AvatarFallback>CH</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            <Link
              to="/public-profile/teams"
              className="flex items-center gap-1.5 leading-none font-medium text-sm text-mono hover:text-primary"
            >
              {item.name}
            </Link>
            <span className="text-sm text-secondary-foreground">
              {item.commits} commit{item.commits > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="ghost" mode="icon">
            <Trash2 />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Manual Bid</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="text-sm text-foreground">{text}</div>
        <div className="flex items-center">
          <Input
            type="text"
            placeholder="Enter Project ID"
            value={projectIdInput}
            onChange={(e) => setProjectIdInput(e.target.value)}
            className="rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0"
            disabled={isLoading}
          />
          <Button 
            className="rounded-l-none border-l-0" 
            onClick={handleSearch}
            disabled={isLoading || !projectIdInput.trim()}
          >
            {isLoading ? <LoaderCircle className="animate-spin size-4" /> : 'Search'}
          </Button>
        </div>
        {/*  <div className="flex flex-col gap-5">
          {items.map((item, index) => {
            if (limit === undefined || index < limit) {
              return renderItem(item, index);
            }
            return null;
          })}
        </div> */}
      </CardContent>
    </Card>
  );
};

export {
  Manualbid,
  type IManualbidItem,
  type IManualbidItems,
  type IManualbidProps,
};
