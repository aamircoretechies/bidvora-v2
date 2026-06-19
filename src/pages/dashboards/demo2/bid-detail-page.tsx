import { useLocation, useNavigate, useParams } from 'react-router';
import { Container } from '@/components/common/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { RiCheckboxCircleFill } from '@remixicon/react';
import {
  FileText,
  CreditCard,
  Briefcase,
  Clock,
  Globe,
  Tag,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  ChevronRight,
  MessageSquare,
  Copy,
  CheckCircle,
  FolderOpen
} from 'lucide-react';
import { IBid } from '@/services/bids.service';
import { useMemo } from 'react';

const BidDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bid = location.state?.bid as IBid;
  const { copyToClipboard } = useCopyToClipboard();

  // If no bid is found in state, we could fetch it, but for now we redirect back
  if (!bid) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-muted-foreground">Bid details not found.</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </Container>
    );
  }

  const handleCopy = (text: string) => {
    copyToClipboard(text);
    toast.custom(
      (t) => (
        <Alert variant="mono" icon="success" close={false} onClose={() => toast.dismiss(t)}>
          <AlertIcon>
            <RiCheckboxCircleFill />
          </AlertIcon>
          <AlertTitle>Copied to clipboard!</AlertTitle>
        </Alert>
      ),
      { position: 'top-center' }
    );
  };

  const formattedDate = useMemo(() => {
    const date = new Date(bid.createdAt);
    if (isNaN(date.getTime())) return bid.createdAt;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [bid.createdAt]);

  const questions = useMemo(() => {
    if (!bid.questions) return [];
    try {
      const parsed = JSON.parse(bid.questions);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // ignore
    }
    return bid.questions.split('\n').filter((q) => q.trim().length > 0);
  }, [bid.questions]);

  const skillsList = useMemo(() => {
    if (!bid.skills) return [];
    return bid.skills.split(',').map((s) => s.trim()).filter(Boolean);
  }, [bid.skills]);

  const statusStr = bid.status?.toLowerCase() || '';
  let statusVariant: 'success' | 'destructive' | 'warning' | 'secondary' = 'secondary';
  if (statusStr === 'success' || statusStr === 'completed') statusVariant = 'success';
  else if (statusStr === 'failed' || statusStr === 'rejected') statusVariant = 'destructive';
  else if (statusStr === 'action required' || statusStr === 'pending') statusVariant = 'warning';

  return (
    <Container>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-7.5">

        {/* LEFT COLUMN */}
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-5 lg:gap-7.5">

          {/* BID OVERVIEW */}
          <Card>
            <CardHeader className="border-none pb-0">
              <div className="flex w-full items-center gap-2 mb-0 pt-4">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Bid Overview</h3>
              </div>
              <div className="flex flex-start gap-2 mb-0 pt-0">
                <h1 className=" text-2xl font-semibold text-foreground mb-2">{bid.title}</h1>
              </div>
              <div className="flex flex-wrap items-center text-xs text-muted-foreground mt-0">
                <div className="flex items-center gap-1.5 pe-4">
                  <Tag className="size-3.5" />
                  <span>Bid ID: {bid.id}</span>
                </div>
                <div className="flex items-center gap-1.5 px-4 border-l border-border/50">
                  <FolderOpen className="size-3.5" />
                  <span>Project ID: {bid.projectId}</span>
                </div>
                <div className="flex items-center gap-1.5 px-4 border-l border-border/50">
                  <Clock className="size-3.5" />
                  <span>Created: {formattedDate}</span>
                </div>
                <div className="flex items-center gap-2 ps-4 ms-auto border-l border-border/50">
                  <span>Status:</span>
                  <Badge variant={statusVariant} appearance="light" className="capitalize">
                    {bid.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <Card className='bg-secondary/10'>
                <CardContent className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                        <CreditCard className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                        <p className="text-sm font-semibold">{bid.currency} {bid.amount}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-violet-600/10 text-violet-600">
                        <Briefcase className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Bid Type</p>
                        <p className="text-sm font-semibold capitalize">{bid.bidType}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-emerald-500/10 text-emerald-500">
                        <Clock className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Delivery Period</p>
                        <p className="text-sm font-semibold">{bid.period} Days</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center size-10 rounded-lg bg-amber-500/10 text-amber-500">
                        <Globe className="size-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Country</p>
                        <p className="text-sm font-semibold truncate max-w-[100px]" title={bid.country}>{bid.country}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* SKILLS */}
          <Card>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Tag className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Skills</h3>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex flex-wrap gap-2">
                {skillsList.length > 0 ? (
                  skillsList.map((skill, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1 rounded-full text-xs font-medium border-border/50 bg-accent/50 text-foreground flex items-center gap-1.5">
                      <span className="size-1.5 rounded-full bg-primary" />
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No skills listed.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* PROPOSAL */}
          <Card>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Proposal</h3>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                {bid.proposal || 'No proposal text available.'}
              </p>
            </CardContent>
          </Card>

          {/* QUESTIONS */}
          <Card>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <HelpCircle className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Clarification Questions</h3>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-6">
                Copy these questions and paste them on the Freelancer project board to engage the client.
              </p>
              <div className="flex flex-col">
                {questions.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No questions available.</p>
                ) : (
                  questions.map((q, index) => (
                    <div
                      key={index}
                      className={`flex flex-row items-start justify-between gap-6 py-4 ${index !== questions.length - 1 ? 'border-b border-border' : ''
                        }`}
                    >
                      <p className="text-sm leading-relaxed text-foreground">{q}</p>
                      <Button variant="outline" size="sm" onClick={() => handleCopy(q)} className="shrink-0 gap-1.5 h-8">
                        <Copy className="size-3.5" />
                        Copy
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-1 flex flex-col gap-5 lg:gap-7.5">

          {/* BID STATUS CARD */}
          <Card className={`overflow-hidden border-0 relative ${statusVariant === 'success' ? 'bg-emerald-600' : statusVariant === 'destructive' ? 'bg-red-600' : 'bg-primary'}`}>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <CardContent className="p-6 relative z-10 text-white">
              <div className="flex items-center gap-2 mb-6 opacity-90">
                <TrendingUp className="size-4" />
                <span className="text-sm font-medium">Bid Status</span>
              </div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs opacity-80 mb-1">Status</p>
                  <h2 className="text-2xl font-bold capitalize tracking-wide">{bid.status || 'Unknown'}</h2>
                  <p className="text-sm opacity-90 mt-1">Bid Submitted</p>
                </div>
                <div className="relative flex items-center justify-center size-16">
                  <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_4s_linear_infinite]" />
                  <div className="absolute inset-2 bg-white/10 rounded-full" />
                  <ShieldCheck className="size-8 text-white relative z-10" />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full bg-white text-black hover:bg-white/90 border-0 shadow-sm"
                onClick={() => window.open(`https://www.freelancer.com/projects/${bid.projectId}`, '_blank')}
              >
                Open Project
                <ChevronRight className="size-4 ml-1" />
              </Button>
            </CardContent>
          </Card>

          {/* PROJECT SNAPSHOT */}
          <Card>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Project Snapshot</h3>
              </div>
            </CardHeader>
            <CardContent className="p-5 flex flex-col gap-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Project ID</span>
                <span className="font-medium text-foreground">{bid.projectId}</span>
              </div>
              <div className="w-full h-px bg-border/50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium text-foreground">{bid.currency} {bid.amount}</span>
              </div>
              <div className="w-full h-px bg-border/50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Type</span>
                <Badge className="bg-violet-600 hover:bg-violet-600 text-white border-0 capitalize">
                  {bid.bidType}
                </Badge>
              </div>
              <div className="w-full h-px bg-border/50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Country</span>
                <span className="font-medium text-foreground">{bid.country}</span>
              </div>
              <div className="w-full h-px bg-border/50" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Posted / Created</span>
                <span className="font-medium text-foreground">{formattedDate.split(',')[0]}</span>
              </div>
            </CardContent>
          </Card>

          {/* NEXT ACTIONS */}
          <Card>
            <CardHeader className="py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <Zap className="size-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">Next Actions</h3>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-8 rounded-full bg-blue-500 text-white shrink-0">
                      <MessageSquare className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Review and respond to client messages</p>
                      <p className="text-xs text-muted-foreground">Check the project board for any updates.</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>

                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-colors border-b border-border/50">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-8 rounded-full bg-blue-500 text-white shrink-0">
                      <Copy className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Copy clarification questions</p>
                      <p className="text-xs text-muted-foreground">Use them to engage the client effectively.</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>

                <div className="flex items-center justify-between p-5 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center size-8 rounded-full bg-blue-500 text-white shrink-0">
                      <CheckCircle className="size-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Track bid outcome</p>
                      <p className="text-xs text-muted-foreground">Monitor status and stay notified.</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </Container>
  );
};

export { BidDetailPage };
