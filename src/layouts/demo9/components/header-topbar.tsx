import { useAuth } from '@/auth/context/auth-context';
import { StoreClientTopbar } from '@/pages/store-client/components/common/topbar';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { useLocation } from 'react-router-dom';
import { getInitials } from '@/lib/helpers';

export function HeaderTopbar() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const displayName =
    user?.name ||
    user?.fullname ||
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.username ||
    'User';
  const userInitials = getInitials(displayName, 2) || 'U';

  return (
    <div className="flex items-center gap-2 lg:gap-3.5 lg:w-[400px] justify-end">
      {pathname.startsWith('/store-client') ? (
        <StoreClientTopbar />
      ) : (
        <>
          <div className="flex items-center gap-2 me-0.5">
            {/* <ChatSheet
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="hover:bg-transparent hover:[&_svg]:text-primary"
                >
                  <MessageSquareDot className="size-4.5!" />
                </Button>
              }
            /> */}

            {/* <NotificationsSheet
              trigger={
                <Button
                  variant="ghost"
                  mode="icon"
                  shape="circle"
                  className="hover:bg-transparent hover:[&_svg]:text-primary"
                >
                  <BellIcon className="size-4.5!" />
                </Button>
              }
            /> */}

            <div className="border-e border-border h-5"></div>

            <UserDropdownMenu
              trigger={
                <button
                  type="button"
                  className="ms-2.5 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  aria-label={`Open profile menu for ${displayName}`}
                >
                  {userInitials}
                </button>
              }
            />
          </div>

          {/*   <div className="flex items-center space-x-2">
            <Switch id="auto-update" size="sm" defaultChecked />
            <Label htmlFor="auto-update">Pro</Label>
          </div> */}

          {/*   <div className="border-e border-border h-5"></div> */}

          {/*  <DropdownMenu2
            trigger={
              <Button variant="mono">
                Create
                <ChevronDown />
              </Button>
            }
          /> */}
        </>
      )}
    </div>
  );
}
