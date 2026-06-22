import { Fragment, useState } from 'react';
import { useBot } from '@/hooks/use-bot';
import { useChatBot } from '@/hooks/use-chat-bot';
import { useDashboard } from '@/hooks/use-dashboard';
import { LoaderCircle } from 'lucide-react';
import {
  BlockList,
  ReportSettings,
} from '@/pages/account/security/privacy-settings';
import { EntryCallout, Teams } from '@/pages/dashboards/demo1';
import { Manualbid, Integrations, ManageData, MembersTable, MyBalance, Options, BiddingTable, Statistics, IStatisticsItems, OnboardingFlow } from './components';
import { useSettings } from '@/providers/settings-provider';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Gavel, MessageCircle } from 'lucide-react';

function BidBanner() {
  const { startBot, stopBot, isBidding, action, error } = useBot();

  const isFetching = action === 'fetching';
  const isLoading = action !== null; // covers fetching + starting + stopping

  return (
    <Fragment>
      <style>
        {`
          @keyframes heartbeat {
            0%   { transform: scale(1); }
            14%  { transform: scale(1.12); }
            28%  { transform: scale(1); }
            42%  { transform: scale(1.08); }
            70%  { transform: scale(1); }
            100% { transform: scale(1); }
          }
          .heartbeat-ring {
            animation: heartbeat 1.4s ease-in-out infinite;
          }
          @keyframes orbit {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .orbit-ring {
            animation: orbit 6s linear infinite;
          }
        `}
      </style>

      <Card className="rounded-xl bg-transparent shadow-none border-0">
        <div className="rounded-[1.0rem] bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 p-4 relative overflow-hidden shadow-lg shadow-orange-500/20 group hover:shadow-orange-500/30 transition-all duration-500 flex flex-row items-center justify-between gap-6">
          <img
            src="https://images.unsplash.com/photo-1773751392385-8aa0495f2fbb?auto=format&fit=crop&q=80"
            alt="Premium abstract"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay z-0"
          />
          <div className="absolute z-0 right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/20 to-transparent skew-x-12 translate-x-full group-hover:-translate-x-[50%] transition-transform duration-1000 ease-in-out" />

          {/* Text content */}
          <div className="relative z-0 max-w-2xl">
            {/* Status badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium mb-2 border border-white/20 shadow-sm">
              {isFetching
                ? <LoaderCircle className="w-3 h-3 animate-spin" />
                : <Gavel className="w-3 h-3" />
              }
              <span>
                {isFetching ? 'Checking…' : isBidding ? 'Running' : 'Stopped'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-1">Bidding</h3>
            <p className="text-white/90 text-sm leading-tight">
              Let the Bidvora's neural engine place bids on your behalf.
            </p>

            {/* Error feedback */}
            {error && (
              <p className="mt-2 text-xs text-white/80 bg-red-500/30 rounded-lg px-3 py-1.5">
                {error}
              </p>
            )}

            <div className="mt-4">
              <Button
                onClick={isBidding ? stopBot : startBot}
                disabled={isLoading}
                className={
                  isBidding
                    ? 'rounded-full px-6 bg-white text-orange-500 hover:bg-white/90 border-0'
                    : 'rounded-full px-6 bg-transparent text-white border border-white hover:bg-white/10'
                }
              >
                <span className="flex items-center gap-2">
                  {isLoading && (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  )}
                  {isBidding ? 'Stop Bidding' : 'Start Bidding'}
                </span>
              </Button>
            </div>
          </div>

          {/* Animated orb */}
          <div className="relative z-0 shrink-0 flex justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.08)',
                  opacity: isBidding || isLoading ? 1 : 0.3,
                }}
              />
              {/* Inner icon */}
              <div
                className={`w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner ${isBidding || isLoading ? 'heartbeat-ring' : ''
                  }`}
              >
                {isLoading ? (
                  <LoaderCircle className="w-10 h-10 text-orange-400 animate-spin" />
                ) : (
                  <Gavel className="w-10 h-10 text-orange-500" />
                )}
              </div>
              {/* Orbit ring — visible when bidding is active or loading */}
              {(isBidding || isLoading) && (
                <div className="absolute inset-0 rounded-full border border-white/40 orbit-ring">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white/60 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Fragment>
  );
}
function ChatBanner() {
  const { startChatBot, stopChatBot, isChatBotActive, action, error } = useChatBot();

  const isFetching = action === 'fetching';
  const isLoading = action !== null;

  return (
    <Fragment>
      <style>
        {`
          @keyframes heartbeat {
            0%   { transform: scale(1); }
            14%  { transform: scale(1.12); }
            28%  { transform: scale(1); }
            42%  { transform: scale(1.08); }
            70%  { transform: scale(1); }
            100% { transform: scale(1); }
          }
          .heartbeat-ring {
            animation: heartbeat 1.4s ease-in-out infinite;
          }
          @keyframes orbit {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .orbit-ring {
            animation: orbit 6s linear infinite;
          }
        `}
      </style>

      <Card className="rounded-xl bg-transparent shadow-none border-0">
        <div className="rounded-[1.0rem] bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 p-4 relative overflow-hidden shadow-lg shadow-violet-500/20 group hover:shadow-violet-500/30 transition-all duration-500 flex flex-row items-center justify-between gap-6">
          <img
            src="https://images.unsplash.com/photo-1773751392385-8aa0495f2fbb?auto=format&fit=crop&q=80"
            alt="Premium abstract"
            className="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-overlay"
          />
          <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-white/20 to-transparent skew-x-12 translate-x-full group-hover:-translate-x-[50%] transition-transform duration-1000 ease-in-out" />

          {/* Text content */}
          <div className="relative z-0 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium mb-2 border border-white/20 shadow-sm">
              {isFetching
                ? <LoaderCircle className="w-3 h-3 animate-spin" />
                : <MessageCircle className="w-3 h-3" />
              }
              <span>{isFetching ? 'Checking…' : isChatBotActive ? 'Running' : 'Stopped'}</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Chat Agent</h3>
            <p className="text-white/90 text-sm leading-tight">
              Let the Bidvora's chat agent handle your customer chats.
            </p>

            {/* Error feedback */}
            {error && (
              <p className="mt-2 text-xs text-white/80 bg-red-500/30 rounded-lg px-3 py-1.5">
                {error}
              </p>
            )}

            <div className="mt-4">
              <Button
                onClick={isChatBotActive ? stopChatBot : startChatBot}
                disabled={isLoading}
                className={
                  isChatBotActive
                    ? 'rounded-full px-6 bg-white text-violet-600 hover:bg-white/90 border-0'
                    : 'rounded-full px-6 bg-transparent text-white border border-white hover:bg-white/10'
                }
              >
                <span className="flex items-center gap-2">
                  {isLoading && (
                    <LoaderCircle className="w-4 h-4 animate-spin" />
                  )}
                  {isChatBotActive ? 'Stop Agent' : 'Start Agent'}
                </span>
              </Button>
            </div>
          </div>

          {/* Animated orb */}
          <div className="relative z-0 shrink-0 flex justify-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full blur-2xl transition-opacity duration-500"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.08)',
                  opacity: isChatBotActive || isLoading ? 1 : 0.3,
                }}
              />
              {/* Inner icon */}
              <div
                className={`w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner ${isChatBotActive || isLoading ? 'heartbeat-ring' : ''}`}
              >
                {isLoading ? (
                  <LoaderCircle className="w-10 h-10 text-violet-400 animate-spin" />
                ) : (
                  <MessageCircle className="w-10 h-10 text-violet-600" />
                )}
              </div>
              {/* Orbit ring — hidden when not active and not loading */}
              {(isChatBotActive || isLoading) && (
                <div className="absolute inset-0 rounded-full border border-white/40 orbit-ring">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white/60 rounded-full" />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Fragment>
  );
}


export function Demo2Content() {
  const { settings } = useSettings();
  const isDemo9 = settings?.layout === 'demo9';
  const { data: dashboardData, isLoading, refetch } = useDashboard();

  const demo9Statistics: IStatisticsItems = [
    { image: 'bid.png', number: '1,200', label: 'Total Bids' },
    { image: 'hammer.png', number: '800', label: 'Won Bids' },
    { image: 'freelancer.svg', number: '200', label: 'Active Projects' },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-10"><LoaderCircle className="w-8 h-8 animate-spin" /></div>;
  }

  if (dashboardData && !dashboardData.isFreelancerConnected) {
    return <OnboardingFlow onComplete={() => refetch()} />;
  }

  return (
    <div className="grid gap-5 lg:gap-7.5">

      <div className="grid lg:grid-cols-3 gap-y-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-3 flex flex-col gap-5 lg:gap-5">
          <Integrations isFreelancerConnected={dashboardData?.isFreelancerConnected ?? false} onConnected={() => refetch()} />
        </div>
        <div className="lg:col-span-2 flex flex-col gap-5 lg:gap-5">

          {isDemo9 && <Statistics details={demo9Statistics} />}
          <BiddingTable />

        </div>
        <div className="lg:col-span-1 flex flex-col gap-2">
          {isDemo9 && <BidBanner />}
          {isDemo9 && <ChatBanner />}
          <Manualbid
            className="h-full mt-4"
            text="Fetches details, generates AI proposal, and places bid immediately."
          />
          {/*  <MyBalance className="h-full" /> */}
        </div>
      </div>
      {/* <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-2">
          <EntryCallout className="h-full" />
        </div>
        <div className="lg:col-span-1">
          <ReportSettings className="h-full" />
        </div>
      </div> */}
      {/*  <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-2">
          <Integrations />
        </div>
        <div className="lg:col-span-1">
          <BlockList
            className="h-full"
            text="Users on the block list are unable to send chat requests or messages to you anymore, ever, or again"
          />
        </div>
      </div> */}
      {/*  <div className="grid lg:grid-cols-3 gap-5 lg:gap-7.5 items-stretch">
        <div className="lg:col-span-2">
          <MembersTable />
        </div>
        <div className="lg:col-span-1">
          <ManageData className="h-full" />
        </div>
      </div> */}


    </div>
  );
}
