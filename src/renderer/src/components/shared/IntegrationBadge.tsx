import type { IntegrationBadge as IBadge } from '../../types'

// Domain → badge config map
export const DOMAIN_MAP: Record<string, { bg: string; char: string; label: string }> = {
  'notion.so':        { bg: '#000000', char: 'N',  label: 'Notion'      },
  'youtube.com':      { bg: '#FF0000', char: 'Y',  label: 'YouTube'     },
  'youtu.be':         { bg: '#FF0000', char: 'Y',  label: 'YouTube'     },
  'figma.com':        { bg: '#F24E1E', char: 'F',  label: 'Figma'       },
  'framer.com':       { bg: '#0055FF', char: 'Fr', label: 'Framer'      },
  'google.com':       { bg: '#4285F4', char: 'G',  label: 'Google'      },
  'docs.google.com':  { bg: '#4285F4', char: 'G',  label: 'Google Docs' },
  'meet.google.com':  { bg: '#00AC47', char: 'M',  label: 'Meet'        },
  'calendar.google.com':{ bg: '#1A73E8', char: '📅', label: 'Calendar'  },
  'drive.google.com': { bg: '#FBBC04', char: 'Dr', label: 'Drive'       },
  'github.com':       { bg: '#24292E', char: 'Gh', label: 'GitHub'      },
  'slack.com':        { bg: '#4A154B', char: 'S',  label: 'Slack'       },
  'linear.app':       { bg: '#5E6AD2', char: 'L',  label: 'Linear'      },
  'asana.com':        { bg: '#F06A6A', char: 'A',  label: 'Asana'       },
  'loom.com':         { bg: '#625DF5', char: 'Lo', label: 'Loom'        },
  'twitter.com':      { bg: '#1DA1F2', char: 'X',  label: 'Twitter'     },
  'x.com':            { bg: '#000000', char: 'X',  label: 'X'           },
  'airtable.com':     { bg: '#2D7FF9', char: 'At', label: 'Airtable'    },
  'trello.com':       { bg: '#0052CC', char: 'Tr', label: 'Trello'      },
  'miro.com':         { bg: '#FFD02F', char: 'Mi', label: 'Miro'        },
  'webflow.com':      { bg: '#4353FF', char: 'W',  label: 'Webflow'     },
  'vercel.com':       { bg: '#000000', char: 'V',  label: 'Vercel'      },
  'stripe.com':       { bg: '#635BFF', char: 'St', label: 'Stripe'      },
  'shopify.com':      { bg: '#96BF48', char: 'Sh', label: 'Shopify'     },
  'hubspot.com':      { bg: '#FF7A59', char: 'Hs', label: 'HubSpot'     },
  'intercom.com':     { bg: '#286EFA', char: 'Ic', label: 'Intercom'    },
  'dropbox.com':      { bg: '#0061FF', char: 'Db', label: 'Dropbox'     },
  'zoom.us':          { bg: '#2D8CFF', char: 'Z',  label: 'Zoom'        },
  'canva.com':        { bg: '#00C4CC', char: 'Ca', label: 'Canva'       },
}

const FALLBACK = { bg: '#555555', char: '?', label: 'Link' }

export function badgeFromUrl(url: string): { bg: string; char: string; label: string } {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    // Exact match first
    if (DOMAIN_MAP[hostname]) return DOMAIN_MAP[hostname]
    // Partial match (e.g. subdomain.notion.so)
    for (const [domain, cfg] of Object.entries(DOMAIN_MAP)) {
      if (hostname.endsWith(domain)) return cfg
    }
  } catch {}
  return FALLBACK
}

interface Props {
  badge: IBadge
  size?: number
}

export default function IntegrationBadge({ badge, size = 20 }: Props) {
  const cfg = badge.url ? badgeFromUrl(badge.url) : { bg: badge.color, char: badge.iconChar, label: badge.label ?? '' }

  return (
    <div
      title={cfg.label}
      onClick={(e) => {
        if (badge.url) {
          e.stopPropagation()
          window.electron?.openExternal(badge.url)
        }
      }}
      style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.28),
        background: cfg.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        fontSize: size <= 16 ? 8 : size <= 20 ? 9 : 11,
        fontWeight: 800, color: '#fff',
        letterSpacing: '-0.02em',
        cursor: badge.url ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {cfg.char}
    </div>
  )
}
