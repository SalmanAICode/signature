interface AvatarProps {
    firstName: string;
    lastName: string;
    size?: number;
    borderColor?: string;
}

export default function Avatar({
    firstName,
    lastName,
    size = 96,
    borderColor = 'border-[#3A5075]',
}: AvatarProps) {
    const seed = encodeURIComponent(`${firstName} ${lastName}`);

    return (
        <img
            className={`rounded-full object-cover border-4 ${borderColor}`}
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${seed}`}
            alt={`${firstName} ${lastName} avatar`}
            width={size}
            height={size}
            style={{ width: size, height: size }}
        />
    );
}
