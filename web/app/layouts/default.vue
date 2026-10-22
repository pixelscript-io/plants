<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger class="-ml-1" />
        <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink as-child>
                <NuxtLink to="/">Plants API</NuxtLink>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator class="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{{ title }}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div class="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <main class="flex-1 p-4 md:p-6">
        <div class="mx-auto w-full max-w-6xl">
          <VerifyEmailBanner />
          <slot />
        </div>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>

<script setup lang="ts">
const route = useRoute()
const title = computed(() => (route.meta.title as string | undefined) ?? 'Dashboard')
</script>
