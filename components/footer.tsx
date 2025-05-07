export default function Footer() {
    return (
      <footer className="py-6 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} Tensora GmbH. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="https://tensora.co" className="text-sm text-tensora-medium hover:text-tensora-dark" target="_blank" rel="noopener noreferrer">
                Website
              </a>
              <a href="https://tensora.co/contact" className="text-sm text-tensora-medium hover:text-tensora-dark" target="_blank" rel="noopener noreferrer">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  }