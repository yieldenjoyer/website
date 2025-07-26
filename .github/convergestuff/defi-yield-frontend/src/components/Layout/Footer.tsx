import { Link } from 'react-router-dom';
import { Github, Twitter, MessageCircle, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'Twitter', href: '#', icon: Twitter },
    { name: 'Discord', href: '#', icon: MessageCircle },
    { name: 'GitHub', href: '#', icon: Github },
    { name: 'Website', href: '#', icon: Globe },
  ];

  const footerLinks = [
    {
      title: 'Product',
      links: [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'Strategies', href: '#' },
        { name: 'Analytics', href: '#' },
        { name: 'API', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Documentation', href: '#' },
        { name: 'FAQ', href: '/faq' },
        { name: 'Blog', href: '#' },
        { name: 'Support', href: '#' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
        { name: 'Risk Disclosure', href: '#' },
        { name: 'Audit Reports', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-dark-900/50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-cyber-500 to-violet-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DY</span>
              </div>
              <span className="font-display font-bold text-xl text-white">
                DeFi<span className="text-gradient">Yield</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-md">
              Maximize your crypto yields with real-time optimization across Aave, Morpho, Pendle, and more. 
              Built for DeFi power users who demand the best returns.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 hover:text-cyber-400 transition-colors duration-200"
                    aria-label={social.name}
                  >
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="text-white font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    {link.href.startsWith('#') ? (
                      <a
                        href={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-gray-400 hover:text-white transition-colors duration-200 text-sm"
                      >
                        {link.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} DeFi Yield Optimizer. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex items-center space-x-6">
            <span className="text-gray-400 text-sm">
              Built with ❤️ for the DeFi community
            </span>
          </div>
        </div>

        {/* Risk Disclaimer */}
        <div className="mt-8 p-4 bg-dark-800/30 rounded-lg border border-yellow-500/20">
          <p className="text-yellow-400 text-xs">
            <strong>Risk Disclaimer:</strong> DeFi investments carry significant risks including potential loss of principal. 
            Past performance does not guarantee future results. Always do your own research and never invest more than you can afford to lose.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
