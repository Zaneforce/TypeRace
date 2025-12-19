import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
 
export const size = {
  width: 32,
  height: 32,
}
 
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a1a1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="10" y="30" width="80" height="45" rx="3" fill="none" stroke="#ffffff" strokeWidth="3"/>
          <rect x="15" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="23" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="31" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="39" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="47" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="55" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="63" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="71" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="79" y="35" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="15" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="23" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="31" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="39" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="47" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="55" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="63" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="71" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="79" y="44" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="15" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="23" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="31" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="39" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="47" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="55" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="63" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="71" y="53" width="6" height="6" rx="1" fill="#ffffff"/>
          <rect x="23" y="62" width="47" height="6" rx="1" fill="#ffffff"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
