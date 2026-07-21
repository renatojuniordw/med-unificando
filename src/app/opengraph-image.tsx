import { ImageResponse } from 'next/og'

export const alt = 'Med Unificando — Medicamentos Intercambiáveis ANVISA'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#020617',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              background: '#ccff00',
              color: '#020617',
              fontSize: '48px',
              fontWeight: 900,
              padding: '12px 24px',
              borderRadius: '4px',
            }}
          >
            MED
          </div>
        </div>
        <div
          style={{
            fontSize: '64px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          Med Unificando
        </div>
        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            marginTop: '16px',
            textAlign: 'center',
            maxWidth: '700px',
          }}
        >
          Medicamentos Intercambiáveis ANVISA
        </div>
        <div
          style={{
            fontSize: '18px',
            color: '#ccff00',
            marginTop: '32px',
            textAlign: 'center',
          }}
        >
          busca por descrição · preços CMED · comparação · classificação ATC
        </div>
      </div>
    ),
    { ...size },
  )
}
