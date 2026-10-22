import vine from '@vinejs/vine'

export const createApiKeyValidator = vine.create({
  name: vine.string().trim().minLength(1).maxLength(60),
})

export const apiKeyUsageValidator = vine.create({
  days: vine.number().min(1).max(90).optional(),
})
