import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import config from "@/config";
import { LogOut, Settings, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import UserIcon from "@/public/user-icon.webp";

export function UserProfile() {
  const session = useSession();
  const isAdmin = session.data?.user?.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className="w-[2.25rem] h-[2.25rem]">
        <Avatar>
          <Image
            src={session.data?.user?.image || UserIcon}
            alt="User Profile"
            width={100}
            height={100}
            className="object-cover rounded-full"
            priority
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard/profile">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
              <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard/settings">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
              <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
            </DropdownMenuItem>
          </Link>
          {isAdmin && (
            <Link href="/admin">
              <DropdownMenuItem>
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            </Link>
          )}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
          <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
