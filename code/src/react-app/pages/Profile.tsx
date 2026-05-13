import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Card } from '@/react-app/components/ui/card';
import { Input } from '@/react-app/components/ui/input';
import { Label } from '@/react-app/components/ui/label';
import { Textarea } from '@/react-app/components/ui/textarea';

interface Profile {
  id: number;
  name: string | null;
  age: number | null;
  notes: string | null;
}

export default function Profile() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();
      setName(data.name || '');
      setAge(data.age ? String(data.age) : '');
      setNotes(data.notes || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          age: age ? parseInt(age) : null,
          notes: notes.trim() || null,
        }),
      });
      
      alert('Perfil salvo com sucesso!');
      fetchProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/app')}
            className="text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-3">
            <User className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">Meu Perfil</h1>
          </div>
        </div>

        <Card className="p-6 bg-white/10 backdrop-blur-lg border-white/20">
          <div className="space-y-6">
            <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-100">
                Essas informações serão incluídas nos alertas de emergência enviados aos seus contatos.
                Todas as informações são opcionais e ficam armazenadas apenas no seu dispositivo.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Nome Completo
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome completo"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-white">
                Idade
              </Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Sua idade"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">
                Informações Importantes
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Condições médicas, alergias, histórico relevante, etc."
                rows={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
              />
              <p className="text-xs text-white/60">
                Estas informações ajudarão seus contatos a entender melhor a situação em caso de emergência.
              </p>
            </div>

            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
