'use client';

type ProfileUpdatePayload = {
  user: {
    id: string;
    walletAddress: string;
    name?: string | null;
    avatar?: string | null;
  };
};

const EVENT_NAME = 'profile:updated';
const CHANNEL_NAME = 'profile-updates';

export function broadcastProfileUpdated(payload: ProfileUpdatePayload) {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent<ProfileUpdatePayload>(EVENT_NAME, { detail: payload }),
  );

  if (typeof BroadcastChannel !== 'undefined') {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(payload);
    channel.close();
  }
}

export function subscribeToProfileUpdates(
  handler: (payload: ProfileUpdatePayload) => void,
) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const windowListener = (event: Event) => {
    const customEvent = event as CustomEvent<ProfileUpdatePayload>;
    if (customEvent.detail) {
      handler(customEvent.detail);
    }
  };

  window.addEventListener(EVENT_NAME, windowListener);

  let channel: BroadcastChannel | null = null;

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent<ProfileUpdatePayload>) => {
      handler(event.data);
    };
  }

  return () => {
    window.removeEventListener(EVENT_NAME, windowListener);
    if (channel) {
      channel.close();
    }
  };
}
