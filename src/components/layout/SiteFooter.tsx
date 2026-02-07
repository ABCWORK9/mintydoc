import Link from "next/link";
import { siteConfig } from "@/lib/config/site";

export default function SiteFooter() {
  return (
    <footer>
      <nav aria-label="Footer">
        <div>© {siteConfig.name}</div>
        <div>
          {siteConfig.footerNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </footer>
  );
}
