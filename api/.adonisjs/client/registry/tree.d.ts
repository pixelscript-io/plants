/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  docs: {
    spec: typeof routes['docs.spec']
    ui: typeof routes['docs.ui']
  }
  auth: {
    newAccount: {
      store: typeof routes['auth.new_account.store']
    }
    accessTokens: {
      store: typeof routes['auth.access_tokens.store']
    }
    emailVerification: {
      verify: typeof routes['auth.email_verification.verify']
    }
    passwordReset: {
      forgot: typeof routes['auth.password_reset.forgot']
      reset: typeof routes['auth.password_reset.reset']
    }
  }
  profile: {
    profile: {
      show: typeof routes['profile.profile.show']
    }
    accessTokens: {
      destroy: typeof routes['profile.access_tokens.destroy']
    }
    emailVerification: {
      resend: typeof routes['profile.email_verification.resend']
    }
    apiKeys: {
      index: typeof routes['profile.api_keys.index']
      store: typeof routes['profile.api_keys.store']
      destroy: typeof routes['profile.api_keys.destroy']
      usage: typeof routes['profile.api_keys.usage']
    }
  }
  health: {
    live: typeof routes['health.live']
    ready: typeof routes['health.ready']
  }
  status: {
    show: typeof routes['status.show']
  }
  explorer: {
    plants: {
      index: typeof routes['explorer.plants.index']
      show: typeof routes['explorer.plants.show']
    }
    calendar: {
      show: typeof routes['explorer.calendar.show']
    }
  }
  plants: {
    plants: {
      index: typeof routes['plants.plants.index']
      show: typeof routes['plants.plants.show']
    }
  }
  climate: {
    moon: {
      show: typeof routes['climate.moon.show']
      phases: typeof routes['climate.moon.phases']
    }
    frost: {
      show: typeof routes['climate.frost.show']
    }
    hardiness: {
      show: typeof routes['climate.hardiness.show']
    }
    calendar: {
      show: typeof routes['climate.calendar.show']
    }
  }
}
