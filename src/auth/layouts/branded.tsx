import { Link, Outlet } from 'react-router-dom';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Activity, Gavel, FileText, CheckCircle2 } from 'lucide-react';

export function BrandedLayout() {
  return (
    <>
      <style>
        {`
          .branded-bg {
            background-color: #0A0F1C;
            background-image: 
              radial-gradient(circle at 50% 0%, rgba(28, 55, 90, 0.5) 0%, transparent 70%),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 40px 40px, 40px 40px;
            background-position: center, 0 0, 0 0;
          }
          .dark .branded-bg {
            background-color: #0A0F1C;
            background-image: 
              radial-gradient(circle at 50% 0%, rgba(28, 55, 90, 0.5) 0%, transparent 70%),
              linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
            background-size: 100% 100%, 40px 40px, 40px 40px;
            background-position: center, 0 0, 0 0;
          }
        `}
      </style>
      <div className="grid lg:grid-cols-2 grow bg-[#eef0f6] dark:bg-[#16161a]">

        <div className="lg:rounded-xl lg:border lg:border-border lg:m-5 order-1 lg:order-1 bg-top xxl:bg-center xl:bg-cover bg-no-repeat branded-bg">
          <div className="flex flex-col p-8 lg:p-16 h-full min-h-[600px] relative">
            <Link to="/">
              <img
                src={toAbsoluteUrl('/media/app/mini-logo-circle.svg')}
                className="h-[64px] max-w-none"
                alt=""
              />
            </Link>

            <div className="flex flex-col gap-6 mt-12">
              <h1 className="text-4xl lg:text-[3rem] leading-none font-bold text-white tracking-tight">
                Welcome to Bidvora
              </h1>
              <p className="text-[1.1rem] font-medium text-[#8F9BB3] max-w-md leading-relaxed">
                Continue where you left off and manage your auctions, bids, and documents seamlessly.
              </p>

              <div className="flex flex-col gap-5 mt-6">
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1A2642] border border-[#223255]">
                    <ShieldCheck className="w-5 h-5 text-[#3375FF]" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-wide">Secure Access</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1A2642] border border-[#223255]">
                    <Activity className="w-5 h-5 text-[#3375FF]" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-wide">Real-Time Updates</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1A2642] border border-[#223255]">
                    <Gavel className="w-5 h-5 text-[#3375FF]" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-wide">Easy Bid Management</span>
                </div>
                <div className="flex items-center gap-5">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[#1A2642] border border-[#223255]">
                    <FileText className="w-5 h-5 text-[#3375FF]" />
                  </div>
                  <span className="text-xl font-bold text-white tracking-wide">Document Tracking</span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-16 flex items-center gap-3 text-base font-medium text-white">
              <CheckCircle2 className="w-5 h-5 text-[#00E5A3]" />
              Enterprise-grade security and reliability
            </div>
          </div>
        </div>

        <div className="flex justify-center items-center p-8 lg:p-10 order-2 lg:order-2">
          <Card className="w-full max-w-[400px]">
            <CardContent className="p-6">
              <Outlet />
            </CardContent>
          </Card>
        </div>


      </div>
    </>
  );
}
