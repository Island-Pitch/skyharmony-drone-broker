import { PostHog } from 'posthog-node';

const apiKey = process.env.POSTHOG_API_KEY;

const posthog: PostHog = apiKey
  ? new PostHog(apiKey, {
      host: process.env.POSTHOG_HOST,
      enableExceptionAutocapture: true,
    })
  : ({ capture() {}, captureException() {}, identify() {}, shutdown() {}, flush() {} } as unknown as PostHog);

export default posthog;
