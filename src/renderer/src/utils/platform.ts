const userAgentDataPlatform =
  typeof navigator !== 'undefined' && 'userAgentData' in navigator
    ? (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform
    : undefined

const fallbackPlatform =
  typeof navigator !== 'undefined'
    ? navigator.userAgent.includes('Mac') || navigator.platform.toLowerCase().includes('mac')
      ? 'macos'
      : 'other'
    : 'other'

export const isMacOS = (userAgentDataPlatform ?? fallbackPlatform).toLowerCase().includes('mac')
