const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0e0e0e] p-6 text-center text-sm text-gray-400">
      <div className="container mx-auto">
        <div className="flex justify-center space-x-4 mb-4">
          <a href="#" className="hover:text-blue-500">Terms</a>
          <a href="#" className="hover:text-blue-500">Privacy</a>
          <a href="#" className="hover:text-blue-500">Contact</a>
        </div>
        <p>&copy; 2025 DeFi Yield Optimizer. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;