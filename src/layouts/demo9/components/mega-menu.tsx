import { MegaMenuSubAccount } from '@/partials/mega-menu/mega-menu-sub-account';
import { MegaMenuSubAuth } from '@/partials/mega-menu/mega-menu-sub-auth';
import { MegaMenuSubSettings } from '@/partials/mega-menu/mega-menu-sub-settings'
import { MegaMenuSubNetwork } from '@/partials/mega-menu/mega-menu-sub-network';
import { MegaMenuSubProfiles } from '@/partials/mega-menu/mega-menu-sub-profiles';
import { MegaMenuSubStore } from '@/partials/mega-menu/mega-menu-sub-store';
import { Link, useLocation } from 'react-router-dom';
import { MENU_MEGA } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';
import { useDashboard } from '@/hooks/use-dashboard';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Home, MessageCircle, CreditCard, DollarSign, Bot, Crown } from 'lucide-react';

export function MegaMenu() {
  const { pathname } = useLocation();
  const { isActive, hasActiveChild } = useMenu(pathname);
  const { data: dashboardData } = useDashboard();
  const homeItem = MENU_MEGA[0];
  const publicProfilesItem = MENU_MEGA[1];
  const myAccountItem = MENU_MEGA[2];
  const networkItem = MENU_MEGA[3];
  const authItem = MENU_MEGA[4];
  const storeItem = MENU_MEGA[5];
  const chatsItem = MENU_MEGA[6];
  const subscriptionItem = MENU_MEGA[7];
  const planItem = MENU_MEGA[10];
  const biddingItem = MENU_MEGA[8];
  const aiItem = MENU_MEGA[9];
  const settingsItem = MENU_MEGA[10];
  const linkClass = `
    inline-flex flex-row items-center h-12 py-0 border-b border-transparent rounded-none bg-transparent -mb-[1px]
    text-sm text-white/80 font-medium 
    hover:text-white hover:bg-transparent 
    focus:text-white focus:bg-transparent 
    data-[active=true]:text-white data-[active=true]:bg-transparent data-[active=true]:border-white 
    data-[here=true]:text-white data-[here=true]:bg-transparent data-[here=true]:border-white 
    data-[state=open]:text-white data-[state=open]:bg-transparent 
  `;

  return (
    <NavigationMenu viewport={false}>
      <NavigationMenuList className="gap-2">
        {/* Home Item */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to={homeItem.path || '/'}
              className={cn(linkClass)}
              data-active={isActive(homeItem.path) || undefined}
            >
              <Home className="w-5 h-5 me-1" />
              {homeItem.title}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Public Profiles Item */}
        {/* <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={
              hasActiveChild(publicProfilesItem.children) || undefined
            }
          >
            {publicProfilesItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <MegaMenuSubProfiles items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

        {/* My Account Item */}
        {/*  <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={hasActiveChild(myAccountItem.children) || undefined}
          >
            {myAccountItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <MegaMenuSubAccount items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

        {/* Network Item */}
        {/*  <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={
              hasActiveChild(networkItem.children || []) || undefined
            }
          >
            {networkItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <MegaMenuSubNetwork items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

        {/* Store Item */}
        {/*  <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={hasActiveChild(storeItem.children || []) || undefined}
          >
            {storeItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <MegaMenuSubStore items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

        {/* Authentication Item */}
        {/*  <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={hasActiveChild(authItem.children) || undefined}
          >
            {authItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0">
            <MegaMenuSubAuth items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

        {/* Chats Item */}
        {/*  <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to={chatsItem.path || '/'}
              className={cn(linkClass)}
              data-active={isActive(chatsItem.path) || undefined}
            >
              <MessageCircle className="w-5 h-5 me-1" />
              {chatsItem.title}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem> */}

        {/* Subscription Item */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to={subscriptionItem.path || '/'}
              className={cn(linkClass)}
              data-active={isActive(subscriptionItem.path) || undefined}
            >
              <Crown className="w-5 h-5 me-1" />
              {subscriptionItem.title}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Bidding Item */}
        {dashboardData?.isFreelancerConnected && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to={biddingItem.path || '/'}
                className={cn(linkClass)}
                data-active={isActive(biddingItem.path) || undefined}
              >
                <DollarSign className="w-5 h-5 me-1" />
                {biddingItem.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}

        {/* AI Item */}
        {dashboardData?.isFreelancerConnected && (
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                to={aiItem.path || '/'}
                className={cn(linkClass)}
                data-active={isActive(aiItem.path) || undefined}
              >
                <Bot className="w-5 h-5 me-1" />
                {aiItem.title}
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to={planItem.path || '/'}
              className={cn(linkClass)}
              data-active={isActive(planItem.path) || undefined}
            >
              <CreditCard className="w-5 h-5 me-1" />
              {planItem.title}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>



        {/*
        <NavigationMenuItem>
          <NavigationMenuTrigger
            className={cn(linkClass)}
            data-active={hasActiveChild(settingsItem.children) || undefined}
          >
            {settingsItem.title}
          </NavigationMenuTrigger>
          <NavigationMenuContent className="p-0 right-0 left-auto">
            <MegaMenuSubSettings items={MENU_MEGA} />
          </NavigationMenuContent>
        </NavigationMenuItem> */}

      </NavigationMenuList>
    </NavigationMenu>
  );
}
