type TelegramWebAppUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
};

type TelegramWebApp = {
  initData?: string;
  initDataUnsafe?: {
    user?: TelegramWebAppUser;
  };
};

export function getTelegramWebApp(): TelegramWebApp | null {
  const tg = (window as unknown as { Telegram?: { WebApp?: TelegramWebApp } }).Telegram?.WebApp;
  return tg ?? null;
}

export function getTelegramInitData(): string | null {
  const tg = getTelegramWebApp();
  if (!tg?.initData || typeof tg.initData !== 'string') return null;
  const v = tg.initData.trim();
  return v ? v : null;
}

export function getTelegramUserId(): number | null {
  const tg = getTelegramWebApp();
  const id = tg?.initDataUnsafe?.user?.id;
  return typeof id === 'number' && Number.isFinite(id) ? id : null;
}

