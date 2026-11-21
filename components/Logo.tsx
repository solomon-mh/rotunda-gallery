/** Rotunda mark: a solid block pierced by three arches — the gallery seen from outside. */
export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size * 1.45} height={size} viewBox="0 0 29 20" aria-hidden="true">
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 20V6.5C0 2.9 2.9 0 6.5 0h16C26.1 0 29 2.9 29 6.5V20H0Zm4-2h4.6v-6.2a2.3 2.3 0 0 0-4.6 0V18Zm8.2 0h4.6v-7.6a2.3 2.3 0 0 0-4.6 0V18Zm8.2 0H25v-6.2a2.3 2.3 0 0 0-4.6 0V18Z"
      />
    </svg>
  );
}
