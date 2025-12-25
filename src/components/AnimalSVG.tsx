interface AnimalSVGProps {
    animalType: 'kitten' | 'puppy' | 'snail';
    progress: number; // 0 to 1 (0% to 100%)
}

export function AnimalSVG({ animalType, progress }: AnimalSVGProps) {
    if (animalType === 'kitten') {
        return <KittenSVG progress={progress} />;
    }
    if (animalType === 'puppy') {
        return <PuppySVG progress={progress} />;
    }
    // Default to kitten
    return <KittenSVG progress={progress} />;
}

function KittenSVG({ progress }: { progress: number }) {
    const animationTime = '4.0s';
    // Calculate visual properties based on progress
    const opacity = 0.5 + (progress * 0.5); // 0.5 → 1.0
    const saturation = 35 + (progress * 35); // 35% → 70% (pale to robust)
    const brightness = 90 - (progress * 25); // 90% → 65% (pale to darker/robust)
    const scale = 0.85 + (progress * 0.15); // 0.85 → 1.0

    // Tan colors that get more saturated/robust as progress increases
    const bodyColor = `hsl(35, ${saturation}%, ${brightness}%)`;
    const earColor = `hsl(30, ${saturation}%, ${brightness - 5}%)`;
    const noseColor = `hsl(25, ${saturation + 10}%, ${brightness - 15}%)`;

    // Eyes get more open/alert
    const eyeHeight = 8 + (progress * 4); // Eyes open wider

    // Mouth curves up more with progress (bigger smile at higher progress)
    const mouthCurve = progress * 20; // More pronounced smile
    const mouthOpacity = 0.7 + (progress * 0.3); // More visible at higher progress

    return (
        <svg
            width="200"
            height="180"
            viewBox="0 0 200 180"
            style={{
                opacity,
                transform: `scale(${scale})`,
                transition: `all ${animationTime} ease`,
            }}
        >
            {/* Body */}
            <ellipse
                cx="100"
                cy="110"
                rx="48"
                ry="50"
                fill={bodyColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Ears - triangular and pointy, behind the head */}
            <polygon
                points="75,8 67,32 83,32"
                fill={earColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />
            <polygon
                points="125,8 117,32 133,32"
                fill={earColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Inner ears - smaller triangles */}
            <polygon
                points="75,14 71,28 79,28"
                fill={noseColor}
                opacity="0.6"
                style={{ transition: `fill ${animationTime} ease, opacity ${animationTime} ease` }}
            />
            <polygon
                points="125,14 121,28 129,28"
                fill={noseColor}
                opacity="0.6"
                style={{ transition: `fill ${animationTime} ease, opacity ${animationTime} ease` }}
            />

            {/* Head */}
            <circle
                cx="100"
                cy="60"
                r="45"
                fill={bodyColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Eyes */}
            <ellipse
                cx="85"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: `ry ${animationTime} ease` }}
            />
            <ellipse
                cx="115"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: `ry ${animationTime} ease` }}
            />

            {/* Eye highlights - more visible as progress increases */}
            <circle
                cx="87"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: `opacity ${animationTime} ease` }}
            />
            <circle
                cx="117"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: `opacity ${animationTime} ease` }}
            />

            {/* Nose */}
            <ellipse
                cx="100"
                cy="68"
                rx="4"
                ry="3"
                fill={noseColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Mouth - single continuous smile that curves up more with progress */}
            <path
                d={`M 85 76 Q 100 ${76 + mouthCurve} 115 76`}
                stroke="#2d3748"
                strokeWidth="3"
                fill="none"
                opacity={mouthOpacity}
                strokeLinecap="round"
                style={{ transition: `d ${animationTime} ease, opacity ${animationTime} ease` }}
            />

            {/* Whiskers - more visible as progress increases */}
            <line x1="65" y1="65" x2="45" y2="63" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="65" y1="70" x2="45" y2="72" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="135" y1="65" x2="155" y2="63" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />
            <line x1="135" y1="70" x2="155" y2="72" stroke="#2d3748" strokeWidth="1.5" opacity={0.3 + (progress * 0.4)} />

            {/* Paws */}
            <ellipse cx="75" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: `fill ${animationTime} ease` }} />
            <ellipse cx="125" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: `fill ${animationTime} ease` }} />

            {/* Tail */}
            <path
                d="M 140 120 Q 160 110 165 90"
                stroke={bodyColor}
                strokeWidth="18"
                fill="none"
                strokeLinecap="round"
                style={{ transition: `stroke ${animationTime} ease` }}
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

function PuppySVG({ progress }: { progress: number }) {
    const animationTime = '4.0s';
    // Calculate visual properties based on progress
    const opacity = 0.5 + (progress * 0.5); // 0.5 → 1.0
    const saturation = 30 + (progress * 40); // 30% → 70% (pale to robust)
    const brightness = 85 - (progress * 20); // 85% → 65% (pale to darker/robust)
    const scale = 0.85 + (progress * 0.15); // 0.85 → 1.0

    // Brown/golden colors that get more saturated/robust as progress increases
    const bodyColor = `hsl(30, ${saturation}%, ${brightness}%)`;
    const earColor = `hsl(25, ${saturation}%, ${brightness - 10}%)`;
    const noseColor = `hsl(15, ${saturation + 15}%, ${brightness - 20}%)`;

    // Eyes get more open/alert
    const eyeHeight = 8 + (progress * 4); // Eyes open wider

    // Mouth curves up more with progress (bigger smile at higher progress)
    const mouthCurve = progress * 20; // More pronounced smile
    const mouthOpacity = 0.7 + (progress * 0.3); // More visible at higher progress

    // Tail wag angle increases with progress
    const tailAngle = progress * 15; // Tail wags more

    return (
        <svg
            width="200"
            height="180"
            viewBox="0 0 200 180"
            style={{
                opacity,
                transform: `scale(${scale})`,
                transition: `all ${animationTime} ease`,
            }}
        >
            {/* Tail - wags more as progress increases */}
            <ellipse
                cx="145"
                cy="115"
                rx="12"
                ry="35"
                fill={earColor}
                transform={`rotate(${30 + tailAngle} 145 115)`}
                style={{ transition: `fill ${animationTime} ease, transform ${animationTime} ease` }}
            />

            {/* Body */}
            <ellipse
                cx="100"
                cy="110"
                rx="50"
                ry="48"
                fill={bodyColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Head */}
            <circle
                cx="100"
                cy="60"
                r="45"
                fill={bodyColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Ears - floppy, rounded, on top of head for visibility */}
            <ellipse
                cx="65"
                cy="50"
                rx="15"
                ry="25"
                fill={earColor}
                transform="rotate(15 70 50)"
                style={{ transition: `fill ${animationTime} ease` }}
            />
            <ellipse
                cx="135"
                cy="50"
                rx="15"
                ry="25"
                fill={earColor}
                transform="rotate(-15 130 50)"
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Inner ears */}
            {/* <ellipse
                cx="70"
                cy="52"
                rx="8"
                ry="15"
                fill={noseColor}
                opacity="0.5"
                style={{ transition: `fill ${animationTime} ease` }}
            />
            <ellipse
                cx="130"
                cy="52"
                rx="8"
                ry="15"
                fill={noseColor}
                opacity="0.5"
                style={{ transition: `fill ${animationTime} ease` }}
            /> */}

            {/* Snout */}
            <ellipse
                cx="100"
                cy="72"
                rx="20"
                ry="15"
                fill={bodyColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Eyes */}
            <ellipse
                cx="85"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: `ry ${animationTime} ease` }}
            />
            <ellipse
                cx="115"
                cy="55"
                rx="6"
                ry={eyeHeight}
                fill="#2d3748"
                style={{ transition: `ry ${animationTime} ease` }}
            />

            {/* Eye highlights - more visible as progress increases */}
            <circle
                cx="87"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: `opacity ${animationTime} ease` }}
            />
            <circle
                cx="117"
                cy="52"
                r="2"
                fill="white"
                opacity={0.3 + (progress * 0.7)}
                style={{ transition: `opacity ${animationTime} ease` }}
            />

            {/* Nose */}
            <ellipse
                cx="100"
                cy="70"
                rx="6"
                ry="5"
                fill={noseColor}
                style={{ transition: `fill ${animationTime} ease` }}
            />

            {/* Mouth - smile that curves up more with progress */}
            <path
                d={`M 85 78 Q 100 ${78 + mouthCurve} 115 78`}
                stroke="#2d3748"
                strokeWidth="3"
                fill="none"
                opacity={mouthOpacity}
                strokeLinecap="round"
                style={{ transition: `d ${animationTime} ease, opacity ${animationTime} ease` }}
            />

            {/* Paws */}
            <ellipse cx="75" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: `fill ${animationTime} ease` }} />
            <ellipse cx="125" cy="150" rx="12" ry="15" fill={bodyColor} style={{ transition: `fill ${animationTime} ease` }} />

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
