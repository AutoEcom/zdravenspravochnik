import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "180px",
          height: "180px",
          background: "#0F766E",
          borderRadius: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4.4 25.1 8.1v7.9c0 5.2-3.5 9.1-9.1 10.8-5.6-1.7-9.1-5.6-9.1-10.8V8.1L16 4.4Z"
            stroke="white"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path d="M16 12.1v7.2M12.4 15.7h7.2" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </div>
    ),
    size
  )
}
