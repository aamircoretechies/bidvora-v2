import { generalSettings } from '@/config/general.config';
import { Container } from '@/components/common/container';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <Container>
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <a
              href="#"
              target="_blank"
              className="text-secondary-foreground hover:text-primary"
            >
              Bidvora Inc.
            </a>
          </div>
          <nav className="flex order-1 md:order-2 gap-4 font-normal text-sm text-muted-foreground">

            <a
              href={generalSettings.purchase}
              target="_blank"
              className="hover:text-primary"
            >
              Purchase
            </a>
            <a
              href={generalSettings.faq}
              target="_blank"
              className="hover:text-primary"
            >
              FAQ
            </a>
            <a
              href={generalSettings.support}
              target="_blank"
              className="hover:text-primary"
            >
              Support
            </a>
            <a
              href={generalSettings.terms}
              target="_blank"
              className="hover:text-primary"
            >
              Terms
            </a>
            <a
              href={generalSettings.pp}
              target="_blank"
              className="hover:text-primary"
            >
              Privacy Policy
            </a>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
