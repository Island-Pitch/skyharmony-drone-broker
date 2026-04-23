import { PostHog } from 'posthog-node';

const apiKey = process.env.POSTHOG_API_KEY;
const host = process.env.POSTHOG_HOST;

type PosthogLike = Pick<PostHog, 'capture'> & {
  captureException: (err: unknown, distinctId?: string) => void;
};

const posthog: PosthogLike =
  typeof apiKey === 'string' && apiKey.trim() !== ''
    ? new PostHog(apiKey, { host, enableExceptionAutocapture: true })
    : {
        capture: () => {},
        captureException: () => {},
      };

export default posthog;
