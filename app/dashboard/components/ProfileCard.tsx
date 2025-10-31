interface ProfileCardProps {
  name: string;
  connections: string;
}

export function ProfileCard({ name, connections }: ProfileCardProps) {
  return (
    <div className="flex w-full items-start gap-3 rounded-xl bg-[#F6F7F6] px-3 py-3">
      <div className="h-10 w-10 flex-shrink-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 48 48"
          fill="none"
          className="h-full w-full"
        >
          <path
            d="M48 24C48 37.2548 37.2548 48 24 48C10.7452 48 0 37.2548 0 24C0 10.7452 10.7452 0 24 0C37.2548 0 48 10.7452 48 24Z"
            fill="#D9D9D9"
          />
          <path
            d="M24 24C26.7614 24 29 21.7614 29 19C29 16.2386 26.7614 14 24 14C21.2386 14 19 16.2386 19 19C19 21.7614 21.2386 24 24 24Z"
            fill="#F6F7F6"
          />
          <path
            d="M24 27C19.5817 27 16 30.5817 16 35H32C32 30.5817 28.4183 27 24 27Z"
            fill="#F6F7F6"
          />
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-[#696969]">
          {name}
        </span>
        <span className="text-xs font-normal text-[#696969]">
          {connections}
        </span>
      </div>
    </div>
  );
}
