import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export default function SiteHeader() {
  return (
    <header>
      <nav aria-label="Primary">
        <Link href="/">{siteConfig.name}</Link>
        <div>
          {siteConfig.primaryNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
          <Link href="/news">News</Link>
          {/* TODO: show when wallet/auth state is available */}
          {/* <Link href="/me">My documents</Link> */}
        </div>
      </nav>
    </header>
  );
}
