import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const limiters = {
  generate: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1h'),
  }),
  'ai-check': new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1h'),
  }),
  humanize: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(50, '1h'),
  }),
}

export async function checkRateLimit(userId: string, tool = 'generate') {
  const limiter = limiters[tool as keyof typeof limiters] || limiters.generate
  return limiter.limit(userId)
}