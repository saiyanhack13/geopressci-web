import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Phone, Mail, Clock, User, Bot, Paperclip, X } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'support' | 'bot';
  timestamp: Date;
  type: 'text' | 'image' | 'file';
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
}

interface SupportChatProps {
  isOpen: boolean;
  onClose: () => void;
  userType: 'client' | 'business';
}

const FAQ_ITEMS = [
  {
    question: "Comment suivre ma commande ?",
    answer: "Vous pouvez suivre votre commande en temps réel depuis la page 'Mes commandes' ou en cliquant sur le lien de suivi reçu par SMS."
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer: "Les délais varient selon le service : Lavage express (2h), Lavage standard (24h), Nettoyage à sec (48h)."
  },
  {
    question: "Comment modifier mon abonnement ?",
    answer: "Rendez-vous dans 'Paramètres > Abonnement' pour changer de plan ou résilier votre abonnement."
  },
  {
    question: "Problème de paiement",
    answer: "Vérifiez vos informations de carte ou contactez votre banque. Nous acceptons aussi Mobile Money (Orange, MTN, Moov)."
  }
];

export const SupportChat: React.FC<SupportChatProps> = ({
  isOpen,
  onClose,
  userType
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Bonjour ! 👋 Je suis l'assistant Geopressci. Comment puis-je vous aider aujourd'hui ?`,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFAQ, setShowFAQ] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && attachments.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: 'user',
      timestamp: new Date(),
      type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments.map(file => ({
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setAttachments([]);
    setShowFAQ(false);
    setIsTyping(true);

    // Simulation de réponse automatique
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getBotResponse(newMessage),
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('commande') || message.includes('suivi')) {
      return "Pour suivre votre commande, rendez-vous dans 'Mes commandes' ou utilisez le numéro de suivi reçu par SMS. Avez-vous votre numéro de commande ?";
    }
    
    if (message.includes('paiement') || message.includes('carte')) {
      return "Pour les problèmes de paiement, vérifiez vos informations bancaires ou essayez Mobile Money. Quel est le message d'erreur exact ?";
    }
    
    if (message.includes('délai') || message.includes('livraison')) {
      return "Nos délais sont : Express (2h), Standard (24h), Nettoyage à sec (48h). Dans quel quartier êtes-vous situé ?";
    }
    
    if (message.includes('prix') || message.includes('tarif')) {
      return "Nos tarifs varient selon le service et la zone. Consultez notre grille tarifaire ou demandez un devis personnalisé.";
    }
    
    return "Je comprends votre demande. Un agent va prendre en charge votre conversation dans quelques minutes. En attendant, consultez notre FAQ ci-dessous.";
  };

  const handleFAQClick = (faq: typeof FAQ_ITEMS[0]) => {
    const faqMessage: Message = {
      id: Date.now().toString(),
      content: faq.question,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    const answerMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: faq.answer,
      sender: 'bot',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, faqMessage, answerMessage]);
    setShowFAQ(false);
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Support Geopressci</h3>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                En ligne
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${
                message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === 'user' 
                    ? 'bg-blue-600' 
                    : message.sender === 'bot'
                    ? 'bg-gray-600'
                    : 'bg-green-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-4 h-4 text-white" />
                  ) : message.sender === 'bot' ? (
                    <Bot className="w-4 h-4 text-white" />
                  ) : (
                    <MessageCircle className="w-4 h-4 text-white" />
                  )}
                </div>

                {/* Message */}
                <div className={`rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm">{message.content}</p>
                  
                  {/* Pièces jointes */}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 text-xs">
                          <Paperclip className="w-3 h-3" />
                          <span>{attachment.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Indicateur de frappe */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* FAQ */}
        {showFAQ && (
          <div className="border-t border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3">Questions fréquentes :</h4>
            <div className="space-y-2">
              {FAQ_ITEMS.slice(0, 3).map((faq, index) => (
                <button
                  key={index}
                  onClick={() => handleFAQClick(faq)}
                  className="w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition-colors"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pièces jointes */}
        {attachments.length > 0 && (
          <div className="border-t border-gray-200 p-4">
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <div key={index} className="flex items-center gap-2 bg-gray-100 rounded-lg p-2 text-sm">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                  <button
                    onClick={() => removeAttachment(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zone de saisie */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Tapez votre message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() && attachments.length === 0}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileAttach}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
        </div>

        {/* Contacts alternatifs */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <p className="text-xs text-gray-600 mb-2">Autres moyens de nous contacter :</p>
          <div className="flex items-center justify-center gap-4 text-xs">
            <a href="tel:+2250123456789" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
              <Phone className="w-3 h-3" />
              +225 01 23 45 67 89
            </a>
            <a href="mailto:support@geopressci.com" className="flex items-center gap-1 text-blue-600 hover:text-blue-800">
              <Mail className="w-3 h-3" />
              support@geopressci.com
            </a>
          </div>
          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mt-1">
            <Clock className="w-3 h-3" />
            Lun-Sam 8h-20h, Dim 10h-18h
          </div>
        </div>
      </div>
    </div>
  );
};
