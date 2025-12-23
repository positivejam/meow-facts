export function SunshineSVG() {
    // Sunshine - cute black cat companion with big expressive eyes
    const bodyDark = '#3a3a3a';
    const bodyMain = '#2a2a2a';
    const earInner = '#7a7a7a';
    const eyeOuter = '#c8e6c9'; // Light mint green
    const eyePupil = '#1a1a1a';

    return (
        <svg
            width="100"
            height="100"
            viewBox="0 0 100 100"
            style={{
                filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))',
            }}
        >
            {/* Tail */}
            <path
                d="M 20 75 Q 15 65 18 55 Q 20 48 25 50"
                stroke={bodyMain}
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
            />

            {/* Body - sitting */}
            <ellipse
                cx="50"
                cy="75"
                rx="25"
                ry="20"
                fill={bodyMain}
            />

            {/* Legs/paws */}
            <ellipse cx="40" cy="88" rx="8" ry="10" fill={bodyDark} />
            <ellipse cx="60" cy="88" rx="8" ry="10" fill={bodyDark} />

            {/* Ears - behind head */}
            <polygon
                points="30,20 22,10 38,22"
                fill={bodyMain}
            />
            <polygon
                points="70,20 62,10 78,22"
                fill={bodyMain}
            />

            {/* Inner ears - lighter gray */}
            <polygon
                points="30,20 26,14 34,22"
                fill={earInner}
            />
            <polygon
                points="70,20 66,14 74,22"
                fill={earInner}
            />

            {/* Head */}
            <ellipse
                cx="50"
                cy="45"
                rx="28"
                ry="26"
                fill={bodyMain}
            />

            {/* Head shading (darker on top) */}
            <ellipse
                cx="50"
                cy="35"
                rx="26"
                ry="12"
                fill={bodyDark}
                opacity="0.5"
            />

            {/* Eyes - large and expressive */}
            {/* Left eye outer */}
            <ellipse
                cx="38"
                cy="42"
                rx="9"
                ry="11"
                fill={eyeOuter}
            />
            {/* Right eye outer */}
            <ellipse
                cx="62"
                cy="42"
                rx="9"
                ry="11"
                fill={eyeOuter}
            />

            {/* Eye pupils */}
            <ellipse
                cx="38"
                cy="44"
                rx="6"
                ry="8"
                fill={eyePupil}
            />
            <ellipse
                cx="62"
                cy="44"
                rx="6"
                ry="8"
                fill={eyePupil}
            />

            {/* Eye highlights - large for cuteness */}
            <circle
                cx="36"
                cy="40"
                r="3"
                fill="white"
            />
            <circle
                cx="60"
                cy="40"
                r="3"
                fill="white"
            />
            <circle
                cx="40"
                cy="46"
                r="1.5"
                fill="white"
                opacity="0.8"
            />
            <circle
                cx="64"
                cy="46"
                r="1.5"
                fill="white"
                opacity="0.8"
            />

            {/* Nose - small triangle */}
            <polygon
                points="50,52 47,55 53,55"
                fill="#1a1a1a"
            />

            {/* Mouth - cute "w" shape */}
            <path
                d="M 47 56 Q 50 58 53 56"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
            />

            {/* Whiskers - long and thin */}
            <line x1="22" y1="44" x2="10" y2="42" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />
            <line x1="22" y1="48" x2="10" y2="50" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />
            <line x1="22" y1="52" x2="10" y2="54" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />

            <line x1="78" y1="44" x2="90" y2="42" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />
            <line x1="78" y1="48" x2="90" y2="50" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />
            <line x1="78" y1="52" x2="90" y2="54" stroke="#1a1a1a" strokeWidth="1.5" opacity="0.7" />
        </svg>
    );
}
