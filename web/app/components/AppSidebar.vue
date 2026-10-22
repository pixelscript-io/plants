<template>
  <Sidebar collapsible="icon">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <LeafIcon class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">Plants API</span>
                <span class="truncate text-xs">Developer dashboard</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>

    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Platform</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem v-for="item in nav" :key="item.to">
            <SidebarMenuButton as-child :tooltip="item.title" :is-active="isActive(item.to)">
              <NuxtLink :to="item.to">
                <component :is="item.icon" />
                <span>{{ item.title }}</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Resources</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as-child tooltip="API status">
              <NuxtLink to="/status">
                <ActivityIcon />
                <span>API status</span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton as-child tooltip="API reference">
              <a :href="docsUrl" target="_blank" rel="noopener">
                <BookOpenIcon />
                <span>API reference</span>
                <ExternalLinkIcon class="ml-auto size-3.5 opacity-60" />
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>

    <SidebarFooter>
      <NavUser />
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import {
  ActivityIcon,
  BookOpenIcon,
  ChartColumnIcon,
  ExternalLinkIcon,
  KeyRoundIcon,
  LayoutDashboardIcon,
  LeafIcon,
  SproutIcon,
  UserRoundIcon,
} from '@lucide/vue'

const route = useRoute()
const docsUrl = useRuntimeConfig().public.docsUrl

const nav = [
  { title: 'Overview', to: '/', icon: LayoutDashboardIcon },
  { title: 'API keys', to: '/keys', icon: KeyRoundIcon },
  { title: 'Plant explorer', to: '/plants', icon: SproutIcon },
  { title: 'Usage', to: '/usage', icon: ChartColumnIcon },
  { title: 'Account', to: '/account', icon: UserRoundIcon },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>
