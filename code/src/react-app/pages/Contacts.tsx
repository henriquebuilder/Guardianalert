import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, ArrowLeft, Trash2, Edit, Star, RefreshCw } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import ContactForm from '@/react-app/components/ContactForm';

interface Contact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
  is_primary: number;
}

export default function Contacts() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const fetchContacts = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    try {
      const response = await fetch('/api/contacts');

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Contacts] Resposta não é JSON:', text.substring(0, 200));
        throw new Error('API retornou HTML ao invés de JSON');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP ${response.status}`);
      }
      
      const data = await response.json();

      // Garantir que data é um array
      if (Array.isArray(data)) {
        setContacts(data);
      } else if (data.results && Array.isArray(data.results)) {
        setContacts(data.results);
      } else {
        console.error('[Contacts] Formato de dados inesperado:', data);
        setContacts([]);
      }
    } catch (error) {
      console.error('[Contacts] Erro ao buscar contatos:', error);
      setContacts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleManualRefresh = () => {
    fetchContacts(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return;
    
    try {
      await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingContact(null);
    fetchContacts();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingContact(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b border-rose-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <Button variant="ghost" size="sm" onClick={() => navigate('/app')} className="flex-shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent truncate">
                  Contatos de Emergência
                </h1>
              </div>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-rose-500 to-purple-600 flex-shrink-0" size="sm">
              <Plus className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Adicionar</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex-shrink-0"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-4xl">
        {/* Info Banner */}
        <Card className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 border-blue-200">
          <p className="text-xs sm:text-sm text-blue-800 leading-relaxed">
            <strong>Importante:</strong> Estes contatos receberão alertas de emergência com sua localização quando você acionar o botão de pânico. Mantenha a lista atualizada.
          </p>
        </Card>

        {/* Contact Form */}
        {showForm && (
          <ContactForm
            contact={editingContact}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}

        {/* Contacts List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : contacts.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nenhum contato cadastrado
            </h3>
            <p className="text-gray-600 mb-6">
              Adicione contatos de emergência para receber ajuda quando precisar
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-gradient-to-r from-rose-500 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Contato
            </Button>
          </Card>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.id} className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      contact.is_primary ? 'bg-amber-100' : 'bg-purple-100'
                    }`}>
                      {contact.is_primary ? (
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 fill-amber-600" />
                      ) : (
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{contact.name}</h3>
                        {contact.is_primary === 1 && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm sm:text-base break-all">{contact.phone}</p>
                      {contact.relationship && (
                        <p className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(contact)}
                      className="h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
