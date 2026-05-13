import { useState } from 'react';
import { Card } from '@/react-app/components/ui/card';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import { Switch } from '@/react-app/components/ui/switch';

interface Contact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
  is_primary: number;
}

interface ContactFormProps {
  contact: Contact | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ContactForm({ contact, onSuccess, onCancel }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: contact?.name || '',
    phone: contact?.phone || '',
    relationship: contact?.relationship || '',
    is_primary: contact?.is_primary === 1,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = contact ? `/api/contacts/${contact.id}` : '/api/contacts';
      const method = contact ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      // Verificar se a resposta é JSON
      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[ContactForm] Resposta não é JSON:', text.substring(0, 200));
        throw new Error('Servidor retornou HTML ao invés de JSON. A API pode não estar ativa.');
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro do servidor: ${response.status}`);
      }

      if (!result.success && !result.id) {
        throw new Error('Resposta inesperada do servidor');
      }

      onSuccess();
    } catch (error) {
      console.error('[ContactForm] Erro:', error);
      alert(error instanceof Error ? error.message : 'Erro ao salvar contato');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">
        {contact ? 'Editar Contato' : 'Novo Contato'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Nome *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Maria Silva"
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Ex: (11) 98765-4321"
            required
          />
        </div>

        <div>
          <Label htmlFor="relationship">Relacionamento</Label>
          <Input
            id="relationship"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            placeholder="Ex: Amiga, Familiar, Vizinho"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div>
            <Label htmlFor="is_primary" className="font-semibold">
              Contato Principal
            </Label>
            <p className="text-sm text-gray-600">
              Este contato será notificado primeiro em emergências
            </p>
          </div>
          <Switch
            id="is_primary"
            checked={formData.is_primary}
            onCheckedChange={(checked) => setFormData({ ...formData, is_primary: checked })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600">
            {loading ? 'Salvando...' : contact ? 'Salvar Alterações' : 'Adicionar Contato'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
