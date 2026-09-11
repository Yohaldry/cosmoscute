import { MessageCircle } from 'lucide-react';

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/573026158662?text=¡Hola!%20Me%20interesan%20los%20productos%20y%20combos%20de%20la%20web%20💖"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat de WhatsApp"
      className="fixed bottom-6 right-6 z-50 bg-gradient-to-tr from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white p-3.5 sm:p-4 rounded-full shadow-[0_8px_25px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center group animate-bounce"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-white" />
      <span className="absolute right-full mr-3 bg-white text-slate-800 font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-pink-100">
        ¡Escríbenos por WhatsApp! 👋
      </span>
    </a>
  );
}