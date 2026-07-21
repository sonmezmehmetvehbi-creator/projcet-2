import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Generate', href: '/generate' },
      { label: 'SAT Prep', href: '/sat' },
      { label: 'Tutoring', href: '/tutoring' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help & Support', href: '/support' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2" aria-label="AceForge home">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-serif text-lg font-semibold text-foreground">
                AceForge
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Study Smarter. Score Higher.
            </p>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="text-sm font-semibold text-foreground">{col.title}</p>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          {/* Contact */}
          <div>
            <p className="text-sm font-semibold text-foreground">Contact</p>
            <ul className="mt-4 space-y-3">
              <li>
                <a
                  href="mailto:contactinfo21342@gmail.com"
                  className="text-sm text-muted-foreground transition-colors hover:text-primary"
                >
                  contactinfo21342@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">
            © 2026 AceForge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
