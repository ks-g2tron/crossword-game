import packageJson from '../../package.json';

export default function Footer() {
  return (
    <footer className="py-4 pr-6 text-right text-gray-400 text-xs">
      Crossword Game v{packageJson.version} | Built with Next.js
    </footer>
  );
}
