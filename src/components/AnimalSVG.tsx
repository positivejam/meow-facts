interface AnimalSVGProps {
    animalType: 'kitten' | 'puppy' | 'snail';
    progress: number; // 0 to 1 (0% to 100%)
}

export function AnimalSVG({ animalType, progress }: AnimalSVGProps) {
    if (animalType === 'kitten') {
        return <KittenSVG progress={progress} />;
    }
    // Add other animals later
    return <KittenSVG progress={progress} />;
}

function KittenSVG({ progress }: { progress: number }) {
    // Calculate visual properties based on progress
    const opacity = 0.5 + (progress * 0.5); // 0.5 → 1.0
    const saturation = 50 + (progress * 50); // 50% → 100%
    const brightness = 80 + (progress * 20); // 80% → 100%
    const scale = 0.85 + (progress * 0.15); // 0.85 → 1.0

    // Colors that get more saturated/bright as progress increases
    const bodyColor = `hsl(320, ${saturation}%, ${brightness}%)`;
    const earColor = `hsl(330, ${saturation}%, ${brightness - 10}%)`;
    const noseColor = `hsl(340, ${saturation * 1.2}%, ${brightness - 20}%)`;

    // Eyes get more open/alert
    const eyeHeight = 8 + (progress * 4); // Eyes open wider

    // Mouth curves up more with progress
    const mouthCurve = progress * 15; // More smile

    return (
        <svg
            width="200"
            height="180"
            viewBox="0 0 200 180"
            style={{
                opacity,
                transform: `scale(${scale})`,
                transition: 'all 0.5s ease',
            }}
        >
            {/* Body */}
            <ellipse
                cx="100"
                cy="110"
                rx="60"
                ry="50"
                fill={bodyColor}
                style={{ transition: 'fill 0.5s ease' }}
            />

            {/* Head */}
            <circle
                cx="100"
                cy="60"
                r="45"
                fill={bodyColor}
                style={{ transition: 'fill 0.5s ease' }}
            />

            {/* Ears */}
            <ellipse
                cx="70"
                cy="30"
                rx="15"
                ry="25"
                fill={earColor}
                style={{ transition: 'fill 0.5s ease' }}
            />
            <ellipse
                cx="130"
                cy="30"
                rx="15"
                ry="25"
                fill={earColor}
                style={{ transition: 'fill 0.5s ease' }}
            />

            {/* Inner ears */}
            <ellipse
                cx="70"
                cy="32"
                rx="8"
                ry="15"
                fill={noseColor}
                opacity="0.6"
                style={{ transition: 'fill 0.5s ease, opacity 0.5s ease' }}
            />
            <ellipse
                cx="130"
                cy="32"
                rx="8"
                ry="15"
                fill={noseColor}
                opacity="0.6"
                style={{ transition: 'fill 0.5s ease, opacity 0.5s ease' }}
            />

            {/* Eyes */}
            <ellipse
                cx="85"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: 'ry 0.5s ease' }}
            />
            <ellipse
                cx="115"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: 'ry 0.5s ease' }}
            />

            {/* Eye highlights - more visible as progress increases */}
            <circle
                cx="87"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: 'opacity 0.5s ease' }}
            />
            <circle
                cx="117"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: 'opacity 0.5s ease' }}
            />

            {/* Nose */}
            <ellipse
                cx="100"
                cy="68"
                rx="4"
                ry="3"
                fill={noseColor}
                style={{ transition: 'fill 0.5s ease' }}
            />

            {/* Mouth - curves up more with progress */}
            <path
                d={`M 100 68 Q 95 ${72 + mouthCurve} 90 ${75 + mouthCurve}`}
                stroke="#2d3748"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
                style={{ transition: 'd 0.5s ease' }}
            />
            <path
                d={`M 100 68 Q 105 ${72 + mouthCurve} 110 ${75 + mouthCurve}`}
                stroke="#2d3748"
                strokeWidth="2"
                fill="none"
                opacity="0.6"
                style={{ transition: 'd 0.5s ease' }}
            />

            {/* Whiskers - more visible as progress increases */}
            <line x1="65" y1="65" x2="45" y2="63" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="65" y1="70" x2="45" y2="72" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="135" y1="65" x2="155" y2="63" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="135" y1="70" x2="155" y2="72" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />

            {/* Paws */}
            <ellipse cx="75" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: 'fill 0.5s ease' }} />
            <ellipse cx="125" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: 'fill 0.5s ease' }} />

            {/* Tail */}
            <path
                d="M 140 120 Q 160 110 165 90"
                stroke={bodyColor}
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
                style={{ transition: 'stroke 0.5s ease' }}
            />

            {/* Hearts appear more as progress increases */}
            {progress > 0.3 && (
                <g opacity={Math.min(1, (progress - 0.3) * 2)}>
                    <path
                        d="M 30 50 C 30 45, 35 40, 40 40 C 45 40, 47 43, 47 43 C 47 43, 49 40, 54 40 C 59 40, 64 45, 64 50 C 64 58, 47 68, 47 68 C 47 68, 30 58, 30 50"
                        fill="#ff69b4"
                        opacity="0.4"
                    />
                </g>
            )}
            {progress > 0.6 && (
                <g opacity={Math.min(1, (progress - 0.6) * 2.5)}>
                    <path
                        d="M 140 45 C 140 42, 143 39, 146 39 C 149 39, 150 41, 150 41 C 150 41, 151 39, 154 39 C 157 39, 160 42, 160 45 C 160 50, 150 57, 150 57 C 150 57, 140 50, 140 45"
                        fill="#ff69b4"
                        opacity="0.4"
                    />
                </g>
            )}
        </svg>
    );
}
