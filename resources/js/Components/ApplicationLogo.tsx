import { SVGAttributes } from 'react';

/**
 * VeriFact mark: a shield with a verification check, standing in for the
 * evidence-integrity/chain-of-custody identity of the system. Deliberately
 * not the default Laravel/Jetstream diamond logo it replaced.
 */
export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path
                d="M12 2.5L4.5 5.5V11c0 5.25 3.2 9.36 7.5 11 4.3-1.64 7.5-5.75 7.5-11V5.5L12 2.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
                fill="currentColor"
                fillOpacity="0.08"
            />
            <path
                d="M8.5 12.25l2.35 2.35L15.75 9.5"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
