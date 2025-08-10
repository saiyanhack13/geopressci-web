import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 mt-8">
      <div className="container mx-auto px-6 py-4">
        <div className="text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Geopressci. Tous droits réservés.</p>
          <p>Conçu avec ❤️ en Côte d'Ivoire</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
