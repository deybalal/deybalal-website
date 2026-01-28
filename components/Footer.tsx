"use client";

import Link from "next/link";
import { Twitter, Instagram, Github, Music2 } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    {
      title: "دسترسی سریع",
      links: [
        { name: "صفحه اصلی", href: "/" },
        { name: "جستوجو", href: "/search" },
        { name: "آلبوم ها", href: "/album" },
        { name: "خواننده ها", href: "/artist" },
        { name: "پلی لیست ها", href: "/playlists" },
      ],
    },
    {
      title: "پشتیبانی",
      links: [
        { name: "درباره ما", href: "/about" },
        { name: "تماس با ما", href: "/contact" },
        { name: "حریم خصوصی", href: "/privacy" },
        { name: "شرایط و قوانین", href: "/terms" },
      ],
    },
  ];

  const socialLinks = [
    { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
    { name: "GitHub", icon: Github, href: "https://github.com" },
  ];

  return (
    <footer className="w-full mt-auto border-t border-white/5 bg-background/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-primary rounded-lg group-hover:neon-box transition-all duration-300">
                <Music2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold tracking-tight neon-text">
                دی بلال
              </span>
            </Link>
            <p className="text-muted-foreground max-w-xs leading-relaxed">
              مقصد نهایی شما برای کشف، پخش و دانلود موسیقی های مورد علاقه تان.
              به جمع هنرمندان و طرفداران ما بپیوندید.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full glass hover:bg-primary/20 hover:text-primary transition-all duration-300 group"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          {footerLinks.map((section) => (
            <div key={section.title} className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-4">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} دی بلال. تمامی حقوق محفوظ است.
          </p>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link
              href="/privacy"
              className="hover:text-primary transition-colors"
            >
              حریم خصوصی
            </Link>
            <Link
              href="/terms"
              className="hover:text-primary transition-colors"
            >
              قوانین
            </Link>
            <Link
              href="/cookies"
              className="hover:text-primary transition-colors"
            >
              کوکی ها
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
