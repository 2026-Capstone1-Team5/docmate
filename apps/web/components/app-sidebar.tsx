"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import { Home, FileSearch, Files, Key, Settings, Plus } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Parse",
    url: "/upload",
    icon: FileSearch,
  },
  {
    title: "Documents",
    url: "/documents",
    icon: Files,
  },
]

const subItems = [
  {
    title: "API Keys",
    url: "#",
    icon: Key,
    badge: "Soon",
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    badge: "Later",
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-200 dark:border-zinc-800">
      <SidebarHeader className="px-2 py-4">
        <div className="px-2">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          >
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
              <Image
                src="/brand-logo.svg"
                alt="DocMate"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
            </div>
            <div className="flex min-w-0 items-center group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-bold">DocMate</span>
            </div>
          </Link>
        </div>
        <div className="mt-4 px-2 group-data-[collapsible=icon]:px-0">
          <SidebarMenuButton 
            render={<Link href="/upload" />} 
            tooltip="New Upload"
            className={cn(
              "h-10 w-full justify-center rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:p-0!",
              pathname === "/upload" && "shadow-lg ring-2 ring-primary/20"
            )}
          >
            <Plus className="h-4 w-4" />
            <span className="font-semibold text-sm group-data-[collapsible=icon]:hidden">New Upload</span>
          </SidebarMenuButton>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 group-data-[collapsible=icon]:px-1.5">
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.url
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    render={<Link href={item.url} />} 
                    tooltip={item.title}
                    className={cn(
                      "h-10 rounded-lg px-4 transition-all group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!",
                      isActive 
                        ? "bg-white dark:bg-zinc-800 shadow-md text-primary font-bold border border-zinc-100 dark:border-zinc-700" 
                        : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                  >
                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-zinc-400")} />
                    <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-4">
          <SidebarMenu>
            {subItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  render={<Link href={item.url} />} 
                  tooltip={item.title}
                  className="h-10 rounded-lg px-4 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!"
                >
                  <item.icon className="h-4 w-4 text-zinc-400" />
                  <span className="flex-1 group-data-[collapsible=icon]:hidden">{item.title}</span>
                  {item.badge && (
                    <Badge variant="outline" className="h-4 border-zinc-200 bg-zinc-50 px-1 text-[10px] leading-none text-zinc-500 group-data-[collapsible=icon]:hidden">
                      {item.badge}
                    </Badge>
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 group-data-[collapsible=icon]:p-2">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar className="h-9 w-9 border border-zinc-200">
            <AvatarImage src="" />
            <AvatarFallback className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">N</AvatarFallback>
          </Avatar>
          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-semibold truncate">Guest User</span>
            <span className="text-[10px] text-zinc-500 truncate">로그인 기능 연결 예정</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
