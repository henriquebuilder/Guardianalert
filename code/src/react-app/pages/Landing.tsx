import { useEffect, useState } from "react";
import { 
  Shield, Phone, MapPin, Volume2, Calculator, Lock, 
  ArrowRight, Star, CheckCircle2, Bell, Users, Zap,
  ShieldCheck, Fingerprint, Eye, ChevronDown, LogIn
} from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { InstallInstructions } from "@/react-app/components/InstallInstructions";

// High-quality images from Unsplash - diverse women in urban/safety contexts
const IMAGES = {
  hero: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1200&q=80", // Professional woman with phone
  testimonial1: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80", // African woman
  testimonial2: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&q=80", // Blonde woman
  testimonial3: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80", // Mixed woman
  urban1: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80", // Woman walking
  urban2: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80", // Woman confident
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { value: "500+", label: "Alertas registrados" },
    { value: "2.5k", label: "Mulheres protegidas" },
    { value: "78", label: "Locais seguros mapeados" },
    { value: "24/7", label: "Proteção ativa" },
  ];

  const testimonials = [
    {
      name: "Mariana S.",
      location: "São Paulo, SP",
      image: IMAGES.testimonial1,
      text: "O modo calculadora me dá segurança de ter o app sem ninguém saber. Já recomendei para todas as minhas amigas.",
      rating: 5,
    },
    {
      name: "Juliana R.",
      location: "Rio de Janeiro, RJ",
      image: IMAGES.testimonial2,
      text: "Trabalho à noite e o GuardianAlert me dá tranquilidade. A localização em tempo real para meus contatos é essencial.",
      rating: 5,
    },
    {
      name: "Carla M.",
      location: "Belo Horizonte, MG",
      image: IMAGES.testimonial3,
      text: "Simples, discreto e funciona. É exatamente o que toda mulher precisa ter no celular.",
      rating: 5,
    },
  ];

  const features = [
    {
      icon: <Bell className="w-6 h-6" />,
      title: "Botão de Pânico",
      description: "Um toque envia sua localização GPS para contatos de emergência via SMS",
      color: "from-rose-500 to-red-600",
    },
    {
      icon: <Volume2 className="w-6 h-6" />,
      title: "Gravação de Áudio",
      description: "Áudio gravado automaticamente serve como evidência legal",
      color: "from-amber-500 to-orange-600",
    },
    {
      icon: <Calculator className="w-6 h-6" />,
      title: "Modo Disfarce",
      description: "Aparece como calculadora. Código secreto 911= desbloqueia",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Locais Seguros",
      description: "Encontre DEAMs, delegacias, abrigos e hospitais próximos",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Rede de Proteção",
      description: "Seus contatos recebem alertas automáticos em emergências",
      color: "from-blue-500 to-indigo-600",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Funciona Offline",
      description: "Recursos principais funcionam sem conexão com internet",
      color: "from-pink-500 to-rose-600",
    },
  ];

  const trustSignals = [
    { icon: <ShieldCheck className="w-5 h-5" />, text: "Dados criptografados" },
    { icon: <Fingerprint className="w-5 h-5" />, text: "Privacidade total" },
    { icon: <Eye className="w-5 h-5" />, text: "Sem rastreamento" },
    { icon: <Lock className="w-5 h-5" />, text: "100% seguro" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Floating Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ 
          backgroundColor: scrollY > 50 ? 'rgba(15, 23, 42, 0.95)' : 'transparent',
          backdropFilter: scrollY > 50 ? 'blur(12px)' : 'none',
        }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">GuardianAlert</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                onClick={() => navigate("/app")}
                className="bg-white text-slate-900 hover:bg-gray-100 font-semibold"
              >
                Abrir App
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Entrar
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-white text-slate-900 hover:bg-gray-100 font-semibold"
                >
                  Começar agora
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={IMAGES.hero}
            alt=""
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
        </div>

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 pt-24 pb-16">
          <div className="max-w-2xl">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-full mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-medium text-gray-200">
                Protegendo mulheres em tempo real
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              Sua segurança{" "}
              <span className="bg-gradient-to-r from-rose-400 via-red-400 to-amber-400 bg-clip-text text-transparent">
                na palma da mão
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 leading-relaxed">
              Um botão de pânico discreto que envia sua localização, grava áudio e alerta seus contatos. 
              <span className="text-white font-semibold"> Disfarçado como calculadora.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              {user ? (
                <Button
                  onClick={() => navigate("/app")}
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-lg px-8 py-7 shadow-2xl shadow-rose-500/25 group"
                >
                  Abrir GuardianAlert
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              ) : (
                <Button
                  onClick={() => navigate("/signup")}
                  size="lg"
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold text-lg px-8 py-7 shadow-2xl shadow-rose-500/25 group"
                >
                  Ativar proteção agora
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
              <InstallInstructions />
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap gap-4">
              {trustSignals.map((signal, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-400 text-sm">
                  <span className="text-emerald-500">{signal.icon}</span>
                  {signal.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-gray-500" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-rose-400 to-amber-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm sm:text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Grid */}
            <div className="relative order-2 lg:order-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img 
                    src={IMAGES.urban1}
                    alt="Mulher caminhando na cidade"
                    className="rounded-2xl w-full h-48 object-cover shadow-2xl"
                  />
                  <div className="bg-gradient-to-br from-rose-500/20 to-amber-500/20 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                    <div className="text-3xl font-bold text-white mb-1">1 em 4</div>
                    <div className="text-gray-400 text-sm">mulheres já sofreu algum tipo de violência</div>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6">
                    <Phone className="w-8 h-8 text-rose-400 mb-3" />
                    <div className="text-white font-semibold mb-1">Ajuda em segundos</div>
                    <div className="text-gray-400 text-sm">Não em minutos</div>
                  </div>
                  <img 
                    src={IMAGES.urban2}
                    alt="Mulher confiante"
                    className="rounded-2xl w-full h-48 object-cover shadow-2xl"
                  />
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-red-600 text-white px-6 py-3 rounded-full font-semibold shadow-2xl shadow-rose-500/30">
                🛡️ Proteção que funciona
              </div>
            </div>

            {/* Text Content */}
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 px-4 py-2 rounded-full mb-6">
                <Shield className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 text-sm font-medium">Por que GuardianAlert?</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Porque esperar ajuda{" "}
                <span className="text-rose-400">não é uma opção</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Milhares de mulheres enfrentam situações de risco todos os dias. No caminho para casa, 
                no trabalho, em relacionamentos. <span className="text-white font-semibold">A tecnologia certa pode salvar vidas.</span>
              </p>

              <div className="space-y-4">
                {[
                  "Alerta instantâneo com um único toque",
                  "Localização GPS enviada automaticamente",
                  "Áudio gravado como evidência legal",
                  "Totalmente discreto e invisível",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-gray-200">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/30 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-violet-400" />
              <span className="text-violet-300 text-sm font-medium">Recursos poderosos</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Tudo que você precisa,{" "}
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                nada que não precisa
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Cada recurso foi pensado para máxima proteção com mínimo esforço
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="group relative bg-slate-900/50 border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Mockup Section */}
      <section className="py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2 rounded-full mb-6">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 text-sm font-medium">Modo Disfarce</span>
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 leading-tight">
                Para todos, é uma{" "}
                <span className="text-amber-400">calculadora</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                O GuardianAlert se disfarça como uma calculadora comum. Ninguém precisa saber 
                que você tem um app de segurança. <span className="text-white font-semibold">Digite 911= para desbloquear.</span>
              </p>

              <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Eye className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white mb-1">Invisível para agressores</h4>
                    <p className="text-gray-400 text-sm">
                      Mesmo que alguém veja seu celular, só vai encontrar uma calculadora funcionando normalmente.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate("/app")}
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-lg px-8 py-6"
              >
                Ver como funciona
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="relative">
                {/* Phone Frame */}
                <div className="w-72 h-[580px] bg-slate-800 rounded-[3rem] p-3 shadow-2xl shadow-black/50 border border-slate-700">
                  {/* Screen */}
                  <div className="w-full h-full bg-slate-900 rounded-[2.5rem] overflow-hidden relative">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-slate-800 rounded-b-2xl z-10" />
                    
                    {/* Calculator UI */}
                    <div className="p-6 pt-10 h-full flex flex-col">
                      <div className="text-right text-4xl font-light text-white mb-8 h-16">
                        0
                      </div>
                      <div className="grid grid-cols-4 gap-2 flex-1">
                        {['C', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '-', '1', '2', '3', '+', '0', '0', '.', '='].map((btn, i) => (
                          <div 
                            key={i}
                            className={`
                              flex items-center justify-center rounded-xl text-xl font-medium
                              ${['÷', '×', '-', '+', '='].includes(btn) ? 'bg-amber-500 text-white' : ''}
                              ${['C', '±', '%'].includes(btn) ? 'bg-slate-600 text-white' : ''}
                              ${!['÷', '×', '-', '+', '=', 'C', '±', '%'].includes(btn) ? 'bg-slate-700 text-white' : ''}
                              ${i === 16 ? 'col-span-2' : ''}
                            `}
                          >
                            {btn}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Labels */}
                <div className="absolute -right-4 top-24 bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-pulse">
                  Digite 911=
                </div>
                <div className="absolute -left-4 bottom-32 bg-slate-800 border border-white/20 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
                  🔒 Modo secreto ativo
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-full mb-6">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">Depoimentos reais</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Mulheres que já{" "}
              <span className="text-emerald-400">confiam</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Veja o que usuárias estão dizendo sobre o GuardianAlert
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-slate-800/50 border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <img 
                    src={t.image}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                  />
                  <div>
                    <div className="font-semibold text-white">{t.name}</div>
                    <div className="text-gray-500 text-sm">{t.location}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-xl text-gray-400">
              Três passos para sua segurança
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Instale o app", desc: "Adicione o GuardianAlert na tela inicial do seu celular. Gratuito e sem cadastro." },
              { step: "02", title: "Configure contatos", desc: "Adicione pessoas de confiança que serão alertadas em emergências." },
              { step: "03", title: "Está protegida", desc: "Em qualquer situação de risco, um toque envia alerta com sua localização." },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-8xl font-bold text-slate-800/50 absolute -top-4 -left-2">{item.step}</div>
                <div className="relative pt-12">
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-slate-700">
                    <ArrowRight className="w-8 h-8" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600 via-red-600 to-amber-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRoLTJWMGgydjM0em0tNCAwSDI4VjBoNHYzNHptLTYgMGgtMlYwaDJ2MzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
        
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-8">
            <Shield className="w-5 h-5" />
            <span className="font-medium">100% gratuito, sem cadastro</span>
          </div>
          
          <h2 className="text-4xl sm:text-6xl font-bold mb-6">
            Comece a se proteger agora
          </h2>
          
          <p className="text-xl sm:text-2xl opacity-90 mb-10 max-w-2xl mx-auto">
            Cada segundo conta em uma emergência. Não espere acontecer algo para se preparar.
          </p>
          
          <Button
            onClick={() => navigate("/app")}
            size="lg"
            className="bg-white text-rose-600 hover:bg-gray-100 font-bold text-xl px-12 py-8 shadow-2xl group"
          >
            Ativar GuardianAlert
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm opacity-80">
            <span>✓ 7 dias grátis</span>
            <span>✓ R$ 14,99/ano depois</span>
            <span>✓ Funciona offline</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl">GuardianAlert</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400 mb-2">
                Em emergências, ligue <span className="text-white font-semibold">190</span> (Polícia) 
                ou <span className="text-white font-semibold">180</span> (Central da Mulher)
              </p>
              <button
                onClick={() => window.location.hash = "#/admin/login"}
                className="text-xs text-gray-600 hover:text-gray-400 underline"
              >
                Acesso Administrativo
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
